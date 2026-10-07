# Access Token & Refresh Token Authentication (Node.js + React)

This project shows, in a simple way, how **access tokens** and **refresh tokens** work together to keep a user logged in securely.

- **Server:** Node.js, Express, MongoDB (Mongoose), `jsonwebtoken`, `bcryptjs`
- **Client:** React, Vite, React Router, Axios

---

## What are access tokens and refresh tokens?

When a user logs in or registers, the server gives them two tokens:

| | Access Token | Refresh Token |
| --- | --- | --- |
| **Purpose** | Proves who you are on every request | Used only to get a new access token |
| **Lifetime** | Short (20 minutes) | Long (7 days) |
| **Stored in** | Memory on the client (React state) | HTTP-only cookie + saved in the database |
| **Sent as** | `Authorization: Bearer <token>` header | Cookie, sent automatically by the browser |

**Why two tokens?**

- The access token is sent with every request, so it's the one most likely to be stolen. Keeping it short-lived means a stolen token stops working quickly.
- Logging in again every 20 minutes would be annoying, so the refresh token quietly gets you a new access token in the background.
- The refresh token is in an **HTTP-only cookie**, so JavaScript on the page can't read it. That protects it from XSS attacks.

### The flow in plain words

```
1. User registers
      → Server creates the user
      → Server sends back an ACCESS token (in the response body)
      → Server sets a REFRESH token (in an HTTP-only cookie)

2. User asks for their profile (/me)
      → Client sends the access token in the Authorization header
      → Server checks it and returns the user's data

3. 20 minutes later, the access token expires
      → /me returns 401 Unauthorized
      → Client automatically calls /refresh (the cookie goes with it)
      → Server checks the refresh token, then sends a NEW access token
        and sets a NEW refresh token cookie (token rotation)
      → Client retries /me with the new access token. The user never notices.
```

---

## Project structure

```
.
├── server/
│   ├── .env                      # Your secret keys (you create this)
│   ├── index.js                  # Entry point: connects DB, starts server
│   └── src/
│       ├── app/app.js            # Express setup: CORS, JSON, cookies, routes
│       ├── config/config.js      # Reads values from .env
│       ├── config/db.js          # Connects to MongoDB
│       ├── models/user.models.js # User schema
│       ├── routes/auth.routes.js # /register, /me, /refresh
│       └── utils/auth.js         # Create and verify JWT tokens
└── Client/
    └── access-refresh/
        └── src/
            ├── app/App.jsx                         # Wraps app in AuthProvider
            ├── app/app.routes.jsx                  # /register and /profile pages
            └── modules/
                ├── auth/context/useAuthContext.jsx # Stores user + access token
                ├── auth/pages/register.jsx         # Register form
                ├── auth/pages/profile.jsx          # Shows logged-in user
                └── shared/useApi.js                # Axios with auto-refresh
```

---

## How the files are connected

### Server

```
index.js
  ├── config/db.js ──────────► config/config.js ──► .env
  └── app/app.js
        └── routes/auth.routes.js
              ├── models/user.models.js
              └── utils/auth.js ─► config/config.js ──► .env
```

**`.env`**: Holds your secrets: the MongoDB URL and the two JWT secret keys.

**`config/config.js`**: Loads `.env` using `dotenv` and exports the values, so other files never touch `process.env` directly.

**`config/db.js`**: Uses `MONGO_URI` from the config to connect to MongoDB.

**`index.js`**: The starting point. It connects to the database first, then starts the Express app on **port 8000**.

**`app/app.js`**: Creates the Express app and adds:
- `cors`, so the React app on `localhost:5173` can talk to the server and send cookies (`credentials: true`)
- `express.json()`, to read JSON request bodies
- `cookieParser()`, to read the refresh token from cookies (`req.cookies`)
- the auth routes under `/api/auth`

**`models/user.models.js`**: Describes a user in MongoDB:
- `name`, `email`, `passwordHash` (the password is never stored as plain text)
- `refreshToken`, the user's current valid refresh token

**`utils/auth.js`**: All the token logic in one place:
- `generateTokens({ userId })` creates an access token (20m) and a refresh token (7d), each signed with its own secret
- `verifyAccessToken(token)` checks the access token
- `verifyRefreshToken(token)` checks the refresh token

**`routes/auth.routes.js`**: The three API endpoints (explained below).

### Client

```
main.jsx
  └── App.jsx
        ├── AuthProvider (useAuthContext.jsx)   ← stores user + accessToken
        └── app.routes.jsx
              ├── register.jsx ─┐
              └── profile.jsx  ─┴─► useApi.js   ← adds token, auto-refreshes
```

**`useAuthContext.jsx`**: A React Context that keeps the `user` and the `accessToken` in memory, so any page can read or update them.

**`register.jsx`**: The sign-up form. It calls `/auth/register`, saves the returned access token in the context, and goes to `/profile`.

**`profile.jsx`**: Calls `/auth/me` and shows the user's name and email.

**`useApi.js`**: This is where the magic happens. It creates an Axios instance with two interceptors:
1. **Request interceptor**: adds `Authorization: Bearer <accessToken>` to every request.
2. **Response interceptor**: if a request fails with **401**, it calls `/api/auth/refresh`, saves the new access token, and retries the original request.

