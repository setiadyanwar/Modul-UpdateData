import { ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useHybridRequestHistory } from '~/composables/useHybridRequestHistory'
import { useToast } from '~/composables/useToast'
import { useErrorHandler } from '~/composables/useErrorHandler'

export function useEditPageApi() {
  const { apiGet, apiPost } = useApi()
  const { success: toastSuccess, error: toastError } = useToast()
  const { updateDraftData, updateDraftToWaitingApproval, getRequestById } = useHybridRequestHistory()
  const { handleError, createCustomError, withErrorHandling, ERROR_TYPES } = useErrorHandler()

  const isSubmitting = ref(false)
  const isLoadingDetail = ref(false)
  const isLoadingCategoryData = ref(false)

  // Helper function to handle network errors with user-friendly messages
  const handleNetworkError = async (error, context) => {
    const errorMessage = error?.message || ''

    // Check for specific network-related errors
    if (errorMessage.includes('fetch failed') ||
        errorMessage.includes('network') ||
        errorMessage.includes('connection') ||
        error?.code === 'NETWORK_ERR' ||
        error?.status === 0) {

      // Create custom network error with VPN guidance
      const networkError = createCustomError('NETWORK',
        'Connection failed. This might be due to:\n• VPN connection issues\n• Network connectivity problems\n• Server maintenance\n\nPlease check your VPN connection and try again.',
        'Network Connection Error'
      )

      await handleError(networkError, context)
      return true
    }

    // Handle other API errors normally
    await handleError(error, context)
    return false
  }

  const loadRequestDetail = async (requestId) => {
    if (!requestId) return null

    try {
      isLoadingDetail.value = true

      // Try to get from hybrid request history first
      const response = await getRequestById(requestId)

      if (response) {
        // If response is already the data object (not wrapped)
        if (response.id || response.request_id || response.request_code) {
          return response
        }

        // If response has data property
        if (response.data) {
          return response.data
        }
      }

      // Fallback: try direct API call
      try {
        const directResponse = await apiGet(`/employee/change-request/${requestId}`)

        if (directResponse && directResponse.status && directResponse.data &&
            typeof directResponse.data === 'object' &&
            !directResponse.data.message?.includes('DOCTYPE') &&
            !directResponse.data.message?.includes('<html>')) {

          // The actual data is nested at directResponse.data.data (triple nested!)
          const actualData = directResponse.data.data

          // Return the ACTUAL data object (the deeply nested one)
          return actualData
        } else {
        }
      } catch (apiError) {

        // Handle network/VPN specific errors
        await handleNetworkError(apiError, 'loadRequestDetail')
      }

      return null
    } catch (error) {
      // console.error('❌ Error loading request detail:', error)

      // Use global error handler with network error detection
      await handleNetworkError(error, 'Loading request detail')
      return null
    } finally {
      isLoadingDetail.value = false
    }
  }

  const loadCategoryData = async (category, requestId) => {
    if (!category || !requestId) return null

    try {
      isLoadingCategoryData.value = true

      const endpoint = `/employee/change-request/${requestId}/category/${category}`
      const response = await apiGet(endpoint)

      if (response && response.data) {
        return response.data
      }

      return null
    } catch (error) {
      // console.error(`❌ Error loading ${category} data:`, error)

      // Use global error handler with network error detection
      await handleNetworkError(error, `Loading ${category} data`)
      return null
    } finally {
      isLoadingCategoryData.value = false
    }
  }

  const saveAsDraft = async (requestId, formData, category) => {
    try {
      isSubmitting.value = true

      const payload = {
        request_id: requestId,
        category: category,
        data: formData
      }

      const response = await updateDraftData(payload)

      if (response && response.success) {
        toastSuccess('Draft saved successfully')
        return response
      }

      throw new Error(response?.message || 'Failed to save draft')
    } catch (error) {
      // console.error('❌ Error saving draft:', error)

      // Use global error handler for network issues
      const handled = await handleNetworkError(error, 'Saving draft')
      if (!handled) {
        toastError(error.message || 'Failed to save draft')
      }
      throw error
    } finally {
      isSubmitting.value = false
    }
  }

  const submitForApproval = async (requestId, formData, category) => {
    try {
      isSubmitting.value = true

      const payload = {
        request_id: requestId,
        category: category,
        data: formData,
        status: 'waiting_approval'
      }

      const response = await updateDraftToWaitingApproval(payload)

      if (response && response.success) {
        toastSuccess('Request submitted for approval')
        return response
      }

      throw new Error(response?.message || 'Failed to submit request')
    } catch (error) {
      // console.error('❌ Error submitting request:', error)
      toastError(error.message || 'Failed to submit request')
      throw error
    } finally {
      isSubmitting.value = false
    }
  }

  const submitChangeRequest = async (requestData) => {
    try {
      isSubmitting.value = true

      const response = await apiPost('/employee/change-request', requestData)

      if (response && response.data) {
        toastSuccess('Change request submitted successfully')
        return response.data
      }

      throw new Error(response?.message || 'Failed to submit change request')
    } catch (error) {
      // console.error('❌ Error submitting change request:', error)
      toastError(error.message || 'Failed to submit change request')
      throw error
    } finally {
      isSubmitting.value = false
    }
  }

  const insertRequest = async (insertData) => {
    try {
      isSubmitting.value = true

      const response = await apiPost('/employee/change-request/insert', insertData)

      if (response && response.data) {
        toastSuccess('Request inserted successfully')
        return response.data
      }

      throw new Error(response?.message || 'Failed to insert request')
    } catch (error) {
      // console.error('❌ Error inserting request:', error)
      toastError(error.message || 'Failed to insert request')
      throw error
    } finally {
      isSubmitting.value = false
    }
  }

  const editRequest = async (requestId, editData) => {
    try {
      isSubmitting.value = true

      const response = await apiPost(`/employee/change-request/${requestId}/edit`, editData)

      if (response && response.data) {
        toastSuccess('Request updated successfully')
        return response.data
      }

      throw new Error(response?.message || 'Failed to update request')
    } catch (error) {
      // console.error('❌ Error updating request:', error)
      toastError(error.message || 'Failed to update request')
      throw error
    } finally {
      isSubmitting.value = false
    }
  }

  const deleteDocument = async (documentId) => {
    try {
      const response = await apiPost('/employee/attachments/delete', {
        item_id: documentId
      })

      if (response && response.success) {
        toastSuccess('Document deleted successfully')
        return response
      }

      throw new Error(response?.message || 'Failed to delete document')
    } catch (error) {
      // console.error('❌ Error deleting document:', error)
      toastError(error.message || 'Failed to delete document')
      throw error
    }
  }

  return {
    // State
    isSubmitting,
    isLoadingDetail,
    isLoadingCategoryData,

    // Methods
    loadRequestDetail,
    loadCategoryData,
    saveAsDraft,
    submitForApproval,
    submitChangeRequest,
    insertRequest,
    editRequest,
    deleteDocument
  }
}