import type { Config } from "tailwindcss";

/**
 * LLMPad — "compute terminal" design tokens.
 * Near-black canvas, electric cyan → lime signature, hairline glass, mono accents.
 * (Intentionally distinct from any upstream launchpad UI — built fresh here.)
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#08090c",
          soft: "#0d0f14",
          panel: "#12151c",
          raised: "#171b24",
          line: "rgba(255,255,255,0.08)",
        },
        cyan: {
          DEFAULT: "#22d3ee",
          soft: "#67e8f9",
          deep: "#0e7490",
        },
        lime: {
          DEFAULT: "#a3e635",
          soft: "#bef264",
        },
        ember: "#fb7185",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        signature: "linear-gradient(135deg, #22d3ee 0%, #a3e635 100%)",
        "signature-soft": "linear-gradient(135deg, rgba(34,211,238,0.16), rgba(163,230,53,0.16))",
      },
      boxShadow: {
        glow: "0 0 40px rgba(34,211,238,0.18)",
        panel: "0 12px 48px rgba(0,0,0,0.5)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        pulseline: { "0%,100%": { opacity: "0.4" }, "50%": { opacity: "1" } },
        rise: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: {
        pulseline: "pulseline 2s ease-in-out infinite",
        rise: "rise .3s ease",
      },
    },
  },
  plugins: [],
};

export default config;
