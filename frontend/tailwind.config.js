/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fdf3f3',
          100: '#fce8e8',
          200: '#f9d0d0',
          300: '#f4a9a9',
          400: '#ec7474',
          500: '#e04545',
          600: '#cc2a2a',
          700: '#ab2020',
          800: '#8d1f1f',
          900: '#761f1f',
        },
        dark: {
          900: '#0d0f12',
          800: '#141720',
          700: '#1c2030',
          600: '#252a3d',
          500: '#2f3550',
        },
      },
    },
  },
  plugins: [],
}
