<template>
  <div>
    <!-- Breadcrumb -->
    <UiBreadcrumb :items="breadcrumbItems" class="mb-4" />

    <!-- Page Header -->
    <div class="mb-6">
      <div
        class="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div>
          <h1 class="text-2xl font-bold text-text-main">
            Request History & Status
          </h1>
          <p class="mt-1 text-grey-600">
            Manage and track your data update requests
          </p>
        </div>
        <div class="hidden lg:flex items-center gap-3">
          <button
            @click="loadChangeRequests"
            class="w-10 h-10 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-md flex items-center justify-center transition-colors"
            title="Refresh Data"
          >
            <i class="pi pi-refresh text-lg"></i>
          </button>
        </div>
      </div>
    </div>



    <!-- Stats Cards -->
    <HistoryStats :stats="stats" :is-loading="isAnyLoading" :active-filter="selectedFilter" @filter="handleStatsFilter" />

    <!-- Mobile Refresh Button -->
    <div class="lg:hidden mb-4 flex justify-end">
              <button
          @click="loadChangeRequests"
          class="w-10 h-10 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-md flex items-center justify-center transition-colors"
          title="Refresh Data"
        >
          <i class="pi pi-refresh text-lg"></i>
        </button>
    </div>

    <!-- Data Table -->
    <div
      class="bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700"
    >
      <RequestHistoryTable
        :data="paginatedFilteredRequests"
        :loading="isAnyLoading"
        :filter-options="filterOptions"
        :current-page="currentPage"
        :total-pages="filteredPaginationInfo.totalPages"
        :total-items="filteredRequests.length"
        :has-next-page="filteredPaginationInfo.hasNextPage"
        :has-prev-page="filteredPaginationInfo.hasPrevPage"
        @selection-change="handleSelectionChange"
        @view="handleView"
        @edit="handleEdit"
        @delete="handleDelete"
        @row-click="handleRowClick"
        @search="handleSearch"
        @filter="handleFilter"
        @first-page="() => setPage(1)"
        @prev-page="prevPage"
        @next-page="nextPage"
        @last-page="() => setPage(filteredPaginationInfo.totalPages)"
        @goto-page="(p) => setPage(p)"
      />
    </div>

    

    <!-- View Data Modal -->
    <ViewDataModal
      :is-open="viewModalData.isOpen"
      :request-id="viewModalData.requestId"
      :request-status="viewModalData.requestStatus"
      :request-data="viewModalData.requestData"
      @close="closeViewModal"
    />

    <!-- Delete Confirmation Modal -->
    <ConfirmationModal
      :is-visible="showDeleteModal"
  title="Delete Request"
  message="Are you sure you want to delete this request? This action cannot be undone."
  save-button-text="Cancel"
  continue-button-text="Delete"
      @close="showDeleteModal = false"
      @save-draft="showDeleteModal = false"
      @continue="confirmDelete"
    />
  </div>
</template>

<script setup>
/*
 * DEMO MODE - Using localStorage for demonstration
 * 
 * This component supports both API integration and localStorage demo mode.
 * Currently running in DEMO MODE using localStorage for data persistence.
 * 
 * API Integration (commented for demo):
 * - Original API calls are maintained but using localStorage simulation
 * - To enable API mode, uncomment API imports and replace localStorage calls
 * - API endpoints: /api/history, /api/request/{id}, etc.
 * 
 * Demo Features:
 * - Real-time data sync across components
 * - Proper status formatting (Waiting Approval vs waiting_approval)
 * - Clean request ID format (REQ-YYYYMMDD-HHMMSS-XXX)
 * - Sample data automatically loaded for testing
 */

import { ref, onMounted, computed, watch, onUnmounted, nextTick } from "vue";
import { useRoute } from "vue-router";
import StatCard from "~/components/dashboard/StatCard.vue";
import HistoryStats from "~/components/update-data/history/HistoryStats.vue";
import RequestHistoryTable from "~/components/update-data/history/RequestHistoryTable.vue";
import ViewDataModal from "~/components/update-data/modals/ViewDataModal.vue";
import ConfirmationModal from "~/components/ui/ConfirmationModal.vue";
import { useChangeRequestHistory } from "~/composables/useChangeRequestHistory";
import { mapAddress } from "~/utils/dataResolver";
import { useToast } from "~/composables/useToast";

definePageMeta({
  layout: "update-data",
  middleware: "rbac",
  permissions: ["request_history_and_status"]
});

// Breadcrumb items
const breadcrumbItems = [
  { label: "Dashboard", href: "/", icon: "pi pi-home" },
  { label: "Update Data", href: "/update-data" },
  { label: "Request History", current: true },
];

