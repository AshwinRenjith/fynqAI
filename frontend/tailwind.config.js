/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        horizon: {
          50: '#f6f7fb',
          100: '#eceff5',
          200: '#d7dbff',
          300: '#c0c8ff',
          500: '#6f7cff',
          600: '#4654e9',
          900: '#2d2b5a',
        },
        obsidian: '#111217',
        mist: 'rgba(255, 255, 255, 0.75)',
      },
      boxShadow: {
        glow: '0 32px 80px rgba(109, 128, 255, 0.28)',
        glass: 'inset 0 1px 0 rgba(255, 255, 255, 0.45), 0 20px 60px rgba(24, 37, 89, 0.12)',
      },
      backdropBlur: {
        xs: '6px',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
