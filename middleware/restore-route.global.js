/**
 * Restore Last Visited Route Middleware
 * Restores the last visited route from localStorage on page reload
 * Only works if current route is default (/update-data) and we have a saved route
 * 
 * Rules:
 * - Only restore on RELOAD, not on intentional navigation
 * - Don't restore on first visit (must go to /update-data)
 * - Don't restore if user intentionally navigated to /update-data
 */
export default defineNuxtRouteMiddleware((to, from) => {
  // Only run on client side
  if (process.server) return;

  // Only restore if:
  // 1. Current route is default (/update-data)
  // 2. No query params (to avoid interfering with ticket exchange)
  // 3. We have a last_visited_route saved
  if (to.path === '/update-data' && 
      !to.query.ticket && 
      Object.keys(to.query).length === 0) {
    
    const lastVisitedRoute = localStorage.getItem('last_visited_route');
    
    // ✅ RULE 1: Don't restore if user intentionally navigated to /update-data
    // If 'from' exists and is a valid route, user clicked/navigated intentionally
    if (from && from.path && from.path !== '/update-data' && from.path !== '/') {
      console.log('[Restore Route Middleware] ⏭️ User intentionally navigated to /update-data from:', from.path);
      console.log('[Restore Route Middleware] Skipping restore - allowing navigation');
      return; // Allow navigation, don't restore
    }
    
    // ✅ RULE 2: Don't restore on first visit (no session flag)
    // Check if user has visited the app in this session
    // Also check if there's a valid token (if no token, it's first visit after logout)
    const hasVisitedInSession = sessionStorage.getItem('app_visited');
    const hasToken = localStorage.getItem('access_token');
    
    // First visit if:
    // 1. No session flag AND no token (fresh login/logout)
    // 2. OR no session flag (first time in this session)
    if (!hasVisitedInSession || !hasToken) {
      console.log('[Restore Route Middleware] 🆕 First visit detected:', {
        hasSessionFlag: !!hasVisitedInSession,
        hasToken: !!hasToken
      });
      console.log('[Restore Route Middleware] Setting session flag and staying at /update-data');
      // Mark that user has visited
      if (hasToken) {
        sessionStorage.setItem('app_visited', 'true');
      }
      return; // Stay at /update-data on first visit
    }
    
    // ✅ RULE 3: Only restore if we have a valid last_visited_route
    // AND this is likely a reload (no 'from' or 'from' is same as 'to')
    if (lastVisitedRoute && 
        lastVisitedRoute !== '/update-data' &&
        lastVisitedRoute !== '/' &&
        !lastVisitedRoute.includes('/ticket-loading')) {
      
      // This is likely a reload (no from or from is same)
      const isReload = !from || !from.path || from.path === to.path;
      
      if (isReload) {
        console.log('[Restore Route Middleware] 🔄 Detected reload - restoring last visited route:', lastVisitedRoute);
        console.log('[Restore Route Middleware] Current path:', to.path);
        console.log('[Restore Route Middleware] From path:', from?.path || 'NONE (reload)');
        
        // Redirect to last visited route
        return navigateTo(lastVisitedRoute, { replace: true });
      } else {
        console.log('[Restore Route Middleware] ⏭️ Navigation detected, not restoring');
      }
    }
  }
  
  // ✅ Mark that user has visited (for future reloads)
  if (to.path.startsWith('/update-data')) {
    sessionStorage.setItem('app_visited', 'true');
  }
});

