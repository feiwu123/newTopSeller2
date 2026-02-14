/** @type {import('tailwindcss').Config} */
module.exports = {
  content: {
    relative: true,
    files: [
      "./dashboard.html",
      "./order-item.html",
      "./pages/**/*.js",
    ],
  },
  theme: {
    extend: {
      colors: {
        primary: "rgb(var(--topm-primary) / <alpha-value>)",
        accent: "rgb(var(--topm-accent) / <alpha-value>)",
        secondary: "rgb(var(--topm-secondary) / <alpha-value>)",
        bglight: "rgb(var(--topm-bglight) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
        glow: "0 0 15px rgb(var(--topm-accent) / 0.15)",
      },
    },
  },
};
