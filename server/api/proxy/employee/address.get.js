// server/api/proxy/employee/address.get.js
import { defineEventHandler, getHeader, parseCookies, createError } from 'h3';
import { $fetch } from 'ofetch';
import envConfig from '~/config/environment.js';

export default defineEventHandler(async (event) => {
  // console.log('[Employee Address] Request received');

  try {
    let token = getHeader(event, 'authorization')?.replace('Bearer ', '');

    if (!token) {
      const cookies = parseCookies(event);
      token = cookies.access_token || cookies['auth-token'] || cookies.token;
    }

    if (!token) {
      // console.log('[Employee Address] No authentication token provided');
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - No authentication token provided'
      });
    }

    // console.log('[Employee Address] Forwarding request to API:', `${envConfig.API_BASE_URL}${envConfig.API_ENDPOINTS.EMPLOYEE.ADDRESS}`);

    const response = await $fetch(`${envConfig.API_BASE_URL}${envConfig.API_ENDPOINTS.EMPLOYEE.ADDRESS}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // console.log('[Employee Address] Response received successfully');

    return response;
  } catch (error) {
    // console.error('[Employee Address] Error:', error.message);

    if (error.statusCode === 401) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - Invalid or expired token'
      });
    }

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || `API request failed: ${error.message}`
    });
  }
});
