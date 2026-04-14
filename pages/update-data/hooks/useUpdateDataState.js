import { ref, computed } from 'vue';

export const useUpdateDataState = () => {
  // Page UI State
  const isFocusMode = ref(false);
  const cacheVersion = ref(Date.now());
  
  // Loading Flags
  const loadingFlags = ref({
    isInitialPageLoad: true,
    isTabLoading: false,
    isSavingDraft: false,
    isSubmittingUpdate: false,
    isPopulatingDraft: false,
    isExporting: false,
    isRefreshingBanner: false
  });

  // Photo & Attachment States
  const basicInfoUploadedFiles = ref([]);
  const basicInfoProfessionalPhoto = ref(null);
  const basicInfoAttachmentsChanged = ref(false);
  
  const addressUploadedFiles = ref([]);
  const payrollAccountUploadedFiles = ref([]);
  const socialSecurityUploadedFiles = ref([]);
  const familyUploadedFiles = ref([]);

  // Aggregate Loading State
  const isLoading = computed(() => {
    return Object.values(loadingFlags.value).some(flag => flag === true);
  });

  return {
    isFocusMode,
    cacheVersion,
    loadingFlags,
    basicInfoUploadedFiles,
    basicInfoProfessionalPhoto,
    basicInfoAttachmentsChanged,
    addressUploadedFiles,
    payrollAccountUploadedFiles,
    socialSecurityUploadedFiles,
    familyUploadedFiles,
    isLoading
  };
};
