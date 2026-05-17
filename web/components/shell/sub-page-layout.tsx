import { meditationPageMaxWidthClass } from "@/lib/meditation-layout";

type SubPageLayoutProps = {
  title: string;
  children: React.ReactNode;
  wide?: boolean;
  extraWide?: boolean;
};

export function SubPageLayout({
  title,
  children,
  wide = false,
  extraWide = false,
}: SubPageLayoutProps) {
  const maxWidth = extraWide
    ? meditationPageMaxWidthClass
    : wide
      ? "max-w-6xl"
      : "max-w-2xl";

  return (
    <div className={`mx-auto w-full px-1 pb-12 pt-1 sm:px-2 ${maxWidth}`}>
      <h1 className="mb-4 font-display text-base text-ink">{title}</h1>
      {children}
    </div>
  );
}
