/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      /* ==========================================================================
         DESIGN TOKENS - Semantic, maintainable, consistent
         ========================================================================== */
      colors: {
        /* Semantic tokens (use these in components) */
        background: 'oklch(var(--color-background))',
        surface: 'oklch(var(--color-surface))',
        'surface-elevated': 'oklch(var(--color-surface-elevated))',
        border: 'oklch(var(--color-border))',
        'border-strong': 'oklch(var(--color-border-strong))',

        /* Text colors - always use semantic tokens */
        'text-primary': 'oklch(var(--color-text-primary))',
        'text-secondary': 'oklch(var(--color-text-secondary))',
        'text-tertiary': 'oklch(var(--color-text-tertiary))',
        'text-inverse': 'oklch(var(--color-text-inverse))',

        /* Accent colors */
        accent: 'oklch(var(--color-accent))',
        'accent-hover': 'oklch(var(--color-accent-hover))',
        success: 'oklch(var(--color-success))',
        warning: 'oklch(var(--color-warning))',
        error: 'oklch(var(--color-error))',

        /* Primary palette - warm terracotta */
        primary: {
          50: 'oklch(var(--color-primary-50))',
          100: 'oklch(var(--color-primary-100))',
          200: 'oklch(var(--color-primary-200))',
          300: 'oklch(var(--color-primary-300))',
          400: 'oklch(var(--color-primary-400))',
          500: 'oklch(var(--color-primary-500))',
          600: 'oklch(var(--color-primary-600))',
          700: 'oklch(var(--color-primary-700))',
          800: 'oklch(var(--color-primary-800))',
          900: 'oklch(var(--color-primary-900))',
        },

        /* Neutral palette - warm slate */
        slate: {
          50: 'oklch(var(--color-slate-50))',
          100: 'oklch(var(--color-slate-100))',
          200: 'oklch(var(--color-slate-200))',
          300: 'oklch(var(--color-slate-300))',
          400: 'oklch(var(--color-slate-400))',
          500: 'oklch(var(--color-slate-500))',
          600: 'oklch(var(--color-slate-600))',
          700: 'oklch(var(--color-slate-700))',
          800: 'oklch(var(--color-slate-800))',
          900: 'oklch(var(--color-slate-900))',
          950: 'oklch(var(--color-slate-950))',
        },
      },

      /* ==========================================================================
         TYPOGRAPHY - Fluid sizing with clamp, distinctive font pairing
         ========================================================================== */
      fontFamily: {
        /* Display font - Space Grotesk for headlines */
        display: ['var(--font-space)', 'system-ui', 'sans-serif'],
        /* Body font - Geist for readability */
        sans: ['var(--font-geist)', 'system-ui', 'sans-serif'],
        /* Mono for code/technical content */
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },

      fontSize: {
        /* Fluid typography scale using clamp() */
        'xs': 'var(--font-size-xs)',
        'sm': 'var(--font-size-sm)',
        'base': 'var(--font-size-base)',
        'lg': 'var(--font-size-lg)',
        'xl': 'var(--font-size-xl)',
        '2xl': 'var(--font-size-2xl)',
        '3xl': 'var(--font-size-3xl)',
        '4xl': 'var(--font-size-4xl)',
        '5xl': 'var(--font-size-5xl)',
      },

      /* ==========================================================================
         SPACING - Consistent spatial rhythm
         ========================================================================== */
      spacing: {
        'xs': 'var(--spacing-xs)',
        'sm': 'var(--spacing-sm)',
        'md': 'var(--spacing-md)',
        'lg': 'var(--spacing-lg)',
        'xl': 'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
        '3xl': 'var(--spacing-3xl)',
        '4xl': 'var(--spacing-4xl)',
      },

      /* ==========================================================================
         BORDER RADIUS - Consistent rounded corners
         ========================================================================== */
      borderRadius: {
        'xs': 'var(--radius-sm)',
        'sm': 'var(--radius-md)',
        'md': 'var(--radius-lg)',
        'lg': 'var(--radius-xl)',
        'full': 'var(--radius-full)',
      },

      /* ==========================================================================
         EFFECTS - Shadows, transitions, animations
         ========================================================================== */
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
      },

      transitionDuration: {
        'fast': 'var(--transition-fast)',
        'base': 'var(--transition-base)',
        'slow': 'var(--transition-slow)',
      },

      transitionTimingFunction: {
        'ease-out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
        'ease-out-quint': 'cubic-bezier(0.2, 1, 0.4, 1)',
        'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },

      /* ==========================================================================
         Z-INDEX SCALE - Layer management
         ========================================================================== */
      zIndex: {
        'dropdown': 'var(--z-dropdown)',
        'sticky': 'var(--z-sticky)',
        'fixed': 'var(--z-fixed)',
        'modal': 'var(--z-modal)',
        'modal-backdrop': 'var(--z-modal-backdrop)',
        'popover': 'var(--z-popover)',
        'tooltip': 'var(--z-tooltip)',
      },

      /* ==========================================================================
         ANIMATIONS - Subtle, purposeful motion
         ========================================================================== */
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },

      animation: {
        'fade-in': 'fade-in 0.2s ease-out-quart',
        'slide-up': 'slide-up 0.3s ease-out-quart',
        'slide-down': 'slide-down 0.3s ease-out-quart',
        'scale-in': 'scale-in 0.2s ease-out-quart',
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
}
