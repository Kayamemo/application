/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  safelist: [
    { pattern: /^(bg|text|border|ring|from|to|fill|stroke)-primary-/ },
    { pattern: /^(bg|text|border|ring|from|to|fill|stroke)-primary-/, variants: ['hover', 'focus', 'active', 'disabled', 'group-hover'] },
    { pattern: /^(bg|text|border|ring|from|to|fill|stroke)-violet-/ },
    { pattern: /^(bg|text|border|ring|from|to|fill|stroke)-violet-/, variants: ['hover', 'focus'] },
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        violet: {
          50:  '#f5f3ff',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
