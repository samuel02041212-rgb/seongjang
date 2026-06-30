"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type TourStep = {
  target?: string;
  title: string;
  body: string;
  adminOnly?: boolean;
};

const TOUR_STEPS: TourStep[] = [
  {
    title: "성경나눔장소 이용방법",
    body: "성장 커뮤니티의 주요 기능을 순서대로 안내합니다. 다음·이전으로 이동하고, 언제든 건너뛸 수 있어요.",
  },
  {
    target: "logo",
    title: "소그룹",
    body: "로고(또는 소그룹 이름)를 누르면 가입한 소그룹을 바꿀 수 있어요. 소그룹마다 별도 피드·묵상·채팅·관리 메뉴가 열립니다.",
  },
  {
    target: "pinned-notice",
    title: "고정 공지",
    body: "관리자가 고정한 공지 제목이 돌아가며 표시됩니다. 문구를 누르면 목록에서 원하는 공지를 골라 볼 수 있어요.",
  },
  {
    target: "nav-feed",
    title: "게시글",
    body: "오늘의 말씀·묵상·공유 글이 날짜별로 모입니다. 카드를 누르면 상세·댓글·좋아요·책갈피를 사용할 수 있고, 공지 글은 테두리로 구분됩니다.",
  },
  {
    target: "header-date",
    title: "날짜 이동",
    body: "피드 상단에서 이전·다음 날짜로 이동하거나 달력으로 특정 날짜를 선택할 수 있어요.",
  },
  {
    target: "nav-meditation",
    title: "말씀묵상",
    body: "성경 본문을 보며 묵상 글을 작성합니다. 작성한 글은 메인 피드와 선택한 소그룹 피드에 함께 올라갈 수 있어요.",
  },
  {
    target: "nav-resources",
    title: "자료실",
    body: "공유 자료와 링크를 모아두는 곳입니다. 필요한 자료를 찾아볼 수 있어요.",
  },
  {
    target: "nav-me",
    title: "마이페이지",
    body: "내 게시글·말씀 기록·책깔피를 탭으로 볼 수 있어요. 다른 사람 프로필에서도 말씀 기록을 확인할 수 있습니다.",
  },
  {
    target: "nav-pinned",
    title: "고정 공지 목록",
    body: "확성기 아이콘을 누르면 고정된 공지 목록이 열립니다. 헤더 문구와 같은 목록이에요.",
  },
  {
    target: "nav-group-feed",
    title: "소그룹 홈",
    body: "선택한 소그룹의 게시글 피드입니다. 소그룹 멤버들의 말씀·묵상을 이 공간에서 볼 수 있어요.",
  },
  {
    target: "nav-group-meditation",
    title: "소그룹 말씀묵상",
    body: "소그룹 맥락에서 묵상 글을 작성합니다. 메인 말씀묵상과 같지만 이 소그룹 피드에 바로 연결돼요.",
  },
  {
    target: "nav-group-record",
    title: "소그룹 말씀 기록",
    body: "소그룹에서 함께하는 말씀 기록 공간입니다.",
  },
  {
    target: "nav-group-chat",
    title: "소그룹 채팅",
    body: "소그룹 전용 채팅방입니다. 텍스트·사진·투표·일정·말씀묵상 카드를 나눌 수 있어요.",
  },
  {
    target: "nav-group-manage",
    title: "소그룹 관리",
    body: "소그룹 관리자만 보입니다. 프로필 수정, 멤버·공지 등 소그룹을 운영할 때 사용해요.",
  },
  {
    target: "nav-admin",
    title: "관리자",
    body: "사이트 관리자 전용입니다. 사용자·게시글·일정·소그룹·공지를 관리할 수 있어요.",
    adminOnly: true,
  },
  {
    target: "header-research",
    title: "연구모드",
    body: "말씀묵상 페이지에서 제공될 심화 연구 기능입니다. (준비 중)",
  },
  {
    target: "header-theme",
    title: "테마",
    body: "라이트·다크 모드를 전환합니다. 눈에 편한 테마로 읽어 보세요.",
  },
  {
    target: "header-view",
    title: "뷰어 모드",
    body: "팝업 모드는 글을 창으로 띄우고, 이분할 모드는 피드 옆에 글·채팅을 고정해 볼 수 있어요.",
  },
  {
    target: "group-plus",
    title: "소그룹 가입·개설",
    body: "＋ 버튼으로 소그룹에 가입하거나 새 소그룹 개설을 요청할 수 있어요. 개설은 관리자 승인 후 활성화됩니다.",
  },
  {
    target: "nav-chat",
    title: "채팅",
    body: "1:1 채팅과 소그룹 채팅방 목록을 엽니다. 읽지 않은 메시지 수가 표시되고, 이분할 모드에서는 옆에 고정할 수 있어요.",
  },
  {
    target: "nav-more",
    title: "더보기 메뉴",
    body: "설정, 성장 소개, 이용방법, 로그아웃 등 계정·안내 메뉴가 모여 있습니다.",
  },
  {
    title: "이용 준비 완료",
    body: "궁금할 때는 더보기 → 이용방법을 다시 눌러 안내를 볼 수 있어요. 말씀 나눔을 즐겨 보세요!",
  },
];

