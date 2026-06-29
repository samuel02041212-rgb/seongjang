"use client";

import { useCallback, useEffect, useState } from "react";

export type FeedLayoutMode = "daily" | "timeline";
export const FEED_LAYOUT_TIMELINE = "timeline" as const;

const KEY = "feedLayoutMode";
const CHANGE_EVENT = "feedLayoutModeChange";

function readStored(): FeedLayoutMode {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "daily" || v === "timeline") return v;
  } catch {}
  return "timeline";
}

export function useFeedLayoutMode(): [FeedLayoutMode, (m: FeedLayoutMode) => void] {
  const [mode, setMode] = useState<FeedLayoutMode>("timeline");

  useEffect(() => {
    setMode(readStored());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && (e.newValue === "daily" || e.newValue === "timeline")) {
        setMode(e.newValue);
      }
    };
    const onCustom = (e: Event) => {
      const d = (e as CustomEvent<FeedLayoutMode>).detail;
      if (d === "daily" || d === "timeline") setMode(d);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(CHANGE_EVENT, onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CHANGE_EVENT, onCustom);
    };
  }, []);

  const set = useCallback((m: FeedLayoutMode) => {
    setMode(m);
    try {
      localStorage.setItem(KEY, m);
    } catch {}
    try {
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: m }));
    } catch {}
  }, []);

  return [mode, set];
}
