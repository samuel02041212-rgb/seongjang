type SubPageLayoutProps = {
  title: string;
  children: React.ReactNode;
  /** 더 넓은 본문 (말씀묵상 2열 등) */
  wide?: boolean;
};

/**
 * 앱 공통 헤더·FAB는 `(main)/layout` 의 `MainNavShell`에서 처리합니다.
 * 이 컴포넌트는 페이지 제목 + 본문 폭만 담당합니다.
 */
export function SubPageLayout({
  title,
  children,
  wide = false,
}: SubPageLayoutProps) {
  return (
    <div
      className={`mx-auto w-full px-1 pb-12 pt-1 sm:px-2 ${wide ? "max-w-5xl" : "max-w-2xl"}`}
    >
      <h1 className="mb-4 text-base font-semibold text-ink">{title}</h1>
      {children}
    </div>
  );
}
