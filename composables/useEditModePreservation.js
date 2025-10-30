import { ref, computed } from 'vue'

export const useEditModePreservation = () => {
  // Global edit mode state that persists across tab switches
  const globalEditMode = ref(false)
  
  // Track which tabs were in edit mode
  const tabEditModeState = ref({})
  
  // Track if edit mode should be preserved across operations
  const shouldPreserveEditMode = ref(false)
  
  // Set edit mode for a specific tab
  const setTabEditMode = (tabId, isEditMode) => {
    if (isEditMode) {
      tabEditModeState.value[tabId] = true
      globalEditMode.value = true
      shouldPreserveEditMode.value = true
    } else {
      delete tabEditModeState.value[tabId]
      // Check if any other tabs are still in edit mode
      if (Object.keys(tabEditModeState.value).length === 0) {
        globalEditMode.value = false
        shouldPreserveEditMode.value = false
      }
    }
  }
  
  // Get edit mode for a specific tab
  const getTabEditMode = (tabId) => {
    return tabEditModeState.value[tabId] || false
  }
  
  // Check if any tab is in edit mode
  const isAnyTabInEditMode = computed(() => {
    return Object.keys(tabEditModeState.value).length > 0
  })
  
  // Check if global edit mode is active
  const isGlobalEditMode = computed(() => {
    return globalEditMode.value
  })
  
  // Preserve edit mode state
  const preserveEditMode = () => {
    shouldPreserveEditMode.value = true
  }
  
  // Restore edit mode for a tab if it was previously active
  const restoreEditModeForTab = (tabId) => {
    if (tabEditModeState.value[tabId] && shouldPreserveEditMode.value) {
      return true
    }
    return false
  }
  
  // Clear edit mode for all tabs
  const clearAllEditModes = () => {
    tabEditModeState.value = {}
    globalEditMode.value = false
    shouldPreserveEditMode.value = false
  }
  
  // Reset edit mode for a specific tab
  const resetTabEditMode = (tabId) => {
    delete tabEditModeState.value[tabId]
    if (Object.keys(tabEditModeState.value).length === 0) {
      globalEditMode.value = false
      shouldPreserveEditMode.value = false
    }
  }
  
  // Check if edit mode should be preserved for current operation
  const shouldPreserveForOperation = (operation) => {
    // Preserve edit mode for data refresh, tab switching, etc.
    const preserveOperations = ['data_refresh', 'tab_switch', 'cache_update']
    return shouldPreserveEditMode.value && preserveOperations.includes(operation)
  }
  
  // Log current edit mode state for debugging
  const logEditModeState = () => {
      globalEditMode: globalEditMode.value,
      shouldPreserve: shouldPreserveEditMode.value,
      tabStates: tabEditModeState.value,
      activeTabs: Object.keys(tabEditModeState.value)
    });
  };
  
  return {
    // State
    globalEditMode,
    tabEditModeState,
    shouldPreserveEditMode,
    
    // Computed
    isAnyTabInEditMode,
    isGlobalEditMode,
    
    // Methods
    setTabEditMode,
    getTabEditMode,
    preserveEditMode,
    restoreEditModeForTab,
    clearAllEditModes,
    resetTabEditMode,
    shouldPreserveForOperation,
    logEditModeState
  }
}
