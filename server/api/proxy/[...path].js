import envConfig from '~/config/environment';
import {
  defineEventHandler,
  getQuery,
  setResponseHeaders,
  setResponseStatus,
  readBody,
} from 'h3';

export default defineEventHandler(async (event) => {
  const method = event.method;

  // Basic CORS for local development
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  });

  if (method === 'OPTIONS') {
    return 'OK';
  }

  // Param after /api/proxy/
  let path = event.context.params?.path || '';
  if (Array.isArray(path)) path = path.join('/');

  const query = getQuery(event) || {};
  const queryString = new URLSearchParams(query).toString();
  const endpoint = queryString ? `/${path}?${queryString}` : `/${path}`;

  // Optional Authorization: do NOT require it (ticket login doesn't have one)
  const incomingAuth = event.req.headers['authorization'];

  // Prepare headers
  const headers = {
    Accept: 'application/json',
  };
  if (incomingAuth) headers['Authorization'] = incomingAuth;

  // Body for mutating methods
  let body = null;
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    body = await readBody(event).catch(() => null);
    if (body && typeof body === 'object') {
      headers['Content-Type'] = 'application/json';
    }
  }

  const baseURL = envConfig.API_BASE_URL || process.env.API_BASE_URL;
  const apiUrl = `${baseURL}${endpoint}`;

  try {
    // Use fetch directly to properly handle response status codes
    const fetchOptions = {
      method,
      headers,
    };

    // Add body for mutating methods
    if (body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetch(apiUrl, fetchOptions);

    // Get response data
    let responseData;
    const responseContentType = response.headers.get('content-type');
    const responseStatus = response.status;

    // Set the response status code from API first (before processing body)
    setResponseStatus(event, responseStatus);

    // Handle response based on content type
    if (responseContentType && responseContentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      // Non-JSON response - could be HTML error page, text, etc.
      const text = await response.text();
      
      // Try to parse as JSON (some APIs return JSON without proper content-type)
      try {
        responseData = JSON.parse(text);
      } catch (e) {
        // If it's an error status (4xx/5xx), forward the error properly
        if (responseStatus >= 400) {
          // For error responses, return error data structure
          responseData = {
            status: false,
            message: response.statusText || 'Request failed',
            error: text.substring(0, 500),
            statusCode: responseStatus
          };
        } else {
          // For non-error non-JSON responses, return as text
          responseData = {
            status: true,
            data: text,
            contentType: responseContentType
          };
        }
      }
    }

    return responseData;
  } catch (error) {
    throw createError({
      statusCode: error.statusCode || error.status || 500,
      statusMessage: error.message || 'Proxy request failed',
      data: error.data
    });
  }
});
