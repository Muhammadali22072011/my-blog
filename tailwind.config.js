/** @type {import('tailwindcss').Config} */

/*
 * ─────────────────────────────────────────────────────────────
 *  REGISTAN — дизайн-система блога
 * ─────────────────────────────────────────────────────────────
 *  Палитра построена на керамике самаркандских медресе:
 *  тёплая штукатурка (paper), чернила орешника (ink),
 *  бирюза изразца (tile), шафран (saffron), терракота (terra).
 *
 *  Шкалы `gray` и `blue` намеренно ПЕРЕОПРЕДЕЛЕНЫ: весь старый
 *  код продолжает писать `bg-gray-50` / `text-blue-600`, но
 *  получает новую палитру без единой правки в компонентах.
 */

const ink = {
  50:  '#F7F2E8',
  100: '#EFE7D8',
  200: '#DFD3BF',
  300: '#C4B49A',
  400: '#9A8A72',
  500: '#6F6252',
  600: '#4E453A',
  700: '#332D26',
  800: '#211D18',
  900: '#14110E',
  950: '#0B0907',
}

const tile = {
  50:  '#EAF6F6',
  100: '#CDEAEB',
  200: '#9DD6D9',
  300: '#63BCC1',
  400: '#329CA3',
  500: '#137F87',
  600: '#0F6E76',
  700: '#0E585F',
  800: '#10464B',
  900: '#0F3A3E',
  950: '#062326',
}

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        xs: '475px',
      },

      /*
       * Все три гарнитуры содержат кириллицу — для русскоязычного
       * журнала это не пожелание, а условие: иначе браузер молча
       * подставит системный шрифт и набор развалится.
       */
      fontFamily: {
        // Заголовки: вариативная антиква с осью оптического размера
        display: ['Literata', 'Georgia', 'serif'],
        // Длинные тексты: гротеск, рисованный от кириллицы
        sans: ['"Golos Text"', 'system-ui', 'sans-serif'],
        // ВНИМАНИЕ: Literata подключена ОДНИМ начертанием 600 и только
        // для заголовков. Для текста весом 400 её использовать нельзя —
        // браузер подставит 600 и набор станет слишком жирным.
        serif: ['Literata', 'Georgia', 'serif'],
        // Метаданные, цифры, код
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        // Совместимость со старым кодом
        geist: ['Literata', 'Georgia', 'serif'],
      },

      colors: {
        /*
         * Семантические цвета берутся из CSS-переменных и потому
         * автоматически переключаются между дневной и ночной темой.
         * Числовые шкалы — статические: они нужны легаси-классам,
         * у которых уже есть свои dark:-варианты.
         */
        ink: {
          ...ink,
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          soft: 'rgb(var(--ink-soft) / <alpha-value>)',
          faint: 'rgb(var(--ink-faint) / <alpha-value>)',
        },
        tile: {
          ...tile,
          DEFAULT: 'rgb(var(--tile) / <alpha-value>)',
        },
        paper: {
          DEFAULT: 'rgb(var(--paper) / <alpha-value>)',
          deep: 'rgb(var(--paper-deep) / <alpha-value>)',
        },
        saffron: {
          DEFAULT: 'rgb(var(--saffron) / <alpha-value>)',
        },
        terra: {
          DEFAULT: 'rgb(var(--terra) / <alpha-value>)',
        },

        gray: ink,   // ← весь легаси-код перекрашивается автоматически
        blue: tile,  // ←
        'custom-gray': ink,
      },

      // Прощай, «пузырьковый» rounded-2xl по всему сайту.
      borderRadius: {
        none: '0px',
        sm: '1px',
        DEFAULT: '2px',
        md: '2px',
        lg: '3px',
        xl: '4px',
        '2xl': '5px',
        '3xl': '6px',
        full: '9999px',
      },

      letterSpacing: {
        tightest: '-0.045em',
        title: '-0.03em',
        label: '0.14em',
      },

      maxWidth: {
        measure: '66ch',
      },

      boxShadow: {
        // Никаких размытых «карточных» теней — только чёткий офсет.
        edge: '3px 3px 0 0 rgb(20 17 14 / 0.9)',
        'edge-tile': '3px 3px 0 0 #0F6E76',
        lifted: '6px 6px 0 0 rgb(20 17 14 / 0.9)',
      },

      backgroundImage: {
        /*
         * Зерно бумаги. Прозрачность задана прямо в SVG (0.09), потому что
         * картинка кладётся фоном body — без mix-blend-mode, который раньше
         * заставлял браузер композитить всю страницу на каждый кадр.
         */
        grain:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.09'/%3E%3C/svg%3E\")",
      },

      keyframes: {
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'wipe-in': {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
      },
      animation: {
        'rise-in': 'rise-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'wipe-in': 'wipe-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
}
