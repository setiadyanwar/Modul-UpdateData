/**
 * Handles the raw network request for user login.
 * This abstracts the API boundary from the global authentication state manager.
 * 
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<any>} The raw API response
 */
export const performLoginRequest = async (email, password) => {
  const LOGIN_ENDPOINT = '/api/auth/login';
  
  return await $fetch(LOGIN_ENDPOINT, {
    method: 'POST',
    body: { email, password },
    headers: { 'Content-Type': 'application/json' }
  });
};

/**
 * Handles the SSO ticket exchange request.
 * 
 * @param {string} ticket 
 * @returns {Promise<any>} The raw API response
 */
export const performTicketLogin = async (ticket) => {
  const TICKET_LOGIN_ENDPOINT = '/api/auth/ticket/login';
  
  return await $fetch(TICKET_LOGIN_ENDPOINT, {
    method: 'POST',
    body: { ticket },
    headers: { 'Content-Type': 'application/json' }
  });
};
