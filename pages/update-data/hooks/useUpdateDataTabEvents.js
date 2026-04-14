import { nextTick } from 'vue';

export const useUpdateDataTabEvents = (state, { tabManagement, tabDataCache, ensureChangeRequestsLoaded, cacheVersion, activeTab, editMode }) => {
  const { loadingFlags } = state;

  const handleTabChange = async (tabId) => {
    if (loadingFlags.value.isTabLoading) return;
    
    loadingFlags.value.isTabLoading = true;
    try {
      activeTab.value = tabId;
      
      // Invalidate cache if needed
      tabManagement.invalidateTabCache(tabId);
      tabDataCache.invalidateCache(tabId, 'tab-change');
      
      // Ensure change requests are loaded for the new tab
      await ensureChangeRequestsLoaded();
      
      // Reset edit mode if switching tabs (handled by tabManagement usually)
      if (!editMode.value) {
        await tabManagement.updateTabStatusCache(tabId);
      }
      
      await nextTick();
      cacheVersion.value = Date.now();
    } catch (error) {
      console.error('Error switching tab:', error);
    } finally {
      loadingFlags.value.isTabLoading = false;
    }
  };

  const onTabChange = (tabId) => {
    // This usually integrates with useTabManagement's unsaved changes detection
    tabManagement.handleTabChange(tabId, handleTabChange);
  };

  return {
    handleTabChange,
    onTabChange
  };
};
