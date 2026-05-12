"use client";

import { useEffect, useState } from "react";

export type PostViewMode = "popup" | "split";
const KEY = "postViewMode";

export function usePostViewMode(): [PostViewMode, (m: PostViewMode) => void] {
  const [mode, setMode] = useState<PostViewMode>("popup");

  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (v === "popup" || v === "split") setMode(v);
    } catch {}
  }, []);

  function set(m: PostViewMode) {
    setMode(m);
    try {
      localStorage.setItem(KEY, m);
    } catch {}
  }

  return [mode, set];
}
