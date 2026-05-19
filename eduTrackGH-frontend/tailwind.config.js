/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#081120',
          light: '#f1f5f9',
        },
        sidebar: {
          DEFAULT: '#0b1628',
          light: '#ffffff',
        },
        glass: {
          DEFAULT: 'rgba(255,255,255,0.06)',
          light: 'rgba(255,255,255,0.72)',
          border: 'rgba(255,255,255,0.08)',
        },
        accent: {
          DEFAULT: '#22c55e',
          hover: '#4ade80',
          muted: 'rgba(34, 197, 94, 0.12)',
        },
        dashboard: {
          canvas: '#081120',
          surface: 'rgba(255,255,255,0.06)',
          elevated: '#0b1628',
          muted: '#94a3b8',
          accent: '#22c55e',
        },
        uds: {
          green: '#006838',
          'green-light': '#22c55e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        glass: '0 4px 24px rgba(0, 0, 0, 0.12)',
        'glass-sm': '0 1px 3px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
};
