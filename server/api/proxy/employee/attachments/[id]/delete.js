import { defineEventHandler, getRouterParam, getHeaders, createError, setResponseHeaders } from 'h3';
import envConfig from '~/config/environment.js';

export default defineEventHandler(async (event) => {
  try {
    console.log('[DELETE] Starting attachment deletion request');

    // Set CORS headers
    setResponseHeaders(event, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    });

    // Handle OPTIONS request
    if (event.node.req.method === 'OPTIONS') {
      console.log('[DELETE] Handling OPTIONS preflight request');
      return new Response(null, { status: 200 });
    }

    // Get attachment ID from route params
    const attachmentId = getRouterParam(event, 'id');
    console.log('[DELETE] Attachment ID:', attachmentId);

    if (!attachmentId) {
      console.error('[DELETE] Missing attachment ID');
      throw createError({
        statusCode: 400,
        statusMessage: 'Attachment ID is required'
      });
    }

    // Get headers
    const headers = getHeaders(event);

    // Check for authorization
    if (!headers.authorization) {
      console.error('[DELETE] Missing authorization header');
      throw createError({
        statusCode: 401,
        statusMessage: 'Authorization header is required'
      });
    }

    // Forward to actual API
    const apiBaseUrl = envConfig.API_BASE_URL;
    const targetUrl = `${apiBaseUrl}/employee/attachments/${attachmentId}/delete`;

    console.log('[DELETE] Forwarding request to:', targetUrl);

    const response = await fetch(targetUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': headers.authorization,
        'User-Agent': 'ESS-Sigma-Attachment-Delete-Proxy/1.0'
      }
    });

    console.log('[DELETE] API response status:', response.status);

    // Read response
    const responseText = await response.text();

    // Check if API request was successful first
    if (!response.ok) {
      // Handle different error status codes with appropriate messages
      let errorMessage = '';
      let errorData = {};

      if (response.status === 404) {
        errorMessage = 'File tidak ditemukan atau sudah dihapus';
        errorData = { message: errorMessage };
        console.error('[DELETE] File not found (404)');
      } else if (response.status === 401) {
        errorMessage = 'Tidak memiliki izin untuk menghapus file ini';
        errorData = { message: errorMessage };
        console.error('[DELETE] Unauthorized (401)');
      } else if (response.status === 403) {
        errorMessage = 'Akses ditolak untuk menghapus file ini';
        errorData = { message: errorMessage };
        console.error('[DELETE] Forbidden (403)');
      } else {
        // Try to parse error response as JSON
        try {
          errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || `Gagal menghapus file (${response.status})`;
          console.error('[DELETE] API error:', errorMessage);
        } catch (e) {
          // If can't parse as JSON, check if it's HTML error page
          if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html')) {
            errorMessage = 'File tidak ditemukan atau endpoint tidak valid';
            console.error('[DELETE] Received HTML error page');
          } else {
            errorMessage = responseText || `Gagal menghapus file (${response.status})`;
            console.error('[DELETE] Raw error response:', responseText);
          }
          errorData = { message: errorMessage };
        }
      }

      throw createError({
        statusCode: response.status,
        statusMessage: errorMessage,
        data: errorData
      });
    }

    // For successful DELETE operations, handle empty responses
    if (!responseText || responseText.trim() === '') {
      console.log('[DELETE] Successful deletion (empty response)');
      return {
        success: true,
        message: 'Attachment deleted successfully'
      };
    }

    // Try to parse JSON response
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('[DELETE] Successfully parsed JSON response');
      return responseData;
    } catch (e) {
      // If successful but can't parse JSON, return success with raw response
      console.log('[DELETE] Successful deletion (non-JSON response)');
      return {
        success: true,
        message: 'Attachment deleted successfully',
        rawResponse: responseText
      };
    }

  } catch (error) {
    console.error('[DELETE] Error during attachment deletion:', error);

    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error;
    }

    // Otherwise, wrap it
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error during attachment deletion',
      data: { originalError: error.message }
    });
  }
});
