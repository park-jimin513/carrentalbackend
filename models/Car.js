const mongoose = require("mongoose");

const carSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  name: { type: String, required: true },
  brand: { type: String },
  price: { type: Number },
  color: { type: String },
  imageUrl: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Car", carSchema);
