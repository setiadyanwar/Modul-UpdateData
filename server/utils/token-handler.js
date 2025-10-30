// Utility function to check if response indicates token expired
export const isTokenExpiredResponse = (responseData) => {
  return responseData?.data?.error_code === 'TOKEN_EXPIRED' ||
         responseData?.data?.status === 401 ||
         responseData?.action === 'refresh_token' ||
         responseData?.data?.action === 'refresh_token' ||
         responseData?.message?.toLowerCase().includes('token expired') ||
         responseData?.message?.toLowerCase().includes('access token expired')
}

// Utility function to handle token expired response
export const handleTokenExpiredResponse = (responseText, responseStatus) => {
  // Try to parse error response
  let errorData
  try {
    errorData = JSON.parse(responseText)
  } catch {
    errorData = { message: responseText || 'Unknown error' }
  }

  console.log('[Token Handler] Error response:', {
    status: responseStatus,
    errorData
  });

  // Check if token expired
  if (isTokenExpiredResponse(errorData)) {
    return {
      success: false,
      message: errorData.message || 'Access token expired. Please refresh your token or login again.',
      status: 401,
      data: errorData
    }
  }

  return {
    success: false,
    message: errorData.message || `API request failed with status ${responseStatus}`,
    status: responseStatus,
    data: errorData
  }
}
