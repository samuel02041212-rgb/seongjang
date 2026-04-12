export function SiteFooter() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "—";
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line bg-surface/80 px-4 py-5 text-center text-xs text-muted sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-2">
        <p className="text-[11px] leading-relaxed">
          © {year} 성장 · Next.js · PostgreSQL · Prisma · Auth.js
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
          <span>관리자 : Percent</span>
          <span>문의 : 010-0000-0000</span>
          <span>버전 : {version}</span>
        </div>
      </div>
    </footer>
  );
}
