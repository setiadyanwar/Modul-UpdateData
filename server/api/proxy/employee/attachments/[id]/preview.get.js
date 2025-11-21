import { defineEventHandler, getRouterParam, getHeaders, createError, setResponseHeaders } from 'h3';
import envConfig from '~/config/environment.js';

export default defineEventHandler(async (event) => {
  try {
    // console.log('[PREVIEW] Starting attachment preview request');

    // Set CORS headers
    setResponseHeaders(event, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    });

    // Handle OPTIONS request
    if (event.node.req.method === 'OPTIONS') {
      // console.log('[PREVIEW] Handling OPTIONS preflight request');
      return new Response(null, { status: 200 });
    }

    // Get attachment ID from route params
    const attachmentId = getRouterParam(event, 'id');
    // console.log('[PREVIEW] Attachment ID:', attachmentId);

    if (!attachmentId) {
      // console.error('[PREVIEW] Missing attachment ID');
      throw createError({
        statusCode: 400,
        statusMessage: 'Attachment ID is required'
      });
    }

    // Get headers
    const headers = getHeaders(event);

    // Check for authorization
    if (!headers.authorization) {
      // console.error('[PREVIEW] Missing authorization header');
      throw createError({
        statusCode: 401,
        statusMessage: 'Authorization header is required'
      });
    }

    // Forward to actual API
    const apiBaseUrl = envConfig.API_BASE_URL;
    const endpointTemplate = envConfig.API_ENDPOINTS.EMPLOYEE.ATTACHMENTS.PREVIEW;
    const targetUrl = `${apiBaseUrl}${endpointTemplate.replace('{id}', attachmentId)}`;

    // console.log('[PREVIEW] Forwarding request to:', targetUrl);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Authorization': headers.authorization,
        'User-Agent': 'ESS-Sigma-Attachment-Preview-Proxy/1.0'
      }
    });

    // console.log('[PREVIEW] API response status:', response.status);

    // Check if API request was successful
    if (!response.ok) {
      const errorText = await response.text();
      // console.error('[PREVIEW] API request failed:', response.status, errorText);

      throw createError({
        statusCode: response.status,
        statusMessage: `API request failed: ${response.statusText}`,
        data: { error: errorText }
      });
    }

    // For preview, we might get binary data or JSON
    const contentType = response.headers.get('content-type');
    // console.log('[PREVIEW] Response content type:', contentType);

    if (contentType && contentType.includes('application/json')) {
      // JSON response
      const responseData = await response.json();
      // console.log('[PREVIEW] Returning JSON response');
      return responseData;
    } else {
      // Binary response (image, PDF, etc.)
      const responseBuffer = await response.arrayBuffer();
      // console.log('[PREVIEW] Returning binary response, size:', responseBuffer.byteLength, 'bytes');

      // Set appropriate headers for binary response
      setResponseHeaders(event, {
        'Content-Type': contentType || 'application/octet-stream',
        'Content-Length': responseBuffer.byteLength.toString()
      });

      return responseBuffer;
    }

  } catch (error) {
    // console.error('[PREVIEW] Error during attachment preview:', error);

    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error;
    }

    // Otherwise, wrap it
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error during attachment preview',
      data: { originalError: error.message }
    });
  }
});
