// api/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("../config/db");
const authRoutes = require("../routes/auth");

const app = express();

// ✅ ALLOWED FRONTENDS (LOCAL + PROD)
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://cargo-sigma-one.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Postman / curl

      if (ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Preflight support (VERY IMPORTANT)
app.options("*", cors());

app.use(express.json());

// DB
connectDB();

// Routes
app.use("/api/auth", authRoutes);

// Health
app.get("/", (req, res) => {
  res.json({ ok: true, message: "Backend running 🚀" });
});

// Render port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
