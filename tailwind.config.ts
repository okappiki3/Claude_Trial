import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        border: "var(--border)",
        text: "var(--text)",
        "text-muted": "var(--text-muted)",
        tech: "#0ea5e9",
        biz: "#8b5cf6",
        mkt: "#f59e0b",
      },
      fontFamily: {
        sans: [
          "Noto Sans JP",
          "Hiragino Kaku Gothic ProN",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        serif: ["Noto Serif JP", "ui-serif", "serif"],
      },
      keyframes: {
        fadeSlideIn: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeSlideIn: "fadeSlideIn 0.35s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
