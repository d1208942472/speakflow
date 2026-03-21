import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6C63FF',
        'primary-dark': '#5A52E0',
        'primary-light': '#8B84FF',
        nvidia: '#76B900',
        'nvidia-dark': '#5A8C00',
        background: '#0F0F1A',
        card: '#1a1a2e',
        'card-hover': '#1f1f38',
        border: '#2a2a4a',
        muted: '#6b7280',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow':
          'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(108,99,255,0.15) 0%, transparent 60%)',
        'card-gradient':
          'linear-gradient(135deg, rgba(108,99,255,0.08) 0%, rgba(118,185,0,0.04) 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          from: { boxShadow: '0 0 20px rgba(108,99,255,0.2)' },
          to: { boxShadow: '0 0 40px rgba(108,99,255,0.5)' },
        },
      },
      boxShadow: {
        'glow-purple': '0 0 30px rgba(108,99,255,0.3)',
        'glow-green': '0 0 30px rgba(118,185,0,0.3)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}

export default config
