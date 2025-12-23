// api/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("../config/db");
const authRoutes = require("../routes/auth");

const app = express();

// Allow frontend origin
const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());

// Connect DB (serverless safe)
connectDB();

// Routes
app.use("/api/auth", authRoutes);

// Health check
app.get("/", (req, res) =>
  res.json({ ok: true, message: "Backend running on Vercel 🚀" })
);

// ❌ DO NOT use app.listen()
module.exports = app;
