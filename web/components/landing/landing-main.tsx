import Image from "next/image";

const intro =
  "'성경나눔장소'는 2023년 5월 동액트에서 시작된 청년 말씀묵상모임입니다. 삶에 말씀이 필요한 청년들이 함께 말씀을 나누고 성장 할 수 있는 '장소'입니다.";

const quote = `“그대들은 성경에 정통하지 못하다. 성경의 표준에 도달하고 그리스도인 완전에 도달하려는 소망을 가지고 하나님의 말씀을 연구하였더라면, 그대들은 증언들이 필요치 않았을 것이다.”`;

const instagram = {
  handle: "place_to_share2025",
  href: "https://www.instagram.com/place_to_share2025/",
};

const emails = ["growth0213@gmail.com", "percentcompany2025@gmail.com"];

const facts = [
  { label: "개설일", value: "2023.05.01" },
  { label: "의의", value: "개인신앙의 성장" },
  { label: "목적", value: "말씀의 나눔과 기록" },
  { label: "대표 성경절", value: "딤후 2:22 (2023.12.21)" },
];

const nameHistory = [
  { date: "2023.05.01", name: "동액트 성경나눔장소" },
  { date: "2023.10.11", name: "신학 23 성장" },
  { date: "2023.12.10", name: "원주삼육 성장" },
  { date: "2023.12.16", name: "연합 성장" },
  { date: "2024.03.03", name: "신학 24 성장" },
];

const meditationRounds = [
  { term: "1차 나눔 · 2023 4분기", topic: "각 시대의 대쟁투" },
  { term: "2차 나눔 · 2024 1분기", topic: "믿음과 행함" },
  { term: "3차 나눔 · 2024 2분기", topic: "로마서, 갈라디아서" },
  { term: "4차 나눔 · 2024 3분기", topic: "부조와 선지자(상)" },
  { term: "5차 나눔 · 2024 4분기", topic: "부조와 선지자(하)" },
];

function InstagramIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className="shrink-0"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
      {children}
    </p>
  );
}

function DetailCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
      <div className="border-b border-line bg-accent-soft/40 px-4 py-2.5 sm:px-5">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
      </div>
      <div className="space-y-3 px-4 py-4 text-[15px] leading-relaxed text-ink/90 sm:px-5 sm:text-base">
        {children}
      </div>
    </article>
  );
}

const padX = "px-2 sm:px-4 lg:px-6 xl:px-8";

