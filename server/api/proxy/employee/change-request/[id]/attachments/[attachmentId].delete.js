import { defineEventHandler, getRouterParam, getHeaders, createError, setResponseHeaders } from 'h3';
import envConfig from '~/config/environment.js';

export default defineEventHandler(async (event) => {
  try {
    console.log('[Change Request Attachment DELETE] Delete attachment endpoint called', {
      timestamp: new Date().toISOString()
    });

    // Set CORS headers
    setResponseHeaders(event, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    });

    // Handle OPTIONS request
    if (event.node.req.method === 'OPTIONS') {
      return new Response(null, { status: 200 });
    }

    // Get attachment ID from route params
    const attachmentId = getRouterParam(event, 'attachmentId');

    if (!attachmentId) {
      console.error('[Change Request Attachment DELETE] No attachment ID provided');
      throw createError({
        statusCode: 400,
        statusMessage: 'Attachment ID is required'
      });
    }

    console.log('[Change Request Attachment DELETE] Processing delete request', {
      attachmentId
    });

    // Get headers
    const headers = getHeaders(event);

    // Check for authorization
    if (!headers.authorization) {
      console.error('[Change Request Attachment DELETE] No authorization header found', {
        attachmentId
      });
      throw createError({
        statusCode: 401,
        statusMessage: 'Authorization header is required'
      });
    }


    // Forward to actual API
    const apiBaseUrl = envConfig?.API_BASE_URL || process.env.API_BASE_URL || 'https://apigwsand.telkomsigma.co.id/essbe';
    const targetUrl = `${apiBaseUrl}/employee/attachments/${attachmentId}/delete`;

    console.log('[Change Request Attachment DELETE] Calling API', {
      attachmentId,
      targetUrl
    });

    const response = await fetch(targetUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': headers.authorization,
        'User-Agent': 'ESS-Sigma-ChangeRequest-Attachment-Delete-Proxy/1.0'
      }
    });

    console.log('[Change Request Attachment DELETE] API response received', {
      attachmentId,
      status: response.status,
      statusText: response.statusText
    });

    // Read response
    const responseText = await response.text();

    // Check if API request was successful first
    if (!response.ok) {
      console.error('[Change Request Attachment DELETE] API request failed', {
        attachmentId,
        status: response.status,
        response: responseText?.substring(0, 200)
      });

      // Handle different error status codes with appropriate messages
      let errorMessage = '';
      let errorData = {};

      if (response.status === 404) {
        errorMessage = 'File tidak ditemukan atau sudah dihapus';
        errorData = { message: errorMessage };
      } else if (response.status === 401) {
        errorMessage = 'Tidak memiliki izin untuk menghapus file ini';
        errorData = { message: errorMessage };
      } else if (response.status === 403) {
        errorMessage = 'Akses ditolak untuk menghapus file ini';
        errorData = { message: errorMessage };
      } else {
        // Try to parse error response as JSON
        try {
          errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || `Gagal menghapus file (${response.status})`;
        } catch (e) {
          // If can't parse as JSON, check if it's HTML error page
          if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html')) {
            errorMessage = 'File tidak ditemukan atau endpoint tidak valid';
          } else {
            errorMessage = responseText || `Gagal menghapus file (${response.status})`;
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
      console.log('[Change Request Attachment DELETE] Attachment deleted successfully (empty response)', {
        attachmentId
      });
      return {
        success: true,
        message: 'Attachment deleted successfully'
      };
    }

    // Try to parse JSON response
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('[Change Request Attachment DELETE] Attachment deleted successfully', {
        attachmentId,
        hasData: !!responseData
      });
      return responseData;
    } catch (e) {
      // If successful but can't parse JSON, return success with raw response
      console.log('[Change Request Attachment DELETE] Attachment deleted successfully (non-JSON response)', {
        attachmentId
      });
      return {
        success: true,
        message: 'Attachment deleted successfully',
        rawResponse: responseText
      };
    }

  } catch (error) {
    console.error('[Change Request Attachment DELETE] Unexpected error', {
      error: error.message || String(error),
      statusCode: error.statusCode,
      stack: error.stack
    });

    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error;
    }

    // Otherwise, wrap it
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error during change request attachment deletion',
      data: { originalError: error.message }
    });
  }
});
