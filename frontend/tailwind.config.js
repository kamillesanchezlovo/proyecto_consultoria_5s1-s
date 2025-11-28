// frontend/tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "var(--primario)",
          secondary: "var(--secundario)",
          tertiary: "var(--terciario)",
          quaternary: "var(--cuaternario)",
          quinario: "var(--quinario)",
          accent: "var(--acento)",
          accent2: "var(--acento-2)",
        },
      },
      boxShadow: {
        soft: "0 10px 25px rgba(0,0,0,0.04)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
      },
    },
  },
  plugins: [],
};
