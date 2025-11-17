<template>
  <div>
    <!--
      Breadcrumb with Focus Mode
      -------------------------
      Shows the breadcrumb navigation and a button to toggle focus mode.
    -->
    <div class="flex items-center justify-between mb-4">
      <UiBreadcrumb :items="breadcrumbItems" />
      <!-- Focus Mode Button - Always Visible -->
      <button @click="toggleFocusMode" class="p-2 rounded-md transition-all duration-200 group relative" :class="isFocusMode
          ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
          : 'bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/30'
        " :title="isFocusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'" aria-label="Toggle Focus Mode">
        <i :class="isFocusMode ? 'pi pi-times' : 'pi pi-expand'" class="text-lg"></i>
        <!-- Tooltip -->
        <div
          class="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs text-white bg-black/80 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          {{ isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode" }}
          <div
            class="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80">
          </div>
        </div>
      </button>
    </div>

    <!--
      Page Header
      -----------
      Shows the page title and action buttons (download, edit, update, etc.).
    -->
    <UpdateDataPageHeader title="Update Personal Data" :edit-mode="editMode"
      :can-edit-completely="tabManagement.canEditTabCompletelySync(activeTab)" :has-data-to-edit="hasDataToEdit"
      :has-draft-for-current-category="hasDraftForCurrentCategory"
      :current-category-display-name="currentCategoryDisplayName" :active-tab="activeTab"
      :has-current-tab-changed="hasCurrentTabChanged" :is-current-tab-form-valid="isCurrentTabFormValid"
      :is-saving-draft="isSavingDraft" :is-submitting-update="isSubmittingUpdate" @download="downloadData"
      @edit="handleEditButtonClick" @cancel="handleCancelEdit" @save-draft="handleSaveAsDraft"
      @submit="handleEditButtonClick" />

    <!--
      Tab Navigation
      --------------
      Allows switching between different data sections.
      ✅ OPTIMIZED: Added key for force re-render on remount (tab locking handled by edit mode)
    -->
    <TabNavigation
      :tabs="tabs"
      :active-tab="activeTab"
      :key="cacheVersion"
      @update:active-tab="onTabChange"
    />

    <!--
      Warning Banner
      --------------
      Shows warning if tab cannot be edited due to locked, waiting approval, or draft status.
      Positioned below tab navigation and above form sections.
      Only show after status check is complete to prevent flicker.
      ✅ FIXED: Added key to force re-render when cache version changes
    -->
    <WarningBannerSkeleton v-if="!isWarningBannerReady" />
    <WarningBanner
      v-else
      :key="`warning-banner-${cacheVersion}`"
      :is-eligible="tabManagement.canEditTabCompletelySync(activeTab)"
      :is-locked="tabManagement.isTabPermanentlyLocked(activeTab)"
      :has-draft="hasDraftForCurrentCategory"
      :need-revision-request="currentStatusRequest"
      :variant="getWarningBannerVariant"
      history-link="/update-data/history"
    />

    <!--
      Data Sections
      -------------
      Each section below is conditionally rendered based on the active tab.
      Each section is a separate component for maintainability.
    -->
    <!-- ✅ OPTIMIZED: Use v-show for instant tab switching -->
    <!-- Basic Information Section -->
    <UpdateDataBasicInfoSection v-show="activeTab === 'basic-information'" ref="basicInfoSectionRef" :model-value="employeeData"
      @update:model-value="employeeData = $event" :edit-mode="safeEditMode" :is-loading="isLoadingBasicInfo"
      :is-submitting="isSubmittingBasicInfo" :is-tab-eligible="tabManagement.canEditTabCompletelySync(activeTab)"
      :handle-photo-upload="handlePhotoUpload" @filesChanged="handleBasicInfoFilesChanged"
      @professional-photo-changed="handleProfessionalPhotoChanged" />

    <!-- Address Section -->
    <UpdateDataAddressSection v-show="activeTab === 'address'" ref="addressSectionRef" :model-value="addressData" :edit-mode="safeEditMode"
      :is-loading="isLoadingAddress" @update:model-value="val => addressData = val"
      @files-changed="handleAddressFilesChanged" />

    <!-- Emergency Contact Section -->
    <UpdateDataEmergencyContactSection v-show="activeTab === 'emergency-contact'" ref="emergencyContactSectionRef"
      :model-value="emergencyContactData" :edit-mode="safeEditMode" :is-loading="isLoadingEmergencyContact"
      :is-tab-eligible="tabManagement.canEditTabCompletelySync(activeTab)" :add-emergency-contact="addEmergencyContact"
      :remove-emergency-contact="removeEmergencyContact" :handle-toggle-active="handleToggleActiveEmergencyContact"
      @update:model-value="val => emergencyContactData = val" @insert-request="handleInsertRequest"
      @open-change-request-modal="handleOpenChangeRequestModal" />

    <!-- Payroll Account Section -->
    <UpdateDataPayrollAccountSection v-show="activeTab === 'payroll-account'" ref="payrollAccountSectionRef" :model-value="payrollAccountData"
      :edit-mode="safeEditMode" :is-loading="isLoadingPayrollAccount"
      @update:model-value="val => payrollAccountData = val"
      @files-changed="handlePayrollAccountFilesChanged" />

    <!-- Family Section -->
    <UpdateDataFamilySection v-show="activeTab === 'family'" ref="familySectionRef" :model-value="familyData"
      :edit-mode="safeEditMode" :is-loading="IsLoadingFamily"
      :is-tab-eligible="tabManagement.canEditTabCompletelySync(activeTab)" @update:model-value="val => familyData = val"
      @insert-request="handleInsertRequest" @edit-request="handleEditRequest"
      @open-change-request-modal="handleOpenChangeRequestModal" @field-touched="onFamilyFieldTouched"
      @files-changed="handleFamilyFilesChanged" />

    <!-- Education Section -->
    <UpdateDataEducationSection v-show="activeTab === 'education'" ref="educationSectionRef" :model-value="educationData"
      :edit-mode="safeEditMode" :is-loading="IsLoadingEducation"
      :is-tab-eligible="tabManagement.canEditTabCompletelySync(activeTab)"
      :original-data="personalData.originalEducationData" :add-education-record="addEducationRecord"
      :remove-education-record="removeEducationRecord" @update:model-value="val => educationData = val"
      @open-change-request-modal="handleOpenChangeRequestModal" />

    <!-- Benefit Section -->
    <UpdateDataSocialSecuritySection v-show="activeTab === 'social-security'" ref="socialSecuritySectionRef" :model-value="socialSecurityData"
      :edit-mode="safeEditMode" :is-loading="IsLoadingSocialSecurity"
      @update:model-value="val => socialSecurityData = val"
      @files-changed="handleSocialSecurityFilesChanged" />

    <!-- Medical Record Section -->
    <UpdateDataMedicalRecordSection v-show="activeTab === 'medical-record'" :model-value="medicalRecordData"
      :edit-mode="safeEditMode" :is-loading="IsLoadingMedicalRecord" :blood-type-options="medicalBloodTypeOptions"
      :health-status-options="medicalHealthStatusOptions" @update:model-value="val => medicalRecordData = val" />

    <!-- Employment Information Section -->
    <UpdateDataEmploymentInfoSection v-show="activeTab === 'employment-information'" :model-value="employmentInfoData"
      :is-loading="IsLoadingEmploymentInfo" />

    <!--
      Modals
      ------
      Change Request, Confirmation, and Export Data modals.
    -->
    <ChangeRequestModal :is-open="isChangeRequestModalOpen"
      :current-tab="pendingInsertData ? pendingInsertData.tab : activeTab"
      :changes="pendingInsertData ? pendingInsertData.data : computedChangesForCurrentTab"
      :request-type="pendingInsertData ? pendingInsertData.tab : activeTab"
      :action="pendingInsertData ? pendingInsertData.action : 'update'"
      :data="pendingInsertData ? pendingInsertData.data : computedChangesForCurrentTab"
      :redirect-on-success="false"
      @close="closeChangeRequestModal" />
    <ConfirmationModal :is-open="showConfirmationModal || isUnsavedChangesModalOpen"
      :is-visible="showConfirmationModal || isUnsavedChangesModalOpen" variant="default" title="Unsaved Changes"
      message="You have unsaved changes. What would you like to do?" save-button-text="Save as Draft"
      continue-button-text="Discard Changes" @close="handleCancelLeave" @save-draft="handleSaveAsDraft"
      @continue="handleDiscardChanges" />

    <ExportDataModal v-if="isModalOpen" :is-open="isModalOpen" :is-loading="isLoading" :is-downloading="isDownloading"
      :data-types="dataTypes" :selected-data-types="selectedDataTypes" :preview-data="previewData" @close="closeModal"
      @toggle-selection="toggleSelection" @select-all="selectAll" @clear-all="clearAll" @export-pdf="exportPDF" />
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  onBeforeUnmount,
  watch,
  nextTick,
  toRaw,
  defineAsyncComponent,
  onActivated,
  onErrorCaptured,
} from "vue";
import { onBeforeRouteLeave, useRoute } from "vue-router";
import BasicInformationForm from "~/components/form/BasicInformationForm.vue";
import BasicInformationSkeleton from "~/components/form/BasicInformationSkeleton.vue";
import FormField from "~/components/form/FormField.vue";
import PhotoUpload from "~/components/form/PhotoUpload.vue";
import TabNavigation from "~/components/ui/TabNavigation.vue";
import ConfirmationModal from "~/components/ui/ConfirmationModal.vue";
import ChangeRequestModal from "~/components/ui/ChangeRequestModal.vue";
import ExportDataModal from "~/components/update-data/modals/ExportDataModal.vue";
import Skeleton from "~/components/ui/Skeleton.vue";
import AddressSkeleton from "~/components/form/AddressSkeleton.vue";
import EmergencyContactSkeleton from "~/components/form/EmergencyContactSkeleton.vue";
import PayrollAccountSkeleton from "~/components/form/PayrollAccountSkeleton.vue";
import FamilySkeleton from "~/components/form/FamilySkeleton.vue";
import EducationSkeleton from "~/components/form/EducationSkeleton.vue";
import SocialSecuritySkeleton from "~/components/form/SocialSecuritySkeleton.vue";
import MedicalRecordSkeleton from "~/components/form/MedicalRecordSkeleton.vue";
import EmploymentInfoSkeleton from "~/components/form/EmploymentInfoSkeleton.vue";
import SectionSkeletonWrapper from "~/components/common/SectionSkeletonWrapper.vue";
import AddressForm from "~/components/form/AddressForm.vue";
import EmergencyContactForm from "~/components/form/EmergencyContactForm.vue";
import PayrollAccountForm from "~/components/form/PayrollAccountForm.vue";
import FamilyForm from "~/components/form/FamilyForm.vue";
import EducationForm from "~/components/form/EducationForm.vue";
import SocialSecurityForm from "~/components/form/SocialSecurityForm.vue";
import MedicalRecordForm from "~/components/form/MedicalRecordForm.vue";
import EmploymentInfoForm from "~/components/form/EmploymentInfoForm.vue";
import SectionCard from "~/components/common/SectionCard.vue";
import Toggle from "~/components/ui/Toggle.vue";
import WarningBanner from "~/components/common/WarningBanner.vue";
import WarningBannerSkeleton from "~/components/common/WarningBannerSkeleton.vue";
import UpdateDataEmergencyContactSection from "~/components/update-data/sections/UpdateDataEmergencyContactSection.vue";
import UpdateDataAddressSection from "~/components/update-data/sections/UpdateDataAddressSection.vue";
import UpdateDataPayrollAccountSection from "~/components/update-data/sections/UpdateDataPayrollAccountSection.vue";
import UpdateDataFamilySection from "~/components/update-data/sections/UpdateDataFamilySection.vue";
import UpdateDataEducationSection from "~/components/update-data/sections/UpdateDataEducationSection.vue";
import UpdateDataMedicalRecordSection from "~/components/update-data/sections/UpdateDataMedicalRecordSection.vue";
import UpdateDataBasicInfoSection from "~/components/update-data/sections/UpdateDataBasicInfoSection.vue";
import UpdateDataSocialSecuritySection from "~/components/update-data/sections/UpdateDataSocialSecuritySection.vue";
import UpdateDataEmploymentInfoSection from "~/components/update-data/sections/UpdateDataEmploymentInfoSection.vue";
import UpdateDataPageHeader from "~/components/update-data/UpdateDataPageHeader.vue";
import UiBreadcrumb from "~/components/ui/Breadcrumb.vue";
import envConfig from "~/config/environment.js";

// Composables
import { usePersonalData } from "~/composables/usePersonalData";
import { useTabManagement } from "~/composables/useTabManagement";
import { useExportData } from "~/composables/useExportData";
import { useRequestHistory } from "~/composables/useRequestHistory";
import { useHybridRequestHistory } from "~/composables/useHybridRequestHistory";
import { useChangeRequestHistory } from "~/composables/useChangeRequestHistory";
import { useApi } from "~/composables/useApi";
import { useToast } from "~/composables/useToast";
import { useAuth } from "~/composables/useAuth";
import { useAttachments } from "~/composables/useAttachments";
import { useTabDataCache } from "~/composables/useTabDataCache";
import { useDebounceWatch, findChangedProperty, useMemoizedComputed, hasObjectChanged, hasArrayChanged, debounce } from '~/composables/useDebounceWatch';

// Loading states
const isLoadingChangeRequests = ref(false);
const isRefreshing = ref(false); // ✅ CACHE: Manual refresh state
const isInitialPageLoad = ref(true);
const isTabSwitching = ref(false); // ✅ OPTIMIZED: Track tab switching state
const isSavingDraft = ref(false);
const isSubmittingUpdate = ref(false);
const isPopulatingDraft = ref(false); // Flag to prevent concurrent populate operations

// Navigation timeout for cleanup
let navigationRefreshTimeout = null;

// Basic Information Files State
const basicInfoUploadedFiles = ref([]);
const basicInfoProfessionalPhoto = ref(null);
const addressUploadedFiles = ref([]);
const payrollAccountUploadedFiles = ref([]);
const socialSecurityUploadedFiles = ref([]);
const familyUploadedFiles = ref([]);

// ✅ FIX: Track mount state to show skeleton immediately
const isMounted = ref(false);

// Use composables
const route = useRoute();
const personalData = usePersonalData();
const tabManagement = useTabManagement();
const tabDataCache = useTabDataCache(); // ✅ CACHE: Tab data caching system
const { addDraft, normalizeCategory } = useHybridRequestHistory();
const { requests: changeRequests, loadChangeRequests } = useChangeRequestHistory();
const { success: showSuccessToast, error: showError, warning: showWarning } = useToast();
const { uploadAttachment } = useAttachments();

// Utility function to generate client_key
const generateClientKey = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Destructure from composables
const {
  employeeData,
  addressData,
  emergencyContactData,
  payrollAccountData,
  familyData,
  educationData,
  socialSecurityData,
  medicalRecordData,
  employmentInfoData,
  originalData,
  originalAddressData,
  originalEmergencyContactData,
  originalPayrollAccountData,
  originalFamilyData,
  originalEducationData,
  originalSocialSecurityData,
  originalMedicalRecordData,
  originalEmploymentInfoData,
  isLoadingBasicInfo,
  isLoadingAddress,
  isLoadingEmergencyContact,
  isLoadingPayrollAccount,
  isLoadingFamily,
  isLoadingEducation,
  isLoadingSocialSecurity,
  isLoadingMedicalRecord,
  isLoadingEmploymentInfo,
  isSubmittingBasicInfo,
  isSubmittingAddress,
  isSubmittingEmergencyContact,
  isSubmittingPayrollAccount,
  isSubmittingFamily,
  isSubmittingEducation,
  isSubmittingSocialSecurity,
  isSubmittingMedicalRecord,
  isSubmittingEmploymentInfo,
  loadBasicInformation,
  loadAddress,
  loadEmergencyContact,
  loadPayrollAccount,
  loadFamily,
  loadEducation,
  loadSocialSecurity,
  loadMedicalRecord,
  loadEmploymentInfo,
  submitBasicInformation,
  submitAddress,
  submitEmergencyContact,
  submitPayrollAccount,
  submitFamily,
  submitEducation,
  submitSocialSecurity,
  submitMedicalRecord,
  submitEmploymentInfo,
  addFamilyMember,
  removeFamilyMember,
  addEducationRecord,
  removeEducationRecord,
  resetAllDataToOriginal,
} = personalData;

// ✅ FIX: Computed loading states that show skeleton IMMEDIATELY on page load
// Before component is mounted, always show skeleton (prevents empty form flash)
const computedIsLoadingBasicInfo = computed(() => !isMounted.value || isLoadingBasicInfo.value);
const computedIsLoadingAddress = computed(() => !isMounted.value || isLoadingAddress.value);
const computedIsLoadingEmergencyContact = computed(() => !isMounted.value || isLoadingEmergencyContact.value);
const computedIsLoadingPayrollAccount = computed(() => !isMounted.value || isLoadingPayrollAccount.value);
const computedIsLoadingFamily = computed(() => !isMounted.value || isLoadingFamily.value);
const computedIsLoadingEducation = computed(() => !isMounted.value || isLoadingEducation.value);
const computedIsLoadingSocialSecurity = computed(() => !isMounted.value || isLoadingSocialSecurity.value);
const computedIsLoadingMedicalRecord = computed(() => !isMounted.value || isLoadingMedicalRecord.value);
const computedIsLoadingEmploymentInfo = computed(() => !isMounted.value || isLoadingEmploymentInfo.value);

// Tambahkan mapping snake_case ke camelCase untuk EmploymentInfoForm
const employmentInfoFormData = computed(() => ({
  nik: employmentInfoData.value.nik || "",
  nikTelkom: employmentInfoData.value.nik_telkom || "",
  businessEmail: employmentInfoData.value.business_email || "",
  directorate: employmentInfoData.value.directorate || "",
  businessUnit: employmentInfoData.value.business_unit || "",
  divisi: employmentInfoData.value.divisi || "",
  grade: employmentInfoData.value.grade || "",
  gradeDate: employmentInfoData.value.grade_date || "",
  bandPosition: employmentInfoData.value.band_position || "",
  bandPositionDate: employmentInfoData.value.band_position_date || "",
  level: employmentInfoData.value.level || "",
  levelDate: employmentInfoData.value.level_date || "",
  position: employmentInfoData.value.position || "",
  supervisor: employmentInfoData.value.supervisor || "",
  joinDate: employmentInfoData.value.join_date || "",
  startDate: employmentInfoData.value.start_date || "",
  terminateDate: employmentInfoData.value.terminate_date || "",
  reasonEmployeeIn: employmentInfoData.value.reason_employee_in || "",
  reasonEmployeeOut: employmentInfoData.value.reason_employee_out || "",
  status: employmentInfoData.value.status || "",
  retirementDate: employmentInfoData.value.retirement_date || "",
}));

const {
  activeTab,
  editMode,
  showConfirmationModal,
  pendingTabSwitch,
  hasUnsavedChanges,
  tabs,
  breadcrumbItems,
  genderOptions,
  educationStatusOptions,
  bpjsStatusOptions,
  bloodTypeOptions,
  healthStatusOptions,
  employmentStatusOptions,
  setHasUnsavedChangesFunction,
  setResetDataFunction,
  handleTabChange,
  toggleEditMode,
  saveChangesForCurrentTab,
  continueTabSwitch,
  cancelTabSwitch,
  submitCurrentTabData,
  getCurrentTabDisplayName,
  switchTab,
  hasWaitingApprovalForCategory,
  canEditCurrentTab,
  updateCanEditCurrentTab,
  getCategoryFromTabId,
  isTabPermanentlyLocked,
  isEditModeAllowed,
} = tabManagement;

// Local medical options that we will explicitly preload on mount (so network shows requests)
const medicalBloodTypeOptions = ref([])
const medicalHealthStatusOptions = ref([])

// Notify parent host that the iframe/app is ready as soon as this page mounts
onMounted(() => {
  if (typeof window !== 'undefined' && window.parent !== window) {
    const parentOrigin = envConfig.IS_PRODUCTION ? envConfig.FRONTEND_URLS.PRODUCTION.ESS_HOST : envConfig.FRONTEND_URLS.DEVELOPMENT.ESS_HOST;
    window.parent.postMessage({ type: 'IFRAME_READY', source: 'update-data' }, parentOrigin);
  }
});

// Loader for medical select options (called within main onMounted)
async function loadMedicalOptions() {
  try {

    const { useMasterData } = await import('~/composables/useMasterData')
    const md = useMasterData()

    // Clear any existing cache to force fresh API calls
    md.clearCategoryCache('EMP_HEALTH', 'blood_type')
    md.clearCategoryCache('EMP_HEALTH', 'overall_status')

    const [blood, overall] = await Promise.all([
      md.getOptions('EMP_HEALTH', 'blood_type'),
      md.getOptions('EMP_HEALTH', 'overall_status')
    ])

    // Map correctly so UI shows text and selection uses text, but code contains ID
    const mappedBlood = Array.isArray(blood)
      ? blood.map(o => ({
        // display text
        label: o.label ?? o.value ?? String(o.code ?? ''),
        // value is text for display in dropdown
        value: o.label ?? o.value ?? String(o.code ?? ''),
        // code is the ID for server submission
        code: String(o.code ?? o.value ?? '')
      }))
      : []
    const mappedStatus = Array.isArray(overall)
      ? overall.map(o => ({
        label: o.label ?? o.value ?? String(o.code ?? ''),
        value: o.label ?? o.value ?? String(o.code ?? ''),
        code: String(o.code ?? o.value ?? '')
      }))
      : []

    medicalBloodTypeOptions.value = mappedBlood
    medicalHealthStatusOptions.value = mappedStatus

  } catch (e) {
  }
}

// Removed duplicate declaration - already destructured above

// Setup composables
const {
  isModalOpen,
  isLoading,
  isDownloading,
  error,
  dataTypes,
  selectedDataTypes,
  previewData,
  openModal,
  closeModal,
  toggleSelection,
  selectAll,
  clearAll,
  exportPDF,
} = useExportData();

// Setup auth using custom auth
const { user, isAuthenticated } = useAuth();

// Modal state
const isChangeRequestModalOpen = ref(false);
const isUnsavedChangesModalOpen = ref(false);
const pendingNavigation = ref(null);
const pendingInsertData = ref(null); // Store insert data when opening ChangeRequestModal

// Refs to section components
const basicInfoSectionRef = ref(null);
const emergencyContactSectionRef = ref(null);
const familySectionRef = ref(null);
const educationSectionRef = ref(null);
const touchedFamilyIds = ref(new Set());
const touchedFamilyFieldsById = ref({});

const onFamilyFieldTouched = ({ id_family, index, field }) => {
  try {
    if (!id_family) return;
    touchedFamilyIds.value.add(id_family);
    if (!touchedFamilyFieldsById.value[id_family]) touchedFamilyFieldsById.value[id_family] = new Set();
    touchedFamilyFieldsById.value[id_family].add(field);
  } catch { }
};

// Focus Mode State
const isFocusMode = ref(false);

// Cache versioning for fresh data detection
const cacheVersion = ref(Date.now());

// Force cache invalidation with version bump
const invalidateCache = (reason = 'unknown') => {
  cacheVersion.value = Date.now();
  tabManagement.invalidateAllCache();
};

