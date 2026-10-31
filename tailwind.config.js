/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#05070a',
        panel: '#0a0f18',
        amber: { DEFAULT: '#f59e0b', hot: '#ff9900' },
        radar: '#00e5ff',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      keyframes: {
        blink: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.25' } },
      },
      animation: { blink: 'blink 1.4s ease-in-out infinite' },
    },
  },
  plugins: [],
};
