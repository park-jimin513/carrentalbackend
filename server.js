// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ SAME ORIGINS AS index.js
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://cargo-sigma-one.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS not allowed"));
    },
    credentials: true,
  })
);

app.options("*", cors());

app.use(express.json());

// DB
connectDB();

// Routes
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({ ok: true, message: "Local server running 🚀" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running locally on port ${PORT}`);
});
