/**
 * Global Auth State Composable
 * Provides centralized auth state management to prevent race conditions
 *
 * Usage:
 * const { authReady, waitForAuth } = useAuthState();
 * await waitForAuth(); // Wait for token before making API calls
 */

import { ref, readonly } from 'vue';

// Global state (shared across all components)
const authReady = ref(false);
const authToken = ref(null);
const authUser = ref(null);
const authRoles = ref(null);
const authPermissions = ref(null);

export const useAuthState = () => {
  /**
   * Wait for auth to be ready
   * @param {number} timeout - Max wait time in milliseconds (default: 5000ms)
   * @returns {Promise<boolean>} - Resolves true when auth ready, false on timeout
   */
  const waitForAuth = async (timeout = 5000) => {
    // If already ready, return immediately
    if (authReady.value) {
      // console.log('[useAuthState] ✅ Auth already ready');
      return true;
    }

    // If running in iframe, wait for parent to send token
    if (typeof window !== 'undefined' && window.parent !== window) {
      // console.log('[useAuthState] ⏳ Waiting for auth from parent (max:', timeout, 'ms)...');

      return new Promise((resolve) => {
        const startTime = Date.now();

        // Check every 100ms
        const checkInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;

          if (authReady.value) {
            clearInterval(checkInterval);
            // console.log('[useAuthState] ✅ Auth ready after', elapsed, 'ms');
            resolve(true);
          } else if (elapsed >= timeout) {
            clearInterval(checkInterval);
            // console.warn('[useAuthState] ⏰ Auth timeout after', elapsed, 'ms');
            // Don't fail completely - allow component to try anyway
            resolve(false);
          }
        }, 100);
      });
    }

    // Not in iframe, check if token exists in localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token && token !== 'null') {
        // console.log('[useAuthState] ✅ Token found in localStorage (standalone mode)');
        authReady.value = true;
        authToken.value = token;
        return true;
      }
    }

    // console.warn('[useAuthState] ⚠️ No auth available');
    return false;
  };

  /**
   * Set auth ready state (called by iframe-token-handler)
   */
  const setAuthReady = (token, user, roles, permissions) => {
    authReady.value = true;
    authToken.value = token;
    authUser.value = user;
    authRoles.value = roles;
    authPermissions.value = permissions;

    // console.log('[useAuthState] 🔐 Auth state updated:', {
    //   hasToken: !!token,
    //   hasUser: !!user,
    //   rolesCount: roles?.length || 0,
    //   permissionsCount: permissions?.length || 0
    // });
  };

  /**
   * Reset auth state (on logout)
   */
  const resetAuthState = () => {
    authReady.value = false;
    authToken.value = null;
    authUser.value = null;
    authRoles.value = null;
    authPermissions.value = null;

    // console.log('[useAuthState] 🔓 Auth state reset');
  };

  /**
   * Check if auth is ready (synchronous)
   */
  const isAuthReady = () => {
    return authReady.value;
  };

  return {
    // State (read-only)
    authReady: readonly(authReady),
    authToken: readonly(authToken),
    authUser: readonly(authUser),
    authRoles: readonly(authRoles),
    authPermissions: readonly(authPermissions),

    // Methods
    waitForAuth,
    setAuthReady,
    resetAuthState,
    isAuthReady
  };
};
