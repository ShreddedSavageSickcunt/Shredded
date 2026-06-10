/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Refined graphite surfaces — deep and premium, but lifted off pure
        // black so the app feels open rather than closed-in.
        ink: {
          950: "#16181d", // app background (deepest)
          900: "#1e2027", // card / primary surface
          850: "#262932", // raised surface (inputs, pills)
          800: "#30333d", // hover / active
          700: "#3c3f4a", // hairlines, muted borders
        },
        // Warm primary accent.
        flame: {
          50: "#fff7ed",
          100: "#ffedd5",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
        },
        // Data-viz accents for charts / progress / status.
        viz: {
          blue: "#60a5fa",
          violet: "#a78bfa",
          green: "#34d399",
          coral: "#fb7185",
          amber: "#fbbf24",
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
