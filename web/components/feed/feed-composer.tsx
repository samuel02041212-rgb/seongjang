"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { FeedPostImages } from "@/components/feed/feed-post-images";
import {
  BibleRefInput,
  bibleRefInputToPayload,
  emptyBibleRefInputValue,
  isBibleRefInputFilled,
  validateBibleRefInput,
  type BibleRefInputValue,
} from "@/components/feed/bible-ref-input";
import { GroupPostShareModal } from "@/components/group/group-post-share-modal";
import { useGroupPanel } from "@/components/group/group-panel";
import { feedCardSizeClass } from "@/lib/feed-card-layout";
import {
  feedPostBodyTextClass,
  feedPostFooterClass,
  feedPostImageRowClass,
  feedPostInnerClass,
  feedPostTitleClass,
} from "@/lib/feed-post-body-layout";
import { resizeImage } from "@/lib/image-resize";
import {
  feedTodayIso,
  formatComposerFeedDate,
  isFeedDateIso,
} from "@/lib/feed-date";

const MAX_IMAGES = 20;
const COMPOSER_BODY_MIN_PX = 192;

type FeedComposerProps = {
  isAuthenticated: boolean;
  onPosted: () => void;
  pickGroupsOnSubmit?: boolean;
  defaultGroupId?: string;
};

type PendingImg = { file: File; previewUrl: string };

export function FeedComposer({
  isAuthenticated,
  onPosted,
  pickGroupsOnSubmit = false,
  defaultGroupId,
}: FeedComposerProps) {
  const { joinedGroups } = useGroupPanel();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [readingRef, setReadingRef] = useState<BibleRefInputValue>(
    emptyBibleRefInputValue,
  );
  const [images, setImages] = useState<PendingImg[]>([]);
  const [imagesLarge, setImagesLarge] = useState(false);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [feedDate, setFeedDate] = useState(feedTodayIso);
  const fileRef = useRef<HTMLInputElement>(null);
  const feedDateRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const imagesRef = useRef(images);
  imagesRef.current = images;

  function syncBodyHeight() {
    const el = bodyRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, COMPOSER_BODY_MIN_PX)}px`;
  }

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, []);

  useLayoutEffect(() => {
    syncBodyHeight();
  }, [content, images.length, imagesLarge, previewIdx]);

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
        if (up.status === 503) {
          setError("이미지 업로드 설정이 필요합니다. 관리자에게 문의해 주세요.");
        } else {
          setError("이미지 업로드에 실패했습니다. 형식·용량을 확인해 주세요.");
        }
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
    setReadingRef(emptyBibleRefInputValue());
    setFeedDate(feedTodayIso());
  }

  function openFeedDatePicker() {
    const el = feedDateRef.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      el.click();
    }
  }

  async function publishPost(groupIds: string[], imageUrls: string[]) {
    const visibleGroupIds = defaultGroupId
      ? [...new Set([...groupIds, defaultGroupId])]
      : groupIds;
    const res = await fetch("/api/posts", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        content,
        ...bibleRefInputToPayload(readingRef),
        imageUrls,
        imagesLarge: imagesLarge && imageUrls.length > 0,
        visibleGroupIds,
        feedDate: feedDate !== feedTodayIso() ? feedDate : undefined,
      }),
    });
    if (!res.ok) {
      setError("저장에 실패했습니다. 로그인 후 다시 시도해 주세요.");
      return false;
    }
    resetForm();
    setShareOpen(false);
    onPosted();
    return true;
  }

  async function submitWithGroups(groupIds: string[]) {
    setPending(true);
    setError("");
    try {
      const imageUrls = await uploadImages();
      if (imageUrls === null) return;
      await publishPost(groupIds, imageUrls);
    } catch {
      setError("네트워크 오류입니다.");
    } finally {
      setPending(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("제목을 입력해 주세요.");
      return;
    }
    if (!isBibleRefInputFilled(readingRef)) {
      const refError = validateBibleRefInput(readingRef);
      setError(
        refError ?? "성경 범위 또는 기타 읽은 범위를 입력해 주세요.",
      );
      return;
    }
    if (!content.trim()) {
      setError("본문을 입력해 주세요.");
      return;
    }
    if (pickGroupsOnSubmit && joinedGroups.length > 0) {
      setShareOpen(true);
      return;
    }
    void submitWithGroups([]);
  }

  if (!isAuthenticated) {
    return (
      <div className="mb-4 rounded-lg border border-dashed border-line bg-surface/80 px-4 py-6 text-center text-sm text-muted">
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

  const composerScrollClass =
    "mt-5 min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain pb-3";
  const composerTextareaClass = `${feedPostBodyTextClass} block w-full resize-none overflow-hidden border-0 bg-transparent p-0 outline-none placeholder:text-muted focus:ring-0`;
  const today = feedTodayIso();
  const feedDateCustom = feedDate !== today;

  return (
    <>
      <form
        onSubmit={onSubmit}
        className={`feed-post-card flex flex-col overflow-hidden rounded-md border border-line bg-surface shadow-sm ${feedCardSizeClass}`}
      >
        <div className={`${feedPostInnerClass} pb-0`}>
          <div className="shrink-0">
            <input
              type="text"
              placeholder="제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`${feedPostTitleClass} w-full shrink-0 border-0 bg-transparent p-0 outline-none placeholder:text-muted focus:ring-0`}
            />
            <BibleRefInput
              value={readingRef}
              onChange={setReadingRef}
              titleSet={!!title.trim()}
            />
          </div>
          <div className={composerScrollClass}>
            {images.length > 0 ? (
              imagesLarge ? (
                <div className="relative">
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
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAt(previewIdx);
                    }}
                    className="absolute right-1 top-1 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-[#1a1a1a]/75 text-sm font-bold text-white"
                    aria-label="이미지 제거"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className={feedPostImageRowClass}>
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
              ref={bodyRef}
              placeholder="무엇을 나누고 싶나요?"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                syncBodyHeight();
              }}
              className={composerTextareaClass}
            />
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
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
              aria-label="사진 크게 올리기"
              title="사진 크게 올리기 (3:4)"
              className={`text-[1.35rem] leading-none transition ${
                imagesLarge ? "opacity-100" : "opacity-35 hover:opacity-70"
              }`}
            >
              🖼️
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={openFeedDatePicker}
              className={`rounded-full border px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                feedDateCustom
                  ? "border-accent bg-accent-soft text-accent-foreground"
                  : "border-line text-muted hover:border-accent/40 hover:text-ink"
              }`}
              aria-label="피드 날짜 선택"
            >
              {feedDateCustom ? formatComposerFeedDate(feedDate) : "날짜"}
            </button>
            <input
              ref={feedDateRef}
              type="date"
              value={feedDate}
              max={today}
              onChange={(e) => {
                const next = e.target.value;
                if (next && isFeedDateIso(next)) setFeedDate(next);
              }}
              className="sr-only"
              tabIndex={-1}
              aria-hidden
            />
            <button
              type="submit"
              disabled={
                pending ||
                !title.trim() ||
                !isBibleRefInputFilled(readingRef) ||
                !content.trim()
              }
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition hover:bg-accent/90 disabled:opacity-50"
            >
              {pending ? "올리는 중…" : "게시하기"}
            </button>
          </div>
        </div>
        {error ? (
          <p className="shrink-0 px-4 pb-3 text-center text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </form>
      <GroupPostShareModal
        open={shareOpen}
        groups={joinedGroups}
        pending={pending}
        onClose={() => setShareOpen(false)}
        onConfirm={(ids) => void submitWithGroups(ids)}
      />
    </>
  );
}
