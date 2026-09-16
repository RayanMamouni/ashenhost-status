import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#030303',
        surface: '#0A0A0A',
        'surface-subtle': '#121212',
        border: '#222222',
        'border-active': '#444444',
        accent: {
          DEFAULT: '#9D4EDD', // neon purple
          hover: '#B266FA',
          muted: '#3D155F',
        },
        status: {
          up: '#39FF88', // neon green
          down: '#FF3B3B', // neon red
          degraded: '#FFB800', // amber
          paused: '#666666',
        },
        text: {
          primary: '#EAEAEA',
          secondary: '#888888',
          muted: '#666666',
        },
      },
      fontFamily: {
        heading: ['var(--font-space-grotesk)', 'Space Grotesk', 'sans-serif'],
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-up': '0 0 12px rgba(57, 255, 136, 0.45)',
        'glow-down': '0 0 12px rgba(255, 59, 59, 0.45)',
        'glow-degraded': '0 0 12px rgba(255, 184, 0, 0.45)',
        'glow-accent': '0 0 12px rgba(157, 78, 221, 0.45)',
      },
      borderRadius: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

export default config;
