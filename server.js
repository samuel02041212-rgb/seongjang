/**
 * server.js — 성장(성경 나눔 공간) 메인 서버
 * Express + Socket.IO: 인증, 게시글, 소그룹, 채팅, 관리자 API
 */
const http = require('http');
const express = require('express');
const path = require('path');
const fs = require('fs');

const session = require('express-session');
const bcrypt = require('bcrypt');
const multer = require('multer');
const mongoose = require('mongoose');
const { Server: SocketIOServer } = require('socket.io');

const connectDB = require('./config/db');
const User = require('./models/user');
const Post = require('./models/post');
const Comment = require('./models/comment');
const Group = require('./models/group');
const Membership = require('./models/membership');
const GroupCreationRequest = require('./models/groupCreationRequest');
const GroupJoinRequest = require('./models/groupJoinRequest');
const ChatMessage = require('./models/chatMessage');
const UserChatMeta = require('./models/userChatMeta');
const ScheduleEvent = require('./models/scheduleEvent');

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

// 세션 (로그인 유지)
app.use(session({
  secret: 'seongjang-secret-key', // TODO: 배포 전에 .env로 옮기기
  resave: false,
  saveUninitialized: false
}));

// 업로드 폴더(프로필/게시글 이미지) 정적 서빙
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ================== 헬스 체크 ==================
app.get('/', (req, res) => {
  res.send('성경나눔장소 성장 서버 실행 중');
});

// ================== 공통: 로그인 필요 미들웨어 ==================
function requireLogin(req, res, next) {
  if (!req.session?.userId) {
    if (req.path.startsWith('/api')) {
      return res.status(401).json({ ok: false, reason: 'not_logged_in' });
    }
    return res.redirect('/login.html');
  }
  next();
}

/** 가입한 소그룹만 visibleGroupIds에 넣기 */
async function resolveVisibleGroupIdsForUser(raw, userId) {
  let ids = [];
  try {
    if (typeof raw === 'string') {
      ids = JSON.parse(raw || '[]');
    } else if (Array.isArray(raw)) ids = raw;
  } catch (_) {
    ids = [];
  }
  if (!Array.isArray(ids)) ids = [];
  const authorOid = new mongoose.Types.ObjectId(userId);
  const valid = [];
  const seen = new Set();
  for (const id of ids) {
    if (!mongoose.Types.ObjectId.isValid(id)) continue;
    const oid = new mongoose.Types.ObjectId(id);
    const key = oid.toString();
    if (seen.has(key)) continue;
    seen.add(key);
    const m = await Membership.findOne({ userId: authorOid, groupId: oid }).lean();
    if (m) valid.push(oid);
  }
  return valid;
}

/** 묵상 등록 후 이동용 경로 (오픈 리다이렉트 방지). /group/mygroups, /group/uniongroup, /group/:slug */
function sanitizeGroupReturnPath(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let p = raw.trim();
  try {
    p = decodeURIComponent(p);
  } catch (_) {
    return null;
  }
  if (!p.startsWith('/') || p.startsWith('//')) return null;
  if (p.includes('://') || p.includes('?') || p.includes('#')) return null;
  const m = p.match(/^\/group\/([a-zA-Z0-9_-]+)$/);
  if (!m) return null;
  if (m[1].toLowerCase() === 'mypage') return null;
  return p;
}

// ================== AUTH: 회원가입 / 로그인 / 로그아웃 ==================

// 회원가입 — 기본은 승인대기(isApproved=false)
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
    });

    await user.save();
    return res.send('회원가입 성공');
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    return res.status(500).send('회원가입 실패');
  }
});

// 로그인 — 이메일/비밀번호 검증, 미승인 시 403
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('username password isApproved');

    if (!user) return res.send('존재하지 않는 이메일');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.send('비밀번호 틀림');

    if (!user.isApproved) {
      return res.status(403).send('관리자 승인 대기 중입니다.');
    }

    req.session.userId = user._id.toString();
    req.session.username = user.username;

    return res.send('로그인 성공');
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res.status(500).send('로그인 오류');
  }
});

// 로그아웃 — 세션 삭제
app.post('/logout', (req, res) => {
  req.session.destroy(() => res.send('로그아웃'));
});

// ================== 페이지 라우트 (로그인 필요 페이지) ==================
app.get('/admin', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.get('/main', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'main.html'));
});

app.get('/meditation', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'meditation.html'));
});

app.get('/meditation.html', requireLogin, (req, res) => {
  res.redirect('/meditation');
});

