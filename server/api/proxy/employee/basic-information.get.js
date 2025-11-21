// server/api/proxy/employee/basic-information.get.js
import { defineEventHandler, getHeader, parseCookies, getQuery, createError } from 'h3';
import { $fetch } from 'ofetch';
import envConfig from '~/config/environment.js';

export default defineEventHandler(async (event) => {
  // console.log('[Employee Basic Info] Request received');

  try {

    // ✅ FIXED: Get token from multiple sources
    let token = getHeader(event, 'authorization')?.replace('Bearer ', '');

    // Fallback: try to get token from cookies or query params
    if (!token) {
      const cookies = parseCookies(event);
      token = cookies.access_token || cookies['auth-token'] || cookies.token;
    }

    if (!token) {
      const query = getQuery(event);
      token = query.token || query.access_token || undefined;
    }


    if (!token) {
      // console.log('[Employee Basic Info] No authentication token provided');
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - No authentication token provided'
      });
    }

    // console.log('[Employee Basic Info] Forwarding request to API:', `${envConfig.API_BASE_URL}${envConfig.API_ENDPOINTS.EMPLOYEE.BASIC_INFORMATION}`);

    // Forward to correct API endpoint
    const response = await $fetch(`${envConfig.API_BASE_URL}${envConfig.API_ENDPOINTS.EMPLOYEE.BASIC_INFORMATION}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // console.log('[Employee Basic Info] Response received successfully');

    // Normalize response shape for frontend (success/data)
    if (response && response.status && response.data) {
      return { success: true, status: 200, data: response.data, raw: response };
    }
    // If response is already normalized, pass through
    if (response.success !== undefined) {
      return response;
    }
    // Fallback: wrap entire response as data
    return { success: true, status: 200, data: response };
  } catch (error) {
    // Error handling for basic information retrieval
    // console.error('[Employee Basic Info] Error:', error.message);

    // ✅ ENHANCED: Proper error handling without mock data
    if (error.statusCode === 401) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - Invalid or expired token'
      });
    }

    // For network errors or server errors
    if (error.statusCode >= 500 || !error.statusCode) {
      throw createError({
        statusCode: 502,
        statusMessage: `External API unavailable: ${error.message}`
      });
    }

    if (error.statusCode) {
      throw createError({
        statusCode: error.statusCode,
        statusMessage: error.statusMessage || `API request failed: ${error.message}`
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: `Internal server error: ${error.message}`
    });
  }
});
