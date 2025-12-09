import envConfig from '~/config/environment';
import {
  defineEventHandler,
  readBody,
  setResponseHeaders,
  setResponseStatus,
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

    // Use fetch directly to properly handle response status codes
    const response = await fetch(`${apiBaseUrl}${refreshEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        refresh_token: refreshToken
      })
    });

    const responseStatus = response.status;
    
    // Set the response status code from API (before processing body)
    setResponseStatus(event, responseStatus);

    // Get response data
    let responseData;
    const responseContentType = response.headers.get('content-type');

    if (responseContentType && responseContentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      try {
        responseData = JSON.parse(text);
      } catch (e) {
        // If it's an error status, forward the error properly
        if (responseStatus >= 400) {
          responseData = {
            status: false,
            message: response.statusText || 'Token refresh failed',
            error: text.substring(0, 500),
            statusCode: responseStatus
          };
        } else {
          throw createError({
            statusCode: 502,
            statusMessage: 'Backend returned non-JSON response',
            data: { preview: text.substring(0, 500) }
          });
        }
      }
    }

    return responseData;
  } catch (error) {
    throw createError({
      statusCode: error.statusCode || error.status || 500,
      statusMessage: error.message || 'Token refresh failed',
      data: error.data
    });
  }
});


