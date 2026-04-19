const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const { workerAuth } = require('../middleware/auth');
const { notifyComplaintResolved } = require('../services/notificationService');

// Get worker's assigned complaints
router.get('/complaints', workerAuth, async (req, res) => {
  try {
    const complaints = await Complaint.find({ assignedWorker: req.user._id })
      .populate('user', 'name email phone address')
      .sort({ 'aiClassification.urgencyScore': -1, createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update complaint status
router.put('/complaints/:id/status', workerAuth, async (req, res) => {
  try {
    const { status, workerNotes } = req.body;
    const allowed = ['in-progress', 'resolved'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    const complaint = await Complaint.findOne({
      _id: req.params.id,
      assignedWorker: req.user._id
    }).populate('user', 'name email phone');

    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    complaint.status = status;
    complaint.workerNotes = workerNotes;
    if (status === 'resolved') complaint.resolvedAt = new Date();
    await complaint.save();

    // Send resolved notification to user
    if (status === 'resolved' && complaint.user) {
      notifyComplaintResolved(complaint.user, complaint).catch(err =>
        console.error('Notification error:', err.message)
      );
    }

    res.json({ message: 'Status updated!', complaint });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;