import { LandingHeader } from "@/components/shell/landing-header";
import { auth } from "@/lib/server-auth";

const works = [
  {
    code: "NS001",
    name: "말씀 묵상",
    category: "Bible Reading",
    year: "2026",
    desc: "개역한글 본문을 권·장으로 이동하며, 같은 화면에서 짧은 묵상을 적습니다. 사진을 곁들이면 그날의 장면이 같이 남습니다.",
  },
  {
    code: "NS002",
    name: "메인 피드",
    category: "Feed",
    year: "2026",
    desc: "공동체의 묵상이 시간 순으로 쌓이는 마당. 카드 하나하나가 짧은 한 통의 편지처럼 읽힙니다.",
  },
  {
    code: "NS003",
    name: "소그룹 교제",
    category: "Community",
    year: "2026",
    desc: "합동·자유 모임 단위로 가입과 승인을 거쳐, 익숙한 공동체의 리듬을 그대로 옮겨 놓습니다.",
  },
  {
    code: "NS004",
    name: "성경 공부",
    category: "Study",
    year: "2026",
    desc: "본문을 함께 펴 두고, 질문과 메모를 나란히 적어 가는 자리. 가르치고 배우는 흐름을 한 곳에 둡니다.",
  },
  {
    code: "NS005",
    name: "1:1 채팅",
    category: "Direct Message",
    year: "2026",
    desc: "공개된 글로 다 담지 못하는 이야기는 한 사람과 한 사람 사이에 둡니다. 가볍게, 조용히.",
  },
  {
    code: "NS006",
    name: "프로필 · 설정",
    category: "Account",
    year: "2026",
    desc: "이름, 사진, 그리고 화면을 보는 방식까지. 작은 선택들이 모여 자신만의 자리가 됩니다.",
  },
];

const plates = [
  { code: "P-01", caption: "Image · TBD" },
  { code: "P-02", caption: "Image · TBD" },
  { code: "P-03", caption: "Image · TBD" },
  { code: "P-04", caption: "Image · TBD" },
  { code: "P-05", caption: "Image · TBD" },
  { code: "P-06", caption: "Image · TBD" },
];

const principles = [
  {
    n: "01",
    title: "정직한 구조",
    body: "감춰진 트릭 없이, 화면 뒤의 구조도 가능한 한 단순하게. 다음 사람이 와도 같은 결로 이어 갈 수 있도록 둡니다.",
  },
  {
    n: "02",
    title: "절제된 형식",
    body: "장식보다 위계, 효과보다 여백. 가장 좋은 인터페이스는 사용자가 인터페이스를 잊는 순간이라고 믿습니다.",
  },
  {
    n: "03",
    title: "오래 가는 흐름",
    body: "유행은 빠르고, 신앙의 호흡은 깁니다. 시간이 지나도 부끄럽지 않을 결정만 천천히 쌓아 갑니다.",
  },
  {
    n: "04",
    title: "공동의 기억",
    body: "한 사람의 묵상이 다른 사람의 하루로 옮겨 가는 순간을 위해. 작은 글 하나도 기록처럼 다룹니다.",
  },
];

const colophon = [
  ["Stack", "Next.js · React · Prisma · Postgres"],
  ["Type", "Noto Sans KR · JetBrains Mono"],
  ["Hosting", "Vercel · Neon · Vercel Blob"],
  ["License", "All rights reserved · 2026"],
  ["Contact", "contact@seongjang.kr"],
  ["Place", "대한민국 서울"],
];

