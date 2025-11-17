import { $fetch } from 'ofetch';
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

    const response = await $fetch(`${apiBaseUrl}/auth/ticket-exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: {
        ticket: ticket
      }
    });

    console.log('[Ticket Exchange API] Backend response received');

    // Return response to client
    return response;

  } catch (error) {
    console.error('[Ticket Exchange API] Error:', {
      status: error.status,
      statusCode: error.statusCode,
      message: error.message,
      data: error.data
    });

    throw createError({
      statusCode: error.status || error.statusCode || 500,
      statusMessage: error.message || 'Ticket exchange failed',
      data: error.data
    });
  }
});