**`vite.config.js`**: Proxies `/api` calls from the React dev server to `http://localhost:8000`.

---

## The routes explained

### 1. `POST /api/auth/register`

1. Checks if a user with this email already exists. If so, it returns `400`.
2. Hashes the password with bcrypt and saves the user.
3. Generates an access token and a refresh token.
4. Saves the refresh token in the user's database record.
5. Sets the refresh token as an **HTTP-only cookie**.
6. Returns the user's details and the **access token**.

### 2. `GET /api/auth/me` (protected route)

1. Reads the access token from the `Authorization: Bearer <token>` header.
2. If there is no token, it returns `401`.
3. Verifies the token with `ACCESS_TOKEN_SECRET`. If it's invalid or expired, it returns `401`.
4. Finds the user by the ID inside the token and returns their name and email.

### 3. `POST /api/auth/refresh`

1. Reads the refresh token from the `refreshToken` cookie.
2. Verifies it with `REFRESH_TOKEN_SECRET`.
3. Compares it with the refresh token saved in the database.
   - **If they don't match**, someone may be reusing an old or stolen token. The server clears the saved token and returns `401`.
4. Creates a **new access token and a new refresh token** (this is called *token rotation*).
5. Saves the new refresh token in the database and in the cookie.
6. Returns the new access token.

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) installed
- A MongoDB database (local, or free on [MongoDB Atlas](https://www.mongodb.com/atlas))
- [Postman](https://www.postman.com/downloads/) for testing the API

### Step 1: Install server dependencies

```bash
cd server
npm install
```

### Step 2: Create the `.env` file

Inside the `server` folder, create a new file named **`.env`** and add these variables:

```env
MONGO_URI=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
```

**How to get the values:**

- **`MONGO_URI`**: Your MongoDB connection string, for example `mongodb://localhost:27017/access-refresh` or your Atlas URL.
- **`ACCESS_TOKEN_SECRET`** and **`REFRESH_TOKEN_SECRET`**: Go to **[https://jwtsecrets.com/](https://jwtsecrets.com/)**, generate a secret, and paste it in. Generate **two different secrets**, one for each key.

> ⚠️ Never share or commit your `.env` file. Add `.env` to your `.gitignore`.

### Step 3: Start the server

```bash
npm run dev
```

You should see:

```
MONGODB - connected
Server running on port 8000
```

### Step 4 (optional): Run the React client

```bash
cd Client
npm install
cd access-refresh
npm install
npm run dev
```

Open `http://localhost:5173/register`, create an account, and you'll be taken to the profile page.

---

## Testing the API in Postman

Postman saves cookies automatically, just like a browser. So when `/register` sets the refresh token cookie, Postman sends it with `/refresh` without any extra work.

### 1. Register a user

- **Method:** `POST`
- **URL:** `http://localhost:8000/api/auth/register`
- **Body** → `raw` → `JSON`:

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "123456"
}
```

**Expected response (`201 Created`):**

```json
{
  "message": "User registered successfully",
  "data": {
    "id": "6650f1...",
    "name": "Test User",
    "email": "test@example.com"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

✅ **Copy the `accessToken`.** You'll need it for `/me`.

✅ Click the **Cookies** tab in the response. You'll see a `refreshToken` cookie that the server set.

If you register the same email again, you'll get `400`: `"User already exists"`.

### 2. Get the logged-in user (`/me`)

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/auth/me`
- **Authorization** tab → Type: **Bearer Token** → paste the access token

(This is the same as adding a header `Authorization: Bearer <your_access_token>`.)

**Expected response (`200 OK`):**

```json
{
  "message": "User fetched successfully",
  "data": {
    "user": {
      "name": "Test User",
      "email": "test@example.com"
    }
  }
}
```

**Try these to see the protection working:**

| What you do | Result |
| --- | --- |
| Remove the token | `401`: `"Access token is required"` |
| Change a few characters in the token | `401`: `"Invalid or expired access token"` |
| Wait 20 minutes and try again | `401`: `"Invalid or expired access token"` (`jwt expired`) |

### 3. Get a new access token (`/refresh`)

- **Method:** `POST`
- **URL:** `http://localhost:8000/api/auth/refresh`
- **Body:** none
- **Authorization:** none. The refresh token cookie is sent automatically.

**Expected response (`200 OK`):**

```json
{
  "message": "token refreshed successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

✅ Use this **new** access token to call `/me` again. It works.

✅ Check the **Cookies** tab. The `refreshToken` value has changed, because the token was rotated.

**Try these to see the protection working:**

| What you do | Result |
| --- | --- |
| Delete the `refreshToken` cookie (click **Cookies** under the Send button → `localhost` → delete it), then call `/refresh` | `401`: `"Unauthorized,refresh token not found"` |
| Copy an **old** refresh token, put it back in the cookie, then call `/refresh` | `401`: `"Unauthorized,refresh token mismatch"` (reuse detected) |

---

## Summary

- The **access token** is short-lived and sent with every request to prove who you are.
- The **refresh token** is long-lived, kept safe in an HTTP-only cookie, and used only to get new access tokens.
- When the access token expires, the client calls `/refresh` and the user stays logged in without noticing.
- **Token rotation** gives you a new refresh token every time, and the server can detect when an old one is reused.
