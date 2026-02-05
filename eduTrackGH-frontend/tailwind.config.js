/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // UDS Brand Colors
        uds: {
          green: '#006838',
          'green-light': '#4CAF50',
          'green-dark': '#004d29',
          blue: '#1E40AF',
          'blue-light': '#3B82F6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
