/**
 * Iframe Ready Plugin
 * Sends IFRAME_READY signal to parent window after app is fully loaded
 * This prevents timeout errors in ESSHost
 */

export default defineNuxtPlugin(() => {
  if (!process.client) return;
  
  let isIframe = false;
  
  try {
    isIframe = window.self !== window.top;
  } catch (e) {
    isIframe = true;
  }
  
  if (!isIframe) {
    console.log('[Iframe Ready] Not running in iframe, skipping');
    return;
  }
  
  console.log('[Iframe Ready] 🔄 Plugin initialized, will send ready signal');
  
  /**
   * Send ready signal to parent
   */
  const sendReadySignal = () => {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'IFRAME_READY',
          source: 'update-data',
          appName: 'Update Data',
          timestamp: Date.now()
        }, '*');
        
        console.log('[Iframe Ready] ✅ Sent IFRAME_READY to parent');
      }
    } catch (error) {
      console.error('[Iframe Ready] ❌ Failed to send ready signal:', error);
    }
  };
  
  // Send ready signal after app is mounted
  onMounted(() => {
    console.log('[Iframe Ready] 📍 App mounted, sending ready signal...');
    
    // Send immediately
    sendReadySignal();
    
    // Also send after a short delay to ensure parent is listening
    setTimeout(sendReadySignal, 500);
    setTimeout(sendReadySignal, 1000);
  });
  
  // Also send on DOMContentLoaded as fallback
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('[Iframe Ready] DOM loaded, sending ready signal...');
      setTimeout(sendReadySignal, 100);
    });
  } else {
    // DOM already loaded
    setTimeout(sendReadySignal, 100);
  }
});

