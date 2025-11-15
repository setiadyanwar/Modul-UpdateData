import { defineEventHandler, getRouterParam, getHeaders, getQuery, createError, setResponseHeaders } from 'h3';
import envConfig from '~/config/environment.js';

/**
 * Download Employee Attachment by Parent ID and Item ID
 * Used for downloading photo_profesional and other attachments
 * Example: /api/proxy/employee/attachments/parent/123/item/456/download
 */
export default defineEventHandler(async (event) => {
  try {

    // Set CORS headers
    setResponseHeaders(event, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Expose-Headers': 'Content-Disposition, Content-Type, Content-Length'
    });

    // Handle OPTIONS request
    if (event.node.req.method === 'OPTIONS') {
      return new Response(null, { status: 200 });
    }

    // Get parent_id and item_id from route params
    const parentId = getRouterParam(event, 'parent_id');
    const itemId = getRouterParam(event, 'item_id');

    console.log('[Attachment Download Parent] Request:', {
      parentId,
      itemId
    });

    if (!parentId || !itemId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Parent ID and Item ID are required'
      });
    }

    // Get headers and query auth fallback
    const headers = getHeaders(event);
    const query = getQuery(event);
    const authFromQuery = typeof query.auth === 'string' ? query.auth : '';
    const authHeader = headers.authorization || authFromQuery;

    // Check for authorization
    if (!authHeader) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authorization header is required'
      });
    }

    // Forward to actual API
    const apiBaseUrl = envConfig.API_BASE_URL || process.env.API_BASE_URL;
    const endpointTemplate = envConfig.API_ENDPOINTS?.EMPLOYEE?.ATTACHMENTS?.DOWNLOAD_PARENT_ITEM || '/employee/attachments/parent/{parent_id}/item/{item_id}/download';
    const targetUrl = `${apiBaseUrl}${endpointTemplate.replace('{parent_id}', parentId).replace('{item_id}', itemId)}`;

    console.log('[Attachment Download Parent] Forwarding to:', targetUrl);

    // Fetch the file from backend with increased timeout for file downloads
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minute timeout for downloads

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'User-Agent': 'ESS-Sigma-Attachment-Download-Parent-Proxy/1.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId)

    console.log('[Attachment Download Parent] Response:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
    });

    // Check if API request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Attachment Download Parent] API Error:', errorText);

      throw createError({
        statusCode: response.status,
        statusMessage: `API request failed: ${response.statusText}`,
        data: { error: errorText }
      });
    }

    // Get headers for proper file handling
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = response.headers.get('content-disposition') || `attachment; filename="document-${itemId}"`;
    const contentLength = response.headers.get('content-length');

    // Set response headers
    setResponseHeaders(event, {
      'Content-Type': contentType,
      'Content-Disposition': contentDisposition,
      'Access-Control-Expose-Headers': 'Content-Disposition, Content-Type, Content-Length'
    });

    // Add content-length if available
    if (contentLength) {
      setResponseHeaders(event, {
        'Content-Length': contentLength
      });
    }

    // Stream the response instead of buffering everything in memory
    if (response.body) {
      // Return the readable stream directly for better memory usage
      return response.body;
    } else {
      // Fallback to buffer if stream is not available
      const responseBuffer = await response.arrayBuffer();
      setResponseHeaders(event, {
        'Content-Length': responseBuffer.byteLength.toString()
      });
      return responseBuffer;
    }

  } catch (error) {
    console.error('[Attachment Download Parent] Error:', error);

    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error;
    }

    // Handle timeout errors specifically
    if (error.name === 'AbortError') {
      throw createError({
        statusCode: 408,
        statusMessage: 'Download timeout - server took too long to respond'
      });
    }

    // Otherwise, wrap it
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error during attachment download',
      data: { originalError: error.message }
    });
  }
});
