// api/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("../config/db");
const authRoutes = require("../routes/auth");
const carsRoutes = require("../routes/cars");

const app = express();

/* =========================
   CORS CONFIG (RENDER SAFE)
========================= */
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://cargo-sigma-one.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Postman / Render health
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error("CORS not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Preflight (REQUIRED for Render)
app.options("*", cors());

/* =========================
   MIDDLEWARE
========================= */
app.use(express.json());

// Static uploads (Render-safe path)
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

/* =========================
   DATABASE
========================= */
connectDB();

/* =========================
   ROUTES
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/cars", carsRoutes);

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.json({ ok: true, message: "Backend running on Render 🚀" });
});

/* =========================
   START SERVER (RENDER)
========================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Render server running on port ${PORT}`);
});
