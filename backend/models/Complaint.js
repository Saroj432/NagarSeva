const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['garbage', 'drainage', 'road', 'water', 'electricity', 'sewage', 'other'],
    required: true
  },
  location: {
    address: { type: String, required: true },
    ward: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  photos: [{ type: String }],
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in-progress', 'resolved', 'rejected'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  aiClassification: {
    priority: String,
    reason: String,
    suggestedCategory: String,
    urgencyScore: Number
  },
  assignedWorker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedAt: { type: Date },
  resolvedAt: { type: Date },
  adminNotes: { type: String },
  workerNotes: { type: String },
  rating: { type: Number, min: 1, max: 5 },
  feedback: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

complaintSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);