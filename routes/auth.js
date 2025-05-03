const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Assumed MongoDB model
const nodemailer = require('nodemailer'); // For sending emails

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://campusconnect-1f6h.onrender.com';
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail', // Or your email service
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

// Register
router.post('/register', async (req, res) => {
  const { email, password, name, university, department } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      email,
      password, // Hash password in production
      name,
      university,
      department,
      isVerified: false,
      isAdmin: false
    });

    await user.save();

    // Create verification token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1d' });

    // Send verification email
    const verificationUrl = `${FRONTEND_URL}/verify?token=${token}`;
    await transporter.sendMail({
      to: email,
      subject: 'Verify Your CampusConnect Account',
      html: `
        <p>Please click this link to verify your email:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
      `
    });

    res.json({ msg: 'Registration successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Verify Email
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { userId } = jwt.verify(req.params.token, JWT_SECRET);
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ msg: 'Invalid token' });
    }
    if (user.isVerified) {
      return res.json({ msg: 'Email already verified' });
    }
    user.isVerified = true;
    await user.save();
    res.json({ msg: 'Email verified successfully' });
    // Optionally redirect: res.redirect(`${FRONTEND_URL}/verify?token=${req.params.token}`);
  } catch (err) {
    console.error(err);
    res.status(400).json({ msg: 'Invalid or expired token' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    if (!user.isVerified) {
      return res.status(400).json({ msg: 'Email not verified' });
    }
    // Verify password (use bcrypt in production)
    if (password !== user.password) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { user: { id: user._id, name: user.name, email: user.email, university: user.university, department: user.department, isAdmin: user.isAdmin } },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;