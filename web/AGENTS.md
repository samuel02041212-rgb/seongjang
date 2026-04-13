# seongjang (`web/`)

- **Priority:** keep new/edited code as simple as possible (fewest lines, no extra docs/comments unless needed).

- **Stack:** Next.js 16 App Router, React 19, Auth.js, Prisma 7, PostgreSQL. Vercel root = `web/`.
- **Env:** Copy `.env.example` → `web/.env`. Need `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL` (no trailing slash). Optional: `DIRECT_URL` (Neon direct for migrations), `REGISTRATION_AUTO_APPROVE=1`. Dev: `AUTH_DEV_SESSION_EPOCH` injected by `next.config.ts` in non-production.
- **Same DB as production (local signups visible on prod):** In `web/.env`, set `DATABASE_URL` (and `DIRECT_URL` if you use it) to the **same Neon strings** as Vercel. Copy `AUTH_SECRET` from Vercel too. Keep **`AUTH_URL=http://localhost:3000`** locally (do not use the prod URL here). After that, `npm run dev` reads/writes the shared Neon DB; prod login uses the same user rows. Risk: local scripts/tests can change prod data—treat carefully.
- **Commands:** `npm install`, `npm run dev`. DB: `npx prisma migrate dev`, `npx prisma generate`, `npx tsx prisma/seed.ts`. Destructive: `npm run db:reset-admin-only` — wipe + single admin `a`/`a`. `npm run db:delete-all-users` — wipe only; no admin row (re-signup, then set `isAdmin` in DB).
- **DB adapters:** Neon URL → `@prisma/adapter-neon` + `ws`; else `@prisma/adapter-pg` + `pg` Pool. Build may use placeholder `DATABASE_URL` when `NEXT_PHASE=phase-production-build`.
- **Admin (dev):** login `a` / `a` → `admin@seongjang.local`. Seed also creates `dev@seongjang.local` / `devpassword`.
- **UI:** Accent `#ffcd38` — use `--accent` / Tailwind `accent` tokens in `globals.css`; see `.cursor/rules/brand-color.mdc`.

Read `node_modules/next/dist/docs/` if Next APIs differ from training data.
