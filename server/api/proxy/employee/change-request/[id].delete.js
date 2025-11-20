import { defineEventHandler, getHeaders } from 'h3'
import envConfig from '~/config/environment.js';

export default defineEventHandler(async (event) => {
  console.log('[Change Request DELETE] Delete change request endpoint called', {
    timestamp: new Date().toISOString()
  });

  try {
    // Get change request ID from URL params
    const changeRequestId = event.context.params?.id
    if (!changeRequestId) {
      console.error('[Change Request DELETE] No change request ID provided');
      return {
        success: false,
        message: 'Change request ID is required',
        status: 400
      }
    }

    console.log('[Change Request DELETE] Processing delete request', {
      changeRequestId
    });

    // Get headers
    const headers = getHeaders(event)

    // Extract authorization token
    const authHeader = headers.authorization || headers.Authorization
    if (!authHeader) {
      console.error('[Change Request DELETE] No authorization header found');
      return {
        success: false,
        message: 'Authorization header is required',
        status: 401
      }
    }

    // API base URL from environment
    const apiBaseUrl = envConfig?.API_BASE_URL || process.env.API_BASE_URL

    // Build target URL for the real API
    const targetUrl = `${apiBaseUrl}/employee/change-request/${changeRequestId}`

    console.log('[Change Request DELETE] Calling API', {
      targetUrl,
      changeRequestId
    });

    // Prepare headers for the real API call
    const apiHeaders = {
      'Authorization': authHeader
    }

    // Add any additional headers that might be needed
    if (headers['x-request-id']) apiHeaders['X-Request-ID'] = headers['x-request-id']
    if (headers['user-agent']) apiHeaders['User-Agent'] = headers['user-agent']

    // Make the actual API call to the real backend
    const response = await fetch(targetUrl, {
      method: 'DELETE',
      headers: apiHeaders
    })

    console.log('[Change Request DELETE] API response received', {
      status: response.status,
      statusText: response.statusText,
      changeRequestId
    });

    // Get response text first
    const responseText = await response.text()

    // Check if response is successful
    if (!response.ok) {
      console.error('[Change Request DELETE] API request failed', {
        status: response.status,
        changeRequestId,
        response: responseText?.substring(0, 200)
      });

      // Try to parse error response
      let errorData
      try {
        errorData = JSON.parse(responseText)
      } catch {
        errorData = { message: responseText || 'Unknown error' }
      }

      return {
        success: false,
        message: errorData.message || `API request failed with status ${response.status}`,
        status: response.status,
        data: errorData
      }
    }

    // Parse successful response
    let responseData
    try {
      responseData = responseText ? JSON.parse(responseText) : {}
    } catch (e) {
      // If response is empty (common for DELETE), that's OK
      if (responseText.trim() === '') {
        console.log('[Change Request DELETE] Empty response from API (expected for DELETE)', {
          changeRequestId
        });
        return {
          success: true,
          message: 'Change request deleted successfully',
          status: 200,
          data: { id: changeRequestId }
        }
      }
      // If response is not JSON but has content
      console.warn('[Change Request DELETE] Non-JSON response', {
        changeRequestId,
        response: responseText?.substring(0, 100)
      });
      return {
        success: true,
        message: 'Change request deleted successfully',
        status: 200,
        data: { id: changeRequestId, raw_response: responseText }
      }
    }

    console.log('[Change Request DELETE] Change request deleted successfully', {
      changeRequestId,
      hasData: !!responseData
    });

    // Return the response data
    return {
      success: true,
      message: 'Change request deleted successfully',
      status: 200,
      data: responseData
    }

  } catch (error) {
    console.error('[Change Request DELETE] Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
      status: 500,
      error: error instanceof Error ? error.stack : String(error)
    }
  }
})
