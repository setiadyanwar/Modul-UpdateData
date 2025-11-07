import { resolve } from 'path';
import Aura from '@primeuix/themes/aura';

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
    preset: 'node-server',
    compressPublicAssets: false,
    minify: false,
    devProxy: {
      '/_nuxt/': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    },
    // Security headers for iframe embedding
    routeRules: {
      '/**': {
        headers: {
          // Modern CSP with frame-ancestors (replaces deprecated X-Frame-Options ALLOW-FROM)
          'Content-Security-Policy': [
            'frame-ancestors https://people-dev.telkomsigma.co.id http://localhost:3000 http://localhost:8001',
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net",
            "style-src 'self' 'unsafe-inline' https://unpkg.com",
            "img-src 'self' data: https:",
            "font-src 'self' data: https://fonts.gstatic.com",
            "connect-src 'self' https://apigwsand.telkomsigma.co.id https://people-dev.telkomsigma.co.id"
          ].join('; '),
          // X-Frame-Options for older browsers (CSP takes precedence in modern browsers)
          'X-Frame-Options': 'SAMEORIGIN',
          // Other security headers
          'X-Content-Type-Options': 'nosniff',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
      }
    }
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
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["vue", "vue-router"],
            primevue: ["primevue"],
          },
        },
      },
    },
    optimizeDeps: {
      include: ["primevue"],
    },
    ssr: {
      noExternal: ["primevue"],
    },
    // Fix for dynamic import issues in iframe
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    },
    // Fix for development server issues
    server: {
      hmr: {
        port: 3001
      }
    }
  },

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
});
