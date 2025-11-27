import { ref } from 'vue'
import { useApi } from './useApi'

export const useAttachments = () => {
  const { apiGet } = useApi()
  const isUploading = ref(false)
  const uploadProgress = ref(0)
  const isLoadingPreview = ref(false)
  const isLoadingInfo = ref(false)
  const uploadError = ref(null)

  // File type validation
  const validateFile = (file) => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'application/pdf'
    ]
    
  const maxSize = 25 * 1024 * 1024 // 25MB
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed types: png, jpg, jpeg, pdf. Received: ${file.type}`)
    }
    
    if (file.size > maxSize) {
      throw new Error(`File size exceeds the 25 MB limit. File size: ${formatFileSize(file.size)}. Please compress or split the file.`)
    }
    
    return true
  }

  // Upload attachment to change request
  const uploadAttachment = async (changeRequestId, file, documentTypes = [], onProgress = null, extraFields = null) => {
    try {
      isUploading.value = true
      uploadProgress.value = 0
      uploadError.value = null

      // Validate changeRequestId - ensure it's not an invalid string like "ation"
      if (typeof changeRequestId === 'string') {
        const invalidStrings = ['ation', 'information', 'validation', 'creation', 'submission', 'action'];
        if (invalidStrings.includes(changeRequestId.toLowerCase()) || changeRequestId.length < 3) {
          throw new Error(`Invalid change request ID: ${changeRequestId}. Please ensure the change request was created successfully.`)
        }
      }

      // Validate file first
      validateFile(file)

      // Get auth token
      let token = null
      if (process.client) {
        try {
          const { useAuth } = await import('~/composables/useAuth')
          const { getValidAccessToken } = useAuth()
          token = await getValidAccessToken()
        } catch {
          token = localStorage.getItem('access_token') || localStorage.getItem('auth-token') || localStorage.getItem('token')
        }
      }

      if (!token) {
        throw new Error('No authentication token available')
      }

      // Build FormData with proper file handling
      const formData = new FormData()
      
      // Ensure file is properly handled
      if (!(file instanceof File)) {
        throw new Error('Invalid file object provided')
      }
      
  // debug logs removed in production
      
      // Append file with original name to prevent corruption
      formData.append('file', file, file.name)
      
      // Add document type (API expects singular 'document_type', not array)
      if (documentTypes && documentTypes.length > 0) {
        // Use the first document type (normalize to number if possible)
        const rawCode = documentTypes[0]
        const numericCode = typeof rawCode === 'string' ? parseInt(rawCode, 10) : rawCode
        const codeToSend = Number.isFinite(numericCode) ? numericCode : 8
        formData.append('document_type', codeToSend)
  // debug logs removed in production
      } else {
        // Default document type if none provided (use master-data code for 'Other')
        formData.append('document_type', 7)
  // debug logs removed in production
      }

      // Optional extra fields (e.g., client_key for education)
      if (extraFields && typeof extraFields === 'object') {
        if (extraFields.client_key) {
          formData.append('client_key', extraFields.client_key)
        }
      }
      
      // Debug FormData contents
  // FormData entries are not logged in production

  // Use local proxy endpoint for change-request attachments (server will forward to real API)
  // Frontend should post to Nitro proxy route: /api/proxy/employee/change-request/:id/attachments
  const endpoint = `/api/proxy/employee/change-request/${changeRequestId}/attachments`
      
      // Debug logging for upload process
  // Starting file upload (debug logs removed)

      // Create XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100)
            uploadProgress.value = progress
            if (onProgress) onProgress(progress)
            
            // progress updates are available via onProgress callback
          }
        })

        xhr.addEventListener('load', () => {
          try {
            // Upload response received (details suppressed)
            
            // Handle empty response
            if (!xhr.responseText) {
              // Empty response received from upload (suppressed)
              uploadError.value = 'Server returned empty response'
              reject(new Error('Server returned empty response'))
              return
            }
            
            const response = JSON.parse(xhr.responseText)
            // Parsed response (details suppressed)
            
            // Handle specific error status codes with user-friendly messages
            if (xhr.status === 400) {
              const errorMsg = response.data?.originalMessage || response.message || 'File validation failed'
              // validation error handled
              uploadError.value = errorMsg
              reject(new Error(errorMsg))
              return
            }
            
            if (xhr.status === 413) {
              const errorMsg = response.data?.originalMessage || response.message || 'File size exceeds 25MB limit'
              // file too large handled
              uploadError.value = errorMsg
              reject(new Error(errorMsg))
              return
            }
            
            if (xhr.status === 422) {
              const errorMsg = response.data?.originalMessage || response.message || 'Unsupported file type - only PNG, JPG, JPEG, PDF allowed'
              // unsupported file type handled
              uploadError.value = errorMsg
              reject(new Error(errorMsg))
              return
            }
            
            // More flexible success condition - accept multiple status patterns
            const isHttpSuccess = xhr.status >= 200 && xhr.status < 300
            const isResponseSuccess = response.status === true || response.success === true || xhr.status === 200
            
            if (isHttpSuccess && isResponseSuccess) {
              // upload success
              
              // Extract item_id from response - try multiple possible locations
              let itemId = response.data?.item_id || response.data?.spacebox_item_id || response.item_id;
              // Try to extract client_key if backend returns it
              let clientKey = response.data?.client_key;
              if (!clientKey && response.data?.attachment_records && Array.isArray(response.data.attachment_records)) {
                clientKey = response.data.attachment_records[0]?.client_key;
              }
              
              // Check if item_id is in attachment_records array (new format)
              if (!itemId && response.data?.attachment_records && Array.isArray(response.data.attachment_records)) {
                itemId = response.data.attachment_records[0]?.item_id;
                // item_id extracted from attachment_records
              }
              
              // final item_id
              
              resolve({
                success: true,
                data: {
                  ...(response.data || {}),
                  item_id: itemId,
                  spacebox_item_id: itemId, // For backward compatibility
                  client_key: clientKey
                },
                message: response.message || 'Upload completed successfully'
              })
            } else {
              // upload failed (details suppressed)
              
              // Extract error message with fallback
              const errorMsg = response.data?.originalMessage || response.message || response.error || `HTTP ${xhr.status}: Upload failed`
              uploadError.value = errorMsg
              reject(new Error(errorMsg))
            }
          } catch (error) {
            // parse error (suppressed)
            const parseError = `Failed to parse server response: ${error.message}`
            uploadError.value = parseError
            reject(new Error(parseError))
          }
        })

        xhr.addEventListener('error', () => {
          // network error during upload
          reject(new Error('Network error during upload'))
        })

        xhr.addEventListener('timeout', () => {
          // upload timeout
          reject(new Error('Upload timeout - file may be too large or connection is slow'))
        })

        xhr.addEventListener('loadstart', () => {
          // upload started
        })

        xhr.addEventListener('loadend', () => {
          // upload ended
        })

        // Setup request
        xhr.open('POST', endpoint)
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        
        // Dynamic timeout based on file size: 2 min base + 30s per MB
        const fileSizeMB = file.size / (1024 * 1024)
        const timeoutMs = Math.max(120000, 120000 + (fileSizeMB * 30000)) // Min 2 minutes, +30s per MB
        xhr.timeout = timeoutMs
        // Timeout is dynamic based on file size
        
        // Send request
        xhr.send(formData)
      })

    } catch (error) {
      uploadError.value = error.message
      throw error
    } finally {
      isUploading.value = false
    }
  }

  // Upload multiple attachments sequentially (one HTTP POST per file)
  // Supports per-file progress callback and simple retry with backoff
  const uploadAttachmentsBatch = async (
    changeRequestId,
    files,
    getDocumentTypeCode = (/* index, file */) => '7',
    onPerFileProgress = null,
    options = {}
  ) => {
    const results = []
    const retry = options.retry ?? 2
    const baseDelayMs = options.baseDelayMs ?? 800

    for (let i = 0; i < files.length; i++) {
      const fileData = files[i]
      const fileObj = fileData.file || fileData // accept either { file, documentType } or File
      const docTypeCode = (typeof getDocumentTypeCode === 'function')
        ? getDocumentTypeCode(i, fileData)
        : (fileData.documentType || '7')

      let attempt = 0
      // Execute with retries
      let done = false
      while (!done) {
        try {
          const res = await uploadAttachment(
            changeRequestId,
            fileObj,
            [docTypeCode],
            (p) => {
              if (onPerFileProgress) onPerFileProgress(i, p)
            }
          )
          results.push({ index: i, success: true, response: res })
          done = true
        } catch (err) {
          attempt += 1
          if (attempt > retry) {
            results.push({ index: i, success: false, error: err.message })
            done = true
          }
          // Exponential backoff before retrying this file
          const delay = baseDelayMs * Math.pow(2, attempt - 1)
          await new Promise((r) => setTimeout(r, delay))
        }
      }

      // Gentle pause between files to avoid server overload
      if (i < files.length - 1) {
        const size = (fileObj?.size || 0)
        const pause = size > 1024 * 1024 ? 1200 : 600 // 1.2s for >1MB else 0.6s
        await new Promise((r) => setTimeout(r, pause))
      }
    }

    return results
  }

  // Dry-run helper: build FormData and return a serializable preview (no network)
  const buildAttachmentFormPreview = async (changeRequestId, file, documentTypes = [], options = {}) => {
    // Validate basic inputs
    if (!changeRequestId) throw new Error('changeRequestId is required')
    if (!file) throw new Error('file is required')

    // Choose document type (first provided or fallback to '7')
    const docType = (documentTypes && documentTypes.length > 0) ? documentTypes[0] : '7'

    // Build a preview object instead of real FormData (File can't be serialized)
    const preview = {
      endpoint: `/employee/attachments/change-request/${changeRequestId}`,
      note: 'This endpoint uses the id_change_req from submit response',
      fields: [
        { key: 'file', valueType: 'File', fileName: file.name, fileSize: file.size, mimeType: file.type },
        { key: 'document_type', valueType: 'String', value: docType }
      ],
      optional: {}
    }

    if (options.name) preview.optional.name = options.name
    if (options.description) preview.optional.description = options.description

    return preview
  }

  // Get attachment preview URL
  const getPreviewUrl = async (itemId) => {
    try {
      isLoadingPreview.value = true
      // If itemId contains comma (format: parent_id,item_id), extract only item_id
      const actualItemId = itemId && itemId.includes(',') ? itemId.split(',')[1].trim() : itemId
      const response = await apiGet(`/employee/attachments/${actualItemId}/preview`)
      
      if (response.status && response.data) {
        return {
          success: true,
          previewUrl: response.data.preview_link,
          itemId: response.data.item_id,
          employeeId: response.data.employee_id
        }
      } else {
        throw new Error(response.message || 'Failed to get preview URL')
      }
    } catch (error) {
      throw new Error(`Failed to get preview: ${error.message}`)
    } finally {
      isLoadingPreview.value = false
    }
  }

  // Get attachment download URL
  const getDownloadUrl = (itemId) => {
    // If itemId contains comma (format: parent_id,item_id), extract only item_id
    const actualItemId = itemId && itemId.includes(',') ? itemId.split(',')[1].trim() : itemId
    // Return direct download endpoint URL
    return `/api/proxy/employee/attachments/${actualItemId}/download`
  }

  // Download attachment file
  const downloadAttachment = async (itemId, fileName = 'download') => {
    try {
      // Get auth token
      let token = null
      if (process.client) {
        try {
          const { useAuth } = await import('~/composables/useAuth')
          const { getValidAccessToken } = useAuth()
          token = await getValidAccessToken()
        } catch {
          token = localStorage.getItem('access_token') || localStorage.getItem('auth-token') || localStorage.getItem('token')
        }
      }

      if (!token) {
        throw new Error('No authentication token available')
      }

      // If itemId contains comma (format: parent_id,item_id), extract only item_id
      const actualItemId = itemId && itemId.includes(',') ? itemId.split(',')[1].trim() : itemId
      const endpoint = `/api/proxy/employee/attachments/${actualItemId}/download`
      
      // Use fetch to download file
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`)
      }

      // Get file blob
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      return { success: true }
    } catch (error) {
      throw new Error(`Download failed: ${error.message}`)
    }
  }

  // Get attachment information
  const getAttachmentInfo = async (itemId) => {
    try {
      isLoadingInfo.value = true
      // If itemId contains comma (format: parent_id,item_id), extract only item_id
      const actualItemId = itemId && itemId.includes(',') ? itemId.split(',')[1].trim() : itemId
      const response = await apiGet(`/employee/attachments/${actualItemId}/information`)
      
      if (response && (response.item_id || response.data)) {
        // Handle both direct response and wrapped response
        const data = response.data || response
        return {
          success: true,
          info: {
            itemId: data.item_id,
            name: data.name,
            size: data.size,
            sizeDisplay: formatFileSize(data.size),
            createdDate: data.created_date,
            modifiedDate: data.modified_date,
            mimeType: data.mime_type,
            employeeId: data.employee_id,
            parentFolder: data.parent_folder,
            webUrl: data.web_url
          }
        }
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      throw new Error(`Failed to get attachment info: ${error.message}`)
    } finally {
      isLoadingInfo.value = false
    }
  }

  // Helper to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  // Helper to get file icon based on type
  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return 'pi-image'
    if (mimeType === 'application/pdf') return 'pi-file-pdf'
    return 'pi-file'
  }

  // Helper to check if file can be previewed
  const canPreview = (mimeType) => {
    const previewableTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/pdf'
    ]
    return previewableTypes.includes(mimeType)
  }

  return {
    // State
    isUploading,
    uploadProgress,
    isLoadingPreview,
    isLoadingInfo,
    uploadError,

    // Methods
    uploadAttachment,
  uploadAttachmentsBatch,
  buildAttachmentFormPreview,
    getPreviewUrl,
    getDownloadUrl,
    downloadAttachment,
    getAttachmentInfo,
    validateFile,

    // Helpers
    formatFileSize,
    getFileIcon,
    canPreview
  }
}
