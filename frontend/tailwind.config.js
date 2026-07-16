/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8f0fe',
          100: '#c7ddfb',
          200: '#a3c8f8',
          300: '#7fb2f5',
          400: '#5c9cf2',
          500: '#2E5BFF',
          600: '#1E3A5F',
          700: '#162d4a',
          800: '#0f2135',
          900: '#071520',
        }
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}