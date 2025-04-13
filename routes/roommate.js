const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const RoommatePreference = require("../models/RoommatePreference");
const User = require("../models/User");

router.post("/preferences", auth, async (req, res) => {
  const { location, budget, genderPreference, smoking, pets, lifestyle } =
    req.body;
  try {
    let preference = await RoommatePreference.findOne({ user: req.user.id });
    if (preference) {
      preference = await RoommatePreference.findOneAndUpdate(
        { user: req.user.id },
        {
          $set: {
            location,
            budget,
            genderPreference,
            smoking,
            pets,
            lifestyle,
          },
        },
        { new: true }
      );
    } else {
      preference = new RoommatePreference({
        user: req.user.id,
        location,
        budget,
        genderPreference,
        smoking,
        pets,
        lifestyle,
      });
    }
    await preference.save();
    res.json(preference);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/matches", auth, async (req, res) => {
  try {
    const userPreference = await RoommatePreference.findOne({
      user: req.user.id,
    });
    if (!userPreference)
      return res.status(400).json({ msg: "No preferences set" });

    const matches = await RoommatePreference.find({
      user: { $ne: req.user.id },
      location: userPreference.location,
      budget: {
        $gte: userPreference.budget * 0.8,
        $lte: userPreference.budget * 1.2,
      },
      genderPreference: { $in: [userPreference.genderPreference, "any"] },
      smoking: userPreference.smoking,
      pets: userPreference.pets,
      lifestyle: userPreference.lifestyle,
    }).populate("user", "name email");

    res.json(matches);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
