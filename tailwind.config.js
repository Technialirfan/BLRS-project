/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#1B4332", light: "#2D6A4F", dark: "#0D2B1F" },
        secondary: { DEFAULT: "#D4AF37", light: "#F0D060" },
        govt: { green: "#1B4332", gold: "#D4AF37" },
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        urdu: ["Noto Nastaliq Urdu", "serif"],
      },
      animation: {
        "pulse-slow": "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
        "count-up": "countup 0.5s ease-out forwards",
      },
    },
  },
  plugins: [],
};
