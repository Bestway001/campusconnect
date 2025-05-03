const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  university: { type: String, required: true },
  department: { type: String },
  isVerified: { type: Boolean, default: false },
  isAgent: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  verificationCode: { type: String }, // New
  codeExpires: { type: Date }, // New
  profilePicture: { type: String },
  walletBalance: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
