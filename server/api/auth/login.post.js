import { $fetch } from 'ofetch';
import envConfig from '~/config/environment';
import {
  defineEventHandler,
  readBody,
  setResponseHeaders,
} from 'h3';

/**
 * Login API
 * Handles email/password authentication
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
    // Get email and password from request body
    const body = await readBody(event);
    const { email, password } = body;

    if (!email || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email and password are required'
      });
    }

    // Get API base URL from environment config
    const apiBaseUrl = envConfig.API_BASE_URL;
    const loginEndpoint = envConfig.API_ENDPOINTS?.AUTH?.LOGIN || '/auth/login';

    // Call backend login API
    const response = await $fetch(`${apiBaseUrl}${loginEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: {
        email,
        password
      }
    });

    // Return response to client
    return response;

  } catch (error) {
    throw createError({
      statusCode: error.status || error.statusCode || 500,
      statusMessage: error.message || 'Login failed',
      data: error.data
    });
  }
});

