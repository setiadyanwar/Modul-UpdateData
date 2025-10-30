import envConfig from '~/config/environment.js';

/**
 * Master API Proxy Handler
 * Handles requests to master-api endpoint with query parameters
 * Example: /api/proxy/master-api/?category=GENDER
 */
export default defineEventHandler(async (event) => {
  try {
    const method = getMethod(event);
    const query = getQuery(event);

    console.log('[Master-API Proxy] Request:', {
      method,
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

    const apiBaseUrl = envConfig.API_BASE_URL || process.env.API_BASE_URL || 'https://apigwsand.telkomsigma.co.id/essbe';

    // Build query string from request query parameters
    const queryString = new URLSearchParams(query).toString();
    const path = queryString ? `master-api/?${queryString}` : 'master-api/';

    // Construct the full URL to Real API
    const apiUrl = `${apiBaseUrl}/${path}`;

    console.log('[Master-API Proxy] Forwarding to:', apiUrl);

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

    // Forward other important headers
    const requestContentType = getHeader(event, 'content-type');
    if (requestContentType) {
      headers['Content-Type'] = requestContentType;
    }

    // Build fetch options
    const fetchOptions = {
      method,
      headers,
    };

    // Make the request
    const response = await fetch(apiUrl, fetchOptions);

    console.log('[Master-API Proxy] Response:', {
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
      console.warn('[Master-API Proxy] ⚠️ Non-JSON response received:', {
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
          statusMessage: 'Backend returned non-JSON response',
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
    console.error('[Master-API Proxy] ❌ Error:', {
      message: error.message,
      statusCode: error.statusCode || error.status
    });

    throw createError({
      statusCode: error.statusCode || error.status || 500,
      statusMessage: error.message || error.statusText || 'Master API request failed',
      data: error.data
    });
  }
});
