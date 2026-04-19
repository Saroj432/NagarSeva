const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { adminAuth } = require('../middleware/auth');
const { notifyComplaintResolved } = require('../services/notificationService');

// Get all complaints
router.get('/complaints', adminAuth, async (req, res) => {
  try {
    const { status, priority, category, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const complaints = await Complaint.find(filter)
      .populate('user', 'name email phone')
      .populate('assignedWorker', 'name email phone')
      .sort({ 'aiClassification.urgencyScore': -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Complaint.countDocuments(filter);
    res.json({ complaints, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all workers
router.get('/workers', adminAuth, async (req, res) => {
  try {
    const workers = await User.find({ role: 'worker' }).select('-password');
    res.json(workers);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Assign complaint to worker
router.put('/complaints/:id/assign', adminAuth, async (req, res) => {
  try {
    const { workerId, adminNotes } = req.body;
    const worker = await User.findById(workerId);
    if (!worker || worker.role !== 'worker') {
      return res.status(400).json({ message: 'Invalid worker.' });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { assignedWorker: workerId, status: 'assigned', assignedAt: new Date(), adminNotes },
      { new: true }
    ).populate('assignedWorker', 'name email phone');

    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });
    res.json({ message: 'Complaint assigned successfully!', complaint });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update complaint status
router.put('/complaints/:id/status', adminAuth, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const update = { status, adminNotes };
    if (status === 'resolved') update.resolvedAt = new Date();

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id, update, { new: true }
    ).populate('user', 'name email phone');

    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    // Send resolved notification to user
    if (status === 'resolved' && complaint.user) {
      notifyComplaintResolved(complaint.user, complaint).catch(err =>
        console.error('Resolved notification error:', err.message)
      );
    }

    res.json({ message: 'Status updated!', complaint });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Worker update status (resolved notification)
router.put('/complaints/:id/worker-resolve', adminAuth, async (req, res) => {
  try {
    const { workerNotes } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved', workerNotes, resolvedAt: new Date() },
      { new: true }
    ).populate('user', 'name email phone');

    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    if (complaint.user) {
      notifyComplaintResolved(complaint.user, complaint).catch(err =>
        console.error('Notification error:', err.message)
      );
    }

    res.json({ message: 'Resolved!', complaint });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const total = await Complaint.countDocuments();
    const pending = await Complaint.countDocuments({ status: 'pending' });
    const assigned = await Complaint.countDocuments({ status: 'assigned' });
    const inProgress = await Complaint.countDocuments({ status: 'in-progress' });
    const resolved = await Complaint.countDocuments({ status: 'resolved' });
    const critical = await Complaint.countDocuments({ priority: 'critical' });
    const high = await Complaint.countDocuments({ priority: 'high' });
    const categoryStats = await Complaint.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
    res.json({ total, pending, assigned, inProgress, resolved, critical, high, categoryStats });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create admin
router.post('/create-admin', async (req, res) => {
  try {
    const { name, email, password, secretKey } = req.body;
    if (secretKey !== 'MUNICIPAL_ADMIN_2024') {
      return res.status(403).json({ message: 'Invalid secret key.' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists.' });
    const admin = new User({ name, email, password, role: 'admin' });
    await admin.save();
    res.json({ message: 'Admin created successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;