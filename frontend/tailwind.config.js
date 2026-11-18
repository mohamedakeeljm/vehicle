/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sunset Amber & Charcoal Obsidian Palette (Zero blue)
        navy: {
          950: '#0F0F11', // Deep charcoal black
          900: '#18181B', // Rich zinc / obsidian charcoal
          800: '#27272A', // Neutral charcoal card
          700: '#3F3F46', // Charcoal border / hover
        },
        royal: {
          600: '#D97706', // Sunset Amber / Warm Gold
          500: '#F59E0B', // Golden Glow
          400: '#FBBF24', // Light Amber
        },
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
      },
    },
  },
  plugins: [],
}