export function LandingMain() {
  return (
    <main className="relative z-0 w-full bg-bg text-ink">
      <section className={`${padX} pb-1 pt-0 sm:pb-1.5`}>
        <h1
          lang="en"
          className="font-sans text-[clamp(6.34rem,27.3vw,12.68rem)] font-bold leading-[0.95] tracking-tight"
        >
          GROWTH
        </h1>
      </section>

      <section
        className={`grid w-full items-start gap-4 pb-10 sm:gap-5 lg:grid-cols-[minmax(0,2.24fr)_minmax(0,0.85fr)] lg:items-stretch lg:gap-6 lg:pb-14 ${padX}`}
      >
        <div className="relative min-w-0 w-[195%] -ml-[47.5%] lg:ml-0 lg:w-full">
          <div className="rounded-none bg-gradient-to-br from-accent/40 via-line to-accent/20 p-[2px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:from-accent/25 dark:via-line dark:to-accent/10">
            <div className="overflow-hidden rounded-none bg-surface">
              <Image
                src="/images/landing-group.png"
                alt="성경나눔장소 모임 사진"
                width={2400}
                height={1600}
                className="h-auto w-full object-cover"
                priority
                sizes="(min-width: 1024px) 114vw, 195vw"
              />
            </div>
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-6 text-left text-[17px] font-semibold leading-relaxed sm:gap-8 sm:text-lg">
          <p>{intro}</p>
          <p className="font-emotional leading-relaxed">{quote}</p>
          <ul className="mt-auto space-y-0.5 pt-4 text-left text-[16px] font-semibold sm:text-[17px]">
            <li>
              <a
                href={instagram.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-accent-foreground hover:underline"
              >
                <InstagramIcon />
                {instagram.handle}
              </a>
            </li>
            {emails.map((line) => (
              <li key={line}>
                <a
                  href={`mailto:${line}`}
                  className="hover:text-accent-foreground hover:underline"
                >
                  {line}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={`w-full space-y-10 border-t border-line pb-20 pt-10 sm:space-y-12 sm:pt-14 ${padX}`}>
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-10 xl:gap-12">
          <div className="space-y-3 lg:col-span-4 xl:col-span-3">
            <SectionLabel>About</SectionLabel>
            <h2 className="font-display text-[clamp(1.75rem,4vw,2.75rem)] leading-snug text-ink">
              그저 &apos;성경을 나누는&apos; 장소
            </h2>
            <p className="hidden text-[15px] leading-relaxed text-muted lg:block xl:text-base">
              청년들이 함께 말씀을 나누고 성장하는 공동체입니다.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-4 xl:col-span-9">
            {facts.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-line bg-surface px-4 py-4 shadow-sm sm:px-5 sm:py-5"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                  {item.label}
                </p>
                <p className="mt-2 text-[15px] font-semibold leading-snug text-ink sm:text-base">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <blockquote className="-mx-2 border-y border-line bg-accent-soft/25 px-4 py-8 sm:-mx-4 sm:px-8 lg:-mx-6 lg:px-10 xl:-mx-8 xl:px-12">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-10">
            <p className="font-emotional text-[clamp(1rem,2.2vw,1.25rem)] leading-relaxed text-ink">
              &ldquo;또한 네가 청년의 정욕을 피하고 주를 깨끗한 마음으로 부르는
              자들과 함께 의와 믿음과 사랑과 화평을 좇으라...&rdquo;
            </p>
            <footer className="shrink-0 text-sm font-semibold text-muted lg:text-right">
              디모데후서 2:22
            </footer>
          </div>
        </blockquote>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          <div className="space-y-6">
            <div className="space-y-2">
              <SectionLabel>History</SectionLabel>
              <h2 className="text-[clamp(1.35rem,2.5vw,1.75rem)] font-semibold text-ink">
                명칭
              </h2>
              <p className="text-[15px] leading-relaxed text-muted sm:text-base">
                현재 공식 명칭:{" "}
                <span className="font-semibold text-ink">연합 성경나눔장소</span>
              </p>
            </div>

            <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {nameHistory.map((item, i) => (
                <li
                  key={item.date}
                  className="rounded-xl border border-line bg-surface px-4 py-4 shadow-sm sm:px-5"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                        i === nameHistory.length - 1 ? "bg-accent" : "bg-line"
                      }`}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <time className="text-xs font-semibold tracking-wide text-muted">
                        {item.date}
                      </time>
                      <p className="mt-1 text-[15px] font-semibold text-ink sm:text-base">
                        {item.name}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            <p className="rounded-xl border border-dashed border-line bg-surface/60 px-4 py-3.5 text-sm leading-relaxed text-muted sm:px-5 sm:text-[15px]">
              신학 23·24 및 원삼 성장은 따로 운영되다 2024년 2분기(7월)에
              통합되었습니다.
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <SectionLabel>Activities</SectionLabel>
              <h2 className="text-[clamp(1.35rem,2.5vw,1.75rem)] font-semibold text-ink">
                활동
              </h2>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <DetailCard title="묵상나눔">
                <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  {meditationRounds.map((round) => (
                    <li
                      key={round.term}
                      className="rounded-lg border border-line/80 bg-bg/50 px-3 py-3"
                    >
                      <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted">
                        {round.term}
                      </span>
                      <span className="mt-1 block font-medium text-ink">
                        {round.topic}
                      </span>
                    </li>
                  ))}
                </ul>
              </DetailCard>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <DetailCard title="도서지원 · 2024 2분기">
                  <p className="text-muted">
                    2024 2분기 묵상나눔 활동 연계 프로그램
                  </p>
                  <ul className="mt-2 space-y-1 font-medium text-ink">
                    <li>로마서 산책 (저자: 권연경)</li>
                    <li>갈라디아서 산책 (저자: 권연경)</li>
                  </ul>
                </DetailCard>

                <DetailCard title="성경연구 · 2024 4분기">
                  <p className="font-medium text-ink">최고의 책 최상의 답</p>
                </DetailCard>

                <DetailCard title="오프라인 모임">
                  <p className="font-medium text-ink">
                    연합성장 2023 1분기 &apos;성장&apos; 말씀훈련 캠프
                  </p>
                  <p className="text-sm text-muted">2024.02.21 – 02.23</p>
                </DetailCard>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
