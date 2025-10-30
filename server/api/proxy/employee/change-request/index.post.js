import { defineEventHandler, readBody, getQuery, getHeaders } from 'h3'
import envConfig from '~/config/environment.js';
import { handleTokenExpiredResponse } from '~/server/utils/token-handler';

export default defineEventHandler(async (event) => {
  console.log('[Change Request POST] Create change request endpoint called', {
    timestamp: new Date().toISOString()
  });

  try {
    // Get request body
    const body = await readBody(event)

    console.log('[Change Request POST] Request body received', {
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
      console.error('[Change Request POST] No authorization header found');
      return {
        success: false,
        message: 'Authorization header is required',
        status: 401
      }
    }


    // API base URL from environment
    const apiBaseUrl = envConfig?.API_BASE_URL || process.env.API_BASE_URL || 'https://apigwsand.telkomsigma.co.id/essbe'

    // Build target URL for the real API
    const targetUrl = `${apiBaseUrl}/employee/change-request`

    console.log('[Change Request POST] Calling API', {
      targetUrl,
      method: 'POST'
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
      method: 'POST',
      headers: apiHeaders,
      body: JSON.stringify(body)
    })

    console.log('[Change Request POST] API response received', {
      status: response.status,
      statusText: response.statusText
    });

    // Check if response is successful
    // Also check for token expired in response body even if HTTP status is 200
    const responseText = await response.text()

    // Try to parse response to check for token expired
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
      console.error('[Change Request POST] API request failed', {
        status: response.status,
        isTokenExpired,
        response: responseText?.substring(0, 200)
      });

      // Smart fallback: if 409 conflict due to existing draft and we meant to submit, auto-upgrade via PUT
      if (response.status === 409) {
        try {
          const parsed = responseText ? JSON.parse(responseText) : {}
          const existingId = parsed?.data?.existing_request?.id || parsed?.existing_request?.id
          const intendedSubmit = Boolean((body && (body.submit === true)) || (body?.new_data && body?.submit === true))

          console.log('[Change Request POST] Handling 409 conflict', {
            existingId,
            intendedSubmit
          });

          if (existingId && intendedSubmit) {

            // Ensure submit is true in forwarded body
            const putBody = { ...(body || {}), submit: true }

            const putUrl = `${apiBaseUrl}/employee/change-request/${existingId}`

            console.log('[Change Request POST] Auto-upgrading to PUT', {
              putUrl,
              existingId
            });

            const putResp = await fetch(putUrl, {
              method: 'PUT',
              headers: apiHeaders,
              body: JSON.stringify(putBody)
            })

            const putText = await putResp.text()

            console.log('[Change Request POST] PUT response received', {
              status: putResp.status
            });

            if (!putResp.ok) {
              return handleTokenExpiredResponse(putText, putResp.status)
            }

            let putData
            try { putData = putText ? JSON.parse(putText) : {} } catch { putData = {} }

            console.log('[Change Request POST] Change request submitted by updating existing draft', {
              existingId
            });

            return {
              success: true,
              message: 'Change request submitted by updating existing draft',
              status: 200,
              data: putData
            }
          }
        } catch (e) {
          console.error('[Change Request POST] Error handling 409 conflict', {
            error: e instanceof Error ? e.message : String(e)
          });
        }
      }

      return handleTokenExpiredResponse(responseText, response.status)
    }

    // Parse successful response (responseData already parsed above)
    try {
      // responseData already parsed above, just validate it's not empty
      if (!responseData || Object.keys(responseData).length === 0) {
        // If response is empty, return success with empty data
        console.log('[Change Request POST] Empty response, returning success with pending ID');
        return {
          success: true,
          message: 'Change request created successfully',
          status: 200,
          data: { id: 'pending' }
        }
      }
    } catch (e) {
      // If response is empty or not JSON, return error
      if (responseText.trim() === '') {
        console.error('[Change Request POST] Empty response from API');
        return {
          success: false,
          message: 'Empty response from API',
          status: 500
        }
      }
      // If response is not JSON but has content, return as text
      console.warn('[Change Request POST] Non-JSON response', {
        response: responseText?.substring(0, 100)
      });
      return {
        success: true,
        message: 'Change request created successfully',
        status: 200,
        data: { raw_response: responseText }
      }
    }

    console.log('[Change Request POST] Change request created successfully', {
      hasData: !!responseData
    });

    // Return the response data
    return {
      success: true,
      message: 'Change request created successfully',
      status: 200,
      data: responseData
    }

  } catch (error) {
    console.error('[Change Request POST] Unexpected error', {
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
