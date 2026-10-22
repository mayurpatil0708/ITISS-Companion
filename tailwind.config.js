/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nexus: {
          bg: 'var(--color-bg)',
          'bg-secondary': 'var(--color-bg-secondary)',
          sidebar: 'var(--color-sidebar)',
          surface: 'var(--color-surface)',
          elevated: 'var(--color-elevated)',
          'elevated-high': 'var(--color-elevated-high)',
          border: 'var(--color-border)',
          'border-subtle': 'var(--color-border-subtle)',
          'border-strong': 'var(--color-border-strong)',
          text: 'var(--color-text)',
          'text-secondary': 'var(--color-text-secondary)',
          'text-muted': 'var(--color-text-muted)',
          accent: 'var(--color-accent)',
          'accent-hover': 'var(--color-accent-hover)',
          'accent-secondary': 'var(--color-accent-secondary)',
          'accent-secondary-hover': 'var(--color-accent-secondary-hover)',
          cyan: 'var(--color-cyan)',
          'cyan-hover': 'var(--color-cyan-hover)',
          teal: 'var(--color-cyan)',
          'teal-hover': 'var(--color-cyan-hover)',
          terracotta: 'var(--color-terracotta)',
          'terracotta-hover': 'var(--color-terracotta-hover)',
          glass: 'var(--color-glass)',
          success: 'var(--color-success)',
          warning: 'var(--color-warning)',
          error: 'var(--color-error)',
          'brand-primary': 'var(--color-brand-primary)',
          'brand-highlight': 'var(--color-brand-highlight)',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        card: '0 2px 8px -2px var(--shadow-glass), 0 1px 3px 0 var(--color-border-subtle)',
        elevated: '0 8px 24px -4px var(--shadow-glass), 0 2px 6px -2px var(--color-border-subtle)',
        glass: '0 12px 36px 0 var(--shadow-glass), inset 0 1px 0 0 var(--sheen-color)',
        modal: '0 24px 64px -12px var(--shadow-glass), inset 0 1px 0 0 var(--sheen-color)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }
    },
  },
  plugins: [],
}
