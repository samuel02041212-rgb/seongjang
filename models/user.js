/**
 * models/user.js
 * 사용자(회원) 스키마.
 * 로그인/회원가입, 관리자 승인, 프로필 정보를 담는다.
 */
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  gender: { type: String, enum: ['M', 'F'], required: true },
  birthDate: { type: Date, required: true },
  church: { type: String, required: true },

  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  signupSource: { type: String, default: '' },

  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isApproved: { type: Boolean, default: false },   // 관리자 승인 전까지 false
  approvedAt: { type: Date, default: null },

  createdAt: { type: Date, default: Date.now },

  statusMessage: { type: String, default: '' },
  profileImageUrl: { type: String, default: '/images/default-profile.png' }
});

module.exports = mongoose.model('User', UserSchema);
