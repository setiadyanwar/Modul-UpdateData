/**
 * Ticket Handler Plugin for Update-Data
 * Handles SSO ticket exchange before any page renders
 * Based on Mango's ticket-handler mechanism
 */
export default defineNuxtPlugin((nuxtApp) => {
  if (process.server) return;

  console.log('=== [Update-Data Ticket Handler] Initializing ===');
  console.log('[Ticket Handler] Current URL:', window.location.href);
  console.log('[Ticket Handler] Is iframe?', window.parent !== window);

  const route = useRoute();
  const router = useRouter();

  /**
   * Process ticket exchange
   */
  const processTicket = async (ticket) => {
    console.log('[Ticket Handler] Processing ticket:', ticket.substring(0, 20) + '...');

    try {
      // Step 1: Exchange ticket for token via ESSHost proxy
      console.log('[Ticket Handler] Step 1: Requesting ticket exchange from parent...');

      const tokenData = await requestTicketExchangeFromParent(ticket);

      if (!tokenData || !tokenData.access_token) {
        throw new Error('Failed to exchange ticket');
      }

      console.log('[Ticket Handler] Token received:', tokenData.access_token.substring(0, 30) + '...');

      // Step 2: Store token
      const accessToken = tokenData.access_token;
      const refreshToken = tokenData.refresh_token;
      const expiresIn = tokenData.expires_in || 1800;

      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('token_expiry', (Date.now() + (expiresIn * 1000)).toString());

      console.log('[Ticket Handler] Token saved to localStorage');

      // Step 3: Store user data
      if (tokenData.user) {
        localStorage.setItem('user', JSON.stringify(tokenData.user));
        console.log('[Ticket Handler] User data saved');
      }

      // Step 4: Store roles and permissions
      if (tokenData.user_roles) {
        localStorage.setItem('user_roles', JSON.stringify(tokenData.user_roles));
        console.log('[Ticket Handler] User roles saved');
      }

      if (tokenData.user_permissions) {
        localStorage.setItem('user_permissions', JSON.stringify(tokenData.user_permissions));
        console.log('[Ticket Handler] User permissions saved');
      }

      // Step 5: Redirect to main app
      console.log('[Ticket Handler] All data saved, redirecting to /update-data...');
      setTimeout(() => {
        router.push('/update-data');
      }, 500);

    } catch (error) {
      console.error('[Ticket Handler] Error:', error);

      // Redirect to error page or back to parent
      setTimeout(() => {
        if (window.parent !== window) {
          window.parent.postMessage({
            type: 'AUTH_FAILED',
            source: 'update-data',
            error: error.message
          }, '*');
        }
      }, 2000);
    }
  };

  /**
   * Request ticket exchange from parent via postMessage
   */
  const requestTicketExchangeFromParent = (ticket) => {
    return new Promise((resolve, reject) => {
      const messageId = `exchange_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      let timeout;

      const handleMessage = (event) => {
        if (event.data?.type === 'TICKET_EXCHANGE_RESPONSE' && event.data?.messageId === messageId) {
          clearTimeout(timeout);
          window.removeEventListener('message', handleMessage);

          if (event.data.success) {
            console.log('[Ticket Handler] Ticket exchange successful');
            resolve(event.data.data);
          } else {
            console.error('[Ticket Handler] Ticket exchange failed:', event.data.error);
            reject(new Error(event.data.error || 'Ticket exchange failed'));
          }
        }
      };

      window.addEventListener('message', handleMessage);

      // Send exchange request to parent
      console.log('[Ticket Handler] Sending EXCHANGE_TICKET to parent...');
      window.parent.postMessage({
        type: 'EXCHANGE_TICKET',
        ticket: ticket,
        messageId: messageId,
        source: 'update-data'
      }, '*');

      // Timeout after 10 seconds
      timeout = setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        reject(new Error('Ticket exchange timeout'));
      }, 10000);
    });
  };

  // Check for ticket in URL
  let ticket = route.query.ticket;
  console.log('[Ticket Handler] Ticket from route.query:', ticket || 'NONE');

  // Clear old tokens if ticket found
  if (ticket) {
    console.log('[Ticket Handler] 🗑️ Clearing old tokens before exchange...');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('user');
    localStorage.removeItem('user_roles');
    localStorage.removeItem('user_permissions');
    console.log('[Ticket Handler] ✅ Old tokens cleared');
  }

  // If no ticket in URL, check if in iframe
  if (!ticket && window.parent !== window) {
    console.log('[Ticket Handler] Running in IFRAME - waiting for ticket...');

    // Listen for postMessage from parent
    const messageHandler = (event) => {
      console.log('[Ticket Handler] Received postMessage:', event.data?.type);

      if (event.data?.type === 'TICKET_AUTH' && event.data.ticket) {
        console.log('[Ticket Handler] ✅ Received ticket via postMessage');
        window.removeEventListener('message', messageHandler);

        // Redirect to loading page with ticket
        router.push(`/ticket-loading?ticket=${event.data.ticket}`);
      }
    };

    window.addEventListener('message', messageHandler);

    // Request ticket from parent
    console.log('[Ticket Handler] Requesting ticket from parent...');
    window.parent.postMessage({
      type: 'REQUEST_TICKET',
      source: 'update-data'
    }, '*');

    return;
  }

  if (ticket) {
    console.log('[Ticket Handler] ✅ Ticket detected, processing...');

    // Show loading before processing
    if (route.path !== '/ticket-loading') {
      console.log('[Ticket Handler] Redirecting to loading page...');
      router.push(`/ticket-loading?ticket=${ticket}`);
      return;
    }

    // Process ticket if on loading page
    console.log('[Ticket Handler] On loading page, starting exchange...');
    processTicket(ticket);
  } else {
    console.log('[Ticket Handler] ❌ No ticket found - normal page load');
  }

  // Provide processTicket function
  return {
    provide: {
      processTicket
    }
  };

  console.log('=== [Ticket Handler] Initialization Complete ===\n');
});
