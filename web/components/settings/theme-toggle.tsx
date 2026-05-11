"use client";

import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useTheme();

  return (
    <div className="mt-3 inline-flex rounded-full border border-line p-1 text-xs font-medium">
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`rounded-full px-4 py-1.5 transition ${
          theme === "light"
            ? "bg-accent text-accent-foreground"
            : "text-muted hover:text-ink"
        }`}
      >
        라이트
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`rounded-full px-4 py-1.5 transition ${
          theme === "dark"
            ? "bg-accent text-accent-foreground"
            : "text-muted hover:text-ink"
        }`}
      >
        다크
      </button>
    </div>
  );
}
