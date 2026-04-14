import envConfig from '~/config/environment.js';

export const AUTH_CONFIG = {
  // Token lifetimes (in milliseconds)
  ACCESS_TOKEN_LIFETIME: envConfig.SECURITY?.JWT_EXPIRY || 1200000, // 20 minutes
  REFRESH_TOKEN_LIFETIME: envConfig.SECURITY?.REFRESH_TOKEN_EXPIRY || 604800000, // 7 days

  // Session management
  SESSION_WARNING_TIME: envConfig.SECURITY?.WARNING_TIMEOUT || 900000, // 15 minutes
  COUNTDOWN_DURATION: envConfig.SECURITY?.COUNTDOWN_DURATION || 300000, // 5 minutes 
  LAST_CHANCE_PERIOD: 300000, // 5 minutes window (idle 10-15 min)
  ACTIVITY_THROTTLE: envConfig.SECURITY?.ACTIVITY_THROTTLE || 100, // 100ms throttle

  // Security settings
  MAX_LOGIN_ATTEMPTS: envConfig.SECURITY?.MAX_LOGIN_ATTEMPTS || 5,
  LOCKOUT_DURATION: envConfig.SECURITY?.LOCKOUT_DURATION || 900000, // 15 minutes

  // API endpoints
  ENDPOINTS: {
    LOGIN: '/api/auth/login',
    REFRESH: '/api/auth/refresh'
  }
};

export const ACTIVITY_EVENTS = [
  'click', 'keydown', 'scroll', 'touchstart'
];

export const LAST_CHANCE_EVENTS = [
  'mousemove', 'keydown', 'keypress'
];
