# seongjang (`web/`)

- **Priority:** keep new/edited code as simple as possible (fewest lines, no extra docs/comments unless needed).

- **Stack:** Next.js 16 App Router, React 19, Auth.js, Prisma 7, PostgreSQL. Vercel root = `web/`.
- **Env:** Copy `.env.example` → `.env`. Need `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL` (no trailing slash). Optional: `DIRECT_URL` (Neon direct for migrations), `REGISTRATION_AUTO_APPROVE=1`. Dev: `AUTH_DEV_SESSION_EPOCH` injected by `next.config.ts` in non-production.
- **Commands:** `npm install`, `npm run dev`. DB: `npx prisma migrate dev`, `npx prisma generate`, `npx tsx prisma/seed.ts`.
- **DB adapters:** Neon URL → `@prisma/adapter-neon` + `ws`; else `@prisma/adapter-pg` + `pg` Pool. Build may use placeholder `DATABASE_URL` when `NEXT_PHASE=phase-production-build`.
- **Admin (dev):** login `a` / `a` → `admin@seongjang.local`. Seed also creates `dev@seongjang.local` / `devpassword`.
- **UI:** Accent `#ffcd38` — use `--accent` / Tailwind `accent` tokens in `globals.css`; see `.cursor/rules/brand-color.mdc`.

Read `node_modules/next/dist/docs/` if Next APIs differ from training data.
