// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#05070f",
        panel: "#0b101f",
        neon: "#22d3ee",
        violet2: "#8b5cf6",
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      boxShadow: { glow: "0 0 24px rgba(34,211,238,0.25)" },
    },
  },
  plugins: [],
};