// Draft detection logic dengan cache versioning
const hasDraftForCurrentCategory = computed(() => {
  // Force recomputation when cache version changes
  const _ = cacheVersion.value;

  // First try to get from changeRequests
  if (changeRequests.value && changeRequests.value.length > 0) {
    const currentCategory = tabManagement.getCategoryFromTabId(activeTab.value);
    return changeRequests.value.some(request => {
      // Check if request is in draft status (status = '1' or status_label includes 'draft')
      const isDraft = request.status === '1' || request.status === 1 ||
        (request.status_label && request.status_label.toLowerCase().includes('draft'));

      // Check if request category matches current tab category
      const requestCategory = tabManagement.getCategoryFromTabId(request.request_type || request.request_type_label);
      const categoryMatch = requestCategory === currentCategory;

      return isDraft && categoryMatch;
    });
  }

  // Fallback: check cache if changeRequests failed to load
  const cached = tabManagement.tabStatusCache.value[activeTab.value];
  if (cached && cached.isInitialized) {
    return cached.hasDraft || false;
  }

  return false;
});

const currentCategoryDisplayName = computed(() => {
  const tab = tabManagement.tabs.find(t => t.id === activeTab.value);
  return tab ? tab.label : activeTab.value;
});

const currentDraftRequest = computed(() => {
  if (!changeRequests.value || changeRequests.value.length === 0) return null;

  const currentCategory = tabManagement.getCategoryFromTabId(activeTab.value);
  return changeRequests.value.find(request => {
    const isDraft = request.status === '1' || request.status === 1 ||
      (request.status_label && request.status_label.toLowerCase().includes('draft'));
    const requestCategory = tabManagement.getCategoryFromTabId(request.request_type || request.request_type_label);
    const categoryMatch = requestCategory === currentCategory;
    return isDraft && categoryMatch;
  });
});

// Normalized change detection per-tab to prevent false positives
const hasCurrentTabChanged = computed(() => {
  const tab = activeTab.value;
  switch (tab) {
    case 'basic-information':
      return personalData.originalData.value && personalData.employeeData.value
        ? !deepEqual(personalData.employeeData.value, personalData.originalData.value)
        : false;
    case 'address':
      return personalData.originalAddressData.value && personalData.addressData.value
        ? !deepEqual(personalData.addressData.value, personalData.originalAddressData.value)
        : false;
    case 'emergency-contact':
      return personalData.originalEmergencyContactData.value && personalData.emergencyContactData.value
        ? hasObjectChanged(personalData.emergencyContactData.value, personalData.originalEmergencyContactData.value)
        : false;
    case 'payroll-account':
      return personalData.originalPayrollAccountData.value && personalData.payrollAccountData.value
        ? !deepEqual(personalData.payrollAccountData.value, personalData.originalPayrollAccountData.value)
        : false;
    case 'family':
      return personalData.originalFamilyData.value && personalData.familyData.value
        ? hasArrayChanged(personalData.familyData.value, personalData.originalFamilyData.value)
        : false;
    case 'education':
      return personalData.originalEducationData.value && personalData.educationData.value
        ? hasArrayChanged(personalData.educationData.value, personalData.originalEducationData.value)
        : false;
    case 'social-security':
      return personalData.originalSocialSecurityData.value && personalData.socialSecurityData.value
        ? !deepEqual(personalData.socialSecurityData.value, personalData.originalSocialSecurityData.value)
        : false;
    case 'medical-record':
      return personalData.originalMedicalRecordData.value && personalData.medicalRecordData.value
        ? !deepEqual(personalData.medicalRecordData.value, personalData.originalMedicalRecordData.value)
        : false;
    case 'employment-information':
      return personalData.originalEmploymentInfoData.value && personalData.employmentInfoData.value
        ? !deepEqual(personalData.employmentInfoData.value, personalData.originalEmploymentInfoData.value)
        : false;
    default:
      return false;
  }
});

// ✅ FIXED: Computed property untuk mendapatkan request yang sesuai dengan status saat ini
// Force recomputation when cacheVersion changes (after tab switch/remount)
const currentStatusRequest = computed(() => {
  // Force recomputation when cache version changes
  const _ = cacheVersion.value;

  if (!changeRequests.value || changeRequests.value.length === 0) return null;

  const currentCategory = tabManagement.getCategoryFromTabId(activeTab.value);
  const categoryRequests = changeRequests.value.filter(request => {
    const requestCategory = tabManagement.getCategoryFromTabId(request.request_type || request.request_type_label);
    return requestCategory === currentCategory;
  });

  // Return the most relevant request based on priority
  const needRevisionRequest = categoryRequests.find(req =>
    req.status === '3' || req.status === 3 || req.status_label === 'Need Revision'
  );
  if (needRevisionRequest) return needRevisionRequest;

  const draftRequest = categoryRequests.find(req =>
    req.status === '1' || req.status === 1 ||
    (req.status_label && req.status_label.toLowerCase().includes('draft'))
  );
  if (draftRequest) return draftRequest;

  const waitingRequest = categoryRequests.find(req =>
    req.status === '2' || req.status === 2 ||
    (req.status_label && req.status_label.toLowerCase().includes('waiting'))
  );
  if (waitingRequest) return waitingRequest;

  return null;
});

// Computed property untuk waiting approval dengan fallback ke cache
const hasWaitingApprovalForCurrentCategory = computed(() => {
  // First try to get from changeRequests
  if (changeRequests.value && changeRequests.value.length > 0) {
    const currentCategory = tabManagement.getCategoryFromTabId(activeTab.value);
    return changeRequests.value.some(request => {
      // Check if request is in waiting approval status (status = '2')
      const isWaiting = request.status === '2' || request.status === 2 ||
        (request.status_label && request.status_label.toLowerCase().includes('waiting'));

      // Check if request category matches current tab category
      const requestCategory = tabManagement.getCategoryFromTabId(request.request_type || request.request_type_label);
      const categoryMatch = requestCategory === currentCategory;

      return isWaiting && categoryMatch;
    });
  }

  // Fallback: check cache if changeRequests failed to load
  const cached = tabManagement.tabStatusCache.value[activeTab.value];
  if (cached && cached.isInitialized) {
    return cached.hasWaiting || false;
  }

  return false;
});

// Check if current tab has data that can be edited
const hasDataToEdit = computed(() => {
  switch (activeTab.value) {
    case 'basic-information':
      return employeeData.value && Object.keys(employeeData.value).length > 0;
    case 'address':
      return addressData.value && Object.keys(addressData.value).length > 0;
    case 'emergency-contact':
      return emergencyContactData.value && emergencyContactData.value.length > 0;
    case 'payroll-account':
      return payrollAccountData.value && Object.keys(payrollAccountData.value).length > 0;
    case 'family':
      return familyData.value && familyData.value.length > 0;
    case 'education':
      return educationData.value && educationData.value.length > 0;
    case 'social-security':
      return socialSecurityData.value && Object.keys(socialSecurityData.value).length > 0;
    case 'medical-record':
      return medicalRecordData.value && Object.keys(medicalRecordData.value).length > 0;
    case 'employment-information':
      return employmentInfoData.value && Object.keys(employmentInfoData.value).length > 0;
    default:
      return false;
  }
});

// Safe edit mode - only allow edit if both editMode is true AND tab is eligible
const safeEditMode = computed(() => {
  return editMode.value && tabManagement.canEditTabCompletelySync(activeTab.value);
});

// Warning banner ready state - only show after initial status check is complete
const isWarningBannerForcedReady = ref(false); // Safety fallback
const isWarningBannerReady = computed(() => {
  // ✅ SAFETY: Force ready after timeout to prevent infinite loading
  if (isWarningBannerForcedReady.value) return true;

  // Show skeleton while loading change requests OR during initial page load
  if (isLoadingChangeRequests.value || isInitialPageLoad.value) return false;

  // Check if changeRequests are loaded (including empty array)
  if (changeRequests.value === null || changeRequests.value === undefined) return false;

  // Check if current tab cache is initialized
  const cached = tabManagement.tabStatusCache.value[activeTab.value];
  if (cached && cached.isInitialized) return true;

  // If changeRequests loaded but no cache yet, show banner anyway
  return true;
});

// Helper function untuk mengecek apakah nilai kosong
const isEmptyValue = (value) => {
  if (value === null || value === undefined || value === "") return true;
  if (Array.isArray(value)) return value.length === 0;
  return false;
};

// Helper function untuk deep comparison
const deepEqual = (a, b) => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === "object") {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) => deepEqual(a[key], b[key]));
  }

  return false;
};

// Global changes storage untuk menyimpan semua perubahan dari semua tab
const allTabChanges = ref({});

// Function untuk menyimpan perubahan dari tab tertentu
const saveChangesForTab = (tabId, newData) => {
  const tabKey = tabId.replace("-", "_") + "Data";
  const hasChanges = Object.keys(newData).length > 0;

  if (hasChanges) {
    allTabChanges.value[tabKey] = {
      new: newData,
    };
  } else {
    // Remove if no changes
    delete allTabChanges.value[tabKey];
  }
};

// Function untuk validasi education khusus - cek apakah semua field sudah diubah
const validateEducationFields = () => {
  // Allow partial updates: disable strict validation
  return true;
};

// Function untuk validasi form berdasarkan tab aktif
const isCurrentTabFormValid = computed(() => {
  try {
    if (!editMode.value) {
      return false;
    }

    const currentTab = activeTab.value;

    switch (currentTab) {
      case 'basic-information': {
        const data = personalData.employeeData.value;
        if (!data) {
          return false;
        }

        // Validation untuk field yang diisi (tidak required, tapi kalau diisi harus valid)

        // KTP validation (jika diisi harus 16 digits)
        if (data.no_ktp && data.no_ktp.trim() !== '') {
          if (data.no_ktp.length !== 16 || !/^\d+$/.test(data.no_ktp)) {
            return false;
          }
        }

        // Phone validation (jika diisi harus format benar)
        const phoneRegex = /^(08|628)[0-9]{8,13}$/;
        if (data.main_phone_number && data.main_phone_number.trim() !== '') {
          if (!phoneRegex.test(data.main_phone_number)) {
            return false;
          }
        }

        if (data.secondary_phone_number && data.secondary_phone_number.trim() !== '') {
          if (!phoneRegex.test(data.secondary_phone_number)) {
            return false;
          }
        }

        // Email validation (jika diisi harus format benar)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (data.business_email && data.business_email.trim() !== '') {
          if (!emailRegex.test(data.business_email)) {
            return false;
          }

          // Business email domain validation (jika diisi harus @sigma.co.id)
          if (!data.business_email.endsWith('@sigma.co.id')) {
            return false;
          }
        }

        if (data.private_email && data.private_email.trim() !== '') {
          if (!emailRegex.test(data.private_email)) {
            return false;
          }

          // Private email domain validation (jika diisi harus domain yang diizinkan)
          const allowedPrivateDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com'];
          const domain = data.private_email.split('@')[1];
          if (!allowedPrivateDomains.includes(domain)) {
            return false;
          }
        }

        // Birth place validation (jika diisi tidak boleh ada angka)
        if (data.birth_place && data.birth_place.trim() !== '') {
          if (/\d/.test(data.birth_place)) {
            return false;
          }
        }

        // Passport number validation (jika diisi harus 6-12 karakter)
        if (data.passport_number && data.passport_number.trim() !== '') {
          if (data.passport_number.length < 6 || data.passport_number.length > 12) {
            return false;
          }
        }

        return true;
      }

      case 'address': {
        const data = personalData.addressData.value;
        if (!data) {
          return false;
        }

        // Add address validation logic here (validate format, not required)
        return true;
      }

      case 'emergency-contact': {
        const data = personalData.emergencyContactData.value;
        // Emergency contact bisa kosong, tidak required
        return true;
      }

      case 'payroll-account': {
        const data = personalData.payrollAccountData.value;
        if (!data) {
          return false;
        }

        // Account number validation (jika diisi harus 10-20 digits)
        if (data.number_rekening && data.number_rekening.trim() !== '') {
          if (data.number_rekening.length < 10 || data.number_rekening.length > 20 || !/^\d+$/.test(data.number_rekening)) {
            return false;
          }
        }

        // NPWP validation (jika diisi harus 15 digits)
        if (data.npwp && data.npwp.trim() !== '') {
          const npwpDigits = data.npwp.replace(/[^0-9]/g, '');
          if (npwpDigits.length !== 15) {
            return false;
          }
        }

        return true;
      }

      default: {
        return true;
      }
    }
  } catch (error) {
    return false;
  }
});

// Optimized computed property with memoization to reduce expensive JSON.stringify calls
const hasChangesInCurrentTab = computed(() => {
  try {
    if (!editMode.value) {
      return false;
    }

    const currentTab = activeTab.value;

    // Create cache key for memoization
    const cacheKey = `${currentTab}-${Date.now().toString(36).slice(-5)}`;

    // Use memoized computation to avoid repeated expensive operations
    return useMemoizedComputed(() => calculateTabChanges(currentTab), 3000)();
  } catch (error) {
    return false;
  }
});

// Extracted and optimized change calculation logic
function calculateTabChanges(currentTab) {
  try {

    // Check if we have required data first
    switch (currentTab) {
      case 'basic-information': {
        const original = personalData.originalData.value;
        const current = personalData.employeeData.value;

        if (!original || !current) {
          return false;
        }

        // Field by field comparison
        let changedFields = [];
        const allKeys = new Set([...Object.keys(original), ...Object.keys(current)]);

        allKeys.forEach(key => {
          const originalValue = original[key];
          const currentValue = current[key];

          if (originalValue !== currentValue) {
            changedFields.push({
              field: key,
              original: originalValue,
              current: currentValue,
              originalType: typeof originalValue,
              currentType: typeof currentValue
            });
          }
        });

        // JSON comparison with detailed logging
        const originalStr = JSON.stringify(original);
        const currentStr = JSON.stringify(current);
        const hasChanges = originalStr !== currentStr;

        if (!hasChanges && changedFields.length === 0) {
        }

        const hasDataChanges = !deepEqual(original, current);
        const result = hasDataChanges || changedFields.length > 0;

        return result;
      }

      case 'address': {
        const original = personalData.originalAddressData.value;
        const current = personalData.addressData.value;

        if (!original || !current) {
          return false;
        }

        const hasChanges = hasObjectChanged(original, current);
        return hasChanges;
      }

      case 'employment-information': {
        const original = personalData.originalEmploymentData.value;
        const current = personalData.employmentData.value;

        if (!original || !current) {
          return false;
        }

        const hasChanges = hasObjectChanged(original, current);
        return hasChanges;
      }

      case 'emergency-contact': {
        const original = personalData.originalEmergencyContactData.value;
        const current = personalData.emergencyContactData.value;

        if (!original || !current) {
          return false;
        }

        const hasChanges = hasObjectChanged(original, current);
        return hasChanges;
      }

      case 'family': {
        const original = personalData.originalFamilyData.value;
        const current = personalData.familyData.value;

        if (!original || !current) {
          return false;
        }

        const hasChanges = hasObjectChanged(original, current);
        return hasChanges;
      }

      case 'education': {
        const original = personalData.originalEducationData.value;
        const current = educationData.value;

        if (!original || !current) {
          return false;
        }

        const hasChanges = hasObjectChanged(original, current);
        return hasChanges;
      }

      case 'medical-record': {
        const original = personalData.originalMedicalRecordData.value;
        const current = personalData.medicalRecordData.value;

        if (!original || !current) {
          return false;
        }

        const hasChanges = hasObjectChanged(original, current);
        return hasChanges;
      }

      case 'payroll-account': {
        const original = personalData.originalPayrollAccountData.value;
        const current = personalData.payrollAccountData.value;

        if (!original || !current) {
          return false;
        }

        const hasChanges = hasObjectChanged(original, current);
        return hasChanges;
      }

      case 'social-security': {
        const original = personalData.originalSocialSecurityData.value;
        const current = personalData.socialSecurityData.value;

        if (!original || !current) {
          return false;
        }

        const hasChanges = hasObjectChanged(original, current);
        return hasChanges;
      }

      default: {
        return false;
      }
    }
  } catch (error) {
    return false;
  }
}

// End of calculateTabChanges function

// Computed property untuk mendapatkan perubahan tab aktif (PURE, tidak mutasi)
// Always return only the current tab changes so Save as Draft sends a single-tab payload.
const computedChangesForCurrentTab = computed(() => {
  try {
    // Use getChangedFieldsOnly to get only changed fields instead of all data
    const changedData = getChangedFieldsOnly();

    // Return only the new data (changed fields)
    return changedData.newData && Object.keys(changedData.newData).length > 0 ? changedData.newData : {};
  } catch (e) {
    return {};
  }
});

// Proper change detection using personalData refs directly
const simpleHasChanges = computed(() => {
  if (!editMode.value) {
    return false;
  }

  const currentTab = activeTab.value;

  try {
    switch (currentTab) {
      case 'basic-information':
        if (personalData.originalData.value && personalData.employeeData.value) {
          const hasChanges = !deepEqual(personalData.employeeData.value, personalData.originalData.value);
          return hasChanges;
        }
        break;

      case 'address':
        if (personalData.originalAddressData.value && personalData.addressData.value) {
          const hasChanges = !deepEqual(personalData.addressData.value, personalData.originalAddressData.value);
          return hasChanges;
        }
        break;

      case 'emergency-contact':
        if (personalData.originalEmergencyContactData.value && personalData.emergencyContactData.value) {
          const hasChanges = !deepEqual(personalData.emergencyContactData.value, personalData.originalEmergencyContactData.value);
          return hasChanges;
        }
        break;

      case 'payroll-account':
        if (personalData.originalPayrollAccountData.value && personalData.payrollAccountData.value) {
          const hasChanges = !deepEqual(personalData.payrollAccountData.value, personalData.originalPayrollAccountData.value);
          return hasChanges;
        }
        break;

      case 'family':
        if (personalData.originalFamilyData.value && personalData.familyData.value) {
          const hasChanges = !deepEqual(personalData.familyData.value, personalData.originalFamilyData.value);
          return hasChanges;
        }
        break;

      case 'education':
        if (personalData.originalEducationData.value && personalData.educationData.value) {
          const hasChanges = !deepEqual(personalData.educationData.value, personalData.originalEducationData.value);
          return hasChanges;
        }
        break;

      case 'social-security':
        if (personalData.originalSocialSecurityData.value && personalData.socialSecurityData.value) {
          const hasChanges = !deepEqual(personalData.socialSecurityData.value, personalData.originalSocialSecurityData.value);
          return hasChanges;
        }
        break;

      case 'medical-record':
        if (personalData.originalMedicalRecordData.value && personalData.medicalRecordData.value) {
          const hasChanges = !deepEqual(personalData.medicalRecordData.value, personalData.originalMedicalRecordData.value);
          return hasChanges;
        }
        break;

      case 'employment-information':
        if (personalData.originalEmploymentInfoData.value && personalData.employmentInfoData.value) {
          const hasChanges = !deepEqual(personalData.employmentInfoData.value, personalData.originalEmploymentInfoData.value);
          return hasChanges;
        }
        break;
    }
  } catch (error) {
  }

  return false;
});

// Global beforeunload handler reference
let beforeUnloadHandler = null;

// Global flags for draft data management
const isDraftDataPopulated = ref(false);
const lastPopulatedRequestId = ref(null);

// Methods
const downloadData = () => {
  openModal();
};

// Continue existing draft function
const continueExistingDraft = async () => {
  if (currentStatusRequest.value) {
    const requestId = currentStatusRequest.value.id_change_req || currentStatusRequest.value.id;
    if (requestId) {
      await navigateTo(`/update-data/edit/${requestId}`);
    }
  }
};

// Function to populate form with draft data
const populateFormWithDraftData = async () => {
  // Prevent concurrent populate operations
  if (isPopulatingDraft.value) {
    return;
  }

  try {
    isPopulatingDraft.value = true;

    if (!changeRequests.value || changeRequests.value.length === 0) {
      return;
    }

    const currentCategory = tabManagement.getCategoryFromTabId(activeTab.value);

    // Find draft request for current category
    const draftRequest = changeRequests.value.find(request => {
      const isDraft = request.status === '1' || request.status === 1 ||
        (request.status_label && request.status_label.toLowerCase().includes('draft'));
      const requestCategory = tabManagement.getCategoryFromTabId(request.request_type || request.request_type_label);
      const categoryMatch = requestCategory === currentCategory;
      return isDraft && categoryMatch;
    });

    if (!draftRequest || !draftRequest.new_data) {
      return;
    }

    // Check if we already populated this request to prevent infinite loops
    if (lastPopulatedRequestId.value === draftRequest.id_change_req) {
      return;
    }

    // Extract draft data based on structure
    let draftData = null;
    if (draftRequest.new_data.data) {
      draftData = draftRequest.new_data.data;
    } else if (Array.isArray(draftRequest.new_data)) {
      draftData = draftRequest.new_data;
    } else {
      draftData = draftRequest.new_data;
    }

    if (!draftData) {
      return;
    }

    // Temporarily disable watchers to prevent override during populate
    const wasResetting = personalData.isResetting.value;
    personalData.isResetting.value = true;

    // Populate form based on current tab - FORCE MERGE with draft data priority
    switch (activeTab.value) {
      case 'basic-information':
        if (typeof draftData === 'object' && !Array.isArray(draftData)) {
          // PRIORITY: draft data overwrites original data
          employeeData.value = { ...employeeData.value, ...draftData };
        }
        break;

      case 'address':
        if (typeof draftData === 'object' && !Array.isArray(draftData)) {
          // PRIORITY: draft data overwrites original data
          addressData.value = { ...addressData.value, ...draftData };
        }
        break;

      case 'emergency-contact':
        if (Array.isArray(draftData)) {
          // FIXED: Transform draft data using mapEmergencyArray to ensure proper field mapping
          const { mapEmergencyArray } = await import('~/utils/dataResolver');
          const transformedDraftData = mapEmergencyArray(draftData);
          // PRIORITY: completely replace with transformed draft data
          emergencyContactData.value = [...transformedDraftData];
        }
        break;

      case 'payroll-account':
        if (typeof draftData === 'object' && !Array.isArray(draftData)) {
          // PRIORITY: draft data overwrites original data
          payrollAccountData.value = { ...payrollAccountData.value, ...draftData };
        }
        break;

      case 'family':
        if (Array.isArray(draftData)) {
          // PRIORITY: completely replace with draft data
          familyData.value = [...draftData];
        }
        break;

      case 'education':
        if (Array.isArray(draftData)) {
          // PRIORITY: completely replace with draft data
          educationData.value = [...draftData];
        }
        break;

      case 'social-security':
        if (typeof draftData === 'object' && !Array.isArray(draftData)) {
          // PRIORITY: draft data overwrites original data
          socialSecurityData.value = { ...socialSecurityData.value, ...draftData };
        }
        break;

      case 'medical-record':
        if (typeof draftData === 'object' && !Array.isArray(draftData)) {
          // PRIORITY: draft data overwrites original data
          medicalRecordData.value = { ...medicalRecordData.value, ...draftData };
        }
        break;

      case 'employment-information':
        if (typeof draftData === 'object' && !Array.isArray(draftData)) {
          // PRIORITY: draft data overwrites original data
          employmentInfoData.value = { ...employmentInfoData.value, ...draftData };
        }
        break;
    }

    // Wait for reactive updates
    await nextTick();

    // Mark this request as populated and set flags
    lastPopulatedRequestId.value = draftRequest.id_change_req;
    isDraftDataPopulated.value = true;

    // Restore resetting flag after a longer delay to ensure all watchers are done
    setTimeout(() => {
      personalData.isResetting.value = wasResetting;
    }, 2000);

  } catch (error) {
  } finally {
    isPopulatingDraft.value = false;
  }
};

