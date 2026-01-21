export default {
  // Environment Detection
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',

  // API Configuration
  // Dev/Staging: https://apigwsand.telkomsigma.co.id/essbe
  // Production: https://apigw.telkomsigma.co.id/essbe (update when deploying to prod)
  // API_BASE_URL: 'https://apigwsand.telkomsigma.co.id/essbe',
  API_BASE_URL: process.env.API_BASE_URL || 'https://essbe.domcloud.dev/api',

  // API Endpoints
  API_ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REFRESH: '/auth/refresh',
      LOGOUT: '/auth/logout'
    },
    EMPLOYEE: {
      BASIC_INFORMATION: '/employee/basic-information',
      ADDRESS: '/employee/address',
      PROFILE: '/employees/profile',
      DETAILS_BASIC_INFO: '/employee/basic-information',
      ATTACHMENTS: {
        INFO: '/employee/attachments/{id}/information',
        PREVIEW: '/employee/attachments/{id}/preview',
        DOWNLOAD: '/employee/attachments/{id}/download',
        DELETE: '/employee/attachments/{id}/delete',
        PREVIEW_PARENT_ITEM: '/employee/attachments/parent/{parent_id}/item/{item_id}/preview',
        DOWNLOAD_PARENT_ITEM: '/employee/attachments/parent/{parent_id}/item/{item_id}/download'
      }
    },
    CHANGE_REQUEST: {
      CREATE: '/employee/change-request',
      GET_BY_ID: '/employee/change-request/{id}',
      UPDATE: '/employee/change-request/{id}',
      ATTACHMENTS: '/employee/change-requests/{id}/attachments',
      DELETE_ATTACHMENT: '/employee/attachments/{item_id}/delete'
    }
  },

  // Remote App Configuration
  REMOTE_APP: {
    PORT: 3001,
    // Dev/Staging: https://ess-telkomsigma.vercel.app/
    // Production: https://ess-telkomsigma.vercel.app (update when deploying to prod)
    HOST_ORIGIN: process.env.REMOTE_APP_HOST_ORIGIN || 'https://ess-telkomsigma.vercel.app',
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : [
        'https://ess-telkomsigma.vercel.app',
        'http://localhost:3000',
        'http://localhost:8001',
        'http://127.0.0.1:3000'
      ]
  },

  // Frontend host URLs (for parent/iframe communication)
  FRONTEND_URLS: {
    PRODUCTION: {
      ESS_HOST: 'https://ess-telkomsigma.vercel.app'
    },
    DEVELOPMENT: {
      ESS_HOST: 'https://ess-telkomsigma.vercel.app'
    }
  },

  // CORS / Allowed Origins
  CORS_ORIGINS: {
    PRODUCTION: [
      'https://ess-telkomsigma.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000'
    ],
    DEVELOPMENT: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000'
    ]
  },

  // Request Timeout Configuration (milliseconds)
  TIMEOUT: {
    DEFAULT: 45000,      // 45 seconds
    UPLOAD: 120000,      // 2 minutes
    DOWNLOAD: 60000,     // 1 minute
    HEALTH_CHECK: 15000, // 15 seconds
    LOGIN: 15000         // 15 seconds
  },

  // Cache Configuration
  CACHE: {
    MASTER_DATA_TTL: 3600000, // 1 hour
    USER_DATA_TTL: 1800000,   // 30 minutes
    STATIC_ASSETS_TTL: 86400000, // 24 hours
    FONT_TTL: 86400000 // 24 hours
  },

  // Circuit Breaker Configuration
  CIRCUIT_BREAKER: {
    FAILURE_THRESHOLD: 5,        // Max failures before circuit opens
    RECOVERY_TIMEOUT: 60000,     // 1 minute
    MONITORING_WINDOW: 300000    // 5 minutes
  },

  // Rate Limiting Configuration
  RATE_LIMIT: {
    MAX_REQUESTS: 100, // Max requests per window
    WINDOW_MS: 60000   // 1 minute window
  },

  // Security Configuration
  SECURITY: {
    JWT_EXPIRY: 1200000,             // 20 minutes (MUST match backend JWT_TTL)
    REFRESH_TOKEN_EXPIRY: 604800000, // 7 days
    TOKEN_REFRESH_BUFFER: 300000,    // 5 minutes buffer
    WARNING_TIMEOUT: 900000,         // 15 minutes - show modal after 15 min idle
    COUNTDOWN_DURATION: 300000,      // 5 minutes - countdown in modal
    ACTIVITY_THROTTLE: 100           // 100ms throttle for activity detection
  },

  // App Configuration
  APP: {
    NAME: process.env.NUXT_APP_NAME || 'Update Data - ESS Sigma',
    VERSION: process.env.NUXT_APP_VERSION || '1.0.0'
  }
};