// Use new API-based change request history
const {
  requests: changeRequests,
  isLoading: changeLoading,
  error: changeError,
  summary: changeSummary,
  summaryProvided: changeSummaryProvided,
  loadChangeRequests,
  deleteChangeRequest,
  getChangeRequestDetail
} = useChangeRequestHistory();

const { success, error: showError } = useToast();

// Additional local state
const error = ref("");
// const currentPage = ref(1); // This is now managed by paginationInfo

// Computed properties
const stats = computed(() => {
  const s = changeSummary.value || {}
  const fallback = {
    draft: changeRequests.value.filter(r => r.status === '1').length,
    waiting: changeRequests.value.filter(r => r.status === '2').length,
    approved: changeRequests.value.filter(r => r.status === '4').length,
    rejected: changeRequests.value.filter(r => r.status === '3').length
  }

  // If API provided summary, use it (normalized in composable). Otherwise use fallback counts.
  if (changeSummaryProvided && changeSummaryProvided.value) {
    return {
      draft: s.draft || 0,
      approved: s.approved || 0,
      waiting: s.waiting_approval || 0,
      // Prefer explicit rejected count; if not provided, fall back to need_revision
      rejected: typeof s.rejected === 'number' ? s.rejected : (s.need_revision || 0)
    }
  }

  return fallback
})

// Combined loading state with local loading for better UX
const localLoading = ref(false);
const isAnyLoading = computed(() => changeLoading.value || localLoading.value);

// Remove the old totalPages computed property since we now use paginationInfo
// const totalPages = computed(() => Math.ceil(filteredRequests.value.length / 10));

// Local state
const selectedRequests = ref([]);
const searchQuery = ref("");
const selectedFilter = ref("all");
const currentPage = ref(1);
const itemsPerPage = ref(10);

// Pagination methods
const setPage = (page) => {
  currentPage.value = page;
};

const nextPage = () => {
  if (currentPage.value < filteredPaginationInfo.value.totalPages) {
    currentPage.value++;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

// Modal state
const viewModalData = ref({
  isOpen: false,
  requestId: "",
  requestStatus: "",
  requestData: null,
});

// Delete confirmation modal state
const showDeleteModal = ref(false);
const requestToDelete = ref(null);

// Filter options
const filterOptions = [
  { value: "all", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "approved", label: "Approved" },
  { value: "waiting_approval", label: "Waiting Approval" },
  { value: "rejected", label: "Rejected" },
];

// REMOVED: Brutal refresh interval variable

// Simplified refresh - no auto-refresh to prevent performance issues
let refreshTimeout = null;
let isRefreshing = false;
const debouncedRefresh = async () => {
  if (isRefreshing) {
    return;
  }
  
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
  }
  
  refreshTimeout = setTimeout(async () => {
    if (isRefreshing) return;
    
    isRefreshing = true;
    localLoading.value = true;
    try {
      await loadChangeRequests();
    } finally {
      localLoading.value = false;
      isRefreshing = false;
    }
  }, 500); // Reduced from 1000ms to 500ms for better UX
};

// Event handlers defined outside of async onMounted
const handleRequestHistoryUpdate = async () => {
  await debouncedRefresh();
};

const handleForceRefreshHistory = async () => {
  // Force immediate refresh without debounce
  await loadChangeRequests();
};

// Setup lifecycle hooks first - avoid any async context issues
onUnmounted(() => {
  window.removeEventListener('requestHistoryUpdated', handleRequestHistoryUpdate);
  window.removeEventListener('forceRefreshHistory', handleForceRefreshHistory);
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
  }
});

onMounted(async () => {
  // Load data from API
  localLoading.value = true;
  try {
    await loadChangeRequests();
  } catch (err) {
    showError('Failed to load change request history');
  } finally {
    localLoading.value = false;
  }

  // Add event listeners
  window.addEventListener('requestHistoryUpdated', handleRequestHistoryUpdate);
  window.addEventListener('forceRefreshHistory', handleForceRefreshHistory);

  // Check for pending success message from form submission
  const pendingMessage = localStorage.getItem('pendingSuccessMessage');
  if (pendingMessage) {
    try {
      const messageData = JSON.parse(pendingMessage);
      // Show success message immediately (sanitized)
      success(
        String(messageData.message || 'Operation completed successfully'),
        {
          title: messageData.title || 'Success',
          duration: 4000
        }
      );
      // Clear the message from localStorage
      localStorage.removeItem('pendingSuccessMessage');
    } catch (error) {
      // Fallback for simple string messages
      success(String(pendingMessage));
      localStorage.removeItem('pendingSuccessMessage');
    }
  }
});

