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
