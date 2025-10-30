import { ref, computed } from 'vue'
import { useApi } from './useApi'
import { useRequestHistory } from './useRequestHistory'

export const useHybridRequestHistory = () => {
  const { apiGet, apiPost, apiPut } = useApi()
  const { 
    requests: demoRequests, 
    loadRequests: loadDemoRequests,
    addRequest: addDemoRequest,
    addDraft: addDemoDraft,
    updateDraftToWaitingApproval: updateDemoDraftToWaitingApproval,
    updateDraftData: updateDemoDraftData,
    updateRequestStatus: updateDemoRequestStatus,
    getRequestById: getDemoRequestById,
    getRequestsByStatus: getDemoRequestsByStatus,
    deleteRequest: deleteDemoRequest,
    addSampleData: addDemoSampleData,
    resetDemoData: resetDemoData,
    formatStatusDisplay,
    normalizeCategory,
    CATEGORY_MAPPING,
    getPaginatedRequests,
    getTotalPages,
    getPaginationInfo
  } = useRequestHistory()

  // Hybrid state
  const apiRequests = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const isApiAvailable = ref(false)

  // Pagination state
  const currentPage = ref(1)
  const itemsPerPage = ref(10)

  // Configuration - DEMO MODE ONLY
  const HYBRID_MODE = false // Set to false to use only demo data (localStorage)
  // Updated endpoint according to new API contract
  const API_ENDPOINT = '/employee/update-histories/'

  // Load data from API
  const loadApiRequests = async () => {
    if (!HYBRID_MODE) return

    isLoading.value = true
    error.value = null

    try {
      // Loading requests from API
      
      const response = await apiGet(API_ENDPOINT)
      
      if (response.success && response.data) {
        apiRequests.value = response.data
        isApiAvailable.value = true
        // API requests loaded successfully
      } else {
        isApiAvailable.value = false
        apiRequests.value = []
      }
    } catch (err) {
      error.value = err.message || 'Failed to load API requests'
      isApiAvailable.value = false
      apiRequests.value = []
    } finally {
      isLoading.value = false
    }
  }

  // Transform API data to match demo format
  const transformApiData = (apiData) => {
    if (!Array.isArray(apiData)) return []

    return apiData.map(item => ({
      id: item.id || item.request_id || `API-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      request_id: item.request_id || item.id,
      update: item.update || item.category || 'Basic Information',
      category: item.category || item.update || 'Basic Information',
      reason_update: item.reason_update || item.reason || 'API Data',
      status: item.status || 'waiting_approval',
      statusDisplay: formatStatusDisplay(item.status || 'waiting_approval'),
      submittedAt: item.submitted_at || item.created_at || item.date_change || new Date().toISOString(),
      lastUpdated: item.last_updated || item.updated_at || item.date_change || new Date().toISOString(),
      reviewer: item.reviewer || { name: 'API Reviewer' },
      review_note: item.review_note || item.notes || null,
      changes: item.changes || {},
      change_history: item.change_history || generateChangeHistoryFromApi(item),
      documents: item.documents || [],
      // Mark as API data
      _source: 'api'
    }))
  }

  // Generate change history from API data if not provided
  const generateChangeHistoryFromApi = (apiItem) => {
    const history = []
    
    if (apiItem.changes && typeof apiItem.changes === 'object') {
      Object.entries(apiItem.changes).forEach(([field, value]) => {
        if (value && typeof value === 'object' && ('old' in value || 'new' in value)) {
          history.push({
            field: field,
            field_label: formatFieldLabel(field),
            old_value: value.old || '',
            new_value: value.new || '',
            changed_at: apiItem.last_updated || apiItem.updated_at || apiItem.date_change || new Date().toISOString()
          })
        }
      })
    }
    
    return history
  }

  // Format field label
  const formatFieldLabel = (field) => {
    return field
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  // Hybrid requests (API + Demo data)
  const requests = computed(() => {
    // Use API data if available, otherwise fallback to demo data
    let allRequests = []
    
    
    if (HYBRID_MODE && isApiAvailable.value && apiRequests.value.length > 0) {
      // Transform API data to match demo format
      const transformedApiRequests = transformApiData(apiRequests.value)
      allRequests = [...transformedApiRequests]
    }
    
    // Add demo data if no API data or as fallback
    if (demoRequests.value.length > 0) {
      allRequests = [...allRequests, ...demoRequests.value]
    }
    
    // Sort by date (newest first)
    const sortedRequests = allRequests.sort((a, b) => {
      const dateA = new Date(a.lastUpdated || a.submittedAt)
      const dateB = new Date(b.lastUpdated || b.submittedAt)
      return dateB - dateA
    })
    
    return sortedRequests
  })

  // Paginated requests
  const paginatedRequests = computed(() => {
    return getPaginatedRequests(requests.value, currentPage.value, itemsPerPage.value)
  })

  // Pagination info
  const paginationInfo = computed(() => {
    return getPaginationInfo(requests.value, currentPage.value, itemsPerPage.value)
  })

  // Computed properties for different statuses
  const pendingRequests = computed(() => 
    requests.value.filter(req => req.status === 'waiting_approval')
  )

  const approvedRequests = computed(() => 
    requests.value.filter(req => req.status === 'approved')
  )

  const rejectedRequests = computed(() => 
    requests.value.filter(req => req.status === 'rejected')
  )

  const draftRequests = computed(() => 
    requests.value.filter(req => req.status === 'draft')
  )

  // Get request by ID (check both API and demo data)
  const getRequestById = (requestId) => {

    // First check demo data
    const demoRequest = getDemoRequestById(requestId)
    if (demoRequest) return demoRequest

    // Then check API data
    const transformedApiRequests = transformApiData(apiRequests.value)
    const apiRequest = transformedApiRequests.find(req => req.id === requestId)

    return apiRequest
  }

  // Add new request (always to demo data for now)
  const addRequest = (requestData) => {
    const result = addDemoRequest(requestData)
    
    // Force refresh after adding
    setTimeout(() => {
      loadRequests()
    }, 200)
    
    // Trigger custom event for other components
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('requestHistoryUpdated', {
        detail: { type: 'submitted' }
      }));
    }, 300)
    
    return result
  }

  // Add draft (call real API to save to database)
  const addDraft = async (requestData) => {
    try {
      // Saving draft to API
      
      // For drafts, we need to send ALL data (original + edited) to create a complete snapshot
      // This allows users to continue editing from the draft later
      const completeData = buildCompleteDataSnapshot(requestData);
      
      // Use clean data transformer for draft creation too
      const { useDataTransform } = await import('~/composables/useDataTransform');
      const { buildApiPayload } = useDataTransform();
      
      const tabId = requestData.category || requestData.update || 'basic-information';
      
      // Build clean API payload for new draft
      const apiPayload = buildApiPayload({
        tab: tabId,
        changes: requestData.changes || {},
        note_employee: requestData.reason_update || "Perbarui data karyawan",
        consent: true,
        submit: false
      });

      // API payload for draft (complete snapshot)

      // Call the real API using the proxy endpoint
      const response = await apiPost('/employee/change-request', apiPayload);
      
      if (response && response.success && response.data) {
        // Draft saved successfully to API
        
        // Force refresh after adding
        setTimeout(() => {
          loadRequests()
        }, 200)
        
        // Trigger custom event for other components
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('requestHistoryUpdated', {
            detail: { type: 'draft', requestId: response.data.id_change_req || response.data.code }
          }));
        }, 300)
        
        return {
          id: response.data.id_change_req || response.data.code,
          code: response.data.code,
          success: true,
          data: response.data
        }
      } else {
        throw new Error(response?.message || 'Failed to save draft');
      }
    } catch (error) {
      
      // Don't fallback to demo data immediately, try to understand the error
      if (error.status === 409) {
        // Draft already exists, attempting to update existing draft
        // Try to find existing draft and update it
        // This would require additional logic to find existing draft
        // For now, we'll throw the error to be handled by the caller
        throw new Error('Draft already exists for this request type');
      }
      
      // Only fallback to demo data if it's a network/server error
      if (error.message && !error.message.includes('Draft already exists')) {
        // Falling back to demo data due to API error
        const result = addDemoDraft(requestData)
        
        // Force refresh after adding
        setTimeout(() => {
          loadRequests()
        }, 200)
        
        // Trigger custom event for other components
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('requestHistoryUpdated', {
            detail: { type: 'draft' }
          }));
        }, 300)
        
        return result
      }
      
      throw error;
    }
  }

  // Helper function to get request type from category
  const getRequestTypeFromCategory = (category) => {
    const categoryToType = {
      'basic-information': 'BSC',
      'address': 'ADR',
      'payroll-account': 'PYR',
      'emergency-contact': 'EMC',
      'education': 'EDC',
      'social-security': 'SSI',
      'medical-record': 'MDR',
      'employment-information': 'EMP',
      'family': 'FMY'
    };
    return categoryToType[category] || 'BSC';
  }

  // Helper function to extract new data from changes object
  const extractNewDataFromChanges = (changes) => {
    if (!changes || typeof changes !== 'object') return {};
    
    // Find the first category with new data
    for (const categoryKey in changes) {
      const categoryData = changes[categoryKey];
      if (categoryData && categoryData.new) {
        return categoryData.new;
      }
    }
    
    return {};
  }

  // Helper function to build complete data snapshot for drafts
  const buildCompleteDataSnapshot = (requestData) => {
    const changes = requestData.changes || {};
    const category = requestData.category || requestData.update;
    
    // If changes contain old/new wrapper, merge them to create complete snapshot
    if (changes && typeof changes === 'object') {
      const keys = Object.keys(changes);
      if (keys.length === 1) {
        const wrapper = changes[keys[0]];
        if (wrapper && typeof wrapper === 'object' && ('old' in wrapper || 'new' in wrapper)) {
          const base = wrapper.old || {};
          const newer = wrapper.new || {};
          
          // If base/newer look like arrays (family/emergency/education), merge arrays
          if (Array.isArray(base) || Array.isArray(newer)) {
            return mergeArraySnapshots(base, newer);
          } else {
            // Merge base and newer; newer wins on conflict
            return { ...(base || {}), ...(newer || {}) };
          }
        }
      }
    }
    
    // Fallback: return the changes as is if no old/new structure
    return extractNewDataFromChanges(changes);
  }

  // Helper function to merge two arrays, preferring newer values
  const mergeArraySnapshots = (baseArray, newerArray) => {
    const merged = [];
    const seen = new Set();

    // Add all elements from baseArray that are not in newerArray
    baseArray.forEach(item => {
      if (!seen.has(item.id)) {
        merged.push(item);
        seen.add(item.id);
      }
    });

    // Add elements from newerArray that are not in baseArray
    newerArray.forEach(item => {
      if (!seen.has(item.id)) {
        merged.push(item);
        seen.add(item.id);
      }
    });

    return merged;
  };

  // Helper function to extract only changed fields for updates
  const extractChangedFieldsOnly = (updatedData) => {
    const changes = updatedData.changes || {};
    const formData = updatedData.formData;
    
    // If formData is provided, use it (it should contain only changed fields)
    if (formData && Object.keys(formData).length > 0) {
      return formData;
    }
    
    // Otherwise, extract only the new/changed values from changes object
    if (changes && typeof changes === 'object') {
      const keys = Object.keys(changes);
      if (keys.length === 1) {
        const wrapper = changes[keys[0]];
        if (wrapper && typeof wrapper === 'object' && 'new' in wrapper) {
          return wrapper.new || {};
        }
      }
    }
    
    // Fallback: return empty object if no changes detected
    return {};
  }

  // Update draft to waiting approval (try API PUT, fallback to demo)
  const updateDraftToWaitingApproval = async (requestId, updatedData, originalDataParam = {}) => {
    try {
      // Use new clean data transformer
      const { useDataTransform } = await import('~/composables/useDataTransform');
      const { buildApiPayload } = useDataTransform();
      
      const tabId = updatedData.category || updatedData.update || 'basic-information';
      
      
      // Build clean API payload without wrappers
      const apiPayload = buildApiPayload({
        tab: tabId,
        changes: updatedData.changes || {},
        originalData: originalDataParam,
        note_employee: updatedData.reason_update || 'Request submitted for approval',
        consent: typeof updatedData.consent !== 'undefined' ? !!updatedData.consent : true,
        submit: true
      })
      

      const response = await apiPut(`/employee/change-request/${requestId}`, apiPayload)
      if (response && response.status) {
        // Force refresh after updating
        setTimeout(() => {
          loadRequests()
        }, 200)

        // Trigger custom event for other components
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('requestHistoryUpdated', {
            detail: { requestId: requestId, type: 'submitted' }
          }));
        }, 300)

        return { id: response.data?.id_change_req || response.data?.code || requestId, success: true, data: response.data }
      }
    } catch{
      //
    }

    // Fallback to demo implementation
    const result = updateDemoDraftToWaitingApproval(requestId, updatedData)
    // Force refresh after updating
    setTimeout(() => {
      loadRequests()
    }, 200)
    
    // Trigger custom event for other components
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('requestHistoryUpdated', {
        detail: { requestId: requestId, type: 'submitted' }
      }));
    }, 300)

    return result
  }

  // Update draft data (try API PUT, fallback to demo)
  const updateDraftData = async (requestId, updatedData, originalDataParam = {}) => {
    try {
      // Use new clean data transformer for draft save too
      const { useDataTransform } = await import('~/composables/useDataTransform');
      const { buildApiPayload } = useDataTransform();
      
      const tabId = updatedData.category || updatedData.update || 'basic-information';
      
      // Build clean API payload for draft
      const apiPayload = buildApiPayload({
        tab: tabId,
        changes: updatedData.changes || {},
        originalData: originalDataParam,
        note_employee: updatedData.reason_update || 'Draft - Auto saved changes',
        consent: typeof updatedData.consent !== 'undefined' ? !!updatedData.consent : true,
        submit: false
      })

      const response = await apiPut(`/employee/change-request/${requestId}`, apiPayload)
      if (response && response.status) {
        // Force refresh after updating
        setTimeout(() => {
          loadRequests()
        }, 200)

        // Trigger custom event for other components
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('requestHistoryUpdated', {
            detail: { requestId: requestId, type: 'draft' }
          }));
        }, 300)

        return { id: response.data?.id_change_req || response.data?.code || requestId, code: response.data?.code, success: true, data: response.data }
      }
    } catch {
      //
    }

    // Fallback to demo implementation
    const result = updateDemoDraftData(requestId, updatedData)
    // Force refresh after updating
    setTimeout(() => {
      loadRequests()
    }, 200)
    
    // Trigger custom event for other components
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('requestHistoryUpdated', {
        detail: { requestId: requestId, type: 'draft' }
      }));
    }, 300)

    return result
  }

  // Update request status (always to demo data for now)
  const updateRequestStatus = (requestId, newStatus, notes = '') => {
    return updateDemoRequestStatus(requestId, newStatus, notes)
  }

  // Delete request (always from demo data for now)
  const deleteRequest = (requestId) => {
    return deleteDemoRequest(requestId)
  }

  // Load all data (API + Demo)
  const loadRequests = async () => {
    // Load demo data from localStorage
    loadDemoRequests()
    
    // Load API data if HYBRID_MODE is enabled
    if (HYBRID_MODE) {
      await loadApiRequests()
    }
  }

  // Refresh data
  const refreshData = async () => {
    await loadRequests()
  }

  // Check if request is from API
  const isApiRequest = (request) => {
    return request._source === 'api'
  }

  // Check if request is from demo
  const isDemoRequest = (request) => {
    return !request._source || request._source === 'demo'
  }

  // Get request source info
  const getRequestSource = (request) => {
    if (isApiRequest(request)) {
      return { source: 'api', label: 'API Data', color: 'blue' }
    }
    return { source: 'demo', label: 'Demo Data', color: 'yellow' }
  }

  // Pagination methods
  const setPage = (page) => {
    // If paginationInfo is not available yet, just set to page 1
    if (!paginationInfo.value || !paginationInfo.value.totalPages) {
      currentPage.value = 1;
    } else {
      const maxPage = paginationInfo.value.totalPages;
      const newPage = Math.max(1, Math.min(page, maxPage));
      currentPage.value = newPage;
    }
  }

  const nextPage = () => {
    if (paginationInfo.value.hasNextPage) {
      setPage(currentPage.value + 1)
    }
  }

  const prevPage = () => {
    if (paginationInfo.value.hasPrevPage) {
      setPage(currentPage.value - 1)
    }
  }

  const setItemsPerPage = (limit) => {
    itemsPerPage.value = limit
    currentPage.value = 1 // Reset to first page when changing limit
  }

  // Initialize data when composable is created
  loadRequests()

  return {
    // State
    requests,
    apiRequests,
    isLoading,
    error,
    isApiAvailable,
    currentPage,
    itemsPerPage,
    
    // Computed
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    draftRequests,
    paginatedRequests,
    paginationInfo,
    
    // Actions
    loadRequests,
    loadApiRequests,
    refreshData,
    addRequest,
    addDraft,
    updateDraftToWaitingApproval,
    updateDraftData,
    updateRequestStatus,
    getRequestById,
    deleteRequest,
    addSampleData: addDemoSampleData,
    resetDemoData,
    
    // Pagination actions
    setPage,
    nextPage,
    prevPage,
    setItemsPerPage,
    
    // Utilities
    formatStatusDisplay,
    normalizeCategory,
    CATEGORY_MAPPING,
    isApiRequest,
    isDemoRequest,
    getRequestSource,
    
    // Configuration
    HYBRID_MODE
  }
}
