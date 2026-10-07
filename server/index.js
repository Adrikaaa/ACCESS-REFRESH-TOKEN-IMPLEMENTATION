import app from "./src/app/app.js";
import connectDB from "./src/config/db.js";

await connectDB();

app.listen(8000, () => {
  console.log("Server running on port 8000");
});
