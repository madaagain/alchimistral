/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          0: '#0a0a0a',
          1: '#111111',
          2: '#1a1a1a',
          3: '#222222',
        },
        border: {
          DEFAULT: 'rgba(255,255,255,0.08)',
          subtle: 'rgba(255,255,255,0.05)',
        },
        text: {
          primary: '#f0f0f0',
          secondary: '#888888',
          tertiary: '#444444',
          quaternary: '#2a2a2a',
        },
        status: {
          blue: '#3b82f6',
          green: '#22c55e',
          amber: '#f59e0b',
          red: '#ef4444',
          purple: '#a855f7',
          cyan: '#06b6d4',
        },
      },
      fontFamily: {
        sans: ["'Geist'", '-apple-system', 'sans-serif'],
        mono: ["'Geist Mono'", 'monospace'],
      },
    },
  },
  plugins: [],
}
