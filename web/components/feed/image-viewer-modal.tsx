"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  urls: string[];
  index: number;
  open: boolean;
  onClose: () => void;
  onIndexChange: (i: number) => void;
};

const MIN_SCALE = 1;
const MAX_SCALE = 6;

export function ImageViewerModal({
  urls,
  index,
  open,
  onClose,
  onIndexChange,
}: Props) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const reset = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (open) reset();
  }, [open, index, reset]);

  const prev = useCallback(() => {
    if (urls.length <= 1) return;
    onIndexChange((index - 1 + urls.length) % urls.length);
  }, [index, urls.length, onIndexChange]);

  const next = useCallback(() => {
    if (urls.length <= 1) return;
    onIndexChange((index + 1) % urls.length);
  }, [index, urls.length, onIndexChange]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "+" || e.key === "=") zoomBy(1.2);
      else if (e.key === "-" || e.key === "_") zoomBy(1 / 1.2);
      else if (e.key === "0") reset();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose, reset, prev, next]);

  function zoomBy(factor: number) {
    setScale((s) => {
      const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, s * factor));
      if (nextScale === 1) setOffset({ x: 0, y: 0 });
      return nextScale;
    });
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    zoomBy(e.deltaY > 0 ? 1 / 1.15 : 1.15);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (scale <= 1) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    setOffset({ x: d.ox + (e.clientX - d.x), y: d.oy + (e.clientY - d.y) });
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  if (!open || urls.length === 0) return null;
  const src = urls[index];
  if (!src) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/85"
        aria-label="닫기"
        onClick={onClose}
      />
      <div
        className="relative flex h-full w-full items-center justify-center overflow-hidden touch-none select-none"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={() => (scale > 1 ? reset() : zoomBy(2))}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          draggable={false}
          className="max-h-full max-w-full"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transition: dragRef.current ? "none" : "transform 0.12s ease-out",
            cursor: scale > 1 ? (dragRef.current ? "grabbing" : "grab") : "zoom-in",
          }}
        />
      </div>

      {urls.length > 1 ? (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="이전 이미지"
            className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-2xl font-bold text-white backdrop-blur hover:bg-white/25"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="다음 이미지"
            className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-2xl font-bold text-white backdrop-blur hover:bg-white/25"
          >
            ›
          </button>
        </>
      ) : null}

      <div className="absolute right-4 top-4 z-10 flex items-center gap-1">
        <button
          type="button"
          onClick={() => zoomBy(1 / 1.25)}
          aria-label="축소"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-xl font-bold text-white backdrop-blur hover:bg-white/25"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => zoomBy(1.25)}
          aria-label="확대"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-xl font-bold text-white backdrop-blur hover:bg-white/25"
        >
          +
        </button>
        <button
          type="button"
          onClick={reset}
          aria-label="원본 크기"
          className="rounded-full bg-white/15 px-3 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/25"
        >
          1x
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-xl font-bold text-white backdrop-blur hover:bg-white/25"
        >
          ×
        </button>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
          {Math.round(scale * 100)}%
        </span>
        {urls.length > 1 ? (
          <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
            {index + 1} / {urls.length}
          </span>
        ) : null}
      </div>
    </div>
  );
}
