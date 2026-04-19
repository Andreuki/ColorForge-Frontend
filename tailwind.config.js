/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Cinzel Decorative', 'serif'],
        heading: ['Cinzel', 'serif'],
        body: ['Crimson Text', 'serif'],
        ui: ['Rajdhani', 'sans-serif'],
      },
      colors: {
        cf: {
          black: '#080709',
          surface: '#0f0d10',
          surface2: '#16131a',
          surface3: '#1e1924',
          gold: '#C8922A',
          'gold-light': '#e8b458',
          'gold-dim': '#7a5218',
          crimson: '#7a1c1c',
          'crimson-light': '#c0392b',
          steel: '#3a3d4a',
          'steel-light': '#6b7080',
          parchment: '#e8dcc8',
          'parchment-dim': '#a89880',
          'parchment-muted': '#5a5040',
        }
      },
      boxShadow: {
        'gold-sm': '0 2px 8px rgba(200,146,42,0.15)',
        'gold-md': '0 4px 20px rgba(200,146,42,0.25)',
        'gold-lg': '0 8px 32px rgba(200,146,42,0.35)',
        'gold-glow': '0 0 16px rgba(200,146,42,0.4)',
        'card': '0 4px 24px rgba(0,0,0,0.6)',
      },
      borderColor: {
        'gold-subtle': 'rgba(200,146,42,0.2)',
        'gold-hover': 'rgba(200,146,42,0.6)',
      },
      letterSpacing: {
        'widest-cf': '0.12em',
        'wide-cf': '0.08em',
      },
      animation: {
        shimmer: 'shimmer 3s linear 1',
        'fade-up': 'fadeUp 0.4s ease both',
        'fade-up-2': 'fadeUp 0.4s ease 0.1s both',
        'fade-up-3': 'fadeUp 0.4s ease 0.2s both',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        }
      },
    },
  },
  plugins: [],
};
