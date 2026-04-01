# 성장(seongjang) 프로젝트 인수인계 요약

## 1. 왜 새 채팅/새 폴더 맥락으로 온 것처럼 보이는지

| 상황 | 의미 |
|------|------|
| 프로젝트 폴더 삭제·재생성 | 로컬 파일·히스토리가 바뀌었고, IDE 채팅도 예전 워크스페이스와 끊길 수 있음. |
| 채팅 “날아감” | 보통 코드와 무관하고, 이전 대화 스레드/워크스페이스 ID에 묶인 메모리라 새 채팅에 안 붙는 것처럼 느껴짐. GitHub·서버·본인 메모가 진짜 기록 저장소. |
| 목표 전환 | 기존 스택 유지보수보다 처음부터 단순한 스택으로 재구축(Next + Postgres + Prisma + Auth.js 방향)을 택했음. |

## 2. 코드가 어디에 살아 있는지 (로컬을 지웠다면)

- **원격 GitHub(이름은 대화 기준):** `samuel02041212-rgb/seongjang`

### 의미 있는 커밋 예시(대략)

- 1.2.0 릴리스(성경 뷰어 등)
- Express 리다이렉트 루프 수정 (`trust proxy`, `GET /` 502 안내, `hostsMatchFrontend`/`wouldRedirectToSameUrl` 등)
- bridge 통합 `web/lib/expressBridge.ts`, 세션 쿠키 옵션 보강
- nginx 예시 `deploy/nginx-next-proxy.example.conf` (`/socket.io` → 3000)

### 로컬을 비운 상태라면 새 작업 첫 단계

```bash
git clone https://github.com/samuel02041212-rgb/seongjang.git
cd seongjang
```

(원격 주소·권한은 본인 GitHub 기준으로 확인.)

### 로컬 1.2.0 백업 폴더 (레거시 전체 클론)

새 채팅·IDE에서도 경로를 잃지 않도록 **이 PC 기준 백업 루트**를 고정해 둡니다.

`D:\박종혁\신학\모임\연합 성장(23.12.16 이후)\연합성장_2026\성장_웹\1.2.0 백업\seongjang-backup`

| 용도 | 백업 내 경로 예시 |
|------|-------------------|
| 관리자 페이지·탭 UI | `web/app/admin/`, `web/components/admin/AdminShell.tsx` |
| 관리자 클라이언트 로직 | `public/js/admin-dashboard.js`, `public/css/admin-dashboard.css` |
| 관리자 API (Express) | `server.js` — `GET/POST/DELETE /api/admin/...` |
| 관리자 가드 | `middlewares/requireAdmin.js`, `web/components/RequireAdmin.tsx` |

재구축(`d:\seongjang\web`)에서는 Auth.js 세션의 **관리자 계정**(`lib/auth-constants.ts`의 `admin@seongjang.local`, 로그인 핸들 `a`/`a`)으로 `/admin` 과 동일 역할 API를 사용합니다.

## 3. 기존 스택 한 줄 정리 (레거시 / 참고용)

- **백엔드:** Node Express 5 + MongoDB(Mongoose) + express-session + Socket.IO (같은 HTTP 서버).
- **프론트:** Next.js 16 App Router + React 19 (`web/`).
- **연결:** Next rewrites로 `/api`, 정적, `/socket.io` 등을 Express(기본 3000) 로 넘김. 로그인은 `/api/bridge/login|register|logout` 이 Express의 `POST /login` 등으로 프록시 + Set-Cookie 전달.
- **배포(실서버):** Ubuntu, PM2 두 개 — `seongjang` = Express, `seongjang-web` = Next(`next start`, `PORT=3001`). nginx: `location /` → 3001, `location /socket.io/` → 3000(WebSocket), `.env`에 `NODE_ENV=production`, `FRONTEND_ORIGIN=https://실제도메인`.

## 4. 기존에 구현돼 있던 기능 인벤토리 (재구현 시 체크리스트)

### 인증·계정

- 회원가입(승인 대기), 로그인/로그아웃, 세션
- 프로필·상태메시지·프로필 이미지 업로드
- 관리자 역할(role)

### 콘텐츠

- 게시글 CRUD, 피드, 좋아요, 댓글
- 성경 참조(`bibleRef`), 이미지 다중, 소그룹에만 보이기(`visibleGroupIds`)

### 말씀묵상

- 전용 페이지 + 개역한글 뷰어(검색, 권명, 장 이동, 레이아웃 등) — 데이터는 `web/public/bible/krv.json`, 빌드 스크립트 `npm run bible:build-krv` (`scripts/krv-txt-to-json.mjs`)

### 소그룹

- 내 그룹, 합동(union), slug 방, 검색, 가입 신청, 리더 승인/거절, 소그룹 개설 신청, 관리자 승인

### 채팅(1:1)

