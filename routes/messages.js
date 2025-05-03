const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message");

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Middleware to authenticate token
const auth = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};

// Get contacts (all users except self)
router.get("/contacts", auth, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } }).select(
      "name email"
    );
    res.json(users);
  } catch (err) {
    console.error("Fetch contacts error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get message history with a specific user
router.get("/history/:contactId", auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, recipient: req.params.contactId },
        { sender: req.params.contactId, recipient: req.user.id },
      ],
    }).sort("timestamp");
    res.json(messages);
  } catch (err) {
    console.error("Fetch messages error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
