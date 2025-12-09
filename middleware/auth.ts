// middleware/auth.ts
// Update-Data Remote App - Auth Middleware
export default defineNuxtRouteMiddleware((to, from) => {
  // ✅ CRITICAL: Block ALL navigation if ticket login failed
  // This must be checked FIRST before any other auth logic
  if (process.client) {
    const loginFailed = sessionStorage.getItem('ticket_login_failed');
    if (loginFailed === 'true') {
      console.log('[Auth Middleware] ⚠️ Login failed - blocking ALL navigation to:', to.path);
      
      // If in iframe, block ALL navigation - ESSHost will handle redirect via postMessage
      if (window.parent !== window) {
        // Don't navigate anywhere - postMessage already sent, ESSHost will redirect
        return;
      }
      
      // If standalone mode, clear flag and redirect to login
      sessionStorage.removeItem('ticket_login_failed');
      return navigateTo('/login', { replace: true });
    }
  }

  // Skip middleware untuk route yang tidak perlu auth
  const publicRoutes = ["/", "/error"];
  const isPublicRoute = publicRoutes.includes(to.path) ||
                       to.path.startsWith("/api/");

  // Cek token hanya di client side
  if (process.client) {
    const token = localStorage.getItem("access_token");

    // For remote app, we only need access_token (no user data required)
    // Token will be provided by parent (ESS-Sigma) via postMessage
    let isValidSession = token && token !== 'null';

    // If we have a token, check if it's expired
    if (isValidSession && token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000;
        const currentTime = Date.now();

        // Token is expired if current time is past expiration
        if (currentTime >= expirationTime) {
          isValidSession = false;
        }
      } catch (error) {
        isValidSession = false;
      }
    }

    if (isPublicRoute) {
      return;
    }

    // If no valid session, wait for token from parent
    if (!isValidSession) {
      // Request token from parent (iframe-token-handler will handle this)
      if (window.parent !== window && window.$nuxt?.$updateDataAuth) {
        window.$nuxt.$updateDataAuth.requestTokenFromParent();
      }

      // Allow navigation, token handler will manage authentication
      // Don't redirect to login in remote app
      return;
    }
  }
});
