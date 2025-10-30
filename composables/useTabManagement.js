import { ref, computed, watch, nextTick } from "vue";
import { useMasterData } from "~/composables/useMasterData";
import { useChangeRequestHistory } from "./useChangeRequestHistory";
import { useUnifiedEditState } from "./useUnifiedEditState";

export const useTabManagement = () => {
  const { requests: changeRequests, loadChangeRequests } = useChangeRequestHistory();
  
  // ✅ GLOBAL CACHE: Track if we've already loaded change requests
  const changeRequestsLoaded = ref(false);
  let ensureLoadingPromise = null;

  // ✅ HELPER: Load change requests with global cache and deduplication
  const ensureChangeRequestsLoaded = async () => {
    if (changeRequestsLoaded.value && changeRequests.value !== null && changeRequests.value !== undefined) {
      // Already loaded, whether empty array or has items
      return;
    }

    // ✅ DEDUPLICATION: Return existing promise if already loading
    if (ensureLoadingPromise) {
      return ensureLoadingPromise;
    }

    ensureLoadingPromise = (async () => {
      try {
        await loadChangeRequests();
        changeRequestsLoaded.value = true;
      } finally {
        ensureLoadingPromise = null;
      }
    })();

    return ensureLoadingPromise;
  };

  // ✅ HELPER: Reset change requests cache to force fresh load
  const resetChangeRequestsCache = () => {
    changeRequestsLoaded.value = false;
    ensureLoadingPromise = null;
    
    // Reset tab status cache juga untuk memastikan data terbaru
    invalidateAllCache();
  };
  
  // Use unified edit state
  const unifiedEditState = useUnifiedEditState();
  const {
    globalEditMode,
    activeEditTab,
    enterEditMode,
    exitEditMode,
    switchTabWithPreservation,
    logCurrentState
  } = unifiedEditState;
  
  // Legacy compatibility - map to unified state
  const activeTab = ref("basic-information");
  
  // OPTIMIZED: Stable edit mode state with better reactivity
  const editMode = computed({
    get: () => {
      // Only return true if we're actually in edit mode AND current tab is eligible
      return globalEditMode.value && canEditTabCompletelySync(activeTab.value);
    },
    set: (value) => {
      if (value) {
        // Only enter edit mode if current tab is eligible
        if (canEditTabCompletelySync(activeTab.value)) {
          enterEditMode(activeTab.value, canEditTabCompletelySync);
        }
      } else {
        exitEditMode();
      }
    }
  });
  
  const showConfirmationModal = ref(false);
  const pendingTabSwitch = ref(null);
  
  // OPTIMIZED: Debounced tab change handler to prevent rapid state changes
  let tabChangeTimeout = null;
  
  // Smart refresh system - only refresh when needed
  let lastRefreshTime = 0;
  let refreshTimeout = null;
  const MIN_REFRESH_INTERVAL = 2000; // 2 seconds minimum between refreshes
  
  // Watch for activeTab changes - integrate with unified edit state
  watch(activeTab, async (newTab, oldTab) => {
    if (newTab && newTab !== oldTab) {
      // Clear any pending tab change
      if (tabChangeTimeout) {
        clearTimeout(tabChangeTimeout);
      }
      
      // Debounce tab change to prevent rapid state updates
      tabChangeTimeout = setTimeout(async () => {
        logCurrentState(`Tab change from ${oldTab} to ${newTab}`);
        
        // Pre-load data for the new tab immediately
        await preloadTabData(newTab);
        
        // Update canEditCurrentTab for the new tab
        await updateCanEditCurrentTab();
        
        // Use unified state for tab switching with edit mode preservation
        await switchTabWithPreservation(newTab, canEditTabCompletelySync);
        
        // Preserve edit mode if it was active and new tab is eligible
        if (globalEditMode.value && canEditTabCompletelySync(newTab)) {
          // Keep edit mode active for the new tab
          nextTick(() => {
            if (!globalEditMode.value) {
              enterEditMode(newTab, canEditTabCompletelySync);
            }
          });
        }
      }, 100); // Small delay to prevent rapid changes
    }
  });

  // Function to check for unsaved changes (will be passed from parent component)
  let hasUnsavedChangesFn = null;

  const setHasUnsavedChangesFunction = (fn) => {
    hasUnsavedChangesFn = fn;
  };

  // Computed property to check for unsaved changes
  const hasUnsavedChanges = computed(() => {
    if (!hasUnsavedChangesFn) {
      return false;
    }
    
    try {
      const result = hasUnsavedChangesFn();
      return result;
    } catch {
      return false;
    }
  });

  // Function to force check hasUnsavedChanges
  const checkHasUnsavedChanges = async () => {
    if (hasUnsavedChangesFn) {
      try {
        const result = hasUnsavedChangesFn();
        return result;
      } catch {
        return false;
      }
    }
    return false;
  };

  // Tambahkan di useTabManagement.js
const reloadWarningBanner = async (force = false) => {
  try {
    // Force refresh change requests
    await ensureChangeRequestsLoaded();
    
    // Invalidate cache untuk current tab
    invalidateTabCache(activeTab.value);
    
    // Update cache untuk current tab
    await updateTabStatusCache(activeTab.value);
    
  } catch (error) {
    console.warn('Failed to reload warning banner:', error);
  }
};

  // Function to reset data (will be passed from parent component)
  let resetDataFn = null;

  const setResetDataFunction = (fn) => {
    resetDataFn = fn;
  };

  // OPTIMIZED: Preload tab data to reduce delay
  const preloadTabData = async (tabId) => {
    try {
      
      // Import usePersonalData to load tab-specific data
      const { usePersonalData } = await import('~/composables/usePersonalData');
      const personalData = usePersonalData();
      
      // Load data based on tab
      switch (tabId) {
        case 'basic-information':
          await personalData.loadBasicInformation();
          break;
        case 'address':
          await personalData.loadAddress();
          break;
        case 'emergency-contact':
          await personalData.loadEmergencyContact();
          break;
        case 'payroll-account':
          await personalData.loadPayrollAccount();
          break;
        case 'education':
          await personalData.loadEducation();
          break;
        case 'medical-record':
          await personalData.loadMedicalRecord();
          break;
        case 'employment-info':
        case 'employment-information':
          await personalData.loadEmploymentInfo();
          break;
        case 'family':
          await personalData.loadFamily();
          break;
        case 'social-security':
          await personalData.loadSocialSecurity();
          break;
        default:
      }
      
    } catch {
      // Error handled silently
    }
  };

  // Tab configuration
  const tabs = [
    {
      id: "basic-information",
      label: "Basic Information",
      icon: "pi pi-user",
    },
    {
      id: "address",
      label: "Address",
      icon: "pi pi-home",
    },
    {
      id: "emergency-contact",
      label: "Emergency Contact",
      icon: "pi pi-phone",
    },
    {
       id: "payroll-account",
       label: "Payroll Account",
       icon: "pi pi-credit-card",
     },
     {
       id: "family",
       label: "Family",
       icon: "pi pi-users",
     },
     {
       id: "education",
       label: "Education",
       icon: "pi pi-graduation-cap",
     },
     {
       id: "social-security",
       label: "Benefit",
       icon: "pi pi-shield",
     },
     {
       id: "medical-record",
       label: "Medical Record",
       icon: "pi pi-heart",
     },
     {
       id: "employment-information",
       label: "Employment Information",
       icon: "pi pi-briefcase",
     },
   ];

   // Breadcrumb items
   const breadcrumbItems = [
     { label: "Home", to: "/" },
     { label: "Update Personal Data", to: "/update-data" },
   ];

   // Options for select fields
   // Use reactive refs and populate common master-data driven options
   const genderOptions = ref([]);

   const maritalStatusOptions = ref([]);

   const relationshipOptions = ref([]);

   const educationStatusOptions = [
     { label: "Completed", value: "completed" },
     { label: "In Progress", value: "in_progress" },
     { label: "Not Started", value: "not_started" },
   ];

   const bpjsStatusOptions = [
     { label: "Active", value: "active" },
     { label: "Inactive", value: "inactive" },
     { label: "Pending", value: "pending" },
   ];

  const bloodTypeOptions = ref([]);

  const healthStatusOptions = ref([]);

   const employmentStatusOptions = [
     { label: "Full-time", value: "full_time" },
     { label: "Part-time", value: "part_time" },
     { label: "Contract", value: "contract" },
     { label: "Intern", value: "intern" },
   ];

   // Optional master-data driven options (bank, tax) - keep local fallbacks if master missing
   const bankOptions = ref([]);
   const taxStatusOptions = ref([]);

   // Load master-data driven lists asynchronously
   (async () => {
     try {
       const md = useMasterData();

       // ✅ OPTIMIZED: Master data is already preloaded in layout, no need to load here
       // Options will be loaded when needed via getOptions

       const t = await md.getOptions('TAX_STATUS');
       taxStatusOptions.value = Array.isArray(t) ? t.map(o => ({ label: o.value, value: o.code })) : [];

       // Load medical related master data from EMP_HEALTH
       const overall = await md.getOptions('EMP_HEALTH', 'overall_status');
       healthStatusOptions.value = Array.isArray(overall) ? overall.map(o => ({ label: o.value, value: o.value, code: String(o.code) })) : [];

       const blood = await md.getOptions('EMP_HEALTH', 'blood_type');
       bloodTypeOptions.value = Array.isArray(blood) ? blood.map(o => ({ label: o.value, value: o.value, code: String(o.code) })) : [];
     } catch {
       // ignore and fall back to static data where applicable
     }
   })();

  // OPTIMIZED: Tab change handler with better unsaved changes check
  const handleTabChange = async (newTab) => {
    if (hasUnsavedChangesFn) {
      const hasChanges = hasUnsavedChangesFn();
      
      // If in edit mode and there are unsaved changes, prevent tab switching
      // But don't show confirmation modal - let the parent component handle it
      if (editMode.value && hasChanges) {
        pendingTabSwitch.value = newTab;
        // Don't show confirmation modal here - parent will handle with ChangeRequestModal
        return;
      }
    }

    // If not in edit mode or no unsaved changes, allow normal tab switching
    await switchTab(newTab);
  };

  // OPTIMIZED: Switch tab and load data with better performance
  const switchTab = async (newTab) => {
    activeTab.value = newTab;
    
    // Auto-load data for the new tab
    try {
      
      // Use preloaded data if available, otherwise load
      await preloadTabData(newTab);
      
    } catch {
      // Error handled silently
    }
  };

  // Function to check if a category has waiting approval request
  const getCategoryFromTabId = (tabId) => {
    const categoryMap = {
      'basic-information': 'Basic Information',
      'address': 'Address',
      'emergency-contact': 'Emergency Contact',
      'payroll-account': 'Payroll Account', 
      'education': 'Education',
      'medical-record': 'Medical Record',
      'employment-information': 'Employment Information',
      'employment-info': 'Employment Information',
      'family': 'Family',
      'social-security': 'Benefit'
    };
    return categoryMap[tabId] || tabId;
  };

  // ✅ OPTIMIZED: Function to check if a category has draft request with DEBUG logging
  const hasDraftForCategory = async (category) => {
    // Use cached data if available and recent
    const cached = tabStatusCache.value[category];
    if (cached && cached.isInitialized && (Date.now() - cached.lastUpdated) < 5000) {
      return cached.hasDraft;
    }

    // ✅ OPTIMIZED: Use global cache
    await ensureChangeRequestsLoaded();

    if (!changeRequests.value || changeRequests.value.length === 0) {
      return false;
    }

    const currentCategory = getCategoryFromTabId(category);

    const hasDraft = changeRequests.value.some(request => {
      // Map request to our internal tab id, prefer request_type code
      const requestTab = mapRequestToTabId(request);
      const requestCategory = requestTab ? getCategoryFromTabId(requestTab) : getCategoryFromTabId(request.request_type_label || request.request_type);

      // Check if request is in draft status (status = '1' or status_label includes 'draft')
      const isDraft = request.status === '1' || request.status === 1 ||
                     (request.status_label && request.status_label.toLowerCase().includes('draft'));

      const categoryMatch = requestCategory === currentCategory;

      return isDraft && categoryMatch;
    });

    return hasDraft;
  };

  // OPTIMIZED: Function to get draft request for a specific category
  const getDraftForCategory = async (category) => {
    // Use cached data if available
    const cached = tabStatusCache.value[category];
    if (cached && cached.isInitialized && (Date.now() - cached.lastUpdated) < 5000) {
      return cached.draftRequest || null;
    }
    
    // ✅ OPTIMIZED: Use global cache
    await ensureChangeRequestsLoaded();
    
    if (!changeRequests.value || changeRequests.value.length === 0) {
      return null;
    }
    
    const currentCategory = getCategoryFromTabId(category);
    
    const draftRequest = changeRequests.value.find(request => {
      const requestTab = mapRequestToTabId(request);
      const requestCategory = requestTab ? getCategoryFromTabId(requestTab) : getCategoryFromTabId(request.request_type_label || request.request_type);
      
      const isDraft = request.status === '1' || request.status === 1 || 
                     (request.status_label && request.status_label.toLowerCase().includes('draft'));
      
      const categoryMatch = requestCategory === currentCategory;
      
      return isDraft && categoryMatch;
    });
    
    return draftRequest;
  };

  // OPTIMIZED: Function to check if a tab can be edited (combines locked + waiting approval + draft + need revision)
  const canEditTabCompletely = async (tabId) => {
    // Check if tab is permanently locked
    if (isTabPermanentlyLocked(tabId)) {
      return false;
    }
    
    // Check if there's a waiting approval request for this category
    const hasWaiting = await hasWaitingApprovalForCategory(tabId);
    if (hasWaiting) {
      return false;
    }
    
    // Check if there's a draft request for this category
    const hasDraft = await hasDraftForCategory(tabId);
    if (hasDraft) {
      return false;
    }
    
    // Check if there's a need revision request for this category
    const hasNeedRevision = await hasNeedRevisionForCategory(tabId);
    if (hasNeedRevision) {
      return false;
    }
    
    return true;
  };

  // OPTIMIZED: Cache for synchronous status checks with better performance
  const tabStatusCache = ref({});
  const pendingUpdates = ref(new Set());
  
  // ✅ OPTIMIZED: Update tab status cache with smart caching
  const updateTabStatusCache = async (tabId, force = false) => {
    // Prevent multiple concurrent updates for the same tab
    if (pendingUpdates.value.has(tabId)) {
      return;
    }

    // ✅ CHECK: If cache is still valid AND not forced, skip update
    if (!force) {
      const cached = tabStatusCache.value[tabId];
      if (cached && cached.isInitialized && (Date.now() - cached.lastUpdated) < 5000) {
        // Cache is still fresh (< 5 seconds), no need to update
        return;
      }
    }

    pendingUpdates.value.add(tabId);

    try {
      // const category = getCategoryFromTabId(tabId);

      // ✅ OPTIMIZED: Check for draft, waiting approval, and need revision in parallel
      // These functions now use optimized ensureChangeRequestsLoaded with deduplication
      const [hasDraft, hasWaiting, hasNeedRevision] = await Promise.all([
        hasDraftForCategory(tabId),
        hasWaitingApprovalForCategory(tabId),
        hasNeedRevisionForCategory(tabId)
      ]);
      
      // Get draft and need revision requests if exist
      const draftRequest = hasDraft ? await getDraftForCategory(tabId) : null;
      const needRevisionRequest = hasNeedRevision ? await getNeedRevisionForCategory(tabId) : null;
      
      tabStatusCache.value[tabId] = {
        hasDraft,
        hasWaiting,
        hasNeedRevision,
        draftRequest,
        needRevisionRequest,
        lastUpdated: Date.now(),
        isInitialized: true
      };
    } catch (error) {
      
      // Check if it's a server error (503, 500, etc.)
      const isServerError = error.message && (
        error.message.includes('Server sedang tidak tersedia') ||
        error.message.includes('Server error') ||
        error.message.includes('503') ||
        error.message.includes('500')
      );
      
      if (isServerError) {
        // Untuk server error, set cache dengan timeout yang lebih lama
        tabStatusCache.value[tabId] = {
          hasDraft: false,
          hasWaiting: false,
          hasNeedRevision: false,
          draftRequest: null,
          needRevisionRequest: null,
          lastUpdated: Date.now(),
          isInitialized: true,
          error: true,
          serverError: true,
          retryAfter: Date.now() + 30000 // Retry setelah 30 detik
        };
      } else {
        // Untuk error lain, set cache normal
        tabStatusCache.value[tabId] = {
          hasDraft: false,
          hasWaiting: false,
          hasNeedRevision: false,
          draftRequest: null,
          needRevisionRequest: null,
          lastUpdated: Date.now(),
          isInitialized: true,
          error: true
        };
      }
    } finally {
      pendingUpdates.value.delete(tabId);
    }
  };
  
  // Initialize cache for a tab if not already done
  const initializeTabCache = (tabId) => {
    const cached = tabStatusCache.value[tabId];
    if (!cached || !cached.isInitialized) {
      updateTabStatusCache(tabId);
    }
  };

  // Debouncing untuk mencegah multiple calls bersamaan
  const updateDebouncers = new Map();
  const DEBOUNCE_DELAY = 100; // 100ms for responsive updates

  // Invalidate cache for a specific tab (force refresh)
  const invalidateTabCache = (tabId) => {
    if (tabStatusCache.value[tabId]) {
      delete tabStatusCache.value[tabId];
    }

    // Debounce individual tab updates to prevent multiple concurrent calls
    if (updateDebouncers.has(tabId)) {
      clearTimeout(updateDebouncers.get(tabId));
    }

    updateDebouncers.set(tabId, setTimeout(() => {
      updateTabStatusCache(tabId);
      updateDebouncers.delete(tabId);
    }, DEBOUNCE_DELAY));
  };

  // Invalidate all cache (force refresh all tabs) dengan debouncing
  const invalidateAllCache = () => {
    // Clear existing debouncer
    if (updateDebouncers.has('all')) {
      clearTimeout(updateDebouncers.get('all'));
    }

    // Set new debouncer
    updateDebouncers.set('all', setTimeout(() => {
      const tabsToUpdate = Object.keys(tabStatusCache.value);
      tabStatusCache.value = {};

      // Update tabs satu per satu dengan delay untuk mencegah spam
      tabsToUpdate.forEach((tabId, index) => {
        setTimeout(() => {
          updateTabStatusCache(tabId);
        }, index * 200); // 200ms delay antar tab
      });

      updateDebouncers.delete('all');
    }, DEBOUNCE_DELAY));
  };

  // ✅ NEW: Force update ALL tabs cache untuk real-time check saat remount
  const forceUpdateAllTabsCache = async () => {

    // List of all tabs to check
    const allTabs = [
      'basic-information',
      'address',
      'emergency-contact',
      'payroll-account',
      'family',
      'education',
      'social-security',
      'medical-record',
      'employment-information'
    ];

    // Clear existing cache
    tabStatusCache.value = {};

    // Ensure change requests are loaded first
    await ensureChangeRequestsLoaded();

    // Update ALL tabs in parallel with force flag
    const updatePromises = allTabs.map(tabId =>
      updateTabStatusCache(tabId, true) // force = true
    );

    await Promise.all(updatePromises);
  };

  // ✅ FIXED: Real-time synchronous check with AGGRESSIVE cache expiry
  const canEditTabCompletelySync = (tabId) => {
    // Check if tab is permanently locked
    if (isTabPermanentlyLocked(tabId)) {
      return false;
    }

    // Check cached status
    const cached = tabStatusCache.value[tabId];
    if (cached && cached.isInitialized) {
      // Check if it's a server error that needs longer timeout
      if (cached.serverError && cached.retryAfter) {
        const canRetry = Date.now() > cached.retryAfter;
        if (!canRetry) {
          // Still in timeout period, return conservative result
          return false;
        }
      }

      // ✅ FIXED: Cache validity reduced to 10 seconds for REAL-TIME updates
      const CACHE_VALIDITY_PERIOD = 10000; // 10 seconds (was 30s, now more aggressive!)
      const isExpired = (Date.now() - cached.lastUpdated) > CACHE_VALIDITY_PERIOD;

      if (!isExpired) {
        // Cache is fresh, return result
        const result = !cached.hasDraft && !cached.hasWaiting && !cached.hasNeedRevision;
        return result;
      } else {
        // Cache expired - trigger IMMEDIATE update and return CONSERVATIVE result
        setTimeout(() => {
          updateTabStatusCache(tabId, true).catch(() => { // force = true
            // Error handled silently
          });
        }, 0); // Immediate, no delay

        // ✅ FIXED: Return CONSERVATIVE result (false) when cache is stale
        // This prevents editing until fresh data is loaded
        return false;
      }
    }

    // ✅ FIXED: If no cache yet, initialize with FORCE and return CONSERVATIVE result
    setTimeout(() => {
      updateTabStatusCache(tabId, true).catch(() => {}); // force = true
    }, 0);

    // Return FALSE (conservative) until we have actual fresh data
    // This prevents premature editing before status is verified
    return false;
  };

  // Map backend request_type codes to our internal tab IDs
  const REQUEST_CODE_TO_TAB = {
    'BSC': 'basic-information',
    'ADR': 'address',
    'EMC': 'emergency-contact',
    'PAY': 'payroll-account',
    'FMY': 'family',
    'EDC': 'education',
    'SSI': 'social-security',
    'MED': 'medical-record',
    'MDR': 'medical-record',
    'EMP': 'employment-information'
  };

  const mapRequestToTabId = (request) => {
    if (!request) return null;
    // Prefer explicit request_type code when available
    if (request.request_type && REQUEST_CODE_TO_TAB[request.request_type]) {
      return REQUEST_CODE_TO_TAB[request.request_type];
    }
    // Fallback: try to infer from request_type_label or request_type string
    const label = (request.request_type_label || request.request_type || '').toString().toLowerCase();
    if (label.includes('social')) return 'social-security';
    if (label.includes('medical')) return 'medical-record';
    if (label.includes('address')) return 'address';
    if (label.includes('basic')) return 'basic-information';
    if (label.includes('family')) return 'family';
    if (label.includes('education')) return 'education';
    if (label.includes('payroll') || label.includes('pay')) return 'payroll-account';
    if (label.includes('employment')) return 'employment-information';
    return null;
  };

  // Function to check if a tab is permanently locked due to policy
  const isTabPermanentlyLocked = (tabId) => {
    // Employment Information is always locked due to company policy
    return tabId === 'employment-information' || tabId === 'medical-record';
  };

  // OPTIMIZED: Function to check if a category has waiting approval request with better caching
  const hasWaitingApprovalForCategory = async (category) => {
    // Use cached data if available and recent
    const cached = tabStatusCache.value[category];
    if (cached && cached.isInitialized && (Date.now() - cached.lastUpdated) < 5000) {
      return cached.hasWaiting;
    }
    
    // ✅ OPTIMIZED: Use global cache
    await ensureChangeRequestsLoaded();
    
    if (!changeRequests.value || changeRequests.value.length === 0) {
      return false;
    }
    const currentCategory = getCategoryFromTabId(category);

    const hasWaiting = changeRequests.value.some(request => {
      // Map request to our internal tab id, prefer request_type code
      const requestTab = mapRequestToTabId(request);
      const requestCategory = requestTab ? getCategoryFromTabId(requestTab) : getCategoryFromTabId(request.request_type_label || request.request_type);
      const statusMatch = request.status === '2'; // 2 = waiting_approval
      const categoryMatch = requestCategory === currentCategory;

      return categoryMatch && statusMatch;
    });
    
    return hasWaiting;
  };

  // ✅ OPTIMIZED: Function to check if a category has need revision request with DEBUG logging
  const hasNeedRevisionForCategory = async (category) => {
    // Use cached data if available and recent
    const cached = tabStatusCache.value[category];
    if (cached && cached.isInitialized && (Date.now() - cached.lastUpdated) < 5000) {
      return cached.hasNeedRevision;
    }

    // ✅ OPTIMIZED: Use global cache
    await ensureChangeRequestsLoaded();

    if (!changeRequests.value || changeRequests.value.length === 0) {
      return false;
    }
    const currentCategory = getCategoryFromTabId(category);

    const hasNeedRevision = changeRequests.value.some(request => {
      // Map request to our internal tab id, prefer request_type code
      const requestTab = mapRequestToTabId(request);
      const requestCategory = requestTab ? getCategoryFromTabId(requestTab) : getCategoryFromTabId(request.request_type_label || request.request_type);

      // Check multiple possible status formats for need revision
      const statusMatch = request.status === '3' ||
                        request.status === 3 ||
                        request.status_raw === '3' ||
                        request.status_raw === 3 ||
                        request.status_label === 'rejected' ||
                        request.status_label === 'need_revision' ||
                        (typeof request.status_label === 'string' && request.status_label.toLowerCase().includes('revision'));

      const categoryMatch = requestCategory === currentCategory;

      return categoryMatch && statusMatch;
    });

    return hasNeedRevision;
  };

  // OPTIMIZED: Function to get need revision request for a specific category
  const getNeedRevisionForCategory = async (category) => {
    // Use cached data if available
    const cached = tabStatusCache.value[category];
    if (cached && cached.isInitialized && (Date.now() - cached.lastUpdated) < 5000) {
      return cached.needRevisionRequest || null;
    }
    
    // ✅ OPTIMIZED: Use global cache
    await ensureChangeRequestsLoaded();
    
    if (!changeRequests.value || changeRequests.value.length === 0) {
      return null;
    }
    
    const currentCategory = getCategoryFromTabId(category);
    
    const needRevisionRequest = changeRequests.value.find(request => {
      const requestTab = mapRequestToTabId(request);
      const requestCategory = requestTab ? getCategoryFromTabId(requestTab) : getCategoryFromTabId(request.request_type_label || request.request_type);
      
      // Check multiple possible status formats for need revision
      const statusMatch = request.status === '3' || 
                        request.status === 3 || 
                        request.status_raw === '3' || 
                        request.status_raw === 3 ||
                        request.status_label === 'rejected' ||
                        request.status_label === 'need_revision' ||
                        (typeof request.status_label === 'string' && request.status_label.toLowerCase().includes('revision'));
      
      const categoryMatch = requestCategory === currentCategory;
      
      return categoryMatch && statusMatch;
    });
    
    return needRevisionRequest;
  };

  // OPTIMIZED: Function to check if current tab can be edited (based on waiting approval, not edit mode)
  const canEditCurrentTab = computed(() => {
    return !isTabPermanentlyLocked(activeTab.value) && canEditTabCompletelySync(activeTab.value);
  });

  // OPTIMIZED: Function to check if a specific tab can be edited (based on waiting approval, not edit mode)
  const canEditTabLocal = (tabId) => {
    return !isTabPermanentlyLocked(tabId) && canEditTabCompletelySync(tabId);
  };

  // Removed unused functions to clean up code

  // OPTIMIZED: Computed property to ensure edit mode is only allowed when tab can be edited
  const isEditModeAllowed = computed(() => {
    return canEditCurrentTab.value && !isTabPermanentlyLocked(activeTab.value);
  });
   
  // ✅ OPTIMIZED: Function to update canEditCurrentTab with smart caching
  const updateCanEditCurrentTab = async () => {
    // Check if tab is permanently locked due to policy
    const isPermanentlyLocked = isTabPermanentlyLocked(activeTab.value);

    if (isPermanentlyLocked) {
      return;
    }

    // ✅ SMART UPDATE: Only update cache if needed (uses internal cache check)
    // updateTabStatusCache now has smart caching to prevent unnecessary API calls
    await updateTabStatusCache(activeTab.value);
  };

  // Smart refresh system - only refresh when specific events occur
  const smartRefresh = async (force = false) => {
    const now = Date.now();
    
    // Don't refresh if user is currently editing
    if (globalEditMode.value && !force) {
      return;
    }
    
    // Rate limiting - don't refresh too frequently
    if (!force && now - lastRefreshTime < MIN_REFRESH_INTERVAL) {
      return;
    }
    
    // Clear any pending refresh
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
      refreshTimeout = null;
    }
    
    lastRefreshTime = now;
    
    try {
      // ✅ OPTIMIZED: Use global cache
      await ensureChangeRequestsLoaded();

      // Invalidate cache to force fresh data
      invalidateAllCache();

      // Update current tab cache
      await updateTabStatusCache(activeTab.value);

    } catch {
      // Smart refresh error handled
    }
  };

  // Debounced smart refresh - prevents excessive calls
  const debouncedSmartRefresh = (delay = 1000) => {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
    
    refreshTimeout = setTimeout(() => {
      smartRefresh();
    }, delay);
  };

  // OPTIMIZED: Hapus tabEditModes, gunakan hanya editMode global dan eligibility check per tab
  const isTabEligible = (tabId) => {
    if (isTabPermanentlyLocked(tabId)) return false;
    
    // Use cached data for better performance
    const cached = tabStatusCache.value[tabId];
    if (cached && cached.isInitialized && (Date.now() - cached.lastUpdated) < 5000) {
      return !cached.hasWaiting && !cached.hasDraft && !cached.hasNeedRevision;
    }
    
    // Fallback to checking change requests directly
    const currentCategory = getCategoryFromTabId(tabId);
    return !changeRequests.value.some(request => {
      const requestTab = mapRequestToTabId(request);
      const requestCategory = requestTab ? getCategoryFromTabId(requestTab) : getCategoryFromTabId(request.request_type_label || request.request_type);
      
      // Check for waiting approval, rejected, or need revision
      const statusMatch = request.status === '2' || request.status === '5' || request.status === '3' || // 2=waiting_approval, 5=rejected, 3=need_revision
                        request.status === 2 || request.status === 5 || request.status === 3 ||
                        request.status_raw === '2' || request.status_raw === '5' || request.status_raw === '3' ||
                        request.status_raw === 2 || request.status_raw === 5 || request.status_raw === 3 ||
                        request.status_label === 'rejected' || request.status_label === 'need_revision' ||
                        (typeof request.status_label === 'string' && (
                          request.status_label.toLowerCase().includes('waiting') ||
                          request.status_label.toLowerCase().includes('revision')
                        ));
      
      const categoryMatch = requestCategory === currentCategory;
      return categoryMatch && statusMatch;
    });
  };

  // OPTIMIZED: Toggle edit mode with better state management
  const toggleEditMode = async (showToastFn = null) => {
    
    if (globalEditMode.value) return true;
    
    logCurrentState('Toggle edit mode');
    
    // Use cached data first for immediate response
    const canEdit = canEditTabCompletelySync(activeTab.value);
    
    if (!canEdit) {
      if (showToastFn && typeof showToastFn === 'function') {
        showToastFn('Tidak dapat mengedit. Tab ini sedang tidak dapat diedit.');
      }
      return false;
    }
    
    // Use unified edit state immediately
    const success = await enterEditMode(activeTab.value, canEditTabCompletelySync);
    
    if (success) {
      logCurrentState('Edit mode enabled');
      
      // ✅ OPTIMIZED: Load change requests in background after edit mode is enabled
      setTimeout(() => {
        ensureChangeRequestsLoaded().catch(() => {
          // Error handled silently
        });
      }, 100);
    }
    
    return success;
  };

  // OPTIMIZED: Reset edit mode with better state management
  const resetEditMode = () => {
    logCurrentState('Reset edit mode');
    exitEditMode();
  };

  // OPTIMIZED: Function to manually reset edit mode (for cancel/submit actions)
  const forceExitEditMode = () => {
    logCurrentState('Force exit edit mode');
    exitEditMode(true); // Force exit
  };

  // Save changes for current tab
  const saveChangesForCurrentTab = async () => {
    // This will be handled by the main component
  };

  // OPTIMIZED: Confirmation modal handlers with better state management
  const continueTabSwitch = async () => {
    showConfirmationModal.value = false;
    if (pendingTabSwitch.value) {
      // Reset changes for current tab before switching
      if (resetDataFn) {
        resetDataFn();
      }

      // Switch to new tab
      await switchTab(pendingTabSwitch.value);
      pendingTabSwitch.value = null;
    }
  };

  const cancelTabSwitch = () => {
    showConfirmationModal.value = false;
    pendingTabSwitch.value = null;
  };

  // Removed unused computed property

  const submitCurrentTabData = async () => {
    // This will be handled by the main component to avoid dynamic imports
    return false;
  };

  const getCurrentTabDisplayName = () => {
    const tab = tabs.find((t) => t.id === activeTab.value);
    return tab ? tab.label : "Current Tab";
  };

  // OPTIMIZED: Function to restore edit mode if it was preserved
  const restoreEditModeIfPreserved = () => {
    // Check if we should restore edit mode for current tab
    if (globalEditMode.value && canEditTabCompletelySync(activeTab.value)) {
      return true;
    }
    return false;
  };

  // OPTIMIZED: Function to check if edit mode should be preserved
  const shouldPreserveEditMode = () => {
    return globalEditMode.value && canEditTabCompletelySync(activeTab.value);
  };

  // OPTIMIZED: Auto-refresh cache for better performance
  const startAutoRefresh = () => {
    // Refresh cache every 30 seconds for better responsiveness
    setInterval(() => {
      // Jangan refresh jika user sedang dalam edit mode untuk menghindari gangguan
      if (globalEditMode.value) {
        return;
      }
      
      Object.keys(tabStatusCache.value).forEach(tabId => {
        const cached = tabStatusCache.value[tabId];
        if (cached && (Date.now() - cached.lastUpdated) > 5000) {
          updateTabStatusCache(tabId);
        }
      });
    }, 5000);
  };

  // Start auto-refresh when composable is initialized
  startAutoRefresh();

  return {
    // State
    activeTab,
    editMode,
    showConfirmationModal,
    pendingTabSwitch,
    hasUnsavedChanges,
    // Unified edit state
    globalEditMode,
    activeEditTab,
    unifiedEditState,
    // Hapus tabEditModes
    // NEW: Per-tab edit mode state
    // tabEditModes,
    // canEditTab,
    // getTabEditMode,
    // canEditField,
    // canEditTabField,
    // canEditTabFieldSync,

    // Configuration
    tabs,
    breadcrumbItems,
    genderOptions,
    maritalStatusOptions,
    relationshipOptions,
    educationStatusOptions,
    bpjsStatusOptions,
    bloodTypeOptions,
    healthStatusOptions,
    employmentStatusOptions,
    bankOptions,
    taxStatusOptions,

    // Methods
    setHasUnsavedChangesFunction,
    setResetDataFunction,
    handleTabChange,
    switchTab,
    toggleEditMode,
    resetEditMode,
    forceExitEditMode,
    saveChangesForCurrentTab,
    continueTabSwitch,
    cancelTabSwitch,
    submitCurrentTabData,
    getCurrentTabDisplayName,
    
    // Eligibility check
    isTabEligible,
    // Waiting approval check
    hasWaitingApprovalForCategory,
    canEditCurrentTab,
    canEditTabLocal,
    updateCanEditCurrentTab,
    getCategoryFromTabId,
    isTabPermanentlyLocked,
    isEditModeAllowed,
    // NEW: Draft status check
    hasDraftForCategory,
    getDraftForCategory,
    canEditTabCompletely,
    canEditTabCompletelySync,
    // Cache management
    tabStatusCache,
    updateTabStatusCache,
    initializeTabCache,
    invalidateTabCache,
    invalidateAllCache,
    resetChangeRequestsCache,
    forceUpdateAllTabsCache, // ✅ NEW: Force update all tabs for real-time check
    // OPTIMIZED: New methods
    preloadTabData,
    restoreEditModeIfPreserved,
    shouldPreserveEditMode,
    // Force check methods
    checkHasUnsavedChanges,
    
    // Smart refresh system
    smartRefresh,
    debouncedSmartRefresh,
  };
}
