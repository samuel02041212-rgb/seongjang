/**
 * config/db.js
 * MongoDB 연결 설정.
 * .env의 MONGO_URI를 사용해 앱 시작 시 DB에 연결한다.
 */
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB 연결 성공');
  } catch (err) {
    console.error('MongoDB 연결 실패', err.message);
    // 여기서 process.exit() 같은 종료 코드 있으면 넣지 마
  }
};

module.exports = connectDB;
