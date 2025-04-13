const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

router.post("/deposit", auth, async (req, res) => {
  const { amount } = req.body;
  try {
    const user = await User.findById(req.user.id);
    user.walletBalance += amount;
    await user.save();

    const transaction = new Transaction({
      user: req.user.id,
      type: "deposit",
      amount,
      description: "Wallet deposit",
    });
    await transaction.save();

    res.json({ balance: user.walletBalance });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/balance", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ balance: user.walletBalance });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
