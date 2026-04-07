/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        ink: {
          DEFAULT: "#0A0A0F",
          soft: "#1A1A2E",
          muted: "#2D2D44",
        },
        slate: {
          950: "#0B0F19",
        },
        accent: {
          DEFAULT: "#6EE7B7",
          bright: "#34D399",
          dim: "#059669",
        },
        gold: {
          DEFAULT: "#F59E0B",
          light: "#FCD34D",
        },
        danger: {
          DEFAULT: "#F87171",
          dim: "#DC2626",
        },
        maybe: {
          DEFAULT: "#FBBF24",
        },
        surface: {
          DEFAULT: "#111827",
          elevated: "#1F2937",
          border: "#374151",
        },
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease forwards",
        "fade-in": "fadeIn 0.4s ease forwards",
        "slide-in": "slideIn 0.4s ease forwards",
        shimmer: "shimmer 1.5s infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(110, 231, 183, 0.2)" },
          "50%": { boxShadow: "0 0 0 8px rgba(110, 231, 183, 0)" },
        },
      },
    },
  },
  plugins: [],
};
