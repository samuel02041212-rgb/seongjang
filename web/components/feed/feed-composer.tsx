"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { resizeImage } from "@/lib/image-resize";

const MAX_IMAGES = 20;

type FeedComposerProps = {
  isAuthenticated: boolean;
  onPosted: () => void;
};

type PendingImg = { file: File; previewUrl: string };

export function FeedComposer({
  isAuthenticated,
  onPosted,
}: FeedComposerProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [bibleRef, setBibleRef] = useState("");
  const [images, setImages] = useState<PendingImg[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef(images);
  imagesRef.current = images;

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, []);

  function addFiles(list: FileList | null) {
    if (!list?.length) return;
    const files = Array.from(list);
    if (fileRef.current) fileRef.current.value = "";
    setImages((prev) => {
      const next = [...prev];
      for (const file of files) {
        if (next.length >= MAX_IMAGES) break;
        if (!file.type.startsWith("image/")) continue;
        next.push({ file, previewUrl: URL.createObjectURL(file) });
      }
      return next;
    });
  }

  function removeAt(index: number) {
    setImages((prev) => {
      const copy = [...prev];
      const [removed] = copy.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return copy;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setPending(true);
    setError("");
    try {
      const imageUrls: string[] = [];
      for (const { file } of images) {
        let uploadFile: File;
        try {
          uploadFile = await resizeImage(file);
        } catch {
          uploadFile = file;
        }
        const fd = new FormData();
        fd.append("file", uploadFile);
        const up = await fetch("/api/upload", {
          method: "POST",
          credentials: "include",
          body: fd,
        });
        if (!up.ok) {
          if (up.status === 503) {
            setError("이미지 업로드 설정이 필요합니다. 관리자에게 문의해 주세요.");
          } else {
            setError("이미지 업로드에 실패했습니다. 형식·용량을 확인해 주세요.");
          }
          return;
        }
        const data: unknown = await up.json();
        const url =
          typeof data === "object" &&
          data !== null &&
          "url" in data &&
          typeof (data as { url: unknown }).url === "string"
            ? (data as { url: string }).url
            : null;
        if (!url) {
          setError("이미지 업로드 응답이 올바르지 않습니다.");
          return;
        }
        imageUrls.push(url);
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          bibleRef: bibleRef.trim(),
          imageUrls,
          visibleGroupIds: [],
        }),
      });
      if (!res.ok) {
        setError("저장에 실패했습니다. 로그인 후 다시 시도해 주세요.");
        return;
      }
      images.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setImages([]);
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
      className="flex h-full min-h-[28rem] flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm"
    >
      {error ? (
        <p className="shrink-0 text-sm text-red-700">{error}</p>
      ) : null}
      <input
        type="text"
        placeholder="제목 (선택)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full shrink-0 rounded-xl border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted outline-none ring-accent/30 focus:ring-2"
      />
      <input
        type="text"
        placeholder="성경 구절 (선택, 예: 시편 23:1)"
        value={bibleRef}
        onChange={(e) => setBibleRef(e.target.value)}
        className="w-full shrink-0 rounded-xl border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted outline-none ring-accent/30 focus:ring-2"
      />
      <textarea
        placeholder="무엇을 나누고 싶나요?"
        required
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[8rem] w-full flex-1 resize-none rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-muted outline-none ring-accent/30 focus:ring-2"
      />

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />

      {images.length > 0 ? (
        <div className="flex shrink-0 flex-wrap gap-2">
          {images.map((img, i) => (
            <div
              key={`${img.previewUrl}-${i}`}
              className="relative h-20 w-20 overflow-hidden rounded-lg border border-line bg-bg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.previewUrl}
                alt=""
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                disabled={pending}
                onClick={() => removeAt(i)}
                className="absolute right-0.5 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#1a1a1a]/75 text-xs font-bold text-white"
                aria-label="이미지 제거"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          disabled={images.length >= MAX_IMAGES || pending}
          onClick={() => fileRef.current?.click()}
          className="rounded-xl border border-line bg-bg px-3 py-2 text-sm font-medium text-ink transition hover:bg-accent-soft disabled:opacity-50"
        >
          사진 추가
          {images.length > 0 ? ` (${images.length}/${MAX_IMAGES})` : ""}
        </button>
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
