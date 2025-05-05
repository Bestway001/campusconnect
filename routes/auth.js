const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");

// Environment variables
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "6aa22db37e31a118f0b246afd663fdbec52826297818a2c05d12b8051aebeb9d";
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

// Rate limit for resend-code and forgot-password (5 requests per hour per IP)
const resendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { msg: "Too many requests, please try again later." },
});

// Generate 6-digit code
const generateCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Register
router.post("/register", async (req, res) => {
  const { email, password, name, university, department } = req.body;
  console.log("Register attempt:", { email, name, university, department }); // Log request
  try {
    if (!email || !password || !name || !university || !department) {
      return res.status(400).json({ msg: "All fields are required" });
    }
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = generateCode();
    const codeExpires = new Date(Date.now() + 15 * 60 * 1000);

    user = new User({
      email,
      password: hashedPassword,
      name,
      university,
      department,
      isVerified: false,
      isAdmin: false,
      verificationCode,
      codeExpires,
    });
    console.log("Saving user:", user.email); // Log before save
    await user.save();
    console.log("User saved:", user.email); // Log after save

    console.log("Sending email to:", email); // Log before email
    await transporter.sendMail({
      to: email,
      subject: "Verify Your CampusConnect Account",
      html: `
        <p>Your verification code is:</p>
        <h2>${verificationCode}</h2>
        <p>Enter this code in the app to verify your email. It expires in 15 minutes.</p>
      `,
    });
    console.log("Email sent to:", email); // Log after email

    console.log(`Registration successful for ${email}`);
    res.json({ msg: "Registration successful" });
  } catch (err) {
    console.error("Registration error:", err.message); // Log the error
    res.status(500).json({ msg: "Server error during registration" });
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
    if (
      !user.verificationCode ||
      user.verificationCode !== code ||
      user.codeExpires < Date.now()
    ) {
      return res.status(400).json({ msg: "Invalid or expired code" });
    }
    user.isVerified = true;
    user.verificationCode = null;
    user.codeExpires = null;
    await user.save();
    console.log(`Email verified for ${email}`);
    res.json({ msg: "Email verified successfully" });
  } catch (err) {
    console.error("Verification error:", err.message);
    res.status(400).json({ msg: "Verification failed" });
  }
});

// Resend Code
router.post("/resend-code", resendLimiter, async (req, res) => {
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
    const codeExpires = new Date(Date.now() + 15 * 60 * 1000);
    user.verificationCode = generateCode();
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

    console.log(`Resent code to ${email}`);
    res.json({ msg: "Verification code sent" });
  } catch (err) {
    console.error("Resend code error:", err.message);
    res.status(500).json({ msg: "Failed to send code" });
  }
});

// Forgot Password
router.post("/forgot-password", resendLimiter, async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }
    const resetCode = generateCode();
    const resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
    user.resetCode = resetCode;
    user.resetCodeExpires = resetCodeExpires;
    await user.save();

    await transporter.sendMail({
      to: email,
      subject: "Reset Your CampusConnect Password",
      html: `
        <p>Your password reset code is:</p>
        <h2>${resetCode}</h2>
        <p>Enter this code in the app to reset your password. It expires in 15 minutes.</p>
      `,
    });

    console.log(`Reset code sent to ${email}`);
    res.json({ msg: "Reset code sent" });
  } catch (err) {
    console.error("Forgot password error:", err.message);
    res.status(500).json({ msg: "Failed to send reset code" });
  }
});

// Reset Password
router.post("/reset-password", async (req, res) => {
  const { email, code, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }
    if (
      !user.resetCode ||
      user.resetCode !== code ||
      user.resetCodeExpires < Date.now()
    ) {
      return res.status(400).json({ msg: "Invalid or expired reset code" });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetCode = null;
    user.resetCodeExpires = null;
    await user.save();
    console.log(`Password reset for ${email}`);
    res.json({ msg: "Password reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err.message);
    res.status(400).json({ msg: "Password reset failed" });
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
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }
    const token = jwt.sign(
      {
        user: {
          id: user._id.toString(),
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
    console.log(`Login successful for ${email}`);
    res.json({ token });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
