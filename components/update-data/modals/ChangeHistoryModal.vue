<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black bg-opacity-50 z-40"
        @click="closeModal"
      ></div>
    </Transition>

    <Transition name="slide">
      <div
        v-if="isOpen"
        class="fixed top-0 right-0 h-full w-3/4 max-w-full sm:max-w-sm bg-white dark:bg-grey-800 shadow-xl z-[60] flex flex-col"
      >
        <div
          class="sticky top-0 bg-white/80 dark:bg-grey-800/80 backdrop-blur-sm border-b border-grey-200 dark:border-grey-700 p-4 md:p-6 flex-shrink-0"
        >
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg md:text-xl font-bold text-text-main">
                Change Request Logs
              </h2>
              <p class="text-xs md:text-sm text-grey-600 dark:text-grey-400 mt-1">
                Track the complete history of your change request
              </p>
            </div>
            <button
              @click="closeModal"
              class="p-2 hover:bg-grey-100 dark:hover:bg-grey-700 rounded-full transition-colors"
            >
              <i class="pi pi-times text-grey-600 dark:text-grey-400"></i>
            </button>
          </div>
        </div>

        <div class="overflow-y-auto flex-grow">
          <!-- Loading State -->
          <div v-if="isLoading" class="text-center py-16 flex flex-col items-center">
            <div class="space-y-4 w-full max-w-sm">
              <!-- Skeleton for title -->
              <div class="h-6 bg-grey-200 dark:bg-grey-700 rounded w-48 mx-auto animate-pulse"></div>
              
              <!-- Skeleton for subtitle -->
              <div class="h-4 bg-grey-200 dark:bg-grey-700 rounded w-64 mx-auto animate-pulse"></div>
              
              <!-- Loading dots -->
              <div class="flex items-center justify-center space-x-2 mt-6">
                <div class="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <div class="w-2 h-2 bg-primary rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
                <div class="w-2 h-2 bg-primary rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
              </div>
            </div>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="text-center py-16 flex flex-col items-center">
            <i class="pi pi-exclamation-triangle text-5xl text-red-500 mb-4"></i>
            <h3 class="text-lg font-medium text-text-main mb-1">
              Error Loading History
            </h3>
            <p class="text-sm text-grey-500 max-w-xs mb-4">
              {{ error }}
            </p>
            <button 
              @click="fetchChangeHistory(requestData?.id_change_req || requestData?.id || requestData?.change_request_id)"
              class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Retry
            </button>
          </div>

          <!-- Change Request Logs Section -->
          <div v-else-if="changeRequestLogs.length > 0" class="p-4 md:p-6">
            <div class="space-y-4">
              <div
                v-for="(log, index) in changeRequestLogs"
                :key="`log-${log.id_change_req_log || index}`"
                class="bg-white dark:bg-grey-700 rounded-lg border border-grey-200 dark:border-grey-600 p-4 shadow-sm"
              >
                <!-- Log Header -->
                <div class="flex items-start justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <!-- Status Badge (similar to StatusTracker) -->
                    <div class="w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0"
                         :class="getStatusBadgeClass(log.new_status)">
                      <i :class="getStatusIcon(log.new_status)" class="text-lg"></i>
                    </div>
                    <div>
                      <h4 class="text-sm font-semibold text-text-main">
                        {{ formatAction(log.action) }}
                      </h4>
                      <p class="text-xs text-grey-500">
                        {{ formatDate(log.created_date) }}
                      </p>
                    </div>
                  </div>
                  <span class="text-xs text-grey-400 bg-grey-100 dark:bg-grey-600 px-2 py-1 rounded-full">
                    #{{ log.id_change_req_log }}
                  </span>
                </div>

                <!-- Status Transition -->
                <div class="mb-3">
                  <div class="flex items-center gap-2 text-xs">
                    <span class="text-grey-500">Status:</span>
                    <span v-if="log.old_status" class="text-red-600 dark:text-red-400 font-medium">
                      {{ log.old_status }}
                    </span>
                    <span v-if="log.old_status && log.new_status" class="text-grey-400">
                      <i class="pi pi-arrow-right"></i>
                    </span>
                    <span class="text-green-600 dark:text-green-400 font-semibold">
                      {{ log.new_status }}
                    </span>
                  </div>
                  <!-- Status Codes for debugging - Hidden for numeric codes -->
                  <div v-if="(log.old_status_code && !isNumericStatus(log.old_status_code)) || (log.new_status_code && !isNumericStatus(log.new_status_code))" class="flex items-center gap-2 text-xs mt-1">
                    <span class="text-grey-400">Codes:</span>
                    <span v-if="log.old_status_code && !isNumericStatus(log.old_status_code)" class="text-grey-500">
                      {{ log.old_status_code }}
                    </span>
                    <span v-if="(log.old_status_code && !isNumericStatus(log.old_status_code)) && (log.new_status_code && !isNumericStatus(log.new_status_code))" class="text-grey-400">
                      <i class="pi pi-arrow-right"></i>
                    </span>
                    <span v-if="log.new_status_code && !isNumericStatus(log.new_status_code)" class="text-grey-500">
                      {{ log.new_status_code }}
                    </span>
                  </div>
                  <!-- Action Display - Hidden for non-informative actions like "Draft" -->
                  <div v-if="log.action && log.action !== 'Draft' && log.action !== 'draft'" class="flex items-center gap-2 text-xs mt-1">
                    <span class="text-grey-400">Action:</span>
                    <span class="text-blue-600 dark:text-blue-400 font-medium">
                      {{ log.action }}
                    </span>
                  </div>
                </div>

                <!-- Note -->
                <div v-if="log.note_employee || log.note_hc" class="mb-3">
                  <!-- Employee Note -->
                  <div v-if="log.note_employee" class="mb-2">
                    <div class="rounded-none p-3 border-l-4 bg-blue-50 dark:bg-blue-900/20 border-blue-500">
                      <div class="flex items-start gap-2">
                        <i class="pi pi-comment text-sm mt-0.5 text-blue-500"></i>
                        <div class="flex-1">
                          <p class="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Employee Note:</p>
                          <p class="text-sm text-grey-700 dark:text-grey-300">
                            {{ log.note_employee }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- HC Note -->
                  <div v-if="log.note_hc" class="mb-2">
                    <div class="rounded-none p-3 border-l-4 bg-orange-50 dark:bg-orange-900/20 border-orange-500">
                      <div class="flex items-start gap-2">
                        <i class="pi pi-comment text-sm mt-0.5 text-orange-500"></i>
                        <div class="flex-1">
                          <p class="text-xs font-medium text-orange-700 dark:text-orange-300 mb-1">HC Note:</p>
                          <p class="text-sm text-grey-700 dark:text-grey-300">
                            {{ log.note_hc }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Employee/Reviewer Info -->
                <div class="mb-3" v-if="log.id_employee">
                  <h5 class="text-xs font-medium text-grey-600 dark:text-grey-400 mb-2">
                    Action by:
                  </h5>
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full overflow-hidden bg-secondary-50 flex items-center justify-center">
                      <img
                        v-if="getEmployeePhoto(log.id_employee)"
                        :src="getEmployeePhoto(log.id_employee)"
                        :alt="getEmployeeName(log.id_employee)"
                        class="w-full h-full object-cover"
                        @error="handlePhotoError(log.id_employee)"
                      />
                      <span v-else class="text-xs font-semibold text-secondary-600">
                        {{ getUserInitials(getEmployeeName(log.id_employee)) }}
                      </span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-text-main truncate">
                        {{ getEmployeeName(log.id_employee) }}
                      </p>
                      <p class="text-xs text-grey-500 truncate">
                        {{ getEmployeeRoleFromStatus(log.new_status, log.action) }}
                      </p>
                    </div>
                    <span class="text-xs text-grey-400 bg-grey-100 dark:bg-grey-600 px-2 py-1 rounded">
                      {{ getActionType(log.new_status, log.action) }}
                    </span>
                  </div>
                </div>

                <!-- Reviewer section removed - using new API structure with id_employee -->

                <!-- Action Details -->
                <div class="flex items-center justify-between text-xs text-grey-500">
                </div>
              </div>
            </div>
            
            <!-- Summary -->
            <div class="flex items-center justify-between mt-6 pt-4 border-t border-grey-100 dark:border-grey-700">
              <span class="text-xs text-grey-500">
                Showing {{ changeRequestLogs.length }} log entries
              </span>
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full" :class="getCurrentStatusColor"></div>
                <span class="text-xs text-grey-600">Current: {{ formatStatusLabel(getCurrentStatus) }}</span>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-16 flex flex-col items-center">
            <i class="pi pi-history text-5xl text-grey-300 dark:text-grey-600 mb-4"></i>
            <h3 class="text-lg font-medium text-text-main mb-1">
              No Change Request Logs
            </h3>
            <p class="text-sm text-grey-500 max-w-xs">
              No change request logs have been recorded for this request yet.
            </p>
            <!-- Additional info for draft status -->
            <div v-if="requestData?.status === '1' || requestData?.status_label?.toLowerCase().includes('draft')" 
                 class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md">
              <p class="text-xs text-blue-700 dark:text-blue-300">
                <i class="pi pi-info-circle mr-1"></i>
                This is a draft request. Logs will appear once the request is submitted or processed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useApi } from '~/composables/useApi';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  requestData: { type: Object, default: () => ({}) },
});

