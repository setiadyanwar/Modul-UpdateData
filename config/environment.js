export default {
  // Environment Detection
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',

  // API Configuration - Inherited from Host
  API_BASE_URL: process.env.API_BASE_URL || 'https://apigwsand.telkomsigma.co.id/essbe',

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
    PORT: parseInt(process.env.REMOTE_PORT) || 3001,
    HOST_ORIGIN: process.env.HOST_ORIGIN || 'http://localhost:3000',
    ALLOWED_ORIGINS: [
      process.env.HOST_ORIGIN || 'http://localhost:3000',
      process.env.HOST_ORIGIN_PROD || 'https://people-dev.telkomsigma.co.id',
      'http://127.0.0.1:3000'
    ]
  },

  // Request Timeout Configuration
  TIMEOUT: {
    DEFAULT: parseInt(process.env.TIMEOUT_DEFAULT) || 45000,
    UPLOAD: parseInt(process.env.TIMEOUT_UPLOAD) || 120000,
    DOWNLOAD: parseInt(process.env.TIMEOUT_DOWNLOAD) || 60000,
    HEALTH_CHECK: parseInt(process.env.TIMEOUT_HEALTH_CHECK) || 15000,
    LOGIN: parseInt(process.env.TIMEOUT_LOGIN) || 15000
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
    FAILURE_THRESHOLD: parseInt(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD) || 5,
    RECOVERY_TIMEOUT: parseInt(process.env.CIRCUIT_BREAKER_RECOVERY_TIMEOUT) || 60000, // 1 minute
    MONITORING_WINDOW: parseInt(process.env.CIRCUIT_BREAKER_MONITORING_WINDOW) || 300000 // 5 minutes
  },

  // Rate Limiting Configuration
  RATE_LIMIT: {
    MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Max requests per window
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000 // 1 minute window
  },

  // Security Configuration
  SECURITY: {
    JWT_EXPIRY: parseInt(process.env.JWT_EXPIRY) || 1800000, // 30 minutes
    REFRESH_TOKEN_EXPIRY: parseInt(process.env.REFRESH_TOKEN_EXPIRY) || 604800000, // 7 days
    TOKEN_REFRESH_BUFFER: parseInt(process.env.TOKEN_REFRESH_BUFFER) || 300000 // 5 minutes buffer
  },

  // App Configuration
  APP: {
    NAME: process.env.NUXT_PUBLIC_APP_NAME || 'Update Data - ESS Sigma',
    VERSION: process.env.NUXT_PUBLIC_APP_VERSION || '1.0.0'
  }
};
