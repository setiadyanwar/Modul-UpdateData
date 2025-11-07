export default {
  // Environment Detection
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',

  // API Configuration
  // Dev/Staging: https://apigwsand.telkomsigma.co.id/essbe
  // Production: https://apigw.telkomsigma.co.id/essbe (update when deploying to prod)
  API_BASE_URL: 'https://apigwsand.telkomsigma.co.id/essbe',

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
    // CRITICAL: Must match parent portal domain for postMessage to work!
    // Dev/Staging: https://people-dev.telkomsigma.co.id
    // Production: https://people.telkomsigma.co.id (update when deploying to prod)
    HOST_ORIGIN: 'https://people-dev.telkomsigma.co.id',
    ALLOWED_ORIGINS: [
      'https://people-dev.telkomsigma.co.id',
      'http://localhost:3000',
      'http://localhost:8001',
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
    JWT_EXPIRY: 1800000,             // 30 minutes
    REFRESH_TOKEN_EXPIRY: 604800000, // 7 days
    TOKEN_REFRESH_BUFFER: 300000     // 5 minutes buffer
  },

  // App Configuration
  APP: {
    NAME: 'Update Data - ESS Sigma',
    VERSION: '1.0.0'
  }
};
