// api/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("../config/db");
const authRoutes = require("../routes/auth");

const app = express();

// ✅ ALLOWED FRONTENDS
const ALLOWED_ORIGINS = [
  "http://localhost:5174",              // local dev
  "https://cargo-sigma-one.vercel.app", // Vercel frontend
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (Postman, curl)
      if (!origin) return callback(null, true);

      if (ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS policy: Origin ${origin} not allowed`)
      );
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ VERY IMPORTANT for preflight requests
app.options("*", cors());

app.use(express.json());

// DB
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

// Render port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
