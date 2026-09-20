"use client";

import { useEffect, useState } from "react";

/** Light/dark toggle — flips [data-theme] on <html> (CSS vars do the rest). */
export function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.getAttribute("data-theme") === "light");
  }, []);

  function toggle() {
    const next = !light;
    setLight(next);
    const el = document.documentElement;
    if (next) el.setAttribute("data-theme", "light");
    else el.removeAttribute("data-theme");
    try {
      localStorage.setItem("neuma.theme", next ? "light" : "dark");
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      style={{
        width: 40, height: 40, borderRadius: 999, border: "1px solid var(--border)", background: "var(--card-2)",
        display: "grid", placeItems: "center", cursor: "pointer", fontSize: 16, color: "var(--text)", flexShrink: 0,
      }}
    >
      {light ? "☾" : "☀"}
    </button>
  );
}
