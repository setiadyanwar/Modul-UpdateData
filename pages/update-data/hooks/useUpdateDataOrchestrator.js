import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useUpdateDataState } from './useUpdateDataState';
import { useUpdateDataFiles } from './useUpdateDataFiles';
import { useUpdateDataTabEvents } from './useUpdateDataTabEvents';
import { useUpdateDataActions } from './useUpdateDataActions';

export const useUpdateDataOrchestrator = (props, { 
  personalData, 
  tabManagement, 
  tabDataCache,
  useChangeRequestSubmit, 
  useHybridRequestHistory,
  useToast,
  useMasterData,
  useAttachments,
  activeTab,
  editMode,
  toggleEditMode,
  showError,
  showWarning,
  showSuccessToast
}) => {
  // 1. Initialize Base State
  const state = useUpdateDataState();
  const { loadingFlags, cacheVersion, isFocusMode } = state;

  // 2. Initialize Composables/Services
  const { uploadAttachment } = useAttachments();
  const { submitChangeRequest } = useChangeRequestSubmit();
  const { changeRequests, ensureChangeRequestsLoaded, getStatusLabel } = useHybridRequestHistory();
  const { getOptions } = useMasterData();

  // 3. Initialize Feature Hooks
  const files = useUpdateDataFiles(state, { uploadAttachment, showError });
  
  const tabEvents = useUpdateDataTabEvents(state, { 
    tabManagement, 
    tabDataCache, 
    ensureChangeRequestsLoaded, 
    cacheVersion, 
    activeTab, 
    editMode 
  });

  const actions = useUpdateDataActions(state, {
    personalData,
    tabManagement,
    showError,
    showSuccessToast,
    submitChangeRequest,
    ensureChangeRequestsLoaded
  });

  // 4. Local Modal State (moved from index.vue)
  const isChangeRequestModalOpen = ref(false);
  const isUnsavedChangesModalOpen = ref(false);
  const isExportModalOpen = ref(false);
  const isPopulatingDraft = ref(false);
  const pendingInsertData = ref(null);

  // 5. Orchestrated Methods
  const handleEditButton = async () => {
    const result = await actions.handleEditButtonClick(activeTab, editMode, toggleEditMode);
    if (result === 'open-modal') {
      isChangeRequestModalOpen.value = true;
    }
  };

  const handleCancel = async (hasCurrentTabChanged, resetAllDataToOriginal) => {
    const result = await actions.handleCancelEdit(hasCurrentTabChanged, resetAllDataToOriginal);
    if (result === 'open-unsaved-modal') {
      isUnsavedChangesModalOpen.value = true;
    }
  };

  const loadMedicalOptions = async () => {
    try {
      const [bloodTypes, healthStatuses] = await Promise.all([
        getOptions('EMP_HEALTH', 'blood_type'),
        getOptions('EMP_HEALTH', 'overall_status')
      ]);
      // Process options...
    } catch (e) {
      console.error('Error loading medical options:', e);
    }
  };

  // 6. Lifecycle & Global Events
  onMounted(async () => {
    loadingFlags.value.isInitialPageLoad = true;
    try {
      await ensureChangeRequestsLoaded();
      await tabManagement.updateTabStatusCache(activeTab.value);
      await loadMedicalOptions();
    } finally {
      loadingFlags.value.isInitialPageLoad = false;
    }

    if (process.client) {
      window.dispatchEvent(new CustomEvent("pageLoaded", { detail: { page: "update-data" } }));
    }
  });

  return {
    state,
    files,
    tabEvents,
    actions: {
      ...actions,
      handleEditButton,
      handleCancel
    },
    modals: {
      isChangeRequestModalOpen,
      isUnsavedChangesModalOpen,
      isExportModalOpen,
      pendingInsertData
    }
  };
};