// ✅ FIXED: Convert to computed property untuk reactive warning banner variant
const getWarningBannerVariant = computed(() => {
  // Force recomputation when cache version changes (after tab switch/remount)
  const _ = cacheVersion.value;

  if (tabManagement.isTabPermanentlyLocked(activeTab.value)) {
    return 'locked';
  }

  // Get current category for this tab
  const currentCategory = tabManagement.getCategoryFromTabId(activeTab.value);

  // Check changeRequests for this category
  if (changeRequests.value && changeRequests.value.length > 0) {

    const categoryRequests = changeRequests.value.filter(request => {
      const requestCategory = tabManagement.getCategoryFromTabId(request.request_type || request.request_type_label);
      return requestCategory === currentCategory;
    });

    categoryRequests.forEach(req => {
    });

    // Check for Need Revision first (highest priority)
    const needRevisionRequest = categoryRequests.find(req =>
      req.status === '3' ||
      req.status === 3 ||
      req.status_raw === '3' ||
      req.status_raw === 3 ||
      req.status_label === 'rejected' ||
      req.status_label === 'need_revision' ||
      req.status_label === 'Need Revision' ||
      (typeof req.status_label === 'string' && req.status_label.toLowerCase().includes('revision'))
    );
    if (needRevisionRequest) {
      return 'need-revision';
    }

    // Check for Draft (blue banner)
    const draftRequest = categoryRequests.find(req =>
      req.status === '1' || req.status === 1 ||
      (req.status_label && req.status_label.toLowerCase().includes('draft'))
    );
    if (draftRequest) {
      return 'draft';
    }

    // Check for Waiting Approval (yellow banner)
    const waitingRequest = categoryRequests.find(req =>
      req.status === '2' || req.status === 2 ||
      (req.status_label && req.status_label.toLowerCase().includes('waiting'))
    );
    if (waitingRequest) {
      return 'pending';
    }
  }

  // Fallback to cache-based detection
  const cached = tabManagement.tabStatusCache.value[activeTab.value];
  if (cached && cached.isInitialized) {

    if (cached.hasNeedRevision) {
      return 'need-revision';
    }
    if (cached.hasWaiting) {
      return 'pending';
    }
    if (cached.hasDraft) {
      return 'draft';
    }
  }

  // Check if tab can be edited
  const canEdit = tabManagement.canEditTabCompletelySync(activeTab.value);

  if (!canEdit) {
    // Check cache again for need revision before defaulting to pending
    const cached = tabManagement.tabStatusCache.value[activeTab.value];
    if (cached && cached.isInitialized && cached.hasNeedRevision) {
      return 'need-revision';
    }
    return 'pending';
  }

  return 'eligible';
});

// Helper function to force refresh warning banner
const refreshWarningBanner = async () => {
  try {
    // Hanya refresh jika user tidak sedang dalam edit mode
    if (!editMode.value) {
      await tabManagement.updateTabStatusCache(activeTab.value);
    } else {
    }
  } catch (error) {
  }
};

// Helper function to force refresh warning banner when needed (page reload, draft deleted)
const forceRefreshWarningBanner = async () => {
  try {
    await tabManagement.updateTabStatusCache(activeTab.value);
  } catch (error) {
  }
};

const toggleFocusMode = () => {
  isFocusMode.value = !isFocusMode.value;

  // Emit event untuk parent layout
  if (process.client) {
    window.dispatchEvent(
      new CustomEvent("toggleFocusMode", {
        detail: { isFocusMode: isFocusMode.value },
      })
    );

    // Toggle CSS class untuk hide/show navbar dan sidebar
    const body = document.body;
    if (isFocusMode.value) {
      body.classList.add("focus-mode-active");
    } else {
      body.classList.remove("focus-mode-active");
    }
  }
};

const handlePhotoUpload = (photoData) => {
  // Use reactive assignment to prevent infinite loops
  employeeData.value = {
    ...employeeData.value,
    professional_photo: photoData.dataUrl,
  };
};

// Handle KTP files from MultiDocumentUpload
const handleBasicInfoFilesChanged = (files) => {
  basicInfoUploadedFiles.value = files;
};

// Address KTP files (mirrors basic info flow but scoped to address)
const handleAddressFilesChanged = (files) => {
  console.log('🏠 Address files changed:', files);
  addressUploadedFiles.value = files || [];
  console.log('🏠 addressUploadedFiles updated:', addressUploadedFiles.value);
};

// Payroll Account files (NPWP Document + Saving Book Document)
const handlePayrollAccountFilesChanged = (files) => {
  console.log('💰 Payroll account files changed:', files);
  payrollAccountUploadedFiles.value = files || [];
  console.log('💰 payrollAccountUploadedFiles updated:', payrollAccountUploadedFiles.value);
};

// Social Security files (Telkomedika Card + BPJS Card)
const handleSocialSecurityFilesChanged = (files) => {
  console.log('🏥 Social security files changed:', files);
  socialSecurityUploadedFiles.value = files || [];
  console.log('🏥 socialSecurityUploadedFiles updated:', socialSecurityUploadedFiles.value);
};

// Family files (KK document)
const handleFamilyFilesChanged = (files) => {
  console.log('👪 Family files changed:', files);
  familyUploadedFiles.value = files || [];
  console.log('👪 familyUploadedFiles updated:', familyUploadedFiles.value);
};

// Handle professional photo from PhotoUpload component
const handleProfessionalPhotoChanged = (file) => {
  basicInfoProfessionalPhoto.value = file;
};

// Clear basic information files after successful submission
const clearBasicInfoFiles = () => {
  basicInfoUploadedFiles.value = [];
  basicInfoProfessionalPhoto.value = null;
  // Also clear files in the child component
  if (basicInfoSectionRef.value) {
    basicInfoSectionRef.value.clearFiles?.();
  }
};

const handleEditButtonClick = async () => {
  // Prevent multiple simultaneous requests when submitting
  if (editMode.value && isSubmittingUpdate.value) {
    return;
  }

  try {
    if (editMode.value) {
      // If in edit mode, check for unsaved changes first
      if (hasUnsavedChanges.value) {
        // Check education validation first (if on education tab)
        if (activeTab.value === 'education') {
          const isValid = validateEducationFields();

          if (!isValid) {
            showError("For education records, you must update ALL required fields (Level, Major, Institution, Start Date, End Date) for each record before submitting");
            return;
          }
        }

        // Set loading state for submission
        isSubmittingUpdate.value = true;
        // Open change request modal for edit mode
        isChangeRequestModalOpen.value = true;
        return;
      }

      // If no unsaved changes, just exit edit mode
      tabManagement.resetEditMode();
      return;
    }

    // Use cached status instead of async call for better performance
    const canEdit = tabManagement.canEditTabCompletelySync(activeTab.value);

    if (!canEdit) {
      // Check cache to provide more specific error message
      const cached = tabManagement.tabStatusCache.value[activeTab.value];
      if (cached) {
        if (cached.hasWaiting) {
          showError('Cannot edit. There is a request waiting for approval for this section.');
          return;
        }
        if (cached.hasDraft) {
          showError('Cannot edit. There is a draft request for this section. Please continue the existing draft.');
          return;
        }
      }
      showError('Cannot edit. This tab is currently not editable.');
      return;
    }

    // If can edit, proceed to toggle edit mode
    const success = await toggleEditMode(showError);

    if (!success) {
      // toggleEditMode returned false, meaning edit mode was blocked
      // Toast notification has already been shown by toggleEditMode
    } else {
      // After successful edit mode toggle, refresh warning banner
      // to ensure it reflects the latest status
      await refreshWarningBanner();
    }
  } catch (error) {
    showError('An error occurred while activating edit mode. Please try again.');
  } finally {
    // Reset loading state if not submitting (i.e., if we're just entering edit mode)
    if (!editMode.value) {
      isSubmittingUpdate.value = false;
    }
  }
};

const handleCancelEdit = async () => {
  // Force check hasUnsavedChanges
  let forceCheck = await tabManagement.checkHasUnsavedChanges();
  // Fallback to local detector if composable can't detect
  if (!forceCheck) {
    forceCheck = hasCurrentTabChanged.value;
  }

  // Check if there are unsaved changes
  if (hasUnsavedChanges.value || forceCheck) {
    // Show unified confirmation modal
    isUnsavedChangesModalOpen.value = true;

    // Also set showConfirmationModal as backup
    showConfirmationModal.value = true;
  } else {
    // No unsaved changes, just exit edit mode
    await resetAllDataToOriginal();

    // Dispatch form reset event to all form components
    if (process.client) {
      window.dispatchEvent(new CustomEvent('formReset', {
        detail: { success: true }
      }));
    }

    tabManagement.resetEditMode(); // Use resetEditMode instead of toggleEditMode
  }

  // Reset loading states when canceling edit
  isSavingDraft.value = false;
  isSubmittingUpdate.value = false;
};

// Handle insert request from form components (Emergency Contact, Family, Education)
const handleInsertRequest = async (request) => {
  try {
    if (request.action === 'insert') {
      // Prepare request for API: submit=false so server marks it as draft
      const { useChangeRequestSubmit } = await import('~/composables/useChangeRequestSubmit')
      const { submitChangeRequest } = useChangeRequestSubmit()

      const requestData = {
        currentTab: request.tab,
        changes: {
          [request.tab.replace('-', '_') + 'Data']: {
            old: [], // Empty array for insert
            new: request.data // New data to insert
          }
        },
        note_employee: `Tambah ${request.tab.replace('-', ' ')} baru`,
        consent: true,
        submit: true // Submit immediately for insert
      }

      const res = await submitChangeRequest(requestData)

      if (res.success) {
        // Show success message
        showSuccessToast(`${request.tab.replace('-', ' ')} berhasil ditambahkan!`);

        // Refresh data to show the new records
        try {
          if (activeTab.value === 'basic-information') {
            await loadBasicInformation();
          } else if (activeTab.value === 'address') {
            await loadAddress();
          } else if (activeTab.value === 'emergency-contact') {
            await loadEmergencyContact();
          } else if (activeTab.value === 'payroll-account') {
            await loadPayrollAccount();
          } else if (activeTab.value === 'family') {
            await loadFamily();
          } else if (activeTab.value === 'education') {
            await loadEducation();
          } else if (activeTab.value === 'social-security') {
            await loadSocialSecurity();
          } else if (activeTab.value === 'medical-record') {
            await loadMedicalRecord();
          } else if (activeTab.value === 'employment-info' || activeTab.value === 'employment-information') {
            await loadEmploymentInfo();
          }
        } catch (error) {
        }

        // Dispatch event to refresh history
        window.dispatchEvent(new CustomEvent('requestHistoryUpdated', {
          detail: {
            type: 'insert',
            requestId: res.id || res.data?.id_change_req,
            tab: request.tab
          }
        }));

        return res;
      } else {
        throw new Error(res.message || 'Failed to insert data');
      }
    }
  } catch (error) {

    // Handle NeedRevisionError specifically
    if (error.name === 'NeedRevisionError') {

      // Show informative error message
      const { error: showErrorToast } = useToast();
      showErrorToast(error.message);

      // Show confirmation dialog to navigate to the revision page
      const confirmed = await $confirm({
        title: 'Permintaan Perlu Direvisi',
        message: `${error.message}\n\nApakah Anda ingin membuka halaman revisi sekarang?`,
        confirmText: 'Buka Halaman Revisi',
        cancelText: 'Tutup',
        type: 'warning'
      });

      if (confirmed) {
        // Navigate to the revision page
        await navigateTo(error.navigationPath);
      }

      return;
    }

    showError(`Gagal menambahkan ${request.tab.replace('-', ' ')}: ${error.message}`);
  }
};

// Handle edit request from form components
const handleEditRequest = async (request) => {
  try {
    if (request.action === 'update') {

    }
  } catch (error) {
    showError(`Gagal mengupdate data: ${error.message}`);
  }
};

// Handle open change request modal for insert operations
const handleOpenChangeRequestModal = (modalData) => {
  // Validate basic information changes without attachments before opening modal
  const currentTab = modalData.tab || modalData.currentTab || activeTab.value;
  if (currentTab === 'basic-information') {
    const basicInfoValidation = validateBasicInformationChangesWithoutAttachments();
    if (!basicInfoValidation.isValid) {
      showWarning(basicInfoValidation.message);
      scrollToDocumentUpload();
      return;
    }
  }
    // Validate address changes without attachments
    if (currentTab === 'address') {
      const addressValidation = validateAddressChangesWithoutAttachments();
      if (!addressValidation.isValid) {
        showWarning(addressValidation.message);
        scrollToDocumentUpload();
        return;
      }
    }

    // Validate payroll account changes require documents
    if (currentTab === 'payroll-account') {
      const payrollAccountValidation = validatePayrollAccountChangesWithoutAttachments();
      if (!payrollAccountValidation.isValid) {
        showWarning(payrollAccountValidation.message);
        scrollToDocumentUpload();
        return;
      }
    }

    // Validate social security changes require documents
    if (currentTab === 'social-security') {
      const socialSecurityValidation = validateSocialSecurityChangesWithoutAttachments();
      if (!socialSecurityValidation.isValid) {
        showWarning(socialSecurityValidation.message);
        scrollToDocumentUpload();
        return;
      }
    }

    // Validate family changes require KK document
    if (currentTab === 'family') {
      const familyValidation = validateFamilyChangesWithoutAttachments();
      if (!familyValidation.isValid) {
        showWarning(familyValidation.message);
        scrollToDocumentUpload();
        return;
      }
    }

  if (modalData.type === 'insert') {
    // Store insert data temporarily with tab information
    pendingInsertData.value = {
      data: modalData.data, // Store the actual data array
      tab: modalData.tab || modalData.currentTab || 'emergency-contact', // Ensure tab is set
      changes: modalData.data, // For insert operations, changes should be the same as data
      action: modalData.action // Store the action
    };

    // Open the change request modal
    isChangeRequestModalOpen.value = true;
  } else {
    // Handle other types (update, etc.) - still open the modal

    // Store data for non-insert operations
    pendingInsertData.value = {
      data: modalData.data,
      tab: modalData.tab || modalData.currentTab || 'emergency-contact',
      changes: modalData.data,
      action: modalData.action || 'update'
    };

    // Open the change request modal
    isChangeRequestModalOpen.value = true;
  }
};

// Listen for change request submission success to reset forms
if (process.client) {
  window.addEventListener('changeRequestSubmitted', async (event) => {
    if (event.detail.success) {
      // Handle attachments upload for submit update request (all tabs)
      if (event.detail.id) {
        const submitTab = event.detail.tab || activeTab.value;
        const uploadPromises = [];

        console.log('📁 Starting attachment uploads for submit on tab:', submitTab);

        // Handle basic information attachments (KTP documents and professional photo)
        if (submitTab === 'basic-information') {
          // Upload KTP documents (document type code: '3') - Basic Information
          if (basicInfoUploadedFiles.value.length > 0) {
            console.log('📄 Uploading basic info KTP files for submit:', basicInfoUploadedFiles.value);
            for (const fileData of basicInfoUploadedFiles.value) {
              const uploadPromise = uploadAttachment(
                event.detail.id,
                fileData.file,
                ['3'] // KTP document type code
              ).catch(error => {
                console.error('KTP upload failed:', error);
                showError(`Failed to upload KTP document: ${error.message}`);
                return null;
              });
              uploadPromises.push(uploadPromise);
            }
          }

          // Upload Professional Photo (document type code: '1')
          if (basicInfoProfessionalPhoto.value) {
            console.log('📷 Uploading professional photo for submit');
            const photoUploadPromise = uploadAttachment(
              event.detail.id,
              basicInfoProfessionalPhoto.value,
              ['1'] // Professional Photo document type code
            ).catch(error => {
              console.error('Professional photo upload failed:', error);
              showError(`Failed to upload professional photo: ${error.message}`);
              return null;
            });
            uploadPromises.push(photoUploadPromise);
          }
        }

        // Handle address attachments (KTP documents)
        if (submitTab === 'address') {
          console.log('🏠 Checking address files for submit:', {
            addressUploadedFiles: addressUploadedFiles.value,
            length: addressUploadedFiles.value?.length
          });

          if (addressUploadedFiles.value && addressUploadedFiles.value.length > 0) {
            console.log('🏠 Uploading address files for submit:', addressUploadedFiles.value);
            for (const fileData of addressUploadedFiles.value) {
              console.log('🏠 Uploading address file for submit:', fileData);
              const uploadPromise = uploadAttachment(
                event.detail.id,
                fileData.file,
                ['3'] // Document type code: '3' for KTP
              ).catch(error => {
                console.error('Address KTP upload failed:', error);
                showError(`Failed to upload Address KTP document: ${error.message}`);
                return null;
              });
              uploadPromises.push(uploadPromise);
            }
          } else {
            console.log('🏠 No address files to upload for submit');
          }
        }

        // Handle payroll account attachments (NPWP Document + Saving Book Document)
        if (submitTab === 'payroll-account') {
          if (payrollAccountUploadedFiles.value && payrollAccountUploadedFiles.value.length > 0) {
            console.log('💰 Uploading payroll account files for submit:', payrollAccountUploadedFiles.value);
            for (const fileData of payrollAccountUploadedFiles.value) {
              console.log('💰 Uploading payroll account file for submit:', fileData);
              // Document type codes from selected type in MultiDocumentUpload
              const docTypeCode = fileData.documentType;
              const uploadPromise = uploadAttachment(
                event.detail.id,
                fileData.file,
                [docTypeCode]
              ).catch(error => {
                console.error('Payroll account file upload failed:', error);
                showError(`Failed to upload document: ${error.message}`);
                return null;
              });
              uploadPromises.push(uploadPromise);
            }
          } else {
            console.log('💰 No payroll account files to upload for submit');
          }
        }

        // Handle social security attachments (Telkomedika Card + BPJS Card)
        if (submitTab === 'social-security') {
          if (socialSecurityUploadedFiles.value && socialSecurityUploadedFiles.value.length > 0) {
            console.log('🏥 Uploading social security files for submit:', socialSecurityUploadedFiles.value);
            for (const fileData of socialSecurityUploadedFiles.value) {
              console.log('🏥 Uploading social security file for submit:', fileData);
              // Document type codes from selected type in MultiDocumentUpload
              const docTypeCode = fileData.documentType;
              const uploadPromise = uploadAttachment(
                event.detail.id,
                fileData.file,
                [docTypeCode]
              ).catch(error => {
                console.error('Social security file upload failed:', error);
                showError(`Failed to upload document: ${error.message}`);
                return null;
              });
              uploadPromises.push(uploadPromise);
            }
          } else {
            console.log('🏥 No social security files to upload for submit');
          }
        }

        // Handle family attachments (KK document)
        if (submitTab === 'family') {
          if (familyUploadedFiles.value && familyUploadedFiles.value.length > 0) {
            console.log('👪 Uploading family files for submit:', familyUploadedFiles.value);
            for (const fileData of familyUploadedFiles.value) {
              const docTypeCode = fileData.documentType || '2';
              const uploadPromise = uploadAttachment(
                event.detail.id,
                fileData.file,
                [docTypeCode]
              ).catch(error => {
                console.error('Family KK file upload failed (submit):', error);
                showError(`Failed to upload KK document: ${error.message}`);
                return null;
              });
              uploadPromises.push(uploadPromise);
            }
          } else {
            console.log('👪 No family files to upload for submit');
          }
        }

        // Wait for all uploads to complete
        if (uploadPromises.length > 0) {
          try {
            console.log(`🚀 Starting ${uploadPromises.length} file uploads for submit on ${submitTab}`);
            await Promise.allSettled(uploadPromises);
            console.log('✅ All file uploads completed for submit');
          } catch (error) {
            console.error("❌ Error during attachments upload for submit request:", error);
          }
        } else {
          console.log('📁 No files to upload for submit on', submitTab);
        }
      }

      // Clear files after successful submission based on tab
      const submitTab = event.detail.tab || activeTab.value;
      if (submitTab === 'basic-information') {
        clearBasicInfoFiles();
      } else if (submitTab === 'address') {
        addressUploadedFiles.value = [];
      } else if (submitTab === 'payroll-account') {
        payrollAccountUploadedFiles.value = [];
      } else if (submitTab === 'social-security') {
        socialSecurityUploadedFiles.value = [];
      }

      // Add small delay to ensure backend has processed the request
      await new Promise(resolve => setTimeout(resolve, 500));

      // Reset pending insert data
      pendingInsertData.value = null;

      // Reset loading states
      isSavingDraft.value = false;
      isSubmittingUpdate.value = false;

      // Reset edit mode
      editMode.value = false;

      // Clear any stored form data
      localStorage.removeItem('familyInsertForms');
      localStorage.removeItem('emergencyContactInsertForms');
      localStorage.removeItem('educationInsertForms');

      // Refresh current tab data based on the tab
      const tab = event.detail.tab || activeTab.value;

      try {
        // Refresh current tab data
        if (tab === 'basic-information') {
          await loadBasicInformation();
        } else if (tab === 'address') {
          await loadAddress();
        } else if (tab === 'emergency-contact') {
          await loadEmergencyContact();
        } else if (tab === 'payroll-account') {
          await loadPayrollAccount();
        } else if (tab === 'family') {
          await loadFamily();
        } else if (tab === 'education') {
          await loadEducation();
        } else if (tab === 'social-security') {
          await loadSocialSecurity();
        } else if (tab === 'medical-record') {
          await loadMedicalRecord();
        } else if (tab === 'employment-info' || tab === 'employment-information') {
          await loadEmploymentInfo();
        }

        // ✅ FIXED: Force refresh change requests with proper cache invalidation
        console.log('[SUBMIT SUCCESS] Starting comprehensive refresh for tab:', tab);

        // Step 1: Reset all caches
        tabManagement.resetChangeRequestsCache();
        invalidateCache('after-submit-success');

        // Step 2: Bump cache version to force component re-render
        cacheVersion.value = Date.now();
        console.log('[SUBMIT SUCCESS] Cache version bumped:', cacheVersion.value);

        // Step 3: Load fresh change requests from API
        await loadChangeRequests();

        // Step 4: Invalidate tab data cache for affected tabs
        tabDataCache.invalidateCache(tab, 'after-submit-success');
        if (tab !== activeTab.value) {
          tabDataCache.invalidateCache(activeTab.value, 'after-submit-success');
        }

        // Step 5: Force immediate refresh of tab management cache
        tabManagement.invalidateTabCache(tab);
        if (tab !== activeTab.value) {
          tabManagement.invalidateTabCache(activeTab.value);
        }

        // Step 6: Wait for Vue reactivity to settle
        await nextTick();

        // Step 7: Force re-check of current tab eligibility
        await tabManagement.updateTabStatusCache(activeTab.value);

        // Step 8: Refresh tab management to update all tab statuses
        await tabManagement.smartRefresh(true);

        console.log('[SUBMIT SUCCESS] Comprehensive refresh completed');

        // Force additional refresh to ensure all reactive states are updated
        await nextTick();
        await nextTick(); // Double nextTick to ensure all computed properties are updated

        // Reset original data to current data to prevent unsaved changes detection
        // This ensures the form state reflects the latest submitted data
        switch (tab) {
          case 'basic-information':
            personalData.originalData.value = { ...personalData.employeeData.value };
            break;
          case 'address':
            personalData.originalAddressData.value = { ...personalData.addressData.value };
            break;
          case 'emergency-contact':
            personalData.originalEmergencyContactData.value = [...personalData.emergencyContactData.value];
            break;
          case 'payroll-account':
            personalData.originalPayrollAccountData.value = { ...personalData.payrollAccountData.value };
            break;
          case 'family':
            personalData.originalFamilyData.value = [...personalData.familyData.value];
            break;
          case 'education':
            personalData.originalEducationData.value = [...personalData.educationData.value];
            break;
          case 'social-security':
            personalData.originalSocialSecurityData.value = { ...personalData.socialSecurityData.value };
            break;
          case 'medical-record':
            personalData.originalMedicalRecordData.value = { ...personalData.medicalRecordData.value };
            break;
          case 'employment-info':
          case 'employment-information':
            personalData.originalEmploymentData.value = { ...personalData.employmentData.value };
            break;
        }
      } catch (error) {
        console.error('Error refreshing data after submit:', error);
      }
    }
  });
}

