/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#e5eff5',
          panel: '#dce8f2',
          card: '#cddfe9',
          cardLight: '#d8e7f1',
          hover: '#c3d7e3',
          border: 'rgba(160, 190, 215, 0.4)',
        },
        sidebar: {
          bg: '#0e1013',
          hover: '#1a1d22',
          active: '#272a31',
        },
        accent: {
          black: '#0e1013',
          white: '#ffffff',
          blue: '#3b82f6',
          cyan: '#06b6d4',
          success: '#10b981',
          successBg: '#d1fae5',
          danger: '#f43f5e',
          dangerBg: '#ffe4e6',
          warning: '#f59e0b',
          warningBg: '#fef3c7',
        },
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(90, 120, 150, 0.08)',
        'float': '0 10px 30px -4px rgba(20, 35, 60, 0.12)',
      }
    },
  },
  plugins: [],
};

