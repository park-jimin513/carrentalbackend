// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "owner"], default: "user" },
  fullName: { type: String },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  passwordHash: { type: String, required: true },
  phone: { type: String },

  // Owner-specific (optional)
  companyName: { type: String },
  businessLicenseId: { type: String },

  // For forgot/reset flow
  otpHash: { type: String },
  otpExpiresAt: { type: Date },
}, {
  timestamps: true
});

module.exports = mongoose.model("User", userSchema);
