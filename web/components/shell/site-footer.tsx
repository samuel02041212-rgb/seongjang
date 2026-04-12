export function SiteFooter() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "—";
  return (
    <footer className="border-t border-line bg-surface/80 px-4 py-6 text-center text-xs text-muted sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-1.5 sm:flex-row sm:justify-center sm:gap-8">
        <span>관리자 : Percent</span>
        <span>문의 : 010-0000-0000</span>
        <span>버전 : {version}</span>
      </div>
    </footer>
  );
}
