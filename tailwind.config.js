/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        ink: {
          950: "#12140F",
          900: "#1A1D16",
          850: "#1F231B",
          800: "#232622",
          750: "#2A2E26",
          700: "#31361C",
          600: "#3D4334",
          500: "#525A47",
          400: "#6E7860",
          300: "#939E82",
          200: "#B8C0A9",
          100: "#D6DBC8",
        },
        moss: {
          50: "#EAF1E2",
          100: "#D2E0C0",
          200: "#A5C189",
          300: "#7BA35F",
          400: "#5C7A4F",
          500: "#46613C",
          600: "#34492D",
          700: "#283722",
        },
        amber: {
          50: "#FDF3E0",
          100: "#FAE3B6",
          200: "#F4CB7E",
          300: "#E8A33D",
          400: "#C9851E",
          500: "#A26814",
        },
        brick: {
          300: "#E58A8A",
          400: "#C24D4D",
          500: "#9C3838",
          600: "#7A2A2A",
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', "system-ui", "sans-serif"],
        sans: ['"Noto Sans SC"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(124,163,95,0.25), 0 8px 30px -8px rgba(124,163,95,0.35)",
        panel: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 18px 40px -24px rgba(0,0,0,0.8)",
        inset: "inset 0 1px 0 0 rgba(255,255,255,0.05)",
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(146,158,130,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(146,158,130,0.06) 1px, transparent 1px)",
        noise:
          "radial-gradient(circle at 20% 20%, rgba(232,163,61,0.06), transparent 45%), radial-gradient(circle at 80% 0%, rgba(124,163,95,0.10), transparent 50%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both",
        "scale-in": "scale-in 0.18s ease-out both",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        ticker: "ticker 40s linear infinite",
      },
    },
  },
  plugins: [],
};
