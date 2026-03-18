/**
 * models/group.js
 * 소그룹 스키마.
 * 그룹 이름과 URL용 slug(예: uniongroup)를 저장한다.
 */
const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },   // 예: 연합성장
  slug: { type: String, required: true, unique: true }, // 예: uniongroup
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Group', GroupSchema);