app.get('/study', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'study.html'));
});

app.get('/group/mypage', requireLogin, (req, res) => {
  return res.redirect('/group/mygroups');
});

app.get('/group/mygroups', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'group_mypage.html'));
});

app.get('/group/uniongroup', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'group_uniongroup.html'));
});

// 일반 소그룹 방 (/group/:slug) — 멤버만 접근
app.get('/group/:slug', requireLogin, async (req, res) => {
  try {
    const slug = req.params.slug;
    if (slug === 'mypage') return res.redirect('/group/mygroups');
    const group = await Group.findOne({ slug });
    if (!group) return res.status(404).send('소그룹을 찾을 수 없어요.');
    const member = await Membership.findOne({ userId: req.session.userId, groupId: group._id });
    if (!member) {
      return res.status(403).send('이 소그룹 멤버가 아니에요. 패널에서 가입 요청 후 대표 승인을 받아주세요.');
    }
    const abs = path.join(__dirname, 'views', 'group_room.html');
    res.sendFile(abs, (err) => {
      if (err) {
        console.error('sendFile group_room:', err);
        if (!res.headersSent) res.status(500).send('파일을 불러오지 못했어요.');
      }
    });
  } catch (e) {
    console.error(e);
    if (!res.headersSent) res.status(500).send('오류가 발생했어요.');
  }
});

// 로그인/회원가입 페이지 (공개)
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/register.html'));
});

// ================== API: 내 정보 (프로필, 관리자 탭 노출용) ==================
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
// 게시글 작성 (텍스트 + 이미지 최대 10장)
app.post('/api/posts', requireLogin, upload.array('images', 10), async (req, res) => {
  const { title, content, bibleRef } = req.body;

  try {
    const imageUrls = (req.files || []).map(f => `/uploads/${f.filename}`);
    const authorOid = new mongoose.Types.ObjectId(req.session.userId);
    const visibleGroupIds = await resolveVisibleGroupIdsForUser(
      req.body.visibleGroupIds || '[]',
      req.session.userId
    );

    const post = new Post({
      authorId: authorOid,
      authorName: req.session.username,
      title,
      content,
      bibleRef: bibleRef || '',
      imageUrls,
      visibleGroupIds
    });

    await post.save();
    const redirect = sanitizeGroupReturnPath(req.body.returnTo || '');
    if (redirect) return res.json({ ok: true, redirect });
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

// 게시글 목록 (최신 50개). 공감 수·내가 공감했는지 포함
app.get('/api/posts', requireLogin, async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).limit(50);
    const myId = req.session.userId;

    const normalized = posts.map(p => {
      const obj = p.toObject();
      if ((!obj.imageUrls || obj.imageUrls.length === 0) && obj.imageUrl) {
        obj.imageUrls = [obj.imageUrl];
      }
      const likedBy = obj.likedBy || [];
      obj.likeCount = likedBy.length;
      obj.isLikedByMe = likedBy.some(id => id && id.toString() === myId);
      return obj;
    });

    res.json(normalized);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

// 내 글만 조회
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

// 글 단건 조회 (수정 폼용)
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

// 글 수정 (본인 글만)
app.put('/api/posts/:id', requireLogin, async (req, res) => {
  const { title, content, bibleRef, visibleGroupIds: rawVis, returnTo } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ ok: false });
    }
    const authorOid = new mongoose.Types.ObjectId(req.session.userId);
    const patch = { title, content, bibleRef };
    if (rawVis !== undefined) {
      patch.visibleGroupIds = await resolveVisibleGroupIdsForUser(
        Array.isArray(rawVis) ? JSON.stringify(rawVis) : String(rawVis || '[]'),
        req.session.userId
      );
    }
    const r = await Post.updateOne(
      { _id: req.params.id, authorId: authorOid },
      patch
    );
    if (!r.matchedCount) return res.status(404).json({ ok: false });
    const redirect = sanitizeGroupReturnPath(typeof returnTo === 'string' ? returnTo : '');
    if (redirect) return res.json({ ok: true, redirect });
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

// 공감 토글 (누르면 추가, 다시 누르면 해제)
app.post('/api/posts/:id/like', requireLogin, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.session.userId;
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ ok: false });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ ok: false });

    const likedBy = post.likedBy || [];
    const idStr = userId.toString();
    const has = likedBy.some(id => id && id.toString() === idStr);

    if (has) {
      post.likedBy = likedBy.filter(id => id.toString() !== idStr);
    } else {
      post.likedBy = [...likedBy, new mongoose.Types.ObjectId(userId)];
    }
    await post.save();

    res.json({ ok: true, liked: !has, likeCount: post.likedBy.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

// 댓글 목록
app.get('/api/posts/:id/comments', requireLogin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json([]);
    }
    const comments = await Comment.find({ postId: req.params.id })
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (e) {
    console.error(e);
    res.status(500).json([]);
  }
});

