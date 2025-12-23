// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 5000;

// Allow frontend origin
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
}));
app.use(express.json());

// DB connect
connectDB();

// Routes
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => res.json({ ok: true, message: "Server running" }));

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
