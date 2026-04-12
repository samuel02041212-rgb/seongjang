type SubPageLayoutProps = {
  title: string;
  children: React.ReactNode;
  wide?: boolean;
};

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
