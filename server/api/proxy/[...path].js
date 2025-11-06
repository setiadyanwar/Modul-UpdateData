import envConfig from '~/config/environment';
import { $fetch } from 'ofetch';
import {
  defineEventHandler,
  getQuery,
  setResponseHeaders,
  readBody,
} from 'h3';

export default defineEventHandler(async (event) => {
  const method = event.method;

  // Basic CORS for local development
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  });

  if (method === 'OPTIONS') {
    return 'OK';
  }

  // Param after /api/proxy/
  let path = event.context.params?.path || '';
  if (Array.isArray(path)) path = path.join('/');

  const query = getQuery(event) || {};
  const queryString = new URLSearchParams(query).toString();
  const endpoint = queryString ? `/${path}?${queryString}` : `/${path}`;

  // Optional Authorization: do NOT require it (ticket login doesn't have one)
  const incomingAuth = event.req.headers['authorization'];

  // Prepare headers
  const headers = {
    Accept: 'application/json',
  };
  if (incomingAuth) headers['Authorization'] = incomingAuth;

  // Body for mutating methods
  let body = null;
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    body = await readBody(event).catch(() => null);
    if (body && typeof body === 'object') {
      headers['Content-Type'] = 'application/json';
    }
  }

  const baseURL = envConfig.API_BASE_URL || process.env.API_BASE_URL;

  try {
    const response = await $fetch(endpoint, {
      method,
      baseURL,
      headers,
      body,
      ignoreResponseError: true,
    });
    return response;
  } catch (error) {
    throw createError({
      statusCode: error.status || error.statusCode || 500,
      statusMessage: error.message || 'Proxy request failed',
      data: error.data
    });
  }
});
