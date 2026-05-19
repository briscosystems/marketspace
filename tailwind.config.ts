import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f6ff",
          100: "#dbeaff",
          200: "#b8d4ff",
          300: "#8bb6ff",
          400: "#5b91f5",
          500: "#2d6dd9",
          600: "#1f56b8",
          700: "#1a4392",
          800: "#15336e",
          900: "#0f2247",
        },
        accent: {
          50: "#fef7ec",
          100: "#fdedcd",
          200: "#fbd99a",
          300: "#f9c161",
          400: "#f6a738",
          500: "#e88a14",
          600: "#c66c0e",
          700: "#9d4f0f",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15, 34, 71, 0.04), 0 4px 12px rgba(15, 34, 71, 0.06)",
        lift: "0 4px 16px rgba(15, 34, 71, 0.08), 0 12px 32px rgba(15, 34, 71, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
