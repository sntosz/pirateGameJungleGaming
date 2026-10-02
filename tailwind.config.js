/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          dark: '#0e2b3d',
          DEFAULT: '#1b4d6e',
          light: '#2d7ca8',
        },
        pirate: {
          gold: '#f3a833',
          red: '#c0392b',
          wood: '#8d5524',
          darkwood: '#4a2c11',
          parchment: '#f4e8c1',
        }
      },
    },
  },
  plugins: [],
}
