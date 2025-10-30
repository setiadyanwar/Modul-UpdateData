/** @type {import('tailwindcss').Config} */

export default {
    content: [
      "./components/**/*.{js,vue,ts}",
      "./layouts/**/*.vue",
      "./pages/**/*.vue",
      "./plugins/**/*.{js,ts}",
      "./app.vue",
      "./error.vue",
    ],
    theme: {
      extend: {
        fontFamily: {
          sans: ['Lato', 'sans-serif'],
        },
        colors: {
          // Warna dasar untuk teks dan latar belakang
          background: 'var(--color-background)',
          'text-main': 'var(--color-text-main)',
          // Dashboard specific colors
          dashboard: "var(--color-dashboard-bg)", // #fafafa
          card: "var(--color-card-bg)", // #ffffff

          // Palet warna yang dinamis
          primary: {
            DEFAULT: 'var(--color-primary-500)',
            50: 'var(--color-primary-50)',
            100: 'var(--color-primary-100)',
            200: 'var(--color-primary-200)',
            300: 'var(--color-primary-300)',
            400: 'var(--color-primary-400)',
            500: 'var(--color-primary-500)',
            600: 'var(--color-primary-600)',
            700: 'var(--color-primary-700)',
            800: 'var(--color-primary-800)',
            900: 'var(--color-primary-900)',
          },
          secondary: {
            DEFAULT: 'var(--color-secondary-500)',
            50: 'var(--color-secondary-50)',
            100: 'var(--color-secondary-100)',
            200: 'var(--color-secondary-200)',
            300: 'var(--color-secondary-300)',
            400: 'var(--color-secondary-400)',
            500: 'var(--color-secondary-500)',
            600: 'var(--color-secondary-600)',
            700: 'var(--color-secondary-700)',
            800: 'var(--color-secondary-800)',
            900: 'var(--color-secondary-900)',
          },
          grey: {
            DEFAULT: 'var(--color-grey-500)',
            50: 'var(--color-grey-50)',
            100: 'var(--color-grey-100)',
            200: 'var(--color-grey-200)',
            300: 'var(--color-grey-300)',
            400: 'var(--color-grey-400)',
            500: 'var(--color-grey-500)',
            600: 'var(--color-grey-600)',
            700: 'var(--color-grey-700)',
            800: 'var(--color-grey-800)',
            900: 'var(--color-grey-900)',
          },
          error: {
            DEFAULT: 'var(--color-error-600)',
            100: 'var(--color-error-100)',
            200: 'var(--color-error-200)',
            300: 'var(--color-error-300)',
            400: 'var(--color-error-400)',
            500: 'var(--color-error-500)',
            600: 'var(--color-error-600)',
            700: 'var(--color-error-700)',
            800: 'var(--color-error-800)',
            900: 'var(--color-error-900)',
          },
          warning: {
            DEFAULT: 'var(--color-warning-600)',
            100: 'var(--color-warning-100)',
            200: 'var(--color-warning-200)',
            300: 'var(--color-warning-300)',
            400: 'var(--color-warning-400)',
            500: 'var(--color-warning-500)',
            600: 'var(--color-warning-600)',
            700: 'var(--color-warning-700)',
            800: 'var(--color-warning-800)',
            900: 'var(--color-warning-900)',
          },
          success: {
            DEFAULT: 'var(--color-success-700)',
            100: 'var(--color-success-100)',
            200: 'var(--color-success-200)',
            300: 'var(--color-success-300)',
            400: 'var(--color-success-400)',
            500: 'var(--color-success-500)',
            600: 'var(--color-success-600)',
            700: 'var(--color-success-700)',
            800: 'var(--color-success-800)',
            900: 'var(--color-success-900)',
          },
          info: {
            DEFAULT: 'var(--color-info-700)',
            100: 'var(--color-info-100)',
            200: 'var(--color-info-200)',
            300: 'var(--color-info-300)',
            400: 'var(--color-info-400)',
            500: 'var(--color-info-500)',
            600: 'var(--color-info-600)',
            700: 'var(--color-info-700)',
            800: 'var(--color-info-800)',
            900: 'var(--color-info-900)',
          },
        },
      },
    },
    plugins: [
    ],
  }
