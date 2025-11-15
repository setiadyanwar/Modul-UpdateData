/**
 * URL Sync Plugin for Update-Data App
 * Sends URL changes to parent (ESSHost) for browser URL synchronization
 *
 * This allows the parent window to keep its URL in sync with the iframe's URL
 * so that refreshing the page maintains the current state.
 */

import envConfig from '~/config/environment';

export default defineNuxtPlugin((nuxtApp) => {
  if (!process.client) return;
  
  let lastUrl = window.location.href;
  let isIframe = false;
  
  try {
    isIframe = window.self !== window.top;
  } catch (e) {
    isIframe = true; // Cross-origin iframe
  }
  
  if (!isIframe) {
    // console.log('[URL Sync] Not running in iframe, skipping URL sync');
    return;
  }
  
  // console.log('[URL Sync] 🔄 Initializing URL sync plugin for update-data app');
  
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
   * Send current URL to parent window
   */
  const sendUrlUpdate = () => {
    try {
      const currentUrl = {
        url: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        title: document.title,
        timestamp: Date.now()
      };

      // ✅ CRITICAL: Save last route to localStorage for restoration after parent reload
      // Only save app routes (not root or ticket-loading)
      // ✅ FIX: Validate pathname to prevent saving malformed URLs (e.g., /https://domain.com/)
      if (currentUrl.pathname &&
          currentUrl.pathname !== '/' &&
          !currentUrl.pathname.includes('/ticket-loading')) {

        // ✅ Validate: pathname should not contain "http://" or "https://"
        // This prevents saving malformed paths like "/https://updatedata-people-dev.telkomsigma.co.id/"
        if (!currentUrl.pathname.includes('http://') && !currentUrl.pathname.includes('https://')) {
          localStorage.setItem('last_visited_route', currentUrl.pathname);
          // console.log('[URL Sync] 💾 Saved last route to localStorage:', currentUrl.pathname);
        } else {
          // console.warn('[URL Sync] ⚠️ Invalid pathname detected (contains full URL), not saving:', currentUrl.pathname);
          // console.warn('[URL Sync] 🔧 Using default route instead: /update-data');
          // Save default route instead of malformed one
          localStorage.setItem('last_visited_route', '/update-data');
        }
      }

      if (window.parent && window.parent !== window) {
        const parentOrigin = getParentOrigin();
        window.parent.postMessage({
          type: 'IFRAME_URL_CHANGE',
          data: currentUrl,
          source: 'update-data',
          timestamp: Date.now()
        }, parentOrigin);

        // console.log('[URL Sync] 📤 Sent URL update to parent:', currentUrl.pathname);
      }
    } catch (error) {
      // console.error('[URL Sync] ❌ Failed to send URL update:', error);
    }
  };
  
  // Listen to browser back/forward button
  window.addEventListener('popstate', () => {
    // console.log('[URL Sync] 🔙 Popstate detected');
    sendUrlUpdate();
  });
  
  // Override history methods to catch programmatic navigation
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    // console.log('[URL Sync] 🔀 pushState detected');
    sendUrlUpdate();
  };
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    // console.log('[URL Sync] 🔀 replaceState detected');
    sendUrlUpdate();
  };
  
  // Poll for URL changes (fallback for edge cases)
  setInterval(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      // console.log('[URL Sync] 🔍 URL change detected via polling');
      sendUrlUpdate();
    }
  }, 500);
  
  // Listen for parent's request for initial URL
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'PARENT_URL_REQUEST') {
      // console.log('[URL Sync] 📥 Parent requested initial URL');
      sendUrlUpdate();
    }
  });
  
  // Send initial URL after app is fully loaded
  setTimeout(() => {
    // console.log('[URL Sync] 📍 Sending initial URL');
    sendUrlUpdate();
  }, 1000);

  // ✅ CRITICAL: Hook into Vue Router for reliable route change detection
  const router = nuxtApp.$router;
  if (router) {
    router.afterEach((to, from) => {
      // console.log('[URL Sync] 🧭 Vue Router navigation detected:', {
      //   from: from.path,
      //   to: to.path
      // });
      // Small delay to ensure URL is fully updated
      setTimeout(() => {
        sendUrlUpdate();
      }, 50);
    });
    // console.log('[URL Sync] ✅ Vue Router hook installed');
  }

  // console.log('[URL Sync] ✅ URL sync plugin initialized');
});

