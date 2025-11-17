/**
 * Iframe Token Handler Plugin
 * Handles token receiving from parent (ESS-Sigma) and auto-refresh
 * Uses shared auth service for consistent logout behavior
 */
import { defineNuxtPlugin } from '#app';
import envConfig from '~/config/environment.js';
import { useAuthState } from '~/composables/useAuthState';

export default defineNuxtPlugin(() => {
  if (process.server) return;

  // Initialize auth state management
  const { setAuthReady, resetAuthState } = useAuthState();

  // Note: Using local clearTokens function instead of external auth-service
  // The auth-service.js file doesn't exist, so we handle logout locally

  const tokenStore = {
    accessToken: null,
    refreshToken: null,
    tokenExpiry: null,
    refreshTimer: null
  };

  /**
   * Validate origin untuk keamanan
   */
  const isValidOrigin = (origin) => {
    return envConfig.CORS_ORIGINS.PRODUCTION.includes(origin);
  };

  /**
   * Save token ke storage
   */
  const saveTokens = (access_token, refresh_token, expires_in) => {
    tokenStore.accessToken = access_token;
    tokenStore.refreshToken = refresh_token;

    // Calculate token expiry time
    const expiryTime = Date.now() + (expires_in * 1000);
    tokenStore.tokenExpiry = expiryTime;

    // Save to localStorage for persistence
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    localStorage.setItem('token_expiry', expiryTime.toString());

    // console.log('[Update-Data] Tokens saved successfully');

    // Setup auto-refresh
    setupTokenRefresh(expires_in);
  };

  /**
   * Setup auto-refresh timer
   * ✅ FIX: Don't refresh independently - request from parent instead
   * This prevents race conditions where both iframe and parent refresh simultaneously
   */
  const setupTokenRefresh = (expires_in) => {
    // Clear existing timer
    if (tokenStore.refreshTimer) {
      clearTimeout(tokenStore.refreshTimer);
    }

    // Set refresh to happen 5 minutes before expiry
    const refreshBuffer = envConfig.SECURITY.TOKEN_REFRESH_BUFFER;
    const refreshTime = (expires_in * 1000) - refreshBuffer;

    tokenStore.refreshTimer = setTimeout(() => {
      // Request refresh from parent instead of doing it ourselves
      requestTokenRefreshFromParent();
    }, refreshTime);

    // console.log('[Update-Data] Token refresh check scheduled in', Math.floor(refreshTime / 1000), 'seconds');
  };

  /**
   * Request token refresh from parent
   * ✅ SOLUTION: Ask parent to refresh and send us new token
   * This ensures Portal is the single source of truth for token management
   */
  const requestTokenRefreshFromParent = () => {
    if (window.parent !== window) {
      // console.log('[Update-Data] 🔄 Requesting token refresh from parent');
      window.parent.postMessage({
        type: 'REQUEST_TOKEN_REFRESH',
        source: 'update-data',
        timestamp: Date.now(),
        data: {
          reason: 'Token expiring soon',
          current_expiry: tokenStore.tokenExpiry
        }
      }, getParentOrigin());
    } else {
      // console.warn('[Update-Data] Not in iframe, cannot request refresh from parent');
    }
  };

  /**
   * Refresh access token
   * ✅ DEPRECATED: This redirects to parent-based refresh
   * We don't call API directly to avoid race conditions
   */
  const refreshAccessToken = () => {
    // console.log('[Update-Data] ⚠️ Token refresh needed');
    // console.log('[Update-Data] Requesting refresh from parent to avoid race condition');
    requestTokenRefreshFromParent();
  };

  /**
   * Get parent origin dynamically
   */
  const getParentOrigin = () => {
    try {
      const referrer = document.referrer || '';
      if (referrer) {
        const origin = new URL(referrer).origin;
        if (origin) return origin;
      }
    } catch (e) {}
    return envConfig.IS_PRODUCTION ? envConfig.FRONTEND_URLS.PRODUCTION.ESS_HOST : envConfig.FRONTEND_URLS.DEVELOPMENT.ESS_HOST;
  };

  /**
   * Notify parent that token expired
   */
  const notifyParentTokenExpired = () => {
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'TOKEN_EXPIRED',
        source: 'update-data'
      }, getParentOrigin());
    }
  };

  /**
   * Get current access token
   */
  const getAccessToken = () => {
    return tokenStore.accessToken || localStorage.getItem('access_token');
  };

  /**
   * Request token from parent
   */
  const requestTokenFromParent = () => {
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'REQUEST_TOKEN',
        source: 'update-data'
      }, getParentOrigin());
    }
  };

  /**
   * Sync authentication data from ESSHost
   */
  const syncFromESSHost = () => {
    try {
      // Get ESSHost data using ESSHost keys
      const essToken = localStorage.getItem('access_token');
      const essUser = localStorage.getItem('user');
      const essRoles = localStorage.getItem('user_roles');
      const essPermissions = localStorage.getItem('user_permissions');

      if (!essToken || !essUser) {
        // console.log('[Update-Data] No ESSHost auth data found');
        return false;
      }

      // Parse ESSHost data
      const userData = JSON.parse(essUser);
      const roles = essRoles ? JSON.parse(essRoles) : [];
      const permissions = essPermissions ? JSON.parse(essPermissions) : [];

      // Update token store
      tokenStore.accessToken = essToken;
      tokenStore.refreshToken = localStorage.getItem('refresh_token');
      
      // Calculate token expiry
      const tokenExpiry = localStorage.getItem('token_expiry');
      if (tokenExpiry) {
        tokenStore.tokenExpiry = parseInt(tokenExpiry);
      }

      // Store in localStorage for persistence (keep ESSHost keys for compatibility)
      localStorage.setItem('access_token', essToken);
      if (tokenStore.refreshToken) {
        localStorage.setItem('refresh_token', tokenStore.refreshToken);
      }
      if (tokenStore.tokenExpiry) {
        localStorage.setItem('token_expiry', tokenStore.tokenExpiry.toString());
      }

      // Also store in microfrontend format for compatibility
      localStorage.setItem('auth_token', essToken);
      localStorage.setItem('auth_user', JSON.stringify({
        userId: userData.id || userData.user_id,
        username: userData.email || userData.username,
        userName: userData.name || userData.user_name,
        email: userData.email,
        authCode: userData.auth_code || '',
        profile: userData.profile,
        roles: roles,
        features: permissions,
        permissions: permissions
      }));

      if (roles.length > 0) {
        localStorage.setItem('user_roles', JSON.stringify(roles));
      }
      if (permissions.length > 0) {
        localStorage.setItem('user_permissions', JSON.stringify(permissions));
      }

      // console.log('[Update-Data] ✅ Synced from ESSHost successfully');
      return true;
    } catch (error) {
      // console.error('[Update-Data] ❌ Failed to sync from ESSHost:', error);
      return false;
    }
  };

  /**
   * Send ready message to parent
   */
  const notifyParentReady = () => {
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'IFRAME_READY',
        source: 'update-data',
        timestamp: Date.now()
      }, getParentOrigin());
      // console.log('[Update-Data] Ready message sent to parent');
    }
  };


  /**
   * Handle visibility change
   * ✅ FIX: Request refresh from parent if needed
   */
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      // Check if token needs refresh when becoming visible
      const expiryTime = tokenStore.tokenExpiry || parseInt(localStorage.getItem('token_expiry'));
      const now = Date.now();

      if (expiryTime && (expiryTime - now) < envConfig.SECURITY.TOKEN_REFRESH_BUFFER) {
        // console.log('[Update-Data] Token near expiry detected on visibility change');
        // console.log('[Update-Data] Requesting refresh from parent');
        requestTokenRefreshFromParent();
      }
    }
  };

  /**
   * Listen for messages from parent
   */
  window.addEventListener('message', (event) => {
    // Validate origin for security
    if (!isValidOrigin(event.origin)) {
      // console.warn('[Update-Data] ⚠️ Invalid origin:', event.origin);
      return;
    }

    const { type, data, source } = event.data;

    // Log all messages for debugging
    // console.log('[Update-Data] 📩 Received message:', { type, source, origin: event.origin });

    // Accept messages from known sources (flexible for different parent apps)
    const validSources = ['ess-sigma', 'people', 'host', 'portal', 'mango'];
    if (source && !validSources.includes(source)) {
      // console.log('[Update-Data] Ignoring message from unknown source:', source);
      return;
    }

    // console.log('[Update-Data] ✅ Processing message:', type);

    switch (type) {
      case 'AUTH_TOKEN':
      case 'TOKEN_REFRESH':
        // ✅ FIX: Parent sends refreshed token or new token
        // This handles both initial token and refresh scenarios
        // console.log('[Update-Data] 🔄 Received token from parent (refresh or update)');

        if (data?.access_token) {
          const isTokenUpdate = !!tokenStore.accessToken; // true if we already have a token (refresh scenario)

          if (isTokenUpdate) {
            // console.log('[Update-Data] ✅ Token refresh received from parent');
          } else {
            // console.log('[Update-Data] ✅ Initial token received from parent');
          }

          // Save the new/refreshed token
          saveTokens(
            data.access_token,
            data.refresh_token || tokenStore.refreshToken,
            data.expires_in || 1800
          );

          // Update user data if provided
          if (data?.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
            // console.log('[Update-Data] ✅ User data updated');

            window.dispatchEvent(new CustomEvent('user-data-updated', {
              detail: data.user
            }));
          }

          // Update roles and permissions if provided
          if (data?.user_roles && Array.isArray(data.user_roles)) {
            localStorage.setItem('user_roles', JSON.stringify(data.user_roles));
          }

          if (data?.user_permissions && Array.isArray(data.user_permissions)) {
            localStorage.setItem('user_permissions', JSON.stringify(data.user_permissions));
          }

          // Update global auth state
          setAuthReady(
            data.access_token,
            data?.user || JSON.parse(localStorage.getItem('user') || 'null'),
            data?.user_roles || JSON.parse(localStorage.getItem('user_roles') || 'null'),
            data?.user_permissions || JSON.parse(localStorage.getItem('user_permissions') || 'null')
          );

          // console.log('[Update-Data] 🔐 Token update complete');
        } else {
          // console.error('[Update-Data] ❌ No access_token in message', data);
        }
        break;

      case 'LOGOUT':
        // Parent initiated logout
        // console.log('[Update-Data] 🚪 Parent initiated logout');

        // Clear all tokens and auth data locally
        clearTokens();

        // Notify parent that logout is complete
        if (window.parent !== window) {
          window.parent.postMessage({
            type: 'LOGOUT_COMPLETE',
            source: 'update-data',
            timestamp: Date.now(),
            data: {
              message: 'Logout completed successfully'
            }
          }, getParentOrigin());
        }

        // console.log('[Update-Data] ✅ Logout completed, all tokens cleared');
        break;

      case 'HOST_READY':
        // Parent is ready, we can request token if needed
        // console.log('[Update-Data] ✅ Parent is ready');
        if (!getAccessToken()) {
          // console.log('[Update-Data] 🔑 No token found, requesting from parent');
          requestTokenFromParent();
        }
        break;

      case 'PARENT_VISIBLE':
        // Parent became visible, check token status
        // console.log('[Update-Data] 👁️ Parent became visible');
        handleVisibilityChange();
        break;

      default:
        // Unknown message type
        // console.log('[Update-Data] ❓ Unknown message type:', type);
        break;
    }
  });

  // Listen for visibility changes
  document.addEventListener('visibilitychange', handleVisibilityChange);

  /**
   * Clear all tokens
   */
  const clearTokens = () => {
    tokenStore.accessToken = null;
    tokenStore.refreshToken = null;
    tokenStore.tokenExpiry = null;

    if (tokenStore.refreshTimer) {
      clearTimeout(tokenStore.refreshTimer);
      tokenStore.refreshTimer = null;
    }

    // Reset global auth state
    resetAuthState();

    // Clear all auth-related localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('user');
    localStorage.removeItem('user_roles');
    localStorage.removeItem('user_permissions');
    
    // Also clear microfrontend format
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('user_roles');
    localStorage.removeItem('user_permissions');

    // console.log('[Update-Data] All tokens and auth data cleared');
  };

  /**
   * Initialize: Try to load from storage first, then request from parent
   */
  const initialize = () => {
    // console.log('[Update-Data] 🚀 Initializing iframe token handler...');

    // Try to sync from ESSHost first
    syncFromESSHost();

    // Don't notify parent immediately - let the actual page content handle it

    const storedToken = localStorage.getItem('access_token');
    const storedExpiry = localStorage.getItem('token_expiry');

    /*
    console.log('[Update-Data] 📦 Token check on init:', {
      hasStoredToken: !!storedToken,
      tokenLength: storedToken?.length,
      hasExpiry: !!storedExpiry
    });
    */

    if (storedToken && storedExpiry) {
      const expiryTime = parseInt(storedExpiry);
      const now = Date.now();

      // Check if token is still valid
      if (expiryTime > now) {
        tokenStore.accessToken = storedToken;
        tokenStore.refreshToken = localStorage.getItem('refresh_token');
        tokenStore.tokenExpiry = expiryTime;

        // ✅ CRITICAL FIX: Restore full auth state from localStorage
        // This allows the app to work immediately after parent reload without waiting for postMessage
        try {
          const storedUser = localStorage.getItem('user');
          const storedRoles = localStorage.getItem('user_roles');
          const storedPermissions = localStorage.getItem('user_permissions');

          const user = storedUser ? JSON.parse(storedUser) : null;
          const roles = storedRoles ? JSON.parse(storedRoles) : null;
          const permissions = storedPermissions ? JSON.parse(storedPermissions) : null;

          // Restore global auth state (same as when receiving from parent)
          setAuthReady(storedToken, user, roles, permissions);

          /*
          console.log('[Update-Data] ✅ Full auth state restored from localStorage', {
            hasToken: true,
            hasUser: !!user,
            hasRoles: !!roles,
            hasPermissions: !!permissions
          });
          */
        } catch (error) {
          // console.error('[Update-Data] ❌ Error restoring auth state from localStorage:', error);
          // Still have token, so continue
        }

        // Setup refresh for remaining time
        const remainingTime = expiryTime - now;
        const refreshBuffer = envConfig.SECURITY.TOKEN_REFRESH_BUFFER;

        if (remainingTime > refreshBuffer) {
          setupTokenRefresh((remainingTime / 1000));
        } else {
          // Token about to expire, refresh now
          refreshAccessToken();
        }

        // console.log('[Update-Data] Token loaded from storage and auth state restored');
        return;
      }
    }

    // No valid token in storage, request from parent IMMEDIATELY
    // console.log('[Update-Data] Requesting token from parent');
    requestTokenFromParent();
  };

  // Initialize on plugin load
  initialize();

  /**
   * ✅ NEW: Activity Tracking and Sync with Portal
   * Notify parent when user is active in iframe to keep session alive
   */
  const notifyParentActivity = () => {
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'IFRAME_ACTIVITY',
        source: 'update-data',
        timestamp: Date.now()
      }, getParentOrigin());
    }
  };

  // Setup activity tracking
  const ACTIVITY_EVENTS = [
    'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click',
    'keydown', 'wheel', 'focus', 'input', 'change', 'touchmove'
  ];

  let activityThrottleTimer = null;
  const ACTIVITY_THROTTLE = 2000; // Notify parent max once per 2 seconds

  const handleActivity = () => {
    // Throttle activity notifications to prevent spam
    if (activityThrottleTimer) return;

    activityThrottleTimer = setTimeout(() => {
      activityThrottleTimer = null;
    }, ACTIVITY_THROTTLE);

    // Notify parent about user activity
    notifyParentActivity();
  };

  // Setup activity listeners
  ACTIVITY_EVENTS.forEach(event => {
    document.addEventListener(event, handleActivity, { passive: true });
  });

  // console.log('[Update-Data] ✅ Activity tracking initialized - will notify parent on user activity');

  // DEBUG: Log token status every 5 seconds
  if (process.dev) {
    setInterval(() => {
      const token = localStorage.getItem('access_token');
      const expiry = localStorage.getItem('token_expiry');
      // console.log('[Update-Data Token Status]', {
      //   hasToken: !!token,
      //   tokenLength: token?.length,
      //   expiryTime: expiry ? new Date(parseInt(expiry)).toLocaleTimeString() : 'N/A',
      //   tokenStoreHasToken: !!tokenStore.accessToken
      // });
    }, 5000);
  }

  // Provide token utilities to app
  return {
    provide: {
      updateDataAuth: {
        getAccessToken,
        refreshAccessToken,
        requestTokenFromParent,
        clearTokens
      }
    }
  };
});
