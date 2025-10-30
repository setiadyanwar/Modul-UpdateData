import { defineEventHandler, getRouterParam, getHeaders, createError, setResponseHeaders } from 'h3';
import envConfig from '~/config/environment.js';

export default defineEventHandler(async (event) => {
  try {
    console.log('[INFO] Starting attachment information request');

    // Set CORS headers
    setResponseHeaders(event, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    });

    // Handle OPTIONS request
    if (event.node.req.method === 'OPTIONS') {
      console.log('[INFO] Handling OPTIONS preflight request');
      return new Response(null, { status: 200 });
    }

    // Get attachment ID from route params
    const attachmentId = getRouterParam(event, 'id');
    console.log('[INFO] Attachment ID:', attachmentId);

    if (!attachmentId) {
      console.error('[INFO] Missing attachment ID');
      throw createError({
        statusCode: 400,
        statusMessage: 'Attachment ID is required'
      });
    }

    // Get headers
    const headers = getHeaders(event);

    // Check for authorization
    if (!headers.authorization) {
      console.error('[INFO] Missing authorization header');
      throw createError({
        statusCode: 401,
        statusMessage: 'Authorization header is required'
      });
    }

    // Forward to actual API
    const apiBaseUrl = envConfig.API_BASE_URL;
    const endpointTemplate = envConfig.API_ENDPOINTS.EMPLOYEE.ATTACHMENTS.INFO;
    const targetUrl = `${apiBaseUrl}${endpointTemplate.replace('{id}', attachmentId)}`;

    console.log('[INFO] Forwarding request to:', targetUrl);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Authorization': headers.authorization,
        'User-Agent': 'ESS-Sigma-Attachment-Info-Proxy/1.0'
      }
    });

    console.log('[INFO] API response status:', response.status);

    // Check if API request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[INFO] API request failed:', response.status, errorText);

      throw createError({
        statusCode: response.status,
        statusMessage: `API request failed: ${response.statusText}`,
        data: { error: errorText }
      });
    }

    // Read response
    const responseText = await response.text();
    console.log('[INFO] Response received, length:', responseText.length);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('[INFO] Successfully parsed JSON response');
    } catch (e) {
      console.error('[INFO] Failed to parse JSON response:', e);
      throw createError({
        statusCode: 502,
        statusMessage: 'Invalid API response format'
      });
    }

    return responseData;

  } catch (error) {
    console.error('[INFO] Error during attachment information retrieval:', error);

    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error;
    }

    // Otherwise, wrap it
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error during attachment information retrieval',
      data: { originalError: error.message }
    });
  }
});
