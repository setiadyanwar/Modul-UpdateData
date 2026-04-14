/**
 * Auth Initialization Plugin
 * 
 * Purpose: Initialize authentication state on app startup
 * - On normal page reload (non-ticket): restore auth from localStorage
 * - On ticket login (via ticket-handler): skip (ticket-handler handles it)
 * 
 * This ensures user data is always restored regardless of how the page is loaded
 */

export default defineNuxtPlugin(async (nuxtApp) => {
  // Only run on client side
  if (process.server) return;

  // Get auth from composables
  const { useAuthenticationCore } = await import('~/composables/useAuthenticationCore');
  const auth = useAuthenticationCore();

  // Only initialize if we're not in ticket login flow
  // (ticket-handler will have already called checkAuth and set auth ready)
  if (process.client) {
    const ticketProcessing = sessionStorage.getItem('ticket_processing');
    const ticketLoginFailed = sessionStorage.getItem('ticket_login_failed');
    
    // If ticket login is in progress or failed, skip (ticket-handler manages this)
    if (ticketProcessing === 'true' || ticketLoginFailed === 'true') {
      return;
    }

    // Check if auth state already initialized (e.g., from ticket-handler)
    const hasValidToken = localStorage.getItem('access_token');
    
    if (hasValidToken) {
      // Call checkAuth to restore user data from localStorage
      // This handles:
      // 1. Normal page reload - restore from token storage + user_profile backup
      // 2. Refresh session - validate token and refresh if needed
      // 3. Background profile fetch - trigger fresh data fetch
      
      try {
        await auth.checkAuth();
      } catch (error) {
        // Continue anyway - middleware will handle auth validation
      }
    }
  }
});
