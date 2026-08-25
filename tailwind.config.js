/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef6ff', 100: '#daeaff', 200: '#bdd9ff',
          300: '#90c0ff', 400: '#5b9fff', 500: '#2563eb',
          600: '#1d4ed8', 700: '#1e40af', 800: '#1e3a8a', 900: '#1e3060',
        },
        gold: { 400: '#f59e0b', 500: '#d97706' },
      },
      fontFamily: {
        display: ['Barlow Condensed', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
