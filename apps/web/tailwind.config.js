/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#08111F',
        surface: '#0F1B2D',
        'surface-elevated': '#13233A',
        primary: '#38BDF8',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#F43F5E',
        'text-primary': '#F8FAFC',
        'text-secondary': '#CBD5E1',
        muted: '#94A3B8',
        border: 'rgba(255,255,255,0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
