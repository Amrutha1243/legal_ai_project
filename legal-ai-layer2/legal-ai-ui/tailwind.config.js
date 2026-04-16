/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
      },
      colors: {
        brand: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          500: '#334e68',
          700: '#243b53',
          900: '#102a43',
        }
      }
    },
  },
  plugins: [],
}
