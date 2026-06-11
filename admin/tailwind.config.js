/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#FF6B35",
        secondary: "#1A1A2E",
        accent: "#F7C59F",
        background: "#0F0F1A",
        surface: "#1E1E30",
        border: "#2E2E45",
        error: "#FF4D6D",
        success: "#4CAF88",
        'text-primary': "#F5F5F0",
        'text-muted': "#9090A0",
        'ar-panel': "rgba(15,15,26,0.82)",
      },
      fontFamily: {
        sora: ["Sora", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      borderRadius: {
        '10': '10px',
        '12': '12px',
        '16': '16px',
        '20': '20px',
      },
      boxShadow: {
        'card': '0 4px 24px rgba(0,0,0,0.35)',
        'panel': '0 8px 40px rgba(0,0,0,0.55)',
        'button-active': '0 0 0 3px rgba(255,107,53,0.35)',
      },
      transitionTimingFunction: {
        'pop': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      }
    },
  },
  plugins: [],
}
