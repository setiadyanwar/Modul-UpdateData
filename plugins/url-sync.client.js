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
    console.log('[URL Sync] Not running in iframe, skipping URL sync');
    return;
  }
  
  console.log('[URL Sync] 🔄 Initializing URL sync plugin for update-data app');
  
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
    return envConfig.REMOTE_APP.HOST_ORIGIN;
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
      // Don't overwrite if current route is default and we have a different last_visited_route
      if (currentUrl.pathname &&
          currentUrl.pathname !== '/' &&
          !currentUrl.pathname.includes('/ticket-loading')) {
        const existingLastRoute = localStorage.getItem('last_visited_route');
        
        // Don't overwrite last_visited_route if:
        // - Current route is default (/update-data)
        // - We have a different last_visited_route saved
        // - Last route is a valid app route
        if (currentUrl.pathname === '/update-data' && 
            existingLastRoute && 
            existingLastRoute !== '/update-data' &&
            existingLastRoute !== '/' &&
            !existingLastRoute.includes('/ticket-loading')) {
          console.log('[URL Sync] ⏭️ Skipping save - keeping existing last route:', existingLastRoute);
        } else {
          localStorage.setItem('last_visited_route', currentUrl.pathname);
          console.log('[URL Sync] 💾 Saved last route to localStorage:', currentUrl.pathname);
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

        console.log('[URL Sync] 📤 Sent URL update to parent:', currentUrl.pathname);
      }
    } catch (error) {
      console.error('[URL Sync] ❌ Failed to send URL update:', error);
    }
  };
  
  // Listen to browser back/forward button
  window.addEventListener('popstate', () => {
    console.log('[URL Sync] 🔙 Popstate detected');
    sendUrlUpdate();
  });
  
  // Override history methods to catch programmatic navigation
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    console.log('[URL Sync] 🔀 pushState detected');
    sendUrlUpdate();
  };
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    console.log('[URL Sync] 🔀 replaceState detected');
    sendUrlUpdate();
  };
  
  // Poll for URL changes (fallback for edge cases)
  setInterval(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      console.log('[URL Sync] 🔍 URL change detected via polling');
      sendUrlUpdate();
    }
  }, 500);
  
  // Listen for parent's request for initial URL
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'PARENT_URL_REQUEST') {
      console.log('[URL Sync] 📥 Parent requested initial URL');
      sendUrlUpdate();
    }
  });
  
  // Send initial URL after app is fully loaded
  setTimeout(() => {
    console.log('[URL Sync] 📍 Sending initial URL');
    sendUrlUpdate();
  }, 1000);
  
  console.log('[URL Sync] ✅ URL sync plugin initialized');
});

