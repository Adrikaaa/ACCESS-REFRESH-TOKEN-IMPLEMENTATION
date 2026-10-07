import React, { useState } from "react";
import useApi from "../../shared/useApi.js";
import { useAuthContext } from "../context/useAuthContext.jsx";
import { useNavigate } from "react-router";
import Profile from "./profile.jsx";

export const Register = () => {
  const api = useApi();
  const authContext = useAuthContext();

  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const response = await api.post("/auth/register", {
      name,
      email,
      password,
    });

    console.log(response.data);

    authContext.setAccessToken(response.data.accessToken);
    authContext.setUser(response.data.data);

    navigate("/profile");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#0f1115",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#181b21",
          padding: "40px",
          borderRadius: "16px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)",
          border: "1px solid #2a2e36",
          boxSizing: "border-box",
        }}
      >
        <h2
          style={{
            color: "#ffffff",
            textAlign: "center",
            marginBottom: "30px",
            fontSize: "28px",
          }}
        >
          Create Account
        </h2>

        <div style={{ marginBottom: "18px" }}>
          <label
            style={{
              display: "block",
              color: "#b8bec9",
              fontSize: "14px",
              marginBottom: "8px",
            }}
          >
            Name
          </label>

          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: "100%",
              padding: "13px 14px",
              boxSizing: "border-box",
              borderRadius: "9px",
              border: "1px solid #343943",
              background: "#101218",
              color: "#ffffff",
              fontSize: "15px",
              outline: "none",
            }}
          />
        </div>

        <div style={{ marginBottom: "18px" }}>
          <label
            style={{
              display: "block",
              color: "#b8bec9",
              fontSize: "14px",
              marginBottom: "8px",
            }}
          >
            Email
          </label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "13px 14px",
              boxSizing: "border-box",
              borderRadius: "9px",
              border: "1px solid #343943",
              background: "#101218",
              color: "#ffffff",
              fontSize: "15px",
              outline: "none",
            }}
          />
        </div>

        <div style={{ marginBottom: "25px" }}>
          <label
            style={{
              display: "block",
              color: "#b8bec9",
              fontSize: "14px",
              marginBottom: "8px",
            }}
          >
            Password
          </label>

          <input
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "13px 14px",
              boxSizing: "border-box",
              borderRadius: "9px",
              border: "1px solid #343943",
              background: "#101218",
              color: "#ffffff",
              fontSize: "15px",
              outline: "none",
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "14px",
            border: "none",
            borderRadius: "9px",
            background: "#ffffff",
            color: "#111318",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Register
        </button>
      </form>
    </main>
  );
};
