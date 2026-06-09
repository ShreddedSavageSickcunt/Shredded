/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Near-black canvas + charcoal surfaces (sleek dark fitness-app look).
        ink: {
          950: "#0a0a0b", // app background
          900: "#141416", // card / surface
          850: "#1b1b1e", // raised surface (inputs, pills)
          800: "#26262b", // hover / active pill
          700: "#33333a", // hairline-ish
        },
        // Energetic primary accent.
        flame: {
          50: "#fff7ed",
          100: "#ffedd5",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
        },
        // Data-viz accents used for charts / insight icons.
        viz: {
          blue: "#3b82f6",
          violet: "#8b5cf6",
          green: "#34d399",
          coral: "#fb7185",
        },
      },
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
    },
  },
  plugins: [],
};
