module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}","./components/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      boxShadow:{ glow:"0 0 30px rgba(59,130,246,0.35)", neon:"0 0 40px rgba(99,102,241,0.5)" },
      backgroundImage: { hero: "radial-gradient(ellipse at top, rgba(59,130,246,.25), transparent), radial-gradient(ellipse at bottom, rgba(147,51,234,.2), transparent)" }
    }
  },
  plugins: []
};
