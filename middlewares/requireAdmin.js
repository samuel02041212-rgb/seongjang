/**
 * middlewares/requireAdmin.js
 * 관리자 전용 라우트용 미들웨어.
 * 로그인 여부 확인 후, role이 admin인 경우에만 next() 호출.
 */
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
