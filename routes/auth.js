const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const nodemailer = require("nodemailer");

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const FRONTEND_URL =
  process.env.FRONTEND_URL || "https://campusconnect-1f6h.onrender.com";
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Generate 6-digit code
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register
router.post("/register", async (req, res) => {
  const { email, password, name, university, department } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const verificationCode = generateCode();
    const codeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user = new User({
      email,
      password, // Hash in production
      name,
      university,
      department,
      isVerified: false,
      isAdmin: false,
      verificationCode,
      codeExpires,
    });

    await user.save();

    // Send verification email
    await transporter.sendMail({
      to: email,
      subject: "Verify Your CampusConnect Account",
      html: `
        <p>Your verification code is:</p>
        <h2>${verificationCode}</h2>
        <p>Enter this code in the app to verify your email. It expires in 15 minutes.</p>
      `,
    });

    res.json({ msg: "Registration successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Verify Code
router.post("/verify-code", async (req, res) => {
  const { email, code } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }
    if (user.isVerified) {
      return res.json({ msg: "Email already verified" });
    }
    if (user.verificationCode !== code || user.codeExpires < Date.now()) {
      return res.status(400).json({ msg: "Invalid or expired code" });
    }
    user.isVerified = true;
    user.verificationCode = null;
    user.codeExpires = null;
    await user.save();
    res.json({ msg: "Email verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ msg: "Verification failed" });
  }
});

// Resend Code
router.post("/resend-code", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }
    if (user.isVerified) {
      return res.json({ msg: "Email already verified" });
    }
    const verificationCode = generateCode();
    const codeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    user.verificationCode = verificationCode;
    user.codeExpires = codeExpires;
    await user.save();

    await transporter.sendMail({
      to: email,
      subject: "Verify Your CampusConnect Account",
      html: `
        <p>Your new verification code is:</p>
        <h2>${verificationCode}</h2>
        <p>Enter this code in the app to verify your email. It expires in 15 minutes.</p>
      `,
    });

    res.json({ msg: "Verification code sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to send code" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }
    if (!user.isVerified) {
      return res.status(400).json({ msg: "Email not verified" });
    }
    // Verify password (use bcrypt in production)
    if (password !== user.password) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }
    const token = jwt.sign(
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          university: user.university,
          department: user.department,
          isAdmin: user.isAdmin,
        },
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
