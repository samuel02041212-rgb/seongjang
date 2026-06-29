"use client";

import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";
const KEY = "theme";
const CHANGE_EVENT = "themeChange";

function readStored(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "light" || v === "dark") return v;
  } catch {}
  return "light";
}

function applyTheme(t: Theme) {
  document.documentElement.classList.toggle("dark", t === "dark");
}

export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const t = readStored();
    setThemeState(t);
    applyTheme(t);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && (e.newValue === "light" || e.newValue === "dark")) {
        setThemeState(e.newValue);
        applyTheme(e.newValue);
      }
    };
    const onCustom = (e: Event) => {
      const d = (e as CustomEvent<Theme>).detail;
      if (d === "light" || d === "dark") {
        setThemeState(d);
        applyTheme(d);
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(CHANGE_EVENT, onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CHANGE_EVENT, onCustom);
    };
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem(KEY, t);
    } catch {}
    applyTheme(t);
    try {
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: t }));
    } catch {}
  }, []);

  return [theme, setTheme];
}
