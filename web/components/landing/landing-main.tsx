import Image from "next/image";

const intro =
  "'성경나눔장소'는 2023년 5월 동액트에서 시작된 청년 말씀묵상모임입니다. 삶에 말씀이 필요한 청년들이 함께 말씀을 나누고 성장 할 수 있는 '장소'입니다.";

const quote = `“그대들은 성경에 정통하지 못하다. 성경의 표준에 도달하고 그리스도인 완전에 도달하려는 소망을 가지고 하나님의 말씀을 연구하였더라면, 그대들은 증언들이 필요치 않았을 것이다.”`;

const contacts = [
  "place_to_share2025",
  "growth0213@gmail.com",
  "percentcompany2025@gmail.com",
];

const padX = "px-2 sm:px-3";

export function LandingMain() {
  return (
    <main className="w-full flex-1 bg-bg text-ink">
      <section className={`${padX} pb-2 pt-0`}>
        <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
          <h1
            lang="en"
            className="font-sans text-[clamp(4.875rem,21vw,9.75rem)] font-bold leading-[0.95] tracking-tight"
          >
            GROWTH
          </h1>
          <p className="pb-1 text-2xl font-medium text-ink sm:text-3xl">
            성장 | 성경나눔장소
          </p>
        </div>
      </section>

      <section
        className={`grid w-full items-start gap-4 pb-8 sm:gap-5 lg:grid-cols-[minmax(0,1.725fr)_minmax(0,0.85fr)] lg:items-stretch lg:gap-6 ${padX}`}
      >
        <div className="relative min-w-0 w-[150%] -ml-[25%] lg:ml-0 lg:w-full">
          <Image
            src="/images/landing-group.png"
            alt="성경나눔장소 모임 사진"
            width={2400}
            height={1600}
            className="h-auto w-full object-cover"
            priority
            sizes="(min-width: 1024px) 87vw, 150vw"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-6 text-left text-[17px] font-semibold leading-relaxed sm:gap-8 sm:text-lg">
          <p>{intro}</p>
          <p className="font-emotional leading-relaxed">{quote}</p>
          <ul className="mt-auto space-y-0.5 pt-4 text-left text-[16px] font-semibold sm:text-[17px]">
            {contacts.map((line) => (
              <li key={line}>
                {line.includes("@") ? (
                  <a
                    href={`mailto:${line}`}
                    className="hover:text-accent-foreground hover:underline"
                  >
                    {line}
                  </a>
                ) : (
                  line
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className={`space-y-10 pb-14 text-left text-[17px] font-semibold leading-relaxed sm:text-lg ${padX}`}
      >
        <div className="space-y-2">
          <p>그저 &apos;성경을 나누는&apos; 장소</p>
          <p>개설일: 2023.05.01</p>
          <p>의의: 개인신앙의 성장</p>
          <p>목적: 말씀의 나눔과 기록</p>
          <p>대표 성경절: 딤후 2:22 (2023.12.21)</p>
          <p className="font-emotional">
            &quot;또한 네가 청년의 정욕을 피하고 주를 깨끗한 마음으로 부르는
            자들과 함께 의와 믿음과 사랑과 화평을 좇으라...
          </p>
        </div>

        <div className="space-y-2">
          <p>#명칭</p>
          <p>2023.05.01 [동액트 성경나눔장소]</p>
          <p>+2023.10.11 [신학 23 성장]</p>
          <p>+2023.12.10 [원주삼육 성장]</p>
          <p>23.12.16 [연합 성장]</p>
          <p>+2024.03.03 [신학24 성장]</p>
          <p>
            *신학23,24 및 원삼 성장은 따로 운영되다 24년도 2분기에(7월) 통합.
          </p>
        </div>

        <div className="space-y-3">
          <p>#활동</p>
          <div>
            <p>[묵상나눔]</p>
            <p>1차나눔_2023 4분기_각 시대의 대쟁투</p>
            <p>2차나눔_2024 1분기_믿음과 행함</p>
            <p>3차나눔_2024 2분기_로마서, 갈라디아서</p>
            <p>4차나눔_2024 3분기_부조와 선지자(상)</p>
            <p>5차나눔_2024 4분기_부조와 선지자(하)</p>
          </div>
          <div>
            <p>[도서지원]-2024-2분기</p>
            <p>*2024 2분기 묵상나눔 활동 연계 활동</p>
            <p>*로마서 산책, 갈라디아서 산책 (저자: 권연경)</p>
          </div>
          <p>[성경연구_최고의 책 최상의 답]-2024-4분기</p>
          <div>
            <p>오프라인 모임</p>
            <p>
              연합성장 2023 1분기 &apos;성장&apos; 말씀훈련 캠프(24.2.21~2.23)
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
