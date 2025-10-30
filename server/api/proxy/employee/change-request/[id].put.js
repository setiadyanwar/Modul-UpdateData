import { defineEventHandler, readBody, getQuery, getHeaders } from 'h3'
import envConfig from '~/config/environment.js';
import { handleTokenExpiredResponse } from '~/server/utils/token-handler';

export default defineEventHandler(async (event) => {
  console.log('[Change Request PUT] Update change request endpoint called', {
    timestamp: new Date().toISOString()
  });

  try {
    // Get change request ID from URL params
    const changeRequestId = event.context.params?.id
    if (!changeRequestId) {
      console.error('[Change Request PUT] No change request ID provided');
      return {
        success: false,
        message: 'Change request ID is required',
        status: 400
      }
    }

    console.log('[Change Request PUT] Processing request', {
      changeRequestId
    });

    // Get request body
    const body = await readBody(event)

    console.log('[Change Request PUT] Request body received', {
      changeRequestId,
      hasBody: !!body,
      bodyKeys: body ? Object.keys(body) : [],
      submit: body?.submit
    });

    // Get query parameters
    const query = getQuery(event)

    // Get headers
    const headers = getHeaders(event)

    // Extract authorization token
    const authHeader = headers.authorization || headers.Authorization
    if (!authHeader) {
      console.error('[Change Request PUT] No authorization header found', {
        changeRequestId
      });
      return {
        success: false,
        message: 'Authorization header is required',
        status: 401
      }
    }


    // API base URL from environment
    const apiBaseUrl = envConfig?.API_BASE_URL || process.env.API_BASE_URL || 'https://apigwsand.telkomsigma.co.id/essbe'

    // Build target URL for the real API
    const targetUrl = `${apiBaseUrl}/employee/change-request/${changeRequestId}`

    console.log('[Change Request PUT] Calling API', {
      targetUrl,
      changeRequestId,
      method: 'PUT'
    });

    // Prepare headers for the real API call
    const apiHeaders = {
      'Content-Type': 'application/json',
      'Authorization': authHeader
    }

    // Add any additional headers that might be needed
    if (headers['x-request-id']) apiHeaders['X-Request-ID'] = headers['x-request-id']
    if (headers['user-agent']) apiHeaders['User-Agent'] = headers['user-agent']


    // Make the actual API call to the real backend
    const response = await fetch(targetUrl, {
      method: 'PUT',
      headers: apiHeaders,
      body: JSON.stringify(body)
    })

    console.log('[Change Request PUT] API response received', {
      status: response.status,
      statusText: response.statusText,
      changeRequestId
    });

    // Get response text first
    const responseText = await response.text()

    // Check if response is successful
    // Also check for token expired in response body even if HTTP status is 200
    let responseData
    try {
      responseData = responseText ? JSON.parse(responseText) : {}
    } catch (e) {
      responseData = {}
    }

    // Check for token expired in response body
    const isTokenExpired = responseData?.data?.error_code === 'TOKEN_EXPIRED' ||
                          responseData?.data?.status === 401 ||
                          responseData?.action === 'refresh_token' ||
                          responseData?.data?.action === 'refresh_token'

    if (!response.ok || isTokenExpired) {
      console.error('[Change Request PUT] API request failed', {
        status: response.status,
        isTokenExpired,
        changeRequestId,
        response: responseText?.substring(0, 200)
      });

      return handleTokenExpiredResponse(responseText, response.status)
    }

    // Parse successful response (responseData already parsed above)
    try {
      // responseData already parsed above, just validate it's not empty
      if (!responseData || Object.keys(responseData).length === 0) {
        // If response is empty, return success with empty data
        console.log('[Change Request PUT] Empty response, returning success', {
          changeRequestId
        });
        return {
          success: true,
          message: 'Change request updated successfully',
          status: 200,
          data: { id: changeRequestId }
        }
      }
    } catch (e) {
      // If response is empty or not JSON, return success with empty data
      if (responseText.trim() === '') {
        console.log('[Change Request PUT] Empty response text, returning success', {
          changeRequestId
        });
        return {
          success: true,
          message: 'Change request updated successfully',
          status: 200,
          data: { id: changeRequestId }
        }
      }
      // If response is not JSON but has content, return as text
      console.warn('[Change Request PUT] Non-JSON response', {
        changeRequestId,
        response: responseText?.substring(0, 100)
      });
      return {
        success: true,
        message: 'Change request updated successfully',
        status: 200,
        data: { id: changeRequestId, response: responseText }
      }
    }

    console.log('[Change Request PUT] Change request updated successfully', {
      changeRequestId,
      hasData: !!responseData
    });

    // Return the response data
    return {
      success: true,
      message: 'Change request updated successfully',
      status: 200,
      data: responseData
    }

  } catch (error) {
    console.error('[Change Request PUT] Unexpected error', {
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
