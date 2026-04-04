/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme specific variants
        'bg-dark': '#0f0f0f',
        'bg-darker': '#1a1a1a',
        'bg-light': '#2a2a2a',
        // Accent colors - flattened
        'accent-gold': '#FFD700',
        'accent-yellow': '#FFC107',
        'accent-green': '#10B981',
        'accent-emerald': '#50C878',
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(255, 215, 0, 0.3)',
        'glow-lg': '0 0 40px rgba(255, 215, 0, 0.4)',
      },
      backdropBlur: {
        lg: '10px',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
