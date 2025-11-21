import { ref, computed } from 'vue'
import { useApi } from './useApi'

export const useChangeRequestHistory = () => {
  const { apiGet, apiPost, apiPut, apiDelete } = useApi()
  
  const requests = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  
  // ✅ DEDUPLICATION: Prevent multiple simultaneous requests
  let loadingPromise = null
  const summary = ref({
    draft: 0,
    waiting_approval: 0,
    need_revision: 0,
    approved: 0,
    total: 0
  })
  const summaryProvided = ref(false)

  // Normalize different possible summary shapes from backend
  const normalizeSummary = (raw = {}) => {
    // If already in expected shape, return normalized numbers
    const get = (k) => {
      if (raw == null) return 0
      const v = raw[k]
      return typeof v === 'number' ? v : (v ? Number(v) || 0 : 0)
    }

    // Try common named keys first
    const named = {
      draft: get('draft'),
      waiting_approval: get('waiting_approval'),
      need_revision: get('need_revision'),
      approved: get('approved'),
      rejected: get('rejected'),
      total: get('total')
    }

    // If named keys present (non-zero or explicitly provided), use them but fill missing from other patterns
    const anyNamed = Object.values(named).some(v => v > 0)

    // Extract by numeric status keys: '1','2','3','4','5'
    const byNumber = {
      '1': get('1') || get('status_1') || get('status_01'),
      '2': get('2') || get('status_2') || get('status_02'),
      '3': get('3') || get('status_3') || get('status_03'),
      '4': get('4') || get('status_4') || get('status_04'),
      '5': get('5') || get('status_5') || get('status_05')
    }

    // If numeric keys present, map them
    const anyNumberKeys = Object.values(byNumber).some(v => v > 0)

    const result = {
      draft: 0,
      waiting_approval: 0,
      need_revision: 0,
      approved: 0,
      rejected: 0,
      total: 0
    }

    if (anyNamed) {
      result.draft = named.draft || 0
      result.waiting_approval = named.waiting_approval || 0
      result.need_revision = named.need_revision || 0
      result.approved = named.approved || 0
      result.rejected = named.rejected || 0
      result.total = named.total || 0
    }

    if (anyNumberKeys) {
      // map numeric status to our named fields
      result.draft = result.draft || (byNumber['1'] || 0)
      result.waiting_approval = result.waiting_approval || (byNumber['2'] || 0)
      result.need_revision = result.need_revision || (byNumber['3'] || 0)
      result.approved = result.approved || (byNumber['4'] || 0)
      result.rejected = result.rejected || (byNumber['5'] || 0)
    }

    // If total missing, try to derive from sum of known fields
    if (!result.total || result.total === 0) {
      const sum = result.draft + result.waiting_approval + result.need_revision + result.approved + result.rejected
      result.total = sum || (named.total || 0) || 0
    }

    return result
  }

  // Request type mapping
  const REQUEST_TYPE_MAPPING = {
    'BSC': 'Basic Information',
    'ADR': 'Address',
    'EMC': 'Emergency Contact',
    'PAY': 'Payroll Account',
    'FMY': 'Family',
    'EDC': 'Education',
    'SSI': 'Benefit',
    // Backend may use either 'MED' or 'MDR' as code for medical information.
    'MED': 'Medical Record',
    'MDR': 'Medical Record',
    'EMP': 'Employment Information'
  }

  // Status mapping
  const STATUS_MAPPING = {
    '1': 'Draft',
    '2': 'Waiting Approval',
    '3': 'Need Revision',
    '4': 'Approved',
    '5': 'Rejected'
  }

  // Status color mapping
  const getStatusColor = (status) => {
    const statusColors = {
      '1': 'bg-gray-100 text-gray-800', // Draft
      '2': 'bg-yellow-100 text-yellow-800', // Waiting Approval
      '3': 'bg-red-100 text-red-800', // Need Revision
      '4': 'bg-green-100 text-green-800', // Approved
      '5': 'bg-red-100 text-red-800' // Rejected
    }
    return statusColors[status] || 'bg-gray-100 text-gray-800'
  }

  // Load change requests from API with deduplication
  const loadChangeRequests = async () => {
    // ✅ DEDUPLICATION: Return existing promise if already loading
    if (loadingPromise) {
      return loadingPromise;
    }
    
    loadingPromise = (async () => {
      try {
        isLoading.value = true
        error.value = null
        
        // Check token validity before making request (do not clear existing list on failure)
        try {
          const { useAuthenticationCore } = await import('~/composables/useAuthenticationCore');
          const authCore = useAuthenticationCore();
          const validToken = await authCore.getValidAccessToken();
          if (!validToken) {
            error.value = 'Session expired. Please log in again.';
            return; // keep previous requests
          }
        } catch {
          error.value = 'Session expired. Please log in again.';
          return; // keep previous requests
        }
        
        // Request first page explicitly to avoid backend default page issues
        const response = await apiGet('/employee/change-request?page=1&limit=50')
        
        if (response.success && response.data) {
        
        // Transform API data to match component expectations
        requests.value = response.data.map(request => ({
          id: request.id_change_req,
          id_change_req: request.id_change_req,
          request_id: request.code, // Use code as request_id for display
          code: request.code,
          request_type: request.request_type,
          request_type_label: request.request_type_label || REQUEST_TYPE_MAPPING[request.request_type] || request.request_type,
          status: request.status,
          // For history listing we want numeric status '3' (need revision) to appear as 'Rejected'
          // so users see 'Rejected' in /history while the edit/view pages may still show 'Need Revision'
          status_label: request.status_label || (request.status === '3' ? 'Rejected' : STATUS_MAPPING[request.status]) || 'Unknown',
          statusDisplay: request.status_label || (request.status === '3' ? 'Rejected' : STATUS_MAPPING[request.status]) || 'Unknown',
          created_date: request.created_date,
          updated_date: request.updated_date,
          // Additional fields for component compatibility
          category: request.request_type_label || REQUEST_TYPE_MAPPING[request.request_type] || request.request_type,
          update: request.request_type_label || REQUEST_TYPE_MAPPING[request.request_type] || request.request_type,
          date: request.created_date,
          date_change: request.created_date,
          submittedAt: request.created_date,
          lastUpdated: request.updated_date || request.created_date,
          dateChange: request.created_date,
          // For approved requests
          approved_at: request.status === '4' ? (request.updated_date || request.created_date) : null,
          approvedAt: request.status === '4' ? (request.updated_date || request.created_date) : null,
          // Reviewer info mapped from backend approver field(s)
          reviewer: request.name_approver || null
        }))

        // Update summary if available - backend may return it in the raw envelope
        const rawSummary = response.raw?.summary || response.summary || null
        if (rawSummary) {
          summary.value = normalizeSummary(rawSummary)
          summaryProvided.value = true
        } else {
          summaryProvided.value = false
        }

        // loaded requests and summary
        } else {
          // no data received - keep previous data, just set error state
          // requests.value is left intact to avoid flashing empty state
        }
      } catch (err) {
        // Handle specific error types
        if (err.message && err.message.includes('Token has been invalidated')) {
          error.value = 'Session expired. Please refresh the page.';
          
          // Try to refresh token and retry once
          try {
            const { useAuthenticationCore } = await import('~/composables/useAuthenticationCore');
            const authCore = useAuthenticationCore();
            const newToken = await authCore.refreshAccessToken();
            
            if (newToken) {
              // Retry the request with new token
              const retryResponse = await apiGet('/api/proxy/employee/change-request?limit=50');
              if (retryResponse.success && retryResponse.data) {
                // Transform API data to match component expectations
                requests.value = retryResponse.data.map(request => ({
                  id: request.id_change_req,
                  id_change_req: request.id_change_req,
                  request_id: request.code,
                  code: request.code,
                  request_type: request.request_type,
                  request_type_label: request.request_type_label || REQUEST_TYPE_MAPPING[request.request_type] || request.request_type,
                  status: request.status,
                  status_label: request.status_label || (request.status === '3' ? 'Rejected' : STATUS_MAPPING[request.status]) || 'Unknown',
                  statusDisplay: request.status_label || (request.status === '3' ? 'Rejected' : STATUS_MAPPING[request.status]) || 'Unknown',
                  created_date: request.created_date,
                  updated_date: request.updated_date,
                  category: request.request_type_label || REQUEST_TYPE_MAPPING[request.request_type] || request.request_type,
                  update: request.request_type_label || REQUEST_TYPE_MAPPING[request.request_type] || request.request_type,
                  date: request.created_date,
                  date_change: request.created_date,
                  submittedAt: request.created_date,
                  lastUpdated: request.updated_date || request.created_date,
                  dateChange: request.created_date,
                  approved_at: request.status === '4' ? (request.updated_date || request.created_date) : null,
                  approvedAt: request.status === '4' ? (request.updated_date || request.created_date) : null,
                  reviewer: request.name_approver || null
                }));

                // Update summary if available
                const rawSummary = retryResponse.raw?.summary || retryResponse.summary || null;
                if (rawSummary) {
                  summary.value = normalizeSummary(rawSummary);
                  summaryProvided.value = true;
                } else {
                  summaryProvided.value = false;
                }
                
                error.value = null; // Clear error on successful retry
                return; // Exit early on successful retry
              }
            }
          } catch {
            // Token refresh failed, will fall through to general error handling
          }
        }
        
        // error loading requests - keep previous list to avoid empty UI
        error.value = err.message
      } finally {
        isLoading.value = false
        loadingPromise = null // ✅ Reset promise when done
      }
    })();
    
    return loadingPromise;
  }

  // Get change request detail
  const getChangeRequestDetail = async (changeRequestId) => {
    const response = await apiGet(`/api/proxy/employee/change-request/${changeRequestId}`)
    if (response.success && response.data) {
      return response.data
    }
    throw new Error('Failed to get change request detail')
  }

  // Create new change request
  const createChangeRequest = async (requestData) => {
    const response = await apiPost('/employee/change-request', requestData)
    if (response.success) {
      // ✅ OPTIMIZED: Only reload if we don't have recent data
      if (!requests.value || requests.value.length === 0) {
        await loadChangeRequests();
      } else {
        //
      }
      return response
    }
    throw new Error(response.message || 'Failed to create change request')
  }

  // Update existing change request
  const updateChangeRequest = async (changeRequestId, requestData) => {
    const response = await apiPut(`/employee/change-request/${changeRequestId}`, requestData)
    if (response.success) {
      // ✅ OPTIMIZED: Only reload if we don't have recent data
      if (!requests.value || requests.value.length === 0) {
        await loadChangeRequests();
      } else {
        //
      }
      return response
    }
    throw new Error(response.message || 'Failed to update change request')
  }

  // Delete change request
  const deleteChangeRequest = async (changeRequestId) => {
    const response = await apiDelete(`/employee/change-request/${changeRequestId}`)
    if (response.success) {
      // ✅ OPTIMIZED: Only reload if we don't have recent data
      if (!requests.value || requests.value.length === 0) {
        await loadChangeRequests();
      } else {
        //
      }
      return response
    }
    throw new Error(response.message || 'Failed to delete change request')
  }

  // Computed properties for filtering
  const pendingRequests = computed(() => 
    requests.value.filter(r => r.status === '2' || r.status === '3')
  )

  const approvedRequests = computed(() => 
    requests.value.filter(r => r.status === '4')
  )

  const draftRequests = computed(() => 
    requests.value.filter(r => r.status === '1')
  )

  // Filter requests by status
  const filterByStatus = (status) => {
    return requests.value.filter(r => r.status === status)
  }

  // Filter requests by type
  const filterByType = (type) => {
    return requests.value.filter(r => r.request_type === type)
  }

  // Search requests
  const searchRequests = (query) => {
    if (!query) return requests.value
    
    const lowercaseQuery = query.toLowerCase()
    return requests.value.filter(r => 
      r.code.toLowerCase().includes(lowercaseQuery) ||
      r.request_type_label.toLowerCase().includes(lowercaseQuery) ||
      r.status_label.toLowerCase().includes(lowercaseQuery)
    )
  }

  return {
    requests,
    isLoading,
    error,
    summary,
    summaryProvided,
    pendingRequests,
    approvedRequests,
    draftRequests,
    
    // Methods
    loadChangeRequests,
    getChangeRequestDetail,
    createChangeRequest,
    updateChangeRequest,
    deleteChangeRequest,
    filterByStatus,
    filterByType,
    searchRequests,
    getStatusColor,
    
    // Constants
    REQUEST_TYPE_MAPPING,
    STATUS_MAPPING
  }
}