// 댓글 작성
app.post('/api/posts/:id/comments', requireLogin, async (req, res) => {
  const { content } = req.body;
  if (!content || !String(content).trim()) {
    return res.status(400).json({ ok: false });
  }
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ ok: false });
    }
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ ok: false });

    const comment = new Comment({
      postId: req.params.id,
      authorId: req.session.userId,
      authorName: req.session.username,
      content: String(content).trim()
    });
    await comment.save();
    res.status(201).json({ ok: true, comment });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

// ================== API: 소그룹 (현재는 내 그룹 목록만) ==================
app.get('/api/my-groups', requireLogin, async (req, res) => {
  try {
    const memberships = await Membership.find({ userId: req.session.userId })
      .populate('groupId');

    const groups = memberships
      .filter(m => m.groupId)
      .map(m => ({
        name: m.groupId.name,
        slug: m.groupId.slug,
        _id: m.groupId._id
      }));

    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

// 소그룹 방 페이지용 메타 (멤버만)
app.get('/api/groups/room/:slug', requireLogin, async (req, res) => {
  try {
    const g = await Group.findOne({ slug: req.params.slug }).lean();
    if (!g) return res.status(404).json({ ok: false });
    const m = await Membership.findOne({ userId: req.session.userId, groupId: g._id });
    if (!m) return res.status(403).json({ ok: false, reason: 'not_member' });
    res.json({
      ok: true,
      name: g.name,
      slug: g.slug,
      church: g.church || '',
      bibleVerse: g.bibleVerse || ''
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

// 소그룹 방 피드: 작성 시 이 그룹을 체크해 visibleGroupIds에 넣은 글만 표시
// (레거시: visibleGroupIds 없음/빈 배열 미저장 시 $exists:false 조건이 멤버의 모든 방에 글을 띄우는 버그가 있어 제거함)
app.get('/api/groups/room/:slug/posts', requireLogin, async (req, res) => {
  try {
    const group = await Group.findOne({ slug: req.params.slug }).lean();
    if (!group) return res.status(404).json([]);

    const meMembership = await Membership.findOne({
      userId: req.session.userId,
      groupId: group._id
    });
    if (!meMembership) return res.status(403).json([]);

    const gid = new mongoose.Types.ObjectId(String(group._id));
    const posts = await Post.find({ visibleGroupIds: gid })
      .sort({ createdAt: -1 })
      .limit(50);

    const myId = req.session.userId;
    const normalized = posts.map(p => {
      const obj = p.toObject();
      if ((!obj.imageUrls || obj.imageUrls.length === 0) && obj.imageUrl) {
        obj.imageUrls = [obj.imageUrl];
      }
      const likedBy = obj.likedBy || [];
      obj.likeCount = likedBy.length;
      obj.isLikedByMe = likedBy.some(id => id && id.toString() === myId);
      return obj;
    });

    res.json(normalized);
  } catch (e) {
    console.error(e);
    res.status(500).json([]);
  }
});

function generateGroupSlug() {
  const crypto = require('crypto');
  return 'sg-' + crypto.randomBytes(8).toString('hex');
}

// 소그룹 개설 요청 (신청자 → 관리자 검토)
app.post('/api/group-creation-requests', requireLogin, async (req, res) => {
  try {
    const me = req.session.userId;
    const { name, church, bibleVerse } = req.body || {};
    const n = String(name || '').trim();
    const c = String(church || '').trim();
    const b = String(bibleVerse || '').trim();
    if (!n || !c || !b) return res.status(400).json({ ok: false, reason: 'missing_fields' });

    const dup = await GroupCreationRequest.findOne({ requesterId: me, status: 'pending' });
    if (dup) return res.status(409).json({ ok: false, reason: 'already_pending' });

    await GroupCreationRequest.create({
      requesterId: me,
      name: n,
      church: c,
      bibleVerse: b,
      status: 'pending'
    });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

// 소그룹 검색 (가입 가능한 그룹 목록)
app.get('/api/groups/search', requireLogin, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json([]);

    const me = req.session.userId;
    const myMemberships = await Membership.find({ userId: me }).select('groupId').lean();
    const myGroupIds = new Set(myMemberships.map(m => String(m.groupId)));

    const filter = {
      $or: [
        { name: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
        { slug: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
      ]
    };
    const groups = await Group.find(filter).limit(30).lean();
    const out = groups
      .filter(g => !myGroupIds.has(String(g._id)))
      .map(g => ({ _id: g._id, name: g.name, slug: g.slug, church: g.church || '', bibleVerse: g.bibleVerse || '' }));
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json([]);
  }
});

// 소그룹 가입 요청 (대표 승인 대기)
app.post('/api/groups/join-request', requireLogin, async (req, res) => {
  try {
    const me = req.session.userId;
    const { groupId, message } = req.body || {};
    if (!groupId) return res.status(400).json({ ok: false });

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ ok: false });

    const already = await Membership.findOne({ userId: me, groupId });
    if (already) return res.status(409).json({ ok: false, reason: 'already_member' });

    const dup = await GroupJoinRequest.findOne({ userId: me, groupId, status: 'pending' });
    if (dup) return res.status(409).json({ ok: false, reason: 'already_pending' });

    await GroupJoinRequest.create({
      userId: me,
      groupId,
      message: String(message || '').trim(),
      status: 'pending'
    });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

// 내가 대표인 소그룹에 대한 가입 대기 요청 목록
app.get('/api/groups/leader/join-requests', requireLogin, async (req, res) => {
  try {
    const me = req.session.userId;
    const leaderMemberships = await Membership.find({ userId: me, role: 'admin' }).select('groupId').lean();
    const groupIds = leaderMemberships.map(m => m.groupId);

    const requests = await GroupJoinRequest.find({
      groupId: { $in: groupIds },
      status: 'pending'
    })
      .populate('groupId', 'name slug')
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .lean();

    res.json(requests.map(r => ({
      _id: r._id,
      message: r.message || '',
      createdAt: r.createdAt,
      group: r.groupId ? { _id: r.groupId._id, name: r.groupId.name, slug: r.groupId.slug } : null,
      user: r.userId ? { _id: r.userId._id, username: r.userId.username, email: r.userId.email } : null
    })));
  } catch (e) {
    console.error(e);
    res.status(500).json([]);
  }
});

app.post('/api/groups/join-requests/:id/approve', requireLogin, async (req, res) => {
  try {
    const me = req.session.userId;
    const jr = await GroupJoinRequest.findById(req.params.id);
    if (!jr || jr.status !== 'pending') return res.status(404).json({ ok: false });

    const isLeader = await Membership.findOne({ userId: me, groupId: jr.groupId, role: 'admin' });
    if (!isLeader) return res.status(403).json({ ok: false });

    const existing = await Membership.findOne({ userId: jr.userId, groupId: jr.groupId });
    if (existing) {
      jr.status = 'rejected';
      jr.respondedAt = new Date();
      await jr.save();
      return res.json({ ok: true, reason: 'already_member' });
    }

    await Membership.create({ userId: jr.userId, groupId: jr.groupId, role: 'member' });
    jr.status = 'approved';
    jr.respondedAt = new Date();
    await jr.save();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

app.post('/api/groups/join-requests/:id/reject', requireLogin, async (req, res) => {
  try {
    const me = req.session.userId;
    const jr = await GroupJoinRequest.findById(req.params.id);
    if (!jr || jr.status !== 'pending') return res.status(404).json({ ok: false });

    const isLeader = await Membership.findOne({ userId: me, groupId: jr.groupId, role: 'admin' });
    if (!isLeader) return res.status(403).json({ ok: false });

    jr.status = 'rejected';
    jr.respondedAt = new Date();
    await jr.save();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

// ----- 관리자: 소그룹 개설 요청 -----
app.get('/api/admin/group-creation-requests', requireAdmin, async (req, res) => {
  try {
    const list = await GroupCreationRequest.find({ status: 'pending' })
      .populate('requesterId', 'username email')
      .sort({ createdAt: -1 })
      .lean();

    res.json(list.map(r => ({
      _id: r._id,
      name: r.name,
      church: r.church,
      bibleVerse: r.bibleVerse,
      createdAt: r.createdAt,
      requester: r.requesterId ? { _id: r.requesterId._id, username: r.requesterId.username, email: r.requesterId.email } : null
    })));
  } catch (e) {
    console.error(e);
    res.status(500).json([]);
  }
});

app.post('/api/admin/group-creation-requests/:id/approve', requireAdmin, async (req, res) => {
  try {
    const reqDoc = await GroupCreationRequest.findById(req.params.id);
    if (!reqDoc || reqDoc.status !== 'pending') return res.status(404).json({ ok: false });

    let slug = generateGroupSlug();
    let tries = 0;
    while (await Group.findOne({ slug }) && tries < 10) {
      slug = generateGroupSlug();
      tries++;
    }
    if (await Group.findOne({ slug })) return res.status(500).json({ ok: false, reason: 'slug' });

    const group = await Group.create({
      name: reqDoc.name,
      slug,
      leaderUserId: reqDoc.requesterId,
      church: reqDoc.church,
      bibleVerse: reqDoc.bibleVerse
    });

    await Membership.create({
      userId: reqDoc.requesterId,
      groupId: group._id,
      role: 'admin'
    });

    reqDoc.status = 'approved';
    reqDoc.createdGroupId = group._id;
    reqDoc.reviewedAt = new Date();
    await reqDoc.save();

    res.json({ ok: true, groupId: group._id, slug: group.slug });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

app.post('/api/admin/group-creation-requests/:id/reject', requireAdmin, async (req, res) => {
  try {
    const reqDoc = await GroupCreationRequest.findById(req.params.id);
    if (!reqDoc || reqDoc.status !== 'pending') return res.status(404).json({ ok: false });

    reqDoc.status = 'rejected';
    reqDoc.reviewedAt = new Date();
    await reqDoc.save();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

// ================== 채팅: roomId 헬퍼 ==================
function getRoomId(id1, id2) {
  const a = String(id1);
  const b = String(id2);
  return a < b ? a + '_' + b : b + '_' + a;
}

// ================== 채팅 API ==================
const socketTokens = new Map(); // token -> userId (단기)

app.get('/api/chat/socket-token', requireLogin, (req, res) => {
  const token = require('crypto').randomBytes(24).toString('hex');
  socketTokens.set(token, req.session.userId);
  setTimeout(() => socketTokens.delete(token), 60000);
  res.json({ token });
});

app.get('/api/chat/rooms', requireLogin, async (req, res) => {
  try {
    const me = req.session.userId;
    const messages = await ChatMessage.find({
      $or: [{ senderId: me }, { receiverId: me }]
    }).sort({ createdAt: -1 });

    const otherIds = new Set();
    messages.forEach(m => {
      const other = m.senderId.toString() === me ? m.receiverId : m.senderId;
      otherIds.add(other.toString());
    });

    const metas = await UserChatMeta.find({ userId: me });
    const metaByOther = {};
    metas.forEach(m => {
      metaByOther[m.otherUserId.toString()] = m;
    });

    const users = await User.find({ _id: { $in: Array.from(otherIds) } })
      .select('_id username');
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    const lastByRoom = {};
    messages.forEach(m => {
      const other = m.senderId.toString() === me ? m.receiverId.toString() : m.senderId.toString();
      if (!lastByRoom[other]) lastByRoom[other] = m;
    });

    const rooms = [];
    for (const otherId of otherIds) {
      const meta = metaByOther[otherId] || {};
      const lastMsg = lastByRoom[otherId];
      const lastOpened = meta.lastOpenedAt || new Date(0);
      const unread = await ChatMessage.countDocuments({
        senderId: new mongoose.Types.ObjectId(otherId),
        receiverId: new mongoose.Types.ObjectId(me),
        createdAt: { $gt: lastOpened }
      });
      rooms.push({
        roomId: getRoomId(me, otherId),
        otherUser: userMap[otherId] ? { _id: userMap[otherId]._id, username: userMap[otherId].username } : { _id: otherId, username: '?' },
        lastMessage: lastMsg ? { content: lastMsg.content, createdAt: lastMsg.createdAt } : null,
        unreadCount: unread,
        pinned: !!meta.pinnedAt,
        pinnedAt: meta.pinnedAt || null
      });
    }

    rooms.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      if (a.pinned && b.pinned) return (b.pinnedAt || 0) - (a.pinnedAt || 0);
      const at = a.lastMessage ? a.lastMessage.createdAt : 0;
      const bt = b.lastMessage ? b.lastMessage.createdAt : 0;
      return new Date(bt) - new Date(at);
    });
    res.json(rooms);
  } catch (e) {
    console.error(e);
    res.status(500).json([]);
  }
});

app.get('/api/chat/users/search', requireLogin, async (req, res) => {
  try {
    const q = (req.query.q || '').trim().toLowerCase();
    const me = req.session.userId;
    const filter = { isApproved: true, _id: { $ne: me } };
    if (q) {
      filter.$or = [
        { username: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') }
      ];
    }
    const users = await User.find(filter).select('_id username').limit(20);
    res.json(users);
  } catch (e) {
    console.error(e);
    res.status(500).json([]);
  }
});

app.post('/api/chat/rooms', requireLogin, async (req, res) => {
  try {
    const otherId = req.body.otherUserId;
    if (!otherId) return res.status(400).json({ ok: false });
    const me = req.session.userId;
    const roomId = getRoomId(me, otherId);
    res.json({ ok: true, roomId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

app.get('/api/chat/rooms/:roomId/messages', requireLogin, async (req, res) => {
  try {
    const me = req.session.userId;
    const roomId = req.params.roomId;
    const parts = roomId.split('_');
    if (parts.length !== 2 || (parts[0] !== me && parts[1] !== me)) {
      return res.status(403).json([]);
    }
    const messages = await ChatMessage.find({
      $or: [
        { senderId: new mongoose.Types.ObjectId(parts[0]), receiverId: new mongoose.Types.ObjectId(parts[1]) },
        { senderId: new mongoose.Types.ObjectId(parts[1]), receiverId: new mongoose.Types.ObjectId(parts[0]) }
      ]
    }).sort({ createdAt: 1 }).limit(200).lean();
    res.json(messages);
  } catch (e) {
    console.error(e);
    res.status(500).json([]);
  }
});

app.post('/api/chat/rooms/:roomId/open', requireLogin, async (req, res) => {
  try {
    const me = req.session.userId;
    const roomId = req.params.roomId;
    const parts = roomId.split('_');
    if (parts.length !== 2 || (parts[0] !== me && parts[1] !== me)) {
      return res.status(403).json({ ok: false });
    }
    const otherId = parts[0] === me ? parts[1] : parts[0];
    await UserChatMeta.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(me), otherUserId: new mongoose.Types.ObjectId(otherId) },
      { $set: { lastOpenedAt: new Date() } },
      { upsert: true }
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

app.post('/api/chat/rooms/:roomId/pin', requireLogin, async (req, res) => {
  try {
    const me = req.session.userId;
    const roomId = req.params.roomId;
    const parts = roomId.split('_');
    if (parts.length !== 2 || (parts[0] !== me && parts[1] !== me)) {
      return res.status(403).json({ ok: false });
    }
    const otherId = parts[0] === me ? parts[1] : parts[0];
    await UserChatMeta.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(me), otherUserId: new mongoose.Types.ObjectId(otherId) },
      { $set: { pinnedAt: new Date() } },
      { upsert: true }
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

app.delete('/api/chat/rooms/:roomId/pin', requireLogin, async (req, res) => {
  try {
    const me = req.session.userId;
    const roomId = req.params.roomId;
    const parts = roomId.split('_');
    if (parts.length !== 2 || (parts[0] !== me && parts[1] !== me)) {
      return res.status(403).json({ ok: false });
    }
    const otherId = parts[0] === me ? parts[1] : parts[0];
    await UserChatMeta.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(me), otherUserId: new mongoose.Types.ObjectId(otherId) },
      { $set: { pinnedAt: null } }
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

// ================== 일정(달력) API ==================
function clampRange(from, to) {
  const f = from ? new Date(from) : null;
  const t = to ? new Date(to) : null;
  if (f && isNaN(f.getTime())) return { ok: false };
  if (t && isNaN(t.getTime())) return { ok: false };
  // default: +/- 45 days
  const now = new Date();
  const fromAt = f || new Date(now.getTime() - 45 * 24 * 3600 * 1000);
  const toAt = t || new Date(now.getTime() + 45 * 24 * 3600 * 1000);
  // prevent abuse: max 400 days
  if (toAt.getTime() - fromAt.getTime() > 400 * 24 * 3600 * 1000) return { ok: false };
  return { ok: true, fromAt, toAt };
}

// 일정 조회: 개인 + 관리자(글로벌)
app.get('/api/schedule', requireLogin, async (req, res) => {
  try {
    const me = req.session.userId;
    const r = clampRange(req.query.from, req.query.to);
    if (!r.ok) return res.status(400).json([]);

    const fromAt = r.fromAt;
    const toAt = r.toAt;
    const query = {
      $or: [
        { scope: 'global' },
        { scope: 'personal', ownerUserId: new mongoose.Types.ObjectId(me) }
      ],
      // overlap range: start < to && end > from
      startAt: { $lt: toAt },
      endAt: { $gt: fromAt }
    };

    const events = await ScheduleEvent.find(query)
      .sort({ startAt: 1 })
      .lean();

    res.json(events.map(e => ({
      _id: e._id,
      scope: e.scope,
      ownerUserId: e.ownerUserId,
      title: e.title,
      description: e.description || '',
      startAt: e.startAt,
      endAt: e.endAt,
      allDay: !!e.allDay,
      color: e.color || '#ffcd38',
      createdAt: e.createdAt,
      updatedAt: e.updatedAt
    })));
  } catch (e) {
    console.error(e);
    res.status(500).json([]);
  }
});

// 개인 일정 생성
app.post('/api/schedule', requireLogin, async (req, res) => {
  try {
    const me = req.session.userId;
    const { title, description, startAt, endAt, allDay, color } = req.body || {};
    const s = new Date(startAt);
    const e = new Date(endAt);
    if (!title || !startAt || !endAt || isNaN(s.getTime()) || isNaN(e.getTime()) || e.getTime() < s.getTime()) {
      return res.status(400).json({ ok: false });
    }
    const ev = await ScheduleEvent.create({
      scope: 'personal',
      ownerUserId: new mongoose.Types.ObjectId(me),
      title: String(title).trim(),
      description: String(description || '').trim(),
      startAt: s,
      endAt: e,
      allDay: !!allDay,
      color: color || '#ffcd38',
      createdBy: new mongoose.Types.ObjectId(me)
    });
    res.json({ ok: true, _id: ev._id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

// 개인 일정 수정(본인만) + 글로벌 수정(관리자만)
app.put('/api/schedule/:id', requireLogin, async (req, res) => {
  try {
    const me = req.session.userId;
    const ev = await ScheduleEvent.findById(req.params.id);
    if (!ev) return res.status(404).json({ ok: false });

    const meUser = await User.findById(me).select('role').lean();
    const isAdmin = meUser && meUser.role === 'admin';
    const isOwner = ev.scope === 'personal' && ev.ownerUserId && ev.ownerUserId.toString() === String(me);
    if (ev.scope === 'global' && !isAdmin) return res.status(403).json({ ok: false });
    if (ev.scope === 'personal' && !isOwner) return res.status(403).json({ ok: false });

    const { title, description, startAt, endAt, allDay, color } = req.body || {};
    if (title != null) ev.title = String(title).trim();
    if (description != null) ev.description = String(description || '').trim();
    if (startAt != null) ev.startAt = new Date(startAt);
    if (endAt != null) ev.endAt = new Date(endAt);
    if (allDay != null) ev.allDay = !!allDay;
    if (color != null) ev.color = String(color || '#ffcd38');
    if (isNaN(ev.startAt.getTime()) || isNaN(ev.endAt.getTime()) || ev.endAt.getTime() < ev.startAt.getTime()) {
      return res.status(400).json({ ok: false });
    }
    await ev.save();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

app.delete('/api/schedule/:id', requireLogin, async (req, res) => {
  try {
    const me = req.session.userId;
    const ev = await ScheduleEvent.findById(req.params.id);
    if (!ev) return res.status(404).json({ ok: false });

    const meUser = await User.findById(me).select('role').lean();
    const isAdmin = meUser && meUser.role === 'admin';
    const isOwner = ev.scope === 'personal' && ev.ownerUserId && ev.ownerUserId.toString() === String(me);
    if (ev.scope === 'global' && !isAdmin) return res.status(403).json({ ok: false });
    if (ev.scope === 'personal' && !isOwner) return res.status(403).json({ ok: false });

    await ScheduleEvent.deleteOne({ _id: ev._id });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

// 관리자: 글로벌 일정 CRUD
app.get('/api/admin/schedule', requireAdmin, async (req, res) => {
  try {
    const r = clampRange(req.query.from, req.query.to);
    if (!r.ok) return res.status(400).json([]);
    const events = await ScheduleEvent.find({
      scope: 'global',
      startAt: { $lt: r.toAt },
      endAt: { $gt: r.fromAt }
    }).sort({ startAt: 1 }).lean();
    res.json(events);
  } catch (e) {
    console.error(e);
    res.status(500).json([]);
  }
});

app.post('/api/admin/schedule', requireAdmin, async (req, res) => {
  try {
    const { title, description, startAt, endAt, allDay, color } = req.body || {};
    const s = new Date(startAt);
    const e = new Date(endAt);
    if (!title || !startAt || !endAt || isNaN(s.getTime()) || isNaN(e.getTime()) || e.getTime() < s.getTime()) {
      return res.status(400).json({ ok: false });
    }
    const ev = await ScheduleEvent.create({
      scope: 'global',
      title: String(title).trim(),
      description: String(description || '').trim(),
      startAt: s,
      endAt: e,
      allDay: !!allDay,
      color: color || '#ffcd38',
      createdBy: new mongoose.Types.ObjectId(req.session.userId)
    });
    res.json({ ok: true, _id: ev._id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

app.put('/api/admin/schedule/:id', requireAdmin, async (req, res) => {
  try {
    const ev = await ScheduleEvent.findById(req.params.id);
    if (!ev || ev.scope !== 'global') return res.status(404).json({ ok: false });
    const { title, description, startAt, endAt, allDay, color } = req.body || {};
    if (title != null) ev.title = String(title).trim();
    if (description != null) ev.description = String(description || '').trim();
    if (startAt != null) ev.startAt = new Date(startAt);
    if (endAt != null) ev.endAt = new Date(endAt);
    if (allDay != null) ev.allDay = !!allDay;
    if (color != null) ev.color = String(color || '#ffcd38');
    if (isNaN(ev.startAt.getTime()) || isNaN(ev.endAt.getTime()) || ev.endAt.getTime() < ev.startAt.getTime()) {
      return res.status(400).json({ ok: false });
    }
    await ev.save();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

app.delete('/api/admin/schedule/:id', requireAdmin, async (req, res) => {
  try {
    const ev = await ScheduleEvent.findById(req.params.id);
    if (!ev || ev.scope !== 'global') return res.status(404).json({ ok: false });
    await ScheduleEvent.deleteOne({ _id: ev._id });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

// ================== ADMIN API ==================
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

app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    await User.deleteOne({ _id: req.params.id, isApproved: false });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

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

app.delete('/api/admin/posts/:id', requireAdmin, async (req, res) => {
  try {
    await Post.deleteOne({ _id: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

// ================== HTTP 서버 + Socket.IO ==================
const server = http.createServer(app);
const io = new SocketIOServer(server);

const onlineUsers = new Set(); // userId strings

io.on('connection', (socket) => {
  let userId = null;

  socket.on('auth', (token) => {
    userId = socketTokens.get(token);
    if (!userId) return socket.disconnect(true);
    socketTokens.delete(token);
    userId = String(userId);
    socket.join('user:' + userId);
    onlineUsers.add(userId);
    io.emit('user:online', userId);
  });

  socket.on('disconnect', () => {
    if (userId) {
      onlineUsers.delete(userId);
      io.emit('user:offline', userId);
    }
  });

  socket.on('chat:message', async (data) => {
    if (!userId || !data || !data.roomId || !data.content) return;
    const parts = String(data.roomId).split('_');
    if (parts.length !== 2) return;
    const me = userId;
    const other = parts[0] === me ? parts[1] : parts[0];
    if (parts[0] !== me && parts[1] !== me) return;
    const content = String(data.content).trim();
    if (!content) return;
    try {
      const msg = new ChatMessage({
        senderId: new mongoose.Types.ObjectId(me),
        receiverId: new mongoose.Types.ObjectId(other),
        content
      });
      await msg.save();
      const payload = { _id: msg._id, senderId: me, receiverId: other, content: msg.content, createdAt: msg.createdAt };
      io.to('user:' + me).emit('chat:new_message', payload);
      io.to('user:' + other).emit('chat:new_message', payload);
    } catch (e) {
      console.error(e);
    }
  });
});

app.get('/api/chat/online', requireLogin, (req, res) => {
  res.json(Array.from(onlineUsers));
});

// Express 5: async 라우트에서 던진 오류 등 처리 — 미처리 시 응답이 끝나지 않아 브라우저에 invalid response 가 날 수 있음
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) return;
  if (req.path.startsWith('/api')) {
    return res.status(500).json({ ok: false, reason: 'server_error' });
  }
  res.status(500).send('서버 오류가 발생했어요. 잠시 후 다시 시도해 주세요.');
});

process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection:', reason);
});

// ================== 서버 시작 ==================
const PORT = Number(process.env.PORT) || 3000;
server.on('error', (e) => {
  console.error('HTTP server error:', e.message);
});
server.listen(PORT, () => {
  console.log('브라우저 주소: http://127.0.0.1:' + PORT + ' (반드시 http:// 사용, https 아님)');
});
