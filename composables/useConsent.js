import { ref } from 'vue'
import { useApi } from './useApi'
import { useToast } from './useToast'

export const useConsent = () => {
  const { apiGet, apiPost, apiPut } = useApi()
  const { success, error: showError } = useToast()
  
  const consents = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // ADDED: Reactive references for consent popup functionality
  const activeConsents = ref([])
  const consentStatus = ref(null)
  const isLoadingConsents = ref(false)
  const isLoadingStatus = ref(false)
  const hasActiveConsent = ref(false)
  const isConsentApproved = ref(false)
  const latestConsent = ref(null)

  // Get list of consents
  const getConsents = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiGet('/employee/consents/list')
      
      if (response.success) {
        consents.value = response.data || []
        return response
      } else {
        throw new Error(response.message || 'Failed to fetch consents')
      }
    } catch (err) {
      error.value = err.message
      showError('Failed to load consents')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Create new consent
  const createConsent = async (consentData) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiPost('/employee/consents', {
        title: consentData.title,
        content: consentData.content,
        status: consentData.status || 0
      })
      
      if (response.success) {
        success('Consent created successfully')
        // Refresh the list
        await getConsents()
        return response
      } else {
        throw new Error(response.message || 'Failed to create consent')
      }
    } catch (err) {
      error.value = err.message
      showError('Failed to create consent')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Update consent
  const updateConsent = async (consentId, updateData) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiPut(`/employee/consents/${consentId}`, updateData)
      
      if (response.success) {
        success('Consent updated successfully')
        // Refresh the list
        await getConsents()
        return response
      } else {
        throw new Error(response.message || 'Failed to update consent')
      }
    } catch (err) {
      error.value = err.message
      showError('Failed to update consent')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Update consent status only
  const updateConsentStatus = async (consentId, status) => {
    return await updateConsent(consentId, { status: Number(status) })
  }

  // Get single consent by ID
  const getConsentById = (consentId) => {
    return consents.value.find(consent => consent.id_consent == consentId)
  }

  // Get consent status text
  const getConsentStatus = (consent) => {
    if (!consent) return 'Unknown'
    
    if (consent.status === 0) return 'Inactive'
    if (consent.status === 1) return 'Active'
    if (consent.status === 2) return 'Draft'
    if (consent.status === 3) return 'Archived'
    
    return 'Unknown'
  }

  // Get consent status variant for UI
  const getConsentStatusVariant = (consent) => {
    const status = getConsentStatus(consent)
    switch (status) {
      case 'Active': return 'success'
      case 'Inactive': return 'secondary'
      case 'Draft': return 'warning'
      case 'Archived': return 'error'
      default: return 'secondary'
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  // Helper function to add timeout to API calls
  const withTimeout = (promise, timeout = 5000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      )
    ])
  }

  // ADDED: Fetch active consents for consent popup
  const fetchActiveConsents = async (retryCount = 0, maxRetries = 2) => {
    try {
      isLoadingConsents.value = true
      error.value = null

      // Increase timeout to 10 seconds for better reliability
      const response = await withTimeout(
        apiGet('/employee/consents/active'),
        10000
      )

      if (response.success) {
        activeConsents.value = response.data || []
        // Set the latest consent (first one or most recent)
        latestConsent.value = activeConsents.value[0] || null
        hasActiveConsent.value = activeConsents.value.length > 0
        return response
      } else {
        // console.warn('Failed to fetch active consents:', response.message)
        // Set fallback empty data instead of throwing error
        activeConsents.value = []
        latestConsent.value = null
        hasActiveConsent.value = false
        return { success: true, data: [] }
      }
    } catch (err) {
      // console.error(`Error fetching active consents (attempt ${retryCount + 1}/${maxRetries + 1}):`, err)

      // Retry logic with exponential backoff
      if (retryCount < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 3000) // Max 3 seconds
        await new Promise(resolve => setTimeout(resolve, delay))
        return fetchActiveConsents(retryCount + 1, maxRetries)
      }

      error.value = err.message
      // Set fallback empty data after all retries exhausted
      activeConsents.value = []
      latestConsent.value = null
      hasActiveConsent.value = false
      // Return success to prevent modal from failing to open
      return { success: true, data: [] }
    } finally {
      // Only set loading to false if this is the final attempt
      if (retryCount === maxRetries || retryCount === 0) {
        isLoadingConsents.value = false
      }
    }
  }

  // ADDED: Fetch consent status for consent popup
  const fetchConsentStatus = async (consentId) => {
    if (!consentId) return null

    try {
      isLoadingStatus.value = true
      error.value = null

      // FIXED: [DATE] - Use query parameter instead of path parameter to fix 404 error
      // BEFORE: Used /employee/consents/${consentId}/status (404 error)
      // AFTER: Uses /employee/consents/status?id=${consentId} (works with existing endpoint)
      // REASON: Backend API expects consent ID as query parameter, not in URL path
      // Add timeout to prevent hanging
      const response = await withTimeout(
        apiGet(`/employee/consents/status?id=${consentId}`),
        5000
      )
      
      if (response.success) {
        consentStatus.value = response.data
        isConsentApproved.value = response.data?.status === 'approved' || response.data?.approved === true
        return response
      } else {
        throw new Error(response.message || 'Failed to fetch consent status')
      }
    } catch (err) {
      error.value = err.message
      // console.warn('Failed to load consent status:', err.message)
      // Don't show error toast for consent status failures as they're not critical
      // showError('Failed to load consent status')
      throw err
    } finally {
      isLoadingStatus.value = false
    }
  }

  return {
    // State
    consents,
    isLoading,
    error,
    
    // ADDED: State for consent popup functionality
    activeConsents,
    consentStatus,
    isLoadingConsents,
    isLoadingStatus,
    hasActiveConsent,
    isConsentApproved,
    latestConsent,
    
    // Methods
    getConsents,
    createConsent,
    updateConsent,
    updateConsentStatus,
    getConsentById,
    getConsentStatus,
    getConsentStatusVariant,
    formatDate,
    
    // ADDED: Methods for consent popup functionality
    fetchActiveConsents,
    fetchConsentStatus
  }
}