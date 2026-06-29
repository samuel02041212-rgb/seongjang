import { meditationPageMaxWidthClass } from "@/lib/meditation-layout";
import { feedCardMaxWidthClass, mePageShellMaxWidthClass } from "@/lib/feed-card-layout";

type SubPageLayoutProps = {
  title: string;
  children: React.ReactNode;
  wide?: boolean;
  extraWide?: boolean;
  feedCard?: boolean;
  mePage?: boolean;
};

export function SubPageLayout({
  title,
  children,
  wide = false,
  extraWide = false,
  feedCard = false,
  mePage = false,
}: SubPageLayoutProps) {
  const maxWidth = mePage
    ? "max-w-none"
    : feedCard
      ? feedCardMaxWidthClass
      : extraWide
        ? meditationPageMaxWidthClass
        : wide
          ? "max-w-6xl"
          : "max-w-2xl";

  return (
    <div
      className={`mx-auto w-full pb-12 pt-1 ${mePage || feedCard ? "px-0" : "px-1 sm:px-2"} ${maxWidth}`}
    >
      {mePage ? (
        <div className="flex w-full justify-center">
          <h1
            className={`mb-4 w-full font-display text-base text-ink ${mePageShellMaxWidthClass}`}
          >
            {title}
          </h1>
        </div>
      ) : (
        <h1 className="mb-4 font-display text-base text-ink">{title}</h1>
      )}
      {children}
    </div>
  );
}
