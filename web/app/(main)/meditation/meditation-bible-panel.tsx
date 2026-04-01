/** 말씀묵상 페이지 우측: 성경 뷰어 자리(추후 BibleViewer 연결) */
export function MeditationBiblePanel() {
  return (
    <section className="flex min-h-[420px] flex-col rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-6">
      <h2 className="text-sm font-semibold text-ink">성경 뷰어</h2>
      <p className="mt-1 text-xs text-muted">
        개역한글 JSON·검색·권·장 이동은 백업의{" "}
        <code className="rounded bg-accent-soft px-1 text-[10px]">
          BibleViewer
        </code>{" "}
        수준으로 이후 연결합니다.
      </p>
      <div className="mt-4 flex flex-1 flex-col rounded-xl border border-dashed border-accent/40 bg-accent-soft/30 p-4">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-lg bg-surface px-2 py-1 text-xs text-muted">
            창세기
          </span>
          <span className="rounded-lg bg-surface px-2 py-1 text-xs text-muted">
            출애굽기
          </span>
          <span className="rounded-lg bg-accent/80 px-2 py-1 text-xs font-medium text-accent-foreground">
            시편
          </span>
        </div>
        <div className="mt-4 flex-1 overflow-hidden rounded-lg bg-surface p-4 text-sm leading-relaxed text-ink">
          <p className="text-xs text-muted">시편 23편</p>
          <p className="mt-2 text-muted">
            (여기에 본문이 표시됩니다 —{" "}
            <code className="text-[10px]">krv.json</code>)
          </p>
        </div>
      </div>
    </section>
  );
}
