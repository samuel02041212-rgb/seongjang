const mongoose = require('mongoose');

const ScheduleEventSchema = new mongoose.Schema(
  {
    scope: { type: String, enum: ['personal', 'global'], required: true, index: true },
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // personal only
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', trim: true, maxlength: 2000 },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true, index: true },
    allDay: { type: Boolean, default: false },
    color: { type: String, default: '#ffcd38' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

ScheduleEventSchema.index({ scope: 1, startAt: 1, endAt: 1 });
ScheduleEventSchema.index({ ownerUserId: 1, startAt: 1 });

module.exports = mongoose.model('ScheduleEvent', ScheduleEventSchema);

