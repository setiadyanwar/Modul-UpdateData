// Utility functions for text formatting to prevent overflow

// Format value for display
export const formatValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'Not set'
  }
  
  if (typeof value === 'object') {
    // For objects, try to extract meaningful display value
    if (Array.isArray(value)) {
      return value.length > 0 ? `${value.length} items` : 'Empty array'
    }
    
    // For address objects, format nicely
    if (value.province || value.city || value.street_name) {
      const parts = []
      if (value.street_name) parts.push(value.street_name)
      if (value.city) parts.push(value.city)
      if (value.province) parts.push(value.province)
      if (value.postal_code) parts.push(value.postal_code)
      return parts.join(', ')
    }
    
    // For other objects, show as JSON
    return JSON.stringify(value)
  }
  
  const stringValue = String(value)
  
  // Handle long URLs and file paths
  if (isUrl(stringValue) || isFilePath(stringValue)) {
    return truncateUrl(stringValue)
  }
  
  // Handle long text
  if (stringValue.length > 50) {
    return stringValue.substring(0, 50) + '...'
  }
  
  return stringValue
}

// Get full value for tooltip
export const getFullValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'Not set'
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  
  return String(value)
}

// Check if string is a URL
export const isUrl = (str) => {
  return str.startsWith('http://') || str.startsWith('https://') || str.startsWith('//')
}

// Check if string is a file path
export const isFilePath = (str) => {
  return str.includes('/') || str.includes('\\') || str.includes('.')
}

// Truncate URL for display
export const truncateUrl = (url) => {
  try {
    const urlObj = new URL(url)
    const domain = urlObj.hostname
    const path = urlObj.pathname
    const filename = path.split('/').pop()
    
    if (filename && filename.length > 0) {
      return `${domain}/.../${filename}`
    }
    
    return `${domain}${path.length > 20 ? '/...' : path}`
  } catch {
    // If URL parsing fails, truncate manually
    if (url.length > 50) {
      return url.substring(0, 30) + '...' + url.substring(url.length - 20)
    }
    return url
  }
}

// Truncate file name for display with middle truncation
export const truncateFileName = (fileName, maxLength = 20) => {
  if (!fileName || fileName.length <= maxLength) {
    return fileName
  }
  
  const extension = fileName.split('.').pop()
  const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'))
  
  if (extension && extension.length < 10) {
    const availableLength = maxLength - extension.length - 3 // 3 for "..."
    if (nameWithoutExt.length <= availableLength) {
      return fileName
    }
    
    // Truncate in the middle
    const firstPart = Math.floor(availableLength / 2)
    const lastPart = availableLength - firstPart
    return nameWithoutExt.substring(0, firstPart) + '...' + nameWithoutExt.substring(nameWithoutExt.length - lastPart) + '.' + extension
  }
  
  // No extension, truncate in the middle
  const firstPart = Math.floor((maxLength - 3) / 2)
  const lastPart = maxLength - 3 - firstPart
  return fileName.substring(0, firstPart) + '...' + fileName.substring(fileName.length - lastPart)
}

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
