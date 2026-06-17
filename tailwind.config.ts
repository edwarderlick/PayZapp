import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', 'Space Grotesk', 'system-ui', 'sans-serif'],
        ui:      ['Inter', 'Space Grotesk', 'system-ui', 'sans-serif'],
        display: ['Inter', 'Space Grotesk', 'sans-serif'],
        number:  ['JetBrains Mono', 'Fira Code', 'monospace'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        bgBase:       'var(--bg-base)',
        bgSurface:    'var(--bg-surface)',
        bgElevated:   'var(--bg-elevated)',
        bgInput:      'var(--bg-input)',
        bgCard:       'var(--bg-card)',
        borderSubtle: 'var(--border-subtle)',
        borderDefault:'var(--border-default)',
        borderAccent: 'var(--border-accent)',
        primary:      'var(--primary)',
        secondary:    'var(--secondary)',
        success:      'var(--success)',
        danger:       'var(--danger)',
        warning:      'var(--warning)',
        textPrimary:  'var(--text-primary)',
        textSecondary:'var(--text-secondary)',
        textMuted:    'var(--text-muted)',
        // Legacy aliases
        'on-surface':         'var(--on-surface)',
        'on-surface-variant': 'var(--on-surface-variant)',
        outline:              'var(--outline)',
        surface:              'var(--bg-surface)',
        'surface-container':  'var(--bg-card)',
        'primary-container':  'rgba(0,212,170,0.10)',
        arcNeon:              '#00D4AA',
        arcBlue:              '#5B67F3',
        gold:                 '#5B67F3',
        error:                'var(--danger)',
      },
    },
  },
  plugins: [],
} satisfies Config
