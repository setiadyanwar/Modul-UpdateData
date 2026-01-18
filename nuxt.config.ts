import { resolve } from 'path';
import Aura from '@primeuix/themes/aura';
import envConfig from './config/environment';

// Build CSP dynamically based on environment
const cspFrameAncestors = envConfig.CORS_ORIGINS.PRODUCTION.join(' ');
const cspConnectSrc = `${envConfig.API_BASE_URL} ${envConfig.CORS_ORIGINS.PRODUCTION.join(' ')}`;

export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: false }, // Disabled for iframe to prevent cross-origin security errors
  ssr: false,
  experimental: {
    payloadExtraction: false,
    renderJsonPayloads: false,
    asyncContext: true,
    componentIslands: false, // Disable component islands to prevent dynamic import issues
    watcher: 'chokidar-granular' // Fix for Windows file watching issues
  },

  // Alias configuration
  alias: {
    '~/config': resolve(__dirname, './config')
  },

  // Development server configuration
  devServer: {
    port: 3001,
    host: '0.0.0.0'
  },

  nitro: {
    preset: 'vercel', // Explicitly use Vercel preset
  },

  css: ["~/assets/css/main.css"],

  modules: [
    "@nuxtjs/tailwindcss",
    "@nuxtjs/google-fonts",
    "@nuxtjs/color-mode",
    "@primevue/nuxt-module",
  ],

  primevue: {
    options: {
      ripple: true,
      inputVariant: 'outlined',
      theme: {
        preset: Aura,
        options: {
          prefix: 'p',
          darkModeSelector: '.dark',
          cssLayer: false
        }
      }
    },
    components: {
      include: [
        "DataTable", "Column", "Paginator", "InputText",
        "Button", "Tag", "Checkbox", "Avatar", "Skeleton", "Steps",
        "DatePicker", "Editor",
      ],
    },
    composables: {
      include: ["FilterMatchMode"],
    },
    directives: {
      include: ["Ripple", "Tooltip"],
    },
  },

  colorMode: {
    preference: "light",
    fallback: "light",
    classSuffix: "",
  },

  googleFonts: {
    families: {
      Lato: {
        wght: [100, 300, 400, 500, 600, 700, 900],
      },
    },
    display: "swap",
  },

  app: {
    head: {
      htmlAttrs: {
        lang: 'id',
      },
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "format-detection", content: "telephone=no" },
        { "http-equiv": "X-UA-Compatible", content: "IE=edge" },
        { name: "robots", content: "noindex, nofollow" },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      ],
    },
    keepalive: true,
  },

  build: {
    transpile: ["primevue"],
  },

  // Plugins configuration
  plugins: [
    // Ticket handler - MUST run FIRST to handle SSO ticket exchange before any other auth logic
    { src: '~/plugins/ticket-handler.client.js', mode: 'client' },
    { src: '~/plugins/iframe-token-handler.client.js', mode: 'client' },
    { src: '~/plugins/accessibility-sync.client.js', mode: 'client' },
    { src: '~/plugins/update-data-navigation.client.js', mode: 'client' }
  ],

  vite: {
    resolve: {
      alias: {
        '~/config': resolve(__dirname, './config')
      }
    },
    // Fix for dynamic import issues in iframe & explicit env definition like reference
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.API_BASE_URL': JSON.stringify(process.env.API_BASE_URL),
      'process.env.REMOTE_APP_HOST_ORIGIN': JSON.stringify(process.env.REMOTE_APP_HOST_ORIGIN),
      'process.env.ALLOWED_ORIGINS': JSON.stringify(process.env.ALLOWED_ORIGINS)
    }
  },

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
});
