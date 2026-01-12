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
      // LIQUID CLOUD DESIGN SYSTEM - 2026
      // Production-ready tokens with 8px grid
      // ========================================
      colors: {
        // Surface colors - soft whites with subtle hierarchy
        surface: {
          primary: '#FAFBFC',
          secondary: '#F8FAFC',
          tertiary: '#FFFFFF',
          elevated: '#FFFFFF',
        },
        // Text hierarchy - zinc-based scale
        text: {
          primary: '#18181B', // zinc-900
          secondary: '#3F3F46', // zinc-700
          tertiary: '#71717A', // zinc-500
          quaternary: '#A1A1AA', // zinc-400
        },
        // Border system with clear hierarchy
        border: {
          DEFAULT: '#E4E4E7', // zinc-200
          subtle: '#F4F4F5', // zinc-100
          strong: '#D4D4D8', // zinc-300
          focus: '#3B82F6', // blue-500
        },
        // Accent colors - primary blue with variants
        accent: {
          primary: '#3B82F6', // blue-500
          secondary: '#6366F1', // indigo-500
          tertiary: '#8B5CF6', // violet-500
          'primary-soft': '#EFF6FF', // blue-50
          'secondary-soft': '#EEF2FF', // indigo-50
          'tertiary-soft': '#F5F3FF', // violet-50
        },
        // Semantic colors with background variants
        semantic: {
          success: '#22C55E', // green-500
          'success-bg': '#DCFCE7', // green-100
          'success-border': '#BBF7D0', // green-200
          warning: '#F59E0B', // amber-500
          'warning-bg': '#FEF3C7', // amber-100
          'warning-border': '#FDE68A', // amber-200
          error: '#EF4444', // red-500
          'error-bg': '#FEE2E2', // red-100
          'error-border': '#FECACA', // red-200
          info: '#3B82F6', // blue-500
          'info-bg': '#DBEAFE', // blue-100
          'info-border': '#BFDBFE', // blue-200
        },
        // Glass surfaces for glassmorphism effects
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.60)',
          strong: 'rgba(255, 255, 255, 0.72)',
          border: 'rgba(255, 255, 255, 0.45)',
          highlight: 'rgba(255, 255, 255, 0.85)',
        },
      },
      // Typography - Inter Variable + JetBrains Mono
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      // Font size scale with proper line-height and letter-spacing
      fontSize: {
        // Display sizes with fluid scaling
        display: [
          'clamp(2.5rem, 1.7rem + 3.3vw, 4.5rem)',
          { lineHeight: '1.02', letterSpacing: '-0.04em' },
        ],
        headline: [
          'clamp(1.875rem, 1.35rem + 2.0vw, 3rem)',
          { lineHeight: '1.08', letterSpacing: '-0.035em' },
        ],
        title: [
          'clamp(1.5rem, 1.23rem + 1.1vw, 2.25rem)',
          { lineHeight: '1.15', letterSpacing: '-0.022em' },
        ],
        subtitle: [
          'clamp(1.125rem, 1.06rem + 0.35vw, 1.375rem)',
          { lineHeight: '1.35', letterSpacing: '-0.012em' },
        ],
        // Body sizes
        'body-lg': [
          'clamp(1.0625rem, 1.02rem + 0.25vw, 1.25rem)',
          { lineHeight: '1.6', letterSpacing: '-0.012em' },
        ],
        body: [
          'clamp(1rem, 0.97rem + 0.15vw, 1.125rem)',
          { lineHeight: '1.65', letterSpacing: '-0.011em' },
        ],
        // Supporting sizes
        meta: ['0.875rem', { lineHeight: '1.5', letterSpacing: '-0.006em' }],
        micro: ['0.75rem', { lineHeight: '1.35', letterSpacing: '0.02em' }],
      },
      // Spacing - 8px grid system (extends Tailwind's default scale)
      spacing: {
        18: '4.5rem', // 72px
        22: '5.5rem', // 88px
        26: '6.5rem', // 104px
        30: '7.5rem', // 120px
        34: '8.5rem', // 136px
        38: '9.5rem', // 152px
      },
      // Border radius - consistent scale
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      // Box shadows - layered elevation system
      boxShadow: {
        // Light mode shadows
        xs: '0 1px 2px rgba(2, 6, 23, 0.04)',
        sm: '0 1px 3px rgba(2, 6, 23, 0.06), 0 1px 2px rgba(2, 6, 23, 0.04)',
        md: '0 6px 14px rgba(2, 6, 23, 0.06), 0 2px 6px rgba(2, 6, 23, 0.04)',
        lg: '0 14px 30px rgba(2, 6, 23, 0.08), 0 6px 14px rgba(2, 6, 23, 0.05)',
        xl: '0 22px 50px rgba(2, 6, 23, 0.10), 0 10px 22px rgba(2, 6, 23, 0.06)',
        '2xl': '0 40px 90px rgba(2, 6, 23, 0.14)',
        // Dark mode shadows
        'dark-xs': '0 1px 2px rgba(0, 0, 0, 0.12)',
        'dark-sm': '0 1px 3px rgba(0, 0, 0, 0.16), 0 1px 2px rgba(0, 0, 0, 0.12)',
        'dark-md': '0 6px 14px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(0, 0, 0, 0.14)',
        'dark-lg': '0 14px 30px rgba(0, 0, 0, 0.24), 0 6px 14px rgba(0, 0, 0, 0.18)',
        'dark-xl': '0 22px 50px rgba(0, 0, 0, 0.30), 0 10px 22px rgba(0, 0, 0, 0.22)',
        'dark-2xl': '0 40px 90px rgba(0, 0, 0, 0.40)',
        // Glass effects with inner highlights
        'glass-sm': '0 1px 0 rgba(255, 255, 255, 0.60) inset, 0 10px 24px rgba(2, 6, 23, 0.06)',
        glass: '0 1px 0 rgba(255, 255, 255, 0.65) inset, 0 16px 40px rgba(2, 6, 23, 0.08)',
        'glass-lg': '0 1px 0 rgba(255, 255, 255, 0.70) inset, 0 26px 70px rgba(2, 6, 23, 0.10)',
        // Glow effects
        'glow-blue': '0 0 24px rgba(59, 130, 246, 0.24)',
        'glow-indigo': '0 0 24px rgba(99, 102, 241, 0.24)',
        'glow-violet': '0 0 24px rgba(139, 92, 246, 0.24)',
        'glow-green': '0 0 24px rgba(34, 197, 94, 0.24)',
        'glow-red': '0 0 24px rgba(239, 68, 68, 0.18)',
        // Special effects
        inner: 'inset 0 1px 2px rgba(2, 6, 23, 0.06)',
      },
      // Backdrop blur for glassmorphism
      backdropBlur: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      // Background patterns
      backgroundImage: {
        // Micro-industrialism grid pattern
        cloud:
          'repeating-linear-gradient(to right, hsl(var(--border) / 0.35) 0, hsl(var(--border) / 0.35) 1px, transparent 1px, transparent 16px), repeating-linear-gradient(to bottom, hsl(var(--border) / 0.35) 0, hsl(var(--border) / 0.35) 1px, transparent 1px, transparent 16px), repeating-linear-gradient(to right, hsl(var(--border-strong) / 0.40) 0, hsl(var(--border-strong) / 0.40) 1px, transparent 1px, transparent 64px), repeating-linear-gradient(to bottom, hsl(var(--border-strong) / 0.40) 0, hsl(var(--border-strong) / 0.40) 1px, transparent 1px, transparent 64px)',
      },
      // Animation timing
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        fastest: '150ms',
        fast: '250ms',
        DEFAULT: '300ms',
        slow: '500ms',
      },
      // Animations
      animation: {
        'fade-in': 'fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        shimmer: 'shimmer 1.25s cubic-bezier(0.16, 1, 0.3, 1) infinite',
        'type-shimmer': 'shimmer 5s linear infinite',
        shake: 'shake 0.34s cubic-bezier(0.36, 0.07, 0.19, 0.97) both',
        pop: 'pop 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'type-rise': 'type-rise 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
      keyframes: {
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
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(59,130,246,0.2)' },
          '50%': { boxShadow: '0 0 30px rgba(59,130,246,0.4)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-3px)' },
          '40%': { transform: 'translateX(3px)' },
          '60%': { transform: 'translateX(-2px)' },
          '80%': { transform: 'translateX(2px)' },
        },
        pop: {
          '0%': { transform: 'scale(0.94)' },
          '60%': { transform: 'scale(1.06)' },
          '100%': { transform: 'scale(1)' },
        },
        'type-rise': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
