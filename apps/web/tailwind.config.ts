import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        trail: {
          green: "#2D6A4F",
          lime: "#74C69D",
          earth: "#B7A99A",
          sky: "#90E0EF",
          dark: "#1B1F23",
        },
      },
    },
  },
  plugins: [],
};

export default config;
