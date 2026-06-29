"use client";

import { useCallback, useEffect, useState } from "react";

export type PostViewMode = "popup" | "split";
const KEY = "postViewMode";
const CHANGE_EVENT = "postViewModeChange";

function readStored(): PostViewMode {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "popup" || v === "split") return v;
  } catch {}
  return "split";
}

export function usePostViewMode(): [PostViewMode, (m: PostViewMode) => void] {
  const [mode, setMode] = useState<PostViewMode>("split");

  useEffect(() => {
    setMode(readStored());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && (e.newValue === "popup" || e.newValue === "split")) {
        setMode(e.newValue);
      }
    };
    const onCustom = (e: Event) => {
      const d = (e as CustomEvent<PostViewMode>).detail;
      if (d === "popup" || d === "split") setMode(d);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(CHANGE_EVENT, onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CHANGE_EVENT, onCustom);
    };
  }, []);

  const set = useCallback((m: PostViewMode) => {
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
