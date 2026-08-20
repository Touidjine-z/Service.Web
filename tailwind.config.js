/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Platform chrome tokens (the builder UI itself, not the client's site).
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        subtle: 'rgb(var(--subtle) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        brand: 'rgb(var(--brand) / <alpha-value>)',
        'brand-ink': 'rgb(var(--brand-ink) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: { xl: '0.875rem', '2xl': '1.25rem' },
      boxShadow: {
        card: '0 1px 2px rgb(16 24 40 / 0.04), 0 8px 24px -12px rgb(16 24 40 / 0.12)',
        lift: '0 2px 4px rgb(16 24 40 / 0.04), 0 24px 48px -24px rgb(16 24 40 / 0.22)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'none' } },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'pop-in': { '0%': { opacity: '0', transform: 'scale(.92)' }, '60%': { transform: 'scale(1.02)' }, '100%': { opacity: '1', transform: 'none' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        'float-slow': { '0%,100%': { transform: 'translate3d(0,0,0)' }, '50%': { transform: 'translate3d(14px,-18px,0)' } },
        marquee: { '0%': { transform: 'translate3d(0,0,0)' }, '100%': { transform: 'translate3d(-50%,0,0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        'gradient-pan': { '0%,100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
        'pulse-ring': { '0%': { transform: 'scale(.9)', opacity: '.7' }, '70%': { transform: 'scale(1.6)', opacity: '0' }, '100%': { opacity: '0' } },
        'caret': { '0%,45%': { opacity: '1' }, '50%,95%': { opacity: '0' }, '100%': { opacity: '1' } },
        'slide-up-in': { '0%': { opacity: '0', transform: 'translateY(14px)' }, '100%': { opacity: '1', transform: 'none' } },
      },
      animation: {
        'fade-up': 'fade-up .4s cubic-bezier(.2,.7,.3,1) both',
        'fade-in': 'fade-in .5s ease both',
        'pop-in': 'pop-in .45s cubic-bezier(.2,.8,.3,1) both',
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 14s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        'gradient-pan': 'gradient-pan 9s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2.2s cubic-bezier(.2,.7,.3,1) infinite',
        caret: 'caret 1.1s steps(1) infinite',
        'slide-up-in': 'slide-up-in .35s cubic-bezier(.2,.7,.3,1) both',
      },
    },
  },
  plugins: [],
}