// Watch for filter changes and reset to first page
watch(selectedFilter, () => {
  // Filter changed - use nextTick to prevent recursive updates
  nextTick(() => {
    setPage(1); // Reset to first page when filter changes
  });
});

// Watch for search changes and reset to first page
watch(searchQuery, () => {
  // Search query changed - use nextTick to prevent recursive updates
  nextTick(() => {
    setPage(1); // Reset to first page when search changes
  });
});

// Watch for requests changes to ensure data is up to date
watch(changeRequests, (newRequests, oldRequests) => {
  // Only reset page if new requests were actually added (not just reordered)
  if (oldRequests && newRequests.length > oldRequests.length) {
    // Use nextTick to prevent immediate recursive updates
    nextTick(() => {
      setPage(1);
    });
  }
}, { deep: false });

// Watch for route changes to refresh data when navigating to this page
const route = useRoute();
watch(() => route.path, (newPath, oldPath) => {
  if (newPath === '/update-data/history' && oldPath !== newPath) {
    // Use nextTick and then call refresh without async/await in watch
    nextTick(() => {
      debouncedRefresh();
    });
  }
}, { immediate: false });

// Filtered requests with search and status filtering
const filteredRequests = computed(() => {
  let filtered = changeRequests.value;
  
  // Filter by status
  if (selectedFilter.value && selectedFilter.value !== 'all') {
    // Map filter value to API status numbers
    const statusMap = {
      'draft': '1',
      'waiting_approval': '2',
      'need_revision': '3',
      'approved': '4',
      'rejected': '5'
    };
    const apiStatus = statusMap[selectedFilter.value];
    if (apiStatus) {
      filtered = filtered.filter(request => request.status === apiStatus);
    }
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        (r.code && r.code.toLowerCase().includes(query)) ||
        (r.request_type_label && r.request_type_label.toLowerCase().includes(query)) ||
        (r.status_label && r.status_label.toLowerCase().includes(query)) ||
        (r.id && r.id.toString().toLowerCase().includes(query)) ||
        false
    );
  }

  return filtered;
});

// Paginated filtered requests
const paginatedFilteredRequests = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage.value;
  const endIndex = startIndex + itemsPerPage.value;
  return filteredRequests.value.slice(startIndex, endIndex);
});

// Pagination info for filtered requests
const filteredPaginationInfo = computed(() => {
  const totalItems = filteredRequests.value.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage.value);
  const startIndex = (currentPage.value - 1) * itemsPerPage.value;
  const endIndex = Math.min(startIndex + itemsPerPage.value, totalItems);
  
  return {
    currentPage: currentPage.value,
    totalPages,
    totalItems,
    startIndex: startIndex + 1,
    endIndex,
    hasNextPage: currentPage.value < totalPages,
    hasPrevPage: currentPage.value > 1
  };
});

// Watch for filtered requests changes to ensure pagination is correct
watch(filteredRequests, (newFilteredRequests, oldFilteredRequests) => {
  // Calculate total pages without triggering computed
  const totalItems = newFilteredRequests.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage.value);
  
  // Only reset page if current page is out of bounds
  if (currentPage.value > totalPages && totalPages > 0) {
    setPage(1);
  }
  
  // Only reset page if new items were added (not just filtered)
  if (oldFilteredRequests && newFilteredRequests.length > oldFilteredRequests.length) {
    setPage(1);
  }
}, { deep: false });

// Methods
const handleSelectionChange = (selected) => {
  selectedRequests.value = selected;
};

const handleSearch = (query) => {
  searchQuery.value = query;
};

const handleFilter = (filter) => {
  selectedFilter.value = filter;
};

const handleStatsFilter = (filter) => {
  selectedFilter.value = filter;
  // Reset to first page for consistency
  setPage(1);
};

