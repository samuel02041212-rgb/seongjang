import Link from "next/link";

import { LandingHeader } from "@/components/shell/landing-header";
import { auth } from "@/lib/server-auth";

const pillars = [
  {
    title: "말씀 묵상",
    body: "개역한글 성경 뷰어로 권·장 이동과 검색까지. 하루 한 구절도 깊이 읽을 수 있게 돕습니다.",
  },
  {
    title: "소그룹 & 교제",
    body: "합동·slug 방, 가입·승인 흐름으로 익숙한 공동체 리듬을 유지합니다.",
  },
  {
    title: "가벼운 운영",
    body: "Next + Postgres + Prisma 한 갈래로 API를 단순화해 1인 유지보수에 맞췄습니다.",
  },
];

export default async function Home() {
  const session = await auth();
  const loggedIn = !!session?.user?.id;

  return (
    <div className="flex min-h-full flex-col">
      <LandingHeader loggedIn={loggedIn} />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-line/60">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-accent/25 blur-3xl"
          />

          <div className="relative mx-auto max-w-5xl px-5 py-20 sm:px-8 sm:py-28">
            <p className="mb-4 inline-flex items-center rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium tracking-wide text-muted">
              새 스택으로 다시 심는 중
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl sm:leading-tight">
              믿음 안에서{" "}
              <span className="text-accent">함께 자라는</span> 공간,
              성장입니다.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              게시·댓글·소그룹·일정까지, 커뮤니티의 일상을 한곳에 모읍니다.
              교제 채팅은 화면 오른쪽 패널(💬)에서 이어갑니다.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href={loggedIn ? "/feed" : "/login"}
                className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-md transition hover:-translate-y-0.5 hover:bg-accent/90"
              >
                {loggedIn ? "피드로" : "시작하기"}
              </Link>
              <a
                href="#pillars"
                className="inline-flex items-center justify-center rounded-full border border-line bg-surface px-6 py-3 text-sm font-semibold text-ink transition hover:border-accent/40 hover:text-accent"
              >
                무엇을 담는지
              </a>
            </div>
          </div>
        </section>

        <section
          id="pillars"
          className="mx-auto max-w-5xl px-5 py-20 sm:px-8 sm:py-24"
        >
          <div className="mb-12 max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              익숙한 경험, 더 단순한 바탕
            </h2>
            <p className="mt-3 text-muted">
              예전 서비스에서 쓰던 흐름을 기억해 두고, 기술 부채만 가볍게 걷어
              냅니다.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {pillars.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-line bg-surface p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-ink">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-line/60 bg-accent-soft/40">
          <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 px-5 py-16 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div>
              <h2 className="text-xl font-semibold text-ink">도메인은 그대로</h2>
              <p className="mt-2 text-sm text-muted">
                배포가 정해지면 DNS만 새 호스트에 맞추면 됩니다.
              </p>
            </div>
            <Link
              href="/feed"
              className="rounded-full border border-accent/30 bg-surface px-5 py-2.5 text-sm font-semibold text-accent transition hover:bg-white"
            >
              피드 보기
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
