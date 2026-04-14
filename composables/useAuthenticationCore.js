/**
 * Authentication Core System (Orchestrator)
 * Refactored modular architecture for better maintainability.
 * 
 * @version 3.0.0
 * @author ESS Sigma Team
 */

import { ref, watch, onMounted } from 'vue';
import { navigateTo } from '#app';
import { useToast } from '~/composables/useToast';
import { logger } from '~/utils/logger';
import UserStorage from '~/utils/userStorage';

// Import Modular Hooks
import { AUTH_CONFIG } from './auth/authConfig';
import { useAuthState } from './auth/useAuthState';
import { useTokenService } from './auth/useTokenService';
import { useSessionMonitor } from './auth/useSessionMonitor';
import { useLastChanceMonitor } from './auth/useLastChanceMonitor';
import { useUserProfile } from './auth/useUserProfile';

// Global single instance
let authInstance = null;

export const useAuthenticationCore = () => {
  if (authInstance) return authInstance;

  // 1. Initialize State
  const state = useAuthState();
  const { user, isAuthenticated, isLoading, isAccountLocked, lockoutEndTime, lockedEmail, formattedRemainingTime } = state;

  // 2. Toast Notifications
  const { success, error: showError, sessionExpired } = useToast();

  // 3. Define Core Actions (Logout/ForceLogout)
  let isLoggingOut = false;

  const logout = async (reason = 'User logged out') => {
    if (process.server || isLoggingOut) return;
    isLoggingOut = true;

    try {
      const loggedOutUserId = user.value?.id;
      const isInIframe = window.parent !== window;

      // Clear state
      user.value = null;
      isAuthenticated.value = false;
      
      // Clear storage
      localStorage.removeItem('user');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_expiry');
      localStorage.removeItem('user_roles');
      localStorage.removeItem('user_permissions');
      localStorage.removeItem('user_profile');
      sessionStorage.clear();

      logger.authEvent('LOGOUT', { userId: loggedOutUserId, reason, isInIframe });

      if (reason.includes('Session expired') || reason.includes('inactivity')) {
        sessionExpired(reason);
      } else {
        success('Logout successful');
      }

      window.dispatchEvent(new CustomEvent('user-logout'));

      if (isInIframe) {
        handleIframeLogout(reason);
      } else {
        await navigateTo('/login');
      }
    } catch (error) {
      logger.authError('LOGOUT_ERROR', error);
    } finally {
      setTimeout(() => { isLoggingOut = false; }, 1000);
    }
  };

  const handleIframeLogout = (reason) => {
    const parentOrigin = document.referrer ? new URL(document.referrer).origin : '*';
    
    window.parent.postMessage({
      type: 'LOGOUT_REQUEST',
      source: 'update-data',
      timestamp: new Date().toISOString(),
      data: { reason }
    }, parentOrigin);

    setTimeout(() => {
      window.parent.postMessage({
        type: 'UPDATE_DATA_LOGOUT_COMPLETE',
        source: 'update-data',
        timestamp: new Date().toISOString()
      }, parentOrigin);
    }, 300);
  };

  const forceLogout = async (reason = 'Session expired') => {
    await logout(reason);
  };

  // 4. Initialize Services with injected dependencies
  const tokenService = useTokenService(user, forceLogout);
  
  const sessionMonitor = useSessionMonitor(isAuthenticated, forceLogout, {
    onWarning: () => {
      // Logic for showing modal is handled by components watching isSessionWarningShown
      // but we need to export the state from sessionMonitor
    }
  });

  const { lastActivityTime, isSessionWarningShown, sessionCountdownTime, hideWarning } = sessionMonitor;
  
  const lastChanceMonitor = useLastChanceMonitor(
    isAuthenticated, 
    lastActivityTime, 
    tokenService.refreshAccessToken
  );

  const profileService = useUserProfile(user, isLoading);

  // 5. Auth Functions
  const initializeUserData = async () => {
    try {
      const profile = await profileService.fetchUserProfile();
      if (profile) {
        return { success: true, userDetail: profile, permissions: profile.mappedPermissions };
      }
      return { success: false, errors: ['Failed to fetch profile'] };
    } catch (error) {
      return { success: false, errors: [error.message] };
    }
  };

  const login = async (email, password) => {
    if (process.server) return { success: false };

    if (isAccountLocked.value && lockedEmail.value === email) {
      return { success: false, message: `Account locked. Wait ${formattedRemainingTime.value}`, locked: true };
    }

    isLoading.value = true;
    try {
      const { performLoginRequest } = await import('~/pages/login/api/authApi');
      const response = await performLoginRequest(email, password);

      if (response.status && response.data && response.token) {
        // Set user data from login response
        user.value = response.data;
        isAuthenticated.value = true;

        // Save to storage for persistence
        UserStorage.saveUser(response.data);
        localStorage.setItem('access_token', response.token.access_token);
        localStorage.setItem('refresh_token', response.token.refresh_token);
        
        // ✅ Save roles from login response if available
        if (response.data?.roles && Array.isArray(response.data.roles)) {
          localStorage.setItem('user_roles', JSON.stringify(response.data.roles));
          window.dispatchEvent(new CustomEvent('user-roles-saved'));
        }

        // Reset account lockout state
        state.failedLoginAttempts.value = 0;
        state.lockoutEndTime.value = null;
        state.lockedEmail.value = '';

        // Dispatch login event BEFORE profile initialization
        window.dispatchEvent(new CustomEvent('user-login', { detail: { user: response.data } }));

        // Fetch complete profile data and merge with user
        const profileResult = await initializeUserData();
        if (!profileResult.success) {
          logger.authEvent('LOGIN_SUCCESS_PROFILE_INIT_FAILED', {
            email,
            errors: profileResult.errors
          });
          if (process.dev) {
            console.warn('[Auth] Profile initialization failed but login succeeded:', profileResult.errors);
          }
        }
        
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Login failed' };
      }
    } catch (error) {
      logger.authError('LOGIN_FAILED', error);
      if (process.dev) {
        console.error('[Auth] Login error:', error);
      }
      return { success: false, message: error.message || 'An error occurred' };
    } finally {
      isLoading.value = false;
    }
  };

  const checkAuth = async () => {
    if (process.server) return;
    const storedUser = UserStorage.getUser();
    const accessToken = localStorage.getItem('access_token');

    if (storedUser && accessToken) {
      const status = tokenService.getTokenStatus(accessToken);
      if (status === 'VALID' || status === 'NEEDS_REFRESH') {
        user.value = storedUser;
        isAuthenticated.value = true;
        if (status === 'NEEDS_REFRESH') await tokenService.refreshAccessToken();
        
        // ✅ Restore profile from localStorage if available (backup from last successful fetch)
        const savedProfile = localStorage.getItem('user_profile');
        if (savedProfile) {
          try {
            const parsedProfile = JSON.parse(savedProfile);
            user.value = { ...user.value, ...parsedProfile };
          } catch (error) {
            // ignore parse errors
          }
        }

        // ✅ Fetch fresh profile in background (non-blocking, doesn't wait)
        // This updates the profile with latest data from API without delaying page load
        if (process.client) {
          initializeUserData().catch(() => {
            // Silent fail - cached profile already loaded above
          });
        }
      } else {
        await forceLogout('Session expired');
      }
    }
  };

  // 6. Build final instance
  authInstance = {
    // State
    user,
    isAuthenticated,
    isLoading,
    isSessionWarningVisible: isSessionWarningShown, // Maintain backward compatibility
    sessionCountdownTime,
    isAccountLocked,
    formattedRemainingTime,
    
    // Actions
    login,
    logout,
    forceLogout,
    checkAuth,
    extendSession: async () => {
      const result = await tokenService.refreshAccessToken();
      if (result) hideWarning();
      return !!result;
    },
    refreshAccessToken: tokenService.refreshAccessToken,
    fetchUserProfile: profileService.fetchUserProfile,
    initializeUserData
  };

  return authInstance;
};