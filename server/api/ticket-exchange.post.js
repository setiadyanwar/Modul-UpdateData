import envConfig from '~/config/environment';

/**
 * Ticket Exchange API
 * Exchanges SSO ticket for access token
 */
export default defineEventHandler(async (event) => {
  console.log('[Ticket Exchange API] Request received');

  try {
    // Get ticket from request body
    const body = await readBody(event);
    const { ticket } = body;

    if (!ticket) {
      console.error('[Ticket Exchange API] Missing ticket parameter');
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing ticket parameter'
      });
    }

    console.log('[Ticket Exchange API] Ticket:', ticket.substring(0, 20) + '...');

    // Get API base URL from environment config
    const apiBaseUrl = envConfig.API_BASE_URL;

    // Exchange ticket with backend
    console.log('[Ticket Exchange API] Calling backend:', `${apiBaseUrl}/auth/ticket-exchange`);

    // Use fetch directly to properly handle response status codes
    const response = await fetch(`${apiBaseUrl}/auth/ticket-exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        ticket: ticket
      })
    });

    const responseStatus = response.status;
    console.log('[Ticket Exchange API] Backend response status:', responseStatus);

    // Set CORS headers first
    setResponseHeaders(event, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    });

    // Set the response status code from API (before processing body)
    setResponseStatus(event, responseStatus);

    // Get response data
    let responseData;
    const responseContentType = response.headers.get('content-type');

    if (responseContentType && responseContentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      try {
        responseData = JSON.parse(text);
      } catch (e) {
        // If it's an error status, forward the error properly
        if (responseStatus >= 400) {
          responseData = {
            status: false,
            message: response.statusText || 'Ticket exchange failed',
            error: text.substring(0, 500),
            statusCode: responseStatus
          };
        } else {
          throw createError({
            statusCode: 502,
            statusMessage: 'Backend returned non-JSON response',
            data: { preview: text.substring(0, 500) }
          });
        }
      }
    }

    return responseData;

  } catch (error) {
    console.error('[Ticket Exchange API] Error:', {
      status: error.status,
      statusCode: error.statusCode,
      message: error.message,
      data: error.data
    });

    throw createError({
      statusCode: error.statusCode || error.status || 500,
      statusMessage: error.message || 'Ticket exchange failed',
      data: error.data
    });
  }
});
