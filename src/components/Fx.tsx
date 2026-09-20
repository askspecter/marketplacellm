"use client";

import { useEffect } from "react";

/**
 * Neuma motion layer: a trailing custom cursor ring (grows over interactive
 * elements) and scroll-reveal for anything with .reveal. Pure vanilla — no deps,
 * respects reduced-motion, and no-ops on touch devices for the cursor.
 */
export function Fx() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ── Scroll reveal ──
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (reduce) {
      els.forEach((el) => el.classList.add("is-in"));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.classList.add("is-in");
              io.unobserve(e.target);
            }
          }
        },
        { threshold: 0.12 }
      );
      els.forEach((el) => io.observe(el));
    }

    // ── Custom cursor ──
    const canHover = window.matchMedia("(hover: hover)").matches;
    let ring: HTMLDivElement | null = null;
    let raf = 0;
    const pos = { x: -100, y: -100 };
    const cur = { x: -100, y: -100 };

    if (canHover && !reduce) {
      ring = document.createElement("div");
      ring.className = "cursor-ring";
      document.body.appendChild(ring);

      const onMove = (e: MouseEvent) => {
        pos.x = e.clientX;
        pos.y = e.clientY;
        const t = e.target as HTMLElement;
        const hot = !!t.closest("a, button, [data-hover], input, textarea");
        ring?.classList.toggle("hot", hot);
      };
      window.addEventListener("mousemove", onMove);

      const tick = () => {
        cur.x += (pos.x - cur.x) * 0.18;
        cur.y += (pos.y - cur.y) * 0.18;
        if (ring) ring.style.transform = `translate(${cur.x - 17}px, ${cur.y - 17}px)`;
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      return () => {
        window.removeEventListener("mousemove", onMove);
        cancelAnimationFrame(raf);
        ring?.remove();
      };
    }
  }, []);

  return null;
}
