// routes/auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const generateOtp = require("../utils/generateOtp");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

const router = express.Router();
const SALT_ROUNDS = 10;

const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES || 10);

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendOtpEmail(toEmail, otp) {
  const mail = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: "Your OTP for password reset",
    text: `Your OTP for password reset is: ${otp}. It is valid for ${OTP_TTL_MINUTES} minutes.`,
    html: `<p>Your OTP for password reset is: <b>${otp}</b></p><p>It is valid for ${OTP_TTL_MINUTES} minutes.</p>`
  };

  return transporter.sendMail(mail);
}

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { role="user", fullName, email, password, phone, companyName, businessLicenseId } = req.body;

    if (!email || !password || !phone || !fullName) {
      return res.status(400).json({ ok: false, message: "fullName, email, phone and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ ok: false, message: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = new User({
      role,
      fullName,
      email: email.toLowerCase(),
      passwordHash,
      phone,
      companyName,
      businessLicenseId
    });

    await user.save();
    return res.json({ ok: true, message: "Registered successfully", userId: user._id });
  } catch (err) {
    console.error("register error", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ ok: false, message: "email and password required" });

    // normalize email
    const normalizedEmail = String(email).trim().toLowerCase();
    if (process.env.NODE_ENV !== 'production') console.log(`[auth] login attempt for: ${normalizedEmail}`);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      if (process.env.NODE_ENV !== 'production') console.log(`[auth] user not found for: ${normalizedEmail}`);
      return res.status(401).json({ ok: false, message: "Invalid credentials" });
    }

    // ensure passwordHash exists
    if (!user.passwordHash) {
      if (process.env.NODE_ENV !== 'production') console.log(`[auth] user found but no passwordHash for: ${normalizedEmail}`);
      return res.status(401).json({ ok: false, message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (process.env.NODE_ENV !== 'production') console.log(`[auth] bcrypt.compare result for ${normalizedEmail}: ${match}`);
    if (!match) return res.status(401).json({ ok: false, message: "Invalid credentials" });

    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
      fullName: user.fullName
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });

    return res.json({ ok: true, message: "Logged in", token, user: payload });
  } catch (err) {
    console.error("login error", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// FORGOT PASSWORD
router.post("/forgot", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ ok: false, message: "email required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ ok: false, message: "No account with that email" });

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);
    const otpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    user.otpHash = otpHash;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    await sendOtpEmail(user.email, otp);

    return res.json({ ok: true, message: "OTP sent to your email" });
  } catch (err) {
    console.error("forgot error", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// RESET PASSWORD
router.post("/reset", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ ok: false, message: "email, otp and newPassword required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.otpHash || !user.otpExpiresAt) return res.status(400).json({ ok: false, message: "No valid OTP found. Please request a new OTP." });

    if (new Date() > new Date(user.otpExpiresAt)) {
      return res.status(400).json({ ok: false, message: "OTP expired. Request again." });
    }

    const otpMatch = await bcrypt.compare(otp, user.otpHash);
    if (!otpMatch) return res.status(400).json({ ok: false, message: "Invalid OTP" });

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.passwordHash = passwordHash;
    user.otpHash = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    return res.json({ ok: true, message: "Password reset successful" });
  } catch (err) {
    console.error("reset error", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

module.exports = router;
