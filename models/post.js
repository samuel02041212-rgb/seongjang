/**
 * models/post.js
 * 게시글(피드/묵상글) 스키마.
 * 작성자, 제목/내용, 성경 구절, 이미지 목록을 담는다.
 */
const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  title: { type: String, default: '' },
  content: { type: String, required: true },
  imageUrls: { type: [String], default: [] },

  bibleRef: { type: String, default: '' },

  /** 공감 누른 사용자 ID 목록 */
  likedBy: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },

  /**
   * 소그룹 방 피드에 표시할 그룹 ID (메인 피드와 무관, 빈 배열이면 홈에만).
   */
  visibleGroupIds: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
    default: []
  },

  createdAt: { type: Date, default: Date.now }
});

PostSchema.index({ visibleGroupIds: 1 });

module.exports = mongoose.model('Post', PostSchema);
