import { defineEventHandler, getQuery, getHeaders } from 'h3'
import envConfig from '~/config/environment.js';
import { handleTokenExpiredResponse } from '~/server/utils/token-handler';
import { logger } from '~/utils/logger';

export default defineEventHandler(async (event) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 15);

  console.log('[Change Request GET] Change request list endpoint called', {
    requestId,
    timestamp: new Date().toISOString()
  });

  try {
    const query = getQuery(event)
    const headers = getHeaders(event)

    // Auth header
    const authHeader = headers.authorization || headers.Authorization
    if (!authHeader) {
      console.error('[Change Request GET] No authorization header found', {
        requestId
      });
      return { success: false, message: 'Authorization header is required', status: 401 }
    }

    const apiBaseUrl = envConfig?.API_BASE_URL || process.env.API_BASE_URL || 'https://apigwsand.telkomsigma.co.id/essbe'
    const searchParams = new URLSearchParams()
    Object.entries(query).forEach(([k, v]) => {
      if (v != null) searchParams.append(k, String(v))
    })
    const qs = searchParams.toString()
    const targetUrl = `${apiBaseUrl}/employee/change-request${qs ? `?${qs}` : ''}`

    console.log('[Change Request GET] Calling API', {
      requestId,
      targetUrl,
      hasQuery: qs.length > 0
    });

    const apiHeaders = {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    }

    logger.apiRequest('GET', targetUrl, {
      module: 'CHANGE_REQUEST_LIST',
      requestId,
      userId: headers['x-user-id']
    });

    const resp = await fetch(targetUrl, { method: 'GET', headers: apiHeaders })
    const text = await resp.text()
    const duration = Date.now() - startTime;

    console.log('[Change Request GET] API response received', {
      requestId,
      status: resp.status,
      duration: `${duration}ms`
    });

    logger.apiResponse('GET', targetUrl, resp.status, duration, {
      module: 'CHANGE_REQUEST_LIST',
      requestId,
      userId: headers['x-user-id']
    });

    let data
    try {
      data = text ? JSON.parse(text) : {}
    } catch (parseError) {
      console.warn('[Change Request GET] Failed to parse API response as JSON', {
        requestId,
        responseText: text?.substring(0, 200)
      });
      logger.warn('Failed to parse API response as JSON', {
        module: 'CHANGE_REQUEST_LIST',
        action: 'JSON_PARSE_ERROR',
        requestId
      }, { responseText: text });
      data = {}
    }

    const isTokenExpired = data?.data?.error_code === 'TOKEN_EXPIRED' ||
                           data?.data?.status === 401 ||
                           data?.action === 'refresh_token' ||
                           data?.data?.action === 'refresh_token'

    if (!resp.ok || isTokenExpired) {
      console.error('[Change Request GET] API request failed', {
        requestId,
        status: resp.status,
        isTokenExpired,
        response: text?.substring(0, 200)
      });

      logger.apiError('GET', targetUrl, {
        message: 'API request failed',
        statusCode: resp.status,
        response: {
          status: resp.status,
          body: text
        }
      }, {
        module: 'CHANGE_REQUEST_LIST',
        requestId,
        userId: headers['x-user-id']
      });

      return handleTokenExpiredResponse(text, resp.status)
    }

    // Normalize to array for frontend (handle multiple possible shapes)
    let list = []
    try {
      const dd = (data && (data.data !== undefined ? data.data : data))
      if (Array.isArray(dd)) {
        list = dd
      } else if (dd && typeof dd === 'object') {
        const candidates = [
          dd.items,
          dd.content,
          dd.records,
          dd.results,
          dd.list,
          dd.data, // nested data
        ]
        for (const c of candidates) {
          if (Array.isArray(c)) { list = c; break }
        }
      }
      if (!Array.isArray(list)) list = []
    } catch {
      list = []
    }

    console.log('[Change Request GET] Change request list retrieved successfully', {
      requestId,
      itemCount: list.length,
      duration: `${duration}ms`
    });

    logger.info('Change request list retrieved successfully', {
      module: 'CHANGE_REQUEST_LIST',
      action: 'SUCCESS',
      requestId,
      userId: headers['x-user-id'],
      duration
    }, {
      itemCount: list.length,
      hasRawData: !!data
    });

    return { success: true, status: 200, data: list, raw: data }
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error('[Change Request GET] Unexpected error', {
      requestId,
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : String(error)
    });

    logger.error('Unexpected error in change request list endpoint', error, {
      module: 'CHANGE_REQUEST_LIST',
      action: 'UNEXPECTED_ERROR',
      requestId,
      duration
    });

    // Soft-fail: return empty list so UI can still render
    return { success: true, status: 200, data: [], raw: { error: String(error) } }
  }
})
