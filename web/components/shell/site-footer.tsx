function InstagramIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className="shrink-0"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function FooterSep() {
  return <span className="text-line/80">/</span>;
}

export function SiteFooter() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "—";
  const linkClass = "transition hover:text-ink hover:underline";

  return (
    <footer className="bg-surface/80 px-4 py-5 text-center text-xs text-muted sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-2">
        <p className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-[11px] leading-relaxed">
          <span>© percent</span>
          <FooterSep />
          <span>연합 성경나눔장소</span>
          <FooterSep />
          <a href="mailto:percentcompany2025@gmail.com" className={linkClass}>
            percentcompany2025@gmail.com
          </a>
        </p>
        <p className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-[11px] leading-relaxed">
          <a
            href="https://www.instagram.com/place_to_share2025/"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 ${linkClass}`}
          >
            <InstagramIcon />
            place_to_share2025
          </a>
          <FooterSep />
          <a href="mailto:growth0213@gmail.com" className={linkClass}>
            growth0213@gmail.com
          </a>
          <FooterSep />
          <a href="tel:01047645345" className={linkClass}>
            010-4764-5345 성장 관리자
          </a>
          <FooterSep />
          <span>버전 : {version}</span>
        </p>
      </div>
    </footer>
  );
}
