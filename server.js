// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 5000;

// CORS
const FRONTEND_ORIGIN_LOCAL = "http://localhost:5174"; // local frontend
const FRONTEND_ORIGIN_PROD = process.env.FRONTEND_ORIGIN || "https://your-production-frontend.com"; // deployed frontend
const ALLOWED_ORIGINS = [FRONTEND_ORIGIN_LOCAL, FRONTEND_ORIGIN_PROD];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests from allowed origins or non-browser clients (origin undefined)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS policy: Origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json());

// DB connect
connectDB();

// Routes
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({ ok: true, message: "Server running 🚀" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
