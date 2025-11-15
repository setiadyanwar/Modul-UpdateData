import { defineEventHandler, getRouterParam, getHeaders, readMultipartFormData, createError, setResponseHeaders } from 'h3';
import envConfig from '~/config/environment.js';

export default defineEventHandler(async (event) => {
  try {
    console.log('[Change Request Attachment POST] Upload attachment endpoint called', {
      timestamp: new Date().toISOString()
    });

    // Set CORS headers
    setResponseHeaders(event, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    });

    // Handle OPTIONS request
    if (event.node.req.method === 'OPTIONS') {
      return new Response(null, { status: 200 });
    }

    // Get change request ID from route params
    const changeRequestId = getRouterParam(event, 'id');

    if (!changeRequestId) {
      console.error('[Change Request Attachment POST] No change request ID provided');
      throw createError({
        statusCode: 400,
        statusMessage: 'Change request ID is required'
      });
    }

    console.log('[Change Request Attachment POST] Processing attachment upload', {
      changeRequestId
    });

    // Get headers
    const headers = getHeaders(event);

    // Check for authorization
    if (!headers.authorization) {
      console.error('[Change Request Attachment POST] No authorization header found', {
        changeRequestId
      });
      throw createError({
        statusCode: 401,
        statusMessage: 'Authorization header is required'
      });
    }

    // Read multipart form data
    const formData = await readMultipartFormData(event);

    if (!formData || formData.length === 0) {
      console.error('[Change Request Attachment POST] No form data received', {
        changeRequestId
      });
      throw createError({
        statusCode: 400,
        statusMessage: 'No form data received'
      });
    }

    console.log('[Change Request Attachment POST] Form data received', {
      changeRequestId,
      entryCount: formData.length
    });

    // Find file and document_type in form data
    let fileEntry = null;
    let documentType = '7'; // default to 'Other'
    let clientKey = null;

    for (const entry of formData) {
      if (entry.name === 'file' && entry.filename) {
        fileEntry = entry;
        console.log('[Change Request Attachment POST] File found', {
          changeRequestId,
          filename: entry.filename,
          type: entry.type,
          size: entry.data?.length
        });
      } else if (entry.name === 'document_type' && entry.data) {
        documentType = entry.data.toString('utf8');
      } else if (entry.name === 'client_key' && entry.data) {
        clientKey = entry.data.toString('utf8');
      }
    }

    if (!fileEntry) {
      console.error('[Change Request Attachment POST] No file found in form data', {
        changeRequestId
      });
      throw createError({
        statusCode: 400,
        statusMessage: 'No file found in form data'
      });
    }

  // Validate file (25MB limit enforced by backend)
  const maxSize = 25 * 1024 * 1024; // 25MB
    if (fileEntry.data && fileEntry.data.length > maxSize) {
      console.error('[Change Request Attachment POST] File too large', {
        changeRequestId,
        fileSize: fileEntry.data.length,
        maxSize
      });
      throw createError({
        statusCode: 400,
        statusMessage: `File too large. Maximum size is 25MB. File size: ${(fileEntry.data.length / 1024 / 1024).toFixed(2)}MB`
      });
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (fileEntry.type && !allowedTypes.includes(fileEntry.type)) {
      console.error('[Change Request Attachment POST] Invalid file type', {
        changeRequestId,
        fileType: fileEntry.type
      });
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}. Received: ${fileEntry.type}`
      });
    }

    console.log('[Change Request Attachment POST] File validation passed', {
      changeRequestId,
      filename: fileEntry.filename,
      documentType,
      hasClientKey: !!clientKey
    });

    // Create new FormData for API request
    const apiFormData = new FormData();

    // Create a proper File blob from the buffer - convert Buffer to Uint8Array for Blob
    const uint8Array = new Uint8Array(fileEntry.data);
    const fileBlob = new Blob([uint8Array], { type: fileEntry.type || 'application/octet-stream' });
    apiFormData.append('file', fileBlob, fileEntry.filename);
    apiFormData.append('document_type', documentType);
    if (clientKey) {
      apiFormData.append('client_key', clientKey);
    }



    // Forward to actual API - using the correct endpoint format
    const apiBaseUrl = envConfig?.API_BASE_URL || process.env.API_BASE_URL;
    const targetUrl = `${apiBaseUrl}/employee/attachments/change-request/${changeRequestId}`;

    console.log('[Change Request Attachment POST] Calling API', {
      changeRequestId,
      targetUrl,
      filename: fileEntry.filename
    });

    const startTime = Date.now();
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Authorization': headers.authorization,
        'User-Agent': 'ESS-Sigma-Attachment-Proxy/1.0'
        // Don't set Content-Type - let fetch set it automatically for FormData
      },
      body: apiFormData
    });

    const responseTime = Date.now() - startTime;

    console.log('[Change Request Attachment POST] API response received', {
      changeRequestId,
      status: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`
    });

    // Handle specific error statuses based on the new API responses
    if (response.status >= 500) {
      console.error('[Change Request Attachment POST] Backend server error', {
        changeRequestId,
        status: response.status
      });
      throw createError({
        statusCode: 502,
        statusMessage: `Backend server error (${response.status}): ${response.statusText}`
      });
    }

    if (response.status === 404) {
      console.error('[Change Request Attachment POST] Change request not found', {
        changeRequestId
      });
      throw createError({
        statusCode: 404,
        statusMessage: `Change request ${changeRequestId} not found or attachments endpoint unavailable`
      });
    }

    if (response.status === 401 || response.status === 403) {
      console.error('[Change Request Attachment POST] Authentication failed', {
        changeRequestId,
        status: response.status
      });
      throw createError({
        statusCode: response.status,
        statusMessage: 'Authentication or authorization failed'
      });
    }

    // Read response
    const responseText = await response.text();

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.warn('[Change Request Attachment POST] Failed to parse API response', {
        changeRequestId,
        responseText: responseText?.substring(0, 200)
      });

      // If response is empty or just whitespace, treat as success with empty data
      if (!responseText.trim()) {
        responseData = { status: true, message: 'File uploaded successfully' };
      } else {
        // Try to extract meaningful error info from HTML/text response
        const isHtml = responseText.includes('<html') || responseText.includes('<!DOCTYPE');
        if (isHtml) {
          throw createError({
            statusCode: 502,
            statusMessage: 'Backend returned HTML error page instead of JSON'
          });
        } else {
          throw createError({
            statusCode: 502,
            statusMessage: 'Invalid API response format - not valid JSON'
          });
        }
      }
    }

    // Check if API request was successful and handle specific error statuses
    if (!response.ok) {
      console.error('[Change Request Attachment POST] API request failed', {
        changeRequestId,
        status: response.status,
        response: responseText?.substring(0, 200)
      });

      // Handle specific error statuses based on user-provided error formats
      if (response.status === 400) {
        throw createError({
          statusCode: 400,
          statusMessage: responseData.message || 'Bad request - validation failed',
          data: {
            error_code: responseData.error_code || 'VALIDATION_ERROR',
            details: responseData.data || null,
            originalMessage: responseData.message
          }
        });
      }

      if (response.status === 413) {
        throw createError({
          statusCode: 413,
          statusMessage: responseData.message || 'File size exceeds 25MB limit',
          data: {
            error_code: responseData.error_code || 'FILE_TOO_LARGE',
            details: responseData.data || null,
            originalMessage: responseData.message
          }
        });
      }

      if (response.status === 422) {
        throw createError({
          statusCode: 422,
          statusMessage: responseData.message || 'Unsupported file type - only PNG, JPG, JPEG, PDF allowed',
          data: {
            error_code: responseData.error_code || 'UNSUPPORTED_FILE_TYPE',
            details: responseData.data || null,
            originalMessage: responseData.message
          }
        });
      }

      // Handle other client/server errors
      throw createError({
        statusCode: response.status,
        statusMessage: responseData.message || responseData.error || `API request failed: ${response.statusText}`,
        data: {
          error_code: responseData.error_code || `HTTP_ERROR_${response.status}`,
          details: responseData.data || responseData,
          originalMessage: responseData.message
        }
      });
    }

    console.log('[Change Request Attachment POST] File uploaded successfully', {
      changeRequestId,
      filename: fileEntry.filename,
      responseTime: `${responseTime}ms`
    });

    // Return structured success response matching the API format
    return {
      success: true,
      status: responseData.status || 'success',
      message: responseData.message || 'File uploaded successfully',
      data: responseData.data || responseData
    };

  } catch (error) {
    console.error('[Change Request Attachment POST] Unexpected error', {
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
      statusMessage: error.message || 'Internal server error during file upload',
      data: { originalError: error.message }
    });
  }
});
