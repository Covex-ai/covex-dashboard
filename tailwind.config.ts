import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        covex: {
          black: "#0B0B0C",   // page bg
          steel: "#2A2B30",   // sidebar / panels
          silver: "#D6D7DB",  // secondary text / borders
          ink: "#F4F5F7",     // high-contrast "white"
          accent: "#9BA0AE",  // optional accent
        },
      },
      boxShadow: {
        soft: "0 12px 40px rgba(0,0,0,0.35)",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
};
export default config;
