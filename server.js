// server.js
const express = require('express');
const path = require('path');
const fs = require('fs');

const session = require('express-session');
const bcrypt = require('bcrypt');
const multer = require('multer');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const User = require('./models/user');
const Post = require('./models/post');
const Group = require('./models/group');
const Membership = require('./models/membership');

const requireAdmin = require('./middlewares/requireAdmin');

const app = express();

// ================== DB 연결 ==================
require('dotenv').config();
connectDB();

// ================== 기본 미들웨어 ==================
// 정적 파일 (public 폴더: css/js/images/partials 등)
app.use(express.static('public'));

// JSON / Form body 파싱
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 세션
app.use(session({
  secret: 'seongjang-secret-key', // TODO: 배포 전에 .env로 옮기기
  resave: false,
  saveUninitialized: false
}));

// 업로드 폴더(프로필 이미지) 정적 서빙
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ================== 헬스 체크 ==================
app.get('/', (req, res) => {
  res.send('성경나눔장소 성장 서버 실행 중');
});

// ================== 공통: 로그인 필요 ==================
function requireLogin(req, res, next) {
  if (!req.session?.userId) {
    // API 요청이면 JSON
    if (req.path.startsWith('/api')) {
      return res.status(401).json({ ok: false, reason: 'not_logged_in' });
    }
    // 페이지 요청이면 로그인 페이지로
    return res.redirect('/login.html');
  }
  next();
}

// ================== AUTH: 회원가입/로그인/로그아웃 ==================

// 📌 회원가입: 기본은 승인대기(isApproved=false)로 들어감 (User 스키마 default에 의해)
app.post('/register', async (req, res) => {
  const { username, gender, birthDate, church, email, password, signupSource } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      gender,
      birthDate,
      church,
      email,
      password: hashedPassword,
      signupSource: signupSource || ''
      // role, isApproved, approvedAt 은 스키마 default 사용
    });

    await user.save();
    return res.send('회원가입 성공');
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    return res.status(500).send('회원가입 실패');
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('username password isApproved');

    if (!user) return res.send('존재하지 않는 이메일');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.send('비밀번호 틀림');

    // ✅ 승인 전이면 로그인 차단
    if (!user.isApproved) {
      return res.status(403).send('관리자 승인 대기 중입니다.');
    }

    // ✅ 세션 저장
    req.session.userId = user._id.toString();
    req.session.username = user.username;

    return res.send('로그인 성공');
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res.status(500).send('로그인 오류');
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => res.send('로그아웃'));
});

// ================== PAGE ROUTES ==================
app.get('/admin', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.get('/main', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'main.html'));
});

app.get('/meditation', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'meditation.html'));
});

// 예전 링크 호환용(있으면 유지)
app.get('/meditation.html', requireLogin, (req, res) => {
  res.redirect('/meditation');
});

app.get('/study', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'study.html'));
});

app.get('/group/mypage', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'group_mypage.html'));
});

app.get('/group/uniongroup', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'group_uniongroup.html'));
});

// ================== API: 내 정보(관리자 탭/마이페이지에서 사용) ==================
// ✅ 여기서 role을 내려줘야 관리자 탭이 보임
app.get('/api/me', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId)
      .select('username role isApproved statusMessage profileImageUrl gender birthDate church signupSource');
    res.json(user);
  } catch (e) {
    console.error('ME ERROR:', e);
    res.status(500).json(null);
  }
});

// 상태메시지 수정
app.put('/api/me', requireLogin, async (req, res) => {
  const { statusMessage } = req.body;

  try {
    await User.updateOne(
      { _id: req.session.userId },
      { statusMessage: statusMessage || '' }
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

// ================== API: 프로필 이미지 업로드 ==================
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    cb(null, `profile_${req.session.userId}_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

app.post('/api/me/profile-image', requireLogin, upload.single('image'), async (req, res) => {
  try {
    const url = `/uploads/${req.file.filename}`;
    await User.updateOne({ _id: req.session.userId }, { profileImageUrl: url });
    res.json({ ok: true, profileImageUrl: url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

// ================== API: 게시글 ==================
// 📌 게시글 작성(텍스트 + 선택 이미지 1장)
// 📌 게시글 작성(텍스트 + 이미지 여러 장)
app.post('/api/posts', requireLogin, upload.array('images', 10), async (req, res) => {
  const { title, content, bibleRef } = req.body;

  try {
    const imageUrls = (req.files || []).map(f => `/uploads/${f.filename}`);

    const post = new Post({
      authorId: req.session.userId,
      authorName: req.session.username,
      title,
      content,
      bibleRef: bibleRef || '',
      imageUrls
    });

    await post.save();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});



app.get('/api/posts', requireLogin, async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).limit(50);

// 구버전 호환: imageUrl -> imageUrls
const normalized = posts.map(p => {
  const obj = p.toObject();
  if ((!obj.imageUrls || obj.imageUrls.length === 0) && obj.imageUrl) {
    obj.imageUrls = [obj.imageUrl];
  }
  return obj;
});

res.json(normalized);

  } 
    catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

// 내 글
app.get('/api/my-posts', requireLogin, async (req, res) => {
  try {
    const posts = await Post.find({ authorId: req.session.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

// 글 단건 조회(수정용)
app.get('/api/posts/:id', requireLogin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json(null);
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json(null);

    res.json(post);
  } catch (e) {
    console.error(e);
    res.status(500).json(null);
  }
});

// 글 수정
app.put('/api/posts/:id', requireLogin, async (req, res) => {
  const { title, content, bibleRef } = req.body;

  try {
    await Post.updateOne(
      { _id: req.params.id, authorId: req.session.userId },
      { title, content, bibleRef }
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

// ================== API: 소그룹(현재는 조회만) ==================
app.get('/api/my-groups', requireLogin, async (req, res) => {
  try {
    const memberships = await Membership.find({ userId: req.session.userId })
      .populate('groupId');

    const groups = memberships
      .filter(m => m.groupId)
      .map(m => ({
        name: m.groupId.name,
        slug: m.groupId.slug
      }));

    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

// ================== ADMIN API ==================
// 전체 유저 목록
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .select('username email role isApproved createdAt gender birthDate church signupSource');
    res.json(users);
  } catch (e) {
    console.error(e);
    res.status(500).json([]);
  }
});

// 승인 대기 유저
app.get('/api/admin/pending-users', requireAdmin, async (req, res) => {
  try {
    const users = await User.find({ isApproved: false })
      .sort({ createdAt: -1 })
      .select('username email gender birthDate church signupSource createdAt');
    res.json(users);
  } catch (e) {
    console.error(e);
    res.status(500).json([]);
  }
});

// 승인
app.post('/api/admin/users/:id/approve', requireAdmin, async (req, res) => {
  try {
    await User.updateOne(
      { _id: req.params.id },
      { isApproved: true, approvedAt: new Date() }
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

// 거절(삭제)
app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    await User.deleteOne({ _id: req.params.id, isApproved: false });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

// 게시글 목록
app.get('/api/admin/posts', requireAdmin, async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(posts);
  } catch (e) {
    console.error(e);
    res.status(500).json([]);
  }
});

// 게시글 삭제
app.delete('/api/admin/posts/:id', requireAdmin, async (req, res) => {
  try {
    await Post.deleteOne({ _id: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

// ================== 서버 시작 ==================
app.listen(3000, () => {
  console.log('http://localhost:3000');
});
