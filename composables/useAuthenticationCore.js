/**
 * Authentication Core System
 * Production-ready authentication with token rotation and session management
 * 
 * Features:
 * - JWT token management with automatic refresh
 * - Activity-based session timeout (20 minutes)
 * - 15-minute warning with 5-minute countdown modal
 * - Comprehensive activity monitoring
 * - Enterprise-grade security practices
 * 
 * @version 2.0.0
 * @author ESS Sigma Team
 */

import { ref, computed, watch } from 'vue';
import { $fetch } from 'ofetch';
import { navigateTo } from '#app';
import { useToast } from '~/composables/useToast';
import envConfig from '~/config/environment.js';
import { logger } from '~/utils/logger';
import { ROLE_PERMISSIONS } from './useRBAC';
import UserStorage from '~/utils/userStorage';


// Global authentication state
let authInstance = null;

  // Configuration constants
  const CONFIG = {
    // Token lifetimes (in milliseconds)
    ACCESS_TOKEN_LIFETIME: envConfig.SECURITY.JWT_EXPIRY || 1200000, // 20 minutes (CORRECTED!)
    REFRESH_TOKEN_LIFETIME: envConfig.SECURITY.REFRESH_TOKEN_EXPIRY || 604800000, // 7 days

    // Session management - CORRECTED TIMING
    SESSION_WARNING_TIME: envConfig.SECURITY.WARNING_TIMEOUT || 900000, // 15 minutes of inactivity before showing modal
    COUNTDOWN_DURATION: envConfig.SECURITY.COUNTDOWN_DURATION || 300000, // 5 minutes countdown in modal
    LAST_CHANCE_PERIOD: 300000, // 5 minutes before modal (10-15 min idle) untuk detect aktivitas
    ACTIVITY_THROTTLE: envConfig.SECURITY.ACTIVITY_THROTTLE || 100, // 100ms throttle
  
  // Security settings
  MAX_LOGIN_ATTEMPTS: envConfig.SECURITY.MAX_LOGIN_ATTEMPTS || 5,
  LOCKOUT_DURATION: envConfig.SECURITY.LOCKOUT_DURATION || 900000, // 15 minutes
  
  // API endpoints
  ENDPOINTS: {
    LOGIN: '/api/auth/login',
    REFRESH: '/api/auth/refresh'
    // Note: Logout tidak perlu API endpoint
    // Cukup clear localStorage + postMessage ke parent (ESS Host)
  }
};

// Activity events to monitor - REDUCED for performance
// Only track essential user activity for session timeout
const ACTIVITY_EVENTS = [
  'click', 'keydown', 'scroll', 'touchstart'
];

// Critical activity events for last-chance monitoring (≤5 min before modal)
// Only mouse movement and keyboard for detecting real user presence
const LAST_CHANCE_EVENTS = [
  'mousemove', 'keydown', 'keypress'
];