// Handle View dengan data lengkap
const handleView = async (request) => {
  // Pastikan data lengkap dan sesuai dengan yang diharapkan ViewDataModal
  const modalData = {
    // API fields yang diharapkan ViewDataModal - sesuai dengan response API
    id_change_req: request.id_change_req || request.id,
    code: request.code || request.id,
    request_type: request.request_type || 'SSI',
    request_type_label: request.request_type_label || 'Benefit',
    status: request.status,
    status_label: request.status_label || getStatusLabel(request.status),
    old_data: request.old_data || {},
    new_data: request.new_data || {
      action: 'update',
      data: request.changes || {}
    },
    created_date: request.created_date || request.dateChange || request.date_change,
    updated_date: request.updated_date || request.lastUpdated,
    attachments: request.attachments || request.documents || [],
    consent: request.consent !== undefined ? request.consent : true,
    reason_when_waiting: request.reason_when_waiting || request.reason || request.reason_update || '',
    reason: request.reason || request.reason_update || '',
    
    // Fields untuk kompatibilitas dengan ViewDataModal
    update: request.request_type ? getCategoryFromRequestType(request.request_type) : (request.category || request.update || 'basic-information'),
    changes: (() => {
      const key = request.request_type ? getCategoryFromRequestType(request.request_type) : (request.category || request.update || 'basic-information');
      const rawNew = request.new_data?.data || request.changes || {};
      const mappedNew = key === 'address' ? mapAddress(rawNew) : rawNew;
      return {
        [key]: {
          old: request.old_data || {},
          new: mappedNew
        }
      };
    })(),
    documents: request.attachments || request.documents || [],
    reviewer: request.reviewer?.name || request.reviewer || request.name_approver || null,
    date_change: request.created_date || request.dateChange || request.date_change,
    approved_at: request.updated_date || request.approvedAt || request.approved_at,
    hc_review_note: request.hc_review_note,
    review_notes: request.review_notes,
    change_history: request.change_history,
    submittedAt: request.created_date || request.submittedAt,
    lastUpdated: request.updated_date || request.lastUpdated,
  };

        // Opening modal with data

  viewModalData.value = {
    isOpen: true,
    requestId: String(request.id_change_req || request.id), // Convert to string for ViewDataModal
    requestStatus: request.status,
    requestData: modalData,
  };
};

// Handle Row Click - automatically open view data modal
const handleRowClick = async (request) => {
  // Same as handleView - open view data modal when row is clicked
  const modalData = {
    // API fields yang diharapkan ViewDataModal - sesuai dengan response API
    id_change_req: request.id_change_req || request.id,
    code: request.code || request.id,
    request_type: request.request_type || 'SSI',
    request_type_label: request.request_type_label || 'Benefit',
    status: request.status,
    status_label: request.status_label || getStatusLabel(request.status),
    old_data: request.old_data || {},
    new_data: request.new_data || {
      action: 'update',
      data: request.changes || {}
    },
    created_date: request.created_date || request.dateChange || request.date_change,
    updated_date: request.updated_date || request.lastUpdated,
    attachments: request.attachments || request.documents || [],
    consent: request.consent !== undefined ? request.consent : true,
    reason_when_waiting: request.reason_when_waiting || request.reason || request.reason_update || '',
    reason: request.reason || request.reason_update || '',
    
    // Fields untuk kompatibilitas dengan ViewDataModal
    update: request.request_type ? getCategoryFromRequestType(request.request_type) : (request.category || request.update || 'basic-information'),
    changes: (() => {
      const key = request.request_type ? getCategoryFromRequestType(request.request_type) : (request.category || request.update || 'basic-information');
      const rawNew = request.new_data?.data || request.changes || {};
      const mappedNew = key === 'address' ? mapAddress(rawNew) : rawNew;
      return {
        [key]: {
          old: request.old_data || {},
          new: mappedNew
        }
      };
    })(),
    documents: request.attachments || request.documents || [],
    reviewer: request.reviewer?.name || request.reviewer || request.name_approver || null,
    date_change: request.created_date || request.dateChange || request.date_change,
    approved_at: request.updated_date || request.approvedAt || request.approved_at,
    hc_review_note: request.hc_review_note,
    review_notes: request.review_notes,
    change_history: request.change_history,
    submittedAt: request.created_date || request.submittedAt,
    lastUpdated: request.updated_date || request.lastUpdated,
  };

        // Opening modal with data (row click)

  viewModalData.value = {
    isOpen: true,
    requestId: String(request.id_change_req || request.id), // Convert to string for ViewDataModal
    requestStatus: request.status,
    requestData: modalData,
  };
};

// Handle Edit dengan data lengkap
const handleEdit = (request) => {
  // Navigate to edit page with clean URL - data will be loaded from API
  navigateTo(`/update-data/edit/${request.id}`);
};

const handleDelete = async (request) => {
  requestToDelete.value = request;
  showDeleteModal.value = true;
};

