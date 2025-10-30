import { ref, computed, watch, nextTick } from 'vue'

export const useUnifiedEditState = () => {
  // Single source of truth untuk edit state
  const globalEditMode = ref(false)
  const activeEditTab = ref(null)
  const tabEligibilityCache = ref({})
  const preserveEditMode = ref(false)
  
  // Debug state untuk troubleshooting
  const debugState = ref({
    globalEditMode: false,
    activeEditTab: null,
    preserveEditMode: false,
    timestamp: Date.now()
  })
  
  // Update debug state setiap ada perubahan
  watch([globalEditMode, activeEditTab, preserveEditMode], () => {
    debugState.value = {
      globalEditMode: globalEditMode.value,
      activeEditTab: activeEditTab.value,
      preserveEditMode: preserveEditMode.value,
      timestamp: Date.now()
    }
  }, { deep: true })
  
  // Computed untuk cek apakah tab tertentu bisa diedit
  const canEditTab = computed(() => (tabId) => {
    if (!tabId) return false
    
    // Cek dari cache eligibility
    const cached = tabEligibilityCache.value[tabId]
    if (cached && cached.isValid) {
      return cached.canEdit
    }
    
    // Default: tidak bisa edit sampai dicek async
    return false
  })
  
  // Computed untuk cek apakah sedang dalam edit mode untuk tab tertentu
  const isEditingTab = computed(() => (tabId) => {
    return globalEditMode.value && activeEditTab.value === tabId
  })
  
  // Computed untuk cek apakah ada tab yang sedang diedit
  const hasActiveEdit = computed(() => {
    return globalEditMode.value && activeEditTab.value
  })
  
  // Function untuk enter edit mode
  const enterEditMode = async (tabId, eligibilityCheckFn = null) => {
    const startTime = Date.now();
    try {
      
      // Set edit state immediately for better UX
      globalEditMode.value = true
      activeEditTab.value = tabId
      preserveEditMode.value = true
      
      
      // Cek eligibility in background if ada function checker
      if (eligibilityCheckFn && typeof eligibilityCheckFn === 'function') {
        setTimeout(async () => {
          try {
            const isEligible = await eligibilityCheckFn(tabId)
            if (!isEligible) {
              exitEditMode()
              return
            }
            
            // Update cache
            tabEligibilityCache.value[tabId] = {
              canEdit: true,
              isValid: true,
              lastChecked: Date.now()
            }
          } catch (error) {
            // Don't exit edit mode on background check failure
          }
        }, 50)
      }
      
      return true
      
    } catch (error) {
      return false
    }
  }
  
  // Function untuk exit edit mode
  const exitEditMode = (force = false) => {
    
    globalEditMode.value = false
    activeEditTab.value = null
    
    if (force) {
      preserveEditMode.value = false
    }
    
  }
  
  // Function untuk switch tab dengan preserve edit mode
  const switchTabWithPreservation = async (newTabId, eligibilityCheckFn = null) => {
    try {
      
      const wasInEditMode = globalEditMode.value
      const shouldPreserve = preserveEditMode.value
      
      if (wasInEditMode && shouldPreserve) {
        // Cek apakah tab baru bisa diedit
        if (eligibilityCheckFn && typeof eligibilityCheckFn === 'function') {
          const isEligible = await eligibilityCheckFn(newTabId)
          
          if (isEligible) {
            // Tab bisa diedit, lanjutkan edit mode
            activeEditTab.value = newTabId
            
            // Update cache
            tabEligibilityCache.value[newTabId] = {
              canEdit: true,
              isValid: true,
              lastChecked: Date.now()
            }
            
            return true
          } else {
            // Tab tidak bisa diedit, keluar dari edit mode
            exitEditMode()
            return false
          }
        } else {
          // Tidak ada checker, assume bisa diedit
          activeEditTab.value = newTabId
          return true
        }
      } else {
        // Tidak dalam edit mode, switch biasa
        activeEditTab.value = newTabId
        return true
      }
      
    } catch (error) {
      exitEditMode()
      return false
    }
  }
  
  // Function untuk update eligibility cache
  const updateTabEligibility = (tabId, canEdit) => {
    tabEligibilityCache.value[tabId] = {
      canEdit,
      isValid: true,
      lastChecked: Date.now()
    }
  }
  
  // Function untuk clear eligibility cache
  const clearEligibilityCache = (tabId = null) => {
    if (tabId) {
      delete tabEligibilityCache.value[tabId]
    } else {
      tabEligibilityCache.value = {}
    }
  }
  
  // Function untuk log current state (debugging)
  const logCurrentState = (context = '') => {
    // Edit state debug: globalEditMode: globalEditMode.value, activeEditTab: activeEditTab.value, preserveEditMode: preserveEditMode.value, eligibilityCache: Object.keys(tabEligibilityCache.value).length, timestamp: new Date().toISOString()
  }
  
  return {
    // State
    globalEditMode,
    activeEditTab,
    preserveEditMode,
    debugState,
    tabEligibilityCache,
    
    // Computed
    canEditTab,
    isEditingTab,
    hasActiveEdit,
    
    // Methods
    enterEditMode,
    exitEditMode,
    switchTabWithPreservation,
    updateTabEligibility,
    clearEligibilityCache,
    logCurrentState
  }
}