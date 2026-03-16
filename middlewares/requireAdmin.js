
// middlewares/requireAdmin.js
const User = require('../models/user');

async function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).send('로그인이 필요합니다.');
  }

  const user = await User.findById(req.session.userId).select('role');
  if (!user || user.role !== 'admin') {
    return res.status(403).send('관리자만 접근 가능합니다.');
  }

  next();
}

module.exports = requireAdmin;