const saveAsDraft = async () => {
  // Prevent multiple simultaneous requests
  if (isSavingDraft.value) {
    return;
  }

  try {
    isSavingDraft.value = true;
    // Use only current tab changes when saving draft
    const changes = computedChangesForCurrentTab.value || {}

    if (!changes || Object.keys(changes).length === 0) {
      showError("No changes detected to save as draft");
      isSavingDraft.value = false;
      return;
    }

    switch (activeTab.value) {
      case 'basic-information':
        currentTabOriginalData = personalData.originalData.value || {};
        break;
      case 'address':
        currentTabOriginalData = personalData.originalAddressData?.value || {};
        break;
      case 'emergency-contact':
        currentTabOriginalData = personalData.originalEmergencyContactData?.value || {};
        break;
      case 'payroll-account':
        currentTabOriginalData = personalData.originalPayrollAccountData?.value || {};
        break;
      case 'family':
        currentTabOriginalData = personalData.originalFamilyData?.value || {};
        break;
      case 'education':
        currentTabOriginalData = personalData.originalEducationData?.value || {};
        break;
      case 'social-security':
        currentTabOriginalData = personalData.originalSocialSecurityData?.value || {};
        break;
      case 'medical-record':
        currentTabOriginalData = personalData.originalMedicalRecordData?.value || {};
        break;
      case 'employment-information':
        currentTabOriginalData = personalData.originalEmploymentInfoData?.value || {};
        break;
    }

    // Extract only the changed fields from original data
    const relevantOriginalData = {};
    Object.keys(changes).forEach(key => {
      if (currentTabOriginalData[key] !== undefined) {
        relevantOriginalData[key] = currentTabOriginalData[key];
      } else {
        relevantOriginalData[key] = null; // Set to null if field doesn't exist in original
      }
    });

    // Data is already flat from getCurrentTabData, use directly
    // Prepare request for API: submit=false so server marks it as draft
    const { useChangeRequestSubmit } = await import('~/composables/useChangeRequestSubmit')
    const { submitChangeRequest } = useChangeRequestSubmit()

    const requestData = {
      currentTab: activeTab.value,
      changes: changes, // Use flat data directly
      note_employee: null,
      consent: false,
      submit: false
    }

    try {
      const res = await submitChangeRequest(requestData)
      // Dispatch event to refresh history
      window.dispatchEvent(new CustomEvent('requestHistoryUpdated', { detail: { type: 'draft', requestId: res.id || res.data?.id_change_req } }))
      showSuccessToast('Draft saved successfully')
      return res
    } catch (apiErr) {

      // Handle NeedRevisionError specifically
      if (apiErr.name === 'NeedRevisionError') {

        // Show informative error message
        const { error: showErrorToast } = useToast();
        showErrorToast(apiErr.message);

        // Show confirmation dialog to navigate to the revision page
        const confirmed = await $confirm({
          title: 'Permintaan Perlu Direvisi',
          message: `${apiErr.message}\n\nApakah Anda ingin membuka halaman revisi sekarang?`,
          confirmText: 'Buka Halaman Revisi',
          cancelText: 'Tutup',
          type: 'warning'
        });

        if (confirmed) {
          // Navigate to the revision page
          await navigateTo(apiErr.navigationPath);
        }

        isSavingDraft.value = false;
        return;
      }

      // Fallback to demo/hybrid addDraft
      const draftData = {
        category: normalizeCategory(activeTab.value),
        reason_update: "Draft - Auto saved changes",
        update: activeTab.value,
        changes: changes,
        reviewer: { name: 'System' }
      }
      const savedDraft = addDraft(draftData)
      window.dispatchEvent(new CustomEvent('requestHistoryUpdated', { detail: { type: 'draft', requestId: savedDraft.id } }))
      showSuccessToast('Draft saved locally (fallback)')
      isSavingDraft.value = false;
      return savedDraft
    }
  } catch (error) {
    showError("Error saving draft. Please try again.");
  } finally {
    // Always reset loading state
    isSavingDraft.value = false;
  }
};

// Helper function to get current tab data
const getCurrentTabData = () => {
  return prepareCurrentTabData();
};

const openChangeRequestModal = () => {
  isChangeRequestModalOpen.value = true;
};

const closeChangeRequestModal = () => {
  isChangeRequestModalOpen.value = false;
  // Clear pending insert data when modal is closed
  pendingInsertData.value = null;
  // Reset loading state when modal is closed
  isSubmittingUpdate.value = false;
};

// Helper function to map tab names to request types
const getRequestTypeForCurrentTab = (tabName) => {
  const tabToRequestTypeMap = {
    'basic-information': 'BSC',
    'address': 'ADR',
    'emergency-contact': 'EMC',
    'payroll-account': 'PYR',
    'family': 'FMY',
    'education': 'EDC',
    'social-security': 'SSI',
    'medical-record': 'MED',
    'employment-information': 'EMP'
  };
  return tabToRequestTypeMap[tabName] || 'BSC';
};

const handleChangeRequestSubmit = async (formData) => {
  try {

    // Ensure consent is always true for now (since user has already agreed in modal)
    const consent = formData.consent === true || formData.consent === 'true' || true;
    const reason = formData.reason || 'Change request submitted';

    // Import the composable
    const { useChangeRequestSubmit } = await import('~/composables/useChangeRequestSubmit');
    const { submitChangeRequest } = useChangeRequestSubmit();

    let requestData;

    // Check if this is an insert request
    if (pendingInsertData.value) {
      // Handle insert request
      let newData = pendingInsertData.value.data;

      // Transform emergency contact data untuk API
      if (pendingInsertData.value.tab === 'emergency-contact') {
        newData = newData.map(contact => ({
          emgc_name: contact.emgc_name || '',
          emgc_number: contact.emgc_number || '',
          emgc_address: contact.emgc_address || '',
          emgc_relationship_id: contact.emgc_relationship_id || '',
          status: contact.active ? 1 : 0, // Convert active boolean to status number
          // Don't include id_contact for insert operations to avoid validation errors
        }));

      }

      // Transform family data untuk API
      if (pendingInsertData.value.tab === 'family') {
        newData = newData.map(member => ({
          name: member.name || '',
          gender: member.gender || '',
          birth_date: member.birth_date || '',
          birth_place: member.birth_place || '',
          address: member.address || '',
          occupation: member.occupation || '',
          relation: member.relation || '',
          marital_status: member.marital_status || '',
          member_sequence: member.member_sequence || '',
          no_telkomedika: member.no_telkomedika || '',
          member_status: member.member_status || '',
          kk_doc: member.kk_doc || '',
          // Don't include id for insert operations to avoid validation errors
        }));

      }

      // Transform education data untuk API
      if (pendingInsertData.value.tab === 'education') {
        newData = newData.map(education => ({
          edu_level_id: education.edu_level || '',
          edu_major_id: education.edu_major || '',
          edu_institution: education.edu_institution || '',
          start_date: education.edu_start_date || '',
          end_date: education.edu_end_date || '',
          ijazah_doc: education.ijazah_doc || '',
          status: education.status !== undefined ? education.status : 1, // Add status field
          // Don't include id_education for insert operations to avoid validation errors
        }));

      }

      // Ensure tab has a fallback value
      const insertTab = pendingInsertData.value.tab || 'emergency-contact';
      const tabKey = insertTab.replace('-', '_');

      // Use the changes structure from pendingInsertData if available
      if (pendingInsertData.value.changes) {
        requestData = {
          currentTab: insertTab,
          changes: pendingInsertData.value.changes,
          note_employee: reason,
          consent: consent, // Use processed consent value
          submit: true,
          action: pendingInsertData.value.action, // Pass action from component
          type: 'insert' // Ensure type is also set
        };

        // Debug: Check requestData before sending
      } else {
        // Fallback to manual structure - ensure data is sent as array for array tabs
        const arrayTabs = ['emergency-contact', 'family', 'education'];
        let changesData = newData;

        if (arrayTabs.includes(insertTab)) {
          // For array tabs, ensure data is an array
          if (!Array.isArray(newData)) {
            changesData = [newData];
          }

        }

        requestData = {
          currentTab: insertTab,
          changes: changesData, // Send clean data directly without wrapper
          note_employee: reason,
          consent: consent, // Use processed consent value
          submit: true,
          action: pendingInsertData.value.action || 'insert', // Pass action from component
          type: 'insert' // Ensure type is also set
        };

        // Debug: Check requestData before sending
      }

    } else {
      // Handle regular update request
      const changedFieldsData = getChangedFieldsOnly();

      requestData = {
        currentTab: activeTab.value,
        changes: changedFieldsData.newData,
        note_employee: reason,
        consent: consent, // Use processed consent value
        submit: true
      };

      // Debug: Check requestData before sending

    }

    // Submit the change request with form data
    const response = await submitChangeRequest(requestData);

    // Force refresh request history after successful submission
    if (response && response.success) {

      // Dispatch event to refresh history immediately
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('requestHistoryUpdated', {
          detail: {
            requestId: response.id || response.data?.id || response.data?.id_change_req,
            type: response.submitted ? 'submitted' : 'updated',
            status: response.submitted ? 'waiting_approval' : 'draft'
          }
        }));
      }, 100);

      // Also dispatch force refresh event
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('forceRefreshHistory'));
      }, 200);
    }

    // Close modal
    closeChangeRequestModal();

    // Store insert request info before clearing
    const isInsertRequest = !!pendingInsertData.value;
    const insertTab = pendingInsertData.value ? pendingInsertData.value.tab : null;

    // Clear insert forms if this was an insert request
    if (isInsertRequest && insertTab === 'emergency-contact' && emergencyContactSectionRef.value) {
      emergencyContactSectionRef.value.clearAllInserts();
    }

    // Clear family insert forms if this was a family insert request
    if (isInsertRequest && insertTab === 'family' && familySectionRef.value) {
      familySectionRef.value.clearAllInserts();
    }

    // Clear education insert forms if this was an education insert request
    if (isInsertRequest && insertTab === 'education' && educationSectionRef.value) {
      educationSectionRef.value.clearAllInserts();
    }

    // Clear pending insert data
    pendingInsertData.value = null;

    // Clear unsaved changes and exit edit mode BEFORE navigation
    tabManagement.resetEditMode();

    // Reset loading states
    isSavingDraft.value = false;
    isSubmittingUpdate.value = false;

    // Remove beforeunload event listener to prevent unwanted alert
    if (beforeUnloadHandler) {
      window.removeEventListener("beforeunload", beforeUnloadHandler);
      beforeUnloadHandler = null;
    }

    // Store success message for display on history page
    const message = isInsertRequest
      ? `Your new ${insertTab ? insertTab.replace('-', ' ') : 'data'} has been added successfully.`
      : `Your ${getCurrentTabDisplayName(activeTab.value)} change request has been submitted successfully.`;

    localStorage.setItem('pendingSuccessMessage', JSON.stringify({
      title: 'Change Request Submitted',
      message: message,
      type: 'success'
    }));

    // Show success toast immediately before navigation
    showSuccessToast(message);

    // Navigate to history page
    await navigateTo('/update-data/history');

  } catch (error) {

    // Handle NeedRevisionError specifically
    if (error.name === 'NeedRevisionError') {

      // Show informative error message
      const { error: showErrorToast } = useToast();
      showErrorToast(error.message);

      if (confirmed) {
        // Navigate to the revision page
        await navigateTo(error.navigationPath);
      }

      isSavingDraft.value = false;
      return;
    }

    // Handle 400 validation errors specifically
    if (error.status === 400) {
      const errorMessage = error.data?.message || error.message || "Validation error. Please check your input and try again.";
      showError(errorMessage);
      return;
    }

    // Don't show error toast if error was already handled (e.g., by test functions)
    if (!error.handled) {
      showError("Failed to submit change request. Please try again.");
    }
  } finally {
    // Always reset loading state
    isSubmittingUpdate.value = false;
  }
};

// Handlers for unsaved changes modal
// Helper function untuk mendapatkan request type berdasarkan tab
const getRequestTypeFromTab = (tabId) => {
  const tabToRequestTypeMap = {
    'basic-information': 'BSC',
    'address': 'ADR',
    'emergency-contact': 'EMC',
    'payroll-account': 'PYR',
    'family': 'FMY',
    'education': 'EDC',
    'social-security': 'SSI',
    'medical-record': 'MED',
    'employment-information': 'EMP'
  };
  return tabToRequestTypeMap[tabId] || 'BSC';
};

// Function to get tab display name
const getTabDisplayName = (tab) => {
  const tabNames = {
    'basic-information': 'Basic Information',
    'address': 'Address',
    'emergency-contact': 'Emergency Contact',
    'family': 'Family',
    'education': 'Education',
    'payroll-account': 'Payroll Account',
    'social-security': 'Benefit',
    'medical-record': 'Medical Record',
    'employment-information': 'Employment Information'
  };
  return tabNames[tab] || tab;
};

