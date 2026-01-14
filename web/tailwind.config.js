/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ========================================
      // PRADEEP ELITE • DESIGN SYSTEM 1.0
      // Liquid Metal & Clinical Precision
      // ========================================
      colors: {
        // Slate neutrals - main palette
        slate: {
          50: '#f8fafc',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          900: '#0f172a',
        },
        // Sky blues - primary brand
        sky: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          600: '#0284c7',
        },
        // Semantic colors
        amber: {
          500: '#f59e0b',
        },
        emerald: {
          600: '#059669',
        },
        // Surface colors - Clinical precision
        surface: {
          main: '#f8fafc', // bg-slate-50
          white: '#ffffff',
          elevated: '#ffffff',
        },
        // Border system - Milled edges
        border: {
          DEFAULT: '#cbd5e1', // slate-300
          hover: '#94a3b8', // slate-400
          subtle: '#e2e8f0',
        },
        // Text hierarchy
        text: {
          body: '#0f172a', // slate-900
          muted: '#64748b', // slate-500
          subtle: '#94a3b8', // slate-400
        },
      },
      // Typography - Inter font with role-based styles
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      fontSize: {
        // Headers: bold, compact
        'header-lg': ['2rem', { lineHeight: '1.15', letterSpacing: '-0.022em', fontWeight: '700' }],
        'header-md': ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.018em', fontWeight: '700' }],
        'header-sm': ['1.25rem', { lineHeight: '1.25', letterSpacing: '-0.012em', fontWeight: '700' }],
        // Body: clean readable
        'body-base': ['0.875rem', { lineHeight: '1.75', letterSpacing: '-0.011em' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.6', letterSpacing: '-0.008em' }],
        // Micro-labels: uppercase technical
        'micro-label': ['0.625rem', { lineHeight: '1.35', letterSpacing: '0.1em', fontWeight: '700' }],
      },
      // Spacing - maintains 8px grid
      spacing: {
        18: '4.5rem', // 72px
        22: '5.5rem', // 88px
        26: '6.5rem', // 104px
        30: '7.5rem', // 120px
      },
      // Hybrid Geometry
      borderRadius: {
        'container': '1rem', // rounded-2xl for containers (Cards, Sidebar)
        'action': '0.375rem', // rounded-md for actions (Buttons, Inputs, List Items)
        sm: '0.125rem', // rounded-sm for badges
        DEFAULT: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      // Shadows - Milled Edge & Recessed Input
      boxShadow: {
        // The "Milled Edge" - 1px darker ring + 1px inner white highlight + subtle lift
        'milled-edge': 'inset 0 1px 0 0 #ffffff, 0 0 0 1px #cbd5e1, 0 2px 6px 0 rgba(0,0,0,0.02)',
        // Recessed Input - tactile depth
        'recessed-input': 'inset 0 2px 4px 0 rgba(0,0,0,0.02), 0 1px 0 0 #ffffff',
        // Lift variations
        'lift-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'lift-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'lift-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        // Legacy shadows (preserved for compatibility)
        xs: '0 1px 2px rgba(2, 6, 23, 0.04)',
        sm: '0 1px 3px rgba(2, 6, 23, 0.06), 0 1px 2px rgba(2, 6, 23, 0.04)',
        md: '0 6px 14px rgba(2, 6, 23, 0.06), 0 2px 6px rgba(2, 6, 23, 0.04)',
        lg: '0 14px 30px rgba(2, 6, 23, 0.08), 0 6px 14px rgba(2, 6, 23, 0.05)',
        xl: '0 22px 50px rgba(2, 6, 23, 0.10), 0 10px 22px rgba(2, 6, 23, 0.06)',
      },
      // Animation timing
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        fastest: '150ms',
        fast: '200ms',
        DEFAULT: '250ms',
        slow: '300ms',
      },
      // Animations - including Sheen effect
      animation: {
        'sheen': 'sheen 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        'tactile-lift': 'tactile-lift 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in': 'fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        // Sheen effect - diagonal gloss sweep on primary buttons
        'sheen': {
          '0%': { transform: 'translateX(-150%) skewX(-20deg)' },
          '100%': { transform: 'translateX(200%) skewX(-20deg)' },
        },
        // Tactile lift - cards move up 1px on hover
        'tactile-lift': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-1px)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}