const mongoose = require('mongoose');

const MembershipSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  role: { type: String, default: 'member' }, // member / admin(소그룹관리)
  createdAt: { type: Date, default: Date.now }
});

// 같은 유저가 같은 그룹에 중복 가입 못하게
MembershipSchema.index({ userId: 1, groupId: 1 }, { unique: true });

module.exports = mongoose.model('Membership', MembershipSchema);
