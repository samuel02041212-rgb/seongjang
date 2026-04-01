# Vercel에 올리고 도메인 연결하기 (요약)

Next.js 앱은 **Vercel**에 올리는 경우가 많습니다. **Vercel + Neon**이면 PC를 끄어도 사용자는 24시간 접속 가능합니다(로컬 `npm run dev`와 무관).

`web/package.json`의 빌드는 **`prisma generate && next build`** 로 Prisma 클라이언트가 Vercel에서도 생성됩니다.

---

## 1. GitHub에 코드 올리기

1. [GitHub](https://github.com)에 **새 저장소**를 만듭니다.
2. 로컬에서 `D:\seongjang` 프로젝트를 그 저장소에 **push** 합니다.  
   - **`.env` 파일은 절대 커밋하지 마세요.** (비밀번호·DB 주소)
3. 저장소에 `.gitignore`에 `.env` 가 포함돼 있는지 확인합니다.

---

## 2. Vercel 프로젝트 만들기

1. https://vercel.com 에 가입·로그인 (GitHub 연동 추천)
2. **Add New… → Project**
3. 방금 만든 GitHub 저장소를 **Import**
4. **Root Directory** 를 **`web`** 으로 설정합니다. (저장소 루트가 아니라 `web` 폴더가 Next 앱인 경우)
5. **(권장)** 아래 **「3. 환경 변수」** 절의 **`DATABASE_URL`**, **`AUTH_SECRET`**, **`AUTH_URL`** 을 **먼저** 넣은 뒤 Deploy 합니다. 변수 없이도 빌드는 통과할 수 있지만, **사이트가 실제로 동작하려면** 특히 `DATABASE_URL`이 필수입니다.
6. **Deploy** 를 누릅니다. (환경 변수를 나중에 넣었다면 **⋯ → Redeploy** 로 다시 배포하세요.)

### 실서비스 시작 직후 꼭 할 일

1. **운영 DB에 스키마 반영** — 로컬 `web`에서 운영용 `DATABASE_URL`을 `.env`에 넣고 `npx prisma migrate deploy` (배포 주소와 같은 Neon이면 한 번이면 충분).
2. **관리자 계정** — 프로덕션에서는 개발용 `a`/`a` 자동 생성이 **되지 않습니다**. 한 번만 `npm run db:seed` 로 시드하거나, 회원가입 후 DB에서 `isAdmin`을 켜는 식으로 준비하세요. 시드 비밀번호는 곧 변경하는 것을 권장합니다.
3. **`AUTH_URL`** — 커스텀 도메인을 쓰면 Vercel에 도메인 연결 **후** `AUTH_URL`을 `https://실제도메인`으로 맞추고 Redeploy 하세요.

---

## 3. 환경 변수 (Environment Variables)

Vercel 프로젝트 → **Settings → Environment Variables** 에서 **Production(및 Preview)** 에 다음을 넣습니다.

| 이름 | 값 (예시) |
|------|-----------|
| `DATABASE_URL` | Neon에서 복사한 PostgreSQL URL (**로컬과 같아도 되고**, 운영 전용 DB를 새로 만들어도 됨) |
| `AUTH_SECRET` | 긴 랜덤 문자열 (로컬과 **다른 값** 권장. 터미널에서 `openssl rand -base64 32`) |
| `AUTH_URL` | 배포 URL 예: `https://프로젝트이름.vercel.app` 또는 **커스텀 도메인** `https://www.도메인.com` (**끝에 `/` 없음**) |
| `REGISTRATION_AUTO_APPROVE` | 팀 테스트 중 가입 즉시 로그인 허용이면 `1`, 관리자 승인만 쓰면 비우기 |

저장 후 **Deployments**에서 맨 위 배포의 **⋯ → Redeploy** 로 다시 배포하면 변수가 반영됩니다.

---

## 4. 도메인 연결

1. Vercel 해당 프로젝트 → **Settings → Domains**
2. **도메인 입력** (예: `app.내사이트.kr` 또는 산입한 도메인)
3. Vercel이 알려 주는 **DNS 레코드** (CNAME 또는 A)를 **도메인 업체(가비아, Cloudflare 등)** 에서 그대로 추가합니다.
4. 전파까지 수분~몇 시간 걸릴 수 있습니다.

---

## 5. DB 마이그레이션 (중요)

배포용 Neon DB를 **처음** 쓴다면, 로컬 `web` 폴더에서 **같은 `DATABASE_URL`** 을 `.env`에 잠깐 넣고:

```bash
npx prisma migrate deploy
```

(필요하면 `npm run db:seed` 로 개발용 데이터 — 운영에는 신중히)

---

## 6. 확인

- 브라우저로 `https://(배포주소)/feed` 접속
- **회원가입 → 로그인 → 글 작성** 이 되는지 확인

---

## 빌드 로그: `Error: DATABASE_URL is not set`

- **최신 코드**에서는 빌드 시점에 DB가 없어도 넘어가도록 맞춰 두었습니다. 위 메시지가 나오면 **저장소를 pull 하고 다시 push·Redeploy** 하세요.
- 배포가 된 뒤 **페이지/API가 500** 이면 Vercel **Settings → Environment Variables** 에 **`DATABASE_URL`**(및 `AUTH_SECRET`)이 **Production**에 있는지 확인하고, 넣은 뒤 **Redeploy** 하세요.

---

## 참고

- **Supabase**로 Auth·DB를 옮기는 것은 지금 구조(NextAuth + Prisma + Neon)와 다릅니다. 원하시면 별도 단계에서 설계합니다.
- 문제가 나면 Vercel **Build Logs** / **Functions** 로그와 브라우저 **Network** 탭의 `/api/*` 응답을 확인하세요.