const confirmDelete = async () => {
  try {
    const requestId = requestToDelete.value?.id;
    const requestCategory = requestToDelete.value?.category ||
                           getCategoryFromRequestType(requestToDelete.value?.request_type);
    const requestStatus = requestToDelete.value?.status;

    console.log(`[DELETE] Deleting request ${requestId} (category: ${requestCategory}, status: ${requestStatus})`);

    await deleteChangeRequest(requestId);
    success("Request deleted successfully");

    // Close modal first
    showDeleteModal.value = false;

    // Reload history data
    await loadChangeRequests();

    // Dispatch enhanced events dengan category info
    window.dispatchEvent(new CustomEvent('requestDeleted', {
      detail: {
        type: 'deleted',
        requestId: requestId,
        category: requestCategory,
        status: requestStatus,
        timestamp: Date.now()
      }
    }));

    // Force refresh untuk update-data page jika ada yang listen
    window.dispatchEvent(new CustomEvent('forceRefreshUpdateData', {
      detail: {
        reason: 'draft_deleted',
        category: requestCategory,
        requestId: requestId,
        timestamp: Date.now()
      }
    }));

    // Also dispatch general update event for backward compatibility
    window.dispatchEvent(new CustomEvent('requestHistoryUpdated', {
      detail: {
        type: 'deleted',
        requestId: requestId,
        category: requestCategory,
        timestamp: Date.now()
      }
    }));

    console.log(`[DELETE] Successfully deleted request ${requestId} and dispatched events`);

    // Clear the request reference after everything is done
    requestToDelete.value = null;
  } catch (err) {
    console.error('[DELETE] Error deleting request:', err);
    showError("An error occurred while deleting the request. Please try again.");
    // Close modal even on error
    showDeleteModal.value = false;
    requestToDelete.value = null;
  }
};



const handleBulkEdit = () => {
  // Implement bulk edit functionality
};

const handleBulkDelete = async () => {
  try {
    const selectedCount = selectedRequests.value.length;
    const categories = [...new Set(selectedRequests.value.map(request =>
      request.category || getCategoryFromRequestType(request.request_type)
    ))];

    console.log(`[BULK_DELETE] Deleting ${selectedCount} requests across categories: ${categories.join(', ')}`);

    const promises = selectedRequests.value.map((request) =>
      deleteChangeRequest(request.id)
    );

    await Promise.all(promises);
    success("Selected requests deleted successfully");

    // Clear selection first
    selectedRequests.value = [];

    // Reload data after successful bulk delete
    await loadChangeRequests();

    // Dispatch enhanced events for each affected category
    categories.forEach(category => {
      window.dispatchEvent(new CustomEvent('forceRefreshUpdateData', {
        detail: {
          reason: 'bulk_draft_deleted',
          category: category,
          count: selectedRequests.value.filter(r =>
            (r.category || getCategoryFromRequestType(r.request_type)) === category
          ).length,
          timestamp: Date.now()
        }
      }));
    });

    // Dispatch specific events to notify other components about the bulk delete
    window.dispatchEvent(new CustomEvent('requestDeleted', {
      detail: {
        type: 'bulk-deleted',
        count: selectedCount,
        categories: categories,
        timestamp: Date.now()
      }
    }));

    // Also dispatch general update event for backward compatibility
    window.dispatchEvent(new CustomEvent('requestHistoryUpdated', {
      detail: {
        type: 'bulk-deleted',
        count: selectedCount,
        categories: categories,
        timestamp: Date.now()
      }
    }));

    console.log(`[BULK_DELETE] Successfully deleted ${selectedCount} requests and dispatched events`);
  } catch (err) {
    console.error('[BULK_DELETE] Error deleting requests:', err);
    showError("An error occurred while deleting selected requests. Please try again.");
  }
};



// Close modal method
const closeViewModal = () => {
  viewModalData.value = {
    isOpen: false,
    requestId: "",
    requestStatus: "",
    requestData: null,
  };
};

// REMOVED: checkDataState function - no longer needed

// REMOVED: All brutal refresh functions and event listeners

// Test function removed - addRequest not available in useChangeRequestHistory composable

// Helper function untuk mendapatkan status label
const getStatusLabel = (status) => {
  const statusMap = {
    '1': 'Draft',
    '2': 'Waiting Approval',
    '3': 'Needs Revision',
    '4': 'Approved',
    '5': 'Rejected'
  };
  return statusMap[status] || 'Unknown Status';
};

// Helper function untuk mapping request_type ke category
const getCategoryFromRequestType = (requestType) => {
  const typeToCategory = {
    'BSC': 'basic-information',
    'ADR': 'address',
    'PYR': 'payroll_account',
    'EMC': 'emergency_contact',
    'EDC': 'education',
    'SSI': 'social_security',
    'MDR': 'medical_record',
    'EMP': 'employment_information',
    'FMY': 'family'
  };
  return typeToCategory[requestType] || 'basic-information';
};


</script>


