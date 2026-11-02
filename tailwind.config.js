/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#000000',
        obsidian: '#09090b',
        panel: 'rgba(9, 9, 11, 0.85)',
        tao: {
          DEFAULT: '#ffffff',
          silver: '#e4e4e7',
          muted: '#71717a',
          dark: '#18181b',
        },
        crimson: {
          DEFAULT: '#ef4444',
          hot: '#dc2626',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        blink: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.25' } },
      },
      animation: {
        blink: 'blink 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
