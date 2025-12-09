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
  // Default headers. Use */* so binary download endpoints are accepted.
  const headers = {
    Accept: '*/*',
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

    // Handle JSON responses
    if (responseContentType && responseContentType.includes('application/json')) {
      responseData = await response.json();
      return responseData;
    }

    // Handle binary / file / non-JSON responses
    // For successful responses (<400) return raw binary (Buffer) and forward headers
    if (responseStatus < 400) {
      const arrayBuffer = await response.arrayBuffer();

      // Forward important headers
      const forwardHeaders = {};
      const contentDisposition = response.headers.get('content-disposition');
      if (contentDisposition) forwardHeaders['content-disposition'] = contentDisposition;
      if (responseContentType) forwardHeaders['content-type'] = responseContentType;

      // Preserve content-length if available
      const contentLength = response.headers.get('content-length');
      if (contentLength) forwardHeaders['content-length'] = contentLength;

      setResponseHeaders(event, forwardHeaders);

      // Return as Buffer so Nuxt sends it as binary
      return Buffer.from(arrayBuffer);
    }

    // For error responses (4xx/5xx) try to parse as text/JSON and wrap consistently
    const text = await response.text();
    try {
      responseData = JSON.parse(text);
    } catch (e) {
      responseData = {
        status: false,
        message: response.statusText || 'Request failed',
        error: text.substring(0, 500),
        statusCode: responseStatus
      };
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
