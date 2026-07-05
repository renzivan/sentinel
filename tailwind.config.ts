import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#f06e22",
          50: "#fef3ec",
          100: "#fde3d1",
          200: "#fbc4a2",
          300: "#f89e6a",
          400: "#f4823f",
          500: "#f06e22",
          600: "#dd5712",
          700: "#b74311",
          800: "#913715",
          900: "#753014",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
