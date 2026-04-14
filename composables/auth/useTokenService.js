import { $fetch } from 'ofetch';
import { logger } from '~/utils/logger';
import { AUTH_CONFIG } from './authConfig';

export const useTokenService = (user, forceLogout) => {
  
  // Parse JWT token payload
  const parseJWTPayload = (token) => {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Invalid token format');
      }

      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const payload = parts[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (error) {
      logger.authError('JWT_PARSE_FAILED', error, { token: token?.substring(0, 20) + '...' });
      return {};
    }
  };

  // Check if token is expired or needs refresh
  const getTokenStatus = (token) => {
    if (!token) return 'MISSING';

    const payload = parseJWTPayload(token);
    if (!payload?.exp) return 'INVALID';

    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;

    if (timeUntilExpiry <= 0) {
      return 'EXPIRED';
    }

    // Token needs refresh if expires in less than 5 minutes
    if (timeUntilExpiry < 300000) {
      return 'NEEDS_REFRESH';
    }

    return 'VALID';
  };

  // Refresh access token
  const refreshAccessToken = async () => {
    if (process.server) return null;

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      if (forceLogout) await forceLogout('No refresh token available');
      return null;
    }

    try {
      const response = await $fetch(AUTH_CONFIG.ENDPOINTS.REFRESH, {
        method: 'POST',
        body: { refresh_token: refreshToken },
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.status && (response.data || response.token)) {
        const accessToken = response.token?.access_token || response.data?.access_token;
        const newRefreshToken = response.token?.refresh_token || response.data?.refresh_token;

        if (accessToken) {
          localStorage.setItem('access_token', accessToken);
          if (newRefreshToken) {
            localStorage.setItem('refresh_token', newRefreshToken);
          }

          if (process.dev) {
            const payload = parseJWTPayload(accessToken);
            logger.tokenEvent('TOKEN_REFRESHED_SUCCESS', {
              userId: user?.value?.id,
              tokenExpiry: payload.exp 
            });
          }
          return accessToken;
        } else {
          logger.tokenError('TOKEN_REFRESH_NO_ACCESS_TOKEN', {
            message: 'No access token received in refresh response'
          }, { userId: user?.value?.id });
          
          if (forceLogout) await forceLogout('Token refresh failed - no access token received');
          return null;
        }
      }
    } catch (error) {
      logger.tokenError('TOKEN_REFRESH_FAILED', error, {
        userId: user?.value?.id,
        action: 'REFRESH_TOKEN'
      });

      // Handle 401 = unauthorized (refresh token expired)
      if (error.status === 401 || error.statusCode === 401) {
        if (forceLogout) await forceLogout('Session expired. Please log in again.');
        return null;
      }

      // Handle 503 network errors - return current token (fallback)
      if (error.status === 503 || error.statusCode === 503 || 
          (error.message && error.message.includes('Network error'))) {
        return localStorage.getItem('access_token');
      }

      return localStorage.getItem('access_token');
    }
  };

  // Get valid access token
  const getValidAccessToken = async (lastActivityTime, showSessionWarning) => {
    if (process.server) return null;

    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) return null;

    const tokenStatus = getTokenStatus(accessToken);

    switch (tokenStatus) {
      case 'VALID':
      case 'NEEDS_REFRESH':
        return accessToken;

      case 'EXPIRED':
        const timeSinceActivity = Date.now() - (lastActivityTime?.value || 0);

        // If user is still "active", try refreshing
        if (timeSinceActivity < AUTH_CONFIG.SESSION_WARNING_TIME) {
          const newToken = await refreshAccessToken();
          if (newToken) return newToken;
        }

        // Otherwise show warning
        if (showSessionWarning) showSessionWarning();
        return null;

      default:
        return null;
    }
  };

  return {
    parseJWTPayload,
    getTokenStatus,
    refreshAccessToken,
    getValidAccessToken
  };
};