// Function to get only changed fields from current form data vs original data
// Note: oldData is generated by backend, so we only return newData
const getChangedFieldsOnly = () => {
  const currentTab = activeTab.value;

  switch (currentTab) {
    case 'basic-information': {
      const original = personalData.originalData.value;
      const current = employeeData.value;

      if (!original || !current) {
        // IMPROVED: If we have current data but no original, get original from employee data as baseline
        if (current && Object.keys(current).length > 0) {
          const { personalData } = usePersonalData();
          const baselineData = personalData.originalData.value || {};

          // Helper function to convert string IDs to numbers
          const convertToNumber = (value) => {
            if (value === null || value === undefined || value === '') return undefined;
            const num = Number(value);
            return isNaN(num) ? undefined : num;
          };

          // ID fields that should be converted to numbers
          const idFields = ['nationality_id', 'clothing_size_id', 'gender_id', 'religion_id', 'marital_status_id'];

          const newData = {};

          Object.keys(current).forEach(key => {
            const currentValue = current[key];
            const baselineValue = baselineData[key];

            // FIX: Compare with baseline data, only include changed fields
            const normalizedBaseline = baselineValue === null || baselineValue === undefined ? '' : String(baselineValue);
            const normalizedCurrent = currentValue === null || currentValue === undefined ? '' : String(currentValue);

            if (normalizedBaseline !== normalizedCurrent) {
              // Convert ID fields to numbers, keep others as is
              if (idFields.includes(key)) {
                newData[key] = convertToNumber(currentValue);
              } else {
                newData[key] = currentValue;
              }
            }
          });

          return { newData };
        }
        return { newData: {} };
      }

      const newData = {};

      // Field mapping untuk basic information
      // FIXED: Use exact field names that match the API structure - no mapping needed for most fields
      const fieldMapping = {
        // Phone fields - keep API field names
        main_phone_number: 'main_phone_number',
        secondary_phone_number: 'secondary_phone_number',
        // Email fields - keep API field names
        private_email: 'private_email',
        business_email: 'business_email',
        // Date and place - keep API field names
        birth_date: 'birth_date',
        birth_place: 'birth_place',
        // KTP field - keep API field name
        no_ktp: 'no_ktp',
        // ID fields - keep API field names
        nationality_id: 'nationality_id',
        passport_number: 'passport_number',
        clothing_size_id: 'clothing_size_id',
        gender_id: 'gender_id',
        religion_id: 'religion_id',
        marital_status_id: 'marital_status_id',
        // Name field - keep API field name
        name: 'name'
      };

      // Helper function to convert string IDs to numbers
      const convertToNumber = (value) => {
        if (value === null || value === undefined || value === '') return undefined;
        const num = Number(value);
        return isNaN(num) ? undefined : num;
      };

      // ID fields that should be converted to numbers
      const idFields = ['nationality_id', 'clothing_size_id', 'gender_id', 'religion_id', 'marital_status_id'];

      // Compare field by field
      Object.keys(fieldMapping).forEach(originalKey => {
        const apiKey = fieldMapping[originalKey];
        const originalValue = original[originalKey];
        const currentValue = current[originalKey];

        // Check if value changed (handle empty strings and null/undefined consistently)
        const originalNormalized = originalValue === null || originalValue === undefined ? '' : String(originalValue);
        const currentNormalized = currentValue === null || currentValue === undefined ? '' : String(currentValue);

        if (originalNormalized !== currentNormalized) {

          // Convert ID fields to numbers, keep others as strings
          if (idFields.includes(apiKey)) {
            newData[apiKey] = convertToNumber(currentValue);
          } else {
            newData[apiKey] = currentNormalized;
          }
        }
      });

      return { newData };
    }

    case 'address': {
      const original = personalData.originalAddressData.value;
      const current = personalData.addressData.value;

      if (!original || !current) {
        return { newData: {}, oldData: {} };
      }

      const newData = {};
      const oldData = {};

      // Compare flat address fields directly
      const addressFields = [
        // Official address fields
        'official_address_detail', 'official_address_province', 'official_address_city',
        'official_address_postal_code', 'official_address_subdistrict', 'official_address_administrative_village',
        'official_address_rt', 'official_address_rw', 'official_address_street', 'official_address_phone',
        // Domicile address fields
        'domicile_address_detail', 'domicile_address_province', 'domicile_address_city',
        'domicile_address_postal_code', 'domicile_address_subdistrict', 'domicile_address_administrative_village',
        'domicile_address_rt', 'domicile_address_rw', 'domicile_address_street', 'domicile_address_phone'
      ];

      addressFields.forEach(field => {
        const originalValue = original[field] || '';
        const currentValue = current[field] || '';

        if (originalValue !== currentValue) {
          newData[field] = currentValue;
          oldData[field] = originalValue;
        }
      });

      return { newData, oldData };
    }

    case 'emergency-contact': {
      const original = personalData.originalEmergencyContactData.value;
      const current = emergencyContactData.value;

      if (!Array.isArray(original) || !Array.isArray(current)) {
        // IMPROVED: If we have current data but no original, get original from emergency contact data as baseline
        if (Array.isArray(current) && current.length > 0) {
          const baselineData = personalData.originalEmergencyContactData.value || [];

          // FIX: Only include items that are different from baseline
          const changedContacts = [];

          current.forEach((currentContact, index) => {
            const baselineContact = baselineData[index] || {};

            // Check if any field changed
            const hasChanges =
              (currentContact.name || currentContact.emgc_name || '') !== (baselineContact.name || baselineContact.emgc_name || '') ||
              (currentContact.emgc_number || '') !== (baselineContact.emgc_number || '') ||
              (currentContact.emgc_address || '') !== (baselineContact.emgc_address || '') ||
              (currentContact.emgc_relationship_id || currentContact.emgc_relationship || '') !== (baselineContact.emgc_relationship_id || baselineContact.emgc_relationship || '') ||
              (currentContact.status !== undefined ? currentContact.status : (currentContact.active ? 1 : 0)) !== (baselineContact.status !== undefined ? baselineContact.status : (baselineContact.active ? 1 : 0));

            if (hasChanges || index >= baselineData.length) {
              // Include only changed or new contacts
              changedContacts.push({
                emgc_name: currentContact.name || currentContact.emgc_name || '',
                emgc_number: currentContact.emgc_number || '',
                emgc_address: currentContact.emgc_address || '',
                emgc_relationship_id: currentContact.emgc_relationship_id || currentContact.emgc_relationship || '',
                status: currentContact.status !== undefined ? currentContact.status : (currentContact.active ? 1 : 0)
                // Deliberately not including id_contact for insert action
              });
            }
          });

          return { newData: changedContacts };
        }
        return { newData: [] };
      }

      const newData = [];

      // Find changed/added contacts
      current.forEach((currentContact, index) => {
        // FIXED: Find original contact by id_contact, but handle cases where original data is incomplete
        let originalContact = original.find(o => o.id_contact === currentContact.id_contact) || {};

        // FIXED: If original contact is incomplete (only has status), create a complete baseline
        if (originalContact && Object.keys(originalContact).length === 1 && originalContact.status !== undefined) {
          // Create a baseline with empty values for comparison
          originalContact = {
            emgc_name: '',
            emgc_number: '',
            emgc_address: '',
            emgc_relationship_id: '',
            status: originalContact.status,
            id_contact: currentContact.id_contact
          };
        }

        // FIXED: If no original contact found, create empty baseline
        if (!originalContact || Object.keys(originalContact).length === 0) {
          originalContact = {
            emgc_name: '',
            emgc_number: '',
            emgc_address: '',
            emgc_relationship_id: '',
            status: 0,
            id_contact: currentContact.id_contact
          };
        }

        // Check if any field changed OR if this is a new contact (no id_contact)
        const isNewContact = !currentContact.id_contact;

        // FIXED: More comprehensive field mapping for comparison
        const fieldsToCompare = [
          { formField: 'emgc_name', apiField: 'emgc_name' },
          { formField: 'emgc_number', apiField: 'emgc_number' },
          { formField: 'emgc_address', apiField: 'emgc_address' },
          { formField: 'emgc_relationship_id', apiField: 'emgc_relationship_id' },
          { formField: 'status', apiField: 'status', isStatus: true }
        ];

        // FIXED: More precise change detection with better field mapping
        const hasChanges = isNewContact || fieldsToCompare.some(({ formField, apiField, isStatus }) => {
          let currentValue, originalValue;

          if (isStatus) {
            // FIXED: Compare status directly (both are status fields)
            currentValue = currentContact.status !== undefined ? currentContact.status : 0;
            originalValue = originalContact.status !== undefined ? originalContact.status : 0;
          } else {
            // FIXED: Compare using direct field names
            currentValue = currentContact[formField] || '';
            originalValue = originalContact[formField] || '';
          }

          // Normalize values for comparison
          const currentNormalized = currentValue === null || currentValue === undefined ? '' : String(currentValue);
          const originalNormalized = originalValue === null || originalValue === undefined ? '' : String(originalValue);

          const hasFieldChange = currentNormalized !== originalNormalized;

          // Debug each field comparison
          if (hasFieldChange) {
          }

          return hasFieldChange;
        });

        // FIXED: Additional check - only include contact if it has meaningful changes
        const hasMeaningfulChanges = hasChanges && (
          isNewContact ||
          fieldsToCompare.some(({ formField, apiField, isStatus }) => {
            if (isStatus) {
              // FIXED: For status, compare directly
              const currentValue = currentContact.status !== undefined ? currentContact.status : 0;
              const originalValue = originalContact.status !== undefined ? originalContact.status : 0;
              return currentValue !== originalValue;
            } else {
              // FIXED: For other fields, compare directly
              const currentValue = currentContact[formField] || '';
              const originalValue = originalContact[formField] || '';

              const currentNormalized = currentValue === null || currentValue === undefined ? '' : String(currentValue);
              const originalNormalized = originalValue === null || originalValue === undefined ? '' : String(originalValue);

              // Only consider it changed if current has content and is different from original
              return currentNormalized !== originalNormalized && currentNormalized.trim() !== '';
            }
          })
        );

        // Debug field-by-field comparison
        const fieldComparison = fieldsToCompare.map(({ formField, apiField, isStatus }) => {
          let currentValue, originalValue;

          if (isStatus) {
            // FIXED: Compare status directly
            currentValue = currentContact.status !== undefined ? currentContact.status : 0;
            originalValue = originalContact.status !== undefined ? originalContact.status : 0;
          } else {
            // FIXED: Compare using direct field names
            currentValue = currentContact[formField] || '';
            originalValue = originalContact[formField] || '';
          }

          const currentNormalized = currentValue === null || currentValue === undefined ? '' : String(currentValue);
          const originalNormalized = originalValue === null || originalValue === undefined ? '' : String(originalValue);
          const hasFieldChange = currentNormalized !== originalNormalized;

          return {
            field: formField,
            apiField: apiField,
            current: currentNormalized,
            original: originalNormalized,
            changed: hasFieldChange
          };
        });

        if (hasMeaningfulChanges) {
          // For new contacts, send complete data. For existing contacts, send only changed fields
          const newContactData = {};

          if (isNewContact) {
            // For new contacts, send all required fields
            // FIXED: Use correct API field names
            newContactData.emgc_name = currentContact.emgc_name || '';
            newContactData.emgc_number = currentContact.emgc_number || '';
            newContactData.emgc_address = currentContact.emgc_address || '';
            newContactData.emgc_relationship_id = currentContact.emgc_relationship_id || currentContact.emgc_relationship || '';
            newContactData.status = currentContact.status !== undefined ? currentContact.status : 0;

          } else {
            // For existing contacts, send only changed fields
            // FIXED: Use correct API field names matching the emergency-contact response
            fieldsToCompare.forEach(({ formField, apiField, isStatus }) => {
              let currentValue, originalValue;

              if (isStatus) {
                // FIXED: Compare status directly
                currentValue = currentContact.status !== undefined ? currentContact.status : 0;
                originalValue = originalContact.status !== undefined ? originalContact.status : 0;
              } else {
                // FIXED: Compare using direct field names
                currentValue = currentContact[formField] || '';
                originalValue = originalContact[formField] || '';
              }

              // FIXED: Only add field if it actually changed
              if (currentValue !== originalValue) {
                newContactData[apiField] = currentValue;
              }
            });

            // FIXED: Only add status and id_contact if there are actual field changes
            if (Object.keys(newContactData).length > 0) {
              // Status field is required for emergency contact operations
              if (!newContactData.hasOwnProperty('status')) {
                newContactData.status = currentContact.status !== undefined ? currentContact.status : 0;
              }

              // IMPORTANT: id_contact is required for update operations
              if (currentContact.id_contact) {
                newContactData.id_contact = currentContact.id_contact;
              }
            }
          }

          // FIXED: Only add to arrays if there are actual changes
          if (Object.keys(newContactData).length > 0) {
            newData.push(newContactData);
          }
        }
      });

      return { newData };
    }

    case 'family': {
      const original = personalData.originalFamilyData.value;
      const current = familyData.value;

      if (!Array.isArray(original) || !Array.isArray(current)) {
        // IMPROVED: If we have current data but no original, get original from family data as baseline
        if (Array.isArray(current) && current.length > 0) {
          const baselineData = personalData.originalFamilyData.value || [];

          // FIX: Only include family members that are different from baseline
          const changedMembers = [];

          current.forEach((currentMember, index) => {
            const baselineMember = baselineData[index] || {};

            // Check if any field changed
            const hasChanges =
              (currentMember.name || '') !== (baselineMember.name || '') ||
              (currentMember.birth_place || '') !== (baselineMember.birth_place || '') ||
              (currentMember.birth_date || '') !== (baselineMember.birth_date || '') ||
              (currentMember.address || '') !== (baselineMember.address || '') ||
              (currentMember.occupation || '') !== (baselineMember.occupation || '') ||
              (currentMember.relation_id || currentMember.relation || '') !== (baselineMember.relation_id || baselineMember.relation || '') ||
              (currentMember.gender_id || currentMember.gender || '') !== (baselineMember.gender_id || baselineMember.gender || '') ||
              (currentMember.marital_status_id || '') !== (baselineMember.marital_status_id || '') ||
              (currentMember.member_sequence || '') !== (baselineMember.member_sequence || '') ||
              (currentMember.no_telkomedika || '') !== (baselineMember.no_telkomedika || '') ||
              (currentMember.member_status !== undefined ? currentMember.member_status : 1) !== (baselineMember.member_status !== undefined ? baselineMember.member_status : 1) ||
              (currentMember.kk_doc || '') !== (baselineMember.kk_doc || '') ||
              (currentMember.status !== undefined ? currentMember.status : 1) !== (baselineMember.status !== undefined ? baselineMember.status : 1);

            if (hasChanges || index >= baselineData.length) {
              // Include only changed or new family members
              changedMembers.push({
                name: currentMember.name || '',
                birth_place: currentMember.birth_place || '',
                birth_date: currentMember.birth_date || '',
                address: currentMember.address || '',
                occupation: currentMember.occupation || '',
                relation_id: currentMember.relation_id || currentMember.relation ? Number(currentMember.relation_id || currentMember.relation) : null,
                gender_id: currentMember.gender_id || currentMember.gender ? Number(currentMember.gender_id || currentMember.gender) : null,
                marital_status_id: currentMember.marital_status_id ? Number(currentMember.marital_status_id) : null,
                member_sequence: currentMember.member_sequence || '',
                no_telkomedika: currentMember.no_telkomedika || '',
                member_status: currentMember.member_status !== undefined && currentMember.member_status !== null ? Number(currentMember.member_status) : 1,
                kk_doc: currentMember.kk_doc || '',
                status: currentMember.status !== undefined && currentMember.status !== null ? Number(currentMember.status) : 1
                // Deliberately not including id_family for insert action
              });
            }
          });

          return { newData: changedMembers };
        }
        return { newData: [] };
      }

      const newData = [];

      // Find changed/added family members (only include actually changed fields)
      current.forEach((currentMember) => {
        // If using touched tracking, skip members not touched this session
        if (touchedFamilyIds.value && touchedFamilyIds.value.size > 0) {
          const idf = currentMember.id_family || currentMember.id;
          if (!idf || !touchedFamilyIds.value.has(idf)) {
            return; // not touched → skip regardless of diff vs original
          }
        }
        const originalMember = original.find(o =>
          o.id_family === currentMember.id_family ||
          o.id === currentMember.id ||
          o.id === currentMember.id_family
        ) || {};

        // Fields eligible for update
        const fieldsToCheck = ['name', 'birth_place', 'birth_date', 'address', 'occupation', 'occupation_id', 'relation', 'relation_id', 'gender', 'gender_id', 'marital_status', 'marital_status_id', 'martial_status_id', 'member_sequence', 'no_telkomedika', 'kk_doc', 'status'];

        // Compute changed fields precisely, ignoring empty-to-undefined noise for non-status fields
        // If touched fields per id exist, only allow those fields
        const allowedFields = (() => {
          const idf = currentMember.id_family || currentMember.id;
          const set = idf ? touchedFamilyFieldsById.value?.[idf] : null;
          return (set && set.size > 0) ? set : null;
        })();

        const changedFields = fieldsToCheck.filter((field) => {
          if (allowedFields && !allowedFields.has(field)) return false;
          const orig = originalMember[field];
          const curr = currentMember[field];

          // Special handling for status fields (0 is a valid value)
          if (field === 'status' || field === 'member_status') {
            const origStatus = orig !== undefined && orig !== null ? Number(orig) : 1;
            const currStatus = curr !== undefined && curr !== null ? Number(curr) : 1;
            return origStatus !== currStatus;
          }

          // Special handling for relation field - compare with both relation and relation_id
          if (field === 'relation') {
            const origRelation = orig || originalMember['relation_id'];
            const currRelation = curr;
            const normOrig = typeof origRelation === 'string' ? origRelation.trim() : origRelation;
            const normCurr = typeof currRelation === 'string' ? currRelation.trim() : currRelation;
            const isBothEmpty = (normOrig === undefined || normOrig === null || normOrig === '') && (normCurr === undefined || normCurr === null || normCurr === '');
            if (isBothEmpty) return false;
            return normOrig !== normCurr;
          }

          // Normalize strings for comparison
          const normOrig = typeof orig === 'string' ? orig.trim() : orig;
          const normCurr = typeof curr === 'string' ? curr.trim() : curr;
          // If both nullish/empty string, treat as equal
          const isBothEmpty = (normOrig === undefined || normOrig === null || normOrig === '') && (normCurr === undefined || normCurr === null || normCurr === '');
          if (isBothEmpty) return false;
          return normOrig !== normCurr;
        });

        // Always include status fields even if unchanged (to preserve 0 values)
        const statusFields = ['status'];
        const hasStatusFields = statusFields.some(field =>
          currentMember[field] !== undefined && currentMember[field] !== null
        );

        if (changedFields.length === 0 && !hasStatusFields) {
          return; // skip unchanged members only if no status fields
        }

        const newMemberData = {};

        // Add changed fields
        changedFields.forEach((field) => {
          // Special handling for status fields to preserve 0 values
          if (field === 'status' || field === 'member_status') {
            newMemberData[field] = currentMember[field] !== undefined && currentMember[field] !== null ? Number(currentMember[field]) : 1;
          } else if (field === 'relation' || field === 'relation_id') {
            // Convert relation to relation_id for API
            newMemberData['relation_id'] = currentMember[field] !== undefined && currentMember[field] !== null ? Number(currentMember[field]) : null;
          } else if (field === 'gender' || field === 'gender_id') {
            // Convert gender to gender_id for API
            newMemberData['gender_id'] = currentMember[field] !== undefined && currentMember[field] !== null ? Number(currentMember[field]) : null;
          } else if (field === 'marital_status' || field === 'marital_status_id' || field === 'martial_status_id') {
            // Convert marital status to marital_status_id for API
            newMemberData['marital_status_id'] = currentMember[field] !== undefined && currentMember[field] !== null ? Number(currentMember[field]) : null;
          } else if (field === 'occupation' || field === 'occupation_id') {
            // Convert occupation to occupation_id for API
            newMemberData['occupation_id'] = currentMember[field] !== undefined && currentMember[field] !== null ? Number(currentMember[field]) : null;
          } else {
            newMemberData[field] = currentMember[field];
          }
        });

        // Always include status fields even if unchanged (to preserve 0 values)
        statusFields.forEach((field) => {
          if (currentMember[field] !== undefined && currentMember[field] !== null) {
            newMemberData[field] = Number(currentMember[field]);
          }
        });

        // Always include id_family to identify the record for update
        if (currentMember.id_family) {
          newMemberData.id_family = currentMember.id_family;
        } else if (currentMember.id) {
          newMemberData.id_family = currentMember.id;
        }

        if (Object.keys(newMemberData).length > 1) { // ensure at least one field + id is present
          newData.push(newMemberData);
        }
      });

      return { newData };
    }

    case 'education': {
      const original = personalData.originalEducationData.value;
      // Read current directly; avoid mutating reactive during computation
      const current = educationData.value;

      if (!Array.isArray(original) || !Array.isArray(current)) {
        // IMPROVED: If we have current data but no original, get original from education data as baseline
        if (Array.isArray(current) && current.length > 0) {
          const baselineData = personalData.originalEducationData.value || [];

          // FIX: Only include education entries that are different from baseline
          const changedEducation = [];

          current.forEach((currentEdu, index) => {
            const baselineEdu = baselineData[index] || {};

            // Check if any field changed
            const hasChanges =
              (currentEdu.edu_level_id || currentEdu.edu_level || '') !== (baselineEdu.edu_level_id || baselineEdu.edu_level || '') ||
              (currentEdu.edu_major_id || currentEdu.edu_major || '') !== (baselineEdu.edu_major_id || baselineEdu.edu_major || '') ||
              (currentEdu.edu_institution_id || currentEdu.edu_institution || '') !== (baselineEdu.edu_institution_id || baselineEdu.edu_institution || '') ||
              (currentEdu.edu_start_date || '') !== (baselineEdu.edu_start_date || '') ||
              (currentEdu.edu_end_date || '') !== (baselineEdu.edu_end_date || '') ||
              (currentEdu.ijazah_doc || '') !== (baselineEdu.ijazah_doc || '') ||
              (currentEdu.status !== undefined ? currentEdu.status : 1) !== (baselineEdu.status !== undefined ? baselineEdu.status : 1);

            if (hasChanges || index >= baselineData.length) {
              // Include only changed or new education entries
              changedEducation.push({
                edu_level_id: currentEdu.edu_level_id || currentEdu.edu_level || '',
                edu_major_id: currentEdu.edu_major_id || currentEdu.edu_major || '',
                edu_institution_id: currentEdu.edu_institution_id || currentEdu.edu_institution || '',
                edu_start_date: currentEdu.edu_start_date || '',
                edu_end_date: currentEdu.edu_end_date || '',
                ijazah_doc: currentEdu.ijazah_doc || '',
                status: currentEdu.status !== undefined ? currentEdu.status : 1,
                // FIXED: Always include client_key for attachments, even for insert action
                client_key: currentEdu.client_key || generateClientKey()
              });
            }
          });

          return { newData: changedEducation };
        }
        return { newData: [] };
      }

      const newData = [];

      // Find changed/added education records
      current.forEach((currentEducation, index) => {
        const originalEducation = original.find(o => o.id_education === currentEducation.id_education) || {};

        // Check if any field changed
        const hasChanges = Object.keys(currentEducation).some(key => {
          return originalEducation[key] !== currentEducation[key];
        });

        if (hasChanges) {
          // Only include fields that actually changed
          const newEducationData = {};

          // Check each field individually and only include if changed  
          // FIXED: Use correct field names from the form
          const fieldsToCheck = ['edu_level_id', 'edu_major_id', 'edu_institution_id', 'edu_start_date', 'edu_end_date', 'ijazah_doc'];

          fieldsToCheck.forEach(field => {
            // Use consistent education date keys expected by backend
            const currentValue = currentEducation[field];
            const originalValue = originalEducation[field];

            // Normalize values for comparison
            const normalizedCurrent = String(currentValue || '').trim();
            const normalizedOriginal = String(originalValue || '').trim();

            if (normalizedCurrent !== normalizedOriginal) {
              newEducationData[field] = currentValue;
            }
          });

          // ALWAYS include status field for API validation (required by API even if unchanged)
          const currentStatus = (currentEducation.status !== undefined && currentEducation.status !== null) ? Number(currentEducation.status) : 1;
          const originalStatus = (originalEducation.status !== undefined && originalEducation.status !== null) ? Number(originalEducation.status) : 1;

          newEducationData.status = currentStatus;

          // Generate client_key for education records (required for attachments)
          if (!newEducationData.client_key) {
            newEducationData.client_key = generateClientKey();

          }

          // Only add to arrays if there are actual changes or if we have status
          if (Object.keys(newEducationData).length > 0) {
            // For UPDATE action, include id_education in BOTH new and old data (required by API)
            if (currentEducation.id_education) {
              newEducationData.id_education = currentEducation.id_education;
            } else if (originalEducation.id_education) {
              newEducationData.id_education = originalEducation.id_education;
            }

            newData.push(newEducationData);
          }
        }
      });

      return { newData };
    }

    case 'payroll-account': {
      const original = personalData.originalPayrollAccountData.value;
      const current = personalData.payrollAccountData.value;

      if (!original || !current) {
        // FIX: Compare with baseline data, only include changed fields
        if (current && Object.keys(current).length > 0) {
          const baselineData = personalData.originalPayrollAccountData.value || {};

          const newData = {};

          Object.keys(current).forEach(key => {
            const currentValue = current[key];
            const baselineValue = baselineData[key];

            // Compare with baseline data, only include changed fields
            const normalizedBaseline = baselineValue === null || baselineValue === undefined ? '' : String(baselineValue);
            const normalizedCurrent = currentValue === null || currentValue === undefined ? '' : String(currentValue);

            if (normalizedBaseline !== normalizedCurrent) {
              // Convert IDs to numbers for API compatibility
              if (key === 'bank_id' || key === 'tax_status_id') {
                newData[key] = Number(currentValue);
              } else {
                newData[key] = currentValue;
              }
            }
          });

          return { newData };
        }
        return { newData: {} };
      }

      const newData = {};

      // Helper function to convert string IDs to numbers
      const convertToNumber = (value) => {
        if (value === null || value === undefined || value === '') return undefined;
        const num = Number(value);
        return isNaN(num) ? undefined : num;
      };

      // Compare field by field for payroll account
      Object.keys(current).forEach(key => {
        const originalValue = original[key];
        const currentValue = current[key];

        // Check if value changed (handle empty strings and null/undefined consistently)
        const originalNormalized = originalValue === null || originalValue === undefined ? '' : String(originalValue);
        const currentNormalized = currentValue === null || currentValue === undefined ? '' : String(currentValue);

        if (originalNormalized !== currentNormalized) {

          // Convert bank_id and tax_status_id to numbers, keep others as strings
          if (key === 'bank_id' || key === 'tax_status_id') {
            newData[key] = convertToNumber(currentValue);
          } else {
            newData[key] = currentNormalized;
          }
        }
      });

      return { newData };
    }

    case 'medical-record': {
      const original = personalData.originalMedicalRecordData.value;
      const current = personalData.medicalRecordData.value;

      if (!original || !current) {
        // If we have current data but no original, use current data as new changes
        if (current && Object.keys(current).length > 0) {
          return { newData: current };
        }
        return { newData: {} };
      }

      const newData = {};

      // Compare field by field for medical record
      Object.keys(current).forEach(key => {
        const originalValue = original[key];
        const currentValue = current[key];

        // Check if value changed (handle empty strings and null/undefined consistently)
        const originalNormalized = originalValue === null || originalValue === undefined ? '' : String(originalValue);
        const currentNormalized = currentValue === null || currentValue === undefined ? '' : String(currentValue);

        if (originalNormalized !== currentNormalized) {

          newData[key] = currentNormalized;
        }
      });

      return { newData };
    }

    case 'social-security': {
      const original = personalData.originalSocialSecurityData.value;
      const current = personalData.socialSecurityData.value;

      if (!original || !current) {
        return { newData: {} };
      }

      const newData = {};

      Object.keys(current).forEach((key) => {
        const origVal = original[key];
        const currVal = current[key];

        // Skip document fields when empty
        const isDocField = /_doc(_id)?$/.test(key);
        const isEmpty = currVal === null || currVal === undefined || currVal === '';
        if (isDocField && isEmpty) return;

        const normalizedOrig = origVal === null || origVal === undefined ? '' : String(origVal);
        const normalizedCurr = currVal === null || currVal === undefined ? '' : String(currVal);

        if (normalizedOrig !== normalizedCurr) {
          newData[key] = currVal;
        }
      });

      return { newData };
    }

    case 'medical-record': {
      const original = personalData.originalMedicalRecordData.value;
      const current = personalData.medicalRecordData.value;

      if (!original || !current) {
        // FIX: Compare with baseline data, only include changed fields
        if (current && Object.keys(current).length > 0) {
          const baselineData = personalData.originalMedicalRecordData.value || {};

          const newData = {};

          Object.keys(current).forEach(key => {
            const currentValue = current[key];
            const baselineValue = baselineData[key];

            // Compare with baseline data, only include changed fields
            const normalizedBaseline = baselineValue === null || baselineValue === undefined ? '' : String(baselineValue);
            const normalizedCurrent = currentValue === null || currentValue === undefined ? '' : String(currentValue);

            if (normalizedBaseline !== normalizedCurrent) {
              newData[key] = currentValue;
            }
          });

          return { newData };
        }
        return { newData: {} };
      }

      const newData = {};

      Object.keys(current).forEach((key) => {
        const origVal = original[key];
        const currVal = current[key];

        // Skip document fields when empty
        const isDocField = /_doc(_id)?$/.test(key);
        const isEmpty = currVal === null || currVal === undefined || currVal === '';
        if (isDocField && isEmpty) return;

        const normalizedOrig = origVal === null || origVal === undefined ? '' : String(origVal);
        const normalizedCurr = currVal === null || currVal === undefined ? '' : String(currVal);

        if (normalizedOrig !== normalizedCurr) {
          newData[key] = currVal;
        }
      });

      return { newData };
    }

    case 'employment-information': {
      const original = personalData.originalEmploymentInfoData.value;
      const current = personalData.employmentInfoData.value;

      if (!original || !current) {
        // FIX: Compare with baseline data, only include changed fields
        if (current && Object.keys(current).length > 0) {
          const baselineData = personalData.originalEmploymentInfoData.value || {};

          const newData = {};

          Object.keys(current).forEach(key => {
            const currentValue = current[key];
            const baselineValue = baselineData[key];

            // Compare with baseline data, only include changed fields
            const normalizedBaseline = baselineValue === null || baselineValue === undefined ? '' : String(baselineValue);
            const normalizedCurrent = currentValue === null || currentValue === undefined ? '' : String(currentValue);

            if (normalizedBaseline !== normalizedCurrent) {
              newData[key] = currentValue;
            }
          });

          return { newData };
        }
        return { newData: {} };
      }

      const newData = {};

      Object.keys(current).forEach((key) => {
        const origVal = original[key];
        const currVal = current[key];

        const normalizedOrig = origVal === null || origVal === undefined ? '' : String(origVal);
        const normalizedCurr = currVal === null || currVal === undefined ? '' : String(currVal);

        if (normalizedOrig !== normalizedCurr) {
          newData[key] = currVal;
        }
      });

      return { newData };
    }

    // Fallback should never be reached now
    default:
      console.warn(`[getChangedFieldsOnly] Unhandled tab: ${currentTab}`);
      return { newData: {} };
  }
};

