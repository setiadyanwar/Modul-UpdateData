/**
 * Ticket Handler Plugin for Update-Data
 * Handles SSO ticket exchange before any page renders
 * Based on Mango's ticket-handler mechanism
 */
import { nextTick } from 'vue';
import UserStorage from '~/utils/userStorage';

export default defineNuxtPlugin((nuxtApp) => {
  if (process.server) return;
  const route = useRoute();
  const router = useRouter();

  // ✅ CRITICAL: Set processing flag immediately if ticket exists in URL
  // This must be done BEFORE any middleware runs to prevent premature redirects
  if (process.client && route.query.ticket) {
    sessionStorage.setItem('ticket_processing', 'true');
    console.log('[Ticket Handler] 🚦 Set ticket_processing flag immediately');
  }

  /**
   * Process ticket exchange
   * Exchanges SSO ticket directly with essbe API (POST /auth/ticket/login)
   */
  const processTicket = async (ticket) => {
    // console.log('[Ticket Handler] Processing ticket:', ticket.substring(0, 20) + '...');

    // ✅ CRITICAL: Set flag immediately to prevent any redirect
    // This prevents middleware from redirecting to /update-data before we know if login will fail
    if (process.client) {
      // Set a "processing" flag to prevent premature redirects
      sessionStorage.setItem('ticket_processing', 'true');
    }

    try {
      // Step 1: Exchange ticket for JWT token via essbe API
      // console.log('[Ticket Handler] Step 1: POST /auth/ticket/login to essbe API');

      // Import API client dynamically
      const { apiPost } = await import('~/axios/api.client');

      // Exchange ticket for JWT token via essbe API
      let response;
      let responseStatus = null;
      let isErrorResponse = false;

      try {
        response = await apiPost('/auth/ticket/login', { ticket });

        // ✅ CRITICAL: Check if response is actually an error
        // Axios with validateStatus < 500 doesn't throw for 4xx, so we need to check manually
        // Check for various error indicators:
        isErrorResponse =
          // Standard error format
          (response.status === false) ||
          // Missing token (required for success)
          (!response.token) ||
          // Error field present
          (response.error !== undefined && response.error !== null) ||
          // Error message without token
          (response.message && !response.token && !response.data) ||
          // Response is error object
          (response.error_code !== undefined) ||
          // Response is string (unexpected format)
          (typeof response === 'string') ||
          // Response is null/undefined
          (!response || response === null);

        // Try to extract status code from response if available
        if (response?.statusCode) {
          responseStatus = response.statusCode;
        } else if (response?.status === false) {
          responseStatus = response.statusCode || 400;
        }
      } catch (apiError) {
        // API call threw an error (network, timeout, 5xx, etc.)
        isErrorResponse = true;
        responseStatus = apiError?.response?.status || apiError?.status || 500;

        // Extract error message and data
        const errorData = apiError?.response?.data || apiError?.data;
        response = {
          status: false,
          message: errorData?.message || apiError?.message || 'Authentication failed. Please try again.',
          error: apiError?.message,
          statusCode: responseStatus,
          data: errorData
        };
      }

      // Set flag early if login failed - BEFORE any redirect logic
      if (isErrorResponse || response.status === false || !response.token) {
        if (process.client) {
          sessionStorage.setItem('ticket_login_failed', 'true');
          sessionStorage.removeItem('ticket_processing');
        }
      } else {
        // Login success - clear processing flag
        if (process.client) {
          sessionStorage.removeItem('ticket_processing');
          sessionStorage.removeItem('ticket_login_failed');
        }
      }

      // Handle response based on essbe API format:
      // { status: true, message: "...", data: {...}, token: { access_token: "...", ... } }
      // Check if login failed (status === false or no token or error detected)
      if (isErrorResponse || response.status === false || !response.token) {
        // Ticket login failed - immediately clear everything and notify parent
        const errorMessage = response.message || response.error || 'Authentication failed. Please try again.';
        const statusCode = responseStatus || response.statusCode || response.status === false ? 400 : 500;

        // Clear all flags and routes IMMEDIATELY
        if (process.client) {
          localStorage.removeItem('last_visited_route');
          sessionStorage.removeItem('ticket_processing');
          sessionStorage.setItem('ticket_login_failed', 'true'); // Set flag to block navigation
        }

        // Notify parent (ESSHost) IMMEDIATELY - don't wait, don't navigate anywhere
        if (window.parent !== window) {
          const getHostOrigin = () => {
            try {
              const ref = document.referrer || '';
              if (ref) {
                const origin = new URL(ref).origin;
                if (origin) return origin;
              }
              const envConfig = require('~/config/environment').default;
              return envConfig.IS_PRODUCTION ? envConfig.FRONTEND_URLS.PRODUCTION.ESS_HOST : envConfig.FRONTEND_URLS.DEVELOPMENT.ESS_HOST;
            } catch {
              return '*';
            }
          };

          const hostOrigin = getHostOrigin();
          const postMessageData = {
            type: 'AUTH_FAILED',
            source: 'update-data',
            error: errorMessage,
            action: 'redirect_to_dashboard', // Request ESSHost to redirect to dashboard immediately
            details: {
              status: response.status,
              message: response.message || errorMessage,
              statusCode: statusCode,
              error: response.error,
              errorCode: response.error_code
            }
          };

          console.log('[Ticket Handler] ❌ Login failed - sending postMessage immediately, blocking all navigation', {
            statusCode,
            errorMessage,
            isErrorResponse
          });
          window.parent.postMessage(postMessageData, hostOrigin);
        }

        // Exit immediately - don't navigate anywhere, don't render anything
        return false;
      }

      if (response.status === true && response.token) {
        const accessToken = response.token.access_token;
        const refreshToken = response.token.refresh_token || '';

        // console.log('[Ticket Handler] ✅ Access token received:', accessToken.substring(0, 30) + '...');

        // Step 2: Store tokens IMMEDIATELY
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);

        // Calculate token expiry (default 30 minutes)
        const expiresIn = response.token.expires_in || 1800;
        localStorage.setItem('token_expiry', (Date.now() + (expiresIn * 1000)).toString());

        // ✅ CRITICAL: Store the ticket ID so we don't re-process on reload
        localStorage.setItem('last_processed_ticket', ticket);

        // ✅ Save user data using centralized utility (validates and normalizes)
        // Ensure ID fields exist using JWT payload fallback (sub/user_id/employee_id)
        let jwtPayload = null;
        try {
          const parseJWTPayload = (token) => {
            const parts = token.split('.');
            if (parts.length !== 3) return {};
            const decoded = atob(parts[1]);
            return JSON.parse(decoded);
          };
          jwtPayload = parseJWTPayload(accessToken);
        } catch (e) {
          jwtPayload = null;
        }

        if (response.data) {
          const raw = response.data;
          const findId = (obj) => {
            if (!obj || typeof obj !== 'object') return null;
            const keys = ['user_id', 'employee_id', 'id', 'userId', 'employeeId', 'user_code', 'employee_code', 'nik'];
            for (const k of keys) {
              const v = obj[k];
              if (v !== undefined && v !== null && String(v).trim() !== '') {
                return String(v).trim();
              }
            }
            return null;
          };

          const idFromToken = findId(jwtPayload) || jwtPayload?.sub || null;
          const idFromResponse = findId(raw);
          const finalId = idFromResponse || idFromToken || null;

          if (finalId) {
            const userData = {
              user_id: raw.user_id || finalId,
              employee_id: raw.employee_id || finalId,
              id: raw.id || finalId,
              employeeId: raw.employeeId || raw.employee_id || finalId,
              userId: raw.userId || raw.user_id || finalId,
              user_code: raw.user_code,
              employee_code: raw.employee_code || raw.nik,
              nik: raw.nik,
              email: raw.email || raw.user_email || '',
              name: raw.name || raw.employee_name || '',
              employee_name: raw.employee_name || raw.name || '',
              photo: raw.photo || raw.photo_profile_ess || '',
              photo_profile_ess: raw.photo_profile_ess || raw.photo || ''
            };

            try {
              UserStorage.saveUser(userData);
            } catch (err) {
              console.warn('[Ticket Handler] Skipping saveUser due to error:', err?.message);
            }
          } else {
            console.warn('[Ticket Handler] Skipping saveUser: no ID found in response or token');
          }
        }

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
              UserStorage.saveRoles(normRoles);
              // console.log('[Ticket Handler] ✅ User roles saved from JWT payload:', normRoles);
            }

            // Direct permissions from payload.access (array of strings) → normalize to objects
            if (Array.isArray(payload.access) && payload.access.length) {
              const perms = payload.access.map((p) => ({ permission_code: p }));
              UserStorage.savePermissions(perms);
              // console.log('[Ticket Handler] ✅ Permissions saved from JWT payload.access');
            }
          }
        } catch (e) {
          // console.warn('[Ticket Handler] ⚠️ Failed to parse JWT for roles/permissions:', e?.message);
        }

        // Step 2b: Initialize user data via Authentication Core (ensures roles from JWT/profile)
        try {
          const { useAuthenticationCore } = await import('~/composables/useAuthenticationCore');
          const auth = useAuthenticationCore();

          // ✅ OPTIMIZED: Skip explicit checkAuth, initializeUserData handles it.
          // Also prevents double-fetch of user detail if already populated.
          // We pass { userDetail: userData } if we want to hydrate it directly? 
          // Currently initializeUserData fetches fresh data, which is good for consistency.
          // But we can rely on parallel execution inside it.

          const initResult = await auth.initializeUserData();
          // console.log('[Ticket Handler] Auth core initializeUserData result:', initResult?.success);

          // ✅ CRITICAL FIX: Set auth ready state after initialization
          // This signals to waitForAuth() that auth is ready and prevents timeout
          const { useAuthState } = await import('~/composables/useAuthState');
          const { setAuthReady } = useAuthState();

          // Get current auth data
          const storedToken = localStorage.getItem('access_token');
          const storedUser = UserStorage.getUser();
          const storedRoles = UserStorage.getRoles();
          const storedPermissions = UserStorage.getPermissions();

          // Set auth ready with all data
          setAuthReady(storedToken, storedUser, storedRoles, storedPermissions);
          console.log('[Ticket Handler] ✅ Auth ready state set after initialization');
        } catch (e) {
          // console.warn('[Ticket Handler] ⚠️ Failed to initialize auth core user data:', e?.message);
        }
        // console.log('[Ticket Handler] Token check:', localStorage.getItem('access_token') ? 'EXISTS' : 'NOT FOUND');



        // Step 3: User data already saved above via UserStorage.saveUser()

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
          // console.log('[Ticket Handler] Step 4: Fetching user detail with token...');

          // Set Authorization header temporarily for this request
          const { apiService } = await import('~/axios/api.client');
          apiService.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

          // Try to get user detail using endpoint that actually exists
          // Endpoint: /employee/basic-information (proven to work, used throughout the app)
          // Note: /auth/me and /employees/profile don't exist in backend
          let userDetailResponse;

          try {
            userDetailResponse = await apiService.get('/employee/basic-information');
            // console.log('[Ticket Handler] Employee basic information response:', userDetailResponse.data);
          } catch (basicInfoError) {
            // /employee/basic-information failed - continue anyway with data from ticket login
            // User detail is optional, ticket login response already has basic user data
            // console.warn('[Ticket Handler] ⚠️ Failed to fetch user detail from /employee/basic-information:', basicInfoError.message);
            // console.warn('[Ticket Handler] Continuing with data from ticket login response');
          }

          // If we got user detail, update localStorage (support multiple response shapes)
          if (userDetailResponse?.data) {
            const payload = (typeof userDetailResponse.data === 'object' && 'data' in userDetailResponse.data)
              ? userDetailResponse.data.data
              : userDetailResponse.data;
            if (payload && typeof payload === 'object') {
              const findId = (obj) => {
                if (!obj || typeof obj !== 'object') return null;
                const keys = ['user_id', 'employee_id', 'id', 'userId', 'employeeId', 'user_code', 'employee_code', 'nik'];
                for (const k of keys) {
                  const v = obj[k];
                  if (v !== undefined && v !== null && String(v).trim() !== '') {
                    return String(v).trim();
                  }
                }
                return null;
              };

              const idFromPayload = findId(payload) || (jwtPayload ? findId(jwtPayload) || jwtPayload?.sub : null);

              if (idFromPayload) {
                const normalizedUser = {
                  user_id: payload.user_id || idFromPayload,
                  employee_id: payload.employee_id || idFromPayload,
                  id: payload.id || idFromPayload,
                  employeeId: payload.employeeId || payload.employee_id || idFromPayload,
                  userId: payload.userId || payload.user_id || idFromPayload,
                  user_code: payload.user_code,
                  employee_code: payload.employee_code || payload.nik,
                  nik: payload.nik,
                  email: payload.email || payload.user_email || '',
                  name: payload.name || payload.employee_name || '',
                  employee_name: payload.employee_name || payload.name || '',
                  photo: payload.photo || payload.photo_profile_ess || '',
                  photo_profile_ess: payload.photo_profile_ess || payload.photo || ''
                };

                try {
                  UserStorage.saveUser(normalizedUser);
                  // console.log('[Ticket Handler] ✅ Full user data updated');
                } catch (e) {
                  console.warn('[Ticket Handler] Skipping saveUser (detail payload) due to error:', e?.message);
                }
              } else {
                console.warn('[Ticket Handler] Skipping saveUser (detail payload): no ID found');
              }

              // Store roles if available (normalized to array of { role_id?, role_name })
              const rawRoles = payload.user_roles || payload.roles || payload.role_list || payload.userRoles;
              const roles = normalizeRoles(rawRoles);
              if (roles.length) {
                UserStorage.saveRoles(roles);
                // console.log('[Ticket Handler] ✅ User roles saved (normalized objects):', roles);
              }

              // Store permissions if available (normalize shape)
              const rawPerms = payload.permissions || payload.user_permissions;
              if (rawPerms) {
                const permissions = normalizePermissions(rawPerms);
                UserStorage.savePermissions(permissions);
                // console.log('[Ticket Handler] ✅ User permissions saved (normalized):', permissions);
              }
            }
          }

        } catch (detailError) {
          // console.warn('[Ticket Handler] ⚠️ Could not fetch user detail:', detailError.message);
          // Continue anyway - we have basic user data from ticket login
        }

        // Step 5: Store roles and permissions from ticket response (if available)
        if (response.user_roles || response.roles) {
          const roles = normalizeRoles(response.user_roles || response.roles);
          if (roles.length) {
            UserStorage.saveRoles(roles);
            // console.log('[Ticket Handler] ✅ User roles from ticket response saved (normalized objects)');
          }
        }

        if (response.user_permissions) {
          const permissions = normalizePermissions(response.user_permissions);
          UserStorage.savePermissions(permissions);
          // console.log('[Ticket Handler] ✅ User permissions from ticket response saved (normalized)');
        }

        // Map permissions/roles from ticket response if present
        if (Array.isArray(response.access) && response.access.length) {
          const permissions = normalizePermissions(response.access);
          UserStorage.savePermissions(permissions);
          // console.log('[Ticket Handler] ✅ Permissions from ticket response saved (normalized from response.access)');
        }

        // Step 6: Final verification before redirect
        // console.log('[Ticket Handler] 📋 Final localStorage check:');
        // console.log('  - access_token:', localStorage.getItem('access_token') ? '✅ EXISTS' : '❌ MISSING');
        // console.log('  - refresh_token:', localStorage.getItem('refresh_token') ? '✅ EXISTS' : '❌ MISSING');
        // console.log('  - user:', UserStorage.hasUser() ? '✅ EXISTS' : '❌ MISSING');
        // console.log('  - user_roles:', UserStorage.getRoles().length > 0 ? '✅ EXISTS' : '⚠️ MISSING');
        // console.log('  - user_permissions:', UserStorage.getPermissions().length > 0 ? '✅ EXISTS' : '⚠️ MISSING');

        // Step 7: Redirect to last visited route (if reload) or default /update-data (if fresh login)
        // ✅ FIX: Validate targetRoute to prevent malformed URLs from localStorage
        let targetRoute = localStorage.getItem('last_visited_route') || '/update-data';

        // ✅ Sanitize: Check if route contains full URL (e.g., /https://domain.com/)
        if (targetRoute.includes('http://') || targetRoute.includes('https://')) {
          // console.warn('[Ticket Handler] ⚠️ Malformed route detected in localStorage:', targetRoute);
          // console.warn('[Ticket Handler] 🔧 Resetting to default route: /update-data');
          targetRoute = '/update-data';
          // Update localStorage with corrected value
          localStorage.setItem('last_visited_route', '/update-data');
        }

        const isReload = !!localStorage.getItem('last_visited_route');

        // console.log('[Ticket Handler] ✅ All data saved, redirecting to', targetRoute, 'in 1000ms...');
        // console.log('[Ticket Handler] 📍 Route type:', isReload ? 'RELOAD (restored route)' : 'FRESH LOGIN (default route)');

        setTimeout(() => {
          // console.log('[Ticket Handler] Redirecting now to:', targetRoute);
          // Clean URL (remove ticket parameter) and go to target route
          window.history.replaceState({}, document.title, targetRoute);
          router.push(targetRoute);
        }, 1000); // Increased from 500ms to 1000ms

        // Login success - clear flags
        if (process.client) {
          sessionStorage.removeItem('ticket_processing');
          sessionStorage.removeItem('ticket_login_failed');
        }

        return true;
      } else {
        // Unexpected response format - treat as error
        throw new Error(response.message || 'Invalid response from ticket login');
      }
    } catch (error) {
      // ✅ CRITICAL: This catch block handles ALL errors that weren't caught above:
      // - Network errors (ECONNABORTED, Network Error, Failed to fetch)
      // - Timeout errors
      // - 5xx server errors (thrown by axios)
      // - Unexpected response formats
      // - Any other unhandled errors

      // Improve diagnostics - extract all possible error information
      const status = error?.response?.status || error?.status;
      const data = error?.response?.data || error?.data;
      const errorCode = error?.code; // Network error codes (ECONNABORTED, etc.)
      const errorMessage =
        data?.message ||
        error?.message ||
        (errorCode === 'ECONNABORTED' ? 'Request timeout. Please check your connection.' : '') ||
        (error?.message?.includes('Network Error') ? 'Network error. Please check your connection.' : '') ||
        (error?.message?.includes('Failed to fetch') ? 'Failed to connect to server. Please check your connection.' : '') ||
        'Authentication failed. Please try again.';

      const statusCode = status || (errorCode ? 0 : 500); // 0 for network errors

      // console.error('[Ticket Handler] ❌ Error exchanging ticket', {
      //   url: '/auth/ticket/login',
      //   status,
      //   statusCode,
      //   errorCode,
      //   data,
      //   message: error?.message,
      //   error: error
      // });

      // Clear flags and set error flag immediately
      if (process.client) {
        localStorage.removeItem('last_visited_route');
        sessionStorage.removeItem('ticket_processing');
        sessionStorage.setItem('ticket_login_failed', 'true');
      }

      // Notify parent (ESSHost) immediately - don't show toast in iframe
      if (window.parent !== window) {
        const getHostOrigin = () => {
          try {
            const ref = document.referrer || '';
            if (ref) {
              const origin = new URL(ref).origin;
              if (origin) return origin;
            }
            const envConfig = require('~/config/environment').default;
            return envConfig.IS_PRODUCTION ? envConfig.FRONTEND_URLS.PRODUCTION.ESS_HOST : envConfig.FRONTEND_URLS.DEVELOPMENT.ESS_HOST;
          } catch {
            return '*';
          }
        };

        const hostOrigin = getHostOrigin();
        const postMessageData = {
          type: 'AUTH_FAILED',
          source: 'update-data',
          error: errorMessage,
          action: 'redirect_to_dashboard', // Request ESSHost to redirect to dashboard immediately
          details: {
            status: status,
            statusCode: statusCode,
            errorCode: errorCode, // Network error code (ECONNABORTED, etc.)
            data: data,
            message: errorMessage,
            errorType: errorCode ? 'network' : (status >= 500 ? 'server' : 'client')
          }
        };

        console.log('[Ticket Handler] ❌ Error - sending postMessage immediately:', {
          ...postMessageData,
          originalError: error?.message
        });
        window.parent.postMessage(postMessageData, hostOrigin);
      } else {
        // Only show toast if not in iframe (standalone mode)
        if (window.$toast) {
          window.$toast.error(errorMessage);
        }
        // Standalone mode - redirect to login
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }

      // Exit immediately - don't navigate anywhere in iframe mode
      return false;
    }
  };

  // Check for ticket in URL
  let ticket = route.query.ticket;
  // console.log('[Ticket Handler] 🔍 Checking for ticket...');
  // console.log('[Ticket Handler] route.query:', JSON.stringify(route.query));
  // console.log('[Ticket Handler] Ticket from route.query:', ticket || '❌ NONE');

  // ✅ DEBUG: Log current localStorage state BEFORE any processing
  // console.log('[Ticket Handler] 📊 Current localStorage state:', {
  //   last_processed_ticket: localStorage.getItem('last_processed_ticket')?.substring(0, 20) + '...' || 'NONE',
  //   last_visited_route: localStorage.getItem('last_visited_route') || 'NONE',
  //   access_token: localStorage.getItem('access_token') ? 'EXISTS' : 'NONE',
  //   token_expiry: localStorage.getItem('token_expiry') || 'NONE'
  // });

  // Also try to get from URL directly (fallback)
  if (!ticket) {
    const urlParams = new URLSearchParams(window.location.search);
    ticket = urlParams.get('ticket');
    // console.log('[Ticket Handler] Ticket from URLSearchParams:', ticket || '❌ NONE');
  }

  // Clear old tokens if ticket found (but check if this ticket was already processed)
  if (ticket) {
    // console.log('[Ticket Handler] ✅ Ticket FOUND:', ticket.substring(0, 20) + '...');

    // ✅ CRITICAL FIX: Check if this exact ticket was already successfully processed
    const lastProcessedTicket = localStorage.getItem('last_processed_ticket');
    const hasValidToken = localStorage.getItem('access_token') && localStorage.getItem('token_expiry');
    const tokenExpiry = hasValidToken ? parseInt(localStorage.getItem('token_expiry')) : 0;
    const tokenStillValid = tokenExpiry > Date.now();

    // console.log('[Ticket Handler] 🔍 Checking if ticket was already processed:', {
    //   currentTicket: ticket.substring(0, 20) + '...',
    //   lastProcessedTicket: lastProcessedTicket ? lastProcessedTicket.substring(0, 20) + '...' : 'NONE',
    //   hasValidToken,
    //   tokenStillValid,
    //   isSameTicket: ticket === lastProcessedTicket
    // });

    // If same ticket and token still valid, DON'T clear and DON'T re-exchange
    if (ticket === lastProcessedTicket && tokenStillValid) {
      // console.log('');
      // console.log('═══════════════════════════════════════════════════════════');
      // console.log('[Ticket Handler] ✅ CACHED TICKET PATH - RESTORING SESSION');
      // console.log('═══════════════════════════════════════════════════════════');
      // console.log('[Ticket Handler] ✅ Ticket already processed and token still valid - skipping exchange');
      // console.log('[Ticket Handler] 🎉 Using existing token from localStorage');

      // ✅ Restore auth state and initialize (SEQUENTIAL to prevent race condition)
      (async () => {
        try {
          const { useAuthState } = await import('~/composables/useAuthState');
          const { setAuthReady } = useAuthState();

          const storedToken = localStorage.getItem('access_token');
          const user = UserStorage.getUser(); // Use centralized utility
          const roles = UserStorage.getRoles();
          const permissions = UserStorage.getPermissions();

          setAuthReady(storedToken, user, roles, permissions);
          // console.log('[Ticket Handler] 🔐 Auth state restored from existing session');

          // ✅ FIX: Also initialize auth core like fresh ticket path
          // This ensures user.value is set in useAuthenticationCore, which triggers useProfile watcher
          // Without this, Header will stuck in skeleton loading because isProfileLoaded stays false
          const { useAuthenticationCore } = await import('~/composables/useAuthenticationCore');
          const auth = useAuthenticationCore();
          await auth.checkAuth(); // Sets user.value from localStorage
          // console.log('[Ticket Handler] ✅ Auth core initialized from cached session');

          // ✅ Wait for reactive updates to propagate
          await nextTick();

          // ✅ THEN redirect (auth is guaranteed ready) - FIX RACE CONDITION
          let lastRoute = localStorage.getItem('last_visited_route') || '/update-data';

          // ✅ FIX: Validate lastRoute to prevent malformed URLs
          if (lastRoute.includes('http://') || lastRoute.includes('https://')) {
            // console.warn('[Ticket Handler] ⚠️ Malformed route detected in localStorage:', lastRoute);
            // console.warn('[Ticket Handler] 🔧 Resetting to default route: /update-data');
            lastRoute = '/update-data';
            // Update localStorage with corrected value
            localStorage.setItem('last_visited_route', '/update-data');
          }

          const hasLastRoute = !!localStorage.getItem('last_visited_route');

          // console.log('[Ticket Handler] 🔍 Checking last visited route:', {
          //   lastRoute,
          //   hasLastRoute,
          //   willRedirectTo: lastRoute,
          //   isDefaultFallback: !hasLastRoute
          // });

          if (!hasLastRoute) {
            // console.warn('[Ticket Handler] ⚠️ No last_visited_route found in localStorage - using default /update-data');
          } else {
            // console.log('[Ticket Handler] ✅ Found last_visited_route in localStorage:', lastRoute);
          }

          // console.log('[Ticket Handler] 🚀 Redirecting to:', lastRoute);
          window.history.replaceState({}, document.title, lastRoute);
          router.push(lastRoute);
        } catch (error) {
          // console.error('[Ticket Handler] ❌ Error restoring auth state:', error);
          // Fallback: redirect to home on error
          router.push('/');
        }
      })();

      return; // STOP here - don't process ticket again!
    }

    // Different ticket or expired token - clear and re-exchange
    // console.log('');
    // console.log('═══════════════════════════════════════════════════════════');
    // console.log('[Ticket Handler] 🔄 NEW TICKET PATH - EXCHANGING TICKET');
    // console.log('═══════════════════════════════════════════════════════════');
    // console.log('[Ticket Handler] 🗑️ Clearing old tokens before exchange...');

    // ✅ CRITICAL: Check if this is a RELOAD scenario (parent refresh)
    // If we have last_visited_route AND access_token, this is likely a reload with new ticket
    // We should PRESERVE the route in this case
    const isReloadScenario = localStorage.getItem('last_visited_route') && localStorage.getItem('access_token');
    const savedRouteForReload = isReloadScenario ? localStorage.getItem('last_visited_route') : null;

    if (isReloadScenario) {
      // console.log('[Ticket Handler] 🔄 Reload scenario detected - will preserve last_visited_route:', savedRouteForReload);
    } else {
      // console.log('[Ticket Handler] 🆕 Fresh login scenario - will start at /update-data');
    }

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('user');
    localStorage.removeItem('user_roles');
    localStorage.removeItem('user_permissions');
    localStorage.removeItem('last_processed_ticket'); // Clear old ticket marker
    localStorage.removeItem('last_visited_route'); // Temporarily clear (will restore if reload)
    // console.log('[Ticket Handler] ✅ Old tokens cleared');

    // ✅ Restore last_visited_route if this was a reload scenario
    if (savedRouteForReload) {
      localStorage.setItem('last_visited_route', savedRouteForReload);
      // console.log('[Ticket Handler] ✅ Restored last_visited_route for reload:', savedRouteForReload);
    }
  } else {
    // console.log('[Ticket Handler] ❌ No ticket in URL');
  }

  // If no ticket in URL, check if in iframe
  if (!ticket && window.parent !== window) {
    // console.log('[Ticket Handler] 📦 Running in IFRAME - waiting for ticket via postMessage...');
    // console.log('[Ticket Handler] Parent window:', window.parent !== window ? 'EXISTS' : 'NONE');

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
        return envConfig.IS_PRODUCTION ? envConfig.FRONTEND_URLS.PRODUCTION.ESS_HOST : envConfig.FRONTEND_URLS.DEVELOPMENT.ESS_HOST;
      } catch {
        return '*';
      }
    };

    // Listen for postMessage from parent
    const messageHandler = (event) => {
      // console.log('[Ticket Handler] Received postMessage:', event.data?.type);

      if (event.data?.type === 'TICKET_AUTH' && event.data.ticket) {
        // console.log('[Ticket Handler] ✅ Received ticket via postMessage:', event.data.ticket.substring(0, 20) + '...');
        window.removeEventListener('message', messageHandler);

        // Redirect to loading page with ticket
        router.push(`/ticket-loading?ticket=${event.data.ticket}`);
      }
    };

    window.addEventListener('message', messageHandler);

    // Request ticket from parent
    const hostOrigin = getHostOrigin();
    // console.log('[Ticket Handler] Requesting ticket from parent (origin:', hostOrigin, ')...');
    window.parent.postMessage({
      type: 'REQUEST_TICKET',
      source: 'update-data'
    }, hostOrigin);

    // Timeout warning
    setTimeout(() => {
      // console.log('[Ticket Handler] ⚠️ Still waiting for ticket after 2s...');
    }, 2000);

    return;
  }

  if (ticket) {
    // console.log('[Ticket Handler] ✅ Ticket detected! Processing silently...');

    // Process ticket immediately without showing an extra page
    // Run after small delay to ensure app is ready
    setTimeout(async () => {
      try {
        const result = await processTicket(ticket);

        // If ticket processing failed, don't allow any redirect
        if (result === false) {
          console.log('[Ticket Handler] ⚠️ Ticket processing failed - preventing redirect');
          // Clear route to prevent middleware from redirecting
          localStorage.removeItem('last_visited_route');
          return; // Exit early, don't continue
        }
      } catch (e) {
        // console.error('[Ticket Handler] Ticket processing failed:', e?.message || e);
      }
    }, 50);
  } else {
    // console.log('[Ticket Handler] ❌ No ticket found - normal page load');
  }

  // Provide processTicket function
  return {
    provide: {
      processTicket
    }
  };

  // console.log('=== [Ticket Handler] Initialization Complete ===\n');
});
