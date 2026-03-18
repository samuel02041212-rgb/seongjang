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

  // 나중에 말씀/주석 붙일 때를 위해 미리 자리만
  bibleRef: { type: String, default: '' },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', PostSchema);