// Function untuk prepare data berdasarkan tab aktif
const prepareCurrentTabData = () => {
  const currentTab = activeTab.value;

  switch (currentTab) {
    case 'basic-information':
      const basicData = employeeData.value;

      if (!basicData || Object.keys(basicData).length === 0) {
        return {};
      }

      // Convert string IDs to numbers for basic information
      const convertToNumber = (value) => {
        if (value === null || value === undefined || value === '') return undefined;
        const num = Number(value);
        return isNaN(num) ? undefined : num;
      };

      return {
        // Use current form data fields
        phone: basicData.main_phone_number || '',
        secondary_phone_number: basicData.secondary_phone_number || '',
        email: basicData.private_email || '',
        business_email: basicData.business_email || '',
        dateOfBirth: basicData.birth_date || '',
        place_of_birth: basicData.birth_place || '',
        no_ktp: basicData.no_ktp || '',
        nationalId: convertToNumber(basicData.nationality_id),
        passport_number: basicData.passport_number || '',
        clothing_size_id: convertToNumber(basicData.clothing_size_id),
        gender_id: convertToNumber(basicData.gender_id),
        religion_id: convertToNumber(basicData.religion_id),
        marital_status_id: convertToNumber(basicData.marital_status_id),
        employee_name: basicData.name || '',
      };

    case 'address':
      const addrData = personalData.addressData.value; // 🔧 Use consistent reference

      if (!addrData || Object.keys(addrData).length === 0) {
        return {};
      }

      // Return flat address data directly (no nested structure)
      return {
        id_address: addrData.id_address || '',
        // KTP fields
        detail_ktp: addrData.detail_ktp || '',
        province_ktp_id: addrData.province_ktp_id || '',
        province_ktp: addrData.province_ktp || '',
        city_ktp_id: addrData.city_ktp_id || '',
        city_ktp: addrData.city_ktp || '',
        postal_code_ktp: addrData.postal_code_ktp || '',
        sub_distric_ktp: addrData.sub_distric_ktp || '',
        administrative_village_ktp: addrData.administrative_village_ktp || '',
        rt_ktp: addrData.rt_ktp || '',
        rw_ktp: addrData.rw_ktp || '',
        street_name_ktp: addrData.street_name_ktp || '',
        house_number_ktp: addrData.house_number_ktp || '',
        // Domicile fields
        detail_domicile: addrData.detail_domicile || '',
        province_domicile_id: addrData.province_domicile_id || '',
        province_domicile: addrData.province_domicile || '',
        city_domicile_id: addrData.city_domicile_id || '',
        city_domicile: addrData.city_domicile || '',
        postal_code_domicile: addrData.postal_code_domicile || '',
        sub_distric_domicile: addrData.sub_distric_domicile || '',
        administrative_village_domicile: addrData.administrative_village_domicile || '',
        rt_domicile: addrData.rt_domicile || '',
        rw_domicile: addrData.rw_domicile || '',
        street_name_domicile: addrData.street_name_domicile || '',
        house_number_domicile: addrData.house_number_domicile || ''
      };

    case 'emergency-contact':
      const emergData = emergencyContactData.value;

      if (!Array.isArray(emergData) || emergData.length === 0) {
        return [];
      }

      return emergData.map(contact => ({
        emgc_name: contact.emgc_name || '',
        emgc_number: contact.emgc_number || '',
        emgc_address: contact.emgc_address || '',
        emgc_relationship_id: contact.emgc_relationship_id || contact.emgc_relationship || '',
        status: contact.status !== undefined ? contact.status : (contact.active ? 1 : 0)
        // Deliberately not including id_contact for insert action
      }));

    case 'payroll-account':
      const payrollData = payrollAccountData.value;

      if (!payrollData || Object.keys(payrollData).length === 0) {
        return {};
      }

      // Convert string IDs to numbers for bank_id and tax_status_id
      const convertedPayrollData = { ...payrollData };
      if (convertedPayrollData.bank_id) {
        convertedPayrollData.bank_id = Number(convertedPayrollData.bank_id);
      }
      if (convertedPayrollData.tax_status_id) {
        convertedPayrollData.tax_status_id = Number(convertedPayrollData.tax_status_id);
      }

      return convertedPayrollData;

    case 'family':
      const famData = familyData.value;

      if (!Array.isArray(famData) || famData.length === 0) {
        return [];
      }

      return famData.map(member => ({
        name: member.name || '',
        gender: member.gender || '',
        gender_id: member.gender_id || null,
        birth_date: member.birth_date || '',
        birth_place: member.birth_place || '',
        address: member.address || '',
        occupation: member.occupation || '',
        relation: member.relation || '',
        relation_id: member.relation_id || null,
        marital_status: member.marital_status || '',
        marital_status_id: member.marital_status_id || null,
        member_sequence: member.member_sequence || '',
        no_telkomedika: member.no_telkomedika || '',
        member_status: member.member_status || '',
        kk_doc: member.kk_doc || '',
        status: member.status || 1
        // Deliberately not including id for insert action
      }));

    case 'education':
      const eduData = educationData.value;

      if (!Array.isArray(eduData) || eduData.length === 0) {
        return [];
      }

      return eduData.map(education => ({
        edu_level_id: education.edu_level || '',
        edu_major_id: education.edu_major || '',
        edu_institution: education.edu_institution || '',
        edu_start_date: education.edu_start_date || '',
        edu_end_date: education.edu_end_date || '',
        ijazah_doc: education.ijazah_doc || '',
        status: education.status !== undefined ? education.status : 1
        // Deliberately not including id_education for insert action
      }));

    case 'social-security':
      const socialData = socialSecurityData.value;

      if (!socialData || Object.keys(socialData).length === 0) {
        return {};
      }

      // Filter out document fields with null/empty values from payload
      const filteredSocial = Object.fromEntries(
        Object.entries(socialData).filter(([key, val]) => {
          const isDocField = /_doc(_id)?$/.test(key);
          const isEmpty = val === null || val === undefined || val === '';
          return !(isDocField && isEmpty);
        })
      );

      return filteredSocial;

    case 'medical-record':
      const medicalData = medicalRecordData.value;

      if (!medicalData || Object.keys(medicalData).length === 0) {
        return {};
      }

      return medicalData;

    case 'employment-information':
      const employmentData = employmentInfoData.value;

      if (!employmentData || Object.keys(employmentData).length === 0) {
        return {};
      }

      return employmentData;

    default:
      return {};
  }
};

const handleSaveAsDraft = async () => {

  // Prevent multiple simultaneous requests
  if (isSavingDraft.value) {
    return;
  }

  try {
    isSavingDraft.value = true;

    // Check education validation first (if on education tab)
    if (activeTab.value === 'education') {
      const isValid = validateEducationFields();

      if (!isValid) {
        showError("For education records, you must update ALL required fields (Level, Major, Institution, Start Date, End Date) for each record before saving");
        isSavingDraft.value = false;
        return;
      }
    }

    // Validate basic information changes without attachments
    if (activeTab.value === 'basic-information') {
      const basicInfoValidation = validateBasicInformationChangesWithoutAttachments();
      if (!basicInfoValidation.isValid) {
        showWarning(basicInfoValidation.message);
        scrollToDocumentUpload();
        isSavingDraft.value = false;
        return;
      }
    }

    // Validate address changes without attachments
    if (activeTab.value === 'address') {
      const addressValidation = validateAddressChangesWithoutAttachments();
      if (!addressValidation.isValid) {
        showWarning(addressValidation.message);
        scrollToDocumentUpload();
        isSavingDraft.value = false;
        return;
      }
    }

    // Validate payroll account changes require documents
    if (activeTab.value === 'payroll-account') {
      const payrollAccountValidation = validatePayrollAccountChangesWithoutAttachments();
      if (!payrollAccountValidation.isValid) {
        showWarning(payrollAccountValidation.message);
        scrollToDocumentUpload();
        isSavingDraft.value = false;
        return;
      }
    }

    // Validate social security changes require documents
    if (activeTab.value === 'social-security') {
      const socialSecurityValidation = validateSocialSecurityChangesWithoutAttachments();
      if (!socialSecurityValidation.isValid) {
        showWarning(socialSecurityValidation.message);
        scrollToDocumentUpload();
        isSavingDraft.value = false;
        return;
      }
    }

    // Validate family changes require KK document
    if (activeTab.value === 'family') {
      const familyValidation = validateFamilyChangesWithoutAttachments();
      if (!familyValidation.isValid) {
        showWarning(familyValidation.message);
        scrollToDocumentUpload();
        isSavingDraft.value = false;
        return;
      }
    }

    // Check form validation first
    if (!isCurrentTabFormValid.value) {
      showError("Please fill all required fields before saving as draft");
      isSavingDraft.value = false;
      return;
    }

    // Check if there are changes to save
    if (!hasChangesInCurrentTab.value) {
      showError("No changes detected to save as draft");
      isSavingDraft.value = false;
      return;
    }

    // Get only changed fields
    const changedData = getChangedFieldsOnly();

    console.log('🔍 [INDEX] handleSaveAsDraft - changedData for tab:', activeTab.value, changedData);

    // Check if there are actual changes (handle object/array)
    const hasChangesPayload = Array.isArray(changedData.newData)
      ? changedData.newData.length > 0
      : (changedData.newData && Object.keys(changedData.newData).length > 0)

    if (!hasChangesPayload) {
      showError("No changes detected to save as draft");
      isSavingDraft.value = false;
      return;
    }

    // Family changes will be sent flat; server/composable will wrap if needed

    // Use the proper composable for change request submission
    const { useChangeRequestSubmit } = await import('~/composables/useChangeRequestSubmit');
    const { submitChangeRequest } = useChangeRequestSubmit();

    // Debug emergency contact specifically
    if (activeTab.value === 'emergency-contact' && Array.isArray(changedData.newData)) {
      changedData.newData.forEach((contact, index) => {
      });
    }

    // Prepare request payload using the composable

    const response = await submitChangeRequest({
      currentTab: activeTab.value,
      changes: activeTab.value === 'family' ? changedData.newData : changedData.newData,  // Send only changed fields
      note_employee: `Draft - ${getTabDisplayName(activeTab.value)} changes`,
      consent: true,
      submit: false // This makes it a draft (status = 1)
    });

    if (response && response.success) {

      // Close confirmation modals first
      isUnsavedChangesModalOpen.value = false;
      showConfirmationModal.value = false;

      // For education tab, dispatch event to trigger attachments upload
      // Use the same logic as ChangeRequestModal to extract changeRequestId
      let changeRequestId = null;
      
      if (response.data?.id) {
        changeRequestId = response.data.id;
      } else if (response.data?.id_change_req) {
        changeRequestId = response.data.id_change_req;
      } else if (response.data?.change_request_id) {
        changeRequestId = response.data.change_request_id;
      } else if (response.data?.request_id) {
        changeRequestId = response.data.request_id;
      } else if (response.data?.code) {
        changeRequestId = response.data.code;
      } else if (response.data?.data?.id) {
        changeRequestId = response.data.data.id;
      } else if (response.data?.data?.id_change_req) {
        changeRequestId = response.data.data.id_change_req;
      } else if (response.data?.data?.change_request_id) {
        changeRequestId = response.data.data.change_request_id;
      } else if (response.data?.data?.request_id) {
        changeRequestId = response.data.data.request_id;
      } else if (response.data?.data?.code) {
        changeRequestId = response.data.data.code;
      }

      if (activeTab.value === 'education' && changeRequestId) {

        // Dispatch event to trigger attachments upload in education section
        window.dispatchEvent(new CustomEvent('changeRequestSubmitted', {
          detail: {
            success: true,
            tab: 'education',
            id: changeRequestId,
            data: response.data,
            educationData: changedData.newData // Include education data with client keys
          }
        }));
      }

      // Handle attachments upload for all tabs
      if (changeRequestId) {
        const uploadPromises = [];

        console.log('📁 Starting attachment uploads for tab:', activeTab.value);

        // Handle basic information attachments (KTP documents and professional photo)
        if (activeTab.value === 'basic-information') {
          // Upload KTP documents (document type code: '3') - Basic Information
          if (basicInfoUploadedFiles.value.length > 0) {
            console.log('📄 Uploading basic info KTP files:', basicInfoUploadedFiles.value);
            for (const fileData of basicInfoUploadedFiles.value) {
              const uploadPromise = uploadAttachment(
                changeRequestId,
                fileData.file,
                ['3'] // KTP document type code
              ).catch(error => {
                console.error('KTP upload failed:', error);
                showError(`Failed to upload KTP document: ${error.message}`);
                return null;
              });
              uploadPromises.push(uploadPromise);
            }
          }

          // Upload Professional Photo (document type code: '1')
          if (basicInfoProfessionalPhoto.value) {
            console.log('📷 Uploading professional photo');
            const photoUploadPromise = uploadAttachment(
              changeRequestId,
              basicInfoProfessionalPhoto.value,
              ['1'] // Professional Photo document type code
            ).catch(error => {
              console.error('Professional photo upload failed:', error);
              showError(`Failed to upload professional photo: ${error.message}`);
              return null;
            });
            uploadPromises.push(photoUploadPromise);
          }
        }

        // Handle address attachments (KTP documents)
        if (activeTab.value === 'address') {
          console.log('🏠 Checking address files for draft:', {
            addressUploadedFiles: addressUploadedFiles.value,
            length: addressUploadedFiles.value?.length
          });

          if (addressUploadedFiles.value && addressUploadedFiles.value.length > 0) {
            console.log('🏠 Uploading address files for draft:', addressUploadedFiles.value);
            for (const fileData of addressUploadedFiles.value) {
              console.log('🏠 Uploading address file for draft:', fileData);
              const uploadPromise = uploadAttachment(
                changeRequestId,
                fileData.file,
                ['3'] // Document type code: '3' for KTP
              ).catch(error => {
                console.error('Address KTP upload failed:', error);
                showError(`Failed to upload Address KTP document: ${error.message}`);
                return null;
              });
              uploadPromises.push(uploadPromise);
            }
          } else {
            console.log('🏠 No address files to upload for draft');
          }
        }

        // Handle payroll account attachments (NPWP Document + Saving Book Document)
        if (activeTab.value === 'payroll-account') {
          if (payrollAccountUploadedFiles.value && payrollAccountUploadedFiles.value.length > 0) {
            console.log('💰 Uploading payroll account files for draft:', payrollAccountUploadedFiles.value);
            for (const fileData of payrollAccountUploadedFiles.value) {
              console.log('💰 Uploading payroll account file for draft:', fileData);
              // Document type codes from selected type in MultiDocumentUpload
              const docTypeCode = fileData.documentType;
              const uploadPromise = uploadAttachment(
                changeRequestId,
                fileData.file,
                [docTypeCode]
              ).catch(error => {
                console.error('Payroll account file upload failed:', error);
                showError(`Failed to upload document: ${error.message}`);
                return null;
              });
              uploadPromises.push(uploadPromise);
            }
          } else {
            console.log('💰 No payroll account files to upload for draft');
          }
        }

        // Handle social security attachments (Telkomedika Card + BPJS Card)
        if (activeTab.value === 'social-security') {
          if (socialSecurityUploadedFiles.value && socialSecurityUploadedFiles.value.length > 0) {
            console.log('🏥 Uploading social security files for draft:', socialSecurityUploadedFiles.value);
            for (const fileData of socialSecurityUploadedFiles.value) {
              console.log('🏥 Uploading social security file for draft:', fileData);
              // Document type codes from selected type in MultiDocumentUpload
              const docTypeCode = fileData.documentType;
              const uploadPromise = uploadAttachment(
                changeRequestId,
                fileData.file,
                [docTypeCode]
              ).catch(error => {
                console.error('Social security file upload failed:', error);
                showError(`Failed to upload document: ${error.message}`);
                return null;
              });
              uploadPromises.push(uploadPromise);
            }
          } else {
            console.log('🏥 No social security files to upload for draft');
          }
        }

        // Handle family attachments (KK document)
        if (activeTab.value === 'family') {
          if (familyUploadedFiles.value && familyUploadedFiles.value.length > 0) {
            console.log('👪 Uploading family files for draft:', familyUploadedFiles.value);
            for (const fileData of familyUploadedFiles.value) {
              const docTypeCode = fileData.documentType || '2';
              const uploadPromise = uploadAttachment(
                changeRequestId,
                fileData.file,
                [docTypeCode]
              ).catch(error => {
                console.error('Family KK file upload failed:', error);
                showError(`Failed to upload KK document: ${error.message}`);
                return null;
              });
              uploadPromises.push(uploadPromise);
            }
          } else {
            console.log('👪 No family files to upload for draft');
          }
        }

        // Wait for all uploads to complete
        if (uploadPromises.length > 0) {
          try {
            console.log(`🚀 Starting ${uploadPromises.length} file uploads for ${activeTab.value}`);
            await Promise.allSettled(uploadPromises);
            console.log('✅ All file uploads completed');

            // Clear files after successful upload based on tab
            if (activeTab.value === 'basic-information') {
              clearBasicInfoFiles();
            } else if (activeTab.value === 'address') {
              addressUploadedFiles.value = [];
            } else if (activeTab.value === 'payroll-account') {
              payrollAccountUploadedFiles.value = [];
            } else if (activeTab.value === 'social-security') {
              socialSecurityUploadedFiles.value = [];
            } else if (activeTab.value === 'family') {
              familyUploadedFiles.value = [];
            }
          } catch (error) {
            console.error("❌ Error during attachments upload:", error);
          }
        } else {
          console.log('📁 No files to upload for', activeTab.value);
        }
      }

      // Show success message
      showSuccessToast('Draft saved successfully. You can continue editing.');

      // ✅ FIXED: Force refresh change requests and ALL tabs cache setelah save draft
      console.log('[SAVE DRAFT SUCCESS] Starting comprehensive refresh for tab:', activeTab.value);

      try {
        // Step 1: Reset all caches
        tabManagement.resetChangeRequestsCache();
        invalidateCache('after-draft-save');

        // Step 2: Bump cache version to force component re-render
        cacheVersion.value = Date.now();
        console.log('[SAVE DRAFT SUCCESS] Cache version bumped:', cacheVersion.value);

        // Step 3: Load fresh change requests from API
        await loadChangeRequests();

        // Step 4: ✅ CRITICAL - Force update ALL tabs cache untuk real-time check
        await tabManagement.forceUpdateAllTabsCache();

        // Step 5: Refresh tab management to update all tab statuses
        await tabManagement.smartRefresh(true);

        console.log('[SAVE DRAFT SUCCESS] ✅ Comprehensive refresh completed');
      } catch (error) {
        console.error('[SAVE DRAFT SUCCESS] ❌ Error during refresh:', error);
      }

      // Reset data and exit edit mode since we're going to history page
      await resetAllDataToOriginal();

      // Exit edit mode
      tabManagement.resetEditMode();

      // Reset loading states
      isSavingDraft.value = false;
      isSubmittingUpdate.value = false;

      // Remove beforeunload event listener
      if (beforeUnloadHandler) {
        window.removeEventListener('beforeunload', beforeUnloadHandler);
        beforeUnloadHandler = null;
      }

      // Dispatch event for history update
      window.dispatchEvent(new CustomEvent('requestHistoryUpdated', {
        detail: { type: 'draft', requestId: response.data?.id_change_req || response.data?.id }
      }));

      // Redirect to history page where user can continue editing
      await navigateTo('/update-data/history');
      return response;
    } else {
      throw new Error(response?.message || 'Failed to save draft - API returned non-success response');
    }
  } catch (error) {
    // Close confirmation modals even on error
    isUnsavedChangesModalOpen.value = false;
    showConfirmationModal.value = false;

    // Handle 400 validation errors specifically
    if (error.status === 400) {
      const errorMessage = error.data?.message || error.message || "Validation error. Please check your input and try again.";
      showError(`Failed to save draft: ${errorMessage}`);
    } else {
      // More robust error message handling
      const errorMessage = error?.message || error?.toString() || 'An unexpected error occurred while saving draft';
      showError(`Failed to save draft: ${errorMessage}`);
    }
  } finally {
    // Always reset loading state
    isSavingDraft.value = false;

    // Ensure all UI states are properly reset
    try {
      isSubmittingUpdate.value = false;
    } catch (e) {
    }

    // ✅ SAFETY: Force refresh cache even on error to ensure state consistency
    // This handles cases where draft was saved but navigation failed
    try {
      tabManagement.resetChangeRequestsCache();
      invalidateCache('after-draft-finally');
      cacheVersion.value = Date.now();

      // Trigger background refresh (non-blocking)
      setTimeout(async () => {
        try {
          await loadChangeRequests();
          await tabManagement.forceUpdateAllTabsCache();
          console.log('[SAVE DRAFT FINALLY] ✅ Safety refresh completed');
        } catch (e) {
          console.error('[SAVE DRAFT FINALLY] ❌ Safety refresh failed:', e);
        }
      }, 500);
    } catch (e) {
      // Ignore safety refresh errors
    }
  }
};

const handleDiscardChanges = async () => {
  try {
    // Close both modals first to prevent any UI state issues
    isUnsavedChangesModalOpen.value = false;
    showConfirmationModal.value = false;

    // Reset all data to original values with better error handling
    await resetAllDataToOriginal();

    // Wait for next tick to ensure all reactive updates are processed
    await nextTick();

    // Clear any pending changes
    allTabChanges.value = {};

    // Wait a bit more to ensure all reactive operations complete
    await new Promise(resolve => setTimeout(resolve, 300));

    // Dispatch form reset event to all form components
    if (process.client) {
      window.dispatchEvent(new CustomEvent('formReset', {
        detail: { success: true }
      }));
    }

    // Exit edit mode
    await tabManagement.resetEditMode();

    // Reset loading states
    isSavingDraft.value = false;
    isSubmittingUpdate.value = false;

    // Remove beforeunload event listener
    if (beforeUnloadHandler) {
      window.removeEventListener("beforeunload", beforeUnloadHandler);
      beforeUnloadHandler = null;
    }

    // Handle tab switching if there was a pending tab switch
    if (pendingTabSwitch.value) {
      switchTab(pendingTabSwitch.value);
      pendingTabSwitch.value = null;
    }

    // Allow navigation if there was a pending one
    if (pendingNavigation.value) {
      pendingNavigation.value();
      pendingNavigation.value = null;
    }

  } catch (error) {

    // Even if there's an error, try to clean up the UI state
    isUnsavedChangesModalOpen.value = false;
    showConfirmationModal.value = false;
    allTabChanges.value = {};

    // Reset loading states
    isSavingDraft.value = false;
    isSubmittingUpdate.value = false;

    // Try to exit edit mode anyway
    try {
      await tabManagement.resetEditMode();
    } catch (resetError) {
    }

    // Show specific error message based on the error type
    let errorMessage = 'Failed to discard changes completely. Please refresh the page.';
    if (error.message) {
      errorMessage = `Failed to discard changes: ${error.message}. Please refresh the page if the issue persists.`;
    }

    // Show error to user
    if (typeof showError === 'function') {
      showError(errorMessage);
    }
  }
};

// ✅ OPTIMIZED: Instant tab switching with smart cache integration
const onTabChange = async (nextTab) => {
  try {
    // ✅ INSTANT SWITCH: Change tab immediately for better UX
    const previousTab = activeTab.value;
    isTabSwitching.value = true;

    // If not in edit mode, allow instant switch
    if (!editMode.value) {
      // Use instant switch - no loading delays
      tabManagement.handleTabChange(nextTab);

      // Preload data for this tab if needed (background)
      setTimeout(() => {
        preloadTabData(nextTab).catch(() => {});
        isTabSwitching.value = false;
      }, 50);
      return;
    }

    // Determine if there are unsaved changes
    const hasChanges = hasUnsavedChanges.value || hasCurrentTabChanged.value;

    if (hasChanges) {
      // Revert tab change for confirmation
      isTabSwitching.value = false;
      // Store pending tab switch and open confirmation modal
      pendingTabSwitch.value = nextTab;
      isUnsavedChangesModalOpen.value = true;
      showConfirmationModal.value = true;
      return;
    }

    // No changes → proceed with instant switch
    tabManagement.handleTabChange(nextTab);

    // Background data operations
    setTimeout(() => {
      preloadTabData(nextTab).catch(() => {});
      isTabSwitching.value = false;
    }, 50);

  } catch (e) {
    // Fallback to original handler
    tabManagement.handleTabChange(nextTab);
    isTabSwitching.value = false;
  }
};

const handleCancelLeave = () => {
  // Close both modals
  isUnsavedChangesModalOpen.value = false;
  showConfirmationModal.value = false;

  // Reset loading states
  isSavingDraft.value = false;
  isSubmittingUpdate.value = false;

  // Cancel navigation if there was a pending one
  if (pendingNavigation.value) {
    pendingNavigation.value(false);
    pendingNavigation.value = null;
  }

  // Cancel tab switching if there was a pending one
  pendingTabSwitch.value = null;
};

