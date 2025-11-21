import { $fetch } from 'ofetch';
import envConfig from '~/config/environment';
import {
  defineEventHandler,
  readBody,
  setResponseHeaders,
  createError
} from 'h3';

/**
 * Refresh Token API proxy
 * Forward refresh token request to backend ESS API
 */
export default defineEventHandler(async (event) => {
  // CORS headers
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  });

  if (event.method === 'OPTIONS') {
    return 'OK';
  }

  try {
    const body = await readBody(event);
    const { refresh_token: refreshToken } = body || {};

    if (!refreshToken) {
      throw createError({
        statusCode: 400,
        statusMessage: 'refresh_token is required'
      });
    }

    const apiBaseUrl = envConfig.API_BASE_URL;
    const refreshEndpoint = envConfig.API_ENDPOINTS?.AUTH?.REFRESH || '/auth/refresh';

    const response = await $fetch(`${apiBaseUrl}${refreshEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: {
        refresh_token: refreshToken
      }
    });

    return response;
  } catch (error) {
    throw createError({
      statusCode: error.status || error.statusCode || 500,
      statusMessage: error.message || 'Token refresh failed',
      data: error.data
    });
  }
});


