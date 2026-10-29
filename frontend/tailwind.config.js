const token = (name) => `rgb(var(--cv-${name}) / <alpha-value>)`;

export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: token('canvas'),
        sunken: token('sunken'),
        surface: token('surface'),
        raised: token('raised'),
        line: token('line'),
        'line-strong': token('line-strong'),
        fg: token('fg'),
        muted: token('muted'),
        subtle: token('subtle'),
        primary: token('primary'),
        'primary-strong': token('primary-strong'),
        'on-primary': token('on-primary'),
        teal: token('teal'),
        amber: token('amber'),
        orange: token('orange'),
        danger: token('danger'),
        emerald: token('emerald'),
        rail: token('rail'),
        'rail-line': token('rail-line'),
        'rail-fg': token('rail-fg'),
        'rail-muted': token('rail-muted'),
        'rail-hover': token('rail-hover'),
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        panel: '0 1px 0 0 rgb(var(--cv-shadow) / 0.04), 0 1px 2px 0 rgb(var(--cv-shadow) / 0.06)',
        lift: '0 8px 24px -8px rgb(var(--cv-shadow) / 0.28), 0 2px 6px -2px rgb(var(--cv-shadow) / 0.16)',
        pop: '0 24px 48px -12px rgb(var(--cv-shadow) / 0.45), 0 4px 12px -4px rgb(var(--cv-shadow) / 0.2)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
    },
  },
  plugins: [],
};
