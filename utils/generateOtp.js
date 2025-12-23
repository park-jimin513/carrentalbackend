// utils/generateOtp.js
module.exports = function generateOtp() {
  // 6-digit numeric OTP as string
  return String(Math.floor(100000 + Math.random() * 900000));
};
