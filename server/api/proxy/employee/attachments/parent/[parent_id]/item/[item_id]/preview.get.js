import { defineEventHandler, getRouterParam, getHeaders, createError, setResponseHeaders } from 'h3';
import envConfig from '~/config/environment.js';

/**
 * Preview Employee Attachment by Parent ID and Item ID
 * Used for previewing photo_profesional and other attachments
 * Example: /api/proxy/employee/attachments/parent/123/item/456/preview
 */
export default defineEventHandler(async (event) => {
  try {

    // Set CORS headers
    setResponseHeaders(event, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    });

    // Handle OPTIONS request
    if (event.node.req.method === 'OPTIONS') {
      return new Response(null, { status: 200 });
    }

    // Get parent_id and item_id from route params
    const parentId = getRouterParam(event, 'parent_id');
    const itemId = getRouterParam(event, 'item_id');

    console.log('[Attachment Preview Parent] Request:', {
      parentId,
      itemId
    });

    if (!parentId || !itemId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Parent ID and Item ID are required'
      });
    }

    // Get headers
    const headers = getHeaders(event);

    // Check for authorization
    if (!headers.authorization) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authorization header is required'
      });
    }

    // Forward to actual API
    const apiBaseUrl = envConfig.API_BASE_URL || process.env.API_BASE_URL;
    const endpointTemplate = envConfig.API_ENDPOINTS?.EMPLOYEE?.ATTACHMENTS?.PREVIEW_PARENT_ITEM || '/employee/attachments/parent/{parent_id}/item/{item_id}/preview';
    const targetUrl = `${apiBaseUrl}${endpointTemplate.replace('{parent_id}', parentId).replace('{item_id}', itemId)}`;

    console.log('[Attachment Preview Parent] Forwarding to:', targetUrl);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Authorization': headers.authorization,
        'User-Agent': 'ESS-Sigma-Attachment-Preview-Parent-Proxy/1.0'
      }
    });

    console.log('[Attachment Preview Parent] Response:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
    });

    // Check if API request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Attachment Preview Parent] API Error:', errorText);

      throw createError({
        statusCode: response.status,
        statusMessage: `API request failed: ${response.statusText}`,
        data: { error: errorText }
      });
    }

    // For preview, we might get binary data or JSON
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      // JSON response
      const responseData = await response.json();
      return responseData;
    } else {
      // Binary response (image, PDF, etc.)
      const responseBuffer = await response.arrayBuffer();

      // Set appropriate headers for binary response
      setResponseHeaders(event, {
        'Content-Type': contentType || 'application/octet-stream',
        'Content-Length': responseBuffer.byteLength.toString()
      });

      return responseBuffer;
    }

  } catch (error) {
    console.error('[Attachment Preview Parent] Error:', error);

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
