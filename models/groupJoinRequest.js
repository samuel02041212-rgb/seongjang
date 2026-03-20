const mongoose = require('mongoose');

const GroupJoinRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true, index: true },
  message: { type: String, default: '', trim: true, maxlength: 500 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  respondedAt: { type: Date }
}, { timestamps: true });

GroupJoinRequestSchema.index({ userId: 1, groupId: 1, status: 1 });

module.exports = mongoose.model('GroupJoinRequest', GroupJoinRequestSchema);
