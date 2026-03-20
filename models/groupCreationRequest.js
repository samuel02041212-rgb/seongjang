const mongoose = require('mongoose');

const GroupCreationRequestSchema = new mongoose.Schema({
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  church: { type: String, required: true, trim: true, maxlength: 120 },
  bibleVerse: { type: String, required: true, trim: true, maxlength: 500 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  createdGroupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  reviewedAt: { type: Date }
}, { timestamps: true });

GroupCreationRequestSchema.index({ requesterId: 1, status: 1 });

module.exports = mongoose.model('GroupCreationRequest', GroupCreationRequestSchema);
