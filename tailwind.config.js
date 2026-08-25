/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Palette Inetum (relevée sur inetum.com/fr/accueil/services/salesforce.html) :
        // bleu marine #232D4B (primaire) et magenta #E20074 (accent).
        brand: {
          50:  '#eef1f7', 100: '#d7deeb', 200: '#aab6d1',
          300: '#7d8fb7', 400: '#4a5c8a', 500: '#2f3f66',
          600: '#232d4b', 700: '#1c243c', 800: '#161c2e', 900: '#10141f',
        },
        gold: { 400: '#ff5fa3', 500: '#e20074' },
      },
      fontFamily: {
        display: ['Barlow Condensed', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
