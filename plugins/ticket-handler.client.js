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

        // ✅ CRITICAL: Store the ticket ID so we don't re-process on reload
        localStorage.setItem('last_processed_ticket', ticket);
        console.log('[Ticket Handler] ✅ Saved last_processed_ticket:', ticket.substring(0, 20) + '...');

        console.log('[Ticket Handler] ✅ Tokens saved to localStorage');

        // Step 2a: Parse JWT to extract roles and permissions early
        try {
          const parseJWTPayload = (token) => {
            const parts = token.split('.');
            if (parts.length !== 3) return {};
            const decoded = atob(parts[1]);
            return JSON.parse(decoded);
          };

          const payload = parseJWTPayload(accessToken);
          if (payload) {
            // Roles from payload.role or payload.roles
            const rawRoles = payload.role || payload.roles;
            const normRoles = (() => {
              if (!rawRoles) return [];
              if (Array.isArray(rawRoles)) {
                if (!rawRoles.length) return [];
                if (typeof rawRoles[0] === 'string') {
                  return rawRoles.map((name) => ({ role_name: String(name) }));
                }
                if (typeof rawRoles[0] === 'object') {
                  return rawRoles
                    .map((r) => {
                      const role_name = r?.role_name || r?.name || r?.code || (typeof r === 'string' ? r : null);
                      const role_id = r?.role_id ?? r?.id ?? undefined;
                      if (!role_name) return null;
                      return role_id !== undefined ? { role_id, role_name: String(role_name) } : { role_name: String(role_name) };
                    })
                    .filter(Boolean);
                }
              }
              if (typeof rawRoles === 'string') return [{ role_name: rawRoles }];
              return [];
            })();
            if (normRoles.length) {
              localStorage.setItem('user_roles', JSON.stringify(normRoles));
              console.log('[Ticket Handler] ✅ User roles saved from JWT payload:', normRoles);
            }

            // Direct permissions from payload.access (array of strings) → normalize to objects
            if (Array.isArray(payload.access) && payload.access.length) {
              const perms = payload.access.map((p) => ({ permission_code: p }));
              localStorage.setItem('user_permissions', JSON.stringify(perms));
              console.log('[Ticket Handler] ✅ Permissions saved from JWT payload.access');
            }
          }
        } catch (e) {
          console.warn('[Ticket Handler] ⚠️ Failed to parse JWT for roles/permissions:', e?.message);
        }

        // Step 2b: Initialize user data via Authentication Core (ensures roles from JWT/profile)
        try {
          const { useAuthenticationCore } = await import('~/composables/useAuthenticationCore');
          const auth = useAuthenticationCore();
          // Ensure minimal user state exists for auth core
          // Save basic user data first so checkAuth can pick it up
          if (response.data) {
            localStorage.setItem('user', JSON.stringify(response.data));
          }
          // Let auth core read tokens and user from localStorage
          await auth.checkAuth();
          const initResult = await auth.initializeUserData();
          console.log('[Ticket Handler] Auth core initializeUserData result:', initResult?.success);
        } catch (e) {
          console.warn('[Ticket Handler] ⚠️ Failed to initialize auth core user data:', e?.message);
        }
        console.log('[Ticket Handler] Token check:', localStorage.getItem('access_token') ? 'EXISTS' : 'NOT FOUND');

        // Step 3: Store user data
        if (response.data) {
          localStorage.setItem('user', JSON.stringify(response.data));
          console.log('[Ticket Handler] ✅ User data saved:', response.data);
        } else {
          console.warn('[Ticket Handler] ⚠️ No user data in response!');
        }

        // Utility: normalize permissions to [{ permission_code: string }]
        const normalizePermissions = (val) => {
          if (!val) return [];
          // Already correct shape
          if (Array.isArray(val) && val.length && typeof val[0] === 'object' && 'permission_code' in val[0]) {
            return val;
          }
          // Array of strings -> map to objects
          if (Array.isArray(val) && (!val.length || typeof val[0] === 'string')) {
            return val.map((p) => ({ permission_code: p }));
          }
          // Single string
          if (typeof val === 'string') {
            return [{ permission_code: val }];
          }
          return [];
        };

        // Utility: normalize roles to an array of objects: { role_id?: number|string, role_name: string }
        const normalizeRoles = (val) => {
          if (!val) return [];
          if (Array.isArray(val)) {
            if (!val.length) return [];
            if (typeof val[0] === 'string') {
              return val.map((name) => ({ role_name: String(name) }));
            }
            if (typeof val[0] === 'object') {
              return val
                .map((r) => {
                  const role_name = r?.role_name || r?.name || r?.code || (typeof r === 'string' ? r : null);
                  const role_id = r?.role_id ?? r?.id ?? undefined;
                  if (!role_name) return null;
                  return role_id !== undefined ? { role_id, role_name: String(role_name) } : { role_name: String(role_name) };
                })
                .filter(Boolean);
            }
          }
          if (typeof val === 'string') return [{ role_name: val }];
          return [];
        };

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

          // If we got user detail, update localStorage (support multiple response shapes)
          if (userDetailResponse?.data) {
            const payload = (typeof userDetailResponse.data === 'object' && 'data' in userDetailResponse.data)
              ? userDetailResponse.data.data
              : userDetailResponse.data;
            if (payload && typeof payload === 'object') {
              localStorage.setItem('user', JSON.stringify(payload));
              console.log('[Ticket Handler] ✅ Full user data updated');

              // Store roles if available (normalized to array of { role_id?, role_name })
              const rawRoles = payload.user_roles || payload.roles || payload.role_list || payload.userRoles;
              const roles = normalizeRoles(rawRoles);
              if (roles.length) {
                localStorage.setItem('user_roles', JSON.stringify(roles));
                console.log('[Ticket Handler] ✅ User roles saved (normalized objects):', roles);
              }

              // Store permissions if available (normalize shape)
              const rawPerms = payload.permissions || payload.user_permissions;
              if (rawPerms) {
                const permissions = normalizePermissions(rawPerms);
                localStorage.setItem('user_permissions', JSON.stringify(permissions));
                console.log('[Ticket Handler] ✅ User permissions saved (normalized):', permissions);
              }
            }
          }

        } catch (detailError) {
          console.warn('[Ticket Handler] ⚠️ Could not fetch user detail:', detailError.message);
          // Continue anyway - we have basic user data from ticket login
        }

        // Step 5: Store roles and permissions from ticket response (if available)
        if (response.user_roles || response.roles) {
          const roles = normalizeRoles(response.user_roles || response.roles);
          if (roles.length) {
            localStorage.setItem('user_roles', JSON.stringify(roles));
            console.log('[Ticket Handler] ✅ User roles from ticket response saved (normalized objects)');
          }
        }

        if (response.user_permissions) {
          const permissions = normalizePermissions(response.user_permissions);
          localStorage.setItem('user_permissions', JSON.stringify(permissions));
          console.log('[Ticket Handler] ✅ User permissions from ticket response saved (normalized)');
        }

        // Map permissions/roles from ticket response if present
        if (Array.isArray(response.access) && response.access.length) {
          const permissions = normalizePermissions(response.access);
          localStorage.setItem('user_permissions', JSON.stringify(permissions));
          console.log('[Ticket Handler] ✅ Permissions from ticket response saved (normalized from response.access)');
        }

        // Step 6: Final verification before redirect
        console.log('[Ticket Handler] 📋 Final localStorage check:');
        console.log('  - access_token:', localStorage.getItem('access_token') ? '✅ EXISTS' : '❌ MISSING');
        console.log('  - refresh_token:', localStorage.getItem('refresh_token') ? '✅ EXISTS' : '❌ MISSING');
        console.log('  - user:', localStorage.getItem('user') ? '✅ EXISTS' : '❌ MISSING');
        console.log('  - user_roles:', localStorage.getItem('user_roles') ? '✅ EXISTS' : '⚠️ MISSING');
        console.log('  - user_permissions:', localStorage.getItem('user_permissions') ? '✅ EXISTS' : '⚠️ MISSING');

        // Step 7: Redirect to last visited route (if reload) or default /update-data (if fresh login)
        const targetRoute = localStorage.getItem('last_visited_route') || '/update-data';
        const isReload = !!localStorage.getItem('last_visited_route');

        console.log('[Ticket Handler] ✅ All data saved, redirecting to', targetRoute, 'in 1000ms...');
        console.log('[Ticket Handler] 📍 Route type:', isReload ? 'RELOAD (restored route)' : 'FRESH LOGIN (default route)');

        setTimeout(() => {
          console.log('[Ticket Handler] Redirecting now to:', targetRoute);
          // Clean URL (remove ticket parameter) and go to target route
          window.history.replaceState({}, document.title, targetRoute);
          router.push(targetRoute);
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

  // ✅ DEBUG: Log current localStorage state BEFORE any processing
  console.log('[Ticket Handler] 📊 Current localStorage state:', {
    last_processed_ticket: localStorage.getItem('last_processed_ticket')?.substring(0, 20) + '...' || 'NONE',
    last_visited_route: localStorage.getItem('last_visited_route') || 'NONE',
    access_token: localStorage.getItem('access_token') ? 'EXISTS' : 'NONE',
    token_expiry: localStorage.getItem('token_expiry') || 'NONE'
  });

  // Also try to get from URL directly (fallback)
  if (!ticket) {
    const urlParams = new URLSearchParams(window.location.search);
    ticket = urlParams.get('ticket');
    console.log('[Ticket Handler] Ticket from URLSearchParams:', ticket || '❌ NONE');
  }

  // Clear old tokens if ticket found (but check if this ticket was already processed)
  if (ticket) {
    console.log('[Ticket Handler] ✅ Ticket FOUND:', ticket.substring(0, 20) + '...');

    // ✅ CRITICAL FIX: Check if this exact ticket was already successfully processed
    const lastProcessedTicket = localStorage.getItem('last_processed_ticket');
    const hasValidToken = localStorage.getItem('access_token') && localStorage.getItem('token_expiry');
    const tokenExpiry = hasValidToken ? parseInt(localStorage.getItem('token_expiry')) : 0;
    const tokenStillValid = tokenExpiry > Date.now();

    console.log('[Ticket Handler] 🔍 Checking if ticket was already processed:', {
      currentTicket: ticket.substring(0, 20) + '...',
      lastProcessedTicket: lastProcessedTicket ? lastProcessedTicket.substring(0, 20) + '...' : 'NONE',
      hasValidToken,
      tokenStillValid,
      isSameTicket: ticket === lastProcessedTicket
    });

    // If same ticket and token still valid, DON'T clear and DON'T re-exchange
    if (ticket === lastProcessedTicket && tokenStillValid) {
      console.log('');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('[Ticket Handler] ✅ CACHED TICKET PATH - RESTORING SESSION');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('[Ticket Handler] ✅ Ticket already processed and token still valid - skipping exchange');
      console.log('[Ticket Handler] 🎉 Using existing token from localStorage');

      // ✅ Trigger auth state restore immediately (use IIFE for async)
      (async () => {
        try {
          const { useAuthState } = await import('~/composables/useAuthState');
          const { setAuthReady } = useAuthState();

          const storedToken = localStorage.getItem('access_token');
          const storedUser = localStorage.getItem('user');
          const storedRoles = localStorage.getItem('user_roles');
          const storedPermissions = localStorage.getItem('user_permissions');

          const user = storedUser ? JSON.parse(storedUser) : null;
          const roles = storedRoles ? JSON.parse(storedRoles) : null;
          const permissions = storedPermissions ? JSON.parse(storedPermissions) : null;

          setAuthReady(storedToken, user, roles, permissions);
          console.log('[Ticket Handler] 🔐 Auth state restored from existing session');
        } catch (error) {
          console.error('[Ticket Handler] ❌ Error restoring auth state:', error);
        }
      })();

      // ✅ Redirect to last visited route or fallback to /update-data
      setTimeout(() => {
        const lastRoute = localStorage.getItem('last_visited_route') || '/update-data';
        const hasLastRoute = !!localStorage.getItem('last_visited_route');

        console.log('[Ticket Handler] 🔍 Checking last visited route:', {
          lastRoute,
          hasLastRoute,
          willRedirectTo: lastRoute,
          isDefaultFallback: !hasLastRoute
        });

        if (!hasLastRoute) {
          console.warn('[Ticket Handler] ⚠️ No last_visited_route found in localStorage - using default /update-data');
        } else {
          console.log('[Ticket Handler] ✅ Found last_visited_route in localStorage:', lastRoute);
        }

        console.log('[Ticket Handler] 🚀 Redirecting to:', lastRoute);
        window.history.replaceState({}, document.title, lastRoute);
        router.push(lastRoute);
      }, 100);

      return; // STOP here - don't process ticket again!
    }

    // Different ticket or expired token - clear and re-exchange
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('[Ticket Handler] 🔄 NEW TICKET PATH - EXCHANGING TICKET');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('[Ticket Handler] 🗑️ Clearing old tokens before exchange...');

    // ✅ CRITICAL: Check if this is a RELOAD scenario (parent refresh)
    // If we have last_visited_route AND access_token, this is likely a reload with new ticket
    // We should PRESERVE the route in this case
    const isReloadScenario = localStorage.getItem('last_visited_route') && localStorage.getItem('access_token');
    const savedRouteForReload = isReloadScenario ? localStorage.getItem('last_visited_route') : null;

    if (isReloadScenario) {
      console.log('[Ticket Handler] 🔄 Reload scenario detected - will preserve last_visited_route:', savedRouteForReload);
    } else {
      console.log('[Ticket Handler] 🆕 Fresh login scenario - will start at /update-data');
    }

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('user');
    localStorage.removeItem('user_roles');
    localStorage.removeItem('user_permissions');
    localStorage.removeItem('last_processed_ticket'); // Clear old ticket marker
    localStorage.removeItem('last_visited_route'); // Temporarily clear (will restore if reload)
    console.log('[Ticket Handler] ✅ Old tokens cleared');

    // ✅ Restore last_visited_route if this was a reload scenario
    if (savedRouteForReload) {
      localStorage.setItem('last_visited_route', savedRouteForReload);
      console.log('[Ticket Handler] ✅ Restored last_visited_route for reload:', savedRouteForReload);
    }
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
