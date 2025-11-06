/**
 * Ticket Handler Plugin for Update-Data
 * Handles SSO ticket exchange before any page renders
 * Based on Mango's ticket-handler mechanism
 */
import { nextTick } from 'vue';

export default defineNuxtPlugin((nuxtApp) => {
  if (process.server) return;

  console.log('=== [Update-Data Ticket Handler] Initializing ===');
  console.log('[Ticket Handler] Environment:', process.client ? 'CLIENT ✅' : 'SERVER');
  console.log('[Ticket Handler] Current URL:', window.location.href);
  console.log('[Ticket Handler] Is iframe?', window.parent !== window);
  console.log('[Ticket Handler] Parent origin:', document.referrer || 'NONE');

  const route = useRoute();
  const router = useRouter();

  console.log('[Ticket Handler] Route path:', route.path);
  console.log('[Ticket Handler] Route query:', route.query);
  console.log('[Ticket Handler] Route fullPath:', route.fullPath);

  /**
   * Process ticket exchange
   * Exchanges SSO ticket directly with essbe API (POST /auth/ticket/login)
   */
  const processTicket = async (ticket) => {
    console.log('[Ticket Handler] Processing ticket:', ticket.substring(0, 20) + '...');

    try {
      // Step 1: Exchange ticket for JWT token via essbe API
      console.log('[Ticket Handler] Step 1: POST /auth/ticket/login to essbe API');

      // Import API client dynamically
      const { apiPost } = await import('~/axios/api.client');

      const response = await apiPost('/auth/ticket/login', { ticket });
      console.log('[Ticket Handler] Response:', response);
      console.log('[Ticket Handler] Response.status:', response.status);
      console.log('[Ticket Handler] Response.token:', response.token);
      console.log('[Ticket Handler] Response.data:', response.data);

      // Handle response based on essbe API format:
      // { status: true, message: "...", data: {...}, token: { access_token: "...", ... } }
      if (response.status === true && response.token) {
        const accessToken = response.token.access_token;
        const refreshToken = response.token.refresh_token || '';

        console.log('[Ticket Handler] ✅ Access token received:', accessToken.substring(0, 30) + '...');

        // Step 2: Store tokens IMMEDIATELY
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);

        // Calculate token expiry (default 30 minutes)
        const expiresIn = response.token.expires_in || 1800;
        localStorage.setItem('token_expiry', (Date.now() + (expiresIn * 1000)).toString());

        console.log('[Ticket Handler] ✅ Tokens saved to localStorage');
        console.log('[Ticket Handler] Token check:', localStorage.getItem('access_token') ? 'EXISTS' : 'NOT FOUND');

        // Step 3: Store user data
        if (response.data) {
          localStorage.setItem('user', JSON.stringify(response.data));
          console.log('[Ticket Handler] ✅ User data saved:', response.data);
        } else {
          console.warn('[Ticket Handler] ⚠️ No user data in response!');
        }

        // Step 4: Try to fetch user detail, roles & permissions (like mango does)
        // This is needed because ticket login might not return full user detail
        try {
          console.log('[Ticket Handler] Step 4: Fetching user detail with token...');

          // Set Authorization header temporarily for this request
          const { apiService } = await import('~/axios/api.client');
          apiService.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

          // Try to get user detail (adjust endpoint based on essbe API)
          // Common endpoints: /user/detail, /user/profile, /auth/me, /employees/profile
          let userDetailResponse;
          try {
            // Try /employees/profile first (matches config/environment.js)
            userDetailResponse = await apiService.get('/employees/profile');
            console.log('[Ticket Handler] User detail response:', userDetailResponse.data);
          } catch (profileError) {
            console.warn('[Ticket Handler] /employee/profile failed, trying /auth/me...', profileError.message);
            try {
              userDetailResponse = await apiService.get('/auth/me');
              console.log('[Ticket Handler] Auth/me response:', userDetailResponse.data);
            } catch (meError) {
              console.warn('[Ticket Handler] ⚠️ Failed to fetch user detail:', meError.message);
              // Continue anyway with data from ticket login
            }
          }

          // If we got user detail, update localStorage
          if (userDetailResponse?.data?.status && userDetailResponse.data.data) {
            const fullUserData = userDetailResponse.data.data;
            localStorage.setItem('user', JSON.stringify(fullUserData));
            console.log('[Ticket Handler] ✅ Full user data updated');

            // Store roles if available
            if (fullUserData.roles || fullUserData.user_roles) {
              const roles = fullUserData.roles || fullUserData.user_roles;
              localStorage.setItem('user_roles', JSON.stringify(roles));
              console.log('[Ticket Handler] ✅ User roles saved:', roles);
            }

            // Store permissions if available
            if (fullUserData.permissions || fullUserData.user_permissions) {
              const permissions = fullUserData.permissions || fullUserData.user_permissions;
              localStorage.setItem('user_permissions', JSON.stringify(permissions));
              console.log('[Ticket Handler] ✅ User permissions saved:', permissions);
            }
          }

        } catch (detailError) {
          console.warn('[Ticket Handler] ⚠️ Could not fetch user detail:', detailError.message);
          // Continue anyway - we have basic user data from ticket login
        }

        // Step 5: Store roles and permissions from ticket response (if available)
        if (response.user_roles) {
          localStorage.setItem('user_roles', JSON.stringify(response.user_roles));
          console.log('[Ticket Handler] ✅ User roles from ticket response saved');
        }

        if (response.user_permissions) {
          localStorage.setItem('user_permissions', JSON.stringify(response.user_permissions));
          console.log('[Ticket Handler] ✅ User permissions from ticket response saved');
        }

        // Step 6: Final verification before redirect
        console.log('[Ticket Handler] 📋 Final localStorage check:');
        console.log('  - access_token:', localStorage.getItem('access_token') ? '✅ EXISTS' : '❌ MISSING');
        console.log('  - refresh_token:', localStorage.getItem('refresh_token') ? '✅ EXISTS' : '❌ MISSING');
        console.log('  - user:', localStorage.getItem('user') ? '✅ EXISTS' : '❌ MISSING');
        console.log('  - user_roles:', localStorage.getItem('user_roles') ? '✅ EXISTS' : '⚠️ MISSING');
        console.log('  - user_permissions:', localStorage.getItem('user_permissions') ? '✅ EXISTS' : '⚠️ MISSING');

        // Step 7: Redirect to main app (increased delay for localStorage sync)
        console.log('[Ticket Handler] ✅ All data saved, redirecting to /update-data in 1000ms...');
        setTimeout(() => {
          console.log('[Ticket Handler] Redirecting now!');
          // Clean URL (remove ticket parameter)
          window.history.replaceState({}, document.title, '/update-data');
          router.push('/update-data');
        }, 1000); // Increased from 500ms to 1000ms

        return true;
      } else {
        throw new Error(response.message || 'Invalid response from ticket login');
      }
    } catch (error) {
      // Improve diagnostics
      const status = error?.response?.status;
      const data = error?.response?.data;
      console.error('[Ticket Handler] ❌ Error exchanging ticket', {
        url: '/auth/ticket/login',
        status,
        data,
        message: error?.message
      });

      // Show error toast if available
      if (window.$toast) {
        window.$toast.error('Authentication failed. Please try again.');
      }

      // Notify parent if in iframe
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'AUTH_FAILED',
          source: 'update-data',
          error: error.message
        }, '*');
      }

      // Redirect back to home after error
      setTimeout(() => {
        router.push('/');
      }, 2000);

      return false;
    }
  };

  // Check for ticket in URL
  let ticket = route.query.ticket;
  console.log('[Ticket Handler] 🔍 Checking for ticket...');
  console.log('[Ticket Handler] route.query:', JSON.stringify(route.query));
  console.log('[Ticket Handler] Ticket from route.query:', ticket || '❌ NONE');

  // Also try to get from URL directly (fallback)
  if (!ticket) {
    const urlParams = new URLSearchParams(window.location.search);
    ticket = urlParams.get('ticket');
    console.log('[Ticket Handler] Ticket from URLSearchParams:', ticket || '❌ NONE');
  }

  // Clear old tokens if ticket found
  if (ticket) {
    console.log('[Ticket Handler] ✅ Ticket FOUND:', ticket.substring(0, 20) + '...');
    console.log('[Ticket Handler] 🗑️ Clearing old tokens before exchange...');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('user');
    localStorage.removeItem('user_roles');
    localStorage.removeItem('user_permissions');
    console.log('[Ticket Handler] ✅ Old tokens cleared');
  } else {
    console.log('[Ticket Handler] ❌ No ticket in URL');
  }

  // If no ticket in URL, check if in iframe
  if (!ticket && window.parent !== window) {
    console.log('[Ticket Handler] 📦 Running in IFRAME - waiting for ticket via postMessage...');
    console.log('[Ticket Handler] Parent window:', window.parent !== window ? 'EXISTS' : 'NONE');

    // Get host origin for postMessage
    const getHostOrigin = () => {
      try {
        // Prioritize referrer from host app
        const ref = document.referrer || '';
        if (ref) {
          const origin = new URL(ref).origin;
          if (origin) return origin;
        }

        // Fallback to environment config
        const envConfig = require('~/config/environment').default;
        return envConfig.REMOTE_APP?.HOST_ORIGIN || 'http://localhost:3000';
      } catch {
        return '*';
      }
    };

    // Listen for postMessage from parent
    const messageHandler = (event) => {
      console.log('[Ticket Handler] Received postMessage:', event.data?.type);

      if (event.data?.type === 'TICKET_AUTH' && event.data.ticket) {
        console.log('[Ticket Handler] ✅ Received ticket via postMessage:', event.data.ticket.substring(0, 20) + '...');
        window.removeEventListener('message', messageHandler);

        // Redirect to loading page with ticket
        router.push(`/ticket-loading?ticket=${event.data.ticket}`);
      }
    };

    window.addEventListener('message', messageHandler);

    // Request ticket from parent
    const hostOrigin = getHostOrigin();
    console.log('[Ticket Handler] Requesting ticket from parent (origin:', hostOrigin, ')...');
    window.parent.postMessage({
      type: 'REQUEST_TICKET',
      source: 'update-data'
    }, hostOrigin);

    // Timeout warning
    setTimeout(() => {
      console.log('[Ticket Handler] ⚠️ Still waiting for ticket after 2s...');
    }, 2000);

    return;
  }

  if (ticket) {
    console.log('[Ticket Handler] ✅ Ticket detected! Processing silently...');

    // Process ticket immediately without showing an extra page
    // Run after small delay to ensure app is ready
    setTimeout(async () => {
      try {
        await processTicket(ticket);
      } catch (e) {
        console.error('[Ticket Handler] Ticket processing failed:', e?.message || e);
      }
    }, 50);
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
