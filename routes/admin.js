const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");

const adminMiddleware = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user.isAdmin)
    return res.status(403).json({ msg: "Admin access required" });
  next();
};

router.put("/verify-agent/:userId", auth, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    user.isAgent = true;
    await user.save();
    res.json({ msg: "Agent verified", user });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
