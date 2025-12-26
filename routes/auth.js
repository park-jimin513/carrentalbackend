const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const User = require("../models/User");
const generateOtp = require("../utils/generateOtp");

const router = express.Router();

const SALT_ROUNDS = 10;
const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES || 10);

/* =========================
   MAIL TRANSPORTER (RENDER SAFE)
========================= */
let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Gmail App Password
    },
  });
}

// Log whether EMAIL_USER is present (helps debug env issues)
console.log("EMAIL_USER set:", !!process.env.EMAIL_USER);

// Verify transporter at startup if available and log detailed status
if (transporter) {
  transporter
    .verify()
    .then(() => console.log("✅ Mail transporter is ready"))
    .catch((err) => console.error("Mail transporter verify failed:", err && err.stack));
}

/* =========================
   SEND OTP EMAIL (NO CRASH)
========================= */
async function sendOtpEmail(toEmail, otp) {
  if (!transporter) {
    throw new Error("Email transporter not configured");
  }

  const info = await transporter.sendMail({
    from: `"Car Rental" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Password Reset OTP",
    html: `
      <h2>Password Reset</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>Valid for ${OTP_TTL_MINUTES} minutes.</p>
    `,
  });

  // Log sendMail result for debugging delivery/acceptance
  try {
    console.log("sendMail result:", {
      messageId: info && info.messageId,
      accepted: info && info.accepted,
      rejected: info && info.rejected,
      response: info && info.response,
    });
  } catch (e) {
    console.error("Failed to log sendMail info:", e && e.stack);
  }

  return info;
}

/* =========================
   REGISTER
========================= */
router.post("/register", async (req, res) => {
  try {
    const {
      role = "user",
      fullName,
      email,
      password,
      phone,
      companyName,
      businessLicenseId,
    } = req.body;

    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({
        ok: false,
        message: "fullName, email, password, phone required",
      });
    }

    const normalizedEmail = email.toLowerCase();

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res
        .status(400)
        .json({ ok: false, message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await User.create({
      role,
      fullName,
      email: normalizedEmail,
      passwordHash,
      phone,
      companyName,
      businessLicenseId,
    });

    res.json({ ok: true, message: "Registered successfully" });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
});

/* =========================
   LOGIN
========================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ ok: false, message: "Email & password required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ ok: false, message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ ok: false, message: "Invalid credentials" });
    }

    const payload = {
      id: user._id,
      role: user.role,
      email: user.email,
      fullName: user.fullName,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ ok: true, token, user: payload });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
});

/* =========================
   FORGOT PASSWORD (NO 500)
========================= */
router.post("/forgot", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ ok: false, message: "Email required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res
        .status(404)
        .json({ ok: false, message: "Account not found" });
    }

    const otp = generateOtp();
    user.otpHash = await bcrypt.hash(otp, SALT_ROUNDS);
    user.otpExpiresAt = new Date(
      Date.now() + OTP_TTL_MINUTES * 60 * 1000
    );

    await user.save();

    try {
      await sendOtpEmail(user.email, otp);
      return res.json({ ok: true, message: "OTP sent to email" });
    } catch (emailErr) {
      console.error("EMAIL ERROR:", emailErr.message);
      // ✅ NEVER RETURN 500
      return res.json({
        ok: true,
        message: "OTP generated (email service unavailable)",
      });
    }
  } catch (err) {
    console.error("FORGOT ERROR:", err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
});

/* =========================
   RESET PASSWORD
========================= */
router.post("/reset", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res
        .status(400)
        .json({ ok: false, message: "All fields required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.otpHash || !user.otpExpiresAt) {
      return res
        .status(400)
        .json({ ok: false, message: "Invalid or expired OTP" });
    }

    if (new Date() > new Date(user.otpExpiresAt)) {
      return res
        .status(400)
        .json({ ok: false, message: "OTP expired" });
    }

    const validOtp = await bcrypt.compare(otp, user.otpHash);
    if (!validOtp) {
      return res.status(400).json({ ok: false, message: "Invalid OTP" });
    }

    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.otpHash = undefined;
    user.otpExpiresAt = undefined;

    await user.save();

    res.json({ ok: true, message: "Password reset successful" });
  } catch (err) {
    console.error("RESET ERROR:", err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
});

module.exports = router;
