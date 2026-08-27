/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(16 24 40 / 0.06), 0 1px 3px 0 rgb(16 24 40 / 0.10)',
        lift: '0 12px 32px -12px rgb(30 64 175 / 0.35)',
        pop: '0 4px 12px -2px rgb(16 24 40 / 0.12)',
      },
      backgroundImage: {
        brand: 'linear-gradient(135deg, #1e40af 0%, #312e81 55%, #1e1b4b 100%)',
        'brand-soft': 'linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)',
        sidebar: 'linear-gradient(180deg, #0f172a 0%, #101c3f 60%, #172554 100%)',
      },
      animation: {
        'fade-up': 'fadeUp .45s cubic-bezier(.16,1,.3,1) both',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        },
      },
    },
  },
  plugins: [],
};
