/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./notification.html",
  ],
  theme: {
    extend: {
      colors: {
        XBaseColor: "#000000",
        XDarkBlue: "#080C34",
        XBlue: "#1f1379",
        XLightBlue: "#e5e9fd",
        XOrange: "#ff6717",
      },
    },
  },
  plugins: [],
};
