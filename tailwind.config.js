/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      colors: {
        brand: {
          white: '#FDFEFD',
          forest: '#196716',
          forestHover: '#135211',
          sage: '#588F54',
          soft: '#91BD8D',
          pale: '#C5E1C1',
          light: '#E9F8E7',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        tamil: ['"Noto Sans Tamil"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
