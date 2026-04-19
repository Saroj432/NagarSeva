const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, address, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already registered.' });

    const allowedRoles = ['user', 'worker'];
    const userRole = allowedRoles.includes(role) ? role : 'user';

    const user = new User({ name, email, password, phone, address, role: userRole });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, name, email, role: userRole } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Store OTPs temporarily (in production use Redis/DB)
const otpStore = {};

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Email is not registered.' });

    // Generate 6 digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 }; // 10 min

    // Send email
    await transporter.sendMail({
      from: `"NagarSeva" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'NagarSeva - Password Reset OTP',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:2rem;background:#f4f6f0;border-radius:12px">
          <h2 style="color:#1a6b3c;margin-bottom:1rem">🏛️ NagarSeva</h2>
          <p style="color:#333">You have requested to reset your password.</p>
          <div style="background:#fff;border-radius:10px;padding:1.5rem;text-align:center;margin:1.5rem 0;border:2px dashed #1a6b3c">
            <p style="color:#666;font-size:14px;margin-bottom:8px">Your OTP code:</p>
            <h1 style="color:#1a6b3c;font-size:3rem;letter-spacing:0.3em;margin:0">${otp}</h1>
          </div>
          <p style="color:#666;font-size:13px">This OTP will expire in <strong>10 minutes</strong>.</p>
          <p style="color:#999;font-size:12px;margin-top:1rem">If you did not request this, please ignore this email.</p>
        </div>
      `
    });

    res.json({ message: 'OTP sent to your email!' });
  } catch (err) {
    res.status(500).json({ message: 'Send OTP error: ' + err.message });
  }
});

// Verify OTP & Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const stored = otpStore[email];
    if (!stored) return res.status(400).json({ message: 'OTP not found. Please try again.' });
    if (Date.now() > stored.expires) {
      delete otpStore[email];
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }
    if (stored.otp !== otp) return res.status(400).json({ message: 'Invalid OTP.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.password = newPassword;
    await user.save();
    delete otpStore[email];

    res.json({ message: 'Password successfully reset! Please login.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});
module.exports = router;
