import { BibleViewer } from "@/components/bible/bible-viewer";
import { feedCardHeightClass } from "@/lib/feed-card-layout";

export function MeditationBiblePanel() {
  return (
    <section
      className={`med-bible flex w-full min-w-0 flex-col rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5 ${feedCardHeightClass}`}
    >
      <h2 className="shrink-0 text-sm font-semibold text-ink">
        <span className="med-bible-version">개역한글</span> 성경
      </h2>
      <BibleViewer />
    </section>
  );
}
