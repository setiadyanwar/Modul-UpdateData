import { navigateTo } from 'nuxt/app';

export const useUpdateDataActions = (state, { 
  personalData, 
  tabManagement, 
  showError, 
  showSuccessToast, 
  submitChangeRequest,
  ensureChangeRequestsLoaded,
  invalidateCache
}) => {
  const { loadingFlags, cacheVersion } = state;

  const handleEditButtonClick = async (activeTab, editMode, toggleEditMode) => {
    if (editMode.value && loadingFlags.value.isSubmittingUpdate) return;

    try {
      if (editMode.value) {
        // Here we would typically open the change request modal
        // But the orchestrator might handle the modal state
        loadingFlags.value.isSubmittingUpdate = true;
        return 'open-modal'; // Signal to orchestrator
      }

      // Check if tab can be edited
      await tabManagement.updateTabStatusCache(activeTab.value, true);
      const canEdit = tabManagement.canEditTabCompletelySync(activeTab.value);

      if (!canEdit) {
        const cached = tabManagement.tabStatusCache.value[activeTab.value];
        if (cached?.hasWaiting) return showError('Cannot edit. There is a request waiting for approval.');
        if (cached?.hasDraft) return showError('Cannot edit. There is a draft request. Please continue the existing draft.');
        if (cached?.hasNeedRevision) return showError('Cannot edit. There is a request that needs revision.');
        if (tabManagement.isTabPermanentlyLocked(activeTab.value)) return showError('Cannot edit. This tab is locked by policy.');
        return showError('Cannot edit. This tab is currently not editable.');
      }

      const success = await toggleEditMode(showError);
      if (success) {
        await tabManagement.updateTabStatusCache(activeTab.value);
      }
    } catch (error) {
      showError('An error occurred while activating edit mode.');
    } finally {
      if (!editMode.value) loadingFlags.value.isSubmittingUpdate = false;
    }
  };

  const handleCancelEdit = async (hasCurrentTabChanged, resetAllDataToOriginal) => {
    if (hasCurrentTabChanged.value) {
      return 'open-unsaved-modal'; // Signal to orchestrator
    } else {
      await resetAllDataToOriginal();
      tabManagement.resetEditMode();
    }
    loadingFlags.value.isSavingDraft = false;
    loadingFlags.value.isSubmittingUpdate = false;
  };

  const handleSaveAsDraft = async (activeTab, computedChangesForCurrentTab) => {
    if (loadingFlags.value.isSavingDraft) return;

    try {
      loadingFlags.value.isSavingDraft = true;
      const changes = computedChangesForCurrentTab.value || {};

      if (!changes || Object.keys(changes).length === 0) {
        showError("No changes detected to save as draft");
        return;
      }

      const res = await submitChangeRequest({
        currentTab: activeTab.value,
        changes,
        submit: false
      });

      if (res?.success) {
        window.dispatchEvent(new CustomEvent('requestHistoryUpdated', { 
          detail: { type: 'draft', requestId: res.id || res.data?.id_change_req } 
        }));
        showSuccessToast('Draft saved successfully');
      }
      return res;
    } catch (error) {
      showError("Error saving draft. Please try again.");
    } finally {
      loadingFlags.value.isSavingDraft = false;
    }
  };

  const downloadData = (openModal) => {
    openModal();
  };

  return {
    handleEditButtonClick,
    handleCancelEdit,
    handleSaveAsDraft,
    downloadData
  };
};
