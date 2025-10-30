import { $fetch } from 'ofetch';

/**
 * API Proxy Handler - Catch-all route
 * Proxies requests to external API to avoid CORS issues
 *
 * Features:
 * - Forward query parameters
 * - CORS headers support
 * - Authorization forwarding
 * - Error handling
 *
 * Usage:
 * GET/POST/PUT/DELETE /api/proxy/employee/basic-information
 * GET /api/proxy/master-data?category=NATIONALITY
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const method = event.method;

  // Set CORS headers
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  });

  // Handle preflight
  if (method === 'OPTIONS') {
    return 'OK';
  }

  // Get the path after /api/proxy/
  // Note: path can be a string or array depending on Nuxt version
  let path = event.context.params.path;

  // Convert array to string if needed (e.g., ['master-api'] -> 'master-api')
  if (Array.isArray(path)) {
    path = path.join('/');
  }

  // ✅ Get query parameters from URL
  // Note: Nuxt's getQuery() properly parses query params from the request URL
  const query = getQuery(event);

  // If path contains query string (edge case), strip it
  if (typeof path === 'string' && path.includes('?')) {
    path = path.split('?')[0];
  }

  const queryString = new URLSearchParams(query).toString();

  // Build endpoint with query params
  // ✅ FIX: Don't add trailing slash - backend may not accept it
  const endpoint = queryString ? `/${path}?${queryString}` : `/${path}`;

  console.log('[API Proxy] Request:', {
    method,
    endpoint,
    queryParams: query,
    rawPath: event.context.params.path
  });

  // Get authorization header from request
  const authHeader = getHeader(event, 'authorization');

  if (!authHeader) {
    console.error('[API Proxy] Missing authorization header');
    throw createError({
      statusCode: 401,
      statusMessage: 'Missing authorization header'
    });
  }

  // Get API base URL from environment
  const apiBaseUrl = process.env.API_BASE_URL || 'https://apigwsand.telkomsigma.co.id/essbe';

  try {
    // Build headers
    const headers = {
      'Authorization': authHeader,
      'Accept': 'application/json',
    };

    // Add Content-Type for POST/PUT requests
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      headers['Content-Type'] = 'application/json';
    }

    // Get request body for POST/PUT/PATCH
    let body = null;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      body = await readBody(event);
    }

    console.log('[API Proxy] Forwarding to:', `${apiBaseUrl}${endpoint}`, {
      method,
      hasAuth: !!authHeader,
      authHeaderPreview: authHeader ? `${authHeader.substring(0, 20)}...` : 'MISSING',
      hasBody: !!body,
      queryParams: query,
      headers: Object.keys(headers)
    });

    // Make request to external API
    const response = await $fetch(endpoint, {
      method,
      baseURL: apiBaseUrl,
      headers,
      body,
      // Important: Don't throw on error status codes
      // We want to return the error response to the client
      ignoreResponseError: true,
      // ✅ FIX: Handle both JSON and HTML responses
      parseResponse: (text) => {
        // Check if response looks like HTML
        if (text.trim().startsWith('<') || text.includes('<!DOCTYPE') || text.includes('<html')) {
          console.error('[API Proxy] ⚠️ Received HTML instead of JSON:', {
            endpoint,
            textPreview: text.substring(0, 200)
          });
          // Throw error with helpful message
          throw new Error(`API endpoint returned HTML instead of JSON. The endpoint ${endpoint} may not exist on the backend.`);
        }
        try {
          return JSON.parse(text);
        } catch (e) {
          console.error('[API Proxy] ⚠️ Failed to parse response as JSON:', {
            endpoint,
            error: e.message,
            textPreview: text.substring(0, 200)
          });
          throw new Error(`Invalid JSON response from API endpoint ${endpoint}`);
        }
      },
    });

    console.log('[API Proxy] ✅ Success', {
      endpoint,
      responseType: typeof response,
      isArray: Array.isArray(response),
      responsePreview: typeof response === 'string' ? response.substring(0, 200) : JSON.stringify(response).substring(0, 200)
    });

    // Return response
    return response;

  } catch (error) {
    console.error('[API Proxy] ❌ Error', endpoint, {
      status: error.status,
      statusCode: error.statusCode,
      message: error.message,
      data: error.data
    });

    // Return error response
    throw createError({
      statusCode: error.status || error.statusCode || 500,
      statusMessage: error.message || 'Proxy request failed',
      data: error.data
    });
  }
});
