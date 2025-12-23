// api/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("../config/db");
const authRoutes = require("../routes/auth");

const app = express();

// CORS
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());

// Connect DB
connectDB();

// Routes
app.use("/api/auth", authRoutes);

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    ok: true,
    message: "Backend running 🚀",
  });
});

// Listen on Render port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log("✅ MongoDB connected (cached)");
});
