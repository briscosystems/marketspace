import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brisco-Markenfarbe: offizielles Lime-Grün #abd91a (Signatur = 400),
        // dunklere Grüntöne ab 500 für lesbare Buttons/Links mit weißer Schrift.
        brand: {
          50: "#f6fbe9",
          100: "#e9f6c9",
          200: "#d3ec93",
          300: "#bfe45c",
          400: "#abd91a",
          500: "#93c113",
          600: "#74980f",
          700: "#587209",
          800: "#45580b",
          900: "#3a4a0e",
        },
        // Brisco-Grau (aus dem Logo, #4f4c4d) — neutrale Sekundärfarbe.
        graphite: {
          50: "#f5f5f5",
          100: "#e7e7e7",
          200: "#cfcecf",
          300: "#aaa9aa",
          400: "#7d7b7c",
          500: "#5f5d5e",
          600: "#4f4c4d",
          700: "#403e3f",
          800: "#333132",
          900: "#262425",
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
        soft: "0 1px 2px rgba(38, 36, 37, 0.05), 0 4px 12px rgba(38, 36, 37, 0.07)",
        lift: "0 4px 16px rgba(38, 36, 37, 0.09), 0 12px 32px rgba(38, 36, 37, 0.09)",
      },
    },
  },
  plugins: [],
};

export default config;
