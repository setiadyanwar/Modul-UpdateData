import { ref, computed } from 'vue'
import { useHybridRequestHistory } from './useHybridRequestHistory'

export const useRequestStatus = () => {
  const { requests } = useHybridRequestHistory()

  // Check if there's an active request for a specific category
  const hasActiveRequest = (category) => {
    if (!requests.value || !Array.isArray(requests.value)) {
      return false
    }

    // Active statuses: 'draft' and 'waiting_approval'
    // Inactive statuses: 'approved', 'rejected', 'need_revision'
    const activeStatuses = ['draft', 'waiting_approval']
    
    return requests.value.some(request => 
      request.category === category && 
      activeStatuses.includes(request.status)
    )
  }

  // Check if there's a request with specific status for a category
  const hasRequestWithStatus = (category, status) => {
    if (!requests.value || !Array.isArray(requests.value)) {
      return false
    }

    return requests.value.some(request => 
      request.category === category && 
      request.status === status
    )
  }

  // Get active requests for a category
  const getActiveRequests = (category) => {
    if (!requests.value || !Array.isArray(requests.value)) {
      return []
    }

    const activeStatuses = ['draft', 'waiting_approval']
    
    return requests.value.filter(request => 
      request.category === category && 
      activeStatuses.includes(request.status)
    )
  }

  // Check if user can add new record for multiple record tabs
  const canAddNewRecord = (category) => {
    // For multiple record tabs (emergency contact, family, education)
    // User can add new if:
    // 1. No active requests (draft/waiting_approval) for this category
    // 2. OR if there are only "need_revision" requests (user can create new request)

    if (!requests.value || !Array.isArray(requests.value)) {
      return true
    }

    const activeRequests = getActiveRequests(category)
    const needRevisionRequests = requests.value.filter(req =>
      req.category === category &&
      (req.status === 'need_revision' || req.status === 'rejected' || req.status === '3' || req.status === 3)
    )

    // If no active requests, user can add new
    if (activeRequests.length === 0) {
      return true
    }

    // If there are need_revision requests, user can add new (to create new request)
    if (needRevisionRequests.length > 0) {
      return true
    }

    // If there are active requests (draft/waiting_approval), user cannot add new
    return false
  }

  // Get status message for why button is disabled
  const getDisabledReason = (category) => {
    const activeRequests = getActiveRequests(category)
    
    if (activeRequests.length === 0) {
      return null // Button should be enabled
    }
    
    const draftRequests = activeRequests.filter(req => req.status === 'draft')
    const waitingRequests = activeRequests.filter(req => req.status === 'waiting_approval')
    
    if (draftRequests.length > 0) {
      return `You have ${draftRequests.length} draft request(s) for ${category}. Please complete or delete them first.`
    }
    
    if (waitingRequests.length > 0) {
      return `You have ${waitingRequests.length} request(s) waiting for approval for ${category}. Please wait for the approval process.`
    }
    
    return `You have active request(s) for ${category}. Please complete them first.`
  }

  // Get request status summary for a category
  const getRequestSummary = (category) => {
    if (!requests.value || !Array.isArray(requests.value)) {
      return {
        total: 0,
        draft: 0,
        waiting_approval: 0,
        approved: 0,
        rejected: 0,
        need_revision: 0
      }
    }

    const categoryRequests = requests.value.filter(req => req.category === category)
    
    return {
      total: categoryRequests.length,
      draft: categoryRequests.filter(req => req.status === 'draft').length,
      waiting_approval: categoryRequests.filter(req => req.status === 'waiting_approval').length,
      approved: categoryRequests.filter(req => req.status === 'approved').length,
      rejected: categoryRequests.filter(req => req.status === 'rejected').length,
      need_revision: categoryRequests.filter(req => req.status === 'need_revision').length
    }
  }

  return {
    hasActiveRequest,
    hasRequestWithStatus,
    getActiveRequests,
    canAddNewRecord,
    getDisabledReason,
    getRequestSummary
  }
}
