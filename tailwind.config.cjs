/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'pirate-gold': '#f3a833',
        'pirate-red': '#b8322a',
      },
    },
  },
  plugins: [],
};