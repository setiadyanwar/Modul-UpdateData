import { defineEventHandler, getRouterParam, getHeaders, getQuery, createError, setResponseHeaders } from 'h3'
import envConfig from '~/config/environment.js'

/**
 * Download Employee Attachment by ID
 * Example: /api/proxy/employee/attachments/123/download
 */
export default defineEventHandler(async (event) => {
  try {
    // CORS and exposure headers
    setResponseHeaders(event, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Expose-Headers': 'Content-Disposition, Content-Type, Content-Length'
    })

    if (event.node.req.method === 'OPTIONS') {
      return new Response(null, { status: 200 })
    }

    const attachmentId = getRouterParam(event, 'id')

    console.log('[Attachment Download] Request:', { attachmentId })

    if (!attachmentId) {
      throw createError({ statusCode: 400, statusMessage: 'Attachment ID is required' })
    }

    const headers = getHeaders(event)
    const query = getQuery(event)
    const authFromQuery = typeof query.auth === 'string' ? query.auth : ''
    const authHeader = headers.authorization || authFromQuery
    if (!authHeader) {
      throw createError({ statusCode: 401, statusMessage: 'Authorization header is required' })
    }

    const apiBaseUrl = envConfig.API_BASE_URL || process.env.API_BASE_URL || 'https://apigwsand.telkomsigma.co.id/essbe'
    const endpointTemplate = envConfig.API_ENDPOINTS?.EMPLOYEE?.ATTACHMENTS?.DOWNLOAD || '/employee/attachments/{id}/download'
    const targetUrl = `${apiBaseUrl}${endpointTemplate.replace('{id}', attachmentId)}`

    console.log('[Attachment Download] Forwarding to:', targetUrl)

    // Fetch the file from backend with increased timeout for file downloads
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minute timeout for downloads

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'User-Agent': 'ESS-Sigma-Attachment-Download-Proxy/1.0'
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    console.log('[Attachment Download] Response:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Attachment Download] API Error:', errorText)

      throw createError({
        statusCode: response.status,
        statusMessage: `API request failed: ${response.statusText}`,
        data: { error: errorText }
      })
    }

    // Get headers for proper file handling
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const contentDisposition = response.headers.get('content-disposition') || `attachment; filename="document-${attachmentId}"`
    const contentLength = response.headers.get('content-length')

    // Set response headers
    setResponseHeaders(event, {
      'Content-Type': contentType,
      'Content-Disposition': contentDisposition,
      'Access-Control-Expose-Headers': 'Content-Disposition, Content-Type, Content-Length'
    })

    // Add content-length if available
    if (contentLength) {
      setResponseHeaders(event, {
        'Content-Length': contentLength
      })
    }

    // Stream the response instead of buffering everything in memory
    if (response.body) {
      // Return the readable stream directly for better memory usage
      return response.body
    } else {
      // Fallback to buffer if stream is not available
      const responseBuffer = await response.arrayBuffer()
      setResponseHeaders(event, {
        'Content-Length': responseBuffer.byteLength.toString()
      })
      return responseBuffer
    }
  } catch (error) {
    console.error('[Attachment Download] Error:', error)

    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error
    }

    // Handle timeout errors specifically
    if (error.name === 'AbortError') {
      throw createError({
        statusCode: 408,
        statusMessage: 'Download timeout - server took too long to respond'
      })
    }

    // Otherwise, wrap it
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error during attachment download',
      data: { originalError: error.message }
    })
  }
})