- **REST:** 방·메시지·검색·핀·읽음 등
- **실시간:** Socket.IO + 짧게 쓰는 socket-token
- **프론트:** `public/js/chat.js` + partial — nginx에서 `/socket.io`를 Express로 직접 넘겨야 안정적

### 일정

- 사용자용 + 관리자용 Schedule API

### 관리자

- Next `/admin` + 정적 `admin-dashboard.js` 탭으로 사용자/게시글/일정/그룹 신청 등

### 기타

- 랜딩, 성경연구(`/study`) 는 UI만 있고 “coming soon” 수준
- Expo 모바일 스캐폴드(`mobile/`) — API는 Express 기준

## 5. 앞으로의 개발 방침(사용자 결정 요약)

- 일정 압박 없음, 1인 개발, 우선순위는 유지보수 단순 + UX.
- 실무적으로 선호한 목표 스택:
  - Next(App Router) + PostgreSQL + Prisma(또는 Drizzle) + Auth.js(또는 Clerk)
  - 실시간·배치·무거운 작업은 매니지드 또는 작은 전용 서비스로 분리 검토.
- 전체 갈아엎기도 허용 — 단, 화면 스캐폴드가 빠른 것이지 도메인 전체를 다시 짜는 시간은 별개.

## 6. 새 채팅에서 할 일 — 단계별(한눈에)

### Phase 0 — 맥락 고정 (5~10분)

- 이 문서를 새 채팅 첫 메시지에 붙여넣기.
- Git clone 또는 “로컬 레포 경로” 알려주기.
- 운영 도메인·서버(SSH/Lightsail 등) 필요 여부만 명시.

### Phase 1 — 레포·도구 결정

- 새 레포로 갈지, 기존 레포에 v2 브랜치만 갈지 결정.
- Node 20+, 패키지매니저(npm/pnpm) 통일.
- DB: PostgreSQL 로컬(Docker 권장) + Prisma 초기화.

### Phase 2 — 뼈대

- `create-next-app` (App Router, TypeScript, ESLint).
- Auth.js 또는 Clerk 로 로그인·세션 한 가지 경로로 고정.
- Prisma schema 초안( User → Post → Group → … 순으로 옮기기).

### Phase 3 — 기능 이전 순서(추천)

1. 인증 + `GET /me` 수준
2. 게시글·댓글·좋아요
3. 소그룹·멤버십·가입 플로우
4. 말씀묵상 + 성경 JSON(또는 동일 데이터)
5. 채팅 — 초기엔 매니지드 실시간 또는 별도 작은 Socket 서버 중 선택
6. 관리자·일정
7. 모바일은 웹 안정 후 또는 API 공개 후

### Phase 4 — 배포

- 한 프로세스 원하면 Vercel + Neon 등도 가능; Socket 직접이 필요하면 별도 호스트 또는 nginx 분기 패턴 재사용.
- 마이그레이션: Mongo → Postgres는 스크립트 또는 수동 export 필요(별 작업).

## 7. 운영 서버에서 이미 겪은 이슈(재발 방지)

- `FRONTEND_ORIGIN` 미설정 + nginx가 Express만 태우면 `localhost:3001` 리다이렉트 또는 무한 302.
- Next 없이 Express만 브라우저에 열리면 같은 도메인으로 자기 리다이렉트 루프.
- 채팅: Next만 타면 Socket.IO WebSocket이 불안정할 수 있음 → nginx에서 `/socket.io` → 3000.
- PM2: Node 18 미만이면 Next 16 빌드 경고/실패 — Node 20 권장.
- `npm ci` Killed: 메모리 부족 → swap 또는 더 큰 인스턴스.

## 8. 클라이언트에 남길 메모(선택)

- 도메인: `www.sda-growth.com` 등 실제 사용 hostname / https
- PM2 이름: `seongjang`, `seongjang-web`
- Mongo Atlas URI는 `.env`에만 — 새 DB로 바꿀 때 백업·이전 계획 별도

## 9. 새 채팅 첫 프롬프트 예시 (복사용)

```
[인수인계] 성장(seongjang) 재구축.
- 목표: Next App Router + PostgreSQL + Prisma + Auth.js(또는 Clerk), 1인, 기한 없음, 유지보수·UX 최우선.
- 레거시 기능: (위 인벤토리 전체 — 붙여넣기)
- 코드 원격: (GitHub URL)
- 운영: (있으면 도메인/서버 요약)
지금 할 일: Phase 1~2 — 새 Next 앱 생성 + Prisma + Auth 스캐폴드부터 구체적 명령과 파일 목록으로 진행해줘.
```

이걸 저장해 두었다가 새 채팅 첫 메시지로 쓰면, “왜 새 채팅인지 / 무엇을 복구·이전하는지 / 무엇부터 손대는지”를 같은 전제에서 이어갈 수 있습니다.

다음 레포에 직접 커밋할지는 본인 선택.
