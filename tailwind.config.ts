import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const { fontFamily } = defaultTheme;

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ── Brand Colors ──────────────────────────────────────────────
      colors: {
        brand: {
          primary: {
            DEFAULT: '#0F766E',
            50: '#F0FDFA',
            100: '#CCFBF1',
            200: '#99F6E4',
            300: '#5EEAD4',
            400: '#2DD4BF',
            500: '#14B8A6',
            600: '#0D9488',
            700: '#0F766E',   // ← Brand primary
            800: '#115E59',
            900: '#134E4A',
            950: '#042F2E',
          },
          secondary: {
            DEFAULT: '#D4AF37',
            50: '#FEFDF0',
            100: '#FDF9C4',
            200: '#FBF18B',
            300: '#F9E549',
            400: '#F5D315',
            500: '#E4BE0B',
            600: '#D4AF37',   // ← Brand gold
            700: '#A88420',
            800: '#8A6A1B',
            900: '#75581A',
            950: '#44310A',
          },
        },
        // Semantic aliases
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },

      // ── Typography ─────────────────────────────────────────────────
      fontFamily: {
        arabic: ['"IBM Plex Sans Arabic"', 'Tahoma', 'Arial', ...fontFamily.sans],
        sans: ['"IBM Plex Sans Arabic"', ...fontFamily.sans],
        quran: ['"KFGQPC Uthmanic Script HAFS"', '"Scheherazade New"', 'serif'],
        mono: [...fontFamily.mono],
      },

      // ── Spacing & Sizing ───────────────────────────────────────────
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      // ── Border Radius (matches Shadcn) ─────────────────────────────
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
        '3xl': 'calc(var(--radius) + 16px)',
      },

      // ── Animations ─────────────────────────────────────────────────
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-right': {
          from: { opacity: '0', transform: 'translateX(-16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-bottom': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'fade-in-right': 'fade-in-right 0.4s ease-out',
        'slide-in-bottom': 'slide-in-bottom 0.5s ease-out',
        shimmer: 'shimmer 2s infinite',
      },

      // ── Box Shadows ────────────────────────────────────────────────
      boxShadow: {
        'brand-sm': '0 1px 3px 0 rgba(15, 118, 110, 0.12)',
        brand: '0 4px 14px 0 rgba(15, 118, 110, 0.20)',
        'brand-lg': '0 10px 40px 0 rgba(15, 118, 110, 0.25)',
        gold: '0 4px 14px 0 rgba(212, 175, 55, 0.25)',
        'inner-brand': 'inset 0 2px 4px 0 rgba(15, 118, 110, 0.08)',
      },

      // ── Background Gradients ───────────────────────────────────────
      backgroundImage: {
        'gradient-brand':
          'linear-gradient(135deg, #0F766E 0%, #115E59 100%)',
        'gradient-gold':
          'linear-gradient(135deg, #D4AF37 0%, #A88420 100%)',
        'gradient-brand-gold':
          'linear-gradient(135deg, #0F766E 0%, #D4AF37 100%)',
        'gradient-hero':
          'radial-gradient(ellipse at top, rgba(15,118,110,0.15) 0%, transparent 60%)',
        'gradient-card':
          'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(250,250,249,0.8) 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