function addEmergencyContact() {
  if (!Array.isArray(emergencyContactData.value)) {
    emergencyContactData.value = [];
  }
  emergencyContactData.value.push({
    emgc_name: "",
    emgc_relationship_id: "",
    emgc_number: "",
    emgc_address: "",
    active: emergencyContactData.value.length === 0, // Pertama otomatis active
    status: emergencyContactData.value.length === 0 ? 1 : 0, // API requires status field (1=active, 0=inactive)
  });
  showSuccessToast("Emergency contact added successfully");
  // Auto scroll ke card terakhir
  nextTick(() => {
    const lastCard = document.querySelectorAll(".emergency-contact-card");
    if (lastCard.length > 0) {
      lastCard[lastCard.length - 1].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  });
}
function removeEmergencyContact(idx) {
  emergencyContactData.value.splice(idx, 1);
}
function handleToggleActiveEmergencyContact(idx, val) {
  // Ensure we have valid data
  if (!Array.isArray(emergencyContactData.value) || idx >= emergencyContactData.value.length) return;

  // FIXED: Only change the specific contact's status, keep others unchanged
  const updated = emergencyContactData.value.map((item, i) => ({
    ...item,
    status: i === idx ? (val ? 1 : 0) : item.status // Keep other contacts' status unchanged
  }));

  // Update the reactive data
  emergencyContactData.value = updated;

}

// Wrapper function untuk loadChangeRequests dengan loading state
const loadChangeRequestsWithLoading = async () => {
  try {
    isLoadingChangeRequests.value = true;
    await loadChangeRequests();
  } catch (error) {
  } finally {
    isLoadingChangeRequests.value = false;
  }
};

// ✅ OPTIMIZED: Smart tab data preloading with cache
const preloadTabData = async (tabId) => {
  // Skip if data already cached and valid
  if (tabDataCache.isCacheValid(tabId)) {
    return;
  }

  // Skip always-fresh tabs (they load instantly anyway)
  if (tabDataCache.CACHE_CONFIG.alwaysFresh.includes(tabId)) {
    return;
  }

  try {
    tabDataCache.setLoading(tabId, 'data', true);

    // Preload based on tab type
    switch (tabId) {
      case 'basic-information':
        // Basic info is already loaded, just cache it
        if (employeeData.value && Object.keys(employeeData.value).length > 0) {
          tabDataCache.setCachedData(tabId, 'employeeData', toRaw(employeeData.value));
        }
        break;

      case 'address':
        if (addressData.value && Object.keys(addressData.value).length > 0) {
          tabDataCache.setCachedData(tabId, 'addressData', toRaw(addressData.value));
        }
        break;

      case 'emergency-contact':
        if (emergencyContactData.value && emergencyContactData.value.length > 0) {
          tabDataCache.setCachedData(tabId, 'emergencyContactData', toRaw(emergencyContactData.value));
        }
        break;

      case 'payroll-account':
        if (payrollAccountData.value && Object.keys(payrollAccountData.value).length > 0) {
          tabDataCache.setCachedData(tabId, 'payrollAccountData', toRaw(payrollAccountData.value));
        }
        break;

      case 'family':
        if (familyData.value && familyData.value.length > 0) {
          tabDataCache.setCachedData(tabId, 'familyData', toRaw(familyData.value));
        }
        break;

      case 'education':
        if (educationData.value && educationData.value.length > 0) {
          tabDataCache.setCachedData(tabId, 'educationData', toRaw(educationData.value));
        }
        break;

      case 'social-security':
        if (socialSecurityData.value && Object.keys(socialSecurityData.value).length > 0) {
          tabDataCache.setCachedData(tabId, 'socialSecurityData', toRaw(socialSecurityData.value));
        }
        break;

      case 'medical-record':
        if (medicalRecordData.value && Object.keys(medicalRecordData.value).length > 0) {
          tabDataCache.setCachedData(tabId, 'medicalRecordData', toRaw(medicalRecordData.value));
        }
        break;
    }

  } catch (error) {
    console.warn(`Failed to preload tab data for ${tabId}:`, error);
  } finally {
    tabDataCache.setLoading(tabId, 'data', false);
  }
};

// ✅ CACHE: Manual refresh function for users
const handleManualRefresh = async () => {
  if (isRefreshing.value) return;

  try {
    isRefreshing.value = true;

    // Clear all tab data cache
    tabDataCache.invalidateCache(null, 'manual-refresh');

    // Clear tab status cache
    tabManagement.invalidateAllCache();

    // Force reload change requests
    await loadChangeRequestsWithLoading();

    // Refresh tab management
    await tabManagement.smartRefresh(true);

    // Show success message
    showSuccessToast('Data refreshed successfully');

  } catch (error) {
    console.error('Manual refresh failed:', error);
    showError('Failed to refresh data. Please try again.');
  } finally {
    isRefreshing.value = false;
  }
};

// Initialize data on mount
onMounted(async () => {
  // ✅ FIX: Mark as mounted to trigger skeleton display
  // This ensures skeleton shows immediately instead of empty form
  isMounted.value = true;

  // ✅ CRITICAL: Wait for auth to be ready before loading data
  // This prevents race condition where API calls happen before token arrives
  const { useAuthState } = await import('~/composables/useAuthState');
  const { waitForAuth } = useAuthState(); // Call the composable
  console.log('[Update-Data] ⏳ Waiting for auth before loading data...');

  const authReady = await waitForAuth(5000); // Wait max 5 seconds

  if (!authReady) {
    console.warn('[Update-Data] ⚠️ Auth not ready after timeout, proceeding anyway');
  } else {
    console.log('[Update-Data] ✅ Auth ready, proceeding with data load');
  }

  // Clean up old draft system localStorage
  try {
    localStorage.removeItem("personalDataDrafts");
  } catch (error) {
  }

  // ✅ FIXED: Start critical loading processes in PARALLEL for faster initial load
  const loadingPromises = [];

  // Load medical options in background (non-blocking) - delayed to not block initial load
  setTimeout(() => {
    loadMedicalOptions().catch(() => { });
  }, 2000);

  // ✅ FIXED BUG #1: Load change requests AND basic info in PARALLEL
  // This makes skeleton loading appear simultaneously for warning banner AND form

  // Promise 1: Load change requests + REAL-TIME check untuk re-validate tabs
  loadingPromises.push(
    (async () => {
      try {
        isLoadingChangeRequests.value = true;
        console.log('[MOUNT] 🔄 Loading fresh change requests untuk validasi tabs...');

        // Step 1: Clear semua cache untuk force fresh check
        tabManagement.invalidateAllCache();
        tabManagement.resetChangeRequestsCache();

        // Step 2: Load change requests dari API (FRESH DATA)
        await loadChangeRequests();
        console.log('[MOUNT] ✅ Change requests loaded, total:', changeRequests.value?.length || 0);

        // Step 3: Force update ALL tabs cache untuk real-time check
        // Ini akan check setiap tab apakah ada draft/waiting/need-revision
        await tabManagement.forceUpdateAllTabsCache();

        // Step 4: Refresh tab management untuk sync UI
        await tabManagement.smartRefresh(true);

        console.log('[MOUNT] ✅ Tab validation completed - tabs sudah divalidasi dengan changeRequests terbaru');
      } catch (error) {
        console.error('[MOUNT] ❌ Failed to load change requests:', error);
      } finally {
        isLoadingChangeRequests.value = false;
      }
    })()
  );

  // Promise 2: Load basic information in parallel
  loadingPromises.push(
    (async () => {
      try {
        isLoadingBasicInfo.value = true;
        await loadBasicInformation();
      } catch (error) {
        console.error('[MOUNT] Failed to load basic info:', error);
      } finally {
        isLoadingBasicInfo.value = false;
      }
    })()
  );

  // ✅ OPTIMIZED: Preload data for common tabs in background (after initial load)
  if (process.client) {
    // Preload basic-information (most accessed) immediately
    setTimeout(async () => {
      try {
        await preloadTabData('basic-information');
      } catch (e) { /* ignore preload errors */ }
    }, 100);

    // Preload other common tabs with delays to prevent server overload
    const commonTabs = ['address', 'emergency-contact', 'payroll-account'];
    commonTabs.forEach((tabId, index) => {
      setTimeout(async () => {
        try {
          await preloadTabData(tabId);
        } catch (e) { /* ignore preload errors */ }
      }, 500 + (index * 200)); // Staggered loading
    });
  }

  // Load data for the current tab if it's not basic-information (lazy loading)
  if (activeTab.value !== "basic-information") {
    // Load current tab data in background (non-blocking)
    setTimeout(async () => {
      try {
        switch (activeTab.value) {
          case "address":
            isLoadingAddress.value = true;
            await loadAddress();
            break;
          case "emergency-contact":
            isLoadingEmergencyContact.value = true;
            await loadEmergencyContact();
            break;
          case "payroll-account":
            isLoadingPayrollAccount.value = true;
            await loadPayrollAccount();
            break;
          case "family":
            isLoadingFamily.value = true;
            await loadFamily();
            break;
          case "education":
            isLoadingEducation.value = true;
            await loadEducation();
            break;
          case "social-security":
            isLoadingSocialSecurity.value = true;
            await loadSocialSecurity();
            break;
          case "medical-record":
            isLoadingMedicalRecord.value = true;
            await loadMedicalRecord();
            break;
          case "employment-information":
            isLoadingEmploymentInfo.value = true;
            await loadEmploymentInfo();
            break;
        }
      } catch (error) {
      } finally {
        // Reset loading states
        isLoadingAddress.value = false;
        isLoadingEmergencyContact.value = false;
        isLoadingPayrollAccount.value = false;
        isLoadingFamily.value = false;
        isLoadingEducation.value = false;
        isLoadingSocialSecurity.value = false;
        isLoadingMedicalRecord.value = false;
        isLoadingEmploymentInfo.value = false;
      }
    }, 100); // Small delay to let page render first
  }

  // Wait for all loading to complete
  await Promise.all(loadingPromises);

  // Populate form with draft data if available
  // STABILITY: Shorter delay for better UX
  await nextTick();
  setTimeout(async () => {
    try {
      await populateFormWithDraftData();
    } catch (error) {
    }
  }, 200); // Reduced from 1000ms to 200ms for better performance

  // Notify parent that iframe content is fully ready
  if (process.client && window.parent !== window) {
    try {
      const envConfig = await import('~/config/environment.js');
      const parentOrigin = envConfig.default.IS_PRODUCTION ? envConfig.default.FRONTEND_URLS.PRODUCTION.ESS_HOST : envConfig.default.FRONTEND_URLS.DEVELOPMENT.ESS_HOST;
      window.parent.postMessage({
        type: 'IFRAME_READY',
        source: 'update-data',
        timestamp: Date.now(),
        data: {
          page: 'update-data',
          loaded: true
        }
      }, parentOrigin);
      console.log('[Update-Data] ✅ Content fully loaded - notified parent');
    } catch (error) {
      console.error('[Update-Data] ❌ Failed to notify parent:', error);
    }
  }

  // Mark initial page load as complete
  isInitialPageLoad.value = false;

  // ✅ SAFETY: Force warning banner ready after timeout to prevent infinite skeleton
  setTimeout(() => {
    if (!isWarningBannerReady.value) {
      console.warn('[WARNING] Forcing warning banner ready after timeout. Debug info:', {
        isLoadingChangeRequests: isLoadingChangeRequests.value,
        isInitialPageLoad: isInitialPageLoad.value,
        changeRequestsLoaded: changeRequests.value !== null && changeRequests.value !== undefined,
        changeRequestsCount: changeRequests.value?.length,
        activeTab: activeTab.value
      });
      isWarningBannerForcedReady.value = true;
    }
  }, 5000); // 5 seconds safety timeout

  // Update canEditCurrentTab on mount
  await updateCanEditCurrentTab();

  // Set up the hasUnsavedChanges function for tab management
  setHasUnsavedChangesFunction(() => {
    if (!editMode.value) {
      return false;
    }

    // Use computedChangesForCurrentTab to check for changes
    const changes = computedChangesForCurrentTab.value;
    const hasChanges = changes && Object.keys(changes).length > 0;

    return hasChanges;
  });

  // Optimized: Replace expensive mega watcher with debounced shallow watcher
  // This reduces performance overhead by 90%

  // Create a consolidated state tracker for performance
  const consolidatedState = computed(() => ({
    employeeData: personalData.employeeData.value,
    originalData: personalData.originalData.value,
    addressData: personalData.addressData.value,
    originalAddressData: personalData.originalAddressData.value,
    emergencyContactData: personalData.emergencyContactData.value,
    originalEmergencyContactData: personalData.originalEmergencyContactData.value,
    payrollAccountData: personalData.payrollAccountData.value,
    originalPayrollAccountData: personalData.originalPayrollAccountData.value,
    familyData: personalData.familyData.value,
    originalFamilyData: personalData.originalFamilyData.value,
    educationData: personalData.educationData.value,
    originalEducationData: personalData.originalEducationData.value,
    socialSecurityData: personalData.socialSecurityData.value,
    originalSocialSecurityData: personalData.originalSocialSecurityData.value,
    medicalRecordData: personalData.medicalRecordData.value,
    originalMedicalRecordData: personalData.originalMedicalRecordData.value,
    employmentInfoData: personalData.employmentInfoData.value,
    originalEmploymentInfoData: personalData.originalEmploymentInfoData.value,
    editMode: editMode.value,
    activeTab: activeTab.value,
    timestamp: Date.now() // Add timestamp to force reactivity when needed
  }))

  // Debounced watcher with error handling - much more performant
  const cleanupConsolidatedWatcher = useDebounceWatch(
    consolidatedState,
    (newState, oldState) => {
      // Only process if not resetting and there are actual changes
      if (!personalData.isResetting.value && oldState) {
        try {
          // Only trigger re-evaluation if specific properties changed
          const changedProperty = findChangedProperty(newState, oldState)
          if (changedProperty && (changedProperty.includes('Data') || changedProperty === 'editMode' || changedProperty === 'activeTab')) {
            // Force re-evaluation of change detection
          }
        } catch (error) {
        }
      }
    },
    {
      debounce: 200, // 200ms debounce for better responsiveness
      deep: false    // Shallow watching since we control the computed structure
    }
  );

  // Set up the reset data function for tab management
  setResetDataFunction(resetAllDataToOriginal);

  // ✅ GUARD: Watch for activeTab changes to RE-CHECK changeRequests (prevent duplicate requests)
  watch(activeTab, async (newTab, oldTab) => {
    if (newTab && newTab !== oldTab) {
      console.log(`[TAB SWITCH GUARD] 🔄 Switch dari "${oldTab}" ke "${newTab}" - re-checking changeRequests...`);

      // ✅ CRITICAL: Force fresh check untuk tab baru (GUARD mechanism)
      // Ini memastikan tab tidak bisa edit kalau ada request yang sedang berjalan
      try {
        // Step 0: FORCE reload changeRequests dari API (ensure fresh data)
        tabManagement.resetChangeRequestsCache();
        await loadChangeRequests();
        console.log(`[TAB SWITCH GUARD] ✅ Fresh changeRequests loaded, total: ${changeRequests.value?.length || 0}`);

        // Step 1: Invalidate cache untuk tab baru (force fresh check)
        tabManagement.invalidateTabCache(newTab);

        // Step 2: Force update tab status dengan fresh data dari changeRequests
        await tabManagement.updateTabStatusCache(newTab, true); // force = true

        // Step 3: Update canEditCurrentTab dengan hasil fresh check
        await updateCanEditCurrentTab();

        // Step 4: Bump cache version untuk force re-render warning banner
        cacheVersion.value = Date.now();

        // Step 5: Check hasil guard
        const canEdit = tabManagement.canEditTabCompletelySync(newTab);
        const tabStatus = tabManagement.tabStatusCache.value[newTab];

        console.log(`[TAB SWITCH GUARD] ✅ Guard check completed for "${newTab}":`, {
          canEdit,
          hasDraft: tabStatus?.hasDraft || false,
          hasWaiting: tabStatus?.hasWaiting || false,
          hasNeedRevision: tabStatus?.hasNeedRevision || false
        });

        if (!canEdit) {
          console.log(`[TAB SWITCH GUARD] 🔒 Tab "${newTab}" LOCKED - ada request yang sedang berjalan`);
        } else {
          console.log(`[TAB SWITCH GUARD] ✅ Tab "${newTab}" AVAILABLE - tidak ada request yang berjalan`);
        }
      } catch (error) {
        console.error(`[TAB SWITCH GUARD] ❌ Error checking guard for "${newTab}":`, error);
      }

      // ✅ OPTIMIZED: Only populate draft data if needed (no network calls)
      try {
        await populateFormWithDraftData();
      } catch (error) {
      }

      // ✅ OPTIMIZED: Lightweight banner update (uses cache)
      debouncedReloadWarningBanner();
    }
  });

  // Initial load - pre-load cache for common tabs for better performance
  const commonTabs = ['basic-information', 'address', 'emergency-contact', 'payroll-account'];
  commonTabs.forEach(tabId => {
    tabManagement.initializeTabCache(tabId);
  });

  // Ensure current active tab is included
  if (activeTab.value && !commonTabs.includes(activeTab.value)) {
    tabManagement.initializeTabCache(activeTab.value);
  }

  // Watch for changeRequests changes dengan debouncing untuk mencegah spam
  let cacheInvalidationTimeout = null;
  const CACHE_INVALIDATION_DELAY = 1000; // 1 detik delay

  // Watch for changeRequests changes to update cache (simplified to prevent recursive updates)
  watch(changeRequests, (newRequests, oldRequests) => {
    // Clear existing timeout
    if (cacheInvalidationTimeout) {
      clearTimeout(cacheInvalidationTimeout);
    }

    // Set new timeout untuk debouncing
    cacheInvalidationTimeout = setTimeout(async () => {
      // Invalidate all cache when changeRequests change
      // This ensures warning banner updates immediately
      tabManagement.invalidateAllCache();

      // Also populate form with draft data when changeRequests change
      try {
        await populateFormWithDraftData();
      } catch (error) {
      }

      cacheInvalidationTimeout = null;
    }, CACHE_INVALIDATION_DELAY);
  }, { deep: false, immediate: false });

  // Legacy event handler - will be replaced by enhanced version below

  // Enhanced event handler for request deletion with cache invalidation
  const handleRequestDeleted = async (event) => {

    // Invalidate cache with version bump
    invalidateCache('request_deleted');

    // Force reload data
    await loadChangeRequestsWithLoading();

    // Refresh tab management dengan focus ke deleted category
    const deletedCategory = event.detail?.category;
    if (deletedCategory) {
      await tabManagement.refreshSpecificCategory?.(deletedCategory);
    } else {
      await tabManagement.smartRefresh(true);
    }
  };

  // Enhanced event handler for general updates
  const handleRequestHistoryUpdated = async (event) => {
    const reason = event.detail?.type || event.detail?.reason || 'history_updated';

    // Invalidate cache
    invalidateCache(reason);

    // First reload change requests with loading flag
    await loadChangeRequestsWithLoading();
    // Then refresh tab management
    tabManagement.debouncedSmartRefresh(reason, 500); // 500ms delay for debouncing
  };

  // Store references no longer needed; remove listeners directly using function refs

  // Add event listeners for various request events
  window.addEventListener('requestHistoryUpdated', handleRequestHistoryUpdated);
  window.addEventListener('requestDeleted', handleRequestDeleted);
  window.addEventListener('requestStatusChanged', handleRequestHistoryUpdated);
  window.addEventListener('draftDeleted', handleRequestDeleted);
  window.addEventListener('forceRefreshUpdateData', handleRequestHistoryUpdated);
  
  // Enhanced navigation detection for route changes
  const lastRefreshTime = ref(Date.now());

  // ✅ FIXED BUG #2: Enhanced navigation detection with force re-render and debounce protection
  let smartRefreshInterval = null;

  // Add navigation event listener for browser navigation
  const handleNavigationChange = async () => {
    try {
      // Invalidate cache
      invalidateCache('browser_navigation');
      // Reload change requests with loading flag
      await loadChangeRequestsWithLoading();
      // Then refresh tab management
      await tabManagement.smartRefresh(true);
      lastRefreshTime.value = Date.now();
    } catch (error) {
      console.error('[Update-Data] ❌ Error during navigation change:', error);
    }
  };

  // Page visibility API for better refresh timing
  const handleVisibilityChange = async () => {
    if (!document.hidden && route.path === '/update-data') {
      // Page became visible - check for stale data
      const timeSinceLastRefresh = Date.now() - lastRefreshTime.value;
      if (timeSinceLastRefresh > 30000) { // 30 seconds
        invalidateCache('page_focus');
        await debouncedReloadWarningBanner();
        lastRefreshTime.value = Date.now();
      }
    }
  };

  watch(() => route.fullPath, async (newPath, oldPath) => {
    // Clear any pending navigation refresh
    if (navigationRefreshTimeout) {
      clearTimeout(navigationRefreshTimeout);
      navigationRefreshTimeout = null;
    }

    // Detect navigation FROM history TO update-data
    if (newPath === '/update-data' && oldPath && oldPath.includes('/update-data/history')) {
      console.log('[NAVIGATION] Detected navigation from history to update-data');
      console.log('[NAVIGATION] Old path:', oldPath);
      console.log('[NAVIGATION] New path:', newPath);
      console.log('[NAVIGATION] Starting comprehensive refresh...');

      // ✅ REMOUNT: Add delay untuk ensure API has processed any recent submissions
      navigationRefreshTimeout = setTimeout(async () => {
        try {
          console.log('[REMOUNT via NAVIGATION] 🔄 Balik dari /history ke /update-data - re-checking changeRequests...');

          // Step 1: Clear cache untuk force fresh check
          invalidateCache('navigation_from_history');
          tabManagement.resetChangeRequestsCache();

          // Step 2: Bump cache version untuk force re-render
          cacheVersion.value = Date.now();

          // Step 3: Load FRESH changeRequests dari API
          isLoadingChangeRequests.value = true;
          await loadChangeRequests();
          isLoadingChangeRequests.value = false;

          console.log('[REMOUNT via NAVIGATION] ✅ Fresh changeRequests loaded, total:', changeRequests.value?.length || 0);

          // Step 4: Re-validate ALL tabs dengan changeRequests terbaru
          await tabManagement.forceUpdateAllTabsCache();

          // Step 5: Update tab management state
          await tabManagement.smartRefresh(true);
          await updateCanEditCurrentTab();

          // Step 6: Wait for Vue reactivity
          await nextTick();

          // Step 7: Dispatch remount event
          window.dispatchEvent(new CustomEvent('update-data-remounted', {
            detail: {
              reason: 'navigation_from_history',
              timestamp: Date.now(),
              activeTab: activeTab.value
            }
          }));

          lastRefreshTime.value = Date.now();

          console.log('[REMOUNT via NAVIGATION] ✅ Tab re-validation completed');
          console.log('[REMOUNT via NAVIGATION] Active tab:', activeTab.value, '| Can edit:', tabManagement.canEditTabCompletelySync(activeTab.value));
        } catch (error) {
          console.error('[REMOUNT via NAVIGATION] ❌ Error during navigation refresh:', error);
        }
      }, 300); // 300ms delay to ensure API has time to process
    }
    // Also handle any navigation TO update-data (not just from history)
    else if (newPath === '/update-data' && oldPath && oldPath !== newPath) {
      console.log('[NAVIGATION] Detected navigation to update-data from:', oldPath);

      const timeSinceLastRefresh = Date.now() - lastRefreshTime.value;
      // Only refresh if data is older than 15 seconds (reduced from 30)
      if (timeSinceLastRefresh > 15000) {
        console.log('[NAVIGATION] Stale data detected (age:', Math.floor(timeSinceLastRefresh/1000), 's) - refreshing');

        navigationRefreshTimeout = setTimeout(async () => {
          try {
            invalidateCache('navigation_stale_data');

            // Bump cache version
            cacheVersion.value = Date.now();

            await loadChangeRequestsWithLoading();
            await tabManagement.smartRefresh(true);
            await updateCanEditCurrentTab();

            lastRefreshTime.value = Date.now();
            console.log('[NAVIGATION] ✅ Stale data refresh completed');
          } catch (error) {
            console.error('[NAVIGATION] ❌ Error during stale data refresh:', error);
          }
        }, 200);
      } else {
        console.log('[NAVIGATION] Data is fresh (age:', Math.floor(timeSinceLastRefresh/1000), 's) - skipping refresh');
      }
    }
  }, { immediate: false });

  // Listen for navigation and visibility events
  window.addEventListener('popstate', handleNavigationChange);
  window.addEventListener('beforeunload', handleNavigationChange);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Smart auto-refresh system - only refresh when needed
  smartRefreshInterval = setInterval(() => {
    // Skip if we're currently in a reset operation
    if (personalData.isResetting.value) {
      return;
    }

    // Use smart refresh system with longer interval for background checks
    // Invalidate cache first
    invalidateCache('background_check');
    // Reload change requests with loading flag
    loadChangeRequestsWithLoading().catch(() => {});
    // Then refresh tab management
    tabManagement.smartRefresh('background_check');
    lastRefreshTime.value = Date.now();
  }, 300000); // Check every 5 minutes for background updates
});

// ✅ REMOUNT: Setup onActivated untuk re-check changeRequests setiap kali buka /update-data
onActivated(async () => {
  try {
    console.log('[REMOUNT] 🔄 /update-data dibuka - re-checking changeRequests...');

    // Step 1: Clear cache untuk force fresh check
    invalidateCache('page_activated');
    tabManagement.resetChangeRequestsCache();

    // Step 2: Bump cache version untuk force re-render
    cacheVersion.value = Date.now();

    // Step 3: Load FRESH changeRequests dari API
    isLoadingChangeRequests.value = true;
    console.log('[REMOUNT] 📡 Loading change requests...');
    await loadChangeRequests();
    console.log('[REMOUNT] ✅ Change requests loaded');
    isLoadingChangeRequests.value = false;

    console.log('[REMOUNT] ✅ Fresh changeRequests loaded, total:', changeRequests.value?.length || 0);

    // Step 4: Re-validate ALL tabs dengan changeRequests terbaru
    // Ini akan check apakah ada request (draft/waiting/need-revision) untuk setiap kategori
    await tabManagement.forceUpdateAllTabsCache();

    // Step 5: Update tab management state
    await tabManagement.smartRefresh(true);
    await updateCanEditCurrentTab();

    // Step 6: Dispatch remount event
    window.dispatchEvent(new CustomEvent('update-data-remounted', {
      detail: {
        reason: 'page_activated',
        timestamp: Date.now(),
        activeTab: activeTab.value
      }
    }));

    if (typeof lastRefreshTime !== 'undefined') {
      lastRefreshTime.value = Date.now();
    }

    console.log('[REMOUNT] ✅ Tab re-validation completed');
    console.log('[REMOUNT] Active tab:', activeTab.value, '| Can edit:', tabManagement.canEditTabCompletelySync(activeTab.value));
  } catch (error) {
    console.error('[REMOUNT] ❌ Error during remount refresh:', error);
  }
});

// Cleanup event listeners, interval, and timeout on unmount
onUnmounted(() => {
    // ✅ FIXED: Cleanup navigation refresh timeout to prevent memory leaks
    if (navigationRefreshTimeout) {
      clearTimeout(navigationRefreshTimeout);
      navigationRefreshTimeout = null;
    }

    // Cleanup performance optimizations
    try {
      if (cleanupConsolidatedWatcher) {
        cleanupConsolidatedWatcher();
      }
    } catch (error) {
    }

    // Enhanced cleanup with new event listeners (guard against undefined)
    try { window.removeEventListener('requestHistoryUpdated', handleRequestHistoryUpdated); } catch {}
    try { window.removeEventListener('requestDeleted', handleRequestDeleted); } catch {}
    try { window.removeEventListener('requestStatusChanged', handleRequestHistoryUpdated); } catch {}
    try { window.removeEventListener('draftDeleted', handleRequestDeleted); } catch {}
    try { window.removeEventListener('forceRefreshUpdateData', handleRequestHistoryUpdated); } catch {}
    window.removeEventListener('popstate', handleNavigationChange);
    window.removeEventListener('beforeunload', handleNavigationChange);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    clearInterval(smartRefreshInterval);

    // Clear cache invalidation timeout
    if (cacheInvalidationTimeout) {
      clearTimeout(cacheInvalidationTimeout);
      cacheInvalidationTimeout = null;
    }

  // Reset loading states on unmount
  isSavingDraft.value = false;
  isSubmittingUpdate.value = false;
});

// ✅ OPTIMIZED: Lightweight warning banner update
const debouncedReloadWarningBanner = debounce(async () => {
  try {
    // ✅ REMOVED: Heavy cache clearing and reloading operations
    // Now only update the current tab cache if needed
    await tabManagement.updateTabStatusCache(activeTab.value);
  } catch (error) {
    console.error('[Update-Data] ❌ Error reloading warning banner:', error);
  }
}, 100); // ✅ REDUCED: Debounce time from 500ms to 100ms for better responsiveness

// Watch for employeeData changes
watch(
  () => employeeData.value.professional_photo,
  (newPhotoUrl) => {
    // Professional photo changed
  }
);

// DEBUG: Watch for any changes in employeeData
watch(
  () => employeeData.value,
  (newData) => {
    // Skip if we're in the middle of a reset operation
    if (personalData.isResetting.value) {
      return;
    }

    if (editMode.value) {

      // Compare a few key fields
      const keyFields = ['name', 'main_phone_number', 'business_email', 'private_email'];
      keyFields.forEach(field => {
        if (newData && newData[field]) {
        }
      });
    }

    if (
      editMode.value &&
      originalData.value &&
      tabManagement.isTabEligible(activeTab.value)
    ) {
      saveChangesForTab("basic-information", originalData.value, newData);
    }
  },
  { deep: true }
);

watch(
  () => personalData.addressData.value, // 🔧 Use same reference as computed
  (newData) => {
    if (
      !personalData.isResetting.value &&
      editMode.value &&
      personalData.originalAddressData.value && // 🔧 Use same reference as computed
      tabManagement.isTabEligible(activeTab.value) &&
      activeTab.value === 'address' // Only trigger when actually on address tab
    ) {
      // Add additional check to prevent loops during data transformation
      if (hasObjectChanged(newData, personalData.originalAddressData.value)) {
        saveChangesForTab("address", personalData.originalAddressData.value, newData);
      }
    }
  },
  { deep: true }
);

watch(
  () => emergencyContactData.value,
  (newData) => {
    if (
      !personalData.isResetting.value &&
      editMode.value &&
      originalEmergencyContactData.value &&
      tabManagement.isTabEligible(activeTab.value)
    ) {
      saveChangesForTab(
        "emergency-contact",
        originalEmergencyContactData.value,
        newData
      );
    }
  },
  { deep: true }
);

watch(
  () => payrollAccountData.value,
  (newData) => {
    if (
      !personalData.isResetting.value &&
      editMode.value &&
      originalPayrollAccountData.value &&
      tabManagement.isTabEligible(activeTab.value)
    ) {
      saveChangesForTab(
        "payroll-account",
        originalPayrollAccountData.value,
        newData
      );
    }
  },
  { deep: true }
);

watch(
  () => familyData.value,
  (newData) => {
    if (
      !personalData.isResetting.value &&
      editMode.value &&
      originalFamilyData.value &&
      tabManagement.isTabEligible(activeTab.value)
    ) {
      saveChangesForTab("family", originalFamilyData.value, newData);
    }
  },
  { deep: true }
);

watch(
  () => educationData.value,
  (newData) => {
    if (
      !personalData.isResetting.value &&
      !personalData.isResetting.value &&
      editMode.value &&
      originalEducationData.value &&
      tabManagement.isTabEligible(activeTab.value)
    ) {
      saveChangesForTab("education", originalEducationData.value, newData);
    }
  },
  { deep: true }
);

watch(
  () => socialSecurityData.value,
  (newData) => {
    if (
      !personalData.isResetting.value &&
      editMode.value &&
      originalSocialSecurityData.value &&
      tabManagement.isTabEligible(activeTab.value)
    ) {
      saveChangesForTab(
        "social-security",
        originalSocialSecurityData.value,
        newData
      );
    }
  },
  { deep: true }
);

watch(
  () => medicalRecordData.value,
  (newData) => {
    if (
      !personalData.isResetting.value &&
      editMode.value &&
      originalMedicalRecordData.value &&
      tabManagement.isTabEligible(activeTab.value)
    ) {
      saveChangesForTab(
        "medical-record",
        originalMedicalRecordData.value,
        newData
      );
    }
  },
  { deep: true }
);

watch(
  () => employmentInfoData.value,
  (newData) => {
    if (
      !personalData.isResetting.value &&
      editMode.value &&
      originalEmploymentInfoData.value &&
      tabManagement.isTabEligible(activeTab.value)
    ) {
      saveChangesForTab(
        "employment-information",
        originalEmploymentInfoData.value,
        newData
      );
    }
  },
  { deep: true }
);

// REMOVED: Duplicate expensive mega watcher - functionality now handled by consolidatedState watcher above
// This eliminates 18+ reactive dependencies with deep watching that caused production crashes

// Add watcher for debugging hasChangesInCurrentTab
watch([
  () => hasChangesInCurrentTab.value,
  () => isCurrentTabFormValid.value,
  () => editMode.value,
], ([hasChanges, isValid, inEditMode]) => {
});

// Button state debugging removed - not needed for insert process

// Education data watcher removed - not needed for insert process

// Watch for tab changes to load data for each tab
watch(
  activeTab,
  async (newTab, oldTab) => {
    if (newTab !== oldTab) {
      // Set loading state for the new tab
      switch (newTab) {
        case "basic-information":
          isLoadingBasicInfo.value = true;
          try {
            await loadBasicInformation();
            // STABILITY: Longer delay to ensure all reactive updates complete
            await nextTick();
            setTimeout(async () => {
              await populateFormWithDraftData();
            }, 500); // Increased from 100ms to 500ms
          } catch (error) {
          } finally {
            isLoadingBasicInfo.value = false;
          }
          break;
        case "address":
          isLoadingAddress.value = true;
          try {
            await loadAddress();
            // STABILITY: Longer delay to ensure all reactive updates complete
            await nextTick();
            setTimeout(async () => {
              await populateFormWithDraftData();
            }, 500); // Increased from 100ms to 500ms
          } catch (error) {
          } finally {
            isLoadingAddress.value = false;
          }
          break;
        case "emergency-contact":
          isLoadingEmergencyContact.value = true;
          try {
            await loadEmergencyContact();
            // STABILITY: Longer delay to ensure all reactive updates complete
            await nextTick();
            setTimeout(async () => {
              await populateFormWithDraftData();
            }, 500); // Increased from 100ms to 500ms
          } catch (error) {
          } finally {
            isLoadingEmergencyContact.value = false;
          }
          break;
        case "payroll-account":
          isLoadingPayrollAccount.value = true;
          try {
            await loadPayrollAccount();
            // STABILITY: Longer delay to ensure all reactive updates complete
            await nextTick();
            setTimeout(async () => {
              await populateFormWithDraftData();
            }, 500); // Increased from 100ms to 500ms
          } catch (error) {
          } finally {
            isLoadingPayrollAccount.value = false;
          }
          break;
        case "family":
          isLoadingFamily.value = true;
          try {
            await loadFamily();
            // STABILITY: Longer delay to ensure all reactive updates complete
            await nextTick();
            setTimeout(async () => {
              await populateFormWithDraftData();
            }, 500); // Increased from 100ms to 500ms
          } catch (error) {
          } finally {
            isLoadingFamily.value = false;
          }
          break;
        case "education":
          isLoadingEducation.value = true;
          try {
            await loadEducation();
            // STABILITY: Longer delay to ensure all reactive updates complete
            await nextTick();
            setTimeout(async () => {
              await populateFormWithDraftData();
            }, 500); // Increased from 100ms to 500ms
          } catch (error) {
          } finally {
            isLoadingEducation.value = false;
          }
          break;
        case "social-security":
          isLoadingSocialSecurity.value = true;
          try {
            await loadSocialSecurity();
            // STABILITY: Longer delay to ensure all reactive updates complete
            await nextTick();
            setTimeout(async () => {
              await populateFormWithDraftData();
            }, 500); // Increased from 100ms to 500ms
          } catch (error) {
          } finally {
            isLoadingSocialSecurity.value = false;
          }
          break;
        case "medical-record":
          isLoadingMedicalRecord.value = true;
          try {
            await loadMedicalRecord();
            // STABILITY: Longer delay to ensure all reactive updates complete
            await nextTick();
            setTimeout(async () => {
              await populateFormWithDraftData();
            }, 500); // Increased from 100ms to 500ms
          } catch (error) {
          } finally {
            isLoadingMedicalRecord.value = false;
          }
          break;
        case "employment-information":
          isLoadingEmploymentInfo.value = true;
          try {
            await loadEmploymentInfo();
            // STABILITY: Longer delay to ensure all reactive updates complete
            await nextTick();
            setTimeout(async () => {
              await populateFormWithDraftData();
            }, 500); // Increased from 100ms to 500ms
          } catch (error) {
          } finally {
            isLoadingEmploymentInfo.value = false;
          }
          break;
        default:
          break;
      }
    }
  },
  { immediate: false }
);

// Route guard untuk mencegah navigasi jika ada unsaved changes
onBeforeRouteLeave((to, from, next) => {
  if (editMode.value && hasUnsavedChanges.value) {
    // Store navigation for later use
    pendingNavigation.value = next;

    // Show confirmation modal instead of browser alert
    isUnsavedChangesModalOpen.value = true;
  } else {
    // No unsaved changes or not in edit mode - allow navigation
    next();
  }
});

// Define page metadata
definePageMeta({
  layout: "update-data",
  middleware: 'rbac',
  permissions: ['update_data_personal']
});

// Add error boundary for dynamic import issues
onErrorCaptured((error, instance, info) => {
  console.error('Page error captured:', error, info);
  // Don't prevent the error from propagating
  return false;
});

// Debug function untuk melihat data yang berubah
const debugChangedFields = () => {

  // Get current data based on active tab
  let currentData = {};
  let originalData = {};

  switch (activeTab.value) {
    case 'basic-information':
      currentData = employeeData.value || {};
      originalData = originalData.value || {};
      break;
    case 'address':
      currentData = addressData.value || {};
      originalData = originalAddressData.value || {};
      break;
    case 'emergency-contact':
      currentData = emergencyContactData.value || [];
      originalData = originalEmergencyContactData.value || [];
      break;
    case 'payroll-account':
      currentData = payrollAccountData.value || {};
      originalData = originalPayrollAccountData.value || {};
      break;
    case 'family':
      currentData = familyData.value || [];
      originalData = originalFamilyData.value || [];
      break;
    case 'education':
      currentData = educationData.value || [];
      originalData = originalEducationData.value || [];
      break;
    case 'social-security':
      currentData = socialSecurityData.value || {};
      originalData = originalSocialSecurityData.value || {};
      break;
    case 'medical-record':
      currentData = medicalRecordData.value || {};
      originalData = originalMedicalRecordData.value || {};
      break;
    case 'employment-information':
      currentData = employmentInfoData.value || {};
      originalData = originalEmploymentInfoData.value || {};
      break;
  }

  // Get changed fields
  const changedFields = getChangedFieldsOnly();

};

// Validate basic information changes without attachments
const validateBasicInformationChangesWithoutAttachments = () => {
  // Only validate for basic-information tab
  if (activeTab.value !== 'basic-information') {
    return { isValid: true };
  }

  // Get changed fields only
  const changedData = getChangedFieldsOnly();

  // If no changes, validation passes
  if (!changedData.newData || Object.keys(changedData.newData).length === 0) {
    return { isValid: true };
  }

  // List of editable fields in basic information
  const editableFields = [
    'no_ktp', 'main_phone_number', 'private_email', 'secondary_phone_number',
    'birth_date', 'birth_place', 'gender_id', 'marital_status_id', 'religion_id',
    'nationality_id', 'clothing_size_id', 'passport_number'
  ];

  // Check if any editable fields have been changed
  const hasDataChanges = editableFields.some(field =>
    changedData.newData.hasOwnProperty(field) &&
    changedData.newData[field] !== null &&
    changedData.newData[field] !== undefined &&
    changedData.newData[field] !== ''
  );

  // If no data changes in editable fields, validation passes
  if (!hasDataChanges) {
    return { isValid: true };
  }

  // Check if user has uploaded KTP document
  const hasKTPFile = basicInfoUploadedFiles.value && basicInfoUploadedFiles.value.length > 0;

  // If user has data changes but no KTP document, validation fails
  if (hasDataChanges && !hasKTPFile) {
    return {
      isValid: false,
      message: "You must upload attachments minimal KTP document to save changes to basic information."
    };
  }

  return { isValid: true };
};

// Validate address changes without attachments (require at least one KTP doc when there are address changes)
const validateAddressChangesWithoutAttachments = () => {
  if (activeTab.value !== 'address') {
    return { isValid: true };
  }

  const changedData = getChangedFieldsOnly();
  const hasChanges = changedData.newData && Object.keys(changedData.newData).length > 0;

  if (!hasChanges) {
    return { isValid: true };
  }

  const hasKTPFile = Array.isArray(addressUploadedFiles.value) &&
    addressUploadedFiles.value.some(f => !!(f && (f.file || f.blob) && f.documentType === '3'));
  if (!hasKTPFile) {
    return {
      isValid: false,
      message: 'You must upload at least 1 KTP document to save address changes.'
    };
  }
  return { isValid: true };
};

const validatePayrollAccountChangesWithoutAttachments = () => {
  if (activeTab.value !== 'payroll-account') {
    return { isValid: true };
  }

  const changedData = getChangedFieldsOnly();
  const hasChanges = changedData.newData && Object.keys(changedData.newData).length > 0;

  if (!hasChanges) {
    return { isValid: true };
  }

  const hasNPWPFile = Array.isArray(payrollAccountUploadedFiles.value) &&
    payrollAccountUploadedFiles.value.some(f => !!(f && (f.file || f.blob) && f.documentType === '4'));
  const hasSavingBookFile = Array.isArray(payrollAccountUploadedFiles.value) &&
    payrollAccountUploadedFiles.value.some(f => !!(f && (f.file || f.blob) && f.documentType === '7'));

  if (!hasNPWPFile || !hasSavingBookFile) {
    return {
      isValid: false,
      message: 'You must upload both NPWP Document and Saving Book Document to save payroll account changes.'
    };
  }
  return { isValid: true };
};

const validateSocialSecurityChangesWithoutAttachments = () => {
  if (activeTab.value !== 'social-security') {
    return { isValid: true };
  }

  const changedData = getChangedFieldsOnly();
  const hasChanges = changedData.newData && Object.keys(changedData.newData).length > 0;

  if (!hasChanges) {
    return { isValid: true };
  }

  const hasTelkomedikaCard = Array.isArray(socialSecurityUploadedFiles.value) &&
    socialSecurityUploadedFiles.value.some(f => !!(f && (f.file || f.blob) && f.documentType === '5'));
  const hasBpjsCard = Array.isArray(socialSecurityUploadedFiles.value) &&
    socialSecurityUploadedFiles.value.some(f => !!(f && (f.file || f.blob) && f.documentType === '6'));

  if (!hasTelkomedikaCard || !hasBpjsCard) {
    return {
      isValid: false,
      message: 'You must upload both Telkomedika Card and BPJS Card photos to save social security changes.'
    };
  }
  return { isValid: true };
};

// Validate family attachments (require KK document when attempting to save)
const validateFamilyChangesWithoutAttachments = () => {
  if (activeTab.value !== 'family') {
    return { isValid: true };
  }

  // Consider any uploaded file in the multi-upload as satisfying the requirement here
  // (document type selection is locked in the Family section component)
  const hasKKFile = Array.isArray(familyUploadedFiles?.value)
    && familyUploadedFiles.value.some(f => !!(f && (f.file || f.blob)));

  if (!hasKKFile) {
    return {
      isValid: false,
      message: 'You must upload KK (Family Card) document to save family changes.'
    };
  }
  return { isValid: true };
};

// Refs to section components
const addressSectionRef = ref(null);
const payrollAccountSectionRef = ref(null);
const socialSecuritySectionRef = ref(null);

// Auto-scroll to document upload area
const scrollToDocumentUpload = () => {
  if (process.client) {
    // Use section ref methods for reliable scrolling
    setTimeout(() => {
      if (activeTab.value === 'address' && addressSectionRef.value?.scrollToUpload) {
        addressSectionRef.value.scrollToUpload();
      } else if (activeTab.value === 'payroll-account' && payrollAccountSectionRef.value?.scrollToUpload) {
        payrollAccountSectionRef.value.scrollToUpload();
      } else if (activeTab.value === 'social-security' && socialSecuritySectionRef.value?.scrollToUpload) {
        socialSecuritySectionRef.value.scrollToUpload();
      } else if (activeTab.value === 'family' && familySectionRef.value?.scrollToUpload) {
        familySectionRef.value.scrollToUpload();
      } else if (activeTab.value === 'basic-information') {
        // Basic info - fallback to DOM query
        const uploadSection = document.getElementById('basic-info-upload') ||
          basicInfoSectionRef.value?.$el?.querySelector('div[class*="border-dashed"]')?.parentElement;
        if (uploadSection) {
          uploadSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        // Generic fallback
        let uploadSection = null;

        // Generic fallback selectors
        if (!uploadSection) {
          uploadSection =
            // Try to find by file upload icon and title
            document.querySelector('.pi-file-upload')?.closest('div[class*="bg-white"]') ||
            // Try to find by file input
            document.querySelector('input[type="file"]')?.closest('div[class*="border-dashed"]')?.parentElement ||
            // Try to find by drag and drop area
            document.querySelector('div[class*="border-dashed"][class*="cursor-pointer"]')?.parentElement ||
            // Try to find section containing "Document Upload" text
            Array.from(document.querySelectorAll('*')).find(el => el.textContent?.includes('Document Upload'))?.closest('div[class*="bg-white"]') ||
            // Fallback: look for basic info section and scroll to bottom of it
            document.querySelector('[ref="basicInfoSectionRef"]') ||
            document.querySelector('div[class*="basic-information"]');
        }

        if (uploadSection) {
          uploadSection.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        } else {
          // Final fallback: scroll to bottom where upload sections usually are
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
          });
        }
      }
    }, 300); // Increased delay for better DOM readiness
  }
};

// Expose debug function to window for manual testing
</script>

<style scoped>
/* Focus Mode Styles */
:global(.focus-mode-active) {
  /* Hide navbar and sidebar when focus mode is active */
  --navbar-height: 0px;
  --sidebar-width: 0px;
}

:global(.focus-mode-active .navbar),
:global(.focus-mode-active .sidebar) {
  display: none !important;
}

:global(.focus-mode-active .main-content) {
  margin-left: 0 !important;
  margin-top: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
}

:global(.focus-mode-active .page-container) {
  padding: 1rem !important;
  max-width: 100% !important;
}
</style>