export default async function Home() {
  const session = await auth();
  const loggedIn = !!session?.user?.id;

  return (
    <div className="flex min-h-full flex-col bg-bg">
      <LandingHeader loggedIn={loggedIn} />

      <main className="flex-1" style={{ zoom: 0.93 }}>
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-14 sm:pt-20">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-3 font-mono text-xs uppercase tracking-[0.25em] text-muted">
            <span>NS · 2026 Archive · Vol. 01</span>
            <span>Seoul · KR</span>
            <span>Issue No. 001</span>
          </div>

          <h1 className="max-w-5xl font-display text-4xl leading-[1.12] tracking-tight text-ink sm:text-5xl md:text-6xl">
            믿음 안에서{" "}
            <span className="relative inline-block">
              <span className="relative z-10">함께</span>
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-1 -z-0 h-3 bg-accent/70"
              />
            </span>{" "}
            자라는 공간,
            <br />
            매일의 한 줄을 모으는 자리.
          </h1>

          <div className="mt-12 grid gap-10 md:grid-cols-[1fr_1fr_1fr]">
            <p className="font-emotional text-sm leading-relaxed text-ink">
              성경나눔장소는 말씀과 일상을 잇는 작은 도구입니다. 매일의 묵상,
              가벼운 교제, 오래 가는 공동체의 리듬을 한곳에 둡니다.
            </p>
            <p className="font-emotional text-sm leading-relaxed text-muted">
              우리는 새로운 기능을 만들기보다, 이미 익숙했던 흐름을 더 단순한
              바탕 위에 다시 심습니다. 화면은 비어 있어도, 그 안의 시간은 두텁게
              쌓이도록.
            </p>
            <p className="font-emotional text-sm leading-relaxed text-muted">
              한 사람의 묵상이 다른 사람의 하루로 옮겨 갑니다. 그래서 우리는
              화려한 장식보다, 오래 견디는 형식과 정직한 구조에 마음을 둡니다.
            </p>
          </div>
        </section>

        <section className="border-y border-line bg-accent-soft/40">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[2fr_1fr]">
            <p className="font-emotional text-2xl leading-snug tracking-tight text-ink sm:text-3xl">
              <span className="text-accent">“</span>가장 좋은 공동체는 기억의
              장치입니다 — 사용과 시간 속에서 의미가 깊어지는 그릇. 짧은 한 줄도
              그 안에서 오래 머무릅니다.<span className="text-accent">”</span>
            </p>
            <div className="space-y-2 self-end font-mono text-xs uppercase tracking-[0.2em] text-muted">
              <p>— Editor’s Note</p>
              <p>2026 · Seoul</p>
              <p>NS · Vol. 01</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-8 flex items-end justify-between gap-4 border-b border-ink pb-3">
            <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-muted">
              Index — 담는 것
            </h2>
            <span className="font-mono text-xs tabular-nums text-muted">
              {works.length.toString().padStart(2, "0")} entries · 2026
            </span>
          </div>

          <ul className="divide-y divide-line">
            {works.map((w) => (
              <li
                key={w.code}
                className="grid grid-cols-[4.5rem_1fr] items-start gap-4 py-6 sm:grid-cols-[4.5rem_minmax(0,12rem)_minmax(0,1fr)_7rem_3rem]"
              >
                <span className="font-mono text-xs tracking-wider text-muted">
                  {w.code}
                </span>
                <span className="font-display text-lg text-ink">{w.name}</span>
                <span className="hidden font-emotional text-sm leading-relaxed text-muted sm:block">
                  {w.desc}
                </span>
                <span className="hidden font-mono text-xs uppercase tracking-wider text-muted sm:inline">
                  {w.category}
                </span>
                <span className="hidden text-right font-mono text-xs tabular-nums text-muted sm:inline">
                  {w.year}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-line bg-accent-soft/25">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="mb-10 flex items-end justify-between gap-4 border-b border-ink pb-3">
              <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-muted">
                Principles — 우리가 따르는 결
              </h2>
              <span className="font-mono text-xs tabular-nums text-muted">
                04 articles
              </span>
            </div>
            <div className="grid gap-x-10 gap-y-12 md:grid-cols-2">
              {principles.map((p) => (
                <article
                  key={p.n}
                  className="grid grid-cols-[3rem_1fr] gap-4 border-t border-line pt-6"
                >
                  <span className="font-mono text-xs tracking-wider text-accent">
                    {p.n}
                  </span>
                  <div>
                    <h3 className="mb-2 font-display text-lg text-ink">
                      {p.title}
                    </h3>
                    <p className="font-emotional text-sm leading-relaxed text-muted">
                      {p.body}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-8 flex items-end justify-between gap-4 border-b border-ink pb-3">
            <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-muted">
              Plates — 빈 장면
            </h2>
            <span className="font-mono text-xs tabular-nums text-muted">
              {plates.length.toString().padStart(2, "0")} plates · placeholders
            </span>
          </div>
          <p className="mb-10 max-w-2xl font-emotional text-sm leading-relaxed text-muted">
            이 자리는 비어 있습니다. 같이 채워 갈 사진과 그날의 본문을 위해
            남겨둔 자리입니다. 테두리만 두고, 안은 시간이 채우도록.
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plates.map((p) => (
              <figure key={p.code} className="space-y-2">
                <div className="aspect-square border border-ink bg-transparent" />
                <figcaption className="flex items-center justify-between font-mono text-xs text-muted">
                  <span className="tracking-wider">{p.code}</span>
                  <span>{p.caption}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[1fr_1fr]">
            <div>
              <h2 className="mb-6 font-mono text-xs uppercase tracking-[0.25em] text-muted">
                About — 짧은 소개
              </h2>
              <p className="font-emotional text-base leading-relaxed text-ink">
                성경나눔장소는 신앙 공동체의 일상을 담는 작은 도구를 만듭니다.
                정직한 구조, 절제된 형식, 오래 가는 흐름을 지향합니다. 우리가
                만드는 것은 새로운 플랫폼이 아니라, 이미 익숙한 리듬을 더 단순한
                바탕 위에 다시 심는 일입니다.
              </p>
              <p className="mt-6 font-emotional text-sm leading-relaxed text-muted">
                특별한 기능보다 매일의 한 줄, 거대한 커뮤니티보다 한 사람과 한
                사람 사이. 작은 단위의 신실함이 오래 가는 자리를 만든다고
                믿습니다.
              </p>
              <p className="mt-8 font-mono text-xs uppercase tracking-[0.25em] text-muted">
                Established · 2024 · Reborn 2026
              </p>
            </div>

            <div>
              <h2 className="mb-6 font-mono text-xs uppercase tracking-[0.25em] text-muted">
                Colophon — 만든 자리
              </h2>
              <dl className="divide-y divide-line border-y border-line">
                {colophon.map(([k, v]) => (
                  <div
                    key={k}
                    className="grid grid-cols-[6rem_1fr] gap-4 py-3 font-mono text-xs uppercase tracking-[0.15em]"
                  >
                    <dt className="text-muted">{k}</dt>
                    <dd className="text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
