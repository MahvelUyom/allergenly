import type { Config } from "tailwindcss";

// Design tokens sourced directly from allergenly-design-spec.md (§1.3–§1.7).
// Do not add ad-hoc colors/radii elsewhere — extend this file instead so the
// whole app stays a single source of truth for the design system.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        primary: {
          DEFAULT: "#0F766E", // Deep Teal
          hover: "#115E59",
          tint: "#F0FDFA",
        },
        charcoal: "#1F2937",
        amber: {
          DEFAULT: "#F59E0B",
          tint: "#FEF3C7",
          text: "#92400E",
        },
        danger: {
          DEFAULT: "#DC2626",
          hover: "#B91C1C",
          tint: "#FEE2E2",
        },
        success: {
          DEFAULT: "#16A34A",
          tint: "#DCFCE7",
        },
        bg: "#F9FAFB",
        border: "#E5E7EB",
        neutralchip: {
          DEFAULT: "#F3F4F6",
          text: "#6B7280",
        },
      },
      borderRadius: {
        card: "12px",
        control: "8px",
        pill: "999px",
        none: "0px",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0,0,0,0.06)",
      },
      fontSize: {
        h1: ["32px", { lineHeight: "1.2", fontWeight: "700" }],
        h2: ["24px", { lineHeight: "1.3", fontWeight: "600" }],
        h3: ["18px", { lineHeight: "1.4", fontWeight: "600" }],
        body: ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        label: ["14px", { lineHeight: "1.4", fontWeight: "500" }],
        micro: ["12px", { lineHeight: "1.4", fontWeight: "500" }],
      },
      spacing: {
        18: "4.5rem",
      },
      maxWidth: {
        legal: "1200px",
        legalcontent: "720px",
      },
    },
  },
  plugins: [],
};

export default config;
