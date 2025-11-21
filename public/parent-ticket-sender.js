// public/parent-ticket-sender.js
// Script untuk ESSPortal (parent window) yang mengirim ticket ke iframe Update-Data
//
// CARA PENGGUNAAN DI ESSPORTAL:
// 1. Copy file ini ke folder public/static ESSPortal
// 2. Include di index.html: <script src="/parent-ticket-sender.js"></script>
// 3. Atau include di nuxt.config dengan: head.script: [{ src: '/parent-ticket-sender.js' }]
//
// CATATAN: File ini HARUS ada di ESS Portal (parent), BUKAN di Update-Data (iframe)

(function() {
  'use strict';

  console.log('[Parent Ticket Sender - Update-Data] Initialized');

  // Get ticket from URL
  function getTicket() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('ticket');
  }

  // Find Update-Data iframe
  function findUpdateDataIframe() {
    const iframes = document.querySelectorAll('iframe');
    for (let iframe of iframes) {
      try {
        const src = iframe.src || '';
        // Check if iframe is Update-Data (adjust the condition as needed)
        // Bisa cek berdasarkan URL, id, class, atau name
        if (src.includes('update-data') ||
            src.includes(':3001') ||
            iframe.id === 'update-data-iframe' ||
            iframe.name === 'update-data') {
          return iframe;
        }
      } catch (e) {
        continue;
      }
    }
    return null;
  }

  // Send ticket to iframe
  function sendTicketToIframe() {
    console.log('[Parent Ticket Sender] sendTicketToIframe() called');

    const ticket = getTicket();
    console.log('[Parent Ticket Sender] Ticket from URL:', ticket ? ticket.substring(0, 20) + '...' : 'NONE');

    if (!ticket) {
      console.log('[Parent Ticket Sender] ❌ No ticket found in parent URL');
      console.log('[Parent Ticket Sender] Current URL:', window.location.href);
      return;
    }

    console.log('[Parent Ticket Sender] ✅ Ticket found:', ticket.substring(0, 20) + '...');

    const iframe = findUpdateDataIframe();
    console.log('[Parent Ticket Sender] Iframe found:', !!iframe);

    if (!iframe) {
      console.log('[Parent Ticket Sender] ❌ Update-Data iframe not found');
      console.log('[Parent Ticket Sender] Available iframes:', document.querySelectorAll('iframe').length);
      return;
    }

    if (!iframe.contentWindow) {
      console.log('[Parent Ticket Sender] ❌ Iframe contentWindow not ready');
      return;
    }

    console.log('[Parent Ticket Sender] ✅ Sending ticket to iframe...');
    console.log('[Parent Ticket Sender] Message:', {
      type: 'TICKET_AUTH',
      ticket: ticket.substring(0, 20) + '...',
      source: 'ess-portal'
    });

    // Send ticket dengan target origin spesifik untuk security
    // Get iframe URL origin for secure postMessage
    let targetOrigin = '*';
    try {
      const iframeSrc = iframe.src;
      if (iframeSrc) {
        const url = new URL(iframeSrc);
        targetOrigin = url.origin;
        console.log('[Parent Ticket Sender] Using iframe origin:', targetOrigin);
      }
    } catch (e) {
      console.warn('[Parent Ticket Sender] Could not determine iframe origin, using wildcard');
    }

    iframe.contentWindow.postMessage({
      type: 'TICKET_AUTH',
      ticket: ticket,
      source: 'ess-portal'
    }, targetOrigin);

    console.log('[Parent Ticket Sender] ✅ Ticket sent!');
  }

  // Listen for messages from iframe (REQUEST_TICKET)
  window.addEventListener('message', function(event) {
    console.log('[Parent Ticket Sender] Received message:', event.data?.type, 'from:', event.origin);
    console.log('[Parent Ticket Sender] Full message data:', event.data);

    if (event.data && event.data.type === 'REQUEST_TICKET' && event.data.source === 'update-data') {
      console.log('[Parent Ticket Sender] ✅ Ticket requested by Update-Data iframe');
      sendTicketToIframe();
    }

    // Listen for auth failure from Update-Data
    if (event.data && event.data.type === 'AUTH_FAILED' && event.data.source === 'update-data') {
      console.error('[Parent Ticket Sender] ❌ Auth failed in Update-Data:', event.data.error);
      // TODO: Handle auth failure (redirect, show error, etc)
    }
  });

  // Send ticket when iframe loads
  window.addEventListener('load', function() {
    console.log('[Parent Ticket Sender] Page loaded, waiting for iframe...');

    // Wait a bit for iframe to be ready, then try multiple times
    setTimeout(sendTicketToIframe, 1000);
    setTimeout(sendTicketToIframe, 2000);
    setTimeout(sendTicketToIframe, 3000);
  });

  // Try to send immediately in case page is already loaded
  if (document.readyState === 'complete') {
    setTimeout(sendTicketToIframe, 500);
  }
})();

