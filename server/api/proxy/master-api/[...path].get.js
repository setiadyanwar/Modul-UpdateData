import envConfig from '~/config/environment.js';

/**
 * Master API Collection Endpoints Proxy Handler
 * Handles requests to master-api collection endpoints
 * Examples:
 * - /api/proxy/master-api/tax-statuses
 * - /api/proxy/master-api/banks
 * - /api/proxy/master-api/provinces
 * - /api/proxy/master-api/edu-levels
 */
export default defineEventHandler(async (event) => {
  try {
    const method = getMethod(event);
    const query = getQuery(event);

    // Get the path after /api/proxy/master-api/
    let path = event.context.params?.path;

    // Convert array to string if needed
    if (Array.isArray(path)) {
      path = path.join('/');
    }

    console.log('[Master-API Collection Proxy] Request:', {
      method,
      path,
      query
    });

    // Handle CORS preflight requests
    if (method === 'OPTIONS') {
      setResponseHeaders(event, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400'
      });
      return '';
    }

    const apiBaseUrl = envConfig.API_BASE_URL || process.env.API_BASE_URL;

    // Build query string if present
    const queryString = new URLSearchParams(query).toString();
    const fullPath = queryString ? `master-api/${path}?${queryString}` : `master-api/${path}`;

    // Construct the full URL to Real API
    const apiUrl = `${apiBaseUrl}/${fullPath}`;

    console.log('[Master-API Collection Proxy] Forwarding to:', apiUrl);

    // Prepare headers for real API
    const headers = {
      'User-Agent': 'ESS-Sigma-Proxy/1.0',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Forward authorization headers if present
    const authHeader = getHeader(event, 'authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Build fetch options
    const fetchOptions = {
      method,
      headers,
    };

    // Make the request
    const response = await fetch(apiUrl, fetchOptions);

    console.log('[Master-API Collection Proxy] Response:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
    });

    // Get response data
    let responseData;
    const responseContentType = response.headers.get('content-type');

    if (responseContentType && responseContentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      // If not JSON, get as text
      const text = await response.text();
      console.warn('[Master-API Collection Proxy] ⚠️ Non-JSON response received:', {
        path,
        contentType: responseContentType,
        textPreview: text.substring(0, 200)
      });

      // Try to parse as JSON anyway
      try {
        responseData = JSON.parse(text);
      } catch (e) {
        // If it's HTML or other format, throw error
        throw createError({
          statusCode: 502,
          statusMessage: `Backend returned non-JSON response for ${fullPath}`,
          data: { preview: text.substring(0, 500) }
        });
      }
    }

    // Set CORS headers for the response
    setResponseHeaders(event, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    });

    // Return the response with proper status code
    setResponseStatus(event, response.status);
    return responseData;

  } catch (error) {
    console.error('[Master-API Collection Proxy] ❌ Error:', {
      message: error.message,
      statusCode: error.statusCode || error.status
    });

    throw createError({
      statusCode: error.statusCode || error.status || 500,
      statusMessage: error.message || error.statusText || 'Master API collection request failed',
      data: error.data
    });
  }
});
