import containerQueriesPlugin from '@tailwindcss/container-queries';
import tailwindcss from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';
import plugin from 'tailwindcss/plugin';

const tailwindConfig = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      xl: { max: '1280px' },
      lg: { max: '1024px' },
      md: { max: '768px' },
      sm: { max: '640px' },
      xs: { max: '320px' },
      nil: { max: '0px' }
    },
    extend: {
      backgroundImage: {
        'alt-avtr': 'url("/src/assets/icons/account.svg")'
      },
      fontFamily: {
        body: ['Inter', ...defaultTheme.fontFamily.sans]
      },
      textShadow: {
        DEFAULT: '0 1px 2px rgba(0,0,0,0.6), 0 0 2px rgba(0,0,0,0.3)'
      },
      containers: {
        '7xs': '2rem', // 32px
        '6xs': '4rem', // 64px
        '5xs': '8rem', // 128px
        '4xs': '10rem', // 160px
        '3xs': '12rem', // 192px
        '2xs': '16rem' // 256px
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0px)' }
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.99)' },
          to: { opacity: '1', transform: 'scale(1.0)' }
        },
        fillIn: {
          from: { fill: 'transparent' },
          to: { fill: 'currentColor' }
        },
        burns: {
          from: { transform: 'scale(1.0)', 'transform-origin': 'bottom left' },
          to: { transform: 'scale(1.18)' }
        },
        countdown: {
          from: { strokeDashoffset: '0px' },
          to: { strokeDashoffset: 'calc(2 * 3.14 * 10px)' }
        }
      },
      animation: {
        fadeInUp: 'fadeInUp 115ms cubic-bezier(0.4, 0, 0.6, 1)',
        scaleIn: 'scaleIn 115ms cubic-bezier(0.4, 0, 0.6, 1)',
        fillIn: 'fillIn 200ms cubic-bezier(0.4, 0, 0.6, 1)',
        burns: 'burns 25s ease-in-out alternate infinite',
        countdown: 'countdown linear forwards'
      }
    }
  },
  plugins: [
    containerQueriesPlugin,

    // text-shadow
    plugin(({ matchUtilities, theme }) => {
      matchUtilities(
        {
          'text-shadow': (value) => ({ textShadow: value }),
          'text-shadow-none': () => ({ textShadow: 'none' })
        },
        { values: theme('textShadow') }
      );
    }),

    // scrollbar gutter
    plugin(({ addUtilities, addBase }) => {
      addBase({
        '@defaults scrollbar-gutter': { '--tw-scrollbar-gutter-modifier': '' }
      });
      addUtilities([
        {
          '.scrollbar-gutter-auto': { 'scrollbar-gutter': 'auto' },
          '.scrollbar-stable': {
            '@defaults scrollbar-gutter': {},
            'scrollbar-gutter': 'stable var(--tw-scrollbar-gutter-modifier)'
          },
          '.scrollbar-both-edges': {
            '--tw-scrollbar-gutter-modifier': 'both-edges'
          }
        }
      ]);
    }),

    // scrollbar track margin
    plugin(({ matchUtilities, theme }) => {
      matchUtilities(
        {
          'scrollbar-mt': (value) => ({
            '&::-webkit-scrollbar-track': { marginTop: value }
          }),
          'scrollbar-mb': (value) => ({
            '&::-webkit-scrollbar-track': { marginBottom: value }
          })
        },
        { values: theme('margin') }
      );
    })
  ],

  safelist: [
    { pattern: /^(dark:)?(!)?bg-green-800$/ } // cancelled freeSlot notification
  ]
} satisfies tailwindcss.Config;

export default tailwindConfig;