type SiteTourContextValue = {
  startTour: () => void;
};

const SiteTourContext = createContext<SiteTourContextValue | null>(null);

export function useSiteTour() {
  return useContext(SiteTourContext);
}

function stepTargetVisible(target: string) {
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

function pickSteps(isAdmin: boolean) {
  return TOUR_STEPS.filter((step) => {
    if (step.adminOnly && !isAdmin) return false;
    if (step.target && !stepTargetVisible(step.target)) return false;
    return true;
  });
}

type Placement = "right" | "left" | "bottom" | "top" | "center";

const TOUR_MARGIN = 12;
const TOUR_GAP = 14;
const TOUR_BTN_GAP = 12;
const TOUR_BTN_BLOCK = 44;
const TOUR_BTN_TOP_RATIO = 0.58;

function getTourButtonsTop() {
  return window.innerHeight * TOUR_BTN_TOP_RATIO;
}

function getCardBottomLimit() {
  return getTourButtonsTop() - TOUR_BTN_BLOCK / 2 - TOUR_BTN_GAP;
}

function centerStepCardTop(h: number) {
  return getTourButtonsTop() - TOUR_BTN_BLOCK / 2 - TOUR_BTN_GAP - h;
}

function spotlightBox(rect: DOMRect, pad = 8) {
  const top = rect.top - pad;
  const left = rect.left - pad;
  const width = rect.width + pad * 2;
  const height = rect.height + pad * 2;
  return {
    top,
    left,
    width,
    height,
    right: left + width,
    bottom: top + height,
  };
}

function posFor(
  placement: Placement,
  s: ReturnType<typeof spotlightBox>,
  w: number,
  h: number,
) {
  switch (placement) {
    case "right":
      return {
        top: s.top + s.height / 2 - h / 2,
        left: s.left + s.width + TOUR_GAP,
      };
    case "left":
      return {
        top: s.top + s.height / 2 - h / 2,
        left: s.left - TOUR_GAP - w,
      };
    case "bottom":
      return {
        top: s.top + s.height + TOUR_GAP,
        left: s.left + s.width / 2 - w / 2,
      };
    case "top":
      return {
        top: s.top - TOUR_GAP - h,
        left: s.left + s.width / 2 - w / 2,
      };
    default:
      return {
        top: (window.innerHeight - h) / 2,
        left: (window.innerWidth - w) / 2,
      };
  }
}

function clampPos(top: number, left: number, w: number, h: number) {
  const vw = window.innerWidth;
  const bottomLimit = getCardBottomLimit();
  return {
    top: Math.max(TOUR_MARGIN, Math.min(top, bottomLimit - h)),
    left: Math.max(TOUR_MARGIN, Math.min(left, vw - w - TOUR_MARGIN)),
  };
}

function fitsViewport(top: number, left: number, w: number, h: number) {
  const vw = window.innerWidth;
  return (
    top >= TOUR_MARGIN &&
    left >= TOUR_MARGIN &&
    top + h <= getCardBottomLimit() &&
    left + w <= vw - TOUR_MARGIN
  );
}

function chooseCardPos(
  s: ReturnType<typeof spotlightBox>,
  w: number,
  h: number,
) {
  const order: Placement[] =
    s.left < 120
      ? ["right", "bottom", "top", "left"]
      : s.top < 72
        ? ["bottom", "right", "left", "top"]
        : s.bottom > window.innerHeight - 160
          ? ["top", "right", "left", "bottom"]
          : s.right > window.innerWidth - 280
            ? ["left", "right", "bottom", "top"]
            : ["right", "left", "bottom", "top"];

  for (const placement of order) {
    const raw = posFor(placement, s, w, h);
    if (fitsViewport(raw.top, raw.left, w, h)) {
      return { placement, ...raw };
    }
  }

  const raw = posFor(order[0], s, w, h);
  const clamped = clampPos(raw.top, raw.left, w, h);
  return { placement: order[0], ...clamped };
}

function arrowClassFor(placement: Placement) {
  switch (placement) {
    case "right":
      return "absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-surface";
    case "left":
      return "absolute left-full top-1/2 -translate-y-1/2 border-8 border-transparent border-l-surface";
    case "bottom":
      return "absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-surface";
    case "top":
      return "absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-surface";
    default:
      return "";
  }
}

function SiteTourOverlay({
  steps,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  steps: TourStep[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const step = steps[index];
  const [rect, setRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardLayout, setCardLayout] = useState<{
    top: number;
    left: number;
    height: number;
    placement: Placement;
  } | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!step?.target) {
      setRect(null);
      return;
    }
    const update = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) {
        setRect(null);
        return;
      }
      setRect(r);
    };
    update();
    const t = window.setTimeout(update, 50);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [step]);

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const measure = () => {
      const w = card.offsetWidth;
      const h = card.offsetHeight;
      if (!step?.target || !rect) {
        const centered = clampPos(
          centerStepCardTop(h),
          (window.innerWidth - w) / 2,
          w,
          h,
        );
        setCardLayout({ placement: "center", height: h, ...centered });
        return;
      }
      const pos = chooseCardPos(spotlightBox(rect), w, h);
      setCardLayout({ height: h, ...pos });
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [step, index, rect]);

  if (!step) return null;

  const pad = 8;
  const spotlight = rect
    ? {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  const cardClass =
    "pointer-events-auto fixed z-[210] max-h-[min(60vh,calc(100vh-5.5rem))] w-[min(calc(100vw-1.5rem),18rem)] overflow-y-auto rounded-xl border border-line bg-surface p-4 shadow-xl";
  const arrowClass =
    cardLayout && cardLayout.placement !== "center"
      ? arrowClassFor(cardLayout.placement)
      : "";

  return (
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink/55" onClick={onClose} aria-hidden />
      {spotlight ? (
        <div
          className="pointer-events-none absolute z-[205] rounded-xl ring-2 ring-accent"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
          }}
        />
      ) : null}
      <div
        ref={cardRef}
        className={cardClass}
        style={
          cardLayout
            ? {
                top: cardLayout.top,
                left: cardLayout.left,
                visibility: "visible",
              }
            : { top: TOUR_MARGIN, left: TOUR_MARGIN, visibility: "hidden" }
        }
      >
        {arrowClass ? <span className={arrowClass} aria-hidden /> : null}
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          {index + 1} / {steps.length}
        </p>
        <h2 className="mt-1 text-sm font-semibold text-ink">{step.title}</h2>
        <p className="mt-2 text-xs leading-relaxed text-muted">{step.body}</p>
      </div>

      <div className="pointer-events-none fixed inset-x-0 top-[58vh] z-[220] flex -translate-y-1/2 justify-center px-4">
        <div className="pointer-events-auto flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-muted shadow-md hover:text-ink"
          >
            건너뛰기
          </button>
          <button
            type="button"
            onClick={onPrev}
            disabled={index === 0}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink shadow-md disabled:opacity-40"
          >
            이전
          </button>
          <button
            type="button"
            onClick={onNext}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground shadow-md"
          >
            {index === steps.length - 1 ? "완료" : "다음"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SiteTourProvider({
  children,
  isAdmin,
}: {
  children: React.ReactNode;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [index, setIndex] = useState(0);

  const startTour = useCallback(() => {
    const picked = pickSteps(isAdmin);
    if (picked.length === 0) return;
    setSteps(picked);
    setIndex(0);
    setOpen(true);
  }, [isAdmin]);

  const close = useCallback(() => setOpen(false), []);

  const value = useMemo(() => ({ startTour }), [startTour]);

  return (
    <SiteTourContext.Provider value={value}>
      {children}
      {open && steps.length > 0 ? (
        <SiteTourOverlay
          steps={steps}
          index={index}
          onClose={close}
          onPrev={() => setIndex((i) => Math.max(0, i - 1))}
          onNext={() => {
            if (index >= steps.length - 1) close();
            else setIndex((i) => i + 1);
          }}
        />
      ) : null}
    </SiteTourContext.Provider>
  );
}

export function mainNavTourId(href: string) {
  const map: Record<string, string> = {
    "/feed": "nav-feed",
    "/meditation": "nav-meditation",
    "/resources": "nav-resources",
    "/me": "nav-me",
    "/admin": "nav-admin",
  };
  return map[href];
}

export function groupNavTourId(href: string) {
  if (href.endsWith("/feed")) return "nav-group-feed";
  if (href.endsWith("/meditation")) return "nav-group-meditation";
  if (href.endsWith("/record")) return "nav-group-record";
  if (href.endsWith("/chat")) return "nav-group-chat";
  if (href.endsWith("/manage")) return "nav-group-manage";
  return undefined;
}
