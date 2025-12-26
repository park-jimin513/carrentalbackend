const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "owner"], default: "user" },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    phone: { type: String },

    companyName: String,
    businessLicenseId: String,

    otpHash: String,
    otpExpiresAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
