/**
 * Legacy Auth Composable - Backward Compatibility Layer
 * This is a compatibility layer for existing components that still use useAuth
 * New components should use useAuthenticationCore directly
 * 
 * @deprecated Use useAuthenticationCore instead
 * @version 2.0.0 (Compatibility Layer)
 */

import { computed } from 'vue';
import { useAuthenticationCore } from './useAuthenticationCore';

export const useAuth = () => {
  // Get authentication core instance
  const authCore = useAuthenticationCore();
  
  // Return the same interface as before for backward compatibility
  return {
    // Core authentication state (same interface)
    user: authCore.user,
    isAuthenticated: authCore.isAuthenticated,
    isLoading: authCore.isLoading,
    
    // Session state (same interface)
    isSessionWarningVisible: authCore.isSessionWarningVisible,
    sessionCountdownTime: authCore.sessionCountdownTime,
    
    // Account lockout state (same interface)
    failedLoginAttempts: authCore.failedLoginAttempts,
    maxLoginAttempts: authCore.maxLoginAttempts,
    isAccountLocked: authCore.isAccountLocked,
    formattedRemainingTime: authCore.formattedRemainingTime,
    getCurrentLockedEmail: authCore.getCurrentLockedEmail,
    
    // Authentication functions (same interface)
    login: authCore.login,
    logout: authCore.logout,
    checkAuth: authCore.checkAuth,
    
    // Token management (same interface)
    refreshAccessToken: authCore.refreshAccessToken,
    getValidAccessToken: authCore.getValidAccessToken,
    
    // Session management (same interface)  
    extendSession: authCore.extendSession,
    
    // Additional properties for compatibility
    isSessionExpired: computed(() => false), // Legacy - now handled by core
    isSessionWarningShown: authCore.isSessionWarningVisible, // Legacy alias
    
    // Utility functions
    validateToken: () => {}, // Legacy - now handled automatically by core
    resetInactivityTimer: authCore.resetActivityTimer, // Legacy alias
  };
};