/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./notification.html",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Legacy colors (preserved for backward compat)
        XBaseColor: "#000000",
        XDarkBlue: "#080C34",
        XBlue: "#1f1379",
        XLightBlue: "#e5e9fd",
        XOrange: "#ff6a2e",

        // Dark theme palette
        dark: {
          bg: "#111318",
          card: "#1A1E27",
          border: "#2A2F39",
          surface: "#1F242E",
        },
        // Semantic text colors
        txt: {
          primary: "#FFFFFF",
          secondary: "#9AA2B1",
          muted: "#6E7584",
        },
        // Accent colors
        accent: {
          blue: "#2F80FF",
          teal: "#22D3EE",
          green: "#22C55E",
          red: "#FF4D6D",
          orange: "#FF6A2E",
        },
      },
    },
  },
  plugins: [],
};
