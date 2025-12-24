// api/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("../config/db");
const authRoutes = require("../routes/auth");

const app = express();

// CORS
const FRONTEND_ORIGIN_LOCAL = "http://localhost:5174"; // your local React frontend
const FRONTEND_ORIGIN_PROD = process.env.FRONTEND_ORIGIN || "https://your-production-frontend.com"; // optional future frontend
const ALLOWED_ORIGINS = [FRONTEND_ORIGIN_LOCAL, FRONTEND_ORIGIN_PROD];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow Postman / curl
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS policy: Origin ${origin} not allowed`));
    },
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
