"use client";

import { useEffect, useState } from "react";

import {
  feedPostImageLargeBleedClass,
  feedPostImageLargeFrameClass,
  feedPostImageRowClass,
} from "@/lib/feed-post-body-layout";

type FeedPostImagesProps = {
  urls: string[];
  large: boolean;
  cardPreview?: boolean;
  edgeBleed?: boolean;
  index?: number;
  onIndexChange?: (index: number) => void;
  onImageClick?: () => void;
  className?: string;
};

const navBtnClass =
  "absolute top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-lg font-bold text-white hover:bg-black/70";

const thumbClass =
  "relative aspect-square h-full shrink-0 overflow-hidden rounded-md border border-line bg-bg";

export function FeedPostImages({
  urls,
  large,
  cardPreview = false,
  edgeBleed = true,
  index: indexProp,
  onIndexChange,
  onImageClick,
  className = "",
}: FeedPostImagesProps) {
  const [idxInternal, setIdxInternal] = useState(0);
  const controlled = indexProp !== undefined;
  const idx = controlled ? indexProp : idxInternal;
  const urlsKey = urls.join("\0");

  useEffect(() => {
    if (!controlled) setIdxInternal(0);
    onIndexChange?.(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when image list changes
  }, [urlsKey, controlled]);

  function setIdx(next: number | ((i: number) => number)) {
    const cur = controlled ? (indexProp ?? 0) : idxInternal;
    const resolved =
      typeof next === "function"
        ? next(cur)
        : next;
    const clamped =
      urls.length > 0
        ? ((resolved % urls.length) + urls.length) % urls.length
        : 0;
    if (!controlled) setIdxInternal(clamped);
    onIndexChange?.(clamped);
  }

  if (!urls.length) return null;

  if (!large) {
    return (
      <div className={`${feedPostImageRowClass} ${className}`}>
        {urls.slice(0, 4).map((url, i) => {
          const overflow = i === 3 && urls.length > 4 ? urls.length - 4 : 0;
          const inner = (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              {overflow > 0 ? (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/60 text-lg font-bold text-white">
                  +{overflow}
                </span>
              ) : null}
            </>
          );
          if (onImageClick) {
            return (
              <button
                key={`${url}-${i}`}
                type="button"
                aria-label="이미지 크게 보기"
                onClick={(e) => {
                  e.stopPropagation();
                  setIdx(i);
                  onImageClick();
                }}
                className={`${thumbClass} cursor-zoom-in`}
              >
                {inner}
              </button>
            );
          }
          return (
            <div key={`${url}-${i}`} className={thumbClass}>
              {inner}
            </div>
          );
        })}
      </div>
    );
  }

  const largeWrapClass = edgeBleed
    ? feedPostImageLargeBleedClass
    : "mt-4 w-full max-w-full";

  if (cardPreview) {
    return (
      <div className={`relative ${largeWrapClass} ${className}`}>
        <div className={feedPostImageLargeFrameClass}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={urls[0]}
            alt=""
            className="h-full w-full object-contain"
          />
          {urls.length > 1 ? (
            <span className="pointer-events-none absolute bottom-2 right-2 z-20 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
              1 / {urls.length}
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  const safeIdx =
    urls.length > 0 ? ((idx % urls.length) + urls.length) % urls.length : 0;

  return (
    <div
      className={`relative ${largeWrapClass} ${className}`}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div className={feedPostImageLargeFrameClass}>
        <div className="absolute inset-0 z-0">
          {onImageClick ? (
            <button
              type="button"
              onClick={onImageClick}
              aria-label="이미지 크게 보기"
              className="block h-full w-full cursor-zoom-in"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={urls[safeIdx]}
                alt=""
                className="h-full w-full object-contain"
              />
            </button>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={urls[safeIdx]}
              alt=""
              className="h-full w-full object-contain"
            />
          )}
        </div>
        {urls.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="이전 이미지"
              className={`${navBtnClass} left-2`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setIdx((i) => i - 1);
              }}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="다음 이미지"
              className={`${navBtnClass} right-2`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setIdx((i) => i + 1);
              }}
            >
              ›
            </button>
            <span className="pointer-events-none absolute bottom-2 right-2 z-20 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
              {safeIdx + 1} / {urls.length}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}
