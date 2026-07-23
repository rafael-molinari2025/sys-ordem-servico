/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        app: "#0B1220",
        surface: "#111827",
        card: "#161f2e",
        line: "#1F2937",
      },
    },
  },
  plugins: [],
};