const emit = defineEmits(["close"]);
const closeModal = () => emit("close");

// API integration
const { apiGet } = useApi();
const isLoading = ref(false);
const error = ref(null);
const apiLogs = ref([]);

// Employee names cache
const employeeNames = ref({});

// Employee photos cache
const employeePhotos = ref({});

// Fetch change history from API
const fetchChangeHistory = async (idChangeReq) => {
  if (!idChangeReq) return;
  
  isLoading.value = true;
  error.value = null;
  
  try {
    const response = await apiGet(`/employee/update-histories/${idChangeReq}`);
    
    if (response.success && response.data) {
      // Handle both array and object responses
      if (Array.isArray(response.data)) {
        apiLogs.value = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        apiLogs.value = response.data.data;
      } else {
        apiLogs.value = [];
      }
      
              // Sort logs by created_date (newest first)
        if (apiLogs.value.length > 0) {
          apiLogs.value.sort((a, b) => {
            const parseDate = (dateStr) => {
              if (!dateStr) return 0;
              try {
                // Handle format "27-08-2025 19-47-53" (API format)
                if (dateStr.includes('-') && dateStr.includes(' ')) {
                  const [datePart, timePart] = dateStr.split(' ');
                  const [day, month, year] = datePart.split('-').map(Number);
                  const [hour, minute, second] = timePart.split('-').map(Number);
                  const timestamp = new Date(year, month - 1, day, hour, minute, second).getTime();
                  return timestamp;
                }
                
                // Handle format "07-08-2025 11:16:50" (legacy format)
                if (dateStr.includes('-') && dateStr.includes(':')) {
                  const [datePart, timePart] = dateStr.split(' ');
                  const [day, month, year] = datePart.split('-').map(Number);
                  const [hour, minute, second] = timePart.split(':').map(Number);
                  const timestamp = new Date(year, month - 1, day, hour, minute, second).getTime();
                  return timestamp;
                }
                
                // Handle ISO format "2025-08-27T19:47:53.000Z"
                if (dateStr.includes('T')) {
                  const timestamp = new Date(dateStr).getTime();
                  return timestamp;
                }
                
                // Fallback to standard date parsing
                const timestamp = new Date(dateStr).getTime();
                return timestamp;
              } catch (e) {
                console.warn('Failed to parse date:', dateStr, e);
                return 0;
              }
            };
            
            const dateA = parseDate(a.created_date);
            const dateB = parseDate(b.created_date);
            
            
            return dateB - dateA; // Newest first
          });
          
          // Fetch employee names for all logs
          const uniqueEmployeeIds = [...new Set(apiLogs.value.map(log => log.id_employee).filter(Boolean))];
          uniqueEmployeeIds.forEach(employeeId => {
            fetchEmployeeName(employeeId);
          });
        }
    } else {
      apiLogs.value = [];
    }
  } catch (err) {
    error.value = 'Failed to load change history';
    apiLogs.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Fetch employee name by ID
const fetchEmployeeName = async (employeeId) => {
  if (!employeeId || employeeNames.value[employeeId]) return;
  
  try {
    const response = await apiGet(`/employee/basic-information?id=${employeeId}`);
    if (response.success && response.data) {
      const employee = response.data;
      // Try to get full name first, then email as fallback
      let displayName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
      
      if (!displayName) {
        // If no full name, try other name fields
        displayName = employee.name || employee.display_name || employee.username;
      }
      
      if (!displayName) {
        // If still no name, try email as fallback
        displayName = employee.email || employee.business_email || employee.personal_email;
      }
      
      if (!displayName) {
        // Final fallback
        displayName = `Employee ${employeeId}`;
      }
      
      employeeNames.value[employeeId] = displayName;
      
      // Also fetch employee photo if available
      if (employee.photo_url || employee.profile_picture || employee.avatar) {
        const photoUrl = employee.photo_url || employee.profile_picture || employee.avatar;
        employeePhotos.value[employeeId] = photoUrl;
      }
    }
  } catch (err) {
    employeeNames.value[employeeId] = `Employee ${employeeId}`;
  }
};

// Fetch employee photo by ID (separate function for photo-specific fetching)
const fetchEmployeePhoto = async (employeeId) => {
  if (!employeeId || employeePhotos.value[employeeId]) return;
  
  try {
    const response = await apiGet(`/employee/basic-information?id=${employeeId}`);
    if (response.success && response.data) {
      const employee = response.data;
      if (employee.photo_url || employee.profile_picture || employee.avatar) {
        const photoUrl = employee.photo_url || employee.profile_picture || employee.avatar;
        employeePhotos.value[employeeId] = photoUrl;
      }
    }
  } catch (err) {
  }
};

// Get employee name (from cache or fetch if needed)
const getEmployeeName = (employeeId) => {
  if (!employeeId) return 'Unknown Employee';
  
  if (!employeeNames.value[employeeId]) {
    // Fetch employee name if not in cache
    fetchEmployeeName(employeeId);
    return `Employee ${employeeId}`; // Return temporary name while fetching
  }
  
  return employeeNames.value[employeeId];
};

// Get employee photo (from cache or fetch if needed)
const getEmployeePhoto = (employeeId) => {
  if (!employeeId) return null;
  
  if (!employeePhotos.value[employeeId]) {
    // Fetch employee photo if not in cache
    fetchEmployeePhoto(employeeId);
    return null; // Return null while fetching
  }
  
  return employeePhotos.value[employeeId];
};

// Handle photo loading error
const handlePhotoError = (employeeId) => {
  // Remove failed photo from cache so it shows initials instead
  delete employeePhotos.value[employeeId];
};

// Check if status is numeric (to hide numeric codes like 1-2)
const isNumericStatus = (status) => {
  if (!status) return false;
  return /^\d+$/.test(String(status));
};

// Filter duplicate and non-informative logs
const filterDuplicateLogs = (logs) => {
  if (!Array.isArray(logs) || logs.length === 0) return logs;
  
  const filtered = [];
  const seenDraftCreations = new Set();
  
  for (const log of logs) {
    // Skip if this is a duplicate draft creation log
    if (log.action === 'Draft' || log.action === 'draft') {
      const key = `${log.id_employee}_${log.new_status}_draft`;
      if (seenDraftCreations.has(key)) {
        continue;
      }
      seenDraftCreations.add(key);
    }
    
    // Skip if this log has no meaningful information
    if (isNonInformativeLog(log)) {
      continue;
    }
    
    filtered.push(log);
  }
  
  // If we filtered out everything, return original logs to avoid empty state
  if (filtered.length === 0 && logs.length > 0) {
    return logs;
  }
  
  return filtered;
};

// Check if a log is non-informative (should be hidden) - less aggressive filtering
const isNonInformativeLog = (log) => {
  // Skip logs that only show "Draft" status without meaningful changes
  if (log.new_status === 'Draft' && log.old_status === 'Draft' && 
      (!log.note_employee || log.note_employee === 'Draft - Auto saved changes')) {
    return true;
  }
  
  // Skip logs with empty or non-informative notes (but be less strict)
  if (log.note_employee === 'Draft - Auto saved changes' && 
      (!log.old_status || log.old_status === log.new_status) &&
      !log.action && !log.id_employee) {
    return true;
  }
  
  // Don't filter out logs with meaningful actions or status changes
  if (log.action && log.action !== 'Draft' && log.action !== 'draft') {
    return false;
  }
  
  // Don't filter out logs with status changes
  if (log.old_status && log.new_status && log.old_status !== log.new_status) {
    return false;
  }
  
  // Don't filter out logs with notes
  if (log.note_employee || log.note_hc) {
    return false;
  }
  
  return false;
};

// Debug function untuk melihat data logs
const debugLogs = () => {
  
  if (changeRequestLogs.value.length > 0) {
    changeRequestLogs.value.forEach((log, index) => {
    });
    
    
  }
};

// Expose debug function to window
if (process.client) {
  window.debugChangeHistoryModal = debugLogs;
}

// Watch for modal open and requestData changes
watch([() => props.isOpen, () => props.requestData], ([isOpen, requestData]) => {
  if (isOpen && requestData) {
    const idChangeReq = requestData.id_change_req || requestData.id || requestData.change_request_id || requestData.request_id;
    if (idChangeReq) {
      fetchChangeHistory(idChangeReq);
    } else {
    }
  }
}, { immediate: true });

// Get change request logs from API or fallback to request data
const changeRequestLogs = computed(() => {
  
  // SIMPLIFIED VERSION - just return API logs directly
  if (apiLogs.value && apiLogs.value.length > 0) {
    return apiLogs.value;
  }
  
  // Fallback to props data - also sort these logs
  if (props.requestData?.change_request_logs && Array.isArray(props.requestData.change_request_logs)) {
    const logs = [...props.requestData.change_request_logs];
    
    // Sort fallback logs by created_date (newest first)
    logs.sort((a, b) => {
      const parseDate = (dateStr) => {
        if (!dateStr) return 0;
        try {
          // Handle format "27-08-2025 19-47-53" (API format)
          if (dateStr.includes('-') && dateStr.includes(' ')) {
            const [datePart, timePart] = dateStr.split(' ');
            const [day, month, year] = datePart.split('-').map(Number);
            const [hour, minute, second] = timePart.split('-').map(Number);
            return new Date(year, month - 1, day, hour, minute, second).getTime();
          }
          
          // Handle format "07-08-2025 11:16:50" (legacy format)
          if (dateStr.includes('-') && dateStr.includes(':')) {
            const [datePart, timePart] = dateStr.split(' ');
            const [day, month, year] = datePart.split('-').map(Number);
            const [hour, minute, second] = timePart.split(':').map(Number);
            return new Date(year, month - 1, day, hour, minute, second).getTime();
          }
          
          // Handle ISO format "2025-08-27T19:47:53.000Z"
          if (dateStr.includes('T')) {
            return new Date(dateStr).getTime();
          }
          
          // Fallback to standard date parsing
          return new Date(dateStr).getTime();
        } catch (e) {
          console.warn('Failed to parse date:', dateStr, e);
          return 0;
        }
      };
      
      const dateA = parseDate(a.created_date);
      const dateB = parseDate(b.created_date);
      
      
      return dateB - dateA; // Newest first
    });
    
    return logs;
  }
  
  return [];
});

function normalizeStatus(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[_\s]+/g, ' ').trim();
}

function formatStatusLabel(str) {
  if (!str) return '';
  return str
    .replace(/[_\s]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Get current status from API logs
const getCurrentStatus = computed(() => {
  // Priority 1: Use status from requestData if available
  if (props.requestData?.status) {
    return props.requestData.status;
  }
  
  // Priority 2: Use newest log from API
  if (changeRequestLogs.value.length > 0) {
    const newestLog = changeRequestLogs.value[0]; // Already sorted by date
    return newestLog.new_status || 'Unknown';
  }
  
  return 'Unknown';
});

// Get current status color for summary
const getCurrentStatusColor = computed(() => {
  const status = getCurrentStatus.value;
  if (!status) return 'bg-grey-500';
  
  const statusLower = status.toLowerCase();
  if (statusLower.includes('draft')) return 'bg-blue-500';
  if (statusLower.includes('waiting')) return 'bg-yellow-500';
  if (statusLower.includes('approved')) return 'bg-green-500';
  if (statusLower.includes('revision')) return 'bg-red-500';
  if (statusLower.includes('rejected')) return 'bg-red-500';
  if (statusLower.includes('submitted')) return 'bg-primary-500';
  
  return 'bg-grey-500';
});

// Get status badge class (similar to StatusTracker)
const getStatusBadgeClass = (status) => {
  if (!status) return 'border-grey-300 bg-grey-100 dark:bg-grey-700 dark:border-grey-600 text-grey-500 dark:text-grey-400';
  
  const statusLower = status.toLowerCase();
  if (statusLower.includes('draft')) {
    return 'border-primary-600 bg-primary-600 text-white dark:bg-primary-500 dark:border-primary-500';
  }
  if (statusLower.includes('waiting') || statusLower.includes('pending')) {
    return 'border-primary-600 bg-primary-600 text-white dark:bg-primary-500 dark:border-primary-500';
  }
  if (statusLower.includes('approved')) {
    return 'border-primary-600 bg-primary-600 text-white dark:bg-primary-500 dark:border-primary-500';
  }
  if (statusLower.includes('rejected') || statusLower.includes('revision')) {
    return 'border-warning-500 bg-warning-500 text-white dark:bg-warning-500 dark:border-warning-500';
  }
  if (statusLower.includes('submitted')) {
    return 'border-primary-600 bg-primary-600 text-white dark:bg-primary-500 dark:border-primary-500';
  }
  
  return 'border-grey-300 bg-grey-100 dark:bg-grey-700 dark:border-grey-600 text-grey-500 dark:text-grey-400';
};

// Get status icon (similar to StatusTracker)
const getStatusIcon = (status) => {
  if (!status) return 'pi pi-question';
  
  const statusLower = status.toLowerCase();
  if (statusLower.includes('draft')) return 'pi pi-file';
  if (statusLower.includes('waiting') || statusLower.includes('pending')) return 'pi pi-calendar';
  if (statusLower.includes('approved')) return 'pi pi-check';
  if (statusLower.includes('rejected') || statusLower.includes('revision')) return 'pi pi-exclamation-triangle';
  if (statusLower.includes('submitted')) return 'pi pi-user';
  
  return 'pi pi-info-circle';
};

// Format action for display
const formatAction = (action) => {
  if (!action) return 'Status Change';
  
  const actionLower = action.toLowerCase();
  if (actionLower.includes('waiting')) return 'Waiting for Approval';
  if (actionLower.includes('approved')) return 'Request Approved';
  if (actionLower.includes('rejected')) return 'Request Rejected';
  if (actionLower.includes('revision')) return 'Needs Revision';
  if (actionLower.includes('submitted')) return 'Request Submitted';
  if (actionLower.includes('draft')) return 'Draft Created';
  
  return action;
};

// Get user initials for fallback avatar
const getUserInitials = (name) => {
  if (!name || typeof name !== 'string') return 'U';
  
  const nameParts = name.trim().split(' ');
  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase();
  }
  
  return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
};

// Format date - handle both "27-08-2025 19-47-53" and standard formats
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date';
  
  try {
    // Handle format "27-08-2025 19-47-53" (API format)
    if (dateString.includes('-') && dateString.includes(' ')) {
      const [datePart, timePart] = dateString.split(' ');
      const [day, month, year] = datePart.split('-');
      const [hour, minute, second] = timePart.split('-');
      
      const date = new Date(year, month - 1, day, hour, minute, second);
      
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Handle format "07-08-2025 11:16:50" (legacy format)
    if (dateString.includes('-') && dateString.includes(':')) {
      const [datePart, timePart] = dateString.split(' ');
      const [day, month, year] = datePart.split('-');
      const [hour, minute, second] = timePart.split(':');
      
      const date = new Date(year, month - 1, day, hour, minute, second);
      
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Fallback to standard date parsing
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateString; // Return original string if parsing fails
  }
};

// Get employee role based on status change and action
const getEmployeeRoleFromStatus = (status, action) => {
  if (!status) return 'Employee';
  
  const statusLower = status.toLowerCase();
  const actionLower = action ? action.toLowerCase() : '';
  
  // Check action first for more accurate role determination
  if (actionLower.includes('waiting') || actionLower.includes('submitted')) {
    return 'Employee';
  }
  if (actionLower.includes('approved')) {
    return 'HC Manager';
  }
  if (actionLower.includes('revision') || actionLower.includes('rejected')) {
    return 'HC Staff';
  }
  
  // Fallback to status-based role
  if (statusLower.includes('draft')) return 'Employee';
  if (statusLower.includes('waiting') || statusLower.includes('submitted')) return 'Employee';
  if (statusLower.includes('approved')) return 'HC Manager';
  if (statusLower.includes('rejected') || statusLower.includes('revision')) return 'HC Staff';
  
  return 'Employee';
};

// Get action type for display based on action field
const getActionType = (status, action) => {
  if (!status) return 'Action';
  
  const actionLower = action ? action.toLowerCase() : '';
  
  // Use action field if available for more accurate display
  if (actionLower.includes('waiting')) return 'Submitter';
  if (actionLower.includes('approved')) return 'Approver';
  if (actionLower.includes('revision') || actionLower.includes('rejected')) return 'Reviewer';
  if (actionLower.includes('submitted')) return 'Submitter';
  if (actionLower.includes('draft')) return 'Creator';
  
  // Fallback to status-based action type
  const statusLower = status.toLowerCase();
  if (statusLower.includes('draft')) return 'Creator';
  if (statusLower.includes('waiting') || statusLower.includes('submitted')) return 'Submitter';
  if (statusLower.includes('approved')) return 'Approver';
  if (statusLower.includes('rejected') || statusLower.includes('revision')) return 'Reviewer';
  
  return 'Actor';
};

</script>

<style scoped>
.backdrop-enter-active, .backdrop-leave-active { transition: opacity 0.3s ease; }
.backdrop-enter-from, .backdrop-leave-to { opacity: 0; }
.slide-enter-active, .slide-leave-active { transition: transform 0.3s ease; }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }
.slide-enter-to, .slide-leave-from { transform: translateX(0); }
</style>