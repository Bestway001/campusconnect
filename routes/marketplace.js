const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Listing = require("../models/Listing");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

router.post("/", auth, upload.array("photos", 5), async (req, res) => {
  const { title, description, price, category, university } = req.body;
  try {
    const listing = new Listing({
      title,
      description,
      price,
      category,
      university,
      postedBy: req.user.id,
      photos: req.files.map((file) => file.path),
    });
    await listing.save();
    res.json(listing);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const listings = await Listing.find().populate("postedBy", "name");
    res.json(listings);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