export const useAuthenticationCore = () => {
  // Return existing instance if available (singleton pattern)
  if (authInstance) {
    return authInstance;
  }

  // Core reactive state
  const user = ref(null);
  const isAuthenticated = ref(false);
  const isLoading = ref(false);
  
  // Session management state
  const isSessionWarningVisible = ref(false);
  const sessionCountdownTime = ref(0);
  const lastActivityTime = ref(Date.now());
  const sessionMonitorStartTime = ref(Date.now());
  const sessionMonitorTargetTime = ref(Date.now() + CONFIG.SESSION_WARNING_TIME);
  const isTabVisible = ref(true);
  
  // Last chance monitoring state (≤5 min before modal)
  const isLastChanceMonitoringActive = ref(false);
  const lastChanceActivityDetected = ref(false);
  
  // Account lockout state
  const failedLoginAttempts = ref(0);
  const lockoutEndTime = ref(null);
  const lockedEmail = ref('');
  
  // Internal timers
  let sessionWarningTimer = null;
  let sessionCountdownTimer = null;
  let tokenRefreshTimer = null;
  let activityThrottleTimer = null;
  let visibilityTimer = null;
  let lastChanceScheduleTimer = null;
  let debugStatusTimer = null;
  let lastChanceTimer = null;
  let lastChanceCheckTimer = null;

  // Computed properties
  const isAccountLocked = computed(() => {
    if (!lockoutEndTime.value) return false;
    return Date.now() < lockoutEndTime.value;
  });

  const formattedRemainingTime = computed(() => {
    if (!lockoutEndTime.value) return '';
    const remaining = Math.max(0, lockoutEndTime.value - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });

  const timeSinceLastActivity = computed(() => {
    return Date.now() - lastActivityTime.value;
  });

  // Debug status logging function
  const startDebugStatusLogging = () => {
    // Enable debug in development or when debug flag is set
    if (!process.dev && !localStorage.getItem('debug_auth')) return;

    // Clear existing debug timer
    if (debugStatusTimer) {
      clearInterval(debugStatusTimer);
    }

    // Log status every 10 seconds for better debugging
    debugStatusTimer = setInterval(() => {
      if (!isAuthenticated.value) return;

      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) return;

      try {
        // Token info
        const payload = parseJWTPayload(accessToken);
        const expirationTime = payload.exp * 1000;
        const currentTime = Date.now();
        const timeUntilTokenExpiry = expirationTime - currentTime;
        const tokenMinutes = Math.floor(timeUntilTokenExpiry / 60000);
        const tokenSeconds = Math.floor((timeUntilTokenExpiry % 60000) / 1000);

        // Session info
        const timeSinceActivity = Date.now() - lastActivityTime.value;
        const sessionTimeRemaining = Math.max(0, CONFIG.SESSION_WARNING_TIME - timeSinceActivity);
        const sessionMinutes = Math.floor(sessionTimeRemaining / 60000);
        const sessionSecondsLeft = Math.floor((sessionTimeRemaining % 60000) / 1000);

        // Status indicator
        let sessionStatus = '🟢 ACTIVE';
        if (sessionTimeRemaining <= 300000) { // 5 minutes
          sessionStatus = '🟡 WARNING SOON';
        }
        if (sessionTimeRemaining <= 0) {
          sessionStatus = '🔴 SHOULD WARN';
        }
        if (isSessionWarningVisible.value) {
          sessionStatus = '🚨 WARNING MODAL';
        }


      } catch (error) {
        // console.error('[AUTH DEBUG] Error:', error);
      }
    }, 10000); // Every 10 seconds for better monitoring
  };

  const stopDebugStatusLogging = () => {
    if (debugStatusTimer) {
      clearInterval(debugStatusTimer);
      debugStatusTimer = null;
    }
  };

  // Toast notifications
  const { success, error: showError, sessionExpired } = useToast();

  /**
   * Token Management Functions
   */
  
  // Parse JWT token payload
  // const parseJWTPayload = (token) => {
  //   try {
  //     const payload = JSON.parse(atob(token.split('.')[1]));
  //     return payload;
  //   } catch (error) {
  //     return null;
  //   }
  // };

  /**
 * Parse JWT token payload
 * Extracts and decodes JWT token payload
 * 
 * @param {string} token - JWT token to parse
 * @returns {Object} Decoded JWT payload
 * 
 * Example:
 * >>> const payload = parseJWTPayload(token)
 * >>> console.log(payload.exp)
 */
const parseJWTPayload = (token) => {
  try {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token format');
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = parts[1];
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch (error) {
    logger.authError('JWT_PARSE_FAILED', error, { token: token?.substring(0, 20) + '...' });
    return {};
  }
};

  // Check if token is expired or needs refresh
  const getTokenStatus = (token) => {
    if (!token) return 'MISSING';
    
    const payload = parseJWTPayload(token);
    if (!payload) return 'INVALID';
    
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;
    
    if (process.dev) {
      // Debug token status
    }
    
    if (timeUntilExpiry <= 0) {
      return 'EXPIRED';
    }
    
    // Token needs refresh if expires in less than 5 minutes
    if (timeUntilExpiry < 300000) {
      return 'NEEDS_REFRESH';
    }
    
    return 'VALID';
  };

  // Get valid access token (smart refresh untuk mencegah premature logout)
  const getValidAccessToken = async () => {
    if (process.server) return null;
    
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!accessToken || !refreshToken) {
      return null;
    }
    
    const tokenStatus = getTokenStatus(accessToken);
    
    switch (tokenStatus) {
      case 'VALID':
        return accessToken;

      case 'NEEDS_REFRESH':
        // Token <5 menit tapi masih valid
        // Return as-is, last chance monitoring akan handle jika ada aktivitas
        if (process.dev) {
          logger.tokenEvent('TOKEN_NEEDS_REFRESH_RETURNED_AS_IS', {
            userId: user.value?.id,
            message: 'Token <5 menit tapi masih valid'
          });
        }
        return accessToken;

      case 'EXPIRED':
        // FIXED: Token expired - coba refresh dulu sebelum logout
        const timeSinceActivity = Date.now() - lastActivityTime.value;

        // Jika inactivity belum sampai warning time, user masih aktif
        // Refresh token untuk memperpanjang session
        if (timeSinceActivity < CONFIG.SESSION_WARNING_TIME) {
          if (process.dev) {
            logger.tokenEvent('TOKEN_EXPIRED_BUT_USER_ACTIVE_REFRESHING', {
              userId: user.value?.id,
              timeSinceActivity: Math.floor(timeSinceActivity / 1000) + 's',
              message: 'User masih dalam periode aktif, refresh token'
            });
          }
          
          try {
            // Coba refresh token
            const newToken = await refreshAccessToken();
            if (newToken) {
              // Refresh berhasil, kembalikan token baru
              return newToken;
            } else {
              // Refresh gagal, tampilkan modal
              if (!isSessionWarningVisible.value) {
                showSessionWarning();
              }
              return null;
            }
          } catch (error) {
            // Error saat refresh, tampilkan modal
            logger.tokenError('TOKEN_REFRESH_ON_EXPIRED_FAILED', error, {
              userId: user.value?.id
            });
            if (!isSessionWarningVisible.value) {
              showSessionWarning();
            }
            return null;
          }
        }

        // Token expired setelah long inactivity (>20 menit)
        // Tampilkan modal atau force logout
        if (!isSessionWarningVisible.value) {
          if (process.dev) {
            logger.tokenEvent('TOKEN_EXPIRED_SHOWING_SESSION_WARNING', {
              userId: user.value?.id,
              timeSinceActivity: Math.floor(timeSinceActivity / 1000) + 's'
            });
          }
          showSessionWarning();
          return null;
        } else {
          // Modal sudah visible, return null
          return null;
        }

      default:
        return null;
    }
  };

  // Refresh access token
  const refreshAccessToken = async () => {
    if (process.server) return null;
    
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      await forceLogout('No refresh token available');
      return null;
    }

    try {
      const response = await $fetch(CONFIG.ENDPOINTS.REFRESH, {
        method: 'POST',
        body: { refresh_token: refreshToken },
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.status && (response.data || response.token)) {
        // Handle different response structures
        const accessToken = response.token?.access_token || response.data?.access_token;
        const refreshToken = response.token?.refresh_token || response.data?.refresh_token;
        
        if (accessToken) {
          // Update tokens
          localStorage.setItem('access_token', accessToken);
          if (refreshToken) {
            localStorage.setItem('refresh_token', refreshToken);
          }
          
          // DON'T reset activity timer on token refresh
          // This would interfere with inactivity monitoring
          if (process.dev) {
          }
          
          // Reschedule token monitoring (but no auto refresh) based on new token expiry
          scheduleTokenRefresh(accessToken);
          
          if (process.dev) {
            // Enhanced debug logging for token refresh
            try {
              const payload = parseJWTPayload(accessToken);
              const expirationTime = payload.exp * 1000;
              const currentTime = Date.now();
              const timeUntilExpiry = expirationTime - currentTime;
              const minutesUntilExpiry = Math.floor(timeUntilExpiry / 60000);
              const secondsUntilExpiry = Math.floor((timeUntilExpiry % 60000) / 1000);
              
              logger.tokenEvent('TOKEN_REFRESHED_SUCCESS', {
                userId: user.value?.id,
                tokenExpiryMinutes: minutesUntilExpiry,
                tokenExpirySeconds: secondsUntilExpiry
              });
            } catch (error) {
              logger.tokenEvent('TOKEN_REFRESHED_SUCCESS_NO_EXPIRY', {
                userId: user.value?.id
              });
            }
          }
          return accessToken;
        } else {
          logger.tokenError('TOKEN_REFRESH_NO_ACCESS_TOKEN', {
            message: 'No access token received in refresh response'
          }, {
            userId: user.value?.id,
            action: 'REFRESH_TOKEN'
          });
          await forceLogout('Token refresh failed - no access token received');
          return null;
        }
      }
    } catch (error) {
      logger.tokenError('TOKEN_REFRESH_FAILED', error, {
        userId: user.value?.id,
        action: 'REFRESH_TOKEN'
      });

      // ✅ FIXED: Handle 503 network errors - DON'T force logout!
      if (error.status === 503 || error.statusCode === 503 ||
          (error.message && error.message.includes('Network error'))) {
        // console.warn('[AUTH] ⚠️ Network error saat refresh token (503) - TIDAK logout, keep session');
        // console.warn('[AUTH] Kemungkinan: VPN disconnect, koneksi tidak stabil, atau server maintenance');

        // Don't show warning toast - not user-friendly
        // Token will be refreshed automatically when connection is restored
        // const { warning } = useToast();
        // warning('Koneksi tidak stabil. Token akan di-refresh otomatis saat koneksi pulih.');

        // Return current access token (fallback)
        const currentToken = localStorage.getItem('access_token');
        return currentToken;
      }

      // Handle refresh token expiry (401 = unauthorized)
      if (error.status === 401 || error.statusCode === 401) {
        await forceLogout('Session expired. Please log in again.');
        return null;
      }

      // For other errors, return current token and log warning
      // console.warn('[AUTH] ⚠️ Refresh token failed with unknown error - keeping current token');
      const currentToken = localStorage.getItem('access_token');
      return currentToken;
    }
  };

  // Schedule token expiry and activity-based session warning
  const scheduleTokenRefresh = (token) => {
    if (tokenRefreshTimer) {
      clearTimeout(tokenRefreshTimer);
    }
    
    const payload = parseJWTPayload(token);
    if (!payload) return;
    
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;
    
    if (process.dev) {
      const minutes = Math.floor(timeUntilExpiry / 60000);
      const seconds = Math.floor((timeUntilExpiry % 60000) / 1000);
      console.log(`[AUTH] 🎫 Token expires in ${minutes}m ${seconds}s`);
    }
    
    // Start inactivity monitoring - modal akan muncul setelah 15 menit idle
    // Last chance monitoring akan start otomatis di menit ke-10 (5 menit sebelum modal)
    startInactivityMonitoring();
  };

  // Start monitoring session countdown (fixed 15 minutes window)
  const startInactivityMonitoring = () => {
    // Clear existing timers
    if (sessionWarningTimer) {
      clearTimeout(sessionWarningTimer);
      sessionWarningTimer = null;
    }
    if (lastChanceScheduleTimer) {
      clearTimeout(lastChanceScheduleTimer);
      lastChanceScheduleTimer = null;
    }
    
    sessionMonitorStartTime.value = Date.now();
    sessionMonitorTargetTime.value = sessionMonitorStartTime.value + CONFIG.SESSION_WARNING_TIME;
    
    if (process.dev) {
      const warningTime = new Date(sessionMonitorTargetTime.value).toLocaleTimeString();
      console.log(`[AUTH] ⏰ Session countdown started - Modal target at ${warningTime}`);
      startDebugStatusLogging();
    }
    
    // Schedule last chance monitoring (5 minutes before modal)
    const lastChanceDelay = Math.max(0, CONFIG.SESSION_WARNING_TIME - CONFIG.LAST_CHANCE_PERIOD);
    lastChanceScheduleTimer = setTimeout(() => {
      if (isAuthenticated.value && !isSessionWarningVisible.value) {
        if (process.dev) {
          console.log('[AUTH] 🎯 Last chance monitoring window started (minutes 10-15)');
        }
        startLastChanceMonitoring();
      }
    }, lastChanceDelay);
    
    // Schedule modal
    sessionWarningTimer = setTimeout(() => {
      if (!isAuthenticated.value || isSessionWarningVisible.value) {
        return;
      }
      if (process.dev) {
        console.log('[AUTH] 🚨 Session timeout modal triggered by fixed countdown');
      }
      showSessionWarning();
    }, CONFIG.SESSION_WARNING_TIME);
  };

  /**
   * Last Chance Monitoring Functions
   * Aktivasi monitoring khusus saat token tersisa ≤5 menit
   */
  
  // Start last chance monitoring - pantau mouse/keyboard 5 menit sebelum modal (menit 10-15)
  const startLastChanceMonitoring = () => {
    if (isLastChanceMonitoringActive.value) {
      return; // Already active
    }
    
    if (process.dev) {
      console.log('[AUTH] 🎯 Last Chance Monitoring STARTED - 5 min window (idle 10-15 min)');
    }
    
    isLastChanceMonitoringActive.value = true;
    lastChanceActivityDetected.value = false;
    
    // Setup listener khusus untuk mouse/keyboard
    setupLastChanceListeners();
    
    // Timer untuk auto-stop setelah 5 menit (saat modal akan muncul)
    if (lastChanceTimer) {
      clearTimeout(lastChanceTimer);
    }
    
    lastChanceTimer = setTimeout(() => {
      if (process.dev) {
        console.log('[AUTH] ⏰ Last Chance window habis - Modal seharusnya muncul');
      }
      stopLastChanceMonitoring('window_expired');
    }, CONFIG.LAST_CHANCE_PERIOD); // 5 minutes
  };
  
  // Stop last chance monitoring
  const stopLastChanceMonitoring = (reason = 'unknown') => {
    if (!isLastChanceMonitoringActive.value) {
      return;
    }
    
    if (process.dev) {
      logger.tokenEvent('LAST_CHANCE_MONITORING_STOPPED', {
        userId: user.value?.id,
        reason,
        activityDetected: lastChanceActivityDetected.value
      });
    }
    
    isLastChanceMonitoringActive.value = false;
    lastChanceActivityDetected.value = false;
    
    // Remove listener khusus
    removeLastChanceListeners();
    
    // Clear timers
    if (lastChanceTimer) {
      clearTimeout(lastChanceTimer);
      lastChanceTimer = null;
    }
    if (lastChanceCheckTimer) {
      clearTimeout(lastChanceCheckTimer);
      lastChanceCheckTimer = null;
    }
    if (lastChanceScheduleTimer) {
      clearTimeout(lastChanceScheduleTimer);
      lastChanceScheduleTimer = null;
    }
  };
  
  // Handler untuk last chance activity detection
  const handleLastChanceActivity = async () => {
    // Hanya proses jika mode aktif dan belum detect aktivitas
    if (!isLastChanceMonitoringActive.value || lastChanceActivityDetected.value) {
      return;
    }

    if (process.dev) {
      console.log('[AUTH] 🎯 AKTIVITAS TERDETEKSI dalam last chance window - refresh token!');
    }

    // ✅ FIX: Set flag PERMANENTLY until monitoring ends
    // This prevents spam - only ONE refresh during the entire last-chance window
    // Flag will be reset when:
    // 1. Last chance monitoring stops (modal shown)
    // 2. User extends session manually
    // 3. User logs out
    lastChanceActivityDetected.value = true;

    // Update lastActivityTime
    lastActivityTime.value = Date.now();

    // Refresh token immediately - extend token 20 menit lagi
    try {
      const newToken = await refreshAccessToken();

      if (newToken) {
        if (process.dev) {
          console.log('[AUTH] ✅ Token refreshed successfully - Extended 20 minutes');
          console.log('[AUTH] 🔒 Flag LOCKED - No more refreshes until next last-chance window');
        }

        // ✅ FIX: DO NOT RESET FLAG!
        // Prevents spam refresh calls when user continues moving/typing
        // Previous code reset flag here, causing spam on every activity
        //
        // ❌ REMOVED: lastChanceActivityDetected.value = false;
      }
    } catch (error) {
      logger.tokenError('LAST_CHANCE_REFRESH_FAILED', error, {
        userId: user.value?.id
      });

      // ✅ FIX: Even on error, keep flag = true to prevent spam retries
      // If refresh failed, we'll let the modal show (correct behavior)
      // Don't spam the server with retry attempts
      //
      // ❌ REMOVED: lastChanceActivityDetected.value = false;

      if (process.dev) {
        console.warn('[AUTH] ⚠️ Refresh failed but flag REMAINS true to prevent spam');
      }
    }
  };
  
  // Setup listener khusus untuk last chance monitoring
  const setupLastChanceListeners = () => {
    if (process.server) return;
    
    LAST_CHANCE_EVENTS.forEach(event => {
      document.addEventListener(event, handleLastChanceActivity, { passive: true });
    });
  };
  
  // Remove listener khusus untuk last chance monitoring
  const removeLastChanceListeners = () => {
    if (process.server) return;
    
    LAST_CHANCE_EVENTS.forEach(event => {
      document.removeEventListener(event, handleLastChanceActivity);
    });
  };

  /**
   * Session Management Functions
   */
  
  // Reset activity timer (called on user activity)
  // CORRECTED: Hanya update timestamp, TIDAK restart inactivity timer
  const resetActivityTimer = (isUserActivity = true) => {
    // Use configured throttle time from environment
    if (activityThrottleTimer && isUserActivity) {
      return; // Throttle user activity, but allow system calls
    }

    if (isUserActivity) {
      // Throttle activity detection using config value
      activityThrottleTimer = setTimeout(() => {
        activityThrottleTimer = null;
      }, CONFIG.ACTIVITY_THROTTLE); // Use config value (100ms)
      
      // Debug log for activity detection
      if (process.dev && localStorage.getItem('debug_auth_activity')) {
        const currentTime = new Date().toLocaleTimeString();
        console.log(`[AUTH] 📝 Activity detected at ${currentTime} - UPDATE lastActivityTime only`);
      }
      
      // IMPORTANT: Hanya update lastActivityTime
      // TIDAK restart inactivity timer - biarkan timer asli jalan terus dari login
      // Last chance monitoring yang akan handle refresh token jika ada aktivitas
    }
    
    // Always update activity time untuk tracking inactivity
    lastActivityTime.value = Date.now();

    // IMPORTANT: DO NOT hide modal on activity while it's visible
    // Modal should only be hidden when user explicitly extends session or logs out
    // User activity during modal display should NOT hide the modal automatically

    // Clear visibility timer only
    if (visibilityTimer) {
      clearTimeout(visibilityTimer);
      visibilityTimer = null;
    }

    // REMOVED: JANGAN restart inactivity monitoring setiap aktivitas
    // Timer harus jalan dari login dan TIDAK di-reset
    // Hanya last chance monitoring yang detect aktivitas untuk refresh token
    
  };

  // REMOVED: checkAndRefreshTokenOnActivity - tidak diperlukan lagi
  // Token refresh sekarang hanya terjadi melalui:
  // 1. Last chance monitoring (≤5 min sebelum modal) - handleLastChanceActivity()
  // 2. Manual extend session dari modal - extendSession()

  // Show session warning modal
  const showSessionWarning = () => {
    if (!isAuthenticated.value) return;
    
    // Prevent multiple modals
    if (isSessionWarningVisible.value) return;
    
    // Stop last chance monitoring karena modal sudah muncul
    if (isLastChanceMonitoringActive.value) {
      stopLastChanceMonitoring('modal_shown');
    }
    
    // Update monitor target to now
    sessionMonitorTargetTime.value = Date.now();
    
    // Check current token status before showing modal
    const currentToken = localStorage.getItem('access_token');
    if (!currentToken) {
      forceLogout('No token found');
      return;
    }
    
    const tokenStatus = getTokenStatus(currentToken);
    if (tokenStatus === 'EXPIRED' || tokenStatus === 'INVALID') {
      forceLogout('Token already expired');
      return;
    }
    
    // CORRECTED: Use 5-minute countdown
    // This gives users 5 minutes to decide extend atau logout
    sessionCountdownTime.value = CONFIG.COUNTDOWN_DURATION / 1000; // 5 minutes = 300 seconds
    
    if (process.dev) {
      console.log('[AUTH] 🚨 SessionTimeoutModal SHOWN - Countdown: 5 minutes');
    }
    
    // Check if there's reasonable time remaining
    const payload = parseJWTPayload(currentToken);
    if (payload) {
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const actualTimeRemaining = Math.floor((expirationTime - currentTime) / 1000);
      
      // Only show modal if there's reasonable time remaining
      if (actualTimeRemaining <= 30) {
        forceLogout('Token expired');
        return;
      }
    }
    
    isSessionWarningVisible.value = true;
    
    // Clear any existing countdown timer
    if (sessionCountdownTimer) {
      clearInterval(sessionCountdownTimer);
    }
    
    sessionCountdownTimer = setInterval(() => {
      sessionCountdownTime.value--;
      
      if (sessionCountdownTime.value <= 0) {
        clearInterval(sessionCountdownTimer);
        sessionCountdownTimer = null;
        hideSessionWarning();
        forceLogout('Session expired due to inactivity');
      }
    }, 1000);
  };

  // Hide session warning modal
  const hideSessionWarning = () => {
    isSessionWarningVisible.value = false;
    sessionCountdownTime.value = 0;
    
    if (sessionCountdownTimer) {
      clearInterval(sessionCountdownTimer);
      sessionCountdownTimer = null;
    }
  };

  // Extend session (called from modal)
  const extendSession = async () => {

    try {
      const newToken = await refreshAccessToken();
      if (newToken) {
        // Hide the warning modal
        hideSessionWarning();

        // ✅ FIX: Stop last chance monitoring and reset flag
        // This prepares for the NEXT last-chance window
        stopLastChanceMonitoring('manual_extend');

        // Reset activity timer for manual extend session (user action)
        resetActivityTimer(true); // This IS user activity

        // Schedule next token refresh and restart inactivity monitoring for new token
        scheduleTokenRefresh(newToken);

        success('Session extended successfully for another 20 minutes');
        return true;
      } else {
        showError('Failed to extend session. Please log in again.');
        return false;
      }
    } catch (error) {
      showError('Failed to extend session. Please log in again.');
      return false;
    }
  };

  /**
   * Activity Monitoring Functions
   */
  
  // Setup activity event listeners
  const setupActivityListeners = () => {
    if (process.server) return;
    
    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, resetActivityTimer, { passive: true });
    });
    
    // Monitor tab visibility
    document.addEventListener('visibilitychange', handleVisibilityChange);
  };

  // Remove activity event listeners
  const removeActivityListeners = () => {
    if (process.server) return;
    
    ACTIVITY_EVENTS.forEach(event => {
      document.removeEventListener(event, resetActivityTimer);
    });
    
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };

  // Handle tab visibility changes
  const handleVisibilityChange = () => {
    const isVisible = !document.hidden;
    isTabVisible.value = isVisible;
    
    if (process.dev) {
      // Debug token status
    }
    
    if (isVisible) {
      if (visibilityTimer) {
        clearTimeout(visibilityTimer);
        visibilityTimer = null;
      }
      
      const remaining = sessionMonitorTargetTime.value - Date.now();
      if (remaining <= 0 && !isSessionWarningVisible.value) {
        showSessionWarning();
        return;
      }
      
      if (!sessionWarningTimer && remaining > 0) {
        sessionWarningTimer = setTimeout(() => {
          if (!isSessionWarningVisible.value && isAuthenticated.value) {
            showSessionWarning();
          }
        }, remaining);
      }
    } else {
      if (sessionWarningTimer) {
        clearTimeout(sessionWarningTimer);
        sessionWarningTimer = null;
      }
      
      const remaining = sessionMonitorTargetTime.value - Date.now();
      const delay = remaining > 0 ? remaining : 1000;
      visibilityTimer = setTimeout(() => {
        if (!document.hidden && isAuthenticated.value && !isSessionWarningVisible.value) {
          showSessionWarning();
        }
      }, delay);
    }
  };

  /**
   * Authentication Functions
   */
  
  // Login function
  const login = async (email, password) => {
    if (process.server) {
      return { success: false, message: 'Login only available on client side' };
    }

    // Check account lockout
    if (isAccountLocked.value && lockedEmail.value === email) {
      return {
        success: false,
        message: `Account locked. Please wait ${formattedRemainingTime.value} or contact IT Support.`,
        locked: true
      };
    }

    isLoading.value = true;
    
    try {
      const response = await $fetch(CONFIG.ENDPOINTS.LOGIN, {
        method: 'POST',
        body: { email, password },
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.status && response.data && response.token) {
        // Set user data
        user.value = response.data;
        isAuthenticated.value = true;

        // Store user data using centralized utility
        UserStorage.saveUser(response.data);
        // Store tokens
        localStorage.setItem('access_token', response.token.access_token);
        localStorage.setItem('refresh_token', response.token.refresh_token);

        // Reset failed attempts
        failedLoginAttempts.value = 0;
        lockoutEndTime.value = null;
        lockedEmail.value = '';

        // Initialize session management
        setupActivityListeners();
        resetActivityTimer(false); // System call
        
        // Schedule token refresh and session warning based on actual token expiry
        scheduleTokenRefresh(response.token.access_token);

        // Set login status for welcome toast
        localStorage.setItem('login_status', 'success');

        // Log successful login
        logger.authEvent('LOGIN_SUCCESS', {
          userId: response.data?.id,
          userEmail: response.data?.email
        });

        // ADDED: Initialize user data after successful login
        try {
          const userDataResult = await initializeUserData();
          if (userDataResult.success) {
            // User data successfully initialized
            logger.authEvent('USER_DATA_INITIALIZED_AFTER_LOGIN', {
              userId: userDataResult.userDetail?.employee_id,
              userEmail: userDataResult.userDetail?.email,
              permissions: userDataResult.permissions?.permissions
            });
          } else {
            // Log warning but don't fail login
            logger.authError('USER_DATA_INITIALIZATION_WARNING', new Error(userDataResult.errors?.join('; ')), {
              userId: response.data?.id,
              userEmail: response.data?.email
            });
          }
        } catch (error) {
          // Log error but don't fail login
          logger.authError('USER_DATA_INITIALIZATION_ERROR_AFTER_LOGIN', error, {
            userId: response.data?.id,
            userEmail: response.data?.email
          });
        }

        // Dispatch login event for plugins
        if (process.client) {
          window.dispatchEvent(new CustomEvent('user-login', {
            detail: {
              user: response.data,
              permissions: response.access || []
            }
          }));
        }
        
        return { success: true };
      } else {
        // Handle API response with status: false
        const message = response.messages || response.message || 'Login failed';
        
        // Check if this is a lockout message with time information
        if (message.includes('locked due to too many failed login attempts')) {
          // Extract time information from message
          // Support both formats:
          // 1. "Please try again in 18 minutes 59 seconds"
          // 2. "You must wait 15:00 until you can try again"
          let timeMatch = message.match(/Please try again in (.+?)\./);
          let timeStr = '';
          let lockoutDuration = 20 * 60 * 1000; // Default 20 minutes
          
          if (timeMatch) {
            // Format 1: "18 minutes 59 seconds"
            timeStr = timeMatch[1];
            const minutesMatch = timeStr.match(/(\d+)\s*minutes?/);
            const secondsMatch = timeStr.match(/(\d+)\s*seconds?/);
            
            if (minutesMatch) {
              lockoutDuration = parseInt(minutesMatch[1]) * 60 * 1000;
            }
            if (secondsMatch) {
              lockoutDuration += parseInt(secondsMatch[1]) * 1000;
            }
          } else {
            // Format 2: "You must wait 15:00 until you can try again"
            timeMatch = message.match(/You must wait (\d+:\d+)/);
            if (timeMatch) {
              timeStr = timeMatch[1];
              const [minutes, seconds] = timeStr.split(':').map(Number);
              lockoutDuration = (minutes * 60 + seconds) * 1000;
            }
          }
          
          // Set lockout state
          lockoutEndTime.value = Date.now() + lockoutDuration;
          lockedEmail.value = email;
          
          logger.authEvent('ACCOUNT_LOCKED_API_RESPONSE', {
            userEmail: email,
            lockoutDuration: lockoutDuration,
            timeString: timeStr,
            message: message
          });
          
          return { 
            success: false, 
            message: message,
            locked: true,
            timeString: timeStr // Pass the time string for display
          };
        }
        
        return { success: false, message: message };
      }
    } catch (error) {
      // Log login failure
      logger.authError('LOGIN_FAILED', error, {
        userEmail: email,
        statusCode: error.status,
        currentAttempts: failedLoginAttempts.value
      });

      // Handle failed login attempts
      if (error.status === 401) {
        if (lockedEmail.value !== email) {
          failedLoginAttempts.value = 1;
          lockedEmail.value = email;
        } else {
          failedLoginAttempts.value++;
        }

        // Lock account after max attempts
        if (failedLoginAttempts.value >= CONFIG.MAX_LOGIN_ATTEMPTS) {
          lockoutEndTime.value = Date.now() + CONFIG.LOCKOUT_DURATION;
          
          logger.authEvent('ACCOUNT_LOCKED_MAX_ATTEMPTS', {
            userEmail: email,
            attempts: failedLoginAttempts.value,
            lockoutDuration: CONFIG.LOCKOUT_DURATION
          });
        }
      }

      // Handle server-side lockout
      if (error.status === 423 && error.data) {
        lockoutEndTime.value = error.data.lockoutEndTime || (Date.now() + CONFIG.LOCKOUT_DURATION);
        lockedEmail.value = email;
        
        logger.authEvent('ACCOUNT_LOCKED_SERVER_SIDE', {
          userEmail: email,
          lockoutEndTime: lockoutEndTime.value
        });
        
        return {
          success: false,
          message: error.data.message || 'Account temporarily locked',
          locked: true
        };
      }

      // Return appropriate error message
      let errorMessage = 'Login failed';
      if (error.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error.status === 423) {
        errorMessage = 'Account locked due to multiple failed attempts';
      } else if (error.status === 503) {
        errorMessage = 'Network connection issue. Please check your connection.';
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      }

      return { success: false, message: errorMessage };
    } finally {
      isLoading.value = false;
    }
  };

  // Logout guard to prevent multiple simultaneous logout calls
  let isLoggingOut = false;

  // Logout function - Simplified for ESS Host iframe compatibility
  const logout = async (reason = 'User logged out') => {
    if (process.server) return;

    // Prevent multiple simultaneous logout calls
    if (isLoggingOut) {
      if (process.dev) {
        console.log('[AUTH] ⚠️ Logout already in progress, skipping...');
      }
      return;
    }

    isLoggingOut = true;

    try {
      // Save userId for logging before clearing
      const loggedOutUserId = user.value?.id;
      const isInIframe = window.parent !== window;

      if (process.dev) {
        console.log('[AUTH] 🚪 Starting logout process:', {
          reason,
          userId: loggedOutUserId,
          isInIframe,
          timestamp: new Date().toISOString()
        });
      }

      // Clear all timers
      clearAllTimers();

      // Remove activity listeners
      removeActivityListeners();

      // Clear authentication state
      user.value = null;
      isAuthenticated.value = false;
      isSessionWarningVisible.value = false;
      sessionCountdownTime.value = 0;

      // Log logout event
      logger.authEvent('LOGOUT', {
        userId: loggedOutUserId,
        reason,
        isInIframe
      });

      // Clear stored data - ESSHost format
      localStorage.removeItem('user');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_expiry');
      localStorage.removeItem('user_roles');
      localStorage.removeItem('user_permissions');

      // Clear microfrontend format
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth-token');
      localStorage.removeItem('token');

      // Clear any other auth-related keys
      localStorage.removeItem('auth:login');
      localStorage.removeItem('auth:logout');
      
      // ✅ Clear route restoration data (reset for next login)
      localStorage.removeItem('last_visited_route');
      sessionStorage.removeItem('app_visited');
      
      // Clear all sessionStorage (like mango implementation)
      sessionStorage.clear();

      // Show appropriate message
      if (reason.includes('Session expired') || reason.includes('inactivity')) {
        sessionExpired(reason);
      } else {
        success('Logout successful');
      }

      // Dispatch logout event for plugins
      if (process.client) {
        window.dispatchEvent(new CustomEvent('user-logout'));
      }

      // CRITICAL: If in iframe, send postMessage FIRST before any redirect/unmount
      if (isInIframe) {
        const getParentOrigin = () => {
          try {
            if (document.referrer) {
              const origin = new URL(document.referrer).origin;
              if (process.dev) {
                console.log('[AUTH] 📡 Detected parent origin from referrer:', origin);
              }
              return origin;
            }
          } catch (e) {
            if (process.dev) {
              console.warn('[AUTH] ⚠️ Could not parse referrer, using wildcard');
            }
          }
          return '*';
        };

        const parentOrigin = getParentOrigin();
        
        // IMPORTANT: Send postMessage IMMEDIATELY
        console.log('[AUTH] 🚪 Sending LOGOUT_REQUEST to parent:', {
          origin: parentOrigin,
          reason,
          timestamp: new Date().toISOString()
        });

        window.parent.postMessage({
          type: 'LOGOUT_REQUEST',
          source: 'update-data',
          app_name: 'Update Data',
          timestamp: new Date().toISOString(),
          data: { reason }
        }, parentOrigin);

        // Send completion message with delay to ensure first message is received
        await new Promise(resolve => {
          setTimeout(() => {
            window.parent.postMessage({
              type: 'UPDATE_DATA_LOGOUT_COMPLETE',
              source: 'update-data',
              app_name: 'Update Data',
              timestamp: new Date().toISOString()
            }, parentOrigin);
            
            console.log('[AUTH] ✅ Sent LOGOUT_COMPLETE to parent');
            resolve();
          }, 300); // Reduced from 500ms to 300ms for faster response
        });

        // Wait a bit more to ensure parent receives messages before iframe potentially unmounts
        await new Promise(resolve => setTimeout(resolve, 200));

        if (process.dev) {
          console.log('[AUTH] 🏁 Logout complete, parent should handle redirect');
        }

        // DON'T navigate in iframe - let parent handle it
        // Parent (ESS Host) will handle the redirect to login

      } else {
        // Standalone mode - redirect to login
        if (process.dev) {
          console.log('[AUTH] 🔄 Standalone mode, redirecting to /login');
        }
        await navigateTo('/login');
      }

    } catch (error) {
      // Log any errors but don't throw - logout must always succeed
      console.error('[AUTH] ❌ Logout error:', error);
      logger.authError('LOGOUT_ERROR', error, {
        reason,
        message: 'Logout completed despite error'
      });
    } finally {
      // Reset logout guard after a delay
      setTimeout(() => {
        isLoggingOut = false;
        if (process.dev) {
          console.log('[AUTH] 🔓 Logout guard released');
        }
      }, 1000);
    }
  };

  // Force logout (for token expiry, etc.)
  const forceLogout = async (reason = 'Session expired') => {
    await logout(reason);
  };

  // Check existing authentication state
  const checkAuth = async () => {
    if (process.server) return;

    const storedUser = UserStorage.getUser(); // Use centralized utility
    const accessToken = localStorage.getItem('access_token');

    if (storedUser && accessToken) {
      try {
        const parsedUser = storedUser; // Already parsed by UserStorage
        const tokenStatus = getTokenStatus(accessToken);
        
        if (tokenStatus === 'VALID' || tokenStatus === 'NEEDS_REFRESH') {
          user.value = parsedUser;
          isAuthenticated.value = true;
          
          // Initialize session management
          setupActivityListeners();
          resetActivityTimer(false); // System call
          
          // Schedule token refresh and session warning based on actual token expiry
          scheduleTokenRefresh(accessToken);
          
          // Refresh token if needed
          if (tokenStatus === 'NEEDS_REFRESH') {
            await refreshAccessToken();
          }
          
        } else {
          // Token is expired or invalid
          await forceLogout('Session expired');
        }
      } catch (error) {
        await forceLogout('Invalid stored data');
      }
    }
  };

  /**
   * Utility Functions
   */
  
  // Clear all timers
  const clearAllTimers = () => {
    if (sessionWarningTimer) {
      clearTimeout(sessionWarningTimer);
      sessionWarningTimer = null;
    }
    if (sessionCountdownTimer) {
      clearInterval(sessionCountdownTimer);
      sessionCountdownTimer = null;
    }
    if (tokenRefreshTimer) {
      clearTimeout(tokenRefreshTimer);
      tokenRefreshTimer = null;
    }
    if (debugStatusTimer) {
      clearInterval(debugStatusTimer);
      debugStatusTimer = null;
    }
    if (activityThrottleTimer) {
      clearTimeout(activityThrottleTimer);
      activityThrottleTimer = null;
    }
    if (visibilityTimer) {
      clearTimeout(visibilityTimer);
      visibilityTimer = null;
    }
    if (lastChanceTimer) {
      clearTimeout(lastChanceTimer);
      lastChanceTimer = null;
    }
    if (lastChanceCheckTimer) {
      clearTimeout(lastChanceCheckTimer);
      lastChanceCheckTimer = null;
    }
    
    // Stop last chance monitoring
    stopLastChanceMonitoring('cleanup');
  };

/**
 * Get detailed user profile information
 * Fetches comprehensive user data from the API
 * 
 * @returns {Promise<Object>} User profile data with success status
 * 
 * Example:
 * >>> const { data, success } = await getUserDetail()
 * >>> if (success) console.log(data.employee_name)
 */
const getUserDetail = async () => {
  if (process.server) {
    return { success: false, message: 'User detail only available on client side' };
  }

  if (!isAuthenticated.value) {
    return { success: false, message: 'User not authenticated' };
  }

  isLoading.value = true;

  try {
    const token = await getValidAccessToken();
    if (!token) {
      return { success: false, message: 'No valid access token available' };
    }

    // Fetch user basic information
    const response = await $fetch(`/api/proxy/user/${user.value?.user_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status && response.data) {
      // Update user data with detailed information
      user.value = {
        ...user.value,
        ...response.data,
        // Ensure we have the essential fields
        id: response.data.user_id || user.value?.user_id,
        email: response.data.email || user.value?.email,
        name: response.data.name || user.value?.name
      };

      // Store updated user data using centralized utility
      UserStorage.saveUser(user.value);

      // Log successful user detail fetch
      logger.authEvent('USER_DETAIL_FETCHED', {
        userId: response.data.employee_id,
        userEmail: response.data.email
      });

      return {
        success: true,
        data: response.data,
        message: 'User detail fetched successfully'
      };
    } else {
      return { 
        success: false, 
        message: response.message || 'Failed to fetch user detail' 
      };
    }
  } catch (error) {
    // Log error
    logger.authError('USER_DETAIL_FETCH_FAILED', error, {
      userId: user.value?.id,
      userEmail: user.value?.email
    });

    // Return appropriate error message
    let errorMessage = 'Failed to fetch user detail';
    if (error.status === 401) {
      errorMessage = 'Authentication required';
    } else if (error.status === 403) {
      errorMessage = 'Access denied to user detail';
    } else if (error.status === 404) {
      errorMessage = 'User detail not found';
    } else if (error.data?.message) {
      errorMessage = error.data.message;
    }

    return { success: false, message: errorMessage };
  } finally {
    // Store updated user data using centralized utility
    if (user.value) {
      UserStorage.saveUser(user.value);
      if (user.value.roles) {
        UserStorage.saveRoles(user.value.roles);
      }
    }

    isLoading.value = false;
  }
};

/**
 * Get user role permissions
 * Fetches user permissions and roles from JWT token and API
 * 
 * @returns {Promise<Object>} User permissions data with success status
 * 
 * Example:
 * >>> const { permissions, roles, success } = await getUserPermissions()
 * >>> if (success) console.log(permissions)
 */
const getUserPermissions = async () => {
  if (process.server) {
    return { success: false, message: 'User permissions only available on client side' };
  }

  if (!isAuthenticated.value) {
    return { success: false, message: 'User not authenticated' };
  }

  try {
    const token = await getValidAccessToken();
    if (!token) {
      return { success: false, message: 'No valid access token available' };
    }

    // Parse JWT token to extract permissions and roles
    const payload = parseJWTPayload(token);
    const directPermissions = payload.access || [];
    const userRoles = payload.role || payload.roles || [];
    const userPermissions = [];

    if (localStorage.getItem('user_roles')) {
      const userRoles = JSON.parse(localStorage.getItem('user_roles'));
      for (const role of userRoles) {
        const userPermissionsResponse = await $fetch(`/api/proxy/role/${role.role_id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (userPermissionsResponse.data) {
          userPermissions.push(...userPermissionsResponse.data.permissions);
        }
      }
      localStorage.setItem('user_permissions', JSON.stringify(userPermissions));
    }
    // console.log("User Permissions", userPermissions);

    // Convert roles to permissions using RBAC mapping
    const rolePermissions = [];
    if (Array.isArray(userRoles)) {
      userRoles.forEach(role => {
        const exactMatch = ROLE_PERMISSIONS[role];
        const caseInsensitiveMatch = ROLE_PERMISSIONS[role?.toLowerCase()] || ROLE_PERMISSIONS[role?.toUpperCase()];
        const match = exactMatch || caseInsensitiveMatch;
        
        if (match) {
          rolePermissions.push(...match);
        }
      });
    } else if (typeof userRoles === 'string') {
      const exactMatch = ROLE_PERMISSIONS[userRoles];
      const caseInsensitiveMatch = ROLE_PERMISSIONS[userRoles?.toLowerCase()] || ROLE_PERMISSIONS[userRoles?.toUpperCase()];
      const match = exactMatch || caseInsensitiveMatch;
      
      if (match) {
        rolePermissions.push(...match);
      }
    }

    // Combine and deduplicate permissions
    const allPermissions = [...new Set([...directPermissions, ...rolePermissions])];

    // Log successful permission fetch
    logger.authEvent('USER_PERMISSIONS_FETCHED', {
      userId: user.value?.id,
      userEmail: user.value?.email,
      permissions: allPermissions,
      roles: userRoles
    });

    return {
      success: true,
      data: {
        permissions: allPermissions,
        roles: userRoles,
        directPermissions,
        rolePermissions
      },
      message: 'User permissions fetched successfully'
    };
  } catch (error) {
    // Log error
    logger.authError('USER_PERMISSIONS_FETCH_FAILED', error, {
      userId: user.value?.id,
      userEmail: user.value?.email
    });

    return { 
      success: false, 
      message: 'Failed to fetch user permissions' 
    };
  }
};

/**
 * Initialize user data after successful login
 * Fetches both user detail and permissions
 * 
 * @returns {Promise<Object>} Combined user data and permissions
 * 
 * Example:
 * >>> const { userDetail, permissions, success } = await initializeUserData()
 * >>> if (success) console.log('User initialized:', userDetail, permissions)
 */
const initializeUserData = async () => {
  if (process.server) {
    return { success: false, message: 'User initialization only available on client side' };
  }

  if (!isAuthenticated.value) {
    return { success: false, message: 'User not authenticated' };
  }

  isLoading.value = true;

  try {
    // Fetch both user detail and permissions in parallel
    const [userDetailResult, permissionsResult] = await Promise.all([
      getUserDetail(),
      getUserPermissions()
    ]);

    const results = {
      success: userDetailResult.success && permissionsResult.success,
      userDetail: userDetailResult.data,
      permissions: permissionsResult.data,
      errors: []
    };

    // Collect any errors
    if (!userDetailResult.success) {
      results.errors.push(`User detail: ${userDetailResult.message}`);
    }
    if (!permissionsResult.success) {
      results.errors.push(`Permissions: ${permissionsResult.message}`);
    }

    // Log initialization result
    if (results.success) {
      logger.authEvent('USER_DATA_INITIALIZED', {
        userId: userDetailResult.data?.employee_id,
        userEmail: userDetailResult.data?.email,
        permissions: permissionsResult.data?.permissions,
        roles: permissionsResult.data?.roles
      });
    } else {
      logger.authError('USER_DATA_INITIALIZATION_FAILED', new Error(results.errors.join('; ')), {
        userId: user.value?.id,
        userEmail: user.value?.email
      });
    }

    return results;
  } catch (error) {
    // Log error
    logger.authError('USER_DATA_INITIALIZATION_ERROR', error, {
      userId: user.value?.id,
      userEmail: user.value?.email
    });

    return { 
      success: false, 
      message: 'Failed to initialize user data',
      error: error.message
    };
  } finally {
    isLoading.value = false;
  }
};

  // Initialize authentication on client
  if (process.client) {
    // Check existing authentication
    checkAuth();

    // Listen for user data updates from iframe-token-handler
    window.addEventListener('user-data-updated', (event) => {
      if (event.detail) {
        user.value = event.detail;
        isAuthenticated.value = true;
      }
    });
  }

  // Create authentication instance
  authInstance = {
    // Reactive state
    user: computed(() => user.value),
    isAuthenticated: computed(() => isAuthenticated.value),
    isLoading: computed(() => isLoading.value),
    
    // Session state
    isSessionWarningVisible: computed(() => isSessionWarningVisible.value),
    sessionCountdownTime: computed(() => sessionCountdownTime.value),
    sessionMonitorStartTime: computed(() => sessionMonitorStartTime.value),
    sessionMonitorTargetTime: computed(() => sessionMonitorTargetTime.value),
    lastActivityTime: computed(() => lastActivityTime.value),
    isLastChanceMonitoringActive: computed(() => isLastChanceMonitoringActive.value),
    
    // Account lockout state
    failedLoginAttempts: computed(() => failedLoginAttempts.value),
    maxLoginAttempts: CONFIG.MAX_LOGIN_ATTEMPTS,
    isAccountLocked,
    formattedRemainingTime,
    getCurrentLockedEmail: () => lockedEmail.value,
    
    // Authentication functions
    login,
    logout,
    checkAuth,
    
    // Token management
    getValidAccessToken,
    refreshAccessToken,
    
    // Session management
    extendSession,
    resetActivityTimer,
    showSessionWarning, // For debug panel
    
    // ADDED: User data functions
    getUserDetail,
    getUserPermissions,
    initializeUserData,
    
    // Utilities
    timeSinceLastActivity
  };


  return authInstance;
};

// Force cleanup for logout (called externally if needed)
export const forceCleanupAuth = () => {
  if (authInstance) {
    authInstance.logout('Force cleanup');
    authInstance = null;
  }
};