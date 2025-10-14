// tailwind.config.ts
export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)'],
      },
      colors: {
        'brand-blue': {
          light: 'var(--color-brand-blue-light)',
          medium: 'var(--color-brand-blue-medium)',
          DEFAULT: 'var(--color-brand-blue-primary)',
          hover: 'var(--color-brand-blue-hover)',
          dark: 'var(--color-brand-blue-dark)',
        },
        'text-on-blue': 'var(--color-text-on-blue)',
        'interactive-primary': 'var(--color-interactive-primary)',
        'interactive-primary-hover': 'var(--color-interactive-primary-hover)',
        'interactive-secondary': 'var(--color-interactive-secondary)',
        'interactive-secondary-hover': 'var(--color-interactive-secondary-hover)',
      },
    },
  },
};