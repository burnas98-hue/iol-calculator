/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        medical: {
          50:  '#f0f7ff',
          100: '#e0efff',
          200: '#baddff',
          300: '#7dbeff',
          400: '#3a9bf5',
          500: '#1a7de0',
          600: '#0f5fb8',
          700: '#0e4d96',
          800: '#10407c',
          900: '#123768',
        },
        app: {
          text:   '#27272A',
          muted:  '#9F9FA9',
          bg:     '#F6F6F7',
          border: '#E4E4E7',
          error:  '#C10007',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
