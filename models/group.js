/**
 * models/group.js
 * 소그룹 스키마.
 * 그룹 이름과 URL용 slug(예: uniongroup)를 저장한다.
 */
const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },   // 예: 연합성장
  slug: { type: String, required: true, unique: true }, // 예: uniongroup
  /** 소그룹 대표(개설 승인 시 요청자) */
  leaderUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  church: { type: String, default: '', trim: true },
  bibleVerse: { type: String, default: '', trim: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Group', GroupSchema);
