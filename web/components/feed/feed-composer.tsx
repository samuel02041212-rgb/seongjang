"use client";

import Link from "next/link";
import { useState } from "react";

type FeedComposerProps = {
  isAuthenticated: boolean;
  onPosted: () => void;
};

export function FeedComposer({
  isAuthenticated,
  onPosted,
}: FeedComposerProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [bibleRef, setBibleRef] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          bibleRef: bibleRef.trim(),
          imageUrls: [],
          visibleGroupIds: [],
        }),
      });
      if (!res.ok) {
        setError("저장에 실패했습니다. 로그인 후 다시 시도해 주세요.");
        return;
      }
      setTitle("");
      setContent("");
      setBibleRef("");
      onPosted();
    } catch {
      setError("네트워크 오류입니다.");
    } finally {
      setPending(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="mb-4 rounded-2xl border border-dashed border-line bg-surface/80 px-4 py-6 text-center text-sm text-muted">
        글을 작성하려면{" "}
        <Link
          href="/login"
          className="font-medium text-accent-foreground underline underline-offset-2"
        >
          로그인
        </Link>
        이 필요합니다.
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mb-6 space-y-3 rounded-2xl border border-line bg-surface p-4 shadow-sm"
    >
      {error ? (
        <p className="text-sm text-red-700">{error}</p>
      ) : null}
      <input
        type="text"
        placeholder="제목 (선택)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted outline-none ring-accent/30 focus:ring-2"
      />
      <input
        type="text"
        placeholder="성경 구절 (선택, 예: 시편 23:1)"
        value={bibleRef}
        onChange={(e) => setBibleRef(e.target.value)}
        className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted outline-none ring-accent/30 focus:ring-2"
      />
      <textarea
        placeholder="무엇을 나누고 싶나요?"
        required
        rows={4}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full resize-y rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-muted outline-none ring-accent/30 focus:ring-2"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending || !content.trim()}
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition hover:bg-accent/90 disabled:opacity-50"
        >
          {pending ? "올리는 중…" : "게시하기"}
        </button>
      </div>
    </form>
  );
}
