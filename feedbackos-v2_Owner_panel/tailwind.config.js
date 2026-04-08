/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        bg: '#0a0d12',
        surface: '#111620',
        surface2: '#181f2e',
        surface3: '#1f2940',
        border: '#1e2d45',
        border2: '#263852',
        accent: '#3b82f6',
        accent2: '#60a5fa',
        indigo: '#6366f1',
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
      },
      boxShadow: {
        'card': '0 4px 24px rgba(0,0,0,.4)',
        'card-lg': '0 8px 40px rgba(0,0,0,.5)',
        'accent': '0 3px 12px rgba(59,130,246,.3)',
        'accent-lg': '0 6px 20px rgba(59,130,246,.4)',
      },
      borderRadius: {
        'card': '12px',
        'card-lg': '18px',
      },
      animation: {
        'fade-up': 'fadeUp 0.3s ease',
        'spin-slow': 'spin 1s linear infinite',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          'from': { opacity: '0', transform: 'translateY(14px)' },
          'to': { opacity: '1', transform: 'none' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
    },
  },
  plugins: [],
}
