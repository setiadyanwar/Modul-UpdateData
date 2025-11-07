export default defineNuxtRouteMiddleware((to) => {
  // If visiting root or root with ticket, redirect to appropriate route
  if (to.path === '/') {
    const query = { ...to.query };

    // ✅ CRITICAL: Check for last_visited_route in localStorage
    // This allows restoring the user's last location after parent reload
    let targetPath = '/update-data'; // default for fresh login

    if (process.client) {
      const lastVisitedRoute = localStorage.getItem('last_visited_route');

      // If there's a last visited route AND we have a ticket (reload scenario)
      if (lastVisitedRoute && to.query.ticket) {
        targetPath = lastVisitedRoute;
        console.log('[Root Redirect] 🔄 Reload detected - redirecting to last visited route:', targetPath);
      } else if (lastVisitedRoute) {
        // If there's a last visited route but NO ticket (direct visit to root)
        targetPath = lastVisitedRoute;
        console.log('[Root Redirect] 📍 Restoring last visited route:', targetPath);
      } else {
        console.log('[Root Redirect] 🆕 Fresh login - redirecting to default:', targetPath);
      }
    }

    // Preserve ticket if present
    return navigateTo({ path: targetPath, query }, { redirectCode: 302 });
  }
});


