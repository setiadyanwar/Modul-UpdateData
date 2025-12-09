export default defineNuxtRouteMiddleware((to) => {
  // If visiting root or root with ticket, redirect to appropriate route
  if (to.path === '/') {
    const query = { ...to.query };

    // ✅ CRITICAL: Don't redirect if login failed or ticket is being processed
    if (process.client) {
      // Check if login failed FIRST - highest priority
      const loginFailed = sessionStorage.getItem('ticket_login_failed');
      if (loginFailed === 'true') {
        console.log('[Root Redirect] ⚠️ Login failed detected - blocking ALL redirects');
        // Don't redirect - ESSHost will handle redirect via postMessage
        return;
      }

      // Check if ticket is being processed - don't redirect yet
      const ticketProcessing = sessionStorage.getItem('ticket_processing');
      if (ticketProcessing === 'true') {
        console.log('[Root Redirect] ⏳ Ticket processing - waiting for result');
        // Don't redirect - wait for ticket handler to finish
        return;
      }

      // ✅ CRITICAL: If in iframe with ticket, NEVER redirect - always let ticket handler process first
      // This prevents /update-data from opening before we know if login will succeed
      if (to.query.ticket && window.parent !== window) {
        console.log('[Root Redirect] 📦 Ticket in iframe - NEVER redirect, let ticket handler process first');
        // Don't redirect - ticket handler will handle redirect after successful login
        // If login fails, ESSHost will handle redirect via postMessage
        return;
      }
    }

    // ✅ CRITICAL: Check for last_visited_route in localStorage
    // This allows restoring the user's last location after parent reload
    let targetPath = '/update-data'; // default for fresh login

    if (process.client) {
      let lastVisitedRoute = localStorage.getItem('last_visited_route');

      // ✅ FIX: Validate lastVisitedRoute to prevent malformed URLs
      if (lastVisitedRoute && (lastVisitedRoute.includes('http://') || lastVisitedRoute.includes('https://'))) {
        // console.warn('[Root Redirect] ⚠️ Malformed route detected in localStorage:', lastVisitedRoute);
        // console.warn('[Root Redirect] 🔧 Resetting to default route: /update-data');
        lastVisitedRoute = null; // Treat as invalid
        // Clear malformed value from localStorage
        localStorage.removeItem('last_visited_route');
        localStorage.setItem('last_visited_route', '/update-data');
      }

      // If there's a last visited route AND we have a ticket (reload scenario)
      if (lastVisitedRoute && to.query.ticket) {
        targetPath = lastVisitedRoute;
        // console.log('[Root Redirect] 🔄 Reload detected - redirecting to last visited route:', targetPath);
      } else if (lastVisitedRoute) {
        // If there's a last visited route but NO ticket (direct visit to root)
        targetPath = lastVisitedRoute;
        // console.log('[Root Redirect] 📍 Restoring last visited route:', targetPath);
      } else {
        // console.log('[Root Redirect] 🆕 Fresh login - redirecting to default:', targetPath);
      }
    }

    // Preserve ticket if present
    return navigateTo({ path: targetPath, query }, { redirectCode: 302 });
  }
});


