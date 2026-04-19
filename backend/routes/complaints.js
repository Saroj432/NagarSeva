const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { classifyComplaint } = require('../services/geminiAI');
const { notifyComplaintSubmitted } = require('../services/notificationService');

// Multer setup
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed!'));
    }
  }
});

// Submit complaint
router.post('/', auth, upload.array('photos', 5), async (req, res) => {
  try {
    const { title, description, category, address, ward, lat, lng } = req.body;
    const photos = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

    // AI Classification
    const aiResult = await classifyComplaint(title, description, category);

    const complaint = new Complaint({
      user: req.user._id,
      title, description, category,
      location: { address, ward, coordinates: { lat: lat || null, lng: lng || null } },
      photos,
      priority: aiResult.priority,
      aiClassification: aiResult
    });

    await complaint.save();

    // Send Email + SMS notification
    console.log('Sending notification to:', req.user.email, req.user.phone);
    notifyComplaintSubmitted(req.user, complaint).catch(err =>
      console.error('Notification error:', err.message)
    );

    res.status(201).json({ message: 'Complaint submitted successfully!', complaint });
  } catch (err) {
    res.status(500).json({ message: 'Error submitting complaint', error: err.message });
  }
});

// Get user's complaints
router.get('/my', auth, async (req, res) => {
  try {
    const complaints = await Complaint.find({ user: req.user._id })
      .populate('assignedWorker', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get single complaint
router.get('/:id', auth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('assignedWorker', 'name email phone');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Rate a resolved complaint
router.post('/:id/rate', auth, async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }
    const complaint = await Complaint.findOne({ _id: req.params.id, user: req.user._id });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });
    if (complaint.status !== 'resolved') {
      return res.status(400).json({ message: 'Only resolved complaints can be rated.' });
    }
    complaint.rating = rating;
    complaint.feedback = feedback || '';
    await complaint.save();
    res.json({ message: 'Rating submitted successfully! Thank you!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;