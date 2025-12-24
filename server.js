// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 5000;

// CORS
const allowed = [
  process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  "http://localhost:5174",
];
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // allow non-browser requests
      return cb(null, allowed.includes(origin));
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
  res.json({ ok: true, message: "Local server running 🚀" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running locally on port ${PORT}`);
});
