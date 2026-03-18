/**
 * models/userChatMeta.js
 * 사용자별 채팅방 메타: 고정 여부, 마지막 열람 시각(읽음/배지 리셋용)
 */
const mongoose = require('mongoose');

const UserChatMetaSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  otherUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pinnedAt: { type: Date, default: null },
  lastOpenedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

UserChatMetaSchema.index({ userId: 1, otherUserId: 1 }, { unique: true });

module.exports = mongoose.model('UserChatMeta', UserChatMetaSchema);
