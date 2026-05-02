const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const { workerAuth } = require('../middleware/auth');
const { notifyComplaintResolved, notifyComplaintStatusUpdate } = require('../services/notificationService');

router.get('/complaints', workerAuth, async (req, res) => {
  try {
    const complaints = await Complaint.find({ assignedWorker: req.user._id })
      .populate('user', 'name email phone address')
      .sort({ 'aiClassification.urgencyScore': -1, createdAt: -1 });
    res.json(complaints);
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.put('/complaints/:id/status', workerAuth, async (req, res) => {
  try {
    const { status, workerNotes } = req.body;
    if (!['in-progress', 'resolved'].includes(status)) return res.status(400).json({ message: 'Invalid status.' });

    const complaint = await Complaint.findOne({ _id: req.params.id, assignedWorker: req.user._id })
      .populate('user', 'name email phone');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    complaint.status = status;
    complaint.workerNotes = workerNotes;
    if (status === 'resolved') complaint.resolvedAt = new Date();
    await complaint.save();

    if (complaint.user) {
      if (status === 'resolved') {
        notifyComplaintResolved(complaint.user, complaint).catch(e => console.error(e.message));
      } else if (status === 'in-progress') {
        notifyComplaintStatusUpdate(complaint.user, complaint, 'in-progress').catch(e => console.error(e.message));
      }
    }

    res.json({ message: 'Status updated!', complaint });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

module.exports = router;