/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          base: 'rgb(var(--color-surface-base) / <alpha-value>)',
          elevated: 'rgb(var(--color-surface-elevated) / <alpha-value>)',
          secondary: 'rgb(var(--color-surface-secondary) / <alpha-value>)',
          muted: 'rgb(var(--color-surface-muted) / <alpha-value>)',
          raised: 'rgb(var(--color-surface-raised) / <alpha-value>)',
        },
        text: {
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--color-text-tertiary) / <alpha-value>)',
          quaternary: 'rgb(var(--color-text-quaternary) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-surface-secondary) / <alpha-value>)',
          foreground: 'rgb(var(--color-text-primary) / <alpha-value>)',
          primary: 'rgb(var(--color-accent-primary) / <alpha-value>)',
          'primary-foreground': 'rgb(var(--color-accent-primary-foreground) / <alpha-value>)',
        },
        borderSemantic: {
          DEFAULT: 'rgb(var(--color-border) / <alpha-value>)',
          strong: 'rgb(var(--color-border-strong) / <alpha-value>)',
          subtle: 'rgb(var(--color-border-subtle) / <alpha-value>)',
        },
        border: 'rgb(var(--color-border) / <alpha-value>)',

        background: 'rgb(var(--color-surface-base) / <alpha-value>)',
        foreground: 'rgb(var(--color-text-primary) / <alpha-value>)',

        card: {
          DEFAULT: 'rgb(var(--color-surface-elevated) / <alpha-value>)',
          foreground: 'rgb(var(--color-text-primary) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'rgb(var(--color-surface-elevated) / <alpha-value>)',
          foreground: 'rgb(var(--color-text-primary) / <alpha-value>)',
        },

        primary: {
          DEFAULT: 'rgb(var(--color-accent-primary) / <alpha-value>)',
          foreground: 'rgb(var(--color-accent-primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--color-surface-secondary) / <alpha-value>)',
          foreground: 'rgb(var(--color-text-primary) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--color-surface-muted) / <alpha-value>)',
          foreground: 'rgb(var(--color-text-secondary) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'rgb(var(--error) / <alpha-value>)',
          foreground: 'rgb(var(--destructive-foreground) / <alpha-value>)',
        },

        input: 'rgb(var(--color-border) / <alpha-value>)',
        ring: 'rgb(var(--color-accent-primary) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        serif: ['var(--font-newsreader)', 'ui-serif', 'Georgia', 'serif'],
        display: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass-sm': 'var(--shadow-glass-sm)',
      },
    },
  },
  plugins: [],
}
