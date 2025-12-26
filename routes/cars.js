const express = require("express");
const multer = require("multer");
const path = require("path");
const Car = require("../models/Car");

const router = express.Router();

// Simple request logger for debugging
router.use((req, res, next) => {
  console.log(`[cars] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// Multer storage (uploads/ folder at backend root)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// POST /api/cars - create a new car (multipart/form-data)
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, brand, price, color, ownerId } = req.body;

    if (!name) return res.status(400).json({ ok: false, message: "name is required" });

    let imageUrl;
    if (req.file) {
      const host = req.get("host");
      const proto = req.protocol;
      imageUrl = `${proto}://${host}/uploads/${req.file.filename}`;
    }

    const car = new Car({ name, brand, price: price ? Number(price) : undefined, color, imageUrl, ownerId });
    await car.save();

    return res.json({ ok: true, car });
  } catch (err) {
    console.error("create car error", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// GET /api/cars - list cars
router.get("/", async (req, res) => {
  try {
    const cars = await Car.find({}).sort({ createdAt: -1 }).lean();
    return res.json({ ok: true, cars });
  } catch (err) {
    console.error("list cars error", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// PUT /api/cars/:id - update car
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    const allowed = ["name", "brand", "price", "color", "imageUrl"];
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    const car = await Car.findByIdAndUpdate(id, updates, { new: true }).lean();
    if (!car) return res.status(404).json({ ok: false, message: "Car not found" });
    return res.json({ ok: true, car });
  } catch (err) {
    console.error("update car error", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// DELETE /api/cars/:id - remove car
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const car = await Car.findByIdAndDelete(id).lean();
    if (!car) return res.status(404).json({ ok: false, message: "Car not found" });
    return res.json({ ok: true, message: "Deleted" });
  } catch (err) {
    console.error("delete car error", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

module.exports = router;
