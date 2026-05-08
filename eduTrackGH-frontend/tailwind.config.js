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
        dashboard: {
          /** Page canvas — deeper than any panel (reference: slate-900 family) */
          canvas: '#0f172a',
          /** Raised panels: cards, sidebar, top bar */
          surface: '#1e293b',
          /** Hover / inset controls */
          elevated: '#334155',
          muted: '#94a3b8',
          accent: '#2563eb',
        },
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
