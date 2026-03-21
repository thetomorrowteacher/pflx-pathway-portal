/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pflx: {
          cyan: '#00d4ff',
          teal: '#00b8d4',
          dark: '#0a0e17',
          darker: '#060a12',
          panel: 'rgba(0, 212, 255, 0.08)',
          border: 'rgba(0, 212, 255, 0.3)',
          glow: 'rgba(0, 212, 255, 0.5)',
          magenta: '#ff00ff',
          purple: '#8b5cf6',
          yellow: '#ffd700',
        },
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        body: ['Rajdhani', 'sans-serif'],
      },
      boxShadow: {
        'pflx-glow': '0 0 20px rgba(0, 212, 255, 0.3), 0 0 60px rgba(0, 212, 255, 0.1)',
        'pflx-glow-strong': '0 0 30px rgba(0, 212, 255, 0.5), 0 0 80px rgba(0, 212, 255, 0.2)',
      },
    },
  },
  plugins: [],
};
