"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { FeedPostImages } from "@/components/feed/feed-post-images";
import { SITE_ANNOUNCEMENT_AUTHOR, type AnnouncementJson } from "@/lib/announcement";
import { feedCardSizeClass } from "@/lib/feed-card-layout";
import {
  feedPostBodyTextClass,
  feedPostFooterClass,
  feedPostImageRowClass,
  feedPostInnerClass,
  feedPostTitleClass,
} from "@/lib/feed-post-body-layout";
import { resizeImage } from "@/lib/image-resize";

const MAX_IMAGES = 20;

type PendingImg = { file: File; previewUrl: string };

function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|gif|webp)$/i.test(file.name);
}

type AnnouncementPanelProps =
  | { scope: "site" }
  | { scope: "group"; groupId: string; groupName: string };

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("ko-KR");
  } catch {
    return "";
  }
}

export function AnnouncementPanel(props: AnnouncementPanelProps) {
  const authorLabel =
    props.scope === "site" ? SITE_ANNOUNCEMENT_AUTHOR : props.groupName;
  const listUrl =
    props.scope === "site"
      ? "/api/admin/announcements"
      : `/api/groups/${encodeURIComponent(props.groupId)}/announcements`;

  const [items, setItems] = useState<AnnouncementJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<PendingImg[]>([]);
  const [imagesLarge, setImagesLarge] = useState(false);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [pending, setPending] = useState(false);
  const [pinningId, setPinningId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef(images);
  imagesRef.current = images;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(listUrl, { credentials: "include" });
      setItems(res.ok ? ((await res.json()) as AnnouncementJson[]) : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [listUrl]);

  useEffect(() => {
    void load();
  }, [load]);

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
        if (!isImageFile(file)) continue;
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
    setPreviewIdx((i) => Math.max(0, i - 1));
  }

  async function uploadImages(): Promise<string[] | null> {
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
        setError("이미지 업로드에 실패했습니다.");
        return null;
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
        return null;
      }
      imageUrls.push(url);
    }
    return imageUrls;
  }

  function resetForm() {
    images.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setImages([]);
    setImagesLarge(false);
    setPreviewIdx(0);
    setTitle("");
    setContent("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("제목을 입력해 주세요.");
      return;
    }
    if (!content.trim()) {
      setError("본문을 입력해 주세요.");
      return;
    }
    setPending(true);
    try {
      const imageUrls = await uploadImages();
      if (imageUrls === null) return;
      const res = await fetch(listUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content,
          imageUrls,
          imagesLarge: imagesLarge && imageUrls.length > 0,
        }),
      });
      if (!res.ok) {
        if (res.status === 403) {
          setError("공지 등록 권한이 없습니다.");
        } else if (res.status === 400) {
          setError("입력값을 확인해 주세요.");
        } else {
          setError("공지 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        }
        return;
      }
      resetForm();
      await load();
    } catch {
      setError("네트워크 오류입니다.");
    } finally {
      setPending(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("공지를 삭제할까요?")) return;
    const deleteUrl =
      props.scope === "site"
        ? `/api/admin/announcements/${encodeURIComponent(id)}`
        : `/api/groups/${encodeURIComponent(props.groupId)}/announcements/${encodeURIComponent(id)}`;
    const res = await fetch(deleteUrl, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      alert("삭제 실패");
      return;
    }
    await load();
  }

  async function togglePin(id: string, feedPinned: boolean) {
    if (props.scope !== "site") return;
    setPinningId(id);
    setError("");
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, feedPinned } : item)),
    );
    try {
      const res = await fetch(
        `/api/admin/announcements/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feedPinned }),
        },
      );
      if (!res.ok) {
        const msg =
          res.status === 503
            ? "DB 설정 오류입니다. dev 서버를 재시작한 뒤 다시 시도해 주세요."
            : "상단 고정 설정에 실패했습니다.";
        setError(msg);
        await load();
        return;
      }
    } catch {
      setError("상단 고정 설정에 실패했습니다.");
      await load();
    } finally {
      setPinningId(null);
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={onSubmit}
        className={`feed-post-card flex flex-col overflow-hidden rounded-md border border-line bg-surface shadow-sm ${feedCardSizeClass}`}
      >
        <div className={`${feedPostInnerClass} min-h-0 flex-1 pb-0`}>
          <div className="shrink-0">
            <p className="text-center text-xs text-muted">{authorLabel}</p>
            <input
              type="text"
              placeholder="공지 제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`${feedPostTitleClass} mt-2 w-full border-0 bg-transparent p-0 text-center outline-none placeholder:text-muted focus:ring-0`}
            />
          </div>
          <div className="mt-5 min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain pb-3">
            {images.length > 0 ? (
              imagesLarge ? (
                <div className="relative shrink-0">
                  <FeedPostImages
                    urls={images.map((img) => img.previewUrl)}
                    large
                    edgeBleed={false}
                    index={previewIdx}
                    onIndexChange={setPreviewIdx}
                  />
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => removeAt(previewIdx)}
                    className="absolute right-1 top-1 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-[#1a1a1a]/75 text-sm font-bold text-white"
                    aria-label="이미지 제거"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className={`${feedPostImageRowClass} shrink-0`}>
                  {images.slice(0, 4).map((img, i) => (
                    <div
                      key={`${img.previewUrl}-${i}`}
                      className="relative aspect-square h-full shrink-0 overflow-hidden rounded-md border border-line bg-bg"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.previewUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      {i === 3 && images.length > 4 ? (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-lg font-bold text-white">
                          +{images.length - 4}
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => removeAt(i)}
                          className="absolute right-0.5 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#1a1a1a]/75 text-xs font-bold text-white"
                          aria-label="이미지 제거"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : null}
            <textarea
              placeholder="공지 내용"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`${feedPostBodyTextClass} mt-4 block w-full resize-none border-0 bg-transparent p-0 outline-none placeholder:text-muted focus:ring-0`}
            />
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/*"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        <div className={`${feedPostFooterClass} flex-wrap`}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={images.length >= MAX_IMAGES || pending}
              onClick={() => fileRef.current?.click()}
              className="text-sm font-medium text-muted transition hover:text-ink disabled:opacity-50"
            >
              사진 추가
              {images.length > 0 ? ` (${images.length}/${MAX_IMAGES})` : ""}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setImagesLarge((v) => !v)}
              aria-pressed={imagesLarge}
              className={`text-[1.35rem] leading-none transition ${
                imagesLarge ? "opacity-100" : "opacity-35 hover:opacity-70"
              }`}
            >
              🖼️
            </button>
          </div>
          <button
            type="submit"
            disabled={pending || !title.trim() || !content.trim()}
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition hover:bg-accent/90 disabled:opacity-50"
          >
            {pending ? "등록 중…" : "공지 게시"}
          </button>
        </div>
        {error ? (
          <p className="shrink-0 px-4 pb-3 text-center text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </form>

      <section className="relative z-[35] rounded-lg border border-line bg-surface shadow-sm">
        <h3 className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">
          공지 목록
        </h3>
        {error ? (
          <p className="border-b border-line px-4 py-2 text-xs text-red-700">
            {error}
          </p>
        ) : null}
        {loading ? (
          <p className="px-4 py-8 text-center text-sm text-muted">불러오는 중…</p>
        ) : items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">
            등록된 공지가 없습니다.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((item) => {
              const pinned = item.feedPinned ?? false;
              return (
              <li
                key={item.id}
                className="flex items-start gap-3 px-4 py-3"
              >
                {props.scope === "site" ? (
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      disabled={pinningId === item.id}
                      onClick={() => void togglePin(item.id, !pinned)}
                      className={`rounded-lg border px-2 py-1 text-xs disabled:opacity-50 ${
                        pinned
                          ? "border-accent/40 bg-accent/10 text-accent-foreground"
                          : "border-line bg-bg text-ink"
                      }`}
                    >
                      {pinningId === item.id
                        ? "…"
                        : pinned
                          ? "고정 해제"
                          : "상단 고정"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(item.id)}
                      className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-800"
                    >
                      삭제
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => void remove(item.id)}
                    className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-800"
                  >
                    삭제
                  </button>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-ink">
                      {item.title}
                    </p>
                    {props.scope === "site" && pinned ? (
                      <span className="shrink-0 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">
                        상단 고정
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                    {item.content}
                  </p>
                  <p className="mt-1 text-[11px] text-muted">
                    {fmtDate(item.createdAt)} · {item.authorName}
                  </p>
                </div>
              </li>
            );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
