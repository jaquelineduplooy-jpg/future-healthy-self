/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        berry:  { DEFAULT: '#A72677', light: '#f5e0f0', mid: '#c4508f', dark: '#7a1a57' },
        orange: { DEFAULT: '#FF9759', light: '#fff0e8', dark: '#b05010' },
        mint:   { DEFAULT: '#B2EDD5', light: '#d4f5ea', dark: '#3a9e7a', deep: '#1d6e50' },
        olive:  { DEFAULT: '#BAC35A', light: '#f0f3d0', dark: '#6b7330' },
        gold:   { DEFAULT: '#FBCE1D', light: '#fffbe0', dark: '#8a6e00' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      borderRadius: { card: '14px', pill: '20px' },
      scale: { 98: '0.98' },
    },
  },
  plugins: [],
}
