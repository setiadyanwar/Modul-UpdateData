<template>
  <div>
    <!-- Loading State -->
    <EditPageSkeleton v-if="isLoadingDetail || isInitializing" />

    <!-- Error State -->
    <div v-else-if="error" class="mb-4">
      <UiAlert type="error" :message="error" />
    </div>

    <!-- Content -->
    <div v-else-if="!isLoadingDetail && !isInitializing">
      <!-- Header Component -->
      <EditPageHeader 
        :isLoadingDetail="isLoadingDetail"
        :isInitializing="isInitializing"
        :breadcrumbItems="breadcrumbItems"
        :displayRequestCode="displayRequestCode"
        :reviewerName="reviewerName"
        :requestDetail="requestDetail"
        :statusSteps="statusSteps"
        :isSubmitting="isSubmitting"
        :hasValidFormData="hasValidFormData"
        :hasDataChanges="hasDataChanges"
        :hasExistingAttachments="hasExistingAttachments"
        :hasUploadedFiles="hasUploadedFiles"
        :dynamicTabs="dynamicTabs"
        :activeTab="activeTab"
        :categoryLabel="categoryLabel"
        @open-change-history="openChangeHistory"
        @submit-direct="handleSubmitDirect"
        @save-as-draft="handleSaveAsDraft"
        @tab-change="handleTabChange"
        @scroll-to-upload="handleScrollToUpload"
      />

      <!-- Content Component -->
      <EditPageContent 
        :isSubmitting="isSubmitting"
        :requestDetail="requestDetail"
        :hasValidFormData="hasValidFormData"
        :activeTab="activeTab"
        :originalEmployeeData="originalEmployeeData"
        :formConfig="formConfig"
        :isUploading="isUploading"
        :addressData="addressData"
        :originalAddressData="originalAddressData"
        :currentFormComponent="currentFormComponent"
        :educationFormKey="educationFormKey"
        :dynamicFormData="dynamicFormData"
        :originalPayrollAccountData="originalPayrollAccountData"
        :originalSocialSecurityData="originalSocialSecurityData"
        :isEditDraftPage="isEditDraftPage"
        :isFieldVisible="isFieldVisible"
        :bloodTypeOptions="bloodTypeOptions"
        :healthStatusOptions="healthStatusOptions"
        :uploadedDocuments="uploadedDocuments"
        :multiDocumentUploadKey="multiDocumentUploadKey"
        :getMaxFiles="getMaxFiles"
        :shouldShowTypeSelector="shouldShowTypeSelector"
        :docTypeOptions="docTypeOptions"
        :shouldLockType="shouldLockType"
        :lockedTypeValue="lockedTypeValue"
        :getRequiredDocuments="getRequiredDocuments"
        :getDocumentUploadTitle="getDocumentUploadTitle"
        :getDocumentUploadSubtitle="getDocumentUploadSubtitle"
        :documentCount="documentCount"
        :getRequiredDocumentCount="getRequiredDocumentCount"
        :getSideEditPageCategory="getSideEditPageCategory"
        :documentSectionKey="documentSectionKey"
        :normalizeStatus="normalizeStatus"
        @open-change-history="openChangeHistory"
        @submit-direct="handleSubmitDirect"
        @save-as-draft="handleSaveAsDraft"
        @form-data-update="handleFormDataUpdate"
        @professional-photo-upload="handleProfessionalPhotoUpload"
        @insert-request="handleInsertRequest"
        @open-change-request-modal="handleOpenChangeRequestModal"
        @edit-request="handleEditRequest"
        @refresh-request-detail="handleRefreshRequestDetail"
        @pending-upload="handlePendingUpload"
        @files-changed="handleFilesChanged"
        @upload="handleUpload"
        @document-deleted="handleDocumentDeleted"
        @document-view="handleDocumentView"
        @document-count-changed="handleDocumentCountChanged"
      />

      <!-- Modals Component -->
      <EditPageModals 
        :isChangeHistoryOpen="isChangeHistoryOpen"
        :requestDetail="requestDetail"
        :isSubmitRevisionModalOpen="isSubmitRevisionModalOpen"
        :isChangeRequestModalOpen="isChangeRequestModalOpen"
        :activeTab="activeTab"
        :getRequestTypeFromTab="getRequestTypeFromTab"
        :modalDataForSubmit="modalDataForSubmit"
        :calculateChanges="calculateChanges"
        :getProfessionalPhotoFile="getProfessionalPhotoFile"
        :getChangeRequestModalData="getChangeRequestModalData"
        :isInsertRequestModalOpen="isInsertRequestModalOpen"
        :pendingInsertData="pendingInsertData"
        :isDocumentPreviewOpen="isDocumentPreviewOpen"
        :previewDocumentUrl="previewDocumentUrl"
        :previewDocumentName="previewDocumentName"
        :previewItemId="previewItemId"
        @close-change-history="closeChangeHistory"
        @close-submit-revision-modal="closeSubmitRevisionModal"
        @confirm-submit-revision="confirmSubmitRevision"
        @view-privacy="handleViewPrivacy"
        @close-change-request-modal="closeChangeRequestModal"
        @change-request="handleChangeRequest"
        @close-insert-request-modal="closeInsertRequestModal"
        @insert-request-success="handleInsertRequestSuccess"
        @close-document-preview="isDocumentPreviewOpen = false"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, toRaw, shallowRef, nextTick, unref } from "vue";
import { useRoute, navigateTo, createError } from "nuxt/app";

import { useHybridRequestHistory } from "~/composables/useHybridRequestHistory";
import { useToast } from "~/composables/useToast";
import { useApi } from "~/composables/useApi";
import { useAuth } from "#imports";
import { usePersonalData } from "~/composables/usePersonalData";
import { useMasterData } from "~/composables/useMasterData";
import { useAttachments } from "~/composables/useAttachments";
import { mapAddress, resolveAddress, resolveEmergency, resolveEducation, resolvePayroll, resolveSocial, resolveMedical, mapEmergencyArray, mapFamilyArray, mapPayroll, mapSocial } from "~/utils/dataResolver";

// Import extracted composables
import { 
  generateClientKey, 
  mapRequestTypeToTab, 
  enrichEducationDataWithLabels, 
  mapAttachmentsToEducationRecords,
  formatDate,
  getTabIcon,
  normalizeStatus,
  getRequestTypeFromTab
} from "~/composables/editpage/helpers/useEditPageHelpers";

import { 
  getStatusSteps,
  getBreadcrumbItems,
  formatCategoryName,
  getReviewerName,
  getReviewerAvatar,
  getLastUpdatedDate,
  getReviewNotesForNeedRevision,
  isNeedRevisionStatus
} from "~/composables/editpage/helpers/useStatusHelpers";

import {
  tabConfigs,
  getRequiredDocuments,
  getDocumentUploadTitle,
  getDocumentUploadSubtitle,
  getRequiredDocumentCount,
  getSideEditPageCategory
} from "~/composables/editpage/config/useEditPageTabConfig";

import {
  getDynamicTabs,
  getEditableFields,
  getFormConfig
} from "~/composables/editpage/config/useDynamicTabsConfig";

import {
  mapApiToFormFields,
  mapAddressFormToAPI
} from "~/composables/editpage/mappers/useFieldMappers";

// Function to enrich education data with labels for DocumentSection
const enrichEducationDataWithLabels = async (educationData) => {
  if (!Array.isArray(educationData) || educationData.length === 0) {
    return;
  }

  try {
    // Load master data for education
    const [levels, majors, institutions] = await Promise.all([
      getOptions('EDU_LEVELS'),
      getOptions('EDU_MAJORS'),
      getOptions('EDU_INSTITUTIONS')
    ]);

    // Enrich each education record with labels
    educationData.forEach((record, index) => {
      // Add level label
      if (record.edu_level_id && levels) {
        const levelData = levels.find(level => level.code == record.edu_level_id);
        if (levelData) {
          record.edu_level = levelData.value || levelData.label || levelData.name || `Level ${record.edu_level_id}`;
        }
      }

      // Add major label
      if (record.edu_major_id && majors) {
        const majorData = majors.find(major => major.code == record.edu_major_id);
        if (majorData) {
          record.edu_major = majorData.value || majorData.label || majorData.name || `Major ${record.edu_major_id}`;
        }
      }

      // Add institution label
      if (record.edu_institution_id && institutions) {
        const institutionData = institutions.find(institution => institution.code == record.edu_institution_id);
        if (institutionData) {
          record.edu_institution = institutionData.value || institutionData.label || institutionData.name || `Institution ${record.edu_institution_id}`;
        }
      }
    });
  } catch (error) {
    console.error('❌ Error enriching education data with labels:', error);
  }
};

// GLOBAL HELPER: Map request type to tab ID
const mapRequestTypeToTab = (type) => {
  const mapping = {
    BSC: 'basic-information',
    ADR: 'address',
    PYR: 'payroll-account',
    EMC: 'emergency-contact',
    EDC: 'education',
    SSI: 'social-security',
    MDR: 'medical-record',
    FMY: 'family'
  };
  return mapping[type] || 'basic-information'; // Default to basic-information if type not found
};

// Function to map attachments to education records by client_key
const mapAttachmentsToEducationRecords = (educationRecords, attachments) => {
  if (!Array.isArray(attachments) || attachments.length === 0) {
    return [];
  }

  // Map attachments by client_key to education records
  const result = educationRecords.map((record, index) => {
    const recordClientKey = record.client_key;

    if (!recordClientKey) {
      return null;
    }

    // Find attachment by matching client_key
    const attachment = attachments.find(att => att.client_key === recordClientKey);

    if (!attachment) {
      return null;
    }

    const mappedAttachment = {
      item_id: attachment.item_id,
      document_type: attachment.document_type,
      file_name: attachment.file_name,
      file_size: attachment.file_size,
      uploaded_date: attachment.uploaded_date,
      file_size_display: attachment.file_size_display,
      client_key: attachment.client_key,
      // Add preview and download URLs
      preview_url: `/employee/attachments/${attachment.item_id}/preview`,
      download_url: `/employee/attachments/${attachment.item_id}/download`,
      info_url: `/employee/attachments/${attachment.item_id}/information`,
    };
    return mappedAttachment;
  });
  return result;
};

// Main Edit Page Components
import EditPageHeader from "~/components/update-data/EditPage/main/EditPageHeader.vue";
import EditPageContent from "~/components/update-data/EditPage/main/EditPageContent.vue";
import EditPageSkeleton from "~/components/update-data/EditPage/skeleton/EditPageSkeleton.vue";
import EditPageModals from "~/components/update-data/EditPage/main/EditPageModals.vue";

// Other necessary imports for logic
import UiAlert from "~/components/ui/Alert.vue";

// Form Components (still needed for currentFormComponent)
import BasicInformationForm from "~/components/form/BasicInformationForm.vue";
import BasicInformationSkeleton from "~/components/form/BasicInformationSkeleton.vue";
import AddressForm from "~/components/form/AddressForm.vue";
import AddressSkeleton from "~/components/form/AddressSkeleton.vue";
import EmergencyContactForm from "~/components/form/EmergencyContactForm.vue";
import EmergencyContactSkeleton from "~/components/form/EmergencyContactSkeleton.vue";
import FamilyForm from "~/components/form/FamilyForm.vue";
import FamilySkeleton from "~/components/form/FamilySkeleton.vue";
import EducationForm from "~/components/form/EducationForm.vue";
import EducationSkeleton from "~/components/form/EducationSkeleton.vue";
import PayrollAccountForm from "~/components/form/PayrollAccountForm.vue";
import PayrollAccountSkeleton from "~/components/form/PayrollAccountSkeleton.vue";
import UpdateDataPayrollAccountSection from "~/components/update-data/sections/UpdateDataPayrollAccountSection.vue";
import SocialSecurityForm from "~/components/form/SocialSecurityForm.vue";
import UpdateDataSocialSecuritySection from "~/components/update-data/sections/UpdateDataSocialSecuritySection.vue";
import SocialSecuritySkeleton from "~/components/form/SocialSecuritySkeleton.vue";
import UpdateDataMedicalRecordSection from "~/components/update-data/sections/UpdateDataMedicalRecordSection.vue";
import MedicalRecordSkeleton from "~/components/form/MedicalRecordSkeleton.vue";

const route = useRoute();
const { success: toastSuccess, error: toastError, info: toastInfo, warning: toastWarning } = useToast();
const { user } = useAuth();
const { apiGet, apiPost } = useApi();
const { uploadAttachment } = useAttachments();

// Medical record dropdown options (loaded from master data)
const bloodTypeOptions = ref([]);
const healthStatusOptions = ref([]);

// Load master-data options for emp_health subcategories
const { getOptions } = useMasterData();
const loadMedicalMasterOptions = async () => {
  try {
    const [bloodTypes, healthStatuses] = await Promise.all([
      getOptions('EMP_HEALTH', 'blood_type'),
      getOptions('EMP_HEALTH', 'overall_status')
    ]);

    // Map so UI displays text and model uses text, but code contains ID
    bloodTypeOptions.value = (bloodTypes || []).map(o => ({
      label: o.label ?? o.value ?? String(o.code ?? ''),
      value: o.label ?? o.value ?? String(o.code ?? ''),
      code: String(o.code ?? o.value ?? '')
    }));
    healthStatusOptions.value = (healthStatuses || []).map(o => ({
      label: o.label ?? o.value ?? String(o.code ?? ''),
      value: o.label ?? o.value ?? String(o.code ?? ''),
      code: String(o.code ?? o.value ?? '')
    }));

  } catch (e) {
    bloodTypeOptions.value = [];
    healthStatusOptions.value = [];
  }
};

// Use composables
const { updateDraftData, updateDraftToWaitingApproval, getRequestById, normalizeCategory, loadRequests } = useHybridRequestHistory();

// Use personal data composable untuk memuat data API
const personalData = usePersonalData();
const {
  employeeData,
  addressData,
  emergencyContactData,
  payrollAccountData,
  familyData,
  educationData,
  socialSecurityData,
  medicalRecordData,
  // Original data for change tracking - fix mapping
  originalData: originalEmployeeData,
  originalAddressData,
  originalEmergencyContactData,
  originalPayrollAccountData,
  originalFamilyData,
  originalEducationData,
  originalSocialSecurityData,
  originalMedicalRecordData,
  // Load functions
  loadBasicInformation,
  loadAddress,
  loadEmergencyContact,
  loadPayrollAccount,
  loadFamily,
  loadEducation,
  loadSocialSecurity,
  loadMedicalRecord,
} = personalData;

// When false the page will load request detail from real API (/employee/change-request/{id})
// Set to false to allow loading drafts persisted in the backend so they can be edited.
const DEMO_MODE = false;

// Request ID with safety check
const requestId = computed(() => {
  try {
    return route?.params?.id || "";
  } catch (error) {
    return "";
  }
});

// State - Use shallowRef for complex objects to prevent deep reactivity issues
const isLoadingDetail = ref(false);
const isLoadingCategoryData = ref(false);
const isInitializing = ref(true); // Prevent form render before data ready
const requestDetail = shallowRef(null);
// Baseline data snapshot for need revision to enforce lock on original fields
const needRevisionBaseline = shallowRef(null);

// Track user-edited field keys to prevent background sync from overwriting
const editedFieldKeys = ref(new Set());

// Client key generator
const generateClientKey = () => {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
};

// Initialize global flags for form state management
window.isInitialLoad = true;
window.isDraftDataLoading = false;
const categoryData = shallowRef(null);
const activeTab = ref("");
const formData = shallowRef({});
const changeReason = ref("");

// Insert request modal properties
const isInsertRequestModalOpen = ref(false);
const pendingInsertData = ref(null);
const consent = ref(false);
const uploadedDocuments = ref([]);
const isUploading = ref(false);
const isChangeHistoryOpen = ref(false);
const documentCount = ref(0);
const professionalPhotoFile = ref(null);

// Refs for component remounting
const documentSectionRef = ref(null);
const multiDocumentUploadRef = ref(null);

// Ref for basic info component
const basicInfoRef = ref(null);
const editDataBasicInfoRef = ref(null);

// Keys for force remounting components
const documentSectionKey = ref(0);
const multiDocumentUploadKey = ref(0);

// Loading state for basic information
const isLoadingBasicInfo = ref(false);

// Flag to prevent duplicate loading
const basicInfoLoaded = ref(false);

// Pending uploads state
const pendingUploads = ref([]);
const currentFormRef = ref(null);
const educationFormKey = ref(0); // Key untuk force remount education form

// Modal data for draft submissions - to override default change detection
const modalDataForSubmit = ref({ data: null, changes: null });
const isSubmitRevisionModalOpen = ref(false);
const isChangeRequestModalOpen = ref(false);

// Watch modal state changes
watch(isChangeRequestModalOpen, (newValue, oldValue) => {
  // Modal state changed
}, { immediate: true });
const isSubmitting = ref(false);
const error = ref("");
const isDocumentPreviewOpen = ref(false)
const previewDocumentUrl = ref('')
const previewDocumentName = ref('')
const previewItemId = ref('')
const isUnsavedChangesModalOpen = ref(false);
const pendingNavigation = ref(null);

// Short-lived lock to avoid overwrites while user is typing
const lastUserEditAt = ref(0);
const USER_EDIT_GRACE_MS = 1200; // block background sync ~1.2s after typing
const isWithinUserEditWindow = () => Date.now() - lastUserEditAt.value < USER_EDIT_GRACE_MS;

// Display code coming from API (prefer `code` or `request_id`), fallback to route param requestId
const displayRequestCode = computed(() => {
  return requestDetail.value?.code || requestDetail.value?.request_id || requestId.value;
});

// Dynamic category label based on request type
const categoryLabel = computed(() => {
  if (!requestDetail.value) return 'Update Data';

  const requestType = requestDetail.value.request_type;
  const requestTypeLabel = requestDetail.value.request_type_label;

  // Use request_type_label if available (like "Family")
  if (requestTypeLabel) {
    return requestTypeLabel;
  }

  // Fallback mapping for request types
  const labelMapping = {
    'BSC': 'Basic Information',
    'ADR': 'Address',
    'EMC': 'Emergency Contact',
    'PYR': 'Payroll Account',
    'FMY': 'Family',
    'EDC': 'Education',
    'SSI': 'Benefit'
  };

  return labelMapping[requestType] || 'Update Data';
});

// Check if current request is in draft status
const isDraft = computed(() => {
  const statusInfo = normalizeStatus(requestDetail.value);
  return statusInfo.isDraft;
});

// Prevent recursive loading
const loadingFlags = ref({
  loadRequestDetail: false,
  loadCategoryData: false,
  tabChange: false
});

// Get category from URL query parameter with safety check
const urlCategory = computed(() => {
  try {
    return route?.query?.category || "";
  } catch (error) {
    return "";
  }
});

// Tab configurations
const tabConfigs = {
  "basic-information": {
    id: "basic-information",
    label: "Basic Information",
    icon: "pi-user",
    component: null, // Handled separately by EditDataBasicInformation
    skeleton: BasicInformationSkeleton,
  },
  address: {
    id: "address",
    label: "Address",
    icon: "pi-map-marker",
    component: null, // Handled separately by EditDataAddress/ReviseDataAddress
    skeleton: AddressSkeleton,
  },
  "emergency-contact": {
    id: "emergency-contact",
    label: "Emergency Contact",
    icon: "pi-phone",
    component: EmergencyContactForm,
    skeleton: EmergencyContactSkeleton,
  },
  family: {
    id: "family",
    label: "Family",
    icon: "pi-users",
    component: FamilyForm,
    skeleton: FamilySkeleton,
  },
  education: {
    id: "education",
    label: "Education",
    icon: "pi-book",
    component: EducationForm,
    skeleton: EducationSkeleton,
  },
  "payroll-account": {
    id: "payroll-account",
    label: "Payroll Account",
    icon: "pi-credit-card",
    component: UpdateDataPayrollAccountSection,
    skeleton: PayrollAccountSkeleton,
  },
  "social-security": {
    id: "social-security",
    label: "Benefit",
    icon: "pi-shield",
    component: UpdateDataSocialSecuritySection,
    skeleton: SocialSecuritySkeleton,
  },
  "medical-record": {
    id: "medical-record",
    label: "Medical Record",
    icon: "pi-heart",
    component: UpdateDataMedicalRecordSection,
    skeleton: MedicalRecordSkeleton,
  },
};

// Memoized computed properties with safer access
const breadcrumbItems = computed(() => {
  const items = [
    { label: "Dashboard", href: "/" },
    { label: "Update Data", href: "/update-data" },
    { label: "Request History", href: "/update-data/history" },
  ];

  if (requestDetail.value) {
    const status = requestDetail.value.status || 'draft';
    const category = requestDetail.value.request_type_label || requestDetail.value.update || requestDetail.value.category || 'Unknown';
    const currentRequestId = requestDetail.value.request_id || requestDetail.value.id || requestId.value;

    const formatCategory = (cat) => {
      if (!cat) return 'Unknown';

      // If it's already a formatted label from API (like "Basic Information"), return as is
      if (cat === 'Basic Information' || cat === 'Address' || cat === 'Emergency Contact' ||
        cat === 'Payroll Account' || cat === 'Family' || cat === 'Education' ||
        cat === 'Benefit' || cat === 'Medical Record' || cat === 'Employment Information') {
        return cat;
      }

      const categoryMap = {
        'basic-information': 'Basic Information',
        'BSC': 'Basic Information',
        'employment_info': 'Employment Information',
        'employment_information': 'Employment Information',
        'EMP': 'Employment Information',
        'emergency_contact': 'Emergency Contact',
        'emergency-contact': 'Emergency Contact',
        'EMC': 'Emergency Contact',
        'payroll_account': 'Payroll Account',
        'payroll-account': 'Payroll Account',
        'PYR': 'Payroll Account',
        'social_security': 'Benefit',
        'social-security': 'Benefit',
        'SSI': 'Benefit',
        'medical_record': 'Medical Record',
        'medical-record': 'Medical Record',
        'MDR': 'Medical Record',
        'data_employee': 'Employee Data',
        'address': 'Address',
        'ADR': 'Address',
        'family': 'Family',
        'FMY': 'Family',
        'education': 'Education',
        'EDC': 'Education'
      };

      return categoryMap[cat] || cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const formattedCategory = formatCategory(category);

    let editLabel = `Edit ${formattedCategory}`;
    if (status === 'draft') {
      editLabel = `Edit Draft - ${formattedCategory}`;
    } else if (status === 'rejected') {
      editLabel = `Revise Rejected - ${formattedCategory}`;
    } else if (status === 'waiting_approval') {
      editLabel = `Edit Pending - ${formattedCategory}`;
    }

    editLabel += ` (${currentRequestId})`;

    const finalItem = {
      label: editLabel,
      href: null,
      current: true
    };

    items.push(finalItem);
  } else {
    items.push({
      label: `Edit Request (${requestId.value})`,
      href: null,
      current: true
    });
  }

  return items;
});

// Simplified computed properties to prevent recursion
const reviewerName = computed(() => {
  // Priority: request_approver.name_approver (for Need Revision status)
  const approverName = requestDetail.value?.request_approver?.name_approver;
  if (approverName) return approverName;

  // Fallback to reviewer field
  const reviewer = requestDetail.value?.reviewer;
  if (!reviewer) return "System";
  if (typeof reviewer === "string") return reviewer;
  if (typeof reviewer === "object" && reviewer.name) return reviewer.name;
  return "System";
});

const reviewerAvatar = computed(() => {
  const reviewer = requestDetail.value?.reviewer;
  if (!reviewer) return "https://i.pravatar.cc/120?u=system";
  if (typeof reviewer === "object" && reviewer.avatar) return reviewer.avatar;
  if (typeof reviewer === "string") return `https://i.pravatar.cc/120?u=${reviewer}`;
  return "https://i.pravatar.cc/120?u=reviewer";
});

const lastUpdatedDate = computed(() => {
  const dateString = requestDetail.value?.date_change || requestDetail.value?.approved_at;
  return formatDate(dateString);
});

// Helper function to get appropriate icon for each tab category
const getTabIcon = (category) => {
  const iconMap = {
    'basic-information': 'pi-user',
    'address': 'pi-map-marker',
    'emergency-contact': 'pi-phone',
    'payroll-account': 'pi-credit-card',
    'family': 'pi-users',
    'education': 'pi-graduation-cap',
    'social-security': 'pi-shield',
    'medical-record': 'pi-heart'
  };

  return iconMap[category] || 'pi-circle';
};

const dynamicTabs = computed(() => {

  // Always ensure we have at least one tab
  if (!requestDetail.value) {
    // No requestDetail, return default tab
    return [{
      id: 'basic-information',
      label: 'Basic Information',
      icon: getTabIcon('basic-information')
    }];
  }

  // If we have categories, use them
  if (requestDetail.value.categories && requestDetail.value.categories.length > 0) {

    // Using categories from requestDetail
    const tabs = requestDetail.value.categories.map((category) => {
      const icon = getTabIcon(category);
      return {
        id: category,
        label: category
          .replace(/-/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        icon: icon,
        isActive: category === activeTab.value
      };
    });
    // Generated tabs computed
    return tabs;
  }

  // Fallback: generate tab based on request type or update
  const fallbackCategory = requestDetail.value.request_type ||
    requestDetail.value.update ||
    requestDetail.value.category ||
    'basic-information';

  // Using fallback category when categories missing

  // Map to kebab-case if needed
  const normalizedCategory = fallbackCategory
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/_/g, '-');

  const finalCategory = normalizedCategory === 'data-employee' ? 'basic-information' : normalizedCategory;
  const icon = getTabIcon(finalCategory);

  // Final category determined

  return [{
    id: finalCategory,
    label: finalCategory
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase()),
    icon: icon,
    isActive: finalCategory === activeTab.value
  }];
});

// Computed properties for validation
const hasDataChanges = computed(() => {
  // For need revision status, check if any editable fields have been changed
  const statusInfo = normalizeStatus(requestDetail.value);
  
  if (statusInfo.isNeedRevision) {
    // Check for changes based on the active tab
    const changes = calculateChanges(activeTab.value);
    return changes && Object.keys(changes).length > 0;
  }
  
  // For other statuses, always return true (assume changes exist if form is loaded)
  return true;
});

const hasExistingAttachments = computed(() => {
  // Check if there are existing documents in DocumentSection
  // The documentCount tracks documents loaded from the server

  // For payroll-account and social-security: check doc types (need 2 specific types)
  if (['payroll-account', 'social-security'].includes(activeTab.value)) {
    const existingDocs = requestDetail.value?.attachments || requestDetail.value?.documents || [];
    const existingDocTypes = existingDocs.map(doc => String(doc.document_type || doc.documentType));

    // For payroll-account: need both '4' (NPWP) and '7' (Buku Tabungan)
    // For social-security: need both '5' (BPJS) and '6' (Telkomedika)
    const requiredDocTypes = activeTab.value === 'payroll-account' ? ['4', '7'] : ['5', '6'];
    const hasAllRequired = requiredDocTypes.every(type => existingDocTypes.includes(type));

    console.log('🔍 Multi-doc category validation:', {
      category: activeTab.value,
      existingDocTypes,
      requiredDocTypes,
      hasAllRequired
    });

    return hasAllRequired;
  }

  // For other categories: simple count check
  return documentCount.value > 0;
});

const hasUploadedFiles = computed(() => {
  // Check if there are files uploaded via MultiDocumentUpload
  const hasMultiUploadFiles = (uploadedDocuments.value?.length || 0) > 0;

  // For education, check pending uploads in education records
  let hasEducationPendingUploads = false;
  if (activeTab.value === 'education') {
    const educationData = formData.value || dynamicFormData.value || [];
    if (Array.isArray(educationData)) {
      hasEducationPendingUploads = educationData.some(record => {
        return record.pendingUploads && record.pendingUploads.length > 0;
      });
    }
  }

  console.log('🔍 Debug hasUploadedFiles:', {
    uploadedDocuments: uploadedDocuments.value,
    multiUploadLength: uploadedDocuments.value?.length || 0,
    hasMultiUploadFiles,
    activeTab: activeTab.value,
    hasEducationPendingUploads,
    result: hasMultiUploadFiles || hasEducationPendingUploads
  });

  return hasMultiUploadFiles || hasEducationPendingUploads;
});

// Add watcher to debug attachment validation values
watch([hasExistingAttachments, hasUploadedFiles], ([hasExisting, hasUploaded]) => {
  console.log('🔍 Attachment validation watcher triggered:', {
    hasExistingAttachments: hasExisting,
    hasUploadedFiles: hasUploaded,
    documentCount: documentCount.value,
    uploadedDocumentsLength: uploadedDocuments.value?.length || 0
  });
}, { immediate: true });

// Computed property untuk menentukan form component yang sesuai dengan activeTab
const currentFormComponent = computed(() => {

  if (!activeTab.value) {
    return null;
  }

  const config = tabConfigs[activeTab.value];

  if (!config) {
    return null;
  }

  return config.component;
});

// Special computed property for payroll account that directly uses API data
const payrollAccountFormData = computed(() => {
  if (activeTab.value !== 'payroll-account' || !requestDetail.value) {
    return {};
  }

  const isNeedRevision = requestDetail.value.status === '3' ||
    requestDetail.value.status_raw === '3' ||
    requestDetail.value.status_label === 'Need Revision';

  if (isNeedRevision) {
    // For need revision, merge old_data with new_data
    const oldData = requestDetail.value.old_data || {};
    const newData = requestDetail.value.new_data?.data || {};
    // Debug: Check originalPayrollAccountData
    return { ...oldData, ...newData };
  }

  return {};
});

// Dynamic form data that prioritizes user changes (new_data) over original data
const dynamicFormData = computed(() => {
  try {
    if (!activeTab.value) {
      return {};
    }

    if (!requestDetail.value) {
      return {};
    }

    const currentStatus = requestDetail.value?.status;

    // Handle draft and rejected statuses
    // FIXED: Use normalize helper for consistent status detection
    const statusInfo = normalizeStatus(requestDetail.value);
    const isDraft = statusInfo.isDraft;
    const isRejected = statusInfo.isRejected;

    if (isDraft || isRejected) {
      // Get saved changes from request detail
      const newData = requestDetail.value?.new_data?.data; // User's saved changes
      const oldData = requestDetail.value?.old_data; // Not used as base anymore

      // PRIORITY 1: If user is actively editing, ALWAYS preserve their current data
      const currentTab = activeTab.value;
      const hasHydrated = currentTab && tabHydrated.value[currentTab] === true;
      const hasNonNullValues = formData.value && Object.values(formData.value).some((v) => v !== null && v !== '' && v !== undefined && !(Array.isArray(v) && v.length === 0));
      const isUserActivelyEditing = hasHydrated && !window.isInitialLoad && !window.isDraftDataLoading && hasNonNullValues;

      if (isUserActivelyEditing) {
        return formData.value;
      }

      // Handle array data (emergency-contact, family, education) differently
      const arrayTabs = ['emergency-contact', 'family', 'education'];

      if (arrayTabs.includes(activeTab.value)) {

        // For emergency contact, merge new_data with original data using resolver
        if (activeTab.value === 'emergency-contact') {

          console.log('🔍 [EMERGENCY CONTACT DEBUG] dynamicFormData resolver called', {
            formData: formData.value,
            newData,
            action: requestDetail.value?.new_data?.action,
            status: requestDetail.value?.status,
            requestDetail: requestDetail.value
          });

          // Priority 1: Use current formData if user has made changes
          if (formData.value && Array.isArray(formData.value) && formData.value.length > 0) {
            console.log('🔍 [EMERGENCY CONTACT DEBUG] Using formData:', formData.value);
            return formData.value;
          }

          // Priority 2: If we have new_data (user's draft/revision changes), show only edited contacts
          if (newData && Array.isArray(newData) && newData.length > 0) {

            // ✅ FIX: For action "insert" (new record), return new_data directly without filtering by id_contact
            if (requestDetail.value?.new_data?.action === 'insert') {
              console.log('🔍 [EMERGENCY CONTACT DEBUG] Action is INSERT, returning new_data:', newData);
              return newData.map(item => ({ ...item, _isEdited: true }));
            }

            // Get original data from composables - full emergency contact data
            const originalArrayData = originalEmergencyContactData.value || emergencyContactData.value || [];

            console.log('🔍 [EMERGENCY CONTACT DEBUG] Original array data:', originalArrayData);

            // CRITICAL: Wait for original data to load before showing merged data
            // This prevents showing empty state while data is loading
            if (originalArrayData.length === 0 && isLoadingCategoryData.value) {
              console.log('🔍 [EMERGENCY CONTACT DEBUG] Still loading, returning null');
              return null; // Return null to show loading skeleton instead of empty state
            }

            // Merge new_data with original data for edited contacts ONLY
            const mergedData = [];

            // Only add contacts that are in new_data (filter by id_contact)
            newData.forEach(newItem => {
              console.log('🔍 [EMERGENCY CONTACT DEBUG] Processing newItem:', newItem);
              if (newItem.id_contact) {
                // Find corresponding original data for this contact
                const originalItem = originalArrayData.find(orig => orig.id_contact === newItem.id_contact) || {};

                console.log('🔍 [EMERGENCY CONTACT DEBUG] Found original item:', originalItem);

                // Merge original data with new changes
                const mergedItem = {
                  ...originalItem,
                  ...newItem,
                  id_contact: newItem.id_contact,
                  _isEdited: true // Mark as edited for isFieldEditable logic
                };

                mergedData.push(mergedItem);
              } else {
                console.log('🔍 [EMERGENCY CONTACT DEBUG] ⚠️ No id_contact found in newItem, skipping');
              }
            });

            console.log('🔍 [EMERGENCY CONTACT DEBUG] Final mergedData:', mergedData);
            return mergedData;
          }

          // Priority 3: Try to get from requestDetail.old_data (original data for this request)
          if (requestDetail.value?.old_data) {
            const mappedData = mapEmergencyArray(requestDetail.value.old_data);
            console.log('🔍 [EMERGENCY CONTACT DEBUG] Mapped old_data:', mappedData);
            if (Array.isArray(mappedData) && mappedData.length > 0) {
              console.log('🔍 [EMERGENCY CONTACT DEBUG] Returning mapped old_data');
              return mappedData;
            }
          }

          // Priority 4: For edit page, show original data from composables
          if (originalEmergencyContactData.value && Array.isArray(originalEmergencyContactData.value)) {
            console.log('🔍 [EMERGENCY CONTACT DEBUG] Returning originalEmergencyContactData:', originalEmergencyContactData.value);
            return originalEmergencyContactData.value;
          }

          // Priority 5: Fallback to emergency contact data from composables
          if (emergencyContactData.value && Array.isArray(emergencyContactData.value)) {
            console.log('🔍 [EMERGENCY CONTACT DEBUG] Returning emergencyContactData:', emergencyContactData.value);
            return emergencyContactData.value;
          }

          // Priority 6: If still loading, return null to show skeleton
          if (isLoadingCategoryData.value) {
            console.log('🔍 [EMERGENCY CONTACT DEBUG] Still loading, returning null (skeleton)');
            return null;
          }

          // Priority 7: Fallback to empty array only if not loading
          console.log('🔍 [EMERGENCY CONTACT DEBUG] ⚠️ No data found, returning empty array');
          return [];
        }

        // For other array tabs, merge newData with original data using resolvers
        // Handle family data structure - it might be nested under 'family' property
        let processedNewData = newData;
        if (activeTab.value === 'family' && newData && !Array.isArray(newData)) {
          // Family data might be nested under 'family' property in newData
          processedNewData = newData.family || newData.family_members || newData;
        }

        if (processedNewData && Array.isArray(processedNewData)) {

          // Priority 1: Use current formData if user has made changes
          if (formData.value && Array.isArray(formData.value) && formData.value.length > 0) {
            // For array tabs in edit mode, filter to only show records that are being edited
            if (processedNewData && Array.isArray(processedNewData) && processedNewData.length > 0) {
              let editedRecordIds = new Set();

              // Get edited record IDs based on tab type
              if (activeTab.value === 'education') {
                editedRecordIds = new Set(processedNewData.map(item => item.id_education || item.id).filter(id => id));
              } else if (activeTab.value === 'family') {
                editedRecordIds = new Set(processedNewData.map(item => item.id_family || item.id).filter(id => id));
              }

              if (editedRecordIds.size > 0) {
                // Only return records that are being edited
                const filteredFormData = formData.value.filter(record => {
                  if (activeTab.value === 'education') {
                    return (record.id_education || record.id) && editedRecordIds.has(record.id_education || record.id);
                  } else if (activeTab.value === 'family') {
                    return (record.id_family || record.id) && editedRecordIds.has(record.id_family || record.id);
                  }
                  return false;
                });
                return filteredFormData;
              }
            }
            return formData.value;
          }

          // Priority 2: For education and family, only show edited records (like emergency contact)
          if (activeTab.value === 'education' || activeTab.value === 'family') {

            // For family and education with action "insert", just return the new_data directly
            if (requestDetail.value?.new_data?.action === 'insert') {
              return processedNewData;
            }

            // Get original data from composables - full data
            let originalArrayData = [];
            if (activeTab.value === 'education') {
              originalArrayData = originalEducationData.value || educationData.value || [];
            } else if (activeTab.value === 'family') {
              originalArrayData = originalFamilyData.value || familyData.value || [];
            }

            // For both draft and need revision, only show records that are being edited (have ID in new_data)
            const mergedData = [];

            processedNewData.forEach(newItem => {
              let recordId = null;
              if (activeTab.value === 'education') {
                recordId = newItem.id_education || newItem.id;
              } else if (activeTab.value === 'family') {
                recordId = newItem.id_family || newItem.id;
              }

              if (recordId) {
                // Find corresponding original data for this record
                const originalItem = originalArrayData.find(orig => {
                  if (activeTab.value === 'education') {
                    return (orig.id_education || orig.id) === recordId;
                  } else if (activeTab.value === 'family') {
                    return (orig.id_family || orig.id) === recordId;
                  }
                  return false;
                }) || {};

                // Merge original data with new changes
                const mergedItem = {
                  ...originalItem,
                  ...newItem,
                  _isEdited: true // Mark as edited for isFieldEditable logic
                };

                // Fix marital_status mapping for family
                if (activeTab.value === 'family' && mergedItem.marital_status_id !== null && mergedItem.marital_status_id !== undefined) {
                  const maritalStatusMap = {
                    '0': 'SINGLE',
                    '1': 'MARRIED',
                    '2': 'DIVORCED',
                    '3': 'WIDOWED'
                  };
                  mergedItem.marital_status = maritalStatusMap[String(mergedItem.marital_status_id)] || mergedItem.marital_status || '';
                }

                mergedData.push(mergedItem);
              }
            });

            return mergedData;
          }

          // For other array types or emergency contact, use existing logic
          // Get original data from composables
          let originalArrayData = [];
          switch (activeTab.value) {
            case 'family':
              originalArrayData = familyData.value || [];
              break;
            case 'education':
              originalArrayData = educationData.value || [];
              break;
            default:
              originalArrayData = [];
          }

          // Get old_data from request detail
          const oldData = requestDetail.value?.old_data || [];

          // Use appropriate resolver for merging
          let mergedData = processedNewData; // fallback

          if (activeTab.value === 'education') {
            mergedData = resolveEducation(originalArrayData, oldData, processedNewData);
          } else if (activeTab.value === 'emergency-contact') {
            mergedData = resolveEmergency(originalArrayData, oldData, processedNewData);
          } else if (activeTab.value === 'family') {
            mergedData = resolveFamily(originalArrayData, oldData, processedNewData);
          } else {
            // For other array types, merge manually or use processedNewData as is
            mergedData = processedNewData;
          }

          return mergedData;
        }

        // Special handling for family data that might not be an array
        if (activeTab.value === 'family' && newData && !Array.isArray(newData)) {

          // Try to extract family data from different possible structures
          let familyArray = [];
          if (newData.family && Array.isArray(newData.family)) {
            familyArray = newData.family;
          } else if (newData.family_members && Array.isArray(newData.family_members)) {
            familyArray = newData.family_members;
          } else if (Array.isArray(newData)) {
            familyArray = newData;
          } else {
            // If it's a single family member object, wrap it in an array
            familyArray = [newData];
          }

          if (familyArray.length > 0) {
            // Get original data from composables
            const originalArrayData = originalFamilyData.value || familyData.value || [];

            // Use resolveFamily to merge the data
            const mergedData = resolveFamily(originalArrayData, requestDetail.value?.old_data?.family || [], familyArray);
            return mergedData;
          }
        }

        // Fallback: For edit page, only show data that was originally in the request
        // Don't show all original data - only show what was being edited
        if (requestDetail.value?.old_data) {
          let oldDataArray = [];
          switch (activeTab.value) {
            case 'family':
              oldDataArray = requestDetail.value.old_data.family || [];
              break;
            case 'education':
              oldDataArray = requestDetail.value.old_data.education || [];
              break;
            case 'emergency-contact':
              oldDataArray = requestDetail.value.old_data.emergency_contact || [];
              break;
          }

          if (Array.isArray(oldDataArray) && oldDataArray.length > 0) {

            // Map the data appropriately
            if (activeTab.value === 'emergency-contact') {
              return mapEmergencyArray(oldDataArray);
            } else if (activeTab.value === 'family') {
              return mapFamilyArray(oldDataArray);
            } else if (activeTab.value === 'education') {
              return mapEducationArray(oldDataArray);
            }
          }
        }

        // Final fallback - return empty array for edit page
        return [];
      }

      // For object data (non-array tabs): merge newData over original data
      // Step 1: Get original data as base
      let originalData = {};
      switch (activeTab.value) {
        case 'basic-information':
          // For basic-information, prioritize originalEmployeeData if available
          originalData = originalEmployeeData.value && Object.keys(originalEmployeeData.value).length > 0
            ? originalEmployeeData.value
            : (employeeData.value || {});
          break;
        case 'address':
          originalData = originalAddressData.value || {};
          break;
        case 'payroll-account':
          // For need revision, don't merge here - let the custom logic handle it
          if (formConfig.value?.isNeedRevision) {
            // Use empty object to avoid premature merge
            originalData = {};
          } else {
            // For non-need revision (draft/etc), merge old_data and new_data normally
            const oldData = requestDetail.value?.old_data || {};
            const newData = requestDetail.value?.new_data?.data || {};
            // Always merge: new_data takes priority over old_data
            originalData = { ...oldData, ...newData };
          }
          break;
        case 'social-security':
          originalData = socialSecurityData.value || {};
          break;
        case 'medical-record':
          originalData = medicalRecordData.value || {};
          break;
        default:
          originalData = {};
      }

      // Step 2: Start with original data as foundation
      let finalData = { ...originalData };

      // Skip further processing for payroll-account in need revision
      // because it has custom merge logic later
      if (activeTab.value === 'payroll-account' && formConfig.value?.isNeedRevision) {
        // Don't set finalData here - let custom merge logic handle it
        finalData = {};
      }

      // CRITICAL FIX: Check if original data is mostly empty for ANY tab (not just address)
      const originalDataHasContent = Array.isArray(originalData)
        ? originalData.length > 0
        : Object.keys(originalData).some(key => {
          const value = originalData[key];
          return value && value !== "" && value !== null && value !== undefined;
        });

      // If original data is empty, we need to ensure we have a proper foundation for the form
      if (!originalDataHasContent) {

        if (activeTab.value === 'address') {

          // ENHANCED FIX: Try to get address data from alternative sources
          // 1. Check if we have originalAddressData that might have been loaded
          let alternativeOriginalData = {};
          if (originalAddressData.value && Object.keys(originalAddressData.value).length > 0) {
            const hasContent = Object.keys(originalAddressData.value).some(key => {
              const value = originalAddressData.value[key];
              return value && value !== "" && value !== null && value !== undefined;
            });

            if (hasContent) {
              alternativeOriginalData = { ...originalAddressData.value };
            }
          }

          // 2. Check if we have address data in the requestDetail.old_data
          if (Object.keys(alternativeOriginalData).length === 0 && requestDetail.value?.old_data) {
            const oldData = requestDetail.value.old_data;

            // Look for address fields in old_data
            const addressFieldsInOldData = {};
            Object.keys(oldData).forEach(key => {
              if (key.includes('address') || key.includes('ktp') || key.includes('domicile')) {
                addressFieldsInOldData[key] = oldData[key];
              }
            });

            if (Object.keys(addressFieldsInOldData).length > 0) {
              alternativeOriginalData = { ...addressFieldsInOldData };
            }
          }

          // Initialize all expected address fields with empty values as foundation
          const addressFieldDefaults = {
            official_address_detail: "",
            official_address_province: "",
            official_address_city: "",
            official_address_postal_code: "",
            official_address_subdistrict: "",
            official_address_administrative_village: "",
            official_address_rt: "",
            official_address_rw: "",
            official_address_street: "",
            official_address_phone: "",
            domicile_address_detail: "",
            domicile_address_province: "",
            domicile_address_city: "",
            domicile_address_postal_code: "",
            domicile_address_subdistrict: "",
            domicile_address_administrative_village: "",
            domicile_address_rt: "",
            domicile_address_rw: "",
            domicile_address_street: "",
            domicile_address_phone: ""
          };

          // Build final foundation: defaults + any available original data + any alternative sources
          finalData = { ...addressFieldDefaults, ...originalData, ...alternativeOriginalData };

        } else if (activeTab.value === 'basic-information') {
          // Handle basic-information when original data is empty

          let alternativeOriginalData = {};

          // Try multiple sources for basic information data
          const dataSources = [
            originalEmployeeData.value,
            employeeData.value,
            requestDetail.value?.old_data
          ];

          for (const source of dataSources) {
            if (source && Object.keys(source).length > 0) {
              const hasContent = Object.keys(source).some(key => {
                const value = source[key];
                return value && value !== "" && value !== null && value !== undefined;
              });

              if (hasContent) {
                alternativeOriginalData = { ...source };
                break; // Use the first valid source
              }
            }
          }

          // Apply alternative data if found
          if (Object.keys(alternativeOriginalData).length > 0) {
            finalData = { ...finalData, ...alternativeOriginalData };
          } else {
            // FIXED: Only load basic information if activeTab is actually basic-information
            if (activeTab.value === 'basic-information' && !isLoadingBasicInfo.value && !basicInfoLoaded.value) {
              isLoadingBasicInfo.value = true;
              loadBasicInformation().finally(() => {
                isLoadingBasicInfo.value = false;
                basicInfoLoaded.value = true;
              });
            }
          }

        } else if (['payroll-account', 'social-security', 'medical-record'].includes(activeTab.value)) {
          // Handle other object-based tabs when original data is empty

          let alternativeOriginalData = {};
          let originalDataSource;

          switch (activeTab.value) {
            case 'payroll-account':
              originalDataSource = originalPayrollAccountData.value;
              break;
            case 'social-security':
              originalDataSource = originalSocialSecurityData.value;
              break;
            case 'medical-record':
              originalDataSource = originalMedicalRecordData.value;
              break;
          }

          if (originalDataSource && Object.keys(originalDataSource).length > 0) {
            const hasContent = Object.keys(originalDataSource).some(key => {
              const value = originalDataSource[key];
              return value && value !== "" && value !== null && value !== undefined;
            });

            if (hasContent) {
              alternativeOriginalData = { ...originalDataSource };
            }
          }

          // Apply alternative data if found
          if (Object.keys(alternativeOriginalData).length > 0) {
            finalData = { ...finalData, ...alternativeOriginalData };
          }
        }
      }

      // Step 3: Apply user changes (new_data) over original data - HIGHEST PRIORITY
      if (newData && typeof newData === 'object' && !Array.isArray(newData)) {

        if (activeTab.value === 'basic-information') {
          // For need revision, merge original data with new_data (same as draft)
          const isNeedRevision = requestDetail.value?.status === '3' ||
                                requestDetail.value?.status === 3 ||
                                (requestDetail.value?.status_label && requestDetail.value.status_label.toLowerCase().includes('revision'));

          if (isNeedRevision) {
            // For need revision: start with original data, then apply new_data changes
            // This ensures all fields are shown (not just edited fields)
            const oldData = requestDetail.value?.old_data || {};

            // Apply field mapping for old_data first
            Object.keys(oldData).forEach(apiField => {
              let formField = apiField;
              if (apiField === 'phone') formField = 'main_phone_number';
              finalData[formField] = oldData[apiField];
            });
          }

          // Apply field mapping for new_data (override or add)
          Object.keys(newData).forEach(apiField => {
            let formField = apiField;

            // Map specific API fields to form fields
            if (apiField === 'phone') formField = 'main_phone_number';
            // Removed id_number_ktp mapping - now using no_ktp directly

            finalData[formField] = newData[apiField];
          });
        } else if (activeTab.value === 'address') {
          // Address data handling using resolver util (stable)
          const employeeBase = addressData.value || {};
          const oldFlat = requestDetail.value?.old_data || {};
          const newFlat = newData || {};
          finalData = resolveAddress(employeeBase, oldFlat, newFlat);

          // Data validation logging

          // DETAILED DEBUG: Show merged result for key fields

          // Count non-empty fields to verify we have original data
          const nonEmptyFields = Object.keys(finalData).filter(key => {
            const value = finalData[key];
            return value !== "" && value !== null && value !== undefined;
          });

        } else if (activeTab.value === 'payroll-account') {
          // For need revision: Create custom merge logic based on edit status
          const originalBase = originalPayrollAccountData.value || payrollAccountData.value || {};
          const oldData = requestDetail.value?.old_data || {};
          const newDataFromRequest = requestDetail.value?.new_data?.data || {};
          // Debug specific values
          // For need revision, use custom logic instead of resolvePayroll
          if (formConfig.value?.isNeedRevision && formConfig.value?.editableFields) {
            // Start with ONLY original data as base (no oldData from request)
            const baseData = mapPayroll(originalBase || {});
            finalData = { ...baseData };
            // Only override with new data for editable fields
            const editableFieldsSet = formConfig.value.editableFields;
            if (editableFieldsSet && typeof editableFieldsSet.has === 'function') {
              Object.keys(newDataFromRequest).forEach(field => {
                const isFieldEditable = editableFieldsSet.has(field);
                if (isFieldEditable) {
                  const beforeValue = finalData[field];
                  finalData[field] = newDataFromRequest[field];
                } else {
                }
              });
            } else {
            }
          } else {
            // Use normal resolve for non-need-revision cases
            finalData = resolvePayroll(originalBase, oldData, newDataFromRequest);
          }
          // Debug: Log specific fields that should be editable
          // Debug: Verify finalData contains correct values
          // Debug: Log the complete finalData object
        } else {
          // Other tabs: use stable resolvers where applicable
          if (activeTab.value === 'emergency-contact') {
            const baseArr = emergencyContactData.value || [];
            const oldArr = requestDetail.value?.old_data || [];
            const newArr = Array.isArray(newData) ? newData : [];
            finalData = resolveEmergency(baseArr, oldArr, newArr);
          } else if (activeTab.value === 'education') {
            // For education, we need to ensure we have original data
            let baseArr = originalEducationData.value || educationData.value || [];

            // If no original data, try to get from old_data
            if (baseArr.length === 0) {
              const oldDataEducation = requestDetail.value?.old_data?.education || [];
              if (oldDataEducation.length > 0) {
                baseArr = oldDataEducation;
              } else {
                // Try old_data directly
                const oldDataDirect = requestDetail.value?.old_data || [];
                if (Array.isArray(oldDataDirect) && oldDataDirect.length > 0) {
                  baseArr = oldDataDirect;
                }
              }
            }

            const oldArr = requestDetail.value?.old_data || [];
            const newArr = Array.isArray(newData) ? newData : [];

            const resolvedArr = resolveEducation(baseArr, oldArr, newArr);

            // Map attachments to education records by client_key
            const mappedAttachments = mapAttachmentsToEducationRecords(resolvedArr || [], requestDetail.value?.attachments || []);
            // EducationForm expects education_records structure
            finalData = {
              education_records: (resolvedArr || []).map((rec, index) => {
                // Generate client key for each record if not present
                const clientKey = rec.client_key || generateClientKey();

                // Find matching attachment by client_key
                const matchingAttachment = mappedAttachments.find(att => att && att.client_key === clientKey);

                return {
                  id_education: rec.id_education || rec.id,
                  edu_level_id: rec.edu_level_id || '', // Use ID, not label
                  edu_level: rec.edu_level || '',
                  edu_major_id: rec.edu_major_id || '', // Use ID, not label
                  edu_major: rec.edu_major || '',
                  edu_institution_id: rec.edu_institution_id || '', // Use ID, not label
                  edu_institution: rec.edu_institution || '',
                  edu_start_date: rec.edu_start_date || null,
                  edu_end_date: rec.edu_end_date || null,
                  attachment: matchingAttachment || null,
                  status: rec.status !== undefined ? rec.status : 1,
                  // Generate client key for each record
                  client_key: clientKey,
                };
              })
            };
          } else if (activeTab.value === 'family') {
            const baseArr = familyData.value || [];
            const oldArr = requestDetail.value?.old_data || [];
            const newArr = Array.isArray(newData) ? newData : [];
            finalData = resolveFamily(baseArr, oldArr, newArr);
          } else if (activeTab.value === 'payroll-account') {
            // Payroll account data is already handled in Step 3 above
            // No need to process again here to avoid overriding the correct data
          } else if (activeTab.value === 'social-security') {
            // Use originalSocialSecurityData as base for proper comparison
            const base = originalSocialSecurityData.value || socialSecurityData.value || {};
            const oldObj = requestDetail.value?.old_data || {};

            // For social-security, manually merge to ensure proper order: base -> oldData -> newData
            const baseMapped = mapSocial(base);
            const oldMapped = mapSocial(oldObj);
            const newMapped = mapSocial(newData || {});

            // Check if user is actively editing - if so, preserve current formData for edited fields
            const isUserEditing = editedFieldKeys.value.size > 0 && isWithinUserEditWindow();
            const currentFormData = formData.value || {};

            // Merge in correct order: base -> oldData -> newData, but preserve user edits
            let merged = { ...baseMapped };
            Object.keys(oldMapped).forEach(key => {
              const value = oldMapped[key];
              // Skip if user is actively editing this field
              if (isUserEditing && editedFieldKeys.value.has(key) && currentFormData[key] !== undefined) {
                merged[key] = currentFormData[key];
              } else if (value !== null && value !== undefined && value !== '') {
                merged[key] = value;
              }
            });
            Object.keys(newMapped).forEach(key => {
              const value = newMapped[key];
              // Skip if user is actively editing this field
              if (isUserEditing && editedFieldKeys.value.has(key) && currentFormData[key] !== undefined) {
                merged[key] = currentFormData[key];
              } else if (value !== null && value !== undefined && value !== '') {
                merged[key] = value;
              }
            });

            finalData = merged;
          } else if (activeTab.value === 'medical-record') {
            const base = medicalRecordData.value || {};
            const oldObj = requestDetail.value?.old_data || {};

            // Debug: Check if newData has the expected fields
            if (newData && typeof newData === 'object') {
              // Normalize health status from id -> label when only id is provided
              try {
                const hsId = newData.health_status_id || newData.overall_status || newData.overall_status_id;
                if (!newData.health_status && hsId != null) {
                  const hsOpt = (healthStatusOptions.value || []).find(o => String(o.code) === String(hsId));
                  if (hsOpt && hsOpt.value) {
                    newData.health_status = hsOpt.value;
                  }
                }
              } catch (e) {
              }
              // Optionally normalize blood type id -> label if API sends id
              try {
                const btId = newData.blood_type_id;
                if (!newData.blood_type && btId != null) {
                  const btOpt = (bloodTypeOptions.value || []).find(o => String(o.code) === String(btId) || String(o.value) === String(btId) || String(o.label) === String(btId));
                  if (btOpt && btOpt.value) {
                    newData.blood_type = btOpt.value;
                  }
                }
              } catch (e) {
              }
            }

            finalData = resolveMedical(base, oldObj, newData || {});

            // Ensure ID fields exist for selects (component expects *_id)
            try {
              // Health Status ID
              if (!finalData.health_status_id) {
                // Prefer new_data id if available
                if (newData && (newData.health_status_id || newData.overall_status || newData.overall_status_id)) {
                  const rawHsId = newData.health_status_id || newData.overall_status || newData.overall_status_id;
                  finalData.health_status_id = String(rawHsId);
                } else if (finalData.health_status) {
                  // Map from label -> id using loaded options
                  const hsMatch = (healthStatusOptions.value || []).find(o => String(o.value) === String(finalData.health_status));
                  if (hsMatch) finalData.health_status_id = String(hsMatch.code);
                }
              }

              // Blood Type ID
              if (!finalData.blood_type_id) {
                if (newData && newData.blood_type_id) {
                  finalData.blood_type_id = String(newData.blood_type_id);
                } else if (finalData.blood_type) {
                  const btMatch = (bloodTypeOptions.value || []).find(o => String(o.value) === String(finalData.blood_type));
                  if (btMatch) finalData.blood_type_id = String(btMatch.code);
                }
              }
            } catch (e) {
            }
          } else {
            // default merge
            Object.keys(newData).forEach(key => {
              finalData[key] = newData[key];
            });
          }
        }

      } else {
      }

      if (activeTab.value === 'address') {
      } else if (activeTab.value === 'medical-record') {
      }

      // Mark as initial load complete
      setTimeout(() => {
        window.isInitialLoad = false;
      }, 1000);

      // CRITICAL DEBUG: Log finalData before returning for payroll-account
      if (activeTab.value === 'payroll-account') {
      }

      return finalData;
    }

    // For other statuses, use current formData if available
    const fallbackData = formData.value || {};

    // CRITICAL DEBUG: Log when using fallback for payroll-account
    if (activeTab.value === 'payroll-account') {
    }

    return fallbackData;
  } catch (error) {
    return {};
  }
});

// Change tracking: Compare current form data with original data
const changedFields = computed(() => {
  if (!activeTab.value) return {};

  const currentData = formData.value || {};
  let originalData = {};

  // Get original data based on active tab
  switch (activeTab.value) {
    case 'basic-information':
      originalData = originalEmployeeData.value || {};
      break;
    case 'address':
      originalData = originalAddressData.value || {};
      break;
    case 'emergency-contact':
      originalData = originalEmergencyContactData.value || [];
      break;
    case 'payroll-account':
      originalData = originalPayrollAccountData.value || {};
      break;
    case 'family':
      originalData = originalFamilyData.value || [];
      break;
    case 'education':
      originalData = originalEducationData.value || [];
      break;
    case 'social-security':
      originalData = originalSocialSecurityData.value || {};
      break;
    case 'medical-record':
      originalData = originalMedicalRecordData.value || {};
      break;
  }

  const changes = {};

  if (Array.isArray(currentData)) {
    // For array data (emergency-contact, family, education), compare item by item
    // Only send items that have actually changed
    if (JSON.stringify(currentData) !== JSON.stringify(originalData)) {
      const changedItems = [];

      // For emergency contact, identify which specific items changed
      if (activeTab.value === 'emergency-contact') {
        // Find max length to handle both arrays properly
        const maxLength = Math.max(currentData.length, originalData.length);

        for (let index = 0; index < maxLength; index++) {
          const currentItem = currentData[index] || {};
          const originalItem = originalData[index] || {};

          // Skip if both items are empty
          if (Object.keys(currentItem).length === 0 && Object.keys(originalItem).length === 0) {
            continue;
          }

          // Compare each item field by field with normalized values
          let isChanged = false;
          const fieldsToCompare = ['emgc_name', 'emgc_number', 'emgc_relationship_id', 'emgc_address', 'status'];

          for (const field of fieldsToCompare) {
            const currentValue = currentItem[field];
            const originalValue = originalItem[field];

            // Normalize values for comparison
            const currentNormalized = currentValue === null || currentValue === undefined ? '' : String(currentValue);
            const originalNormalized = originalValue === null || originalValue === undefined ? '' : String(originalValue);

            if (currentNormalized !== originalNormalized) {
              isChanged = true;
              break;
            }
          }

          if (isChanged) {
            // Only include the changed fields (not all fields)
            const changedItem = {
              status: currentItem.status !== undefined ? currentItem.status : 1
            };

            // Include id_contact for existing items to enable updates
            if (currentItem.id_contact) {
              changedItem.id_contact = currentItem.id_contact;
            }

            // Only add fields that actually changed
            for (const field of fieldsToCompare) {
              if (field === 'status') continue; // Already added above

              const currentValue = currentItem[field];
              const originalValue = originalItem[field];
              const currentNormalized = currentValue === null || currentValue === undefined ? '' : String(currentValue);
              const originalNormalized = originalValue === null || originalValue === undefined ? '' : String(originalValue);

              if (currentNormalized !== originalNormalized) {
                changedItem[field] = currentValue;
              }
            }

            changedItems.push(changedItem);
          }
        }

        // Only send if there are actually changed items
        if (changedItems.length > 0) {
          changes[activeTab.value.replace('-', '_')] = changedItems;
        }
      } else if (activeTab.value === 'family') {
        // For family, only send changed items for need revision status
        const changedItems = [];

        if (Array.isArray(currentData) && currentData.length > 0) {
          currentData.forEach((currentItem, index) => {
            if (!currentItem || !currentItem.id_family) {
              return;
            }

            // Find corresponding original item
            const originalItem = originalData.find(orig => orig.id_family === currentItem.id_family) || {};

            // Check if any field has changed
            let isChanged = false;
            const changedItem = {
              status: currentItem.status !== undefined ? currentItem.status : 1
            };

            // Check each field that could be changed (use correct field names)
            const fieldsToCheck = ['name', 'birth_date', 'birth_place', 'address', 'occupation_id', 'relation_id', 'marital_status_id', 'gender_id', 'kk_doc'];

            fieldsToCheck.forEach(field => {
              const currentValue = currentItem[field];
              // For relation_id, check both relation_id and relation in original
              let originalValue = originalItem[field];
              if (field === 'relation_id' && !originalValue) {
                originalValue = originalItem['relation']; // Fallback to 'relation' field
              }

              // Normalize values for comparison
              const currentNormalized = currentValue === null || currentValue === undefined ? '' : String(currentValue);
              const originalNormalized = originalValue === null || originalValue === undefined ? '' : String(originalValue);

              if (currentNormalized !== originalNormalized) {
                isChanged = true;

                // Convert ID fields to number for API compatibility
                if (field === 'occupation_id' || field === 'relation_id' || field === 'marital_status_id' || field === 'gender_id') {
                  // Use != null to allow 0 values (e.g., marital_status_id: 0 for SINGLE)
                  changedItem[field] = currentValue != null ? Number(currentValue) : null;
                } else {
                  changedItem[field] = currentValue;
                }
              }
            });

            if (isChanged) {
              // Include id_family for existing items to enable updates
              changedItem.id_family = currentItem.id_family;
              changedItems.push(changedItem);
            }
          });
        }

        // Only send if there are actually changed items
        if (changedItems.length > 0) {
          changes[activeTab.value.replace('-', '_')] = changedItems;
        }
      } else {
        // For other array types (education), send entire array for now
        // FIXED: Ensure data is always an array for array-based tabs
        const arrayData = Array.isArray(currentData) ? currentData : [];
        changes[activeTab.value.replace('-', '_')] = arrayData;
      }
    }
  } else {
    // For object data, only include changed fields
    Object.keys(currentData).forEach(key => {
      if (currentData[key] !== originalData[key]) {
        // Skip null/undefined comparisons that are effectively the same
        if (currentData[key] || originalData[key]) {
          // Map form field names back to API field names for basic information
          if (activeTab.value === 'basic-information') {
            let apiField = key;

            // Map specific form fields back to API fields
            // Note: Form component uses gender_id and marital_status_id directly, only phone needs mapping
            if (key === 'main_phone_number') apiField = 'phone';
            // gender_id and marital_status_id are already API field names, no mapping needed

            changes[apiField] = currentData[key];
          } else {
            changes[key] = currentData[key];
          }
        }
      }
    });
  }

  return changes;
});

// Show all fields in need revision; lock non-new_data fields via editableFields
const visibleFields = computed(() => {
  return null; // Always render all fields; editability handled separately
});

// Determine which fields are editable (when need revision => only fields from new_data)
const editableFields = computed(() => {
  const status = requestDetail.value?.status;
  const statusRaw = requestDetail.value?.status_raw;
  const statusLabel = requestDetail.value?.status_label;

  // Check multiple possible status formats for need revision
  const isNeedRevision = status === 'rejected' ||
    status === '3' ||
    statusRaw === '3' ||
    statusRaw === 3 ||
    statusLabel === 'rejected' ||
    statusLabel === 'need_revision' ||
    (typeof statusLabel === 'string' && statusLabel.toLowerCase().includes('revision'));

  if (!isNeedRevision) {
    return null; // Not in need revision → all editable as usual
  }

  const newData = requestDetail.value?.new_data?.data;

  // If no new_data, no fields are editable
  if (!newData || Object.keys(newData).length === 0) {
    return new Set();
  }

  const fields = new Set();

  if (activeTab.value === 'basic-information') {
    // For basic information, only allow editing fields that exist in new_data

    Object.keys(newData).forEach(apiField => {
      // Only add field if it has a meaningful value (not null, undefined, or empty)
      const value = newData[apiField];

      if (value !== null && value !== undefined && value !== '') {
        let formField = apiField;

        // Map specific API fields to form fields (same as dynamicFormData)
        if (apiField === 'phone') formField = 'main_phone_number';
        // Removed id_number_ktp mapping - now using no_ktp directly

        fields.add(formField);
      }
    });
  } else if (activeTab.value === 'address') {
    // For address, map API field names to form field names

    // Mapping from API field names to form field names
    const fieldMapping = {
      // Official address (KTP) fields
      'detail_ktp': 'official_address_detail',
      'province_ktp': 'official_address_province',
      'province_ktp_id': 'official_address_province',
      'city_ktp': 'official_address_city',
      'city_ktp_id': 'official_address_city',
      'postal_code_ktp': 'official_address_postal_code',
      'sub_distric_ktp': 'official_address_subdistrict',
      'administrative_village_ktp': 'official_address_administrative_village',
      'rt_ktp': 'official_address_rt',
      'rw_ktp': 'official_address_rw',
      'street_name_ktp': 'official_address_street',
      'house_number_ktp': 'official_address_house_number',

      // Domicile address fields
      'detail_domicile': 'domicile_address_detail',
      'province_domicile': 'domicile_address_province',
      'province_domicile_id': 'domicile_address_province',
      'city_domicile': 'domicile_address_city',
      'city_domicile_id': 'domicile_address_city',
      'postal_code_domicile': 'domicile_address_postal_code',
      'sub_distric_domicile': 'domicile_address_subdistrict',
      'administrative_village_domicile': 'domicile_address_administrative_village',
      'rt_domicile': 'domicile_address_rt',
      'rw_domicile': 'domicile_address_rw',
      'street_name_domicile': 'domicile_address_street',
      'house_number_domicile': 'domicile_address_house_number'
    };

    // Check each field in new_data and map to form field names
    Object.keys(newData).forEach(apiField => {
      const value = newData[apiField];

      if (value !== null && value !== undefined && value !== '') {
        // Map API field to form field name
        const formField = fieldMapping[apiField];
        if (formField) {
          fields.add(formField);
        } else {
          // If no mapping found, add the original field name
          fields.add(apiField);
        }
      } else {
      }
    });
    // Also check nested structure if it exists (for backward compatibility)
    if (newData.official_address && typeof newData.official_address === 'object') {
      Object.keys(newData.official_address).forEach(k => {
        const value = newData.official_address[k];
        if (value !== null && value !== undefined && value !== '') {
          fields.add(`official_${k}`);
          fields.add(k); // Also allow flat keys
        }
      });
    }
    if (newData.domicile_address && typeof newData.domicile_address === 'object') {
      Object.keys(newData.domicile_address).forEach(k => {
        const value = newData.domicile_address[k];
        if (value !== null && value !== undefined && value !== '') {
          fields.add(`domicile_${k}`);
          fields.add(k); // Also allow flat keys
        }
      });
    }
  } else if (activeTab.value === 'medical-record') {
    // For medical record, map API field names to form field names

    // Mapping from API field names to form field names
    const fieldMapping = {
      'blood_type': 'bloodType',
      'height': 'heightCm',
      'weight': 'weightKg',
      'head_size': 'headSize',
      'has_disability': 'hasDisability',
      'health_status': 'healthStatus',
      'last_mcu_date': 'lastMcuDate',
      'health_concern': 'healthConcern',
      'medical_treatment_record': 'medicalTreatmentRecord',
      'vaccination_record': 'vaccinationRecord',
      'special_conditions': 'specialConditions'
    };

    // Check each field in new_data and map to form field names
    Object.keys(newData).forEach(apiField => {
      const value = newData[apiField];

      if (value !== null && value !== undefined && value !== '') {
        // Map API field to form field name
        const formField = fieldMapping[apiField];
        if (formField) {
          fields.add(formField);
        } else {
          // If no mapping found, add the original field name
          fields.add(apiField);
        }
      } else {
      }
    });
  } else if (activeTab.value === 'payroll-account') {
    // For payroll account, map API field names to form field names
    // IMPORTANT: Document fields (npwp_doc, saving_book_doc) are excluded from editable fields

    // Mapping from API field names to form field names (excluding document fields)
    const fieldMapping = {
      'bank_id': 'bank_id',
      'number_rekening': 'number_rekening',
      'holder_name': 'holder_name',
      'tax_status_id': 'tax_status_id',
      'npwp': 'npwp'
      // npwp_doc and saving_book_doc are intentionally excluded - they are view-only
    };

    // Document fields that should never be editable
    const documentFields = ['npwp_doc', 'saving_book_doc', 'npwp_doc_id', 'saving_book_doc_id'];

    // Check each field in new_data and map to form field names
    Object.keys(newData).forEach(apiField => {
      const value = newData[apiField];

      // Skip document fields - they are always view-only
      if (documentFields.includes(apiField)) {
        return;
      }

      if (value !== null && value !== undefined && value !== '') {
        // Map API field to form field name
        const formField = fieldMapping[apiField];
        if (formField) {
          fields.add(formField);
        } else {
          // If no mapping found, add the original field name (but not if it's a document field)
          if (!documentFields.includes(apiField)) {
            fields.add(apiField);
          }
        }
      } else {
      }
    });
  } else if (activeTab.value === 'social-security') {
    // For Benefit, map API field names to form field names

    // Mapping from API field names to form field names
    const fieldMapping = {
      'bpjs_tk_number': 'no_bpjs_tk',
      'bpjs_tk_effective_date': 'bpjs_tk_effective_date',
      'bpjs_health_number': 'no_bpjs',
      'bpjs_doc': 'bpjs_doc',
      'no_telkomedika': 'no_telkomedika',
      'telkomedika_card_number': 'telkomedika_card_number',
      'telkomedika_doc': 'telkomedika_doc'
    };

    // Check each field in new_data and map to form field names
    Object.keys(newData).forEach(apiField => {
      const value = newData[apiField];

      if (value !== null && value !== undefined && value !== '') {
        // Map API field to form field name
        const formField = fieldMapping[apiField];
        if (formField) {
          fields.add(formField);
        } else {
          // If no mapping found, add the original field name
          fields.add(apiField);
        }
      }
    });
  } else if (Array.isArray(newData)) {
    // For array-based tabs (family, education, emergency-contact), determine editable fields based on new_data
    const fields = new Set();

    // Get all fields that exist in new_data
    newData.forEach(item => {
      if (item && typeof item === 'object') {
        Object.keys(item).forEach(field => {
          const value = item[field];
          if (value !== null && value !== undefined && value !== '') {
            fields.add(field);
          }
        });
      }
    });

    return fields;
  } else if (typeof newData === 'object') {
    // For other object-based tabs, only allow editing fields with meaningful values
    Object.keys(newData).forEach(k => {
      const value = newData[k];
      if (value !== null && value !== undefined && value !== '') {
        fields.add(k);
      } else {
      }
    });
  }

  return fields;
});

// Form configuration for components
const formConfig = computed(() => {
  const currentStatus = requestDetail.value?.status;
  const statusRaw = requestDetail.value?.status_raw;
  const statusLabel = requestDetail.value?.status_label;

  // Check multiple possible status formats for need revision
  const isNeedRevision = currentStatus === 'rejected' ||
    currentStatus === '3' ||
    statusRaw === '3' ||
    statusRaw === 3 ||
    statusLabel === 'rejected' ||
    statusLabel === 'need_revision' ||
    (typeof statusLabel === 'string' && statusLabel.toLowerCase().includes('revision'));

  const config = {
    status: currentStatus,
    isNeedRevision: isNeedRevision,
    isDraft: currentStatus === 'draft',
    visibleFields: null, // show all fields
    // Only allow editing specific fields for need revision (from new_data)
    editableFields: isNeedRevision ? editableFields.value : null,
    // Disable all fields by default in need revision; components should honor editableFields to re-enable specific ones
    // For draft mode, allow editing all fields
    disableAllByDefault: isNeedRevision && !(currentStatus === 'draft'),
    showFieldLabels: true,
    showOnlyChangedFields: isNeedRevision,
    // Pass new_data to components for array-based tabs
    newData: (isNeedRevision || currentStatus === 'draft') ? (requestDetail.value?.new_data?.data || []) : null
  };

  return config;
});

const statusSteps = computed(() => {
  if (!requestDetail.value) {
    return [
      { label: "Draft", icon: "pi pi-file", status: "current" },
      { label: "Submitted", icon: "pi pi-user", status: "pending" },
      { label: "Waiting Approval", icon: "pi pi-calendar", status: "pending" },
      { label: "Approved", icon: "pi pi-check", status: "pending" },
    ];
  }

  const currentStatus = requestDetail.value.status || "pending";

  if (currentStatus === "rejected" || currentStatus === "3") {
    return [
      { label: "Draft", icon: "pi pi-file", status: "completed" },
      { label: "Submitted", icon: "pi pi-user", status: "completed" },
      { label: "Needs Revision", icon: "pi pi-exclamation-triangle", status: "current" },
      { label: "Approved", icon: "pi pi-check", status: "pending" },
    ];
  } else if (currentStatus === "draft" || currentStatus === "1") {
    return [
      { label: "Draft", icon: "pi pi-file", status: "current" },
      { label: "Submitted", icon: "pi pi-user", status: "pending" },
      { label: "Waiting Approval", icon: "pi pi-calendar", status: "pending" },
      { label: "Approved", icon: "pi pi-check", status: "pending" },
    ];
  } else if (currentStatus === "in-review" || currentStatus === "waiting_approval" || currentStatus === "2") {
    return [
      { label: "Draft", icon: "pi pi-file", status: "completed" },
      { label: "Submitted", icon: "pi pi-user", status: "completed" },
      { label: "Waiting Approval", icon: "pi pi-calendar", status: "current" },
      { label: "Approved", icon: "pi pi-check", status: "pending" },
    ];
  } else if (currentStatus === "approved" || currentStatus === "completed" || currentStatus === "4") {
    return [
      { label: "Draft", icon: "pi pi-file", status: "completed" },
      { label: "Submitted", icon: "pi pi-user", status: "completed" },
      { label: "Waiting Approval", icon: "pi pi-calendar", status: "completed" },
      { label: "Approved", icon: "pi pi-check", status: "current" },
    ];
  } else {
    return [
      { label: "Draft", icon: "pi pi-file", status: "completed" },
      { label: "Submitted", icon: "pi pi-user", status: "completed" },
      { label: "Waiting Approval", icon: "pi pi-calendar", status: "current" },
      { label: "Approved", icon: "pi pi-check", status: "pending" },
    ];
  }
});

// Check if form has valid data to submit
const hasValidFormData = computed(() => {
  if (!activeTab.value) {
    return false;
  }

  // SIMPLIFIED VALIDATION: For need revision, always return true if there are any changes
  const isNeedRevision = requestDetail.value?.status === '3' || 
                        requestDetail.value?.status === 3 ||
                        (requestDetail.value?.status_label && requestDetail.value.status_label.toLowerCase().includes('revision'));

  if (isNeedRevision) {
    // For need revision, we are much more lenient - just check if there's ANY data indicating changes
    const hasAnyData = !!(
      (formData.value && Object.keys(formData.value).length > 0) ||
      (requestDetail.value?.new_data?.data && Object.keys(requestDetail.value.new_data.data).length > 0)
    );
    
    // ALWAYS return true for need revision if we have any data at all
    // This bypasses all other validation checks
    return hasAnyData;
  }

  // For other statuses (draft, normal), use simple validation
  const statusInfo = normalizeStatus(requestDetail.value);
  const isDraft = statusInfo.isDraft;

  // Use formData if available
  const currentData = formData.value;

  if (!currentData || Object.keys(currentData).length === 0) {
    // For draft status, if no form data but has existing new_data, allow submission
    if (isDraft && requestDetail.value?.new_data?.data && Object.keys(requestDetail.value.new_data.data).length > 0) {
      return true;
    }
    return false;
  }

  // Check if any field has meaningful data (not empty, null, or just whitespace)
  const hasData = Object.values(currentData).some(value => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'number') return value !== 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  });

  // For basic information, also check if required fields are present
  if (activeTab.value === 'basic-information') {
    // Check if KTP is present and valid
    const ktpValue = currentData.no_ktp;

    // For draft status, be more lenient with KTP validation
    const statusInfo = normalizeStatus(requestDetail.value);
    const isDraft = statusInfo.isDraft;

    if (isDraft) {
      // For draft status, KTP validation is optional - just check if there's meaningful data
    } else if (isNeedRevision) {
      // For need revision status, skip KTP validation - focus on the fields being revised
    } else {
      // For non-draft status, require KTP to be present
      if (!ktpValue || ktpValue.trim() === '') {
        return false;
      }
    }
  }

  return hasData;
});

// Check if there are unsaved changes
const hasUnsavedChanges = computed(() => {
  if (!formData.value || !requestDetail.value?.new_data?.data) return false;

  // Get saved draft data (what's currently saved on server)
  const savedDraftData = requestDetail.value.new_data.data;
  const currentFormData = formData.value;

  // Compare current form data with saved draft data
  const hasChanges = Object.keys(currentFormData).some(field => {
    const currentValue = currentFormData[field];
    const savedValue = savedDraftData[field];

    // Normalize values for comparison
    const normalizeValue = (v) => v === null || v === undefined ? '' : v;
    const normalizedCurrent = normalizeValue(currentValue);
    const normalizedSaved = normalizeValue(savedValue);

    return JSON.stringify(normalizedCurrent) !== JSON.stringify(normalizedSaved);
  });

  return hasChanges;
});

// Check if submit should be enabled (has valid data, unsaved changes OK for auto-save)
const canSubmit = computed(() => {
  return hasValidFormData.value; // Remove unsaved changes restriction since we'll auto-save
});

const requestDocuments = computed(() => {
  // If we have documents from API, use them
  if (requestDetail.value?.documents?.length > 0) {
    return requestDetail.value.documents.map((doc) => ({
      id: doc.id,
      name: doc.name || doc.document_name || "Document",
      type: doc.type || "pdf",
      old_file: doc.old_file,
      new_file: doc.new_file,
      download_url: doc.download_url || "#",
    }));
  }

  // Generate dummy documents based on category
  const category = requestDetail.value?.update || activeTab.value || "basic-information";
  const currentRequestId = requestDetail.value?.id || requestId.value;

  const dummyDocuments = [];

  switch (category) {
    case "education":
      dummyDocuments.push(
        {
          id: 1,
          name: "Education Certificate",
          type: "pdf",
          old_file: "education_certificate_old.pdf",
          new_file: "education_certificate_new.pdf",
          download_url: "#",
        },
        {
          id: 2,
          name: "Academic Transcript",
          type: "pdf",
          old_file: "transcript_old.pdf",
          new_file: "transcript_new.pdf",
          download_url: "#",
        }
      );
      break;

    case "family":
      dummyDocuments.push(
        {
          id: 1,
          name: "Marriage Certificate",
          type: "pdf",
          old_file: "marriage_cert_old.pdf",
          new_file: "marriage_cert_new.pdf",
          download_url: "#",
        },
        {
          id: 2,
          name: "Birth Certificate - Child",
          type: "pdf",
          old_file: "birth_cert_child_old.pdf",
          new_file: "birth_cert_child_new.pdf",
          download_url: "#",
        }
      );
      break;

    case "address":
      dummyDocuments.push(
        {
          id: 1,
          name: "Proof of Address",
          type: "pdf",
          old_file: "address_proof_old.pdf",
          new_file: "address_proof_new.pdf",
          download_url: "#",
        },
        {
          id: 2,
          name: "Utility Bill",
          type: "jpg",
          old_file: "utility_bill_old.jpg",
          new_file: "utility_bill_new.jpg",
          download_url: "#",
        }
      );
      break;

    case "basic-information":
    case "basic-information":
      dummyDocuments.push(
        {
          id: 1,
          name: "National ID Card (KTP)",
          type: "jpg",
          old_file: "ktp_old.jpg",
          new_file: "ktp_new.jpg",
          download_url: "#",
        },
        {
          id: 2,
          name: "Passport Photo",
          type: "jpg",
          old_file: "photo_old.jpg",
          new_file: "photo_new.jpg",
          download_url: "#",
        }
      );
      break;

    case "payroll-account":
      dummyDocuments.push(
        {
          id: 1,
          name: "Bank Account Statement",
          type: "pdf",
          old_file: "bank_statement_old.pdf",
          new_file: "bank_statement_new.pdf",
          download_url: "#",
        },
        {
          id: 2,
          name: "NPWP Card",
          type: "jpg",
          old_file: "npwp_old.jpg",
          new_file: "npwp_new.jpg",
          download_url: "#",
        }
      );
      break;

    case "medical-record":
      dummyDocuments.push({
        id: 1,
        name: "Medical Checkup Report",
        type: "pdf",
        old_file: "medical_report_old.pdf",
        new_file: "medical_report_new.pdf",
        download_url: "#",
      });
      break;

    case "emergency-contact":
      dummyDocuments.push({
        id: 1,
        name: "Emergency Contact ID",
        type: "jpg",
        old_file: "emergency_contact_id_old.jpg",
        new_file: "emergency_contact_id_new.jpg",
        download_url: "#",
      });
      break;

    default:
      dummyDocuments.push({
        id: 1,
        name: "Supporting Document",
        type: "pdf",
        old_file: "document_old.pdf",
        new_file: "document_new.pdf",
        download_url: "#",
      });
  }

  return dummyDocuments;
});

// Build review notes for need revision, always prefer the latest note_hc
const reviewNotesForNeedRevision = computed(() => {
  const detail = requestDetail.value || {};

  // Determine need-revision context
  const raw = (detail.status_label || detail.status_alias || detail.status || '').toString().toLowerCase();
  const isNeedRevision = detail.status === '3' || detail.status === 3 || raw.includes('revision') || raw === 'need_revision';

  // If not in need revision, return any provided notes as-is
  const existingArr = detail.review_notes || detail.change_history || [];
  if (!isNeedRevision) return existingArr;

  const notes = [];

  // 1) Prefer direct note_hc from detail payload (latest)
  if (detail.note_hc) {
    notes.push({ 
      title: 'HC Review', 
      content: detail.note_hc, 
      reviewer: detail.request_approver?.name_approver || 'HC Team' 
    });
  }

  // 2) If not available, use the most recent entry from history/review notes that has content
  const historyArr = Array.isArray(detail.change_history) ? detail.change_history
    : (Array.isArray(detail.review_notes) ? detail.review_notes : []);
  if (notes.length === 0 && Array.isArray(historyArr) && historyArr.length > 0) {
    const latest = [...historyArr].reverse().find(n => n?.note_hc || n?.note || n?.content);
    if (latest) {
      notes.push({
        title: latest.title || 'HC Review',
        content: latest.note_hc || latest.note || latest.content,
        reviewer: latest.request_approver?.name_approver || latest.reviewed_by || latest.reviewer_name || latest.reviewer || 'HC Team'
      });
    }
  }

  if (notes.length > 0) return notes;
  if (Array.isArray(existingArr) && existingArr.length > 0) return existingArr;

  // Safe fallback so section tetap muncul saat Need Revision dan ada note_hc
  if (isNeedRevision && detail.note_hc) {
    return [{ title: 'HC Review', content: detail.note_hc, reviewer: detail.request_approver?.name_approver || 'HC Team' }];
  }

  return [];
});

// Determine if current request is in Need Revision context
const isNeedRevisionStatus = computed(() => {
  const detail = requestDetail.value || {};
  const raw = (detail.status_label || detail.status_alias || detail.status || '').toString().toLowerCase();
  return detail.status === '3' || detail.status === 3 || raw.includes('revision') || raw === 'need_revision' || raw === 'rejected';
});

// Helper function to normalize status from various API response formats
const normalizeStatus = (statusData) => {
  if (!statusData) return null;

  // Extract status from different possible formats
  const status = statusData.status || statusData.status_raw || statusData;
  const statusAlias = statusData.status_alias;

  // Normalize to consistent format
  if (status === true || status === '1' || status === 1 || statusAlias === 'draft') {
    return { normalized: '1', isDraft: true, isRejected: false };
  }
  if (status === '2' || status === 2 || statusAlias === 'waiting_approval') {
    return { normalized: '2', isDraft: false, isRejected: false };
  }
  if (status === '3' || status === 3 || statusAlias === 'rejected' || statusAlias === 'need_revision') {
    return { normalized: '3', isDraft: false, isRejected: true };
  }
  if (status === '4' || status === 4 || statusAlias === 'approved') {
    return { normalized: '4', isDraft: false, isRejected: false };
  }

  // Default fallback
  return { normalized: status, isDraft: false, isRejected: false };
};

// Methods with proper error handling and recursion prevention

const formatDate = (dateString) => {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch (error) {
    return "-";
  }
};

// Handle form data updates with debouncing to prevent excessive updates
let formUpdateTimeout = null;

// Updates formData.value with new data while preventing recursive updates
// and handling draft vs non-draft status appropriately.
// 
// IMPORTANT: This function now also sets the hydration flag (tabHydrated)
// to ensure tabs are properly marked as "user-edited" after data loading.
// This fixes the dropdown bug where user selections weren't visible in draft mode.
const setFormDataSafely = (newData) => {
  if (!newData) return;

  // Prevent recursive updates
  if (window.isUpdatingFormData) {
    return;
  }

  // For draft status, be more careful about overwriting existing data
  // FIXED: Use normalize helper for consistent status detection
  const statusInfo = normalizeStatus(requestDetail.value);
  const isDraft = statusInfo.isDraft;

  if (isDraft) {
    // If user already editing Address or Benefit tab, do not allow background merges to override
    if ((activeTab.value === 'address' || activeTab.value === 'social-security') && editedFieldKeys.value.size > 0) {
      return;
    }
    const currentFormData = formData.value || {};

    // For array data (emergency-contact, family, education), always replace
    if (Array.isArray(newData)) {
      formData.value = [...newData];
    } else if (currentFormData && Object.keys(currentFormData).length > 0) {
      // For object data, merge carefully: do NOT overwrite keys the user already edited
      const merged = { ...currentFormData };
      Object.keys(newData).forEach((key) => {
        // If the key is marked as edited by the user for this tab, skip overwriting
        if ((activeTab.value === 'address' || activeTab.value === 'social-security') && editedFieldKeys.value.has(key)) return;
        // Otherwise, only update when value actually differs
        const incoming = newData[key];
        const existing = currentFormData[key];
        if (JSON.stringify(incoming) !== JSON.stringify(existing)) {
          merged[key] = incoming;
        }
      });
      formData.value = merged;
    } else {
      // Current formData is empty, safe to replace
      if (typeof newData === 'object') {
        formData.value = { ...newData };
      }
    }
  } else {
    // For non-draft status, always replace
    if (Array.isArray(newData)) {
      formData.value = [...newData];
    } else if (typeof newData === 'object') {
      formData.value = { ...newData };
    }
  }

  // ✅ FIX: Set hydration flag after updating formData
  // This ensures that tabs loaded via setFormDataSafely (especially in draft mode) 
  // are properly marked as hydrated, allowing dynamicFormData to use formData.value
  // for user interactions like dropdown selections.
  //
  // Previously, only assignFormData() set the hydration flag, but setFormDataSafely()
  // didn't, causing a bug where dropdowns wouldn't update in draft mode because
  // the medical-record tab wasn't considered "hydrated" even though it had data.
  if (activeTab.value && newData) {
    // Only mark as hydrated if the data contains meaningful content
    // (not just empty objects, null values, or empty arrays)
    const hasMeaningfulData = newData && typeof newData === 'object' &&
      (Array.isArray(newData)
        ? newData.length > 0  // For arrays: must have at least one item
        : Object.values(newData).some((v) => v !== null && v !== '' && v !== undefined) // For objects: must have at least one non-empty value
      );

    if (hasMeaningfulData) {
      // Mark this tab as hydrated so dynamicFormData will prioritize formData.value
      // over API data sources, allowing user changes to be immediately visible
      tabHydrated.value[activeTab.value] = true;
    }
  }

};
const handleFormDataUpdate = (newData) => {
  if (!newData || typeof newData !== 'object') return;

  // DEBUG: Log incoming data for basic-information, address and payroll-account tabs
  if (activeTab.value === 'basic-information') {
    console.log('🔍 handleFormDataUpdate - Received data for basic-information:', newData);
    if (newData.main_phone_number) {
      console.log('🔍 handleFormDataUpdate - main_phone_number updated to:', newData.main_phone_number);
    }
  } else if (activeTab.value === 'address') {
  } else if (activeTab.value === 'payroll-account') {
  }

  // Mark edited keys so background sync won't overwrite them (object tabs only)
  try {
    if (!Array.isArray(newData)) {
      const current = formData.value || {};
      Object.keys(newData).forEach((k) => {
        const incoming = newData[k];
        const prev = current[k];
        if (JSON.stringify(incoming) !== JSON.stringify(prev)) {
          editedFieldKeys.value.add(k);
          lastUserEditAt.value = Date.now();

          // DEBUG: Log field changes for address
          if (activeTab.value === 'address') {
          }
        }
      });
    }
  } catch (e) { }

  // In need revision, ignore edits to fields not included in new_data
  try {
    const isNeedRevision = requestDetail.value?.status === 'rejected' || requestDetail.value?.status === '3';
    if (isNeedRevision && editableFields && typeof editableFields.value !== 'undefined' && editableFields.value) {
      if (!Array.isArray(newData)) {
        const allowed = editableFields.value instanceof Set
          ? editableFields.value
          : new Set(Array.isArray(editableFields.value) ? editableFields.value : []);
        const filtered = {};
        Object.keys(newData).forEach((k) => {
          if (allowed.has(k)) {
            filtered[k] = newData[k];
          }
        });
        newData = filtered; // reassign to only allowed fields
      }
      // Revert any accidental edits to locked fields by restoring baseline before merge
      if (needRevisionBaseline.value && typeof formData.value === 'object' && !Array.isArray(formData.value)) {
        const base = needRevisionBaseline.value;
        const current = formData.value || {};
        const allowed = editableFields.value instanceof Set
          ? editableFields.value
          : new Set(Array.isArray(editableFields.value) ? editableFields.value : []);
        const restored = { ...current };
        Object.keys(current).forEach((k) => {
          if (!allowed.has(k)) {
            restored[k] = base[k];
          }
        });
        formData.value = restored;
      }
    }
  } catch (e) {
  }

  // Clear any pending timeout
  if (formUpdateTimeout) {
    clearTimeout(formUpdateTimeout);
  }

  // Set a flag to indicate user is actively editing
  window.isUpdatingFormData = true;

  formUpdateTimeout = setTimeout(() => {
    // For array data (emergency-contact, family, education), replace entirely
    const arrayTabs = ['emergency-contact', 'family', 'education'];
    if (arrayTabs.includes(activeTab.value) && Array.isArray(newData)) {
      formData.value = [...newData];
    } else {
      // For object data, merge with existing formData
      const currentData = formData.value || {};
      const merged = { ...currentData };
      Object.keys(newData).forEach((k) => {
        // FIXED: For basic-information, address, payroll-account, social-security, and medical-record tabs, always allow updates from forms
        // The edit window logic was too aggressive and prevented legitimate updates
        if (activeTab.value === 'basic-information' || activeTab.value === 'address' || activeTab.value === 'payroll-account' || activeTab.value === 'social-security' || activeTab.value === 'medical-record') {
          merged[k] = newData[k];
          // Debug logging for basic-information
          if (activeTab.value === 'basic-information') {
            console.log(`🔍 handleFormDataUpdate - Updating ${k} from '${currentData[k]}' to '${newData[k]}'`);
          }
        } else {
          // If user typed very recently, skip overwriting by reactive merges (for other tabs)
          if (isWithinUserEditWindow() && editedFieldKeys.value.has(k)) {
            // DEBUG: Log skipped updates for other tabs
            return;
          }
          merged[k] = newData[k];
        }
      });

      // DEBUG: Log final merged data for address and payroll-account
      if (activeTab.value === 'address') {
      } else if (activeTab.value === 'payroll-account') {
      }

      formData.value = merged;
    }

    // Clear the update flag after a short delay
    setTimeout(() => {
      window.isUpdatingFormData = false;
    }, 100);
  }, 50); // Shorter timeout for user interactions
};

// Function untuk mendapatkan changes dari tab saat ini
const getChangesForCurrentTab = () => {
  if (!requestDetail.value?.changes || !activeTab.value) return {};

  const tabKey = activeTab.value.replace('-', '_') + 'Data';

  if (requestDetail.value.changes[tabKey]) {
    // Use current form data as new value and original data as old value
    let originalData = {};

    // Get original data based on active tab
    switch (activeTab.value) {
      case 'basic-information':
        originalData = originalEmployeeData.value || {};
        break;
      case 'address':
        originalData = originalAddressData.value || {};
        break;
      case 'emergency-contact':
        originalData = originalEmergencyContactData.value || [];
        break;
      case 'payroll-account':
        originalData = originalPayrollAccountData.value || {};
        break;
      case 'family':
        originalData = originalFamilyData.value || [];
        break;
      case 'education':
        originalData = originalEducationData.value || [];
        break;
      case 'social-security':
        originalData = originalSocialSecurityData.value || {};
        break;
      case 'medical-record':
        originalData = originalMedicalRecordData.value || {};
        break;
    }

    // Filter out non-modifiable fields for basic-information
    let newData = dynamicFormData.value;
    if (activeTab.value === 'basic-information') {
      // Remove fields that cannot be modified
      const { name, nik, ...filteredData } = newData || {};
      newData = filteredData;
    } else if (activeTab.value === 'education') {
      // For education, prioritize saved draft data if available
      const statusInfo = normalizeStatus(requestDetail.value);
      const isDraftStatus = statusInfo.isDraft;

      if (isDraftStatus && requestDetail.value?.new_data?.data) {
        newData = requestDetail.value.new_data.data;
      } else {
        // For non-draft, ensure it's an array
        newData = Array.isArray(newData) ? newData : [];
      }
    } else if (activeTab.value === 'emergency-contact') {
      // For emergency contact, ensure it's an array
      newData = Array.isArray(newData) ? newData : [];
    } else if (activeTab.value === 'family') {
      // For family, ensure it's an array
      newData = Array.isArray(newData) ? newData : [];
    }

    return {
      [tabKey]: {
        old: originalData,
        new: newData // Data (array for EMC/FMY/EDC, object for others)
      }
    };
  }

  return {};
};

// Function untuk mendapatkan request type dari tab
const getRequestTypeFromTab = (tabId) => {
  const typeMap = {
    'basic-information': 'BSC',
    'address': 'ADR',
    'emergency-contact': 'EMC',
    'family': 'FMY',
    'education': 'EDC',
    'payroll-account': 'PYR',
    'social-security': 'SSI',
    'medical-record': 'MDR',
  };
  return typeMap[tabId] || 'BSC';
};

// Function untuk mendapatkan field structure berdasarkan tab category
const getFieldStructureForTab = (tabId) => {
  const fieldStructures = {
    'basic-information': {
      employee_name: 'text',
      employee_id: 'text',
      email: 'email',
      phone_number: 'tel',
      birth_date: 'date',
      birth_place: 'text',
      gender: 'select',
      marital_status: 'select',
      religion: 'select',
      professional_photo: 'file'
    },
    'address': {
      // Official Address (KTP) fields
      detail_ktp: 'textarea',
      province_ktp: 'select',
      city_ktp: 'select',
      sub_distric_ktp: 'select',
      administrative_village_ktp: 'text',
      rt_ktp: 'text',
      rw_ktp: 'text',
      street_name_ktp: 'text',
      house_number_ktp: 'text',
      postal_code_ktp: 'text',
      // Domicile Address fields
      detail_domicile: 'textarea',
      province_domicile: 'select',
      city_domicile: 'select',
      sub_distric_domicile: 'select',
      administrative_village_domicile: 'text',
      rt_domicile: 'text',
      rw_domicile: 'text',
      street_name_domicile: 'text',
      house_number_domicile: 'text',
      postal_code_domicile: 'text'
    },
    'payroll-account': {
      bank_id: 'select',
      number_rekening: 'text',
      holder_name: 'text',
      tax_status_id: 'select',
      npwp: 'text',
      npwp_doc: 'file',
      saving_book_doc: 'file'
    },
    'education': {
      education_level: 'select',
      institution: 'text',
      major: 'text',
      graduation_year: 'text',
      gpa: 'text',
      start_year: 'text',
      end_year: 'text'
    },
    'medical-record': {
      telkomedika_card_number: 'text',
      bpjs_tk_number: 'text',
      bpjs_tk_effective_date: 'date',
      bpjs_health_number: 'text',
      telkomedika_doc: 'file',
      bpjs_doc: 'file',
      health_status: 'text',
      last_mcu_date: 'date',
      blood_type: 'select',
      height: 'text',
      weight: 'text'
    },
    'emergency-contact': {
      // Emergency contact uses array structure, so we return empty object
      // The actual data structure is handled in the component itself
    }
  };

  return fieldStructures[tabId] || {};
};

// Change Request Modal handlers
const closeChangeRequestModal = () => {
  isChangeRequestModalOpen.value = false;
};

// Handle change request submission from ChangeRequestModal
const handleChangeRequest = async (requestData) => {
  try {
    isSubmitting.value = true;

    // Use the same flow as index.vue for final submission
    const { useChangeRequestSubmit } = await import('~/composables/useChangeRequestSubmit');
    const { submitChangeRequest } = useChangeRequestSubmit();

    // CRITICAL FIX: Get only the fields that exist in the draft (from API response) 
    // Do NOT default to empty object - this causes composable to fetch forbidden fields
    const draftOldData = requestDetail.value?.old_data || null;
    const draftNewDataRaw = requestDetail.value?.new_data?.data || {};

    // If draft has no old_data, we shouldn't proceed - this means no baseline for comparison
    if (!draftOldData || Object.keys(draftOldData).length === 0) {
      showToast({
        type: 'error',
        message: 'Draft contains no baseline data. Please refresh and try again.'
      });
      isSubmitting.value = false;
      return;
    }

    // Get allowed fields (fields that exist in either old_data or new_data from draft)
    const allowedFields = new Set([
      ...Object.keys(draftOldData),
      ...Object.keys(draftNewDataRaw)
    ]);

    // Get current form data and filter to only allowed fields
    const currentFormData = formData.value || {};
    const filteredNewData = {};
    const filteredOldData = {};

    for (const field of allowedFields) {
      if (field in currentFormData) {
        filteredNewData[field] = currentFormData[field];
      }
      if (field in draftOldData) {
        filteredOldData[field] = draftOldData[field];
      }
    }

    // Check if there are unsaved changes (compare current form data with saved draft data)
    const hasUnsavedChanges = Array.from(allowedFields).some(field => {
      const currentValue = currentFormData[field];
      const savedValue = draftNewDataRaw[field];
      const isChanged = JSON.stringify(currentValue) !== JSON.stringify(savedValue);
      if (isChanged) {
      }
      return isChanged;
    });

    // Declare variables for final data
    let finalNewData, finalOldData;

    // Since auto-save is already handled in handleSubmitDirect, 
    // we can assume data is already saved when we reach here

    // Use the saved draft data directly (not current form data)
    // CRITICAL: Filter out forbidden fields from draft data before submission
    const forbiddenFields = ['name', 'nik', 'business_email'];

    finalNewData = { ...draftNewDataRaw };
    finalOldData = { ...draftOldData };

    // Remove forbidden fields from both new and old data
    forbiddenFields.forEach(field => {
      delete finalNewData[field];
      delete finalOldData[field];
    });

    // IMPORTANT: Ensure oldData is not empty to prevent composable from fetching employee API
    // Convert null values to empty strings to maintain the structure
    Object.keys(finalOldData).forEach(key => {
      if (finalOldData[key] === null || finalOldData[key] === undefined) {
        finalOldData[key] = '';
      }
    });

    // Check if this is a draft status
    const statusInfo = normalizeStatus(requestDetail.value);
    const isDraft = statusInfo.isDraft;
    // For draft and revision submissions, always use current form data (latest user changes)
    let changesToSubmit;

    // Always calculate changes from current form state to capture latest edits
    // This ensures user's edits are included even if auto-save hasn't completed
    changesToSubmit = calculateChanges();

    // Prepare submission payload with submit: true (like index.vue)
    // Get action from draft (insert/update) - important for emergency-contact, family, education
    const draftAction = requestDetail.value?.new_data?.action || 'update';

    const submitPayload = {
      currentTab: activeTab.value,
      changes: changesToSubmit, // Use saved draft data or calculated changes
      oldData: finalOldData, // Send original old data from draft
      note_employee: requestData.reason || 'Request submitted for approval',
      consent: true,
      submit: true, // KEY: This makes it go to waiting approval
      id: requestDetail.value?.id_change_req, // For PUT request - submit from draft uses PUT method
      action: draftAction, // Pass action from draft to composable
      requestAction: draftAction // Also pass as requestAction for compatibility
    };
    // CRITICAL: Check for forbidden fields in payload
    let forbiddenInChanges = [];
    let forbiddenInOldData = [];

    // For education (array data), check each item in the array
    if (activeTab.value === 'education' && Array.isArray(submitPayload.changes)) {
      submitPayload.changes.forEach((item, index) => {
        if (item && typeof item === 'object') {
          forbiddenFields.forEach(field => {
            if (field in item) {
              forbiddenInChanges.push(`changes[${index}].${field}`);
            }
          });
        }
      });
    } else if (submitPayload.changes && typeof submitPayload.changes === 'object') {
      // For non-array data
      forbiddenInChanges = forbiddenFields.filter(field => field in submitPayload.changes);
    }

    // Check old data
    if (Array.isArray(submitPayload.oldData)) {
      submitPayload.oldData.forEach((item, index) => {
        if (item && typeof item === 'object') {
          forbiddenFields.forEach(field => {
            if (field in item) {
              forbiddenInOldData.push(`oldData[${index}].${field}`);
            }
          });
        }
      });
    } else if (submitPayload.oldData && typeof submitPayload.oldData === 'object') {
      forbiddenInOldData = forbiddenFields.filter(field => field in submitPayload.oldData);
    }

    if (forbiddenInChanges.length > 0 || forbiddenInOldData.length > 0) {
    }

    // Submit using the same composable as index.vue
    console.log('🚀 Submitting change request with payload:', submitPayload);
    const response = await submitChangeRequest(submitPayload);
    console.log('📡 Submit response:', response);

    if (response.success) {

      // Show success message
      toastSuccess('Request submitted successfully for approval');

      // NOW UPLOAD ATTACHMENTS AFTER SUCCESSFUL CHANGE REQUEST SUBMISSION
      try {
        // Check for pending attachments for all categories (except education which is handled separately)
        const hasDocuments = uploadedDocuments.value?.length > 0;
        // Check for professional photo in multiple locations
        const photoFromParent = professionalPhotoFile.value;
        const photoFromComponent = editDataBasicInfoRef.value?.professionalPhotoFile;
        const hasPhoto = activeTab.value === 'basic-information' && (!!photoFromParent || !!photoFromComponent);
        const hasAnyAttachments = hasDocuments || hasPhoto;

        console.log('🔍 Attachment check after change request submission:', {
          category: activeTab.value,
          hasDocuments,
          hasPhoto,
          hasAnyAttachments,
          responseId: response.data?.id || response.data?.id_change_req
        });

        if (hasAnyAttachments && activeTab.value !== 'education') {
          toastInfo('Uploading attachments...');
          console.log('🔍 Uploading attachments for category:', activeTab.value);

          // Use the response ID for attachment upload
          const changeRequestId = response.data?.id || response.data?.id_change_req || requestId.value;

          await handleAttachmentsUploadForCurrentCategory({
            id_change_req: changeRequestId,
            id: changeRequestId
          });

          console.log('✅ Attachments uploaded successfully after change request');
        }
      } catch (attachmentError) {
        console.error('Error uploading attachments after change request:', attachmentError);
        toastWarning('Request submitted successfully, but some attachments may not have uploaded. Please check and re-upload if needed.');
      }

      // Force refresh page data to show updated status
      await nextTick();

      // Reload request detail to get updated status
      await loadRequestDetail();

      // Update requestDetail status to waiting approval 
      if (requestDetail.value) {
        requestDetail.value = {
          ...requestDetail.value,
          status: '2', // Waiting approval
          status_label: 'Waiting Approval',
          note_employee: requestData.reason || 'Request submitted for approval',
          consent: true
        };
      }

      // Close modal
      isChangeRequestModalOpen.value = false;

      // Store success message for display on history page
      localStorage.setItem('pendingSuccessMessage', JSON.stringify({
        title: 'Request Submitted for Approval',
        message: 'Your request has been submitted successfully and is waiting for approval.',
        type: 'success'
      }));

      console.log('🔄 Redirecting to history page...');
      // Redirect to history page
      await navigateTo('/update-data/history');
    } else {
      console.error('❌ Submit failed:', response);
      throw new Error(response.message || 'Failed to update request');
    }

  } catch (error) {
    console.error('❌ Error in handleChangeRequest:', error);
    toastError(`Failed to process request: ${error.message}`);
  } finally {
    isSubmitting.value = false;
  }
};

const openChangeHistory = () => {
  isChangeHistoryOpen.value = true;
};

const closeChangeHistory = () => {
  isChangeHistoryOpen.value = false;
};

const closeSubmitRevisionModal = () => {
  isSubmitRevisionModalOpen.value = false;
};

const confirmSubmitRevision = async () => {
  closeSubmitRevisionModal();
  await handleRevisionSubmit();
};

// Handle submit revision with proper error handling
const handleRevisionSubmit = async () => {
  try {
    // Ensure latest edits are saved into draft before final submit
    if (hasUnsavedChanges && hasUnsavedChanges.value) {
      try {
        await handleSaveChanges();
      } catch (e) { }
    }

    // Prepare payload for API - submit = true means waiting approval
    // Get action from draft (insert/update) - important for emergency-contact, family, education
    const draftAction = requestDetail.value?.new_data?.action || 'update';

    const payload = {
      currentTab: activeTab.value,
      changes: calculateChanges(),
      note_employee: changeReason.value || 'Revision submitted',
      consent: true,
      submit: true, // This submits for approval
      action: draftAction, // Pass action from draft to composable
      requestAction: draftAction // Also pass as requestAction for compatibility
    };

    // Use PUT submit flow via composable for final submission (submit revision uses PUT method)
    const { useChangeRequestSubmit } = await import('~/composables/useChangeRequestSubmit');
    const { submitChangeRequest } = useChangeRequestSubmit();

    const response = await submitChangeRequest({ ...payload, id: requestId.value });

    if (response.success) {
      toastSuccess('Revision submitted successfully');

      // Update requestDetail with new data and status
      if (response.data) {
        requestDetail.value = {
          ...requestDetail.value,
          ...response.data
        };
      }

      // Store success message for display on history page
      localStorage.setItem('pendingSuccessMessage', JSON.stringify({
        title: 'Revision Submitted',
        message: 'Your revision has been submitted successfully.',
        type: 'success'
      }));

      // Redirect to history page or show success message
      await navigateTo('/update-data/history');
    } else {
      throw new Error(response.message || 'Failed to submit revision');
    }

  } catch (error) {

    toastError(`Failed to submit revision: ${error.message}`);
  }
};

// Helper functions for modals
const getProfessionalPhotoFile = () => {
  const photoFile = editDataBasicInfoRef.value?.professionalPhotoFile || professionalPhotoFile.value;
  
  // Only log when there's actually a photo file (since it's optional)
  if (photoFile) {
    console.log('🔍 Professional photo found:', {
      fileName: photoFile.name,
      fileSize: photoFile.size,
      activeTab: activeTab.value
    });
  }
  
  return photoFile;
};

const getChangeRequestModalData = () => {
  // Use direct checks instead of computed properties
  const isDraftStatus = requestDetail.value?.status === '1' || requestDetail.value?.status === 'draft';
  const isEducation = activeTab.value === 'education';
  const hasDraftData = requestDetail.value?.new_data?.data && Array.isArray(requestDetail.value.new_data.data);
  let finalData;
  if (modalDataForSubmit.value.data) {
    finalData = modalDataForSubmit.value.data;
  } else if (isDraftStatus && isEducation && hasDraftData) {
    finalData = requestDetail.value.new_data.data;
  } else {
    finalData = getChangesForCurrentTab();
  }
  return finalData;
};

const handleViewPrivacy = () => {
  // Handle privacy view
};

// Handle document preview
function handleViewDocument(doc) {
  previewDocumentUrl.value = doc.download_url
  previewDocumentName.value = doc.name || 'Document'
  isDocumentPreviewOpen.value = true
}

// Document handlers for DocumentSection component
const openDocumentPreview = (doc) => {
  previewDocumentUrl.value = doc.download_url || doc.file_url || doc.url
  previewDocumentName.value = doc.name || doc.filename || doc.file_name || 'Document'
  previewItemId.value = doc.item_id || doc.id || ''
  isDocumentPreviewOpen.value = true
}

// Map API field names to form field names for all categories
const mapApiToFormFields = (apiData, category) => {
  switch (category) {
    case 'basic-information':
      return {
        // Basic Information fields - using exact field names from BasicInformationForm
        // Map API field names to form field names based on actual API response
        nik: apiData.nik || '',
        name: apiData.name || '',
        // Use no_ktp field directly
        no_ktp: apiData.no_ktp || '',
        business_email: apiData.business_email || '',
        private_email: apiData.private_email || '',
        main_phone_number: apiData.main_phone_number || apiData.phone || '',
        secondary_phone_number: apiData.secondary_phone_number || '',
        birth_date: apiData.birth_date || '',
        birth_place: apiData.birth_place || '',
        // FIX: Ensure gender_id is properly mapped - handle numeric IDs correctly
        gender_id: (() => {

          // Priority: gender_id (numeric/string) > gender text mapping > empty
          if (apiData.gender_id !== null && apiData.gender_id !== undefined && apiData.gender_id !== '') {
            return String(apiData.gender_id);
          }

          // Fallback: Try to map from gender text
          if (apiData.gender) {
            const genderMap = {
              'LAKI-LAKI': '1',
              'MALE': '1',
              'L': '1',
              'PEREMPUAN': '2',
              'FEMALE': '2'
            };
            const mappedGender = genderMap[String(apiData.gender).toUpperCase()] || '';
            return mappedGender;
          }

          return '';
        })(),
        marital_status_id: (() => {
          // Return marital_status_id directly if available
          // Note: marital_status_id can be 0 (SINGLE), so we check for !== null and !== undefined
          if (apiData.marital_status_id !== null && apiData.marital_status_id !== undefined) {
            return String(apiData.marital_status_id);
          }
          return '';
        })(),
        religion_id: (() => {

          // Priority: religion_id > religion text mapping > empty
          if (apiData.religion_id !== null && apiData.religion_id !== undefined && apiData.religion_id !== '') {
            return String(apiData.religion_id);
          }

          // Fallback: Try to map from religion text
          if (apiData.religion) {
            const religionMap = {
              'ISLAM': '1',
              'KRISTEN': '2',
              'KATOLIK': '3',
              'HINDU': '4',
              'BUDDHA': '5',
              'KONGHUCU': '6',
              'LAINNYA': '7'
            };
            const mappedReligion = religionMap[String(apiData.religion).toUpperCase()] || '';
            return mappedReligion;
          }

          return '';
        })(),
        nationality_id: (() => {

          // Priority: nationality_id > nationality text mapping > empty
          if (apiData.nationality_id !== null && apiData.nationality_id !== undefined && apiData.nationality_id !== '') {
            return String(apiData.nationality_id);
          }

          // Fallback: Try to map from nationality text
          if (apiData.nationality) {
            const nationalityMap = {
              'INDONESIA': '1',
              'WNI': '1'
            };
            const mappedNationality = nationalityMap[String(apiData.nationality).toUpperCase()] || '';
            return mappedNationality;
          }

          return '';
        })(),
        clothing_size_id: String(apiData.clothing_size_id || ''),
        passport_number: apiData.passport_number || '',
        ktp_doc: apiData.ktp_doc || '',
        professional_photo: apiData.professional_photo || apiData.photo || '',
      };

    case 'address':

      // Use the mapAddress function from dataResolver for consistent mapping
      const mappedData = mapAddress(apiData);

      return mappedData;

    case 'emergency-contact':
      return {
        emergency_contact_name: apiData.emergency_contact_name || apiData.name || '',
        emergency_contact_relationship: apiData.emergency_contact_relationship || apiData.relationship || '',
        emergency_contact_phone: apiData.emergency_contact_phone || apiData.phone_number || '',
        emergency_contact_address: apiData.emergency_contact_address || apiData.address || '',
      };

    case 'payroll-account':
      // Convert string IDs to numbers for bank_id and tax_status_id
      const convertToNumber = (value) => {
        if (value === null || value === undefined || value === '') return undefined;
        const num = Number(value);
        return isNaN(num) ? undefined : num;
      };

      return {
        bank_id: convertToNumber(apiData.bank_id || apiData.bank),
        number_rekening: apiData.number_rekening || apiData.account_number || '',
        holder_name: apiData.holder_name || '',
        tax_status_id: convertToNumber(apiData.tax_status_id || apiData.tax_status),
        npwp: apiData.npwp || '',
        npwp_doc: apiData.npwp_doc || '',
        saving_book_doc: apiData.saving_book_doc || '',
      };

    case 'family':
      return {
        family_name: apiData.family_name || apiData.name || '',
        family_relationship: apiData.family_relationship || apiData.relationship || '',
        family_birth_date: apiData.family_birth_date || apiData.birth_date || '',
        family_gender: apiData.family_gender || apiData.gender || '',
        family_occupation: apiData.family_occupation || apiData.occupation || '',
        family_document: apiData.family_document || '',
        kk_doc: apiData.kk_doc || '',
      };

    case 'education':
      // Education is array data - return as array
      if (Array.isArray(apiData)) {
        return apiData.map(education => ({
          id_education: education.id_education || education.id || '',
          edu_level_id: education.edu_level_id || education.id_edu_level || education.edu_level || '',
          edu_level: education.edu_level || education.education_level || education.level || '',
          edu_major_id: education.edu_major_id || education.id_edu_major || education.edu_major || '',
          edu_major: education.edu_major || education.major || education.field_of_study || '',
          edu_institution_id: education.edu_institution_id || education.id_edu_institution || education.edu_institution || '',
          edu_institution: education.edu_institution || education.institution || education.school_name || '',
          start_date: education.start_date || education.edu_start_date || '',
          end_date: education.end_date || education.edu_end_date || '',
          // Remove ijazah_doc_id and ijazah_doc as they are handled by attachments API
          // ijazah_doc_id: education.ijazah_doc_id || education.ijazah_doc || null,
          // ijazah_doc: education.ijazah_doc || null,
          status: education.status !== undefined ? education.status : 1,
        }));
      }
      return [];

    case 'social-security':
      return {
        no_bpjs_tk: apiData.bpjs_tk_number || apiData.no_bpjs_tk || '',
        bpjs_tk_effective_date: apiData.bpjs_tk_effective_date || '',
        no_bpjs: apiData.bpjs_health_number || apiData.no_bpjs || '',
        bpjs_doc: apiData.bpjs_doc || '',
        no_telkomedika: apiData.no_telkomedika || apiData.telkomedika_card_number || '',
        telkomedika_doc: apiData.telkomedika_doc || '',
      };

    case 'medical-record':
      return {
        // Medical Record fields - using camelCase to match dataResolver.ts
        bloodType: apiData.blood_type || apiData.bloodType || '',
        heightCm: apiData.height || apiData.heightCm || '',
        weightKg: apiData.weight || apiData.weightKg || '',
        headSize: apiData.head_size || apiData.headSize || '',
        healthStatus: (() => {
          // Handle both health_status_id and health_status
          const rawStatus = apiData.health_status_id || apiData.health_status || apiData.healthStatus || '';
          if (!rawStatus) return '';

          // If it's a number (ID), we need to resolve it to label
          if (typeof rawStatus === 'number' || /^\d+$/.test(rawStatus)) {
            // For now, return the ID as string - will be resolved by master data
            return String(rawStatus);
          }

          // Valid health status options
          const validOptions = ['Fit', 'Unfit', 'Under Treatment', 'Requires Monitoring'];

          // Try exact match first
          if (validOptions.includes(rawStatus)) {
            return rawStatus;
          }

          // Try case-insensitive match
          const normalizedValue = String(rawStatus).toLowerCase().trim();
          const match = validOptions.find(option =>
            option.toLowerCase() === normalizedValue
          );

          return match || String(rawStatus);
        })(),
        lastMcuDate: apiData.last_mcu_date || apiData.lastMcuDate || '',
        hasDisability: apiData.has_disability || apiData.hasDisability || false,
        healthConcern: apiData.health_concern || apiData.healthConcern || '',
        medicalTreatmentRecord: apiData.medical_treatment_record || apiData.medicalTreatmentRecord || '',
        vaccinationRecord: apiData.vaccination_record || apiData.vaccinationRecord || '',
        specialConditions: apiData.special_conditions || apiData.specialConditions || '',

        // Additional fields from API response
        nik: apiData.nik || '',
        employeeName: apiData.employee_name || apiData.employeeName || '',
      };

    case 'employment-information':
      // Employment Info is read-only, no field mapping needed
      return {};

    default:
      // Return all fields as-is if category not specified
      return apiData;
  }
};

// Helper: Map Address form fields (used in UI) back to API field names
const mapAddressFormToAPI = (formData) => {
  const apiData = {};
  const acceptedFields = {
    // Official address (KTP)
    'official_address_detail': 'detail_ktp',
    'official_address_province': 'province_ktp_id',
    'official_address_city': 'city_ktp_id',
    'official_address_postal_code': 'postal_code_ktp',
    'official_address_subdistrict': 'sub_distric_ktp',
    'official_address_administrative_village': 'administrative_village_ktp',
    'official_address_rt': 'rt_ktp',
    'official_address_rw': 'rw_ktp',
    'official_address_street': 'street_name_ktp',
    'official_address_house_number': 'house_number_ktp',

    // Domicile address
    'domicile_address_detail': 'detail_domicile',
    'domicile_address_province': 'province_domicile_id',
    'domicile_address_city': 'city_domicile_id',
    'domicile_address_postal_code': 'postal_code_domicile',
    'domicile_address_subdistrict': 'sub_distric_domicile',
    'domicile_address_administrative_village': 'administrative_village_domicile',
    'domicile_address_rt': 'rt_domicile',
    'domicile_address_rw': 'rw_domicile',
    'domicile_address_street': 'street_name_domicile',
    'domicile_address_house_number': 'house_number_domicile'
  };

  Object.keys(acceptedFields).forEach((formField) => {
    if (formData && Object.prototype.hasOwnProperty.call(formData, formField)) {
      const apiField = acceptedFields[formField];
      const value = formData[formField];
      if (['province_ktp_id', 'city_ktp_id', 'province_domicile_id', 'city_domicile_id'].includes(apiField)) {
        apiData[apiField] = value === '' || value === null || value === undefined ? '' : Number(value);
      } else {
        apiData[apiField] = value;
      }
    }
  });

  return apiData;
};

// Load request detail with recursion prevention
const loadRequestDetail = async () => {
  if (loadingFlags.value.loadRequestDetail) {
    return;
  }

  if (!requestId.value) {
    error.value = "Request ID is required";
    return;
  }

  try {
    loadingFlags.value.loadRequestDetail = true;
    isLoadingDetail.value = true;
    error.value = "";

    // Reset basic info loaded flag when reloading
    basicInfoLoaded.value = false;

    if (DEMO_MODE) {
      loadRequests();
      const local = getRequestById(requestId.value);

      if (!local) {
        error.value = "Request not found. Please check your request history.";
        setTimeout(() => {
          navigateTo('/update-data/history');
        }, 2000);
        return;
      }

      const rawLocal = JSON.parse(JSON.stringify(local));
      const normalizedUpdate = (rawLocal.update || 'basic-information')
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/-/g, '_');
      const tabId = normalizedUpdate === 'data_employee' ? 'basic-information' : normalizedUpdate.replace(/_/g, '-');

      // Use shallowRef assignment to prevent deep reactivity
      requestDetail.value = {
        request_id: rawLocal.id || requestId.value,
        status: rawLocal.status || 'draft',
        reason_update: rawLocal.reason_update || '',
        update: normalizedUpdate,
        reviewer: rawLocal.reviewer?.name || rawLocal.reviewer || '',
        date_change: rawLocal.lastUpdated || rawLocal.date_change || null,
        approved_at: rawLocal.approved_at || null,
        changes: rawLocal.changes || {},
        categories: tabId ? [tabId] : [],
        documents: rawLocal.documents || [],
        review_notes: rawLocal.review_notes || (rawLocal.status === 'rejected' ? [
          {
            id: 1,
            content: "Please update your address information with more recent details. The provided address seems outdated.",
            reviewer: "HC Team",
            created_at: new Date().toISOString(),
            type: "revision_request"
          }
        ] : []),
        change_history: rawLocal.change_history || rawLocal.change_request_logs || [],
        change_request_logs: rawLocal.change_request_logs || rawLocal.change_history || [],
      };

      // Set active tab only if not already set

      if (!activeTab.value && requestDetail.value.categories?.length > 0) {
        activeTab.value = requestDetail.value.categories[0];
      } else if (!activeTab.value) {
        // Fallback to basic-information if no categories
        activeTab.value = 'basic-information';
      }
    } else {
      // Load request directly from API endpoint
      try {

        // Gunakan endpoint yang benar sesuai dengan server proxy
        const endpoint = `/employee/change-request/${requestId.value}`;

        const response = await apiGet(endpoint);

        if (response?.data) {
        }

        let apiReq = null;

        if (!response || !response.success || !response.data) {

          const localFallback = getRequestById(requestId.value);
          if (localFallback) {
            apiReq = localFallback;
          } else {
            error.value = 'Request not found';
            return;
          }
        } else {
          // Handle nested response structure from proxy
          if (response.data && response.data.data) {
            // Proxy returns: { success: true, data: { status: true, data: {...} } }
            apiReq = response.data.data;
          } else {
            // Direct response structure
            apiReq = response.data;
          }
        }

        // Process the API response
        if (!apiReq) {
          error.value = 'Request not found'
          return
        }

        // Map numeric/string status to internal string values used by the page
        const statusMap = {
          '1': 'draft',
          1: 'draft',
          '2': 'waiting_approval',
          2: 'waiting_approval',
          '3': 'rejected', // Use 'rejected' consistently for status 3 (needs revision)
          3: 'rejected',
          '4': 'approved',
          4: 'approved',
          '5': 'rejected',
          5: 'rejected',
          'draft': 'draft',
          'waiting_approval': 'waiting_approval',
          'rejected': 'rejected',
          'approved': 'approved'
        }


        const tabId = mapRequestTypeToTab(apiReq.request_type || apiReq.update || apiReq.category)

        // Build a normalized requestDetail that the page expects
        const normalizedStatus = statusMap[apiReq.status] || (apiReq.status || 'draft');

        // FIX: Ensure status_label is properly set for display
        let statusLabel = apiReq.status_label || '';
        if (!statusLabel && apiReq.status) {
          // Map status to label if not provided by API
          const statusToLabelMap = {
            '1': 'Draft',
            1: 'Draft',
            '2': 'Waiting Approval',
            2: 'Waiting Approval',
            '3': 'Need Revision',
            3: 'Need Revision',
            '4': 'Approved',
            4: 'Approved',
            '5': 'Rejected',
            5: 'Rejected',
            'draft': 'Draft',
            'waiting_approval': 'Waiting Approval',
            'rejected': 'Need Revision',
            'approved': 'Approved'
          };
          statusLabel = statusToLabelMap[apiReq.status] || 'Draft';
        }

        // Set categories based on request_type - ensure we always have at least one category
        let categories = [];
        if (tabId) {
          categories = [tabId];
        } else if (apiReq.request_type) {
          // Fallback: try to map request_type directly
          const fallbackTabId = mapRequestTypeToTab(apiReq.request_type);
          categories = fallbackTabId ? [fallbackTabId] : ['basic-information'];
        } else {
          // Default fallback
          categories = ['basic-information'];
        }

        requestDetail.value = {
          request_id: apiReq.code || apiReq.id_change_req || apiReq.id || requestId.value,
          code: apiReq.code || apiReq.request_id || apiReq.id_change_req || requestId.value,
          // canonical status used by the page
          status: normalizedStatus,
          // keep original/raw status value (numeric or original string) for diagnostics and comparisons
          status_raw: apiReq.status,
          // provide a common alias to tolerate usages that expect 'need_revision' vs 'needs_revision'
          status_alias: normalizedStatus === 'needs_revision' ? 'need_revision' : (normalizedStatus === 'need_revision' ? 'needs_revision' : normalizedStatus),
          // Store original status_label from API for display
          status_label: statusLabel,
          reason_update: apiReq.reason_when_waiting || apiReq.reason || apiReq.reason_update || '',
          // Employee change reason
          note_employee: apiReq.note_employee || apiReq.reason || '',
          // Reason when waiting for approval
          reason_when_waiting: apiReq.reason_when_waiting || '',
          update: apiReq.request_type_label || apiReq.update || apiReq.request_type || apiReq.category || tabId,
          request_type: apiReq.request_type || '',
          request_type_label: apiReq.request_type_label || '',
          reviewer: apiReq.reviewer || null,
          request_approver: apiReq.request_approver || (apiReq.data ? apiReq.data.request_approver : null) || null,
          date_change: apiReq.created_date || apiReq.date_change || apiReq.submittedAt || null,
          approved_at: apiReq.status === '4' || apiReq.status === 4 ? (apiReq.updated_date || apiReq.approved_at || null) : null,
          changes: {},
          categories: categories,
          documents: apiReq.attachments || [],
          review_notes: apiReq.review_notes || apiReq.change_history || [],
          // HC latest review note
          note_hc: apiReq.note_hc || '',
          // Store original data for form population
          old_data: apiReq.old_data || {},
          new_data: apiReq.new_data || {},
          // Add change request logs for ChangeHistoryModal
          change_request_logs: apiReq.change_request_logs || apiReq.change_history || [],
          // Add id_change_req for API calls
          id_change_req: apiReq.id_change_req || apiReq.id || requestId.value
        }

        // CRITICAL FIX: Capture original values from API for proper old_data tracking
        // This ensures we have the correct baseline values for comparison when user makes changes

        // If we have old_data from API, use it as the baseline for tracking changes
        if (apiReq.old_data && Object.keys(apiReq.old_data).length > 0) {

          // Check if old_data contains null values - this means the original values weren't captured properly
          const hasNullValues = Object.values(apiReq.old_data).some(value => value === null);

          if (hasNullValues) {

            // FIXED: Load category-specific data to get the real original values
            try {
              if (tabId === 'basic-information') {
                await loadBasicInformation();
              } else if (tabId === 'emergency-contact') {
                await loadEmergencyContact();
              } else if (tabId === 'address') {
                await loadAddress();
              } else if (tabId === 'family') {
                await loadFamily();
              } else if (tabId === 'education') {
                await loadEducation();
              } else if (tabId === 'payroll-account') {
                await loadPayrollAccount();
              } else if (tabId === 'social-security') {
                await loadSocialSecurity();
              } else if (tabId === 'medical-record') {
                await loadMedicalRecord();
              }

              // Merge API old_data with fresh employee data, prioritizing non-null API values
              if (tabId === 'basic-information' && originalEmployeeData.value) {
                const mergedOriginal = { ...originalEmployeeData.value };

                // Override with non-null values from API old_data
                Object.keys(apiReq.old_data).forEach(key => {
                  if (apiReq.old_data[key] !== null) {
                    mergedOriginal[key] = apiReq.old_data[key];
                  }
                });

                // For need revision, also merge with new_data
                const isNeedRevision = apiReq.status === '3' || apiReq.status === 3 ||
                                     (apiReq.status_label && apiReq.status_label.toLowerCase().includes('revision'));

                if (isNeedRevision && apiReq.new_data?.data) {
                  console.log('🟡 NEED REVISION: Merging originalEmployeeData', {
                    mergedOriginal: mergedOriginal,
                    newData: apiReq.new_data.data,
                    result: { ...mergedOriginal, ...apiReq.new_data.data }
                  });
                  originalEmployeeData.value = { ...mergedOriginal, ...apiReq.new_data.data };
                } else {
                  originalEmployeeData.value = mergedOriginal;
                }
              }
            } catch (error) {
              // Fallback to using API old_data as-is even with null values
              if (tabId === 'basic-information') {
                // For need revision, also merge with new_data
                const isNeedRevision = apiReq.status === '3' || apiReq.status === 3 ||
                                     (apiReq.status_label && apiReq.status_label.toLowerCase().includes('revision'));

                if (isNeedRevision && apiReq.new_data?.data) {
                  console.log('🟡 NEED REVISION: Merging originalEmployeeData (fallback)', {
                    oldData: apiReq.old_data,
                    newData: apiReq.new_data.data,
                    result: { ...apiReq.old_data, ...apiReq.new_data.data }
                  });
                  originalEmployeeData.value = { ...apiReq.old_data, ...apiReq.new_data.data };
                } else {
                  originalEmployeeData.value = { ...apiReq.old_data };
                }
              }
            }
          } else {

            // Populate original data from API old_data for proper change tracking
            if (tabId === 'education' && apiReq.old_data.education && Array.isArray(apiReq.old_data.education)) {
              originalEducationData.value = [...apiReq.old_data.education];
              // Enrich with labels for DocumentSection
              await enrichEducationDataWithLabels(originalEducationData.value);
            } else if (tabId === 'education' && Array.isArray(apiReq.old_data)) {
              originalEducationData.value = [...apiReq.old_data];
              // Enrich with labels for DocumentSection
              await enrichEducationDataWithLabels(originalEducationData.value);
            } else {
            }

            // CRITICAL: Always populate original education data if we're on education tab
            if (activeTab.value === 'education') {
              if (apiReq.old_data.education && Array.isArray(apiReq.old_data.education)) {
                originalEducationData.value = [...apiReq.old_data.education];
                // Enrich with labels for DocumentSection
                await enrichEducationDataWithLabels(originalEducationData.value);
              } else if (Array.isArray(apiReq.old_data)) {
                originalEducationData.value = [...apiReq.old_data];
                // Enrich with labels for DocumentSection
                await enrichEducationDataWithLabels(originalEducationData.value);
              } else {
              }
            }

            // API old_data doesn't have null values, use it directly
            if (tabId === 'basic-information' && apiReq.old_data) {
              // For need revision, merge old_data with new_data so component shows current values
              const isNeedRevision = apiReq.status === '3' || apiReq.status === 3 ||
                                   (apiReq.status_label && apiReq.status_label.toLowerCase().includes('revision'));

              if (isNeedRevision && apiReq.new_data?.data) {
                // Merge: old_data as base, new_data takes priority
                originalEmployeeData.value = { ...apiReq.old_data, ...apiReq.new_data.data };
              } else {
                originalEmployeeData.value = { ...apiReq.old_data };
              }
            }
          }
        } else if (apiReq.new_data && apiReq.new_data.data) {
          // If no old_data but we have new_data, we need to try to reconstruct original values
          // For existing requests, the new_data contains the current submitted values
          // We need to load the actual employee data as baseline

          // FIXED: Force load original category-specific data for proper comparison
          try {
            await loadCategoryData(tabId);
          } catch (error) {
          }
        } else {
          // Neither old_data nor new_data available - this is likely a new request

          try {
            await loadCategoryData(tabId);
          } catch (error) {
          }
        }

        // If API provides new_data, use it to populate formData and build a minimal changes object
        if (apiReq.new_data && apiReq.new_data.data) {
          const data = apiReq.new_data.data

          const mapApiToFormFields = (apiData, category) => {
            switch (category) {
              case 'basic-information':
                return {
                  // Basic Information fields - using exact field names from BasicInformationForm
                  // Map API field names to form field names based on actual API response
                  nik: apiData.nik || '',
                  name: apiData.name || '',
                  no_ktp: apiData.no_ktp || '',
                  business_email: apiData.business_email || '',
                  private_email: apiData.private_email || '',
                  main_phone_number: apiData.main_phone_number || apiData.phone || '',
                  secondary_phone_number: apiData.secondary_phone_number || '',
                  birth_date: apiData.birth_date || '',
                  birth_place: apiData.birth_place || '',
                  gender_id: apiData.gender_id || '',
                  marital_status_id: apiData.marital_status_id !== null && apiData.marital_status_id !== undefined ? String(apiData.marital_status_id) : '',
                  religion_id: apiData.religion_id || '',
                  nationality_id: (() => {

                    // Priority: nationality_id (numeric/string) > nationality text mapping > empty
                    if (apiData.nationality_id !== null && apiData.nationality_id !== undefined) {
                      const mappedNationalityId = String(apiData.nationality_id);
                      return mappedNationalityId;
                    }

                    if (apiData.nationality && apiData.nationality !== '' && apiData.nationality !== '-') {
                      const nationalityMap = {
                        'INDONESIA': '1',
                        'WNI': '1'
                      };
                      const mappedNationality = nationalityMap[String(apiData.nationality).toUpperCase()] || '';
                      return mappedNationality;
                    }

                    return '';
                  })(),
                  clothing_size_id: apiData.clothing_size_id || apiData.clothing_size || '',
                  passport_number: apiData.passport_number || '',
                  ktp_doc: apiData.ktp_doc || '',
                  professional_photo: apiData.professional_photo || apiData.photo || '',
                };

              case 'address':
                // Use the mapAddress function from dataResolver for consistent mapping
                const mappedAddressData = mapAddress(apiData);
                return mappedAddressData;

              case 'emergency-contact':
                // FIXED: Emergency contact is array data - return as array
                if (Array.isArray(apiData)) {
                  return apiData.map(contact => ({
                    emgc_name: contact.emgc_name || contact.name || '',
                    emgc_number: contact.emgc_number || '',
                    emgc_address: contact.emgc_address || '',
                    emgc_relationship: contact.emgc_relationship || '',
                    emgc_relationship_id: contact.emgc_relationship_id || '',
                    id_contact: contact.id_contact || '',
                    status: contact.status !== undefined ? contact.status : 1,
                    // FIXED: Set active based on status
                    active: contact.status === 1
                  }));
                }
                return [];

              case 'payroll-account':
                // Convert string IDs to numbers for bank_id and tax_status_id
                const convertToNumber = (value) => {
                  if (value === null || value === undefined || value === '') return undefined;
                  const num = Number(value);
                  return isNaN(num) ? undefined : num;
                };

                return {
                  // Payroll Account fields - using exact field names from PayrollAccountForm
                  bank_id: convertToNumber(apiData.bank_id || apiData.bank),
                  number_rekening: apiData.number_rekening || apiData.account_number || '',
                  holder_name: apiData.holder_name || apiData.account_holder_name || '',
                  tax_status_id: convertToNumber(apiData.tax_status_id || apiData.tax_status),
                  npwp: apiData.npwp || '',
                  npwp_doc: apiData.npwp_doc || '',
                  saving_book_doc: apiData.saving_book_doc || '',
                };

              case 'family':
                // FIXED: Family is array data - return as array
                if (Array.isArray(apiData)) {
                  return apiData.map(member => ({
                    name: member.name || '',
                    birth_place: member.birth_place || '',
                    birth_date: member.birth_date || '',
                    address: member.address || '',
                    occupation: member.occupation || '',
                    relation_id: member.relation_id || member.relation || '',
                    relation: member.relation || '',
                    marital_status_id: member.marital_status_id !== null && member.marital_status_id !== undefined ? String(member.marital_status_id) : '',
                    marital_status: (() => {
                      // If we have marital_status text, use it
                      if (member.marital_status) {
                        return member.marital_status;
                      }

                      // If we have marital_status_id but no text, map it
                      const maritalStatusId = member.marital_status_id;
                      if (maritalStatusId !== null && maritalStatusId !== undefined && maritalStatusId !== '') {
                        const maritalStatusMap = {
                          '0': 'SINGLE',
                          '1': 'MARRIED',
                          '2': 'DIVORCED',
                          '3': 'WIDOWED'
                        };
                        return maritalStatusMap[String(maritalStatusId)] || '';
                      }

                      return '';
                    })(),
                    gender_id: member.gender_id || '',
                    gender: member.gender || '',
                    member_sequence: member.member_sequence || '',
                    no_telkomedika: member.no_telkomedika || '',
                    member_status: member.member_status !== undefined ? member.member_status : 1,
                    kk_doc: member.kk_doc || '',
                    status: member.status !== undefined ? member.status : 1,
                    id_family: member.id_family || member.id || ''
                  }));
                }
                return [];

              case 'education':
                // Education is array data - map to match API structure
                if (Array.isArray(apiData)) {
                  return apiData.map(education => ({
                    id_education: education.id_education || education.id || '',
                    edu_level_id: education.edu_level_id || education.id_edu_level || education.edu_level || '',
                    edu_level: education.edu_level || education.education_level || education.level || '',
                    edu_major_id: education.edu_major_id || education.id_edu_major || education.edu_major || '',
                    edu_major: education.edu_major || education.major || education.field_of_study || '',
                    edu_institution_id: education.edu_institution_id || education.id_edu_institution || education.edu_institution || '',
                    edu_institution: education.edu_institution || education.institution || education.school_name || '',
                    start_date: education.start_date || education.edu_start_date || '',
                    end_date: education.end_date || education.edu_end_date || '',
                    // Remove ijazah_doc_id and ijazah_doc as they are handled by attachments API
                    // ijazah_doc_id: education.ijazah_doc_id || education.ijazah_doc || null,
                    // ijazah_doc: education.ijazah_doc || null,
                    status: education.status !== undefined ? education.status : 1,
                  }));
                }
                return [];

              case 'social-security':
                return {
                  // Benefit fields - mapping API field names to form field names
                  no_bpjs_tk: apiData.bpjs_tk_number || apiData.no_bpjs_tk || '',
                  bpjs_tk_effective_date: apiData.bpjs_tk_effective_date || '',
                  no_bpjs: apiData.bpjs_health_number || apiData.no_bpjs || '',
                  bpjs_doc: apiData.bpjs_doc || '',
                  no_telkomedika: apiData.no_telkomedika || apiData.telkomedika_card_number || '',
                  telkomedika_doc: apiData.telkomedika_doc || '',
                };

              case 'medical-record':
                return {
                  // Medical Record fields - using form field names to match MedicalRecordForm.vue
                  blood_type_id: apiData.blood_type_id || apiData.blood_type || apiData.bloodType || '',
                  height: apiData.height || apiData.heightCm || '',
                  weight: apiData.weight || apiData.weightKg || '',
                  head_size: apiData.head_size || apiData.headSize || '',
                  health_status_id: apiData.health_status_id || apiData.health_status || apiData.healthStatus || '',
                  last_mcu_date: apiData.last_mcu_date || apiData.lastMcuDate || '',
                  has_disability_id: apiData.has_disability_id || apiData.has_disability || apiData.hasDisability || false,
                  health_concern: apiData.health_concern || apiData.healthConcern || '',
                  medical_treatment_record: apiData.medical_treatment_record || apiData.medicalTreatmentRecord || '',
                  vaccination_record: apiData.vaccination_record || apiData.vaccinationRecord || '',
                  special_conditions: apiData.special_conditions || apiData.specialConditions || '',

                  // Additional fields from API response
                  nik: apiData.nik || '',
                  employee_name: apiData.employee_name || apiData.employeeName || '',
                };

              case 'employment-information':
                // Employment Info is read-only, no field mapping needed
                return {};

              default:
                // Return all fields as-is if category not specified
                return apiData;
            }
          };

          // For draft status, combine old_data and new_data to show complete form
          if (apiReq.status === '1' || apiReq.status === 1) { // Draft status

            // Start with old_data as base and map to form fields
            let combinedData = mapApiToFormFields(apiReq.old_data || {}, tabId);

            // Check if we have existing changes in the draft for current tab
            const existingChanges = apiReq.changes || {};
            const tabKeyForChanges = tabId.replace(/-/g, '_') + 'Data';
            const currentTabChanges = existingChanges[tabKeyForChanges];

            // Use original data from usePersonalData composables for filling missing fields
            let originalDataForTab = null;

            switch (tabId) {
              case 'basic-information':
                originalDataForTab = originalEmployeeData.value;
                break;
              case 'address':
                originalDataForTab = originalAddressData.value;
                break;
              case 'emergency-contact':
                originalDataForTab = originalEmergencyContactData.value;
                break;
              case 'payroll-account':
                originalDataForTab = originalPayrollAccountData.value;
                break;
              case 'family':
                originalDataForTab = originalFamilyData.value;
                break;
              case 'education':
                originalDataForTab = originalEducationData.value;
                break;
              case 'social-security':
                originalDataForTab = originalSocialSecurityData.value;
                break;
              case 'medical-record':
                originalDataForTab = originalMedicalRecordData.value;
                break;
            }

            if (originalDataForTab) {

              // For array data (emergency-contact, family, education)
              if (Array.isArray(originalDataForTab)) {

                // For array data, we need to merge original data with old_data properly
                if (!Array.isArray(combinedData) || combinedData.length === 0) {
                  combinedData = [...originalDataForTab];
                } else {

                  // Create a map of original data by ID for efficient lookup
                  const originalMap = new Map();
                  originalDataForTab.forEach(item => {
                    const id = item.id_contact || item.id || item.id_education;
                    if (id) {
                      originalMap.set(id, item);
                    }
                  });

                  // Merge old_data with original data
                  const mergedArray = combinedData.map(oldItem => {
                    const id = oldItem.id_contact || oldItem.id || oldItem.id_education;
                    const originalItem = originalMap.get(id);

                    if (originalItem) {
                      // Merge original data with old_data, prioritizing old_data for non-empty values
                      const mergedItem = { ...originalItem };
                      Object.keys(oldItem).forEach(key => {
                        const oldValue = oldItem[key];
                        if (oldValue !== null && oldValue !== undefined && oldValue !== '') {
                          mergedItem[key] = oldValue;
                        }
                      });
                      return mergedItem;
                    } else {
                      // If no original item found, use old_item as is
                      return oldItem;
                    }
                  });

                  // Add any original items that weren't in old_data
                  const oldIds = new Set(combinedData.map(item => item.id_contact || item.id || item.id_education));
                  originalDataForTab.forEach(originalItem => {
                    const id = originalItem.id_contact || originalItem.id || originalItem.id_education;
                    if (id && !oldIds.has(id)) {
                      mergedArray.push(originalItem);
                    }
                  });

                  combinedData = mergedArray;
                }
              } else {

                // For object data, priority: old_data -> original data (fill missing fields only)
                let filledFields = 0;
                Object.keys(originalDataForTab).forEach(key => {
                  const currentValue = combinedData[key];
                  const isEmpty = currentValue === null || currentValue === undefined || currentValue === '' || currentValue === '-';

                  if (isEmpty) {
                    combinedData[key] = originalDataForTab[key];
                    filledFields++;
                  } else {
                  }
                });
              }

            } else {
            }

            // Priority for draft: existing changes > new_data > combined base data
            let finalChanges = null;

            // 1. First check if we have existing changes in the draft for current tab
            if (currentTabChanges && currentTabChanges.new) {
              finalChanges = mapApiToFormFields(currentTabChanges.new, tabId);
            }
            // 2. Fallback to new_data if no existing changes
            else if (apiReq.new_data && apiReq.new_data.data) {
              finalChanges = mapApiToFormFields(apiReq.new_data.data, tabId);
            }

            // Apply the changes to combined data
            if (finalChanges) {

              // For array data (emergency-contact, family, education), merge changes with combined data
              if (Array.isArray(combinedData) && Array.isArray(finalChanges)) {

                // Create a map of changes by ID for efficient lookup
                const changesMap = new Map();
                finalChanges.forEach(changeItem => {
                  const id = changeItem.id_contact || changeItem.id || changeItem.id_education;
                  if (id) {
                    changesMap.set(id, changeItem);
                  }
                });

                // Apply changes to combined data
                const finalArray = combinedData.map(combinedItem => {
                  const id = combinedItem.id_contact || combinedItem.id || combinedItem.id_education;
                  const changeItem = changesMap.get(id);

                  if (changeItem) {
                    // Merge combined item with changes, prioritizing changes for non-empty values
                    const mergedItem = { ...combinedItem };
                    Object.keys(changeItem).forEach(key => {
                      const changeValue = changeItem[key];
                      if (changeValue !== null && changeValue !== undefined && changeValue !== '') {
                        mergedItem[key] = changeValue;
                      }
                    });
                    return mergedItem;
                  } else {
                    // If no changes found, use combined item as is
                    return combinedItem;
                  }
                });

                // Add any new items from changes that weren't in combined data
                const combinedIds = new Set(combinedData.map(item => item.id_contact || item.id || item.id_education));
                finalChanges.forEach(changeItem => {
                  const id = changeItem.id_contact || changeItem.id || changeItem.id_education;
                  if (!id || !combinedIds.has(id)) {
                    // This is a new item (no ID or not in combined data)
                    finalArray.push(changeItem);
                  }
                });

                combinedData = finalArray;
              } else {
                // For object data, only override with changes if the values are not null/empty
                Object.keys(finalChanges).forEach(key => {
                  if (finalChanges[key] !== null && finalChanges[key] !== undefined && finalChanges[key] !== '' && finalChanges[key] !== '-') {
                    combinedData[key] = finalChanges[key];
                  }
                });

                // Ensure select fields exist and are string IDs (for master-data binding)
                if (tabId === 'basic-information') {
                  const toStringOrEmpty = (v) => (v === 0 || v === '0' || (v !== null && v !== undefined && v !== '' && v !== '-')) ? String(v) : '';
                  combinedData.gender_id = toStringOrEmpty(finalChanges.gender_id ?? combinedData.gender_id ?? originalEmployeeData.value?.gender_id);
                  combinedData.marital_status_id = toStringOrEmpty(finalChanges.marital_status_id ?? combinedData.marital_status_id ?? originalEmployeeData.value?.marital_status_id);
                  combinedData.religion_id = toStringOrEmpty(finalChanges.religion_id ?? combinedData.religion_id ?? originalEmployeeData.value?.religion_id);
                }
              }

            }

            // Set formData with combined data
            setFormDataSafely(combinedData);
          } else {
            const mappedData = mapApiToFormFields(data, tabId);
            setFormDataSafely(mappedData);
          }

          // Compose changes object keyed by tab-like name matching existing demo format
          const tabKey = (tabId || 'basic-information').replace(/-/g, '_') + 'Data'
          requestDetail.value.changes = {
            [tabKey]: {
              old: mapApiToFormFields(apiReq.old_data || {}, tabId),
              new: mapApiToFormFields(data, tabId)
            }
          }
        } else if (apiReq.data) {
          // Fallback: if API provides data directly (not nested in new_data)
          const data = apiReq.data;

          // For draft status, combine old_data and new_data to show complete form
          if (apiReq.status === '1' || apiReq.status === 1) { // Draft status

            // Start with old_data as base and map to form fields
            let combinedData = mapApiToFormFields(apiReq.old_data || {}, tabId);

            // Check if we have existing changes in the draft for current tab
            const existingChanges = apiReq.changes || {};
            const tabKeyForChanges = tabId.replace(/-/g, '_') + 'Data';
            const currentTabChanges = existingChanges[tabKeyForChanges];

            // Use original data from usePersonalData composables for filling missing fields (fallback)
            let originalDataForTab = null;

            switch (tabId) {
              case 'basic-information':
                originalDataForTab = originalEmployeeData.value;
                break;
              case 'address':
                originalDataForTab = originalAddressData.value;
                break;
              case 'emergency-contact':
                originalDataForTab = originalEmergencyContactData.value;
                break;
              case 'payroll-account':
                originalDataForTab = originalPayrollAccountData.value;
                break;
              case 'family':
                originalDataForTab = originalFamilyData.value;
                break;
              case 'education':
                originalDataForTab = originalEducationData.value;
                break;
              case 'social-security':
                originalDataForTab = originalSocialSecurityData.value;
                break;
              case 'medical-record':
                originalDataForTab = originalMedicalRecordData.value;
                break;
              case 'employment-information':
                originalDataForTab = originalEmploymentInfoData.value;
                break;
            }

            if (originalDataForTab) {

              // For array data (emergency-contact, family, education)
              if (Array.isArray(originalDataForTab)) {

                // If old_data doesn't have array data or is empty, use original
                if (!Array.isArray(combinedData) || combinedData.length === 0) {
                  combinedData = [...originalDataForTab];
                } else {
                }
              } else {

                // For object data, priority: old_data -> original data (fill missing fields only)
                let filledFields = 0;
                Object.keys(originalDataForTab).forEach(key => {
                  const currentValue = combinedData[key];
                  const isEmpty = currentValue === null || currentValue === undefined || currentValue === '' || currentValue === '-';

                  if (isEmpty) {
                    combinedData[key] = originalDataForTab[key];
                    filledFields++;
                  } else {
                  }
                });
              }
            } else {
            }

            // Priority for draft: existing changes > new_data > combined base data (fallback)
            let finalChanges = null;

            // 1. First check if we have existing changes in the draft for current tab
            if (currentTabChanges && currentTabChanges.new) {
              finalChanges = mapApiToFormFields(currentTabChanges.new, tabId);
            }
            // 2. Fallback to new_data if no existing changes
            else if (apiReq.new_data && apiReq.new_data.data) {
              finalChanges = mapApiToFormFields(apiReq.new_data.data, tabId);
            }
            // 3. Final fallback to data directly
            else if (data) {
              finalChanges = mapApiToFormFields(data, tabId);
            }

            // Apply the changes to combined data
            if (finalChanges) {

              // Only override with changes if the values are not null/empty
              Object.keys(finalChanges).forEach(key => {
                if (finalChanges[key] !== null && finalChanges[key] !== undefined && finalChanges[key] !== '' && finalChanges[key] !== '-') {
                  combinedData[key] = finalChanges[key];
                }
              });
            }

            // Set formData with combined data
            setFormDataSafely(combinedData);
          } else {
            const mappedData = mapApiToFormFields(data, tabId);
            setFormDataSafely(mappedData);
          }

          // Compose changes object
          const tabKey = (tabId || 'basic-information').replace(/-/g, '_') + 'Data'
          requestDetail.value.changes = {
            [tabKey]: {
              old: mapApiToFormFields(apiReq.old_data || {}, tabId),
              new: mapApiToFormFields(data, tabId)
            }
          }
        } else {
        }

        // Set reason/consent values if present
        if (apiReq.reason) changeReason.value = apiReq.reason
        if (apiReq.reason_when_waiting) changeReason.value = apiReq.reason_when_waiting
        if (typeof apiReq.consent !== 'undefined') consent.value = !!apiReq.consent

        // Set active tab

        if (!activeTab.value && requestDetail.value.categories?.length > 0) {
          activeTab.value = requestDetail.value.categories[0]
        } else if (!activeTab.value) {
          // Fallback to basic-information if no categories
          activeTab.value = 'basic-information';
        } else {
        }

        // SUCCESS: Request detail loaded successfully

        // Set flag for draft data loading if this is a draft
        const isDraftStatus = requestDetail.value.status === 'draft' || requestDetail.value.status === '1';
        if (isDraftStatus) {
          window.isDraftDataLoading = true;
        }

        // Force reactivity trigger
        await nextTick();

        // Load category data for the active tab to populate form fields
        if (activeTab.value) {
          // Use the tab name as-is for API calls (e.g., basic-information)
          const apiCategory = activeTab.value;
          await loadCategoryData(apiCategory);
        }

      } catch (apiErr) {
        // API error handled
        error.value = 'Failed to load request details from server'
        return
      }
    }
  } catch (e) {
    error.value = "An error occurred while loading request details";
  } finally {
    // Fetch missing address data if needed (for address tab with null old_data)
    if (requestDetail.value) {
      fetchMissingAddressData();
    }
    isLoadingDetail.value = false;
    loadingFlags.value.loadRequestDetail = false;

    // Force a reactive update
    await nextTick();
  }
};

// Load category data with recursion prevention and better debouncing
let categoryLoadTimeout = null;
const loadCategoryData = async (category) => {
  try {
    isLoadingCategoryData.value = true;

    // For draft status, still load category data to ensure we have complete base data
    // This helps fill missing fields that might not be in the draft changes
    if (requestDetail.value?.status === 'draft' && formData.value && Object.keys(formData.value).length > 0) {
      // Continue to load category data instead of returning early
    }

    // First, call the composable load functions to ensure original data is populated
    // This is crucial for draft status where we need to merge new_data with original data
    if (category === 'emergency-contact') {
      await loadEmergencyContact();
    } else if (category === 'family') {
      await loadFamily();
    } else if (category === 'education') {
      await loadEducation();
    } else if (category === 'basic-information') {
      await loadBasicInformation();
    } else if (category === 'address') {
      await loadAddress();
    } else if (category === 'payroll-account') {
      await loadPayrollAccount();
    } else if (category === 'social-security') {
      await loadSocialSecurity();
    } else if (category === 'medical-record') {
      await loadMedicalRecord();
      // Load medical dropdown options for health status and blood type
      await loadMedicalMasterOptions();
    }

    // ✅ FIX DUPLIKASI: Gunakan data dari composable yang sudah di-load (tidak perlu hit API lagi)
    // Composable load functions di atas sudah melakukan API request dan mapping
    let rawData = null;

    if (category === 'basic-information') {
      rawData = originalEmployeeData.value || employeeData.value;
    } else if (category === 'address') {
      rawData = originalAddressData.value || addressData.value;
    } else if (category === 'emergency-contact') {
      rawData = originalEmergencyContactData.value || emergencyContactData.value;
    } else if (category === 'payroll-account') {
      rawData = originalPayrollAccountData.value || payrollAccountData.value;
    } else if (category === 'family') {
      rawData = originalFamilyData.value || familyData.value;
    } else if (category === 'education') {
      rawData = originalEducationData.value || educationData.value;
    } else if (category === 'social-security') {
      rawData = originalSocialSecurityData.value || socialSecurityData.value;
    } else if (category === 'medical-record') {
      rawData = originalMedicalRecordData.value || medicalRecordData.value;
    }

    if (rawData) {
      let dataToAssign = rawData;
      if (category === 'address') {
        // Address data sudah di-map oleh composable, tapi perlu mapping ulang untuk form fields
        const mappedAddressData = mapApiToFormFields(rawData, 'address');
        dataToAssign = { ...defaultAddressFields, ...mappedAddressData };
      } else if (category === 'emergency-contact') {
        // Emergency contact data dari composable sudah dalam bentuk array
        const emergencyContacts = Array.isArray(rawData) ? rawData : [];
        const mappedEmergencyData = mapApiToFormFields(emergencyContacts, 'emergency-contact');

        // For edit page, filter to only include contacts that are in new_data
        const newData = requestDetail.value?.new_data?.data;

        // ✅ FIX: For action "insert" (new record), use new_data directly
        if (requestDetail.value?.new_data?.action === 'insert' && newData && Array.isArray(newData)) {
          dataToAssign = newData.map(item => ({ ...item, _isEdited: true }));
        } else {
          const editedContactIds = newData && Array.isArray(newData)
            ? new Set(newData.map(item => item.id_contact).filter(id => id))
            : new Set();

          if (editedContactIds.size > 0 && Array.isArray(mappedEmergencyData)) {
            dataToAssign = mappedEmergencyData.filter(contact =>
              contact.id_contact && editedContactIds.has(contact.id_contact)
            );
          } else {
            dataToAssign = Array.isArray(mappedEmergencyData) ? mappedEmergencyData : [];
          }
        }
      } else if (category === 'education') {
        // Map API education data to form fields
        // API structure: { data: { education_records: [...] } }
        const educationRecords = response.data?.education_records || response.data || [];

        const mappedEducationData = mapApiToFormFields(educationRecords, 'education');
        // EducationForm expects { education_records: [...] } structure
        dataToAssign = {
          education_records: Array.isArray(mappedEducationData) ? mappedEducationData : []
        };
      } else if (category === 'family') {
        // Map API family data to form fields
        // API structure: { data: { family_members: [...] } } or { data: [...] }
        const familyMembers = response.data?.family_members || response.data || [];
        const mappedFamilyData = mapApiToFormFields(familyMembers, 'family');

        // For edit page, filter to only include family members that are in new_data
        const newData = requestDetail.value?.new_data?.data;
        const editedFamilyIds = newData && Array.isArray(newData)
          ? new Set(newData.map(item => item.id_family || item.id).filter(id => id))
          : new Set();

        if (editedFamilyIds.size > 0 && Array.isArray(mappedFamilyData)) {
          dataToAssign = mappedFamilyData.filter(member =>
            (member.id_family || member.id) && editedFamilyIds.has(member.id_family || member.id)
          );
        } else {
          dataToAssign = Array.isArray(mappedFamilyData) ? mappedFamilyData : [];
        }
      }

      // For draft status, merge with priority: existing formData (new_data) -> originalEmployeeData -> category data (original) -> empty
      if (requestDetail.value?.status === 'draft' && formData.value && Object.keys(formData.value).length > 0) {

        // Start with category data, then originalEmployeeData, then existing form data
        let mergedData = { ...dataToAssign };

        // For basic-information, use originalEmployeeData which has proper mapping
        if (category === 'basic-information' && originalEmployeeData.value) {

          // Override category data with originalEmployeeData which has proper ID mapping
          Object.keys(originalEmployeeData.value).forEach(key => {
            const originalValue = originalEmployeeData.value[key];
            if (originalValue !== null && originalValue !== undefined && originalValue !== '' && originalValue !== '-') {
              mergedData[key] = originalValue;
            }
          });
        }

        // For address, use originalAddressData if available
        if (category === 'address' && originalAddressData.value) {

          // Map original address data to form fields
          const mappedOriginalAddress = mapApiToFormFields(originalAddressData.value, 'address');
          Object.keys(mappedOriginalAddress).forEach(key => {
            const originalValue = mappedOriginalAddress[key];
            if (originalValue !== null && originalValue !== undefined && originalValue !== '' && originalValue !== '-') {
              mergedData[key] = originalValue;
            }
          });
        }

        // For emergency-contact, filter based on new_data id_contact
        if (category === 'emergency-contact') {
          // Get id_contacts from new_data to filter
          const newData = requestDetail.value?.new_data?.data;

          // ✅ FIX: For action "insert" (new record), use new_data directly
          if (requestDetail.value?.new_data?.action === 'insert' && newData && Array.isArray(newData)) {
            mergedData = newData.map(item => ({ ...item, _isEdited: true }));
          } else {
            const editedContactIds = newData && Array.isArray(newData)
              ? new Set(newData.map(item => item.id_contact).filter(id => id))
              : new Set();

            if (editedContactIds.size > 0) {
              // Filter originalEmergencyContactData or emergencyContactData to only include edited contacts
              const sourceData = originalEmergencyContactData.value || emergencyContactData.value || [];
              mergedData = sourceData.filter(contact =>
                contact.id_contact && editedContactIds.has(contact.id_contact)
              );
            } else {
              // No edited contacts, use empty array
              mergedData = [];
            }
          }
        } else if (category === 'education' && originalEducationData.value) {

          // For array data, merge with existing data
          if (Array.isArray(originalEducationData.value) && originalEducationData.value.length > 0) {
            mergedData = { education_records: [...originalEducationData.value] };
          }
        } else if (category === 'education' && educationData.value) {

          // For edit mode, don't use all educationData
          // Let dynamicFormData handle filtering to show only edited records
          mergedData = { education_records: [] };
        } else if (category === 'family') {
          // For family, filter based on new_data id_family
          const newData = requestDetail.value?.new_data?.data;
          const editedFamilyIds = newData && Array.isArray(newData)
            ? new Set(newData.map(item => item.id_family || item.id).filter(id => id))
            : new Set();

          if (editedFamilyIds.size > 0) {
            // Filter originalFamilyData or familyData to only include edited family members
            const sourceData = originalFamilyData.value || familyData.value || [];
            mergedData = sourceData.filter(member =>
              (member.id_family || member.id) && editedFamilyIds.has(member.id_family || member.id)
            );
          } else {
            // No edited family members, use empty array
            mergedData = [];
          }
        }

        // Finally override with existing form data (user changes)
        Object.keys(formData.value).forEach(key => {
          const existingValue = formData.value[key];
          if (existingValue !== null && existingValue !== undefined && existingValue !== '' && existingValue !== '-') {
            mergedData[key] = existingValue;
          }
        });

        setFormDataSafely(mergedData);

        // Store the loaded data to original data for future reference
        // For edit page, don't store all original data - only store what's needed for comparison
        if (category === 'emergency-contact' && Array.isArray(dataToAssign) && dataToAssign.length > 0) {
          // Only store data that was originally in the request, not all employee data
          if (requestDetail.value?.old_data && Array.isArray(requestDetail.value.old_data)) {
            originalEmergencyContactData.value = [...requestDetail.value.old_data];
          } else {
            // If no old_data, store empty array to prevent showing all data
            originalEmergencyContactData.value = [];
          }
        }
      } else {
        // For non-draft status, use original data if available
        if (category === 'basic-information' && originalEmployeeData.value) {
          assignFormData(originalEmployeeData.value);
        } else if (category === 'address' && originalAddressData.value) {
          const mappedOriginalAddress = mapApiToFormFields(originalAddressData.value, 'address');
          assignFormData({ ...defaultAddressFields, ...mappedOriginalAddress });
        } else if (category === 'emergency-contact' && originalEmergencyContactData.value) {
          // For edit page, don't assign all original data - let dynamicFormData handle filtering
        } else if (category === 'emergency-contact' && emergencyContactData.value) {
          // For edit page, don't assign all original data - let dynamicFormData handle filtering
        } else if (category === 'education' && originalEducationData.value) {
          // For edit page, don't assign all original data - let dynamicFormData handle filtering
        } else if (category === 'education' && educationData.value) {
          // For edit page, don't assign all original data - let dynamicFormData handle filtering
        } else if (category === 'family' && originalFamilyData.value) {
          // For edit page, don't assign all original data - let dynamicFormData handle filtering
        } else if (category === 'family' && familyData.value) {
          // For edit page, don't assign all original data - let dynamicFormData handle filtering
        } else {
          assignFormData(dataToAssign);

          // Store the loaded data to original data for future reference
          // For edit page, don't store all original data - only store what's needed for comparison
          if (category === 'emergency-contact' && Array.isArray(dataToAssign) && dataToAssign.length > 0) {
            // Only store data that was originally in the request, not all employee data
            if (requestDetail.value?.old_data && Array.isArray(requestDetail.value.old_data)) {
              originalEmergencyContactData.value = [...requestDetail.value.old_data];
            } else {
              // If no old_data, store empty array to prevent showing all data
              originalEmergencyContactData.value = [];
            }
          } else if (category === 'education' && dataToAssign && dataToAssign.education_records && Array.isArray(dataToAssign.education_records) && dataToAssign.education_records.length > 0) {
            originalEducationData.value = [...dataToAssign.education_records];
          } else if (category === 'family' && Array.isArray(dataToAssign) && dataToAssign.length > 0) {
            originalFamilyData.value = [...dataToAssign];
          } else if (category === 'social-security' && dataToAssign && Object.keys(dataToAssign).length > 0) {
            originalSocialSecurityData.value = { ...dataToAssign };
          }
        }
      }
    } else {
      // Handle empty response case
      if (category === 'address') {
        assignFormData(defaultAddressFields);
      } else if (category === 'emergency-contact') {
        assignFormData([]);
      } else if (category === 'education') {
        assignFormData([]);
      } else if (category === 'family') {
        assignFormData([]);
      } else {
        assignFormData({});
      }
    }
  } catch (error) {
    // Don't show error for category data loading, just use empty data
    if (category === 'address') {
      assignFormData(defaultAddressFields);
    } else if (category === 'emergency-contact') {
      assignFormData([]);
    } else if (category === 'education') {
      assignFormData([]);
    } else if (category === 'family') {
      assignFormData([]);
    } else {
      assignFormData({});
    }
  } finally {
    isLoadingCategoryData.value = false;
  }
};

// Get document icon based on type
const getDocumentIcon = (type) => {
  const icons = {
    pdf: "pi-file-pdf",
    jpg: "pi-image",
    jpeg: "pi-image",
    png: "pi-image",
  };
  return icons[type?.toLowerCase()] || "pi-file";
};

// Load edited/revised data from API
const loadEditedData = async () => {
  if (DEMO_MODE) return false;
  try {
    const endpoint = `/employee/change-request/${requestId.value}`;
    const response = await apiGet(endpoint);
    if (response?.success && response.data?.changes) {
      setFormDataSafely({ ...response.data.changes });
      return true;
    }
  } catch (error) {
  }
  return false;
};

// Global flag to prevent duplicate attachment uploads
let isUploadingAttachments = false;

// Handle save changes (for auto-save during submit)
const handleSaveChanges = async () => {
  const timestamp = Date.now();
  console.log('🔍 handleSaveChanges called for tab:', activeTab.value);
  console.log('🔍 handleSaveChanges - requestId:', requestId.value);
  console.log('🔍 handleSaveChanges - isSubmitting:', isSubmitting.value);

  // For education category, use handleSaveAsDraft instead to avoid duplication
  if (activeTab.value === 'education') {
    console.log('🔍 handleSaveChanges - Skipping education tab');
    return;
  }

  if (!requestId.value || isSubmitting.value) {
    console.log('🔍 handleSaveChanges - Exiting early: no requestId or already submitting');
    return;
  }
  isSubmitting.value = true;

  try {
    // Check for pending uploads in education data
    if (activeTab.value === 'education') {
      const dataToCheck = Array.isArray(formData.value) ? formData.value : (Array.isArray(dynamicFormData.value) ? dynamicFormData.value : []);
      dataToCheck.forEach((record, index) => {
      });
    }

    // Get only changed fields using getChangedFieldsOnly
    console.log('🔍 handleSaveChanges - About to call getChangedFieldsOnly()');
    const changedData = getChangedFieldsOnly();
    console.log('🔍 handleSaveChanges - getChangedFieldsOnly() returned:', changedData);

    // Check if there are any changes
    const isArrayTab = ['family', 'education', 'emergency-contact'].includes(activeTab.value);
    const currentArrayData = Array.isArray(dynamicFormData.value) ? dynamicFormData.value : [];
    if (!isArrayTab) {
      if (!changedData.newData || Object.keys(changedData.newData).length === 0) {
        toastInfo("Tidak ada perubahan untuk disimpan");
        return;
      }
    } else {
      // For array tabs, allow saving if the current form holds items even when changedData is empty
      const hasChangedData = changedData.newData && Object.keys(changedData.newData).length > 0;
      if (!hasChangedData && currentArrayData.length === 0) {
        toastInfo("Tidak ada perubahan untuk disimpan");
        return;
      }
    }

    // Additional check for array-based tabs to ensure they have data
    if (isArrayTab) {
      const tabKey = activeTab.value.replace('-', '_');
      const arrayData = changedData.newData ? changedData.newData[tabKey] : undefined;
      const finalArrayCandidate = Array.isArray(arrayData) && arrayData.length > 0 ? arrayData : currentArrayData;
      if (!finalArrayCandidate || finalArrayCandidate.length === 0) {
        toastInfo("Tidak ada perubahan untuk disimpan. Silakan lakukan perubahan terlebih dahulu.");
        return;
      }
    }

    // Get request type from active tab
    const getRequestTypeFromTab = (tab) => {
      const typeMap = {
        'basic-information': 'BSC',
        'address': 'ADR',
        'emergency-contact': 'EMC',
        'family': 'FMY',
        'education': 'EDC',
        'employment-info': 'EMP',
        'social-security': 'SSI',
        'payroll-account': 'PYR',
        'medical-record': 'MDR'
      };
      return typeMap[tab] || 'BSC';
    };

    const requestType = getRequestTypeFromTab(activeTab.value);

    // For draft: keep cumulative changes for most tabs, but use only changed fields for address and basic-information
    const previousChanges = requestDetail.value?.new_data?.data || {};
    console.log(`🔍 handleSaveChanges - previousChanges from requestDetail:`, previousChanges);

    const finalNewData = (() => {
      if (activeTab.value === 'address' || activeTab.value === 'basic-information') {
        // Use the already filtered changedData.newData directly (it already contains only changed fields)
        console.log(`🔍 ${activeTab.value} - Using only changed fields:`, changedData.newData);
        return changedData.newData;
      }
      const merged = { ...previousChanges, ...changedData.newData };
      console.log(`🔍 ${activeTab.value} - Merging with previous changes:`, merged);
      return merged;
    })();

    console.log(`🔍 handleSaveChanges - finalNewData before array handling:`, finalNewData);
    console.log(`🔍 handleSaveChanges - changedData from getChangedFieldsOnly:`, changedData);

    // CRITICAL FIX: For array-based categories (EMC, FMY, EDC), ensure data is array
    const arrayBasedTabs = ['emergency-contact', 'family', 'education'];
    let finalData = finalNewData;

    if (arrayBasedTabs.includes(activeTab.value)) {
      // For array tabs, use ONLY the changed fields from getChangedFieldsOnly
      const tabKey = activeTab.value.replace('-', '_');

      console.log(`🔍 handleSaveChanges - Looking for ${tabKey} in changedData.newData:`, changedData.newData);

      // Use changedData.newData directly (it already contains only changed fields)
      if (changedData.newData && changedData.newData[tabKey] && Array.isArray(changedData.newData[tabKey])) {
        finalData = changedData.newData[tabKey];
        console.log(`🔍 handleSaveChanges - Using changed fields from getChangedFieldsOnly:`, finalData);
      } else {
        // If no changes detected, show error and return
        toastInfo("Tidak ada perubahan untuk disimpan");
        return;
      }
    }

    // Prepare payload exactly like the example
    const payload = {
      request_type: requestType,
      note_employee: changeReason.value || `Save Changes - ${activeTab.value.replace('-', ' ')} changes`,
      consent: true,
      new_data: {
        action: 'update',
        data: finalData // Array for EMC/FMY/EDC, object for others
      },
      submit: false // Keep as draft (status = 1)
    };

    console.log('🔍 handleSaveChanges - Final payload that will be sent:', payload);
    console.log('🔍 handleSaveChanges - Final payload.new_data.data:', payload.new_data.data);

    // For education tab, use the same logic as index.vue for field filtering
    if (activeTab.value === 'education') {
      // Get education records from the final data
      let educationRecords = [];
      if (Array.isArray(finalData)) {
        educationRecords = finalData;
      } else if (finalData && finalData.education_records && Array.isArray(finalData.education_records)) {
        educationRecords = finalData.education_records;
      }
      // Debug: Check if original data is loaded
      if (originalEducationData.value.length === 0) {
        // CRITICAL FIX: Try to load original data from requestDetail
        if (requestDetail.value?.old_data?.education && Array.isArray(requestDetail.value.old_data.education)) {
          originalEducationData.value = [...requestDetail.value.old_data.education];
        } else if (Array.isArray(requestDetail.value?.old_data)) {
          originalEducationData.value = [...requestDetail.value.old_data];
        } else {
        }
      } else {
      }

      // CRITICAL FIX: Use draftOldData as fallback if originalEducationData is still empty
      if (originalEducationData.value.length === 0 && Array.isArray(draftOldData)) {
        originalEducationData.value = [...draftOldData];
        // Enrich with labels for DocumentSection
        await enrichEducationDataWithLabels(originalEducationData.value);
      }

      // SIMPLIFIED APPROACH: Only send fields that have actually changed
      const newData = [];
      // Find changed/added education records
      educationRecords.forEach((currentEducation, index) => {
        const originalEducation = originalEducationData.value.find(o => o.id_education === currentEducation.id_education) || {};
        // If no original data, skip this record (don't send anything)
        if (!originalEducation.id_education) {
          return;
        }

        // Only include fields that actually changed
        const newEducationData = {
          id_education: currentEducation.id_education,
          client_key: currentEducation.client_key || generateClientKey()
        };

        // Check each field individually and only include if changed  
        const fieldsToCheck = ['edu_level_id', 'edu_major_id', 'edu_institution_id', 'edu_start_date', 'edu_end_date'];
        let hasAnyChanges = false;

        fieldsToCheck.forEach(field => {
          const currentValue = currentEducation[field];
          const originalValue = originalEducation[field];

          // Simple comparison
          if (currentValue !== originalValue) {
            newEducationData[field] = currentValue;
            hasAnyChanges = true;
          }
        });

        // ALWAYS include status field for API validation
        newEducationData.status = currentEducation.status || 1;

        // Only add to array if there are actual changes
        if (hasAnyChanges) {
          newData.push(newEducationData);
        } else {
        }
      });
      // Only send modified records with filtered fields
      payload.new_data.data = newData;
    }

    // Call PUT API using useApi for proper proxy handling
    const response = await apiPut(`/employee/change-request/${requestId.value}`, payload);

    if (response.success) {

      // Update requestDetail.new_data without full reload
      const responseData = response.data?.data || response.data;

      if (responseData && requestDetail.value.new_data) {

        // Update the new_data in requestDetail to reflect current form state
        requestDetail.value.new_data.data = { ...finalNewData };

        // Update status to draft (1) after successful save changes
        if (requestDetail.value) {
          requestDetail.value.status = '1';
          requestDetail.value.status_label = 'Draft';
          requestDetail.value.status_raw = 1;
        }

        // CRITICAL: Update form data to reflect the saved changes
        // This ensures the user sees their changes persisted in the form
        await nextTick();
        const updatedFormData = dynamicFormData.value;
        if (updatedFormData && Object.keys(updatedFormData).length > 0) {
          setFormDataSafely(updatedFormData);
        }

        // Show success toast
        toastSuccess("Perubahan berhasil disimpan");
        // Ensure form data is preserved after save
        await nextTick();
        if (dynamicFormData.value && Object.keys(dynamicFormData.value).length > 0) {
          setFormDataSafely(dynamicFormData.value);
        }

      }
    } else {
      // Handle specific error messages
      if (response.message && response.message.includes('No valid data to submit')) {
        toastInfo("Tidak ada data yang valid untuk disimpan. Silakan tambahkan data education terlebih dahulu.");
      } else {
        toastError(response.message || "Gagal menyimpan perubahan");
      }
    }

  } catch (error) {
    toastError("Gagal menyimpan perubahan: " + (error.message || error));
  } finally {
    isSubmitting.value = false;
  }
};

// Prevent duplicate save calls
let lastSaveCall = 0;
const SAVE_DEBOUNCE_TIME = 1000; // 1 second

// Handle save as draft
const handleSaveAsDraft = async () => {
  const timestamp = Date.now();

  // Debounce to prevent duplicate calls
  if (timestamp - lastSaveCall < SAVE_DEBOUNCE_TIME) {
    console.log('🔍 handleSaveAsDraft blocked by debounce');
    return;
  }
  lastSaveCall = timestamp;

  console.log('🔍 handleSaveAsDraft called at:', timestamp);

  if (!requestId.value || isSubmitting.value) {
    toastError("No request ID available or already submitting");
    return;
  }

  // Validate education attachments before saving
  if (activeTab.value === 'education') {
    const educationData = formData.value || [];
    if (Array.isArray(educationData) && educationData.length > 0) {
      const validationResult = validateEducationAttachments(educationData);
      if (!validationResult.isValid) {
        toastWarning(validationResult.message);
        isSubmitting.value = false;
        return;
      }
    }
  }

  // Validate basic information changes without attachments
  if (activeTab.value === 'basic-information') {
    const basicInfoValidation = validateBasicInformationChangesWithoutAttachments();
    if (!basicInfoValidation.isValid) {
      toastWarning(basicInfoValidation.message);
      scrollToDocumentUpload();
      isSubmitting.value = false;
      return;
    }
  }

  // Validate that all uploaded documents have document type selected
  const docTypeValidation = validateDocumentTypesSelected();
  if (!docTypeValidation.isValid) {
    toastWarning(docTypeValidation.message);
    isSubmitting.value = false;
    return;
  }

  isSubmitting.value = true;

  try {

    // Get only changed fields using getChangedFieldsOnly
    const changedData = getChangedFieldsOnly();

    // Check if there are any changes
    if (!changedData.newData || Object.keys(changedData.newData).length === 0) {
      toastInfo("Tidak ada perubahan untuk disimpan");
      return;
    }

    // Additional check for array-based tabs to ensure they have data
    if (activeTab.value === 'family' || activeTab.value === 'education' || activeTab.value === 'emergency-contact') {
      const arrayData = changedData.newData[activeTab.value.replace('-', '_')];
      if (!arrayData || (Array.isArray(arrayData) && arrayData.length === 0)) {
        toastInfo("Tidak ada perubahan untuk disimpan. Silakan lakukan perubahan terlebih dahulu.");
        return;
      }
    }

    // Get request type from active tab
    const getRequestTypeFromTab = (tab) => {
      const typeMap = {
        'basic-information': 'BSC',
        'address': 'ADR',
        'emergency-contact': 'EMC',
        'family': 'FMY',
        'education': 'EDC',
        'payroll-account': 'PYR',
        'social-security': 'SSI',
        'medical-record': 'MDR',
      };
      return typeMap[tab] || 'BSC';
    };

    const requestType = getRequestTypeFromTab(activeTab.value);

    // For draft: prepare payload with ONLY cumulative changed fields
    // FIXED: Use normalize helper for consistent status detection
    const statusInfo = normalizeStatus(requestDetail.value);
    const isDraft = statusInfo.isDraft;
    let finalNewData = {};

    if (isDraft) {
      // For draft: merge previous changes with current, but filter address keys
      const previousChanges = requestDetail.value?.new_data?.data || {};
      if (activeTab.value === 'address') {
        // Use the already filtered changedData.newData directly (it already contains only changed fields)
        finalNewData = changedData.newData;
      } else {
        finalNewData = { ...previousChanges, ...changedData.newData };
      }
    } else {
      // For non-draft: only send current changes
      finalNewData = changedData.newData;
    }

    // CRITICAL FIX: For array-based categories (EMC, FMY, EDC), ensure data is array
    const arrayBasedTabs = ['emergency-contact', 'family', 'education'];
    let finalData = finalNewData;

    if (arrayBasedTabs.includes(activeTab.value)) {
      // For array tabs, extract the array data from the changes
      const tabKey = activeTab.value.replace('-', '_');
      if (finalNewData[tabKey] && Array.isArray(finalNewData[tabKey])) {
        finalData = finalNewData[tabKey];
      } else if (Array.isArray(finalNewData)) {
        finalData = finalNewData;
      } else {
        finalData = [];
      }
    }

    // Prepare payload
    const payload = {
      request_type: requestType,
      note_employee: changeReason.value || `Draft - ${activeTab.value.replace('-', ' ')} changes`,
      consent: true,
      new_data: {
        action: 'update',
        data: finalData // Array for EMC/FMY/EDC, object for others
      },
      old_data: changedData.oldData, // Only changed fields for comparison
      submit: false // Keep as draft (status = 1)
    };

    // Save draft via submitChangeRequest (POST for create, PUT if id present)
    const { useChangeRequestSubmit } = await import('~/composables/useChangeRequestSubmit')
    const { submitChangeRequest } = useChangeRequestSubmit()
    const response = await submitChangeRequest({
      currentTab: activeTab.value,
      changes: payload.new_data.data,
      note_employee: payload.note_employee,
      consent: payload.consent,
      submit: false,
      id: requestId.value
    })

    if (response.success) {
      const responseData = response.data?.data || response.data;

      if (responseData && requestDetail.value.new_data) {
        requestDetail.value.new_data.data = {
          ...requestDetail.value.new_data.data,
          ...changedData.newData
        };

        // Update other response fields if available
        if (responseData.status !== undefined) {
          requestDetail.value.status = responseData.status;
        } else {
          // Ensure status is set to draft (1) after successful save
          requestDetail.value.status = '1';
          requestDetail.value.status_label = 'Draft';
          requestDetail.value.status_raw = 1;
        }
        if (responseData.request_code) {
          requestDetail.value.code = responseData.request_code;
          requestDetail.value.request_id = responseData.request_code;
        }

      }

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('requestHistoryUpdated', {
          detail: { requestId: response.id || response.data?.id_change_req, type: 'draft' }
        }));
      }, 200);

      // CRITICAL: Update form data to reflect the saved changes
      // This ensures the user sees their changes persisted in the form
      await nextTick();
      const updatedFormData = dynamicFormData.value;
      if (updatedFormData && Object.keys(updatedFormData).length > 0) {
        setFormDataSafely(updatedFormData);
      }

      // Handle attachments upload during save for all categories
      await handleAttachmentsUploadForCurrentCategory(responseData);

      // Check for education pending uploads BEFORE showing success
      let hasEducationPendingUploads = false;
      if (!isUploadingAttachments && activeTab.value === 'education') {
        let dataToCheck = null;

        // First check formData
        if (Array.isArray(formData.value)) {
          dataToCheck = formData.value;
        } else if (Array.isArray(dynamicFormData.value)) {
          dataToCheck = dynamicFormData.value;
        }

        if (dataToCheck) {
          hasEducationPendingUploads = dataToCheck.some(record => {
            return record.pendingUploads && record.pendingUploads.length > 0;
          });
        }

        // Also check global pendingUploads
        if (!hasEducationPendingUploads && pendingUploads.value.length > 0) {
          hasEducationPendingUploads = true;
        }

        // Additional check: Try to get data directly from currentFormRef if it exists
        if (!hasEducationPendingUploads && currentFormRef.value) {
          try {
            if (currentFormRef.value.$data && currentFormRef.value.$data.localData) {
              const educationFormData = currentFormRef.value.$data.localData;
              if (educationFormData.education_records && Array.isArray(educationFormData.education_records)) {
                hasEducationPendingUploads = educationFormData.education_records.some(record => {
                  return record.pendingUploads && record.pendingUploads.length > 0;
                });
              }
            }
          } catch (accessError) {
            // Ignore error
          }
        }
      }

      // Show info toast if there are pending uploads
      if (hasEducationPendingUploads) {
        toastInfo('Uploading attachments...');
      }

      // Upload education attachments if any
      if (!isUploadingAttachments && hasEducationPendingUploads) {
        isUploadingAttachments = true;

        try {
          await handleEducationAttachmentUploads(requestId.value);

          // Clear global pending uploads after successful upload
          pendingUploads.value = [];
        } catch (uploadError) {
          console.error('Error uploading education attachments:', uploadError);
          toastError('Failed to upload some files. Please try again.');
          // Reset flag and exit
          isUploadingAttachments = false;
          return;
        }

        // Reset flag after upload completion
        isUploadingAttachments = false;
      }

      // Show success toast AFTER all uploads complete
      toastSuccess("Data dan dokumen berhasil disimpan");

      try {
        // Force remount education form setelah save berhasil
        if (activeTab.value === 'education') {
          educationFormKey.value += 1;

          // Also ensure fresh data load
          await nextTick();
          await loadRequestDetail();
        }
      } catch (toastErrorException) {
        // Ignore error
      }

    } else {
      // Handle specific error messages for failed save
      if (response.message && response.message.includes('No valid data to submit')) {
        toastInfo("Tidak ada data yang valid untuk disimpan. Silakan tambahkan data education terlebih dahulu.");
      } else {
        toastError(response.message || "Gagal menyimpan perubahan");
      }
    }

  } catch (error) {
    toastError("Terjadi kesalahan saat menyimpan perubahan");
  } finally {
    isSubmitting.value = false;
  }
};
// Handle insert request from EmergencyContactForm
const handleInsertRequest = async (insertData) => {
  try {
    isSubmitting.value = true;

    // FIXED: Dynamic request type based on current tab
    const getRequestTypeFromTab = (tab) => {
      const typeMap = {
        'emergency-contact': 'EMC',
        'family': 'FMY',
        'education': 'EDC'
      };
      return typeMap[tab] || 'EMC';
    };

    const requestType = getRequestTypeFromTab(activeTab.value);

    // FIXED: Dynamic note based on category
    const getCategoryLabel = (tab) => {
      const labels = {
        'emergency-contact': 'kontak darurat',
        'family': 'anggota keluarga',
        'education': 'riwayat pendidikan'
      };
      return labels[tab] || 'data';
    };

    // Create change request for insert action
    const changeRequestData = {
      request_type: requestType,
      note_employee: `Menambahkan ${getCategoryLabel(activeTab.value)} baru`,
      consent: false, // Will be handled by ChangeRequestModal
      new_data: {
        action: insertData.action,
        data: insertData.data
      },
      submit: false // Will be handled by ChangeRequestModal
    };

    // Call API to create change request using useApi for proper proxy handling
    const response = await apiPost("/employee/change-request", changeRequestData);

    if (response.success && response.data) {
      // Store the change request ID and data for ChangeRequestModal
      requestDetail.value.pendingInsertRequest = {
        id: response.data.id || response.data.code,
        data: insertData,
        category: requestType  // FIXED: Use dynamic request type
      };

      // Open ChangeRequestModal for consent and documents
      isChangeRequestModalOpen.value = true;

      toastSuccess('Change request created successfully. Please complete the submission.');
    } else {
      throw new Error(response.message || 'Failed to create change request');
    }
  } catch (error) {
    toastError('Failed to create change request. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};

// Handle submit request - Open ChangeRequestModal for final submission
const handleSubmit = async () => {
  if (!activeTab.value) {
    toastError("Please select a tab to submit");
    return;
  }

  // Open the ChangeRequestModal for final submission with consent and documents
  isChangeRequestModalOpen.value = true;
};

// Calculate changes from original and current data for all tabs in draft
const calculateChanges = () => {
  const changes = {};
  const currentStatus = requestDetail.value?.status;

  // For draft, rejected, and need revision status, just use the existing new_data from draft
  const isDraftStatus = currentStatus === 'draft' || currentStatus === '1' || currentStatus === 1;
  const isRejectedStatus = currentStatus === 'rejected' || currentStatus === '3' || currentStatus === 3;

  if (isDraftStatus || isRejectedStatus) {
    // For need revision, use formData (user's latest changes) instead of existing new_data
    const isNeedRevision = isRejectedStatus;
    const draftNewData = isNeedRevision ? (formData.value || {}) : (requestDetail.value?.new_data?.data || {});
    const draftOldData = requestDetail.value?.old_data || {};
    if (Object.keys(draftNewData).length > 0 || Array.isArray(draftNewData)) {
      const tabKey = activeTab.value.replace('-', '_') + 'Data';

      // Remove forbidden fields (object case)
      const forbiddenFields = ['name', 'nik', 'business_email'];

      // Add document fields to forbidden list for basic-information during revision
      if (isNeedRevision && activeTab.value === 'basic-information') {
        forbiddenFields.push('ktp_doc', 'professional_photo');
      }

      // Handle array-based vs object-based tabs differently
      const arrayBasedTabs = ['education', 'emergency-contact', 'family'];

      if (arrayBasedTabs.includes(activeTab.value)) {
        const baseKey = activeTab.value.replace('-', '_');
        // Determine the array to send:
        // PRIORITY ORDER:
        // 1) For need revision: Use formData if it's an array, otherwise use dynamicFormData (current form state)
        // 2) For draft: Use draftNewData if it's an array
        // 3) If draftNewData contains nested array under its tab key, use that
        // 4) Fallback to current form array (dynamicFormData) if non-empty
        let arrayData = [];

        if (isNeedRevision) {
          // For need revision, prioritize current form state
          if (Array.isArray(formData.value) && formData.value.length > 0) {
            arrayData = formData.value;
          } else if (Array.isArray(dynamicFormData.value) && dynamicFormData.value.length > 0) {
            arrayData = dynamicFormData.value;
          }
        } else if (Array.isArray(draftNewData)) {
          arrayData = draftNewData;
        } else if (draftNewData && Array.isArray(draftNewData[baseKey])) {
          arrayData = draftNewData[baseKey];
        } else if (Array.isArray(dynamicFormData.value) && dynamicFormData.value.length > 0) {
          arrayData = dynamicFormData.value;
        }

        // Normalize emergency-contact data
        if (activeTab.value === 'emergency-contact' && Array.isArray(arrayData)) {
          console.log('🔍 Before normalize emergency-contact:', arrayData);

          // Check draft action - if action is 'insert', send ALL fields for all items
          const draftAction = requestDetail.value?.new_data?.action;
          const isInsertAction = draftAction === 'insert';

          if (isNeedRevision) {
            // Need Revision logic
            console.log('🔍 Normalize emergency-contact for revision:', {
              draftAction,
              isInsertAction,
              currentData: arrayData
            });

            if (isInsertAction) {
              // ✅ For INSERT action: send ALL fields for all items (no id_contact yet)
              arrayData = arrayData.map(item => ({
                emgc_name: item.emgc_name || '',
                emgc_relationship_id: item.emgc_relationship_id || '',
                emgc_number: item.emgc_number || '',
                emgc_address: item.emgc_address || '',
                status: item.status !== undefined ? item.status : 1
                // Don't include id_contact - backend will generate
              }));
            } else {
              // ✅ For UPDATE action in need revision: send only changed fields
              const originalData = originalEmergencyContactData.value || emergencyContactData.value || [];

              arrayData = arrayData.map(item => {
                // Must have id_contact for UPDATE
                if (!item.id_contact) return null;

                const originalItem = originalData.find(orig => orig.id_contact === item.id_contact) || {};

                const normalized = {
                  id_contact: item.id_contact,
                  status: item.status !== undefined ? item.status : 1
                };

                // Only add fields that actually changed
                const fieldsToCheck = ['emgc_name', 'emgc_relationship_id', 'emgc_number', 'emgc_address'];
                fieldsToCheck.forEach(field => {
                  const currentValue = item[field];
                  const originalValue = originalItem[field];

                  // ✅ FIX: Normalize values for comparison
                  const normalizeValue = (val) => {
                    if (val === null || val === undefined) return '';
                    if (typeof val === 'number') return String(val);
                    return String(val);
                  };

                  const currentNormalized = normalizeValue(currentValue);
                  const originalNormalized = normalizeValue(originalValue);

                  if (currentNormalized !== originalNormalized) {
                    // Only send if has value (not null/undefined)
                    if (currentValue != null) {
                      normalized[field] = currentValue;
                    }
                  }
                });

                return normalized;
              }).filter(item => item !== null);
            }
          } else {
            // Draft logic
            if (isInsertAction) {
              // ✅ For INSERT action in draft: send ALL fields
              arrayData = arrayData.map(item => ({
                emgc_name: item.emgc_name || '',
                emgc_relationship_id: item.emgc_relationship_id || '',
                emgc_number: item.emgc_number || '',
                emgc_address: item.emgc_address || '',
                status: item.status !== undefined ? item.status : 1
                // Don't include id_contact for INSERT
              }));
            } else {
              // ✅ For UPDATE action in draft: send only changed fields
              const originalData = originalEmergencyContactData.value || emergencyContactData.value || [];

              arrayData = arrayData.map(item => {
                // Must have id_contact for UPDATE
                if (!item.id_contact) return null;

                const originalItem = originalData.find(orig => orig.id_contact === item.id_contact) || {};

                const normalized = {
                  id_contact: item.id_contact,
                  status: item.status !== undefined ? item.status : 1
                };

                // Only add fields that actually changed
                const fieldsToCheck = ['emgc_name', 'emgc_relationship_id', 'emgc_number', 'emgc_address'];
                fieldsToCheck.forEach(field => {
                  const currentValue = item[field];
                  const originalValue = originalItem[field];

                  // ✅ FIX: Normalize values for comparison
                  const normalizeValue = (val) => {
                    if (val === null || val === undefined) return '';
                    if (typeof val === 'number') return String(val);
                    return String(val);
                  };

                  const currentNormalized = normalizeValue(currentValue);
                  const originalNormalized = normalizeValue(originalValue);

                  if (currentNormalized !== originalNormalized) {
                    // Only send if has value (not null/undefined)
                    if (currentValue != null) {
                      normalized[field] = currentValue;
                    }
                  }
                });

                return normalized;
              }).filter(item => item !== null);
            }
          }

          console.log('🔍 After normalize emergency-contact:', arrayData);
        }

        // Normalize family data
        if (activeTab.value === 'family' && Array.isArray(arrayData)) {
          console.log('🔍 Before normalize family:', arrayData);

          // Check if this is INSERT action (no id_family)
          const isInsertAction = requestDetail.value?.new_data?.action === 'insert';

          console.log('🔍 Normalize family:', {
            isInsertAction,
            isNeedRevision,
            currentData: arrayData
          });

          if (isInsertAction) {
            // ✅ For INSERT action: send ALL fields for all items (no id_family yet)
            arrayData = arrayData.map(item => ({
              name: item.name || '',
              gender_id: item.gender_id ? Number(item.gender_id) : null,
              marital_status_id: item.marital_status_id ? Number(item.marital_status_id) : null,
              relation_id: item.relation_id ? Number(item.relation_id) : null,
              birth_date: item.birth_date || '',
              birth_place: item.birth_place || '',
              address: item.address || '',
              occupation_id: item.occupation_id ? Number(item.occupation_id) : null,
              status: item.status !== undefined ? item.status : 1
              // Don't include id_family for INSERT
              // Don't include kk_doc in data payload (handled separately via attachments)
            }));
          } else {
            // ✅ For UPDATE action: send only changed fields
            const originalData = originalFamilyData.value || familyData.value || [];

            arrayData = arrayData.map(item => {
              const itemId = item.id_family || item.id;

              // Must have id_family for UPDATE
              if (!itemId) return null;

              const originalItem = originalData.find(orig => (orig.id_family || orig.id) === itemId) || {};

              const normalized = {
                id_family: itemId,
                status: item.status !== undefined ? item.status : 1
              };

              // Only add fields that actually changed
              const fieldsToCheck = ['name', 'birth_date', 'birth_place', 'address', 'occupation_id', 'relation_id', 'marital_status_id', 'gender_id'];
              fieldsToCheck.forEach(field => {
                const currentValue = item[field];
                // For relation_id, check both relation_id and relation in original
                let originalValue = originalItem[field];
                if (field === 'relation_id' && (originalValue === null || originalValue === undefined)) {
                  originalValue = originalItem['relation']; // Fallback to 'relation' field
                }

                // ✅ FIX: Normalize values for comparison
                const normalizeValue = (val) => {
                  if (val === null || val === undefined) return '';
                  if (typeof val === 'number') return String(val);
                  return String(val);
                };

                const currentNormalized = normalizeValue(currentValue);
                const originalNormalized = normalizeValue(originalValue);

                // Only include if actually changed
                if (currentNormalized !== originalNormalized) {
                  // Convert ID fields to number for API compatibility
                  if (field === 'occupation_id' || field === 'relation_id' || field === 'marital_status_id' || field === 'gender_id') {
                    // Only send if has value (not null/undefined)
                    if (currentValue != null) {
                      normalized[field] = Number(currentValue);
                    }
                  } else {
                    normalized[field] = currentValue;
                  }
                }
              });

              return normalized;
            }).filter(item => item !== null);
          }

          console.log('🔍 After normalize family:', arrayData);
        }

        // Normalize education data - only send changed fields (both draft and revision)
        if (activeTab.value === 'education' && Array.isArray(arrayData)) {
          console.log('🔍 Before normalize education:', arrayData);

          // Check if this is INSERT action (no id_education)
          const isInsertAction = requestDetail.value?.new_data?.action === 'insert';

          // Get original data for comparison
          const originalData = originalEducationData.value || educationData.value || [];

          arrayData = arrayData.map(item => {
            const itemId = item.id_education || item.id;

            // For INSERT action, we use client_key; for UPDATE we need id_education
            if (!isInsertAction && !itemId) return null;

            // Find original item - for INSERT match by client_key, for UPDATE match by id
            let originalItem;
            if (isInsertAction) {
              originalItem = originalData.find(orig => orig.client_key === item.client_key) || {};
            } else {
              originalItem = originalData.find(orig => (orig.id_education || orig.id) === itemId) || {};
            }

            const normalized = {
              status: item.status !== undefined ? item.status : 1
            };

            // Only include id_education for UPDATE actions
            if (itemId) {
              normalized.id_education = itemId;
            }

            // Always include client_key for INSERT actions
            if (item.client_key) {
              normalized.client_key = item.client_key;
            }

            // Only add fields that actually changed
            const fieldsToCheck = ['edu_level_id', 'edu_major_id', 'edu_institution_id', 'edu_start_date', 'edu_end_date'];
            fieldsToCheck.forEach(field => {
              const currentValue = item[field];
              const originalValue = originalItem[field];

              // ✅ FIX: Normalize values for comparison
              const normalizeValue = (val) => {
                if (val === null || val === undefined) return '';
                if (typeof val === 'number') return String(val);
                return String(val);
              };

              const currentNormalized = normalizeValue(currentValue);
              const originalNormalized = normalizeValue(originalValue);

              if (currentNormalized !== originalNormalized) {
                // Convert ID fields to number for API compatibility, but use != null to allow 0
                if (field === 'edu_level_id' || field === 'edu_major_id' || field === 'edu_institution_id') {
                  // Only send if has value (not null/undefined)
                  if (currentValue != null) {
                    normalized[field] = Number(currentValue);
                  }
                } else {
                  normalized[field] = currentValue;
                }
              }
            });

            return normalized;
          }).filter(item => item !== null);

          console.log('🔍 After normalize education:', arrayData);
        }

        changes[tabKey] = isRejectedStatus
          ? {
            old: [],
            new: arrayData,
            fieldChanges: {}
          }
          : {
            old: Array.isArray(draftOldData) ? draftOldData : [],
            new: arrayData,
            fieldChanges: {}
          };
      } else {
        // Object-based tabs
        let finalData = { ...(Array.isArray(draftNewData) ? {} : draftNewData) };
        forbiddenFields.forEach(field => { delete finalData[field]; });

        // Add specific field filtering for revision submissions
        if (activeTab.value === 'basic-information' || activeTab.value === 'payroll-account' || activeTab.value === 'address' || activeTab.value === 'social-security') {
          // For need revision, only send editable fields that have actually changed
          if (isRejectedStatus) {
            const editableFields = formConfig.value?.editableFields;
            if (editableFields && typeof editableFields.has === 'function') {
              // Filter to only include editable fields that have changed
              const filteredData = {};
              const originalData = requestDetail.value?.old_data || {};

              Object.keys(finalData).forEach(key => {
                if (editableFields.has(key)) {
                  const currentValue = finalData[key];
                  const originalValue = originalData[key];

                  // Only include if value has actually changed
                  if (currentValue !== originalValue) {
                    filteredData[key] = currentValue;
                  }
                }
              });

              finalData = filteredData;
            }
          } else if (activeTab.value === 'payroll-account') {
            // For draft mode, remove document fields and non-editable fields
            const payrollForbiddenFields = [
              'npwp_doc', 'saving_book_doc', 'npwp_doc_id', 'saving_book_doc_id', // Document fields (view only)
              'holder_name', 'npwp', 'tax_status_id' // Non-editable fields in draft
            ];
            payrollForbiddenFields.forEach(field => { delete finalData[field]; });
          } else if (activeTab.value === 'social-security') {
            // For draft mode, remove document fields and readonly fields
            const socialSecurityForbiddenFields = [
              'bpjs_doc', 'telkomedika_doc', // Document fields (view only)
              'no_telkomedika' // Readonly field
            ];
            socialSecurityForbiddenFields.forEach(field => { delete finalData[field]; });
          }
        }

        changes[tabKey] = isRejectedStatus
          ? { old: {}, new: finalData, fieldChanges: {} }
          : { old: draftOldData, new: finalData, fieldChanges: {} };
      }

      return changes;
    }

    Object.keys(changes).forEach(tabKey => {
      const changeData = changes[tabKey];
      if (changeData && typeof changeData === 'object' && 'old' in changeData && 'new' in changeData) {
        // Extract current form data for this tab
        let currentTabData = {};
        let originalTabData = changeData.old || {};

        // Map tab keys to form data structure
        if (tabKey === 'basicInformationData' || tabKey === 'basic-information') {
          // Extract basic information fields from formData - exclude non-modifiable fields
          // Fields that cannot be modified: name, nik, business_email (employee name, NIK, and business email are read-only)

          // Helper function to convert string IDs to numbers
          const convertToNumber = (value) => {
            if (value === null || value === undefined || value === '') return undefined;
            const num = Number(value);
            return isNaN(num) ? undefined : num;
          };

          // Build rawCurrentTabData dynamically to exclude forbidden fields during revision
          const rawCurrentTabData = {
            // nik: formData.value.nik, // NIK cannot be modified
            // name: formData.value.name, // Employee name cannot be modified
            // business_email: formData.value.business_email, // Business email cannot be modified
            no_ktp: formData.value.no_ktp,
            private_email: formData.value.private_email,
            main_phone_number: formData.value.main_phone_number,
            secondary_phone_number: formData.value.secondary_phone_number,
            birth_date: formData.value.birth_date,
            birth_place: formData.value.birth_place,
            gender_id: convertToNumber(formData.value.gender_id),
            marital_status_id: convertToNumber(formData.value.marital_status_id),
            religion_id: convertToNumber(formData.value.religion_id),
            nationality_id: convertToNumber(formData.value.nationality_id),
            clothing_size_id: convertToNumber(formData.value.clothing_size_id),
            passport_number: formData.value.passport_number
          };

          // Only include document fields if NOT in need revision status
          if (!isRejectedStatus) {
            rawCurrentTabData.ktp_doc = formData.value.ktp_doc;
            rawCurrentTabData.professional_photo = formData.value.professional_photo;
          }

          // Filter out undefined/null values and assign to currentTabData
          currentTabData = Object.fromEntries(
            Object.entries(rawCurrentTabData).filter(([key, value]) => value !== undefined && value !== null)
          );

          // For revision status, only include fields that have actually changed
          if (isRejectedStatus) {
            const originalData = requestDetail.value?.old_data || {};
            const changedData = {};

            Object.keys(currentTabData).forEach(key => {
              const currentValue = currentTabData[key];
              const originalValue = originalData[key];

              // Only include if value has actually changed
              if (currentValue !== originalValue) {
                changedData[key] = currentValue;
              }
            });

            currentTabData = changedData;
          }

        } else if (tabKey === 'addressData' || tabKey === 'address') {
          // Extract address fields from formData and convert to API format - only changed fields
          const addressFormData = formData.value || {};
          const originalAddressData = requestDetail.value?.old_data || {};
          try {
            // Use the same logic as getChangedFieldsOnly for address
            const mapAddressFormToAPI = (formData, originalData) => {
              const apiData = {};

              // Only map fields that are accepted by API
              const acceptedFields = {
                // Official address (KTP) fields
                'official_address_detail': 'detail_ktp',
                'official_address_province': 'province_ktp_id',
                'official_address_city': 'city_ktp_id',
                'official_address_postal_code': 'postal_code_ktp',
                'official_address_subdistrict': 'sub_distric_ktp',
                'official_address_administrative_village': 'administrative_village_ktp',
                'official_address_rt': 'rt_ktp',
                'official_address_rw': 'rw_ktp',
                'official_address_street': 'street_name_ktp',
                'official_address_house_number': 'house_number_ktp',

                // Domicile address fields
                'domicile_address_detail': 'detail_domicile',
                'domicile_address_province': 'province_domicile_id',
                'domicile_address_city': 'city_domicile_id',
                'domicile_address_postal_code': 'postal_code_domicile',
                'domicile_address_subdistrict': 'sub_distric_domicile',
                'domicile_address_administrative_village': 'administrative_village_domicile',
                'domicile_address_rt': 'rt_domicile',
                'domicile_address_rw': 'rw_domicile',
                'domicile_address_street': 'street_name_domicile',
                'domicile_address_house_number': 'house_number_domicile'
              };

              // Only process accepted fields that have actually changed
              Object.keys(acceptedFields).forEach(formField => {
                const apiField = acceptedFields[formField];
                const currentValue = formData[formField];
                const originalValue = originalData[apiField];

                // Normalize values for comparison - treat null, undefined, empty string as equivalent
                const normalizeValue = (val) => {
                  if (val === null || val === undefined || val === '') return '';
                  return String(val).trim();
                };

                const normalizedCurrent = normalizeValue(currentValue);
                const normalizedOriginal = normalizeValue(originalValue);

                // Skip fields that are empty in both current and original
                const isEmptyInBoth = normalizedCurrent === '' && normalizedOriginal === '';

                // Only include fields that have actually changed
                if (normalizedCurrent !== normalizedOriginal) {
                  // Additional check: don't include fields where both are empty
                  if (!isEmptyInBoth) {
                    // Convert ID fields to number for API compatibility
                    if (apiField === 'province_ktp_id' || apiField === 'city_ktp_id' ||
                      apiField === 'province_domicile_id' || apiField === 'city_domicile_id') {
                      apiData[apiField] = Number(currentValue);
                    } else {
                      apiData[apiField] = currentValue;
                    }
                  }
                }
              });

              return apiData;
            };

            currentTabData = mapAddressFormToAPI(addressFormData, originalAddressData);
          } catch (error) {
            console.error('🔍 Error in mapAddressFormToAPI:', error);
            currentTabData = {};
          }
        } else if (tabKey === 'emergencyContactData' || tabKey === 'emergency_contact') {
          // Extract emergency contact array from formData (emergency contact uses array structure)
          let rawData = [];

          if (Array.isArray(formData.value)) {
            // If formData.value is directly an array (emergency contact array)
            rawData = formData.value;
          } else if (formData.value.emergencyContactData && Array.isArray(formData.value.emergencyContactData)) {
            // If emergency contact data is nested in formData
            rawData = formData.value.emergencyContactData;
          } else {
            // Fallback: try to get emergency contact data from personal data composable
            rawData = emergencyContactData.value || [];
          }

          // Ensure each emergency contact has required status field
          currentTabData = rawData.map(contact => ({
            emgc_name: contact.emgc_name || '',
            emgc_relationship_id: contact.emgc_relationship_id || '',
            emgc_number: contact.emgc_number || '',
            emgc_address: contact.emgc_address || '',
            status: contact.status !== undefined ? contact.status : 1
          }));
        } else if (tabKey === 'payrollAccountData' || tabKey === 'payroll_account') {
          // Extract payroll account fields from formData - ensure IDs are numbers
          const convertToNumber = (value) => {
            if (value === null || value === undefined || value === '') return undefined;
            const num = Number(value);
            return isNaN(num) ? undefined : num;
          };

          currentTabData = {
            bank_id: convertToNumber(formData.value.bank_id),
            number_rekening: formData.value.number_rekening,
            holder_name: formData.value.holder_name,
            tax_status_id: convertToNumber(formData.value.tax_status_id),
            npwp: formData.value.npwp,
            npwp_doc: formData.value.npwp_doc,
            saving_book_doc: formData.value.saving_book_doc
          };
        } else if (tabKey === 'familyData' || tabKey === 'family') {
          // Extract family data - family form uses direct array structure  
          currentTabData = Array.isArray(formData.value) ? formData.value : [];
        } else if (tabKey === 'educationData' || tabKey === 'education') {
          // Extract education data - education form can be array or object with education_records
          if (Array.isArray(formData.value)) {
            currentTabData = formData.value;
          } else if (formData.value && formData.value.education_records && Array.isArray(formData.value.education_records)) {
            currentTabData = formData.value.education_records;
          } else {
            currentTabData = [];
          }
        } else if (tabKey === 'socialSecurityData' || tabKey === 'social_security') {
          // Extract Benefit fields from formData - using API field names
          const rawSocial = {
            no_bpjs_tk: formData.value.no_bpjs_tk || formData.value.bpjs_tk_number || '',
            bpjs_tk_effective_date: formData.value.bpjs_tk_effective_date || '',
            no_bpjs: formData.value.no_bpjs || formData.value.bpjs_health_number || ''
          };

          // Only include document fields and readonly fields if NOT in need revision status
          if (!isRejectedStatus) {
            rawSocial.bpjs_doc = formData.value.bpjs_doc || '';
            rawSocial.telkomedika_doc = formData.value.telkomedika_doc || '';
            rawSocial.no_telkomedika = formData.value.no_telkomedika || '';
          }

          // Normalize comparison helper
          const normalize = (v) => {
            if (v === null || v === undefined) return '';
            return String(v).trim();
          };

          // Determine baseline: for draft mode, use originalSocialSecurityData; for need revision, use old_data
          const statusInfo = normalizeStatus(requestDetail.value);
          const baseline = statusInfo.isDraft
            ? (originalSocialSecurityData.value || {})
            : (requestDetail.value?.old_data && Object.keys(requestDetail.value.old_data).length > 0)
              ? requestDetail.value.old_data
              : (originalSocialSecurityData.value || {});

          // Only include fields that actually changed vs baseline
          const filtered = {};
          Object.keys(rawSocial).forEach((key) => {
            const currentVal = normalize(rawSocial[key]);
            const originalVal = normalize(baseline[key]);
            if (currentVal !== originalVal) {
              filtered[key] = rawSocial[key];
            }
          });

          currentTabData = filtered;
        } else if (tabKey === 'medicalRecordData' || tabKey === 'medical_record') {
          // Extract medical record fields from formData - using form camelCase field names

          currentTabData = {
            // Use form field names directly since they now match the API field names
            blood_type_id: formData.value.blood_type_id || '',
            height: formData.value.height || '',
            weight: formData.value.weight || '',
            head_size: formData.value.head_size || '',
            health_status_id: formData.value.health_status_id || '',
            last_mcu_date: formData.value.last_mcu_date || '',
            has_disability_id: formData.value.has_disability_id || '',
            health_concern: formData.value.health_concern || '',
            medical_treatment_record: formData.value.medical_treatment_record || '',
            vaccination_record: formData.value.vaccinationRecord || formData.value.vaccination_record || '',
            special_conditions: formData.value.specialConditions || formData.value.special_conditions || ''
          };

        }

        // Calculate field-level changes
        const fieldChanges = {};
        let hasChanges = false;

        Object.keys(currentTabData).forEach(key => {
          const currentValue = currentTabData[key];
          const originalValue = originalTabData[key];

          // Normalize empty-ish values so ''/null/undefined are treated equal
          const normalizeEmpty = (v) => (v === null || v === undefined ? '' : v);
          const normalizedCurrent = normalizeEmpty(currentValue);
          const normalizedOriginal = normalizeEmpty(originalValue);

          // Skip if both sides are effectively empty (Not set → Not set)
          if (normalizedCurrent === '' && normalizedOriginal === '') {
            return;
          }

          if (JSON.stringify(normalizedCurrent) !== JSON.stringify(normalizedOriginal)) {
            fieldChanges[key] = {
              old: normalizedOriginal,
              new: normalizedCurrent
            };
            hasChanges = true;
          }
        });

        // Add to changes if there are actual changes - only send changed fields
        if (hasChanges) {
          // Extract only the changed field values for the 'new' payload
          const changedFieldsOnly = {};
          Object.keys(fieldChanges).forEach(key => {
            changedFieldsOnly[key] = fieldChanges[key].new;
          });

          changes[tabKey] = {
            old: originalTabData,
            new: changedFieldsOnly, // Only send changed fields, not all form data
            fieldChanges: fieldChanges
          };
        }
      }
    });
  } else {
    // For non-draft status, calculate changes only for active tab
    const currentData = formData.value || {};
    let originalData = {};

    switch (activeTab.value) {
      case 'basic-information':
        originalData = originalEmployeeData.value || {};
        break;
      case 'address':
        originalData = originalAddressData.value || {};
        break;
      case 'emergency-contact':
        originalData = originalEmergencyContactData.value || [];
        break;
      case 'payroll-account':
        originalData = originalPayrollAccountData.value || {};
        break;
      case 'family':
        originalData = originalFamilyData.value || [];
        break;
      case 'education':
        originalData = originalEducationData.value || [];
        break;
      case 'social-security':
        originalData = originalSocialSecurityData.value || {};
        break;
      case 'medical-record':
        originalData = originalMedicalRecordData.value || {};
        break;
    }

    const categoryKey = activeTab.value.replace('-', '_') + 'Data';

    const fieldChanges = {};
    Object.keys(currentData).forEach(key => {
      const currentValue = currentData[key];
      const originalValue = originalData[key];

      // For social-security, normalize equivalences and aliases during comparison
      if (activeTab.value === 'social-security') {
        const normalize = (v) => {
          if (v === null || v === undefined) return '';
          return String(v).trim();
        };
        // Alias handling for BPJS fields
        const aliasMap = {
          bpjs_tk_number: originalData?.bpjs_tk_number ?? originalData?.no_bpjs_tk,
          bpjs_health_number: originalData?.bpjs_health_number ?? originalData?.no_bpjs,
          telkomedika_card_number: originalData?.telkomedika_card_number ?? originalData?.no_telkomedika
        };
        const left = normalize(currentValue);
        const right = normalize(aliasMap[key] !== undefined ? aliasMap[key] : originalValue);
        if (left !== right) {
          fieldChanges[key] = {
            old: right,
            new: currentValue
          };
          return;
        }
        return;
      }

      if (JSON.stringify(currentValue) !== JSON.stringify(originalValue)) {
        fieldChanges[key] = {
          old: originalValue || '',
          new: currentValue
        };
      }
    });

    // Only add to changes if there are actual changes
    if (Object.keys(fieldChanges).length > 0) {
      changes[categoryKey] = {
        old: originalData,
        new: currentData,
        fieldChanges: fieldChanges
      };
    }
  }

  // If no changes found but we have formData (for draft status), check for actual field-level changes
  if (Object.keys(changes).length === 0 && (isDraftStatus || isRejectedStatus) && formData.value && Object.keys(formData.value).length > 0) {

    // Create changes for current tab from formData - but only include fields that actually changed
    const tabKey = activeTab.value.replace('-', '_') + 'Data';

    // Get original data for comparison
    let originalData = {};
    switch (activeTab.value) {
      case 'basic-information':
        originalData = originalEmployeeData.value || {};
        break;
      case 'address':
        originalData = originalAddressData.value || {};
        break;
      case 'emergency-contact':
        originalData = originalEmergencyContactData.value || [];
        break;
      case 'payroll-account':
        originalData = originalPayrollAccountData.value || {};
        break;
      case 'family':
        originalData = originalFamilyData.value || [];
        break;
      case 'education':
        originalData = originalEducationData.value || [];
        break;
      case 'social-security':
        originalData = originalSocialSecurityData.value || {};
        break;
      case 'medical-record':
        originalData = originalMedicalRecordData.value || {};
        break;
    }

    // Compare formData with originalData field by field to find actual changes
    const actualFieldChanges = {};
    let hasActualChanges = false;

    Object.keys(formData.value).forEach(key => {
      const currentValue = formData.value[key];
      const originalValue = originalData[key];

      // Normalize empty-ish values so ''/null/undefined are treated equal
      const normalizeEmpty = (v) => (v === null || v === undefined ? '' : v);
      const normalizedCurrent = normalizeEmpty(currentValue);
      const normalizedOriginal = normalizeEmpty(originalValue);

      // Skip if both sides are effectively empty
      if (normalizedCurrent === '' && normalizedOriginal === '') {
        return;
      }

      // Check if field actually changed
      if (JSON.stringify(normalizedCurrent) !== JSON.stringify(normalizedOriginal)) {
        actualFieldChanges[key] = {
          old: normalizedOriginal,
          new: normalizedCurrent
        };
        hasActualChanges = true;
      }
    });

    // Only create changes object if there are actual field changes
    if (hasActualChanges) {
      // Create new data with only changed fields
      const changedData = {};
      Object.keys(actualFieldChanges).forEach(key => {
        changedData[key] = actualFieldChanges[key].new;
      });

      changes[tabKey] = {
        old: originalData,
        new: changedData,
        fieldChanges: actualFieldChanges
      };

    } else {
    }
  }

  return changes;
};

// Handle photo upload
const handlePhotoUpload = (photoData) => {
  // Update form data with new photo using shallow merge
  formData.value = {
    ...formData.value,
    professional_photo: photoData.dataUrl,
  };
};

// Unified attachment upload handler for current category
const handleAttachmentsUploadForCurrentCategory = async (responseData) => {
  console.log('🔍 handleAttachmentsUploadForCurrentCategory called for category:', activeTab.value);

  if (activeTab.value === 'basic-information') {
    // Handle basic information attachments (KTP + Professional Photo)
    await handleBasicInformationAttachmentsUpload(responseData);
  } else if (activeTab.value === 'education') {
    // Education has its own separate upload logic
    console.log('🔍 Education category - using separate upload logic');
  } else {
    // Handle other categories (address, family, payroll, social-security)
    await handleGenericAttachmentsUpload(responseData);
  }
};

// Basic information attachment upload handler (KTP + Photo)
const handleBasicInformationAttachmentsUpload = async (responseData) => {
  const changeRequestId = responseData?.id_change_req || responseData?.id || requestId.value;

  console.log('🔍 handleBasicInformationAttachmentsUpload called');
  console.log('🔍 changeRequestId:', changeRequestId);
  console.log('🔍 uploadedDocuments.value:', uploadedDocuments.value);
  console.log('🔍 professionalPhotoFile.value:', professionalPhotoFile.value);

  if (!changeRequestId) {
    console.error('❌ No change request ID available for basic info upload');
    return;
  }

  const uploadPromises = [];

  try {
    // Get data from basic info component and fallback to parent uploadedDocuments
    const basicInfoData = editDataBasicInfoRef.value || {};
    const rawUploads = (basicInfoData.uploadedDocuments && basicInfoData.uploadedDocuments.length > 0)
      ? basicInfoData.uploadedDocuments
      : (uploadedDocuments.value || []);

    // Filter valid KTP documents
    const candidateUploads = Array.isArray(rawUploads)
      ? rawUploads.filter(f => !!f && !!f.file && (!!f.ready || typeof f.ready === 'undefined'))
      : [];

    console.log('🔍 Valid KTP documents for upload:', candidateUploads);

    // Upload KTP documents (document type code: '3')
    if (candidateUploads.length > 0) {
      for (const fileData of candidateUploads) {
        const uploadPromise = uploadAttachment(
          changeRequestId,
          fileData.file,
          ['3'] // KTP document type code
        ).then(result => {
          console.log('✅ KTP upload successful:', result);
          return result;
        }).catch(error => {
          console.error('❌ KTP upload failed:', error);
          toastError(`Failed to upload KTP document: ${error.message}`);
          return null;
        });
        uploadPromises.push(uploadPromise);
      }
    }

    // Upload Professional Photo (document type code: '1') - OPTIONAL
    const photoFileToUpload = basicInfoData.professionalPhotoFile || professionalPhotoFile.value;

    if (photoFileToUpload) {
      console.log('� Uploading professional photo:', photoFileToUpload.name);
      const photoUploadPromise = uploadAttachment(
        changeRequestId,
        photoFileToUpload,
        ['1'] // Professional Photo document type code
      ).then(result => {
        console.log('✅ Photo upload successful:', result);
        return result;
      }).catch(error => {
        console.error('❌ Photo upload failed:', error);
        toastError(`Failed to upload professional photo: ${error.message}`);
        return null;
      });
      uploadPromises.push(photoUploadPromise);
    }
    // Professional photo is optional - no need to log when not uploaded

    // Wait for all uploads to complete
    if (uploadPromises.length > 0) {
      console.log('🔍 Waiting for', uploadPromises.length, 'basic info upload promises...');
      const results = await Promise.allSettled(uploadPromises);
      console.log('🔍 Basic info upload results:', results);

      // Check if any uploads succeeded
      const successfulUploads = results.filter(result =>
        result.status === 'fulfilled' && result.value !== null
      );

      if (successfulUploads.length > 0) {
        // Clear files after successful upload
        if (editDataBasicInfoRef.value) {
          editDataBasicInfoRef.value.uploadedDocuments = [];
          editDataBasicInfoRef.value.professionalPhotoFile = null;
        }
        uploadedDocuments.value = [];
        professionalPhotoFile.value = null;

        // Refresh request detail and remount components
        await loadRequestDetail();
        await nextTick();
        documentSectionKey.value += 1;
        multiDocumentUploadKey.value += 1;
        if (editDataBasicInfoRef.value) {
          editDataBasicInfoRef.value.documentSectionKey += 1;
          editDataBasicInfoRef.value.multiDocumentUploadKey += 1;
        }

        console.log('✅ Basic information attachments uploaded successfully');
      }
    }
  } catch (error) {
    console.error("❌ Error during basic info attachments upload:", error);
    toastError("Data berhasil disimpan, namun ada error saat upload dokumen");
  }
};

// Generic attachment upload handler for all categories (except basic-info and education)
const handleGenericAttachmentsUpload = async (responseData) => {
  console.log('🔍 handleGenericAttachmentsUpload called for category:', activeTab.value);
  console.log('🔍 responseData:', responseData);
  console.log('🔍 uploadedDocuments.value:', uploadedDocuments.value);

  const changeRequestId = responseData.id_change_req || responseData.id || requestId.value;

  console.log('🔍 changeRequestId:', changeRequestId);

  if (!changeRequestId) {
    console.error('❌ No change request ID available for upload');
    toastError('No change request ID available for upload');
    return;
  }

  if (!uploadedDocuments.value?.length) {
    console.log('ℹ️ No files to upload for', activeTab.value);
    return;
  }

  try {
    const uploadPromises = [];
    const categoryDocumentTypes = getCategoryDocumentTypes(activeTab.value);

    console.log('🔍 Generic attachment upload for category:', activeTab.value, 'document types:', categoryDocumentTypes);

    // Check if category requires documents
    if (categoryDocumentTypes.length === 0) {
      console.log('ℹ️ Category', activeTab.value, 'does not require documents');
      return;
    }

    // Filter valid files that are ready for upload - be more permissive
    const validFiles = uploadedDocuments.value.filter(fileData => {
      const hasFile = fileData && fileData.file;
      const isReady = fileData.ready !== false; // Allow undefined or true
      console.log('🔍 Checking file:', fileData, 'hasFile:', hasFile, 'isReady:', isReady);
      return hasFile && isReady;
    });

    console.log('🔍 Valid files for upload:', validFiles);

    if (validFiles.length === 0) {
      console.log('❌ No valid files to upload');
      toastWarning('No valid files to upload. Please select files first.');
      return;
    }

    // Upload each file with appropriate document type
    for (const fileData of validFiles) {
      // Use user-selected document type from fileData, fallback to category defaults
      const selectedDocType = fileData.documentType || (categoryDocumentTypes.length > 0 ? categoryDocumentTypes[0] : '8');
      console.log('🔍 Uploading file:', fileData.file.name, 'with document type:', selectedDocType);

      const uploadPromise = uploadAttachment(
        changeRequestId,
        fileData.file,
        [selectedDocType] // Use selected type as array with single element
      ).then(result => {
        console.log('✅ Upload successful:', result);
        return result;
      }).catch(error => {
        console.error(`❌ Upload failed for ${activeTab.value}:`, error);
        toastError(`Failed to upload document: ${error.message}`);
        return null;
      });
      uploadPromises.push(uploadPromise);
    }

    // Wait for all uploads to complete
    if (uploadPromises.length > 0) {
      console.log('🔍 Waiting for', uploadPromises.length, 'upload promises...');
      const results = await Promise.allSettled(uploadPromises);
      console.log('🔍 Upload results:', results);

      // Check if any uploads succeeded
      const successfulUploads = results.filter(result =>
        result.status === 'fulfilled' && result.value !== null
      );

      if (successfulUploads.length > 0) {
        // Clear uploaded files after successful upload
        uploadedDocuments.value = [];

        // Refresh request detail to get updated documents
        await loadRequestDetail();

        // Force remount components to show updated data
        await nextTick();
        documentSectionKey.value += 1;
        multiDocumentUploadKey.value += 1;

        toastSuccess("Data dan dokumen berhasil disimpan");
      } else {
        toastError("Data berhasil disimpan, namun gagal upload dokumen");
      }
    }
  } catch (error) {
    console.error("❌ Error during generic attachments upload:", error);
    toastError("Data berhasil disimpan, namun ada error saat upload dokumen");
  }
};

// Helper function to get document types for each category
const getCategoryDocumentTypes = (category) => {
  const documentTypeMap = {
    'address': ['3'], // KTP for address updates
    'family': ['2'], // KK (Kartu Keluarga) for family updates
    'payroll-account': ['7', '4'], // Buku Tabungan and NPWP for payroll
    'social-security': ['5', '6'], // Telkomedika and BPJS for social security
    'education': ['3'], // Ijazah for education (handled separately)
    'emergency-contact': [], // No documents required
    'medical-record': [] // No documents required
  };

  return documentTypeMap[category] || [];
};

// Check if category requires documents
const checkCategoryRequiresDocuments = (category) => {
  const categoriesRequiringDocuments = ['basic-information', 'address', 'family', 'payroll-account', 'social-security', 'education'];
  return categoriesRequiringDocuments.includes(category);
};

// Validate if category has required documents (either existing or uploaded)
const validateCategoryDocuments = (category) => {
  // Check if category requires documents
  if (!checkCategoryRequiresDocuments(category)) {
    return { isValid: true, message: '' };
  }

  // For education, skip this validation as it has its own validation logic
  if (category === 'education') {
    return { isValid: true, message: '' };
  }

  // Check for existing documents in DocumentSection
  const hasExisting = hasExistingAttachments.value;

  // Check for uploaded files in MultiFileUpload
  const hasUploaded = hasUploadedFiles.value;

  console.log('🔍 validateCategoryDocuments:', {
    category,
    hasExisting,
    hasUploaded,
    documentCount: documentCount.value,
    uploadedDocumentsLength: uploadedDocuments.value?.length || 0
  });

  // If either existing documents or uploaded files exist, validation passes
  if (hasExisting || hasUploaded) {
    return { isValid: true, message: '' };
  }

  // Get category-specific message
  const messageMap = {
    'basic-information': 'Please upload your KTP/ID Card document before submitting.',
    'address': 'Please upload your KTP/ID Card document before submitting.',
    'family': 'Please upload your Family Card (KK) document before submitting.',
    'payroll-account': 'Please upload your Bank Account Book and NPWP document before submitting.',
    'social-security': 'Please upload your BPJS and Telkomedika document before submitting.'
  };

  return {
    isValid: false,
    message: messageMap[category] || 'Please upload required documents before submitting.'
  };
};

// Generic file upload handlers for all categories
const handleFilesChanged = (files) => {
  console.log('🔍 handleFilesChanged for category:', activeTab.value, 'files:', files);
  console.log('🔍 Files structure:', files?.map(f => ({ name: f?.file?.name, ready: f?.ready, file: !!f?.file })));

  // Store files globally for all categories
  uploadedDocuments.value = files;

  // Also update the specific component if it's basic information
  if (activeTab.value === 'basic-information' && editDataBasicInfoRef.value) {
    editDataBasicInfoRef.value.uploadedDocuments = files;
  }

  console.log('🔍 uploadedDocuments.value after update:', uploadedDocuments.value);
};

// Generic upload handler for all categories
const handleUpload = async (uploadData) => {
  console.log('🔍 handleUpload for category:', activeTab.value, 'data:', uploadData);

  if (activeTab.value === 'basic-information') {
    // For basic info, delegate to component
    if (editDataBasicInfoRef.value) {
      console.log('Basic info upload delegated to component');
    }
  } else {
    // For other categories, handle upload here
    // The upload will be handled during save/submit process
    console.log(`Upload ready for ${activeTab.value} category`);
  }
};

// Legacy handlers for backward compatibility
const handleBasicInfoFilesChanged = (files) => {
  console.log('🔍 handleBasicInfoFilesChanged (legacy) - redirecting to generic handler');
  handleFilesChanged(files);
};

const handleBasicInfoUpload = async (uploadData) => {
  console.log('🔍 handleBasicInfoUpload (legacy) - redirecting to generic handler');
  await handleUpload(uploadData);
};

// Handle document count changes from DocumentSection
const handleDocumentCountChanged = (count) => {
  documentCount.value = count;
};

// Handle professional photo upload
const handleProfessionalPhotoUpload = (photoData) => {
  // Store in both parent and component levels for reliability
  if (photoData && photoData.file) {
    // Store in parent for global access
    professionalPhotoFile.value = photoData.file;
    console.log('� Professional photo uploaded:', photoData.file.name);

    // Also store in component level for compatibility
    if (editDataBasicInfoRef.value) {
      editDataBasicInfoRef.value.professionalPhotoFile = photoData.file;
      editDataBasicInfoRef.value.formData.professional_photo = photoData.dataUrl;
    }
  }
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

  // Check for KTP document in three places:
  // 1. requestDetail.documents (existing documents)
  const hasKTPDocument = requestDetail.value?.documents?.some(doc =>
    doc.document_type_code === '3' || doc.document_type === '3' ||
    doc.type === 'ktp' || doc.type === '3'
  );

  // 2. uploadedDocuments (newly uploaded) - specifically check for KTP documents
  const hasUploadedKTPDocuments = uploadedDocuments.value?.some(doc => {
    console.log('🔍 Checking uploaded doc:', doc);
    return doc.documentType === '3' || // KTP code
           doc.documentType === 'KTP' || doc.type === 'ktp' || doc.type === '3';
  });

  // 3. formData (if KTP is stored there)
  const hasKTPFile = formData.value?.ktp_doc || formData.value?.professional_photo;

  // Temporarily disable strict KTP attachment validation to allow save changes to proceed
  return { isValid: true };
};

// Auto-scroll to document upload area
const scrollToDocumentUpload = () => {
  if (process.client) {
    // Find MultiDocumentUpload section first (for basic-information), then DocumentSection (fallback)
    const uploadSection = document.querySelector('.multi-document-upload') ||
      document.querySelector('[data-section="documents"]') ||
      document.querySelector('.document-section') ||
      document.querySelector('DocumentSection');

    if (uploadSection) {
      uploadSection.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    } else {
      // Fallback: scroll to bottom of page
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    }
  }
};

// Generate change history for detailed tracking
const generateChangeHistory = (changes) => {
  const history = [];
  const now = new Date().toISOString();

  Object.entries(changes).forEach(([categoryKey, change]) => {

    // If we have field-level changes, use those for detailed tracking
    if (change.fieldChanges && typeof change.fieldChanges === 'object' && Object.keys(change.fieldChanges).length > 0) {
      Object.entries(change.fieldChanges).forEach(([fieldName, fieldChange]) => {
        history.push({
          field: `${categoryKey}.${fieldName}`,
          field_label: formatFieldLabel(fieldName),
          old_value: fieldChange.old,
          new_value: fieldChange.new,
          changed_at: now
        });
      });
    } else if (change.new && typeof change.new === 'object' && Object.keys(change.new).length > 0) {
      // Generate field-level changes from the new data if no fieldChanges exist
      Object.entries(change.new).forEach(([fieldName, newValue]) => {
        const oldValue = (change.old && typeof change.old === 'object') ? change.old[fieldName] : null;

        // Only add if the value is meaningful (not empty or null)
        if (newValue !== null && newValue !== undefined && newValue !== '') {
          history.push({
            field: `${categoryKey}.${fieldName}`,
            field_label: formatFieldLabel(fieldName),
            old_value: oldValue || '',
            new_value: newValue,
            changed_at: now
          });
        }
      });
    } else {
      // Fallback to category-level changes
      history.push({
        field: categoryKey,
        field_label: formatFieldLabel(categoryKey.replace('Data', '')),
        old_value: change.old || '',
        new_value: change.new || 'Updated via form submission',
        changed_at: now
      });
    }
  });

  return history;
};

// Format field label for display
const formatFieldLabel = (field) => {
  const fieldMap = {
    // Basic Information fields - using exact field names from form
    'name': 'Name',
    'no_ktp': 'KTP Number',
    'private_email': 'Private Email',
    'main_phone_number': 'Main Phone Number',
    'secondary_phone_number': 'Secondary Phone Number',
    'birth_date': 'Birth Date',
    'birth_place': 'Birth Place',
    'gender_id': 'Gender',
    'marital_status_id': 'Marital Status',
    'religion_id': 'Religion',
    'nationality_id': 'Nationality',
    'clothing_size_id': 'Clothing Size',
    'passport_number': 'Passport Number',
    'ktp_doc': 'KTP Document',
    'professional_photo': 'Professional Photo',

    // Other fields
    'business_email': 'Business Email',
    'nik': 'NIK',
    'nik_telkom': 'NIK Telkom',
    'directorate': 'Directorate',
    'business_unit': 'Business Unit',
    'division': 'Division',
    'grade': 'Grade',
    'grade_date': 'Grade Date',
    'band_position': 'Band Position',
    'band_position_date': 'Band Position Date',
    'level': 'Level',
    'level_date': 'Level Date',
    'position': 'Position',
    'supervisor': 'Direct Superior',
    'join_date': 'Join Date',
    'start_date': 'Start Date',
    'terminate_date': 'Terminate Date',
    'reason_employee_in': 'Reason Employee In',
    'reason_employee_out': 'Reason Employee Out',
    'status': 'Status',
    'retirement_date': 'Retirement Date',
    'street_name': 'Street Name',
    'house_number': 'House Number',
    'rt': 'RT',
    'rw': 'RW',
    'village': 'Village',
    'district': 'District',
    'city': 'City',
    'province': 'Province',
    'postal_code': 'Postal Code',
    'detail': 'Detail',
    'sub_district': 'Sub District',
    'administrative_village': 'Administrative Village',
    'domicile_same_as_ktp': 'Domicile Same as KTP',
    'domicile_street_name': 'Domicile Street Name',
    'domicile_street_number': 'Domicile Street Number',
    'domicile_rt': 'Domicile RT',
    'domicile_rw': 'Domicile RW',
    'domicile_village': 'Domicile Village',
    'domicile_district': 'Domicile District',
    'domicile_city': 'Domicile City',
    'domicile_province': 'Domicile Province',
    'domicile_postal_code': 'Domicile Postal Code',
    'relationship': 'Relationship',
    'phone_number': 'Phone Number',
    'address': 'Address',
    'number_rekening': 'Bank Account Number',
    'bank': 'Bank Name',
    'holder_name': 'Account Holder Name',
    'tax_status': 'Tax Status',
    'npwp': 'NPWP Number',
    'npwp_doc': 'NPWP Document',
    'saving_book_doc': 'Saving Book Document',
    'education_level': 'Education Level',
    'institution': 'Institution',
    'major': 'Major',
    'graduation_year': 'Graduation Year',
    'gpa': 'GPA',
    'start_year': 'Start Date',
    'end_year': 'End Date',
    'telkomedika_card_number': 'Telkomedika Card Number',
    'bpjs_tk_number': 'BPJS TK Number',
    'bpjs_tk_effective_date': 'BPJS TK Effective Date',
    'bpjs_health_number': 'BPJS Health Number',
    'telkomedika_doc': 'Telkomedika Document',
    'bpjs_doc': 'BPJS Document',
    'health_status': 'Health Status',
    'last_mcu_date': 'Last MCU Date',
    'blood_type': 'Blood Type',
    'height': 'Height',
    'weight': 'Weight',
    'has_disability': 'Has Disability',
    'head_size': 'Head Size',
    'health_concern': 'Health Concern',
    'medical_treatment_record': 'Medical Treatment Record',
    'occupation': 'Occupation',
    'relation': 'Relation',
    'member_sequence': 'Member Sequence',
    'telkomedika_member_status': 'Telkomedika Member Status',
    'kk_doc': 'KK Document',
    'family_document': 'Family Document'
  };

  // Check if the field is in our map first
  if (fieldMap[field]) {
    return fieldMap[field];
  }

  // If not in map, format the field name
  return field
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, l => l.toUpperCase());
};

// Handle tab change with proper debouncing and recursion prevention
let tabChangeTimeout = null;
const handleTabChange = (tabId) => {
  if (loadingFlags.value.tabChange) {
    return;
  }

  if (activeTab.value === tabId) {
    return;
  }

  // Clear any pending timeout
  if (tabChangeTimeout) {
    clearTimeout(tabChangeTimeout);
  }

  tabChangeTimeout = setTimeout(async () => {
    try {
      loadingFlags.value.tabChange = true;

      // Set the new active tab
      activeTab.value = tabId;

      // Special handling for address tab
      if (tabId === 'address') {

        // Check if we have address data
        const hasOriginalData = originalAddressData.value && Object.keys(originalAddressData.value).length > 0;
        const hasAddressData = addressData.value && Object.keys(addressData.value).length > 0;

        if (!hasOriginalData && !hasAddressData) {
          try {
            await loadAddress();
          } catch (error) {
          }
        } else {
        }

        // Ensure form data is updated for address
        await nextTick();
        const computedData = dynamicFormData.value;

        if (computedData && Object.keys(computedData).length > 0) {
          setFormDataSafely(computedData);
        } else {
        }
      } else {
        // Use nextTick to ensure DOM updates before loading data
        await nextTick();
        await loadCategoryData(tabId);
      }
    } catch (error) {
    } finally {
      loadingFlags.value.tabChange = false;
    }
  }, 100); // 100ms debounce
};

// Complete default address fields based on API structure and AddressForm requirements
const defaultAddressFields = {
  // Official/KTP address fields
  detail_ktp: '',
  province_ktp_id: '',
  province_ktp: '',
  city_ktp_id: '',
  city_ktp: '',
  postal_code_ktp: '',
  sub_distric_ktp: '',
  administrative_village_ktp: '',
  rt_ktp: '',
  rw_ktp: '',
  street_name_ktp: '',
  house_number_ktp: '',

  // Domicile address fields
  detail_domicile: '',
  province_domicile_id: '',
  province_domicile: '',
  city_domicile_id: '',
  city_domicile: '',
  postal_code_domicile: '',
  sub_distric_domicile: '',
  administrative_village_domicile: '',
  rt_domicile: '',
  rw_domicile: '',
  street_name_domicile: '',
  house_number_domicile: '',

  // Mapped fields for AddressForm compatibility
  official_address_detail: '',
  official_address_province: '',
  official_address_city: '',
  official_address_postal_code: '',
  official_address_subdistrict: '',
  official_address_administrative_village: '',
  official_address_rt: '',
  official_address_rw: '',
  official_address_street: '',
  official_address_house_number: '',

  domicile_address_detail: '',
  domicile_address_province: '',
  domicile_address_city: '',
  domicile_address_postal_code: '',
  domicile_address_subdistrict: '',
  domicile_address_administrative_village: '',
  domicile_address_rt: '',
  domicile_address_rw: '',
  domicile_address_street: '',
  domicile_address_house_number: '',
};

// Saat inisialisasi formData/dynamicFormData untuk address tab
// Track hydration per tab to avoid preserving empty initial data
const tabHydrated = ref({});

const assignFormData = (newData) => {
  let dataToAssign = newData;

  if (activeTab.value === 'address') {
    dataToAssign = { ...defaultAddressFields, ...newData };
  } else if (activeTab.value === 'emergency-contact') {
    // For emergency contact, ensure it's an array
    dataToAssign = Array.isArray(newData) ? newData : [];
  } else if (activeTab.value === 'education') {
    // For education, ensure it's an array
    dataToAssign = Array.isArray(newData) ? newData : [];
  }

  if (JSON.stringify(formData.value) !== JSON.stringify(dataToAssign)) {
    setFormDataSafely(dataToAssign);
    // mark current tab as hydrated after first successful assignment
    if (activeTab.value) {
      // Only mark hydrated if assigned data has meaningful content
      const hasMeaningful = dataToAssign && typeof dataToAssign === 'object' && Object.values(dataToAssign).some((v) => v !== null && v !== '' && v !== undefined && !(Array.isArray(v) && v.length === 0));
      if (hasMeaningful) {
        tabHydrated.value[activeTab.value] = true;
      } else {
      }
    }
  } else {
  }
};

// Handle documents changed
const handleDocumentsChanged = (documents) => {
  console.log('🔍 handleDocumentsChanged received:', documents);
  uploadedDocuments.value = documents;
};

// Handle document removed
const handleDocumentRemoved = (documentId) => {
  uploadedDocuments.value = uploadedDocuments.value.filter(doc => doc.id !== documentId);
};

// Validate form before submission
const validateForm = () => {

  // For edit page, we don't need to validate changeReason and consent here
  // because they will be filled in the ChangeRequestModal
  // Only validate if this is being called from a different context
  const isEditPageSubmission = true; // This is the edit page

  if (!isEditPageSubmission) {
    if (!changeReason.value.trim()) {
      toastError('Please provide a reason for the change request');
      return false;
    }

    if (!consent.value) {
      toastError('You must consent to the data processing');
      return false;
    }
  } else {
  }

  // For edit page, skip document validation as it will be handled in ChangeRequestModal
  if (!isEditPageSubmission) {
    // Validate required files based on category (same as update-data)
    const arrayTabs = ['emergency-contact', 'family', 'education'];
    const noDocumentTabs = ['emergency-contact', 'medical-record'];

    if (!noDocumentTabs.includes(activeTab.value)) {
      // Check if required documents are uploaded based on category
      const hasRequiredDocuments = checkRequiredDocuments();
      if (!hasRequiredDocuments) {
        const errorMessage = getRequiredDocumentMessage();
        toastError(errorMessage);
        return false;
      }
    }
  } else {
  }

  // Validate required fields based on active tab; when need revision, original fields may be locked
  if (activeTab.value === 'basic-information') {
    // Use the EditDataBasicInformation component's validation instead
    if (editDataBasicInfoRef.value) {
      const isValidBasicInfo = editDataBasicInfoRef.value.validateForm();
      if (!isValidBasicInfo) {
        return false;
      }
    } else {
      // Fallback validation if component is not available
      const basicData = formData.value;
      const statusInfo = normalizeStatus(requestDetail.value);
      const isDraft = statusInfo.isDraft;

      // For draft status, KTP validation is much more lenient
      if (isDraft) {
        // Check if KTP documents are uploaded - if yes, skip KTP field validation entirely
        const hasKtpDocuments = checkRequiredDocuments();
        const hasExistingAttachments = documentCount.value > 0 || 
                                     (uploadedDocuments.value && uploadedDocuments.value.length > 0) ||
                                     (requestDetail.value?.attachments && requestDetail.value.attachments.length > 0);
        
        if (hasKtpDocuments || hasExistingAttachments) {
          // Skip KTP field validation completely if documents are uploaded
        } else {
          // For draft without documents, be very lenient - allow empty KTP
          // Only validate format if KTP is provided
          if (basicData.no_ktp && basicData.no_ktp.trim() !== '') {
            if (basicData.no_ktp.length !== 16) {
              toastError('KTP Number must be exactly 16 digits');
              return false;
            }

            if (!/^\d+$/.test(basicData.no_ktp)) {
              toastError('KTP Number can only contain numbers');
              return false;
            }
          }
          // Don't require KTP for draft - allow empty
        }
      } else {
        // For non-draft status, validate KTP field but be lenient for need revision
        const isNeedRevision = requestDetail.value?.status === '3' || requestDetail.value?.status === 3 || 
                              (requestDetail.value?.status_label && requestDetail.value.status_label.toLowerCase().includes('revision'));
        
        // Skip KTP validation entirely for need revision status
        if (!isNeedRevision) {
          if (!basicData.no_ktp || basicData.no_ktp.trim() === '') {
            toastError('ID Number (KTP) is required and cannot be empty');
            return false;
          }

          if (basicData.no_ktp && basicData.no_ktp.length !== 16) {
            toastError('KTP Number must be exactly 16 digits');
            return false;
          }
        }

        // Validate KTP format only for non-need revision status
        const isNeedRevisionStatus = requestDetail.value?.status === '3' || requestDetail.value?.status === 3 || 
                                    (requestDetail.value?.status_label && requestDetail.value.status_label.toLowerCase().includes('revision'));
        
        if (basicData.no_ktp && !/^\d+$/.test(basicData.no_ktp) && !isNeedRevisionStatus) {
          toastError('KTP Number can only contain numbers');
          return false;
        }
      }
    }
  }

  return true;
};

// Validate education attachments - check if EACH record has attachments
const validateEducationAttachments = (educationData) => {
  if (!Array.isArray(educationData) || educationData.length === 0) {
    return { isValid: true }; // No education data to validate
  }

  const attachments = requestDetail.value?.attachments || requestDetail.value?.documents || [];

  // Check EACH education record must have a file (existing or pending)
  for (let i = 0; i < educationData.length; i++) {
    const record = educationData[i];
    const clientKey = record.client_key;
    let hasFile = false;

    if (clientKey) {
      // Check for existing attachments
      const existingAttachments = attachments.filter(attachment =>
        attachment.client_key === clientKey
      );

      if (existingAttachments.length > 0) {
        hasFile = true;
      }
    }

    // Check for pending uploads in the record
    if (!hasFile && record.pendingUploads && record.pendingUploads.length > 0) {
      hasFile = true;
    }

    // If this record doesn't have any file, return error with record index
    if (!hasFile) {
      // Scroll to the record with missing attachment
      setTimeout(() => {
        const recordElements = document.querySelectorAll('.education-record-card');
        if (recordElements[i]) {
          recordElements[i].scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
          // Add highlight effect
          recordElements[i].classList.add('ring-2', 'ring-red-500', 'ring-offset-2');
          setTimeout(() => {
            recordElements[i].classList.remove('ring-2', 'ring-red-500', 'ring-offset-2');
          }, 3000);
        }
      }, 100);

      return {
        isValid: false,
        message: `Education record #${i + 1} is missing an ijazah document. Please upload the document for all records.`
      };
    }
  }

  return { isValid: true };
};

// Check if required documents are uploaded based on category (same as ChangeRequestModal)
const checkRequiredDocuments = () => {
  try {
    const noDocumentTabs = ['emergency-contact', 'medical-record'];

    // For tabs that require no documents, always return true
    if (noDocumentTabs.includes(activeTab.value)) {
      return true;
    }

    // Get existing attachments from requestDetail (DocumentSection)
    let existingAttachments = requestDetail.value?.attachments || requestDetail.value?.documents || [];

    // Safety check to prevent errors
    if (!Array.isArray(existingAttachments)) {
      existingAttachments = [];
    }

    // For basic information and address, require KTP
    if (activeTab.value === 'basic-information' || activeTab.value === 'address') {
      const hasKtpInAttachments = existingAttachments.some(attachment =>
        attachment.document_type_code === '1' || // KTP code is '1'
        attachment.document_type_code === '3' || // Alternative KTP code
        (attachment.document_type && attachment.document_type === 'KTP') ||
        (attachment.document_type && attachment.document_type === 'ID Card')
      );

      // Also check uploadedDocuments for pending uploads
      const hasKtpInUploads = uploadedDocuments.value.some(file =>
        file.documentType === '1' || // KTP code is '1'
        file.documentType === '3' || // Alternative KTP code
        (file.documentType && file.documentType === 'KTP')
      );

      const result = hasKtpInAttachments || hasKtpInUploads;

      return result;
    }

    // For payroll account, require Buku Tabungan and NPWP
    if (activeTab.value === 'payroll-account') {
      const hasBukuTabungan = existingAttachments.some(attachment =>
        attachment.document_type_code === '7' || // Buku Tabungan code is '7'
        (attachment.document_type && attachment.document_type === 'Buku Tabungan')
      ) || uploadedDocuments.value.some(file =>
        file.documentType === '7' || // Buku Tabungan code is '7'
        (file.documentType && file.documentType === 'Buku Tabungan')
      );

      const hasNPWP = existingAttachments.some(attachment =>
        attachment.document_type_code === '4' || // NPWP code is '4'
        (attachment.document_type && attachment.document_type === 'NPWP')
      ) || uploadedDocuments.value.some(file =>
        file.documentType === '4' || // NPWP code is '4'
        (file.documentType && file.documentType === 'NPWP')
      );

      return hasBukuTabungan && hasNPWP;
    }

    // For family, require KK
    if (activeTab.value === 'family') {
      return existingAttachments.some(attachment =>
        attachment.document_type_code === '2' || // KK code is '2'
        (attachment.document_type && attachment.document_type === 'KK')
      ) || uploadedDocuments.value.some(file =>
        file.documentType === '2' || // KK code is '2'
        (file.documentType && file.documentType === 'KK')
      );
    }

    // For education, require Ijazah
    if (activeTab.value === 'education') {
      return existingAttachments.some(attachment =>
        attachment.document_type_code === '3' || // Ijazah code is '3'
        (attachment.document_type && attachment.document_type === 'Ijazah')
      ) || uploadedDocuments.value.some(file =>
        file.documentType === '3' || // Ijazah code is '3'
        (file.documentType && file.documentType === 'Ijazah')
      );
    }

    // For Benefit, require Telkomedika and BPJS
    if (activeTab.value === 'social-security') {
      const hasTelkomedika = existingAttachments.some(attachment =>
        attachment.document_type_code === '5' || // Telkomedika code is '5'
        (attachment.document_type && attachment.document_type === 'Telkomedika')
      ) || uploadedDocuments.value.some(file =>
        file.documentType === '5' || // Telkomedika code is '5'
        (file.documentType && file.documentType === 'Telkomedika')
      );

      const hasBPJS = existingAttachments.some(attachment =>
        attachment.document_type_code === '6' || // BPJS code is '6'
        (attachment.document_type && attachment.document_type === 'BPJS')
      ) || uploadedDocuments.value.some(file =>
        file.documentType === '6' || // BPJS code is '6'
        (file.documentType && file.documentType === 'BPJS')
      );

      return hasTelkomedika && hasBPJS;
    }

    return true; // Default to true for other categories

  } catch (error) {
    console.error('❌ Error in checkRequiredDocuments:', error);
    return true; // Return true to prevent blocking submission
  }
};

// Validate that all uploaded documents have document type selected
const validateDocumentTypesSelected = () => {
  try {
    // Only validate for categories that use MultiDocumentUpload with type selector
    const categoriesWithTypeSelector = ['payroll-account', 'social-security'];

    if (!categoriesWithTypeSelector.includes(activeTab.value)) {
      return { isValid: true };
    }

    // Check if there are uploaded documents pending
    if (!uploadedDocuments.value || uploadedDocuments.value.length === 0) {
      return { isValid: true }; // No files to validate
    }

    // Check if any file doesn't have document type selected
    const filesWithoutType = uploadedDocuments.value.filter(file =>
      !file.documentType || file.documentType === '' || file.documentType === 'Select Type'
    );

    if (filesWithoutType.length > 0) {
      const categoryLabel = activeTab.value === 'payroll-account' ? 'Payroll Account' : 'Benefit';
      return {
        isValid: false,
        message: `Please select document type for all uploaded files in ${categoryLabel} section before saving.`
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error('❌ Error in validateDocumentTypesSelected:', error);
    return { isValid: true }; // Return true to prevent blocking on error
  }
};

// Get required document message based on category
const getRequiredDocumentMessage = () => {
  if (activeTab.value === 'basic-information' || activeTab.value === 'address') {
    return "KTP document is required for this update. Please upload your KTP document.";
  }
  if (activeTab.value === 'payroll-account') {
    return "Buku Tabungan and NPWP documents are required for payroll account updates. Please upload both documents.";
  }
  if (activeTab.value === 'family') {
    return "KK (Kartu Keluarga) document is required for family updates. Please upload your KK document.";
  }
  if (activeTab.value === 'education') {
    return "Ijazah document is required for education updates. Please upload your Ijazah document.";
  }
  if (activeTab.value === 'social-security') {
    return "Telkomedika and BPJS documents are required for Benefit updates. Please upload both documents.";
  }
  return "Required documents are missing. Please upload the required documents.";
};

// Helper function to get change type from active tab
const getChangeTypeFromTab = (tab) => {
  const changeTypeMap = {
    'basic-information': 'BSC',
    'address': 'ADR',
    'emergency_contact': 'EMC',
    'payroll_account': 'PYR',
    'family': 'FMY',
    'education': 'EDC',
    'social_security': 'SSI',
    'medical_record': 'MDR',
    'employment_info': 'EMP'
  };
  return changeTypeMap[tab] || 'BSC';
};

// Fetch missing address data when old_data is null
const fetchMissingAddressData = async () => {
  if (activeTab.value !== 'address') return;

  const oldData = requestDetail.value?.old_data;
  // Consider old_data missing when:
  // - not present
  // - explicitly null
  // - or too sparse / missing common flat address keys from API
  const sparseFlat = (() => {
    if (!oldData || typeof oldData !== 'object') return true;
    const keys = Object.keys(oldData);
    if (keys.length <= 2) return true; // too few keys
    const importantKeys = [
      'detail_ktp', 'province_ktp_id', 'city_ktp_id',
      'detail_domicile', 'province_domicile_id', 'city_domicile_id'
    ];
    return !importantKeys.some(k => oldData[k] !== undefined && oldData[k] !== null && oldData[k] !== '');
  })();
  const hasNullAddressData = !oldData || oldData === null ||
    (oldData && oldData.official_address === null && oldData.domicile_address === null) ||
    sparseFlat;

  if (hasNullAddressData) {
    try {
      const employeeAddressResponse = await apiGet('/employee/address');

      if (employeeAddressResponse.success && employeeAddressResponse.data) {
        const employeeDataFlat = employeeAddressResponse.data;

        // Backfill requestDetail.old_data to provide a proper baseline for draft comparison
        try {
          if (requestDetail.value) {
            requestDetail.value = {
              ...requestDetail.value,
              old_data: {
                ...(requestDetail.value.old_data || {}),
                ...employeeDataFlat
              }
            };
          }
        } catch (e) {
        }

        // Let the existing reactive flow handle updating formData to avoid layout shifts
        window.isDraftDataLoading = true;
        await nextTick();
      }
    } catch (error) {
    }
  }
};

// Process API data for draft and need revision status
const processApiData = async () => {
  if (!requestDetail.value) return;

  const status = requestDetail.value.status;
  const statusLabel = requestDetail.value.status_label;

  // Special debug for address
  if (activeTab.value === 'address' || requestDetail.value.request_type === 'ADR') {
  }

  // For draft status: merge old_data with new_data.data
  if (status === 'draft' || status === '1' || statusLabel?.toLowerCase() === 'draft') {

    // Handle array data (emergency-contact, family, education) differently
    const arrayTabs = ['emergency-contact', 'family', 'education'];
    const currentTabType = requestDetail.value.request_type;

    // Map request_type to tab name
    const tabMapping = {
      'BSC': 'basic-information',
      'ADR': 'address',
      'EMC': 'emergency-contact',
      'PYR': 'payroll-account',
      'FMY': 'family',
      'EDC': 'education',
      'SSI': 'social-security',
      'MDR': 'medical-record',
    };

    const currentTab = tabMapping[currentTabType] || activeTab.value || 'basic-information';

    if (arrayTabs.includes(currentTab)) {
      // For array data, merge old_data with new_data.data
      let arrayData = [];

      if (requestDetail.value.new_data?.data && requestDetail.value.old_data) {
        // Merge old_data with new_data.data for complete data
        const oldDataArray = Array.isArray(requestDetail.value.old_data)
          ? requestDetail.value.old_data
          : [requestDetail.value.old_data];
        const newDataArray = Array.isArray(requestDetail.value.new_data.data)
          ? requestDetail.value.new_data.data
          : [requestDetail.value.new_data.data];

        // For family, merge by id_family
        if (currentTab === 'family') {
          // First, load original family data to get complete data
          await loadFamily();
          const originalFamilyData = familyData.value || [];

          // Merge original data with changes
          arrayData = originalFamilyData.map(originalItem => {
            const oldItem = oldDataArray.find(oldItem =>
              (oldItem.id_family || oldItem.id) === (originalItem.id_family || originalItem.id)
            );
            const newItem = newDataArray.find(newItem =>
              (newItem.id_family || newItem.id) === (originalItem.id_family || originalItem.id)
            );

            if (oldItem || newItem) {
              // This item was changed, merge original with changes
              return {
                ...originalItem,
                ...(oldItem || {}),
                ...(newItem || {})
              };
            }
            return originalItem;
          });
        } else {
          // For other array types, use new_data directly
          arrayData = newDataArray;
        }
      } else if (requestDetail.value.old_data) {
        // Fallback to old_data if new_data doesn't exist
        arrayData = Array.isArray(requestDetail.value.old_data)
          ? requestDetail.value.old_data
          : [requestDetail.value.old_data];
      }

      setFormDataSafely(arrayData);

      // Update original data for comparison
      switch (currentTab) {
        case 'emergency-contact':
          originalEmergencyContactData.value = [...arrayData];
          break;
        case 'family':
          originalFamilyData.value = [...arrayData];
          break;
        case 'education':
          originalEducationData.value = [...arrayData];
          break;
      }
    } else {
      // For object data, merge old_data with new_data.data, prioritizing new_data

      if (requestDetail.value.old_data && requestDetail.value.new_data?.data) {
        const oldDataMapped = mapApiToFormFields(requestDetail.value.old_data, currentTab);
        const newDataMapped = mapApiToFormFields(requestDetail.value.new_data.data, currentTab);
        const mergedData = {
          ...oldDataMapped,
          ...newDataMapped
        };

        // Update formData with merged data
        setFormDataSafely(mergedData);

        // Also update the original data for comparison
        switch (currentTab) {
          case 'basic-information':
            originalEmployeeData.value = { ...oldDataMapped };
            break;
          case 'address':
            break;
          case 'payroll-account':
            originalPayrollAccountData.value = { ...oldDataMapped };
            break;
          case 'social-security':
            originalSocialSecurityData.value = { ...oldDataMapped };
            break;
          case 'medical-record':
            originalMedicalRecordData.value = { ...oldDataMapped };
            break;
        }
      }
    }
  }

  // For need revision/rejected status: merge old_data (original) with new_data (changes)
  else if (status === 'rejected' || status === '3' || statusLabel?.toLowerCase().includes('revision') || statusLabel?.toLowerCase().includes('rejected')) {

    const tabId = mapRequestTypeToTab(requestDetail.value.request_type);

    // Ensure original base is loaded before merging (need revision)
    try {
      if (tabId === 'basic-information' && (!originalEmployeeData.value || Object.keys(originalEmployeeData.value).length === 0)) {
        await loadBasicInformation();
      } else if (tabId === 'address' && (!originalAddressData.value || Object.keys(originalAddressData.value).length === 0)) {
        await loadAddress();
      } else if (tabId === 'payroll-account' && (!originalPayrollAccountData.value || Object.keys(originalPayrollAccountData.value).length === 0)) {
        await loadPayrollAccount();
      } else if (tabId === 'social-security' && (!originalSocialSecurityData.value || Object.keys(originalSocialSecurityData.value).length === 0)) {
        await loadSocialSecurity();
      } else if (tabId === 'medical-record' && (!originalMedicalRecordData.value || Object.keys(originalMedicalRecordData.value).length === 0)) {
        await loadMedicalRecord();
      } else if (tabId === 'emergency-contact' && (!originalEmergencyContactData.value || originalEmergencyContactData.value.length === 0)) {
        await loadEmergencyContact();
      } else if (tabId === 'family' && (!originalFamilyData.value || originalFamilyData.value.length === 0)) {
        await loadFamily();
      } else if (tabId === 'education' && (!originalEducationData.value || originalEducationData.value.length === 0)) {
        await loadEducation();
      }
    } catch (e) {
    }
    const oldDataRaw = requestDetail.value?.old_data ?? (Array.isArray(requestDetail.value?.old_data) ? requestDetail.value.old_data : {});
    const newDataRaw = requestDetail.value?.new_data?.data;

    // If no new_data, still show original
    if (!newDataRaw) {
      const base = mapApiToFormFields(oldDataRaw || {}, tabId);
      setFormDataSafely(base);
      return;
    }

    // Helper: pick original base when old_data is missing/sparse
    const pickOriginalBase = () => {
      if (tabId === 'basic-information') return originalEmployeeData.value || employeeData.value || {};
      if (tabId === 'address') return originalAddressData.value || addressData.value || {};
      if (tabId === 'payroll-account') return originalPayrollAccountData.value || payrollAccountData.value || {};
      if (tabId === 'social-security') return originalSocialSecurityData.value || socialSecurityData.value || {};
      if (tabId === 'medical-record') return originalMedicalRecordData.value || medicalRecordData.value || {};
      if (tabId === 'emergency-contact') return originalEmergencyContactData.value || emergencyContactData.value || [];
      if (tabId === 'family') return originalFamilyData.value || familyData.value || [];
      if (tabId === 'education') return originalEducationData.value || educationData.value || [];
      return {};
    };

    // Arrays (emergency-contact, family, education) use resolvers to merge
    if (tabId === 'emergency-contact') {
      const baseArr = Array.isArray(pickOriginalBase()) ? pickOriginalBase() : [];
      const oldArr = Array.isArray(oldDataRaw) && oldDataRaw.length > 0 ? oldDataRaw : [];
      const newArr = Array.isArray(newDataRaw) ? newDataRaw : [];
      const merged = resolveEmergency(baseArr, oldArr, newArr);
      setFormDataSafely(merged);
      return;
    }
    if (tabId === 'education') {
      const baseArr = Array.isArray(pickOriginalBase()) ? pickOriginalBase() : [];
      const oldArr = Array.isArray(oldDataRaw) && oldDataRaw.length > 0 ? oldDataRaw : [];
      const newArr = Array.isArray(newDataRaw) ? newDataRaw : [];
      const merged = resolveEducation(baseArr, oldArr, newArr);
      setFormDataSafely(merged);
      return;
    }
    if (tabId === 'family') {
      const baseArr = Array.isArray(pickOriginalBase()) ? pickOriginalBase() : [];
      const oldArr = Array.isArray(oldDataRaw) && oldDataRaw.length > 0 ? oldDataRaw : [];
      const newArr = Array.isArray(newDataRaw) ? newDataRaw : [];
      // For family, show base; when components load, they will allow editing on changed rows
      const merged = newArr && newArr.length > 0 ? newArr : (oldArr.length > 0 ? oldArr : baseArr);
      setFormDataSafely(merged);
      return;
    }

    // Objects: map both and overlay changes, using original base when needed
    const isSparseObject = (obj) => {
      if (!obj || typeof obj !== 'object') return true;
      const keys = Object.keys(obj);
      if (keys.length === 0) return true;
      // Consider sparse if all values are null/undefined/empty string
      const allEmpty = keys.every(k => obj[k] === null || obj[k] === undefined || obj[k] === '');
      return allEmpty;
    };

    // Build a robust base: start from original base; apply only non-null old_data values
    const originalBaseCandidate = pickOriginalBase();
    let originalBaseRaw = {};
    if (isSparseObject(oldDataRaw)) {
      originalBaseRaw = originalBaseCandidate;
    } else {
      originalBaseRaw = { ...originalBaseCandidate };
      Object.keys(oldDataRaw || {}).forEach((k) => {
        const v = oldDataRaw[k];
        if (v !== null && v !== undefined && v !== '') originalBaseRaw[k] = v;
      });
    }

    // SPECIAL: For basic-information, guarantee ID fields are present from original
    if (tabId === 'basic-information') {
      const ensureId = (obj) => {
        if (obj) {
          const idKtp = obj.no_ktp || originalEmployeeData.value?.no_ktp || '';
          if (!obj.no_ktp) obj.no_ktp = idKtp;
          if (!obj.no_ktp) obj.no_ktp = idKtp;
        }
      };
      ensureId(originalBaseRaw);
      // Only add no_ktp to newDataRaw if it was actually in the original new_data
      if (requestDetail.value?.new_data?.data?.no_ktp !== undefined) {
        ensureId(newDataRaw);
      }
    }

    const oldMapped = mapApiToFormFields(originalBaseRaw || {}, tabId);
    const newMapped = mapApiToFormFields(newDataRaw || {}, tabId);

    // Helper to overlay only non-null values
    const overlayNonNull = (base, overlay) => {
      const result = { ...base };
      Object.keys(overlay || {}).forEach((k) => {
        const v = overlay[k];
        if (v !== null && v !== undefined && v !== '') result[k] = v;
      });
      return result;
    };

    let mergedObj = { ...oldMapped };

    // SPECIAL: Make rejected behave like draft for basic-information by using full original API data as baseline
    if (tabId === 'basic-information') {
      const originalApi = employeeData.value || {};
      const baseMapped = mapApiToFormFields(originalApi, 'basic-information');
      const oldOverlay = overlayNonNull(baseMapped, oldMapped);

      // For need revision, only overlay fields that are in new_data
      const filteredNewMapped = {};
      Object.keys(newMapped).forEach(key => {
        if (newDataRaw && key in newDataRaw) {
          filteredNewMapped[key] = newMapped[key];
        }
      });

      mergedObj = overlayNonNull(oldOverlay, filteredNewMapped);
    } else {
      mergedObj = overlayNonNull(oldMapped, newMapped);
    }

    if (tabId === 'address') {
      // Use resolver for address to ensure proper structure
      const employeeBase = oldMapped || {};
      const mergedResolved = resolveAddress(employeeBase, originalBaseRaw || {}, newDataRaw || {});
      mergedObj = { ...mergedObj, ...mergedResolved };
    } else if (tabId === 'payroll-account') {
      mergedObj = resolvePayroll(oldMapped || {}, originalBaseRaw || {}, newDataRaw || {});
    } else if (tabId === 'social-security') {
      mergedObj = resolveSocial(oldMapped || {}, originalBaseRaw || {}, newDataRaw || {});
    } else if (tabId === 'medical-record') {
      mergedObj = resolveMedical(oldMapped || {}, originalBaseRaw || {}, newDataRaw || {});
    }

    setFormDataSafely(mergedObj);
    // Store baseline for lock enforcement
    needRevisionBaseline.value = { ...mergedObj };
  }

  // Set active tab based on request_type
  if (requestDetail.value.request_type) {
    const tabMap = {
      'BSC': 'basic-information',
      'ADR': 'address',
      'EMC': 'emergency-contact',
      'PYR': 'payroll-account',
      'FMY': 'family',
      'EDC': 'education',
      'SSI': 'social-security',
      'MDR': 'medical-record',
    };

    const mappedTab = tabMap[requestDetail.value.request_type];
    if (mappedTab) {
      activeTab.value = mappedTab;
    }
  }
};

// Initialize with proper error handling and recursion prevention
onMounted(async () => {
  // Ensure we have a valid request ID before proceeding
  if (!requestId.value) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Request ID is required",
    });
  }

  try {
    // Load request details first
    await loadRequestDetail();

    // Check if request status allows editing
    if (requestDetail.value) {
      const statusInfo = normalizeStatus(requestDetail.value);
      const status = statusInfo.normalized;

      // If status is waiting approval (2) or approved (4), redirect to 404 or history
      if (status === '2' || status === '4') {
        // Waiting approval or approved - should not be editable
        console.log('🚫 Edit access denied: Status is', status === '2' ? 'waiting approval' : 'approved');
        throw createError({
          statusCode: 404,
          statusMessage: 'Change request not found or no longer editable'
        });
      }
    }

    // Process API data for draft and need revision status
    if (requestDetail.value) {
      await processApiData();
    } else {
    }

    // If request detail loaded successfully, determine active tab
    if (requestDetail.value) {
      // Use URL category if provided, otherwise use first category from API
      if (!activeTab.value) {
        if (urlCategory.value) {
          activeTab.value = urlCategory.value;
        } else if (requestDetail.value.categories?.length > 0) {
          activeTab.value = requestDetail.value.categories[0];
        } else if (!activeTab.value) {
          // Fallback to basic-information if no categories
          activeTab.value = 'basic-information';
        }
      }

      // For draft status, ensure we have both original data and changes data
      if (requestDetail.value.status === 'draft' || requestDetail.value.status === 'rejected') {

        // Load original data from all relevant APIs to enable proper change tracking
        try {

          // ✅ OPTIMIZED: Master data is now preloaded in layout, no need to load here

          // ✅ OPTIMIZED: Only load data for active tab to reduce network requests

          // Always load basic information first (needed for all tabs)
          if (!basicInfoLoaded.value) {
            await loadBasicInformation();
            basicInfoLoaded.value = true;
          }

          // Load data only for the active tab (not all tabs)
          if (activeTab.value && activeTab.value !== 'basic-information') {
            await loadCategoryData(activeTab.value);
          }

          // Force a reactive update to dynamicFormData
          await nextTick();

          // Mark initialization as complete

        } catch (error) {
          // Mark initialization as complete even if error
          isInitializing.value = false;
        }
      }

      // For other statuses, load data based on existing logic
      if (requestDetail.value.status !== 'draft' && requestDetail.value.status !== 'rejected') {
        // Don't load basic information or category data here - they should come from loadRequestDetail
        // Only load if loadRequestDetail didn't provide the data
        if (!formData.value || Object.keys(formData.value).length === 0) {
          if (!basicInfoLoaded.value) {
            await loadBasicInformation();
            basicInfoLoaded.value = true;
          }

          // Load data for the active tab if set
          if (activeTab.value) {
            await loadCategoryData(activeTab.value);
          }
        } else {
        }
      }

      // Always ensure original data is loaded for proper change tracking
      if (!originalEmployeeData.value || Object.keys(originalEmployeeData.value).length === 0) {
        if (!basicInfoLoaded.value) {
          await loadBasicInformation();
          basicInfoLoaded.value = true;
        }
      }

      // Mark initialization as complete for all cases
      isInitializing.value = false;
    } else {
      // Mark initialization as complete even if failed
      isInitializing.value = false;
    }
  } catch (err) {
    // If loadRequestDetail throws an error (like 404), it will be caught here
    // and re-thrown to trigger the error page

    // Always reset isInitializing even if there's an error
    isInitializing.value = false;

    throw err;
  } finally {
    // Ensure isInitializing is always reset
    if (isInitializing.value) {
      isInitializing.value = false;
    }
  }
});

// Page Meta
definePageMeta({
  layout: "update-data",
  middleware: 'rbac',
  permissions: ['update_data_personal']
});

// Watch for changes in original data to trigger re-computation
watch([originalEmployeeData, originalAddressData, originalEmergencyContactData, originalPayrollAccountData,
  originalFamilyData, originalEducationData, originalSocialSecurityData, originalMedicalRecordData,
  requestDetail, activeTab], () => {

    // Force reactive update by triggering dynamicFormData computation
    nextTick(() => {
      const currentData = dynamicFormData.value;

      // Force form component to re-render by updating formData if needed
      if (currentData && Object.keys(currentData).length > 0) {
        formData.value = { ...currentData };
      }
    });
  }, { deep: true, immediate: false });

// Watch activeTab changes to ensure proper data loading
watch(activeTab, async (newTab, oldTab) => {
  if (newTab && newTab !== oldTab && requestDetail.value) {

    // Ensure original data is loaded for the new tab
    if (requestDetail.value?.status === 'draft' || requestDetail.value?.status === 'rejected') {

      // Check if we need to load data for the new tab
      let needsLoading = false;

      switch (newTab) {
        case 'basic-information':
          needsLoading = !originalEmployeeData.value || Object.keys(originalEmployeeData.value).length === 0;
          break;
        case 'address':
          needsLoading = !originalAddressData.value || Object.keys(originalAddressData.value).length === 0;
          break;
        case 'emergency-contact':
          needsLoading = !originalEmergencyContactData.value || originalEmergencyContactData.value.length === 0;
          break;
        case 'payroll-account':
          needsLoading = !originalPayrollAccountData.value || Object.keys(originalPayrollAccountData.value).length === 0;
          break;
        case 'family':
          needsLoading = !originalFamilyData.value || originalFamilyData.value.length === 0;
          break;
        case 'education':
          needsLoading = !originalEducationData.value || originalEducationData.value.length === 0;
          break;
        case 'social-security':
          needsLoading = !originalSocialSecurityData.value || Object.keys(originalSocialSecurityData.value).length === 0;
          break;
        case 'medical-record':
          needsLoading = !originalMedicalRecordData.value || Object.keys(originalMedicalRecordData.value).length === 0;
          break;
      }

      // Only load if needed to avoid unnecessary network requests
      if (needsLoading) {
        await loadCategoryData(newTab);
      } else {
        // Still load medical options if switching to medical-record tab
        if (newTab === 'medical-record') {
          await loadMedicalMasterOptions();
        }
      }

      // Force reactive update after loading original data
      await nextTick();
    }
  }
});

// Clean up timeouts on unmount
import { onUnmounted } from 'vue';

onUnmounted(() => {
  if (formUpdateTimeout) {
    clearTimeout(formUpdateTimeout);
  }
  if (categoryLoadTimeout) {
    clearTimeout(categoryLoadTimeout);
  }
  if (tabChangeTimeout) {
    clearTimeout(tabChangeTimeout);
  }
});

// Handle submit request with better error handling
const handleSubmitRequest = async () => {
  try {
    // Validate form
    if (!validateForm()) {
      return;
    }

    // Get only the changed fields
    const changes = changedFields.value;

    if (Object.keys(changes).length === 0) {
      // For family tab, check for actual changes manually
      if (activeTab.value === 'family') {
        const currentFamilyData = formData.value || [];
        const originalFamily = originalFamilyData.value || [];
        const hasFamilyChanges = JSON.stringify(currentFamilyData) !== JSON.stringify(originalFamily);
        if (!hasFamilyChanges) {
          toastInfo('No changes detected to submit');
          return;
        }
      } else {
        toastInfo('No changes detected to submit');
        return;
      }
    }

    // Additional check for array-based tabs to ensure they have data
    if (activeTab.value === 'education' || activeTab.value === 'emergency-contact') {
      const arrayData = changes[activeTab.value.replace('-', '_')];
      if (!arrayData || (Array.isArray(arrayData) && arrayData.length === 0)) {
        toastInfo('No changes detected. Please make some changes before submitting.');
        return;
      }
    }

    // For family tab: skip all validation, always proceed to modal

    // Prepare payload with only changed data for PUT method
    const payload = {
      currentTab: activeTab.value,
      changes: changes, // Send changed fields
      note_employee: changeReason.value || 'Request submitted for approval',
      consent: consent.value,
      submit: true // This submits for approval
    };

    // Use PUT method for updating existing draft
    const { useChangeRequestSubmit } = await import('~/composables/useChangeRequestSubmit');
    const { updateChangeRequest } = useChangeRequestSubmit();

    isSubmitting.value = true;
    const response = await updateChangeRequest(requestId.value, payload);

    if (response.success) {
      toastSuccess('Changes submitted successfully');

      // Update requestDetail with new data and status
      if (response.data) {
        requestDetail.value = {
          ...requestDetail.value,
          ...response.data
        };
      }

      // Store success message for display on history page
      localStorage.setItem('pendingSuccessMessage', JSON.stringify({
        title: 'Change Request Submitted',
        message: 'Your change request has been submitted successfully.',
        type: 'success'
      }));

      // Redirect to history page
      await navigateTo('/update-data/history');
    } else {
      throw new Error(response.message || 'Failed to submit request');
    }

  } catch (error) {
    toastError(`Failed to submit request: ${error.message}`);
  } finally {
    isSubmitting.value = false;
  }
};

// Prevent duplicate submit calls
let lastSubmitCall = 0;
const SUBMIT_DEBOUNCE_TIME = 2000; // 2 seconds

// Handle direct submit from PageActions component
const handleSubmitDirect = async () => {
  const timestamp = Date.now();

  // Debounce to prevent duplicate calls
  if (timestamp - lastSubmitCall < SUBMIT_DEBOUNCE_TIME) {
    console.log('🔍 handleSubmitDirect blocked by debounce');
    return;
  }
  lastSubmitCall = timestamp;

  console.log('🔍 handleSubmitDirect called at:', timestamp);

  try {

    // Check if we have a valid active tab
    if (!activeTab.value) {
      toastError("Please select a tab to submit");
      return;
    }

    // Validate form first
    const formValidation = validateForm();
    if (!formValidation) {
      return;
    }

    // Validate required documents for categories that need file uploads
    const documentValidation = validateCategoryDocuments(activeTab.value);
    if (!documentValidation.isValid) {
      toastWarning(documentValidation.message);
      return;
    }

    // Additional validation for education tab - check if files are uploaded
    if (activeTab.value === 'education') {
      // Get the education form component reference
      const educationFormRef = currentFormRef.value;
      if (educationFormRef && educationFormRef.validateEducationFiles) {
        const hasValidFiles = educationFormRef.validateEducationFiles();
        if (!hasValidFiles) {
          toastWarning('Please upload ijazah document for all education records before submitting.');
          return;
        }
      }
    }

    // Auto-upload pending files for education BEFORE validation
    if (activeTab.value === 'education') {
      // Check if there are pending uploads that need to be uploaded first
      const currentEducationData = formData.value || [];
      let hasPendingUploads = false;

      if (Array.isArray(currentEducationData)) {
        for (const record of currentEducationData) {
          if (record.pendingUploads && record.pendingUploads.length > 0) {
            hasPendingUploads = true;
            break;
          }
        }
      }

      if (hasPendingUploads) {
        toastInfo('Uploading files before submission...');

        try {
          await handleEducationAttachmentUploads(requestId.value);

          // Refresh request detail to get updated attachments
          await loadRequestDetail();

          toastSuccess('Files uploaded successfully, proceeding with submission...');
        } catch (error) {
          console.error('Error uploading education files:', error);
          toastError('Failed to upload files. Please try again.');
          return;
        }
      }

      // Now validate education attachments
      const validationResult = validateEducationAttachments(currentEducationData);
      if (!validationResult.isValid) {
        toastWarning(validationResult.message);
        return;
      }
    }

    // Handle data saving and attachment upload before submission
    const statusInfo = normalizeStatus(requestDetail.value);
    const isNeedRevision = statusInfo.isRejected; // FIX: use isRejected instead of isNeedRevision
    let hasSavedInThisSubmit = false;

    console.log('🔍 Submit flow status:', {
      isNeedRevision,
      statusInfo,
      hasUnsavedChanges: hasUnsavedChanges.value,
      category: activeTab.value
    });

    // Auto-save unsaved changes before submitting (only for draft, skip for need revision)
    if (statusInfo.isDraft && hasUnsavedChanges.value) {
      toastInfo('Saving changes before submission...');

      try {
        await handleSaveAsDraft();
        hasSavedInThisSubmit = true;

        // Refresh request detail to get updated data
        await loadRequestDetail();
      } catch (error) {
        toastError('Failed to save changes. Please save manually first.');
        return;
      }
    } else if (isNeedRevision) {
      console.log('🔍 Need revision status - will save with attachments if needed');
    }

    // MOVED: Attachment upload logic moved to after change request submission for correct flow

    // FIXED: For draft submissions, use saved draft data instead of detecting changes
    // statusInfo already defined above, reuse it
    const isDraft = statusInfo.isDraft;

    let changedData = {};
    let changes = {};
    let hasChangedData = false;
    let hasChanges = false;

    if (isDraft && requestDetail.value?.new_data?.data) {
      // For drafts, use the saved draft data directly
      const draftData = requestDetail.value.new_data.data;

      // For education tab, use the array data directly
      if (activeTab.value === 'education') {
        changes = draftData; // Array data directly
        hasChangedData = true;
        hasChanges = true;
      } else if (['emergency-contact', 'family'].includes(activeTab.value)) {
        // For other array tabs, use array data directly
        changes = draftData;
        hasChangedData = true;
        hasChanges = true;
      } else {
        // For object tabs, use data directly
        changes = draftData;
        hasChangedData = true;
        hasChanges = true;
      }

    } else {
      // For non-drafts (including need revision), use the existing change detection logic
      changedData = getChangedFieldsOnly();
      changes = calculateChanges();
      hasChangedData = changedData.newData && Object.keys(changedData.newData).length > 0;
      hasChanges = changes && Object.keys(changes).length > 0;

      console.log('🔍 After getChangedFieldsOnly:', {
        hasChangedData,
        hasChanges,
        changedDataKeys: changedData.newData ? Object.keys(changedData.newData) : [],
        changesKeys: changes ? Object.keys(changes) : []
      });

      // For need revision status, check if there are any form changes
      const statusInfo = normalizeStatus(requestDetail.value);
      const isNeedRevision = statusInfo.isRejected;

      console.log('🔍 Before validation check:', {
        isNeedRevision,
        hasChangedData,
        hasChanges,
        willEnterValidation: isNeedRevision && (!hasChangedData && !hasChanges)
      });

      if (isNeedRevision && (!hasChangedData && !hasChanges)) {
        // Check if formData has any meaningful changes
        const currentFormData = formData.value || {};
        let hasFormChanges = false;

        // For array-based tabs, compare with original data instead of just checking if not empty
        if (activeTab.value === 'family') {
          const currentFamilyData = formData.value || [];
          const originalFamily = originalFamilyData.value || [];
          hasFormChanges = JSON.stringify(currentFamilyData) !== JSON.stringify(originalFamily);
        } else if (activeTab.value === 'education') {
          const currentEducationData = formData.value || [];
          const originalEducation = originalEducationData.value || [];
          hasFormChanges = JSON.stringify(currentEducationData) !== JSON.stringify(originalEducation);
        } else if (activeTab.value === 'emergency-contact') {
          const currentEmergencyData = formData.value || [];

          // ✅ FIX: For INSERT action, compare with new_data from request
          let originalEmergency = [];
          if (requestDetail.value?.new_data?.action === 'insert') {
            originalEmergency = requestDetail.value?.new_data?.data || [];
          } else {
            originalEmergency = originalEmergencyContactData.value || [];
          }

          console.log('🔍 Emergency Contact Change Detection (Early Check):', {
            action: requestDetail.value?.new_data?.action,
            currentEmergencyData,
            originalEmergency,
            currentJSON: JSON.stringify(currentEmergencyData),
            originalJSON: JSON.stringify(originalEmergency)
          });

          hasFormChanges = JSON.stringify(currentEmergencyData) !== JSON.stringify(originalEmergency);

          console.log('🔍 Has Emergency Changes (Early Check):', hasFormChanges);
        } else {
          hasFormChanges = Object.keys(currentFormData).some(key => {
            const value = currentFormData[key];
            return value !== null && value !== undefined && value !== '';
          });
        }

        if (hasFormChanges) {
          // Handle education validation before opening modal
          if (activeTab.value === 'education') {
            const validationResult = validateEducationAttachments(formData.value);
            if (!validationResult.isValid) {
              toastWarning(validationResult.message);
              return;
            }
          }
          // Force open modal if there are form changes
          isChangeRequestModalOpen.value = true;
          return;
        } else {
          // For family tab, check for actual changes manually
          if (activeTab.value === 'family') {
            const currentFamilyData = formData.value || [];

            // ✅ FIX: For INSERT action, compare with new_data from request, not original data
            let originalFamily = [];

            if (requestDetail.value?.new_data?.action === 'insert') {
              // For INSERT, compare with initial new_data from request (before user edits)
              originalFamily = requestDetail.value?.new_data?.data || [];
            } else {
              // For UPDATE, compare with original employee data
              originalFamily = originalFamilyData.value || [];
            }

            console.log('🔍 Family Change Detection:', {
              action: requestDetail.value?.new_data?.action,
              currentFamilyData,
              originalFamily
            });

            const hasFamilyChanges = JSON.stringify(currentFamilyData) !== JSON.stringify(originalFamily);

            console.log('🔍 Has Family Changes:', hasFamilyChanges);

            if (hasFamilyChanges) {
              isChangeRequestModalOpen.value = true;
              return;
            } else {
              toastInfo('No changes detected. Please make changes before submitting revision.');
              return;
            }
          } else if (activeTab.value === 'education') {
            const currentEducationData = formData.value || [];

            // ✅ FIX: For INSERT action, compare with new_data from request, not original data
            let originalEducation = [];

            if (requestDetail.value?.new_data?.action === 'insert') {
              // For INSERT, compare with initial new_data from request (before user edits)
              originalEducation = requestDetail.value?.new_data?.data || [];
            } else {
              // For UPDATE, compare with original employee data
              originalEducation = originalEducationData.value || [];
            }

            console.log('🔍 Education Change Detection:', {
              action: requestDetail.value?.new_data?.action,
              currentEducationData,
              originalEducation,
              currentJSON: JSON.stringify(currentEducationData),
              originalJSON: JSON.stringify(originalEducation)
            });

            const hasEducationChanges = JSON.stringify(currentEducationData) !== JSON.stringify(originalEducation);

            console.log('🔍 Has Education Changes:', hasEducationChanges);

            if (hasEducationChanges) {
              // Validate education attachments BEFORE opening modal
              const validationResult = validateEducationAttachments(currentEducationData);
              if (!validationResult.isValid) {
                toastWarning(validationResult.message);
                return;
              }
              isChangeRequestModalOpen.value = true;
              return;
            } else {
              toastInfo('No changes detected. Please make changes before submitting revision.');
              return;
            }
          } else if (activeTab.value === 'emergency-contact') {
            const currentEmergencyData = formData.value || [];

            // ✅ FIX: For INSERT action, compare with new_data from request, not original data
            let originalEmergency = [];

            if (requestDetail.value?.new_data?.action === 'insert') {
              // For INSERT, compare with initial new_data from request (before user edits)
              originalEmergency = requestDetail.value?.new_data?.data || [];
            } else {
              // For UPDATE, compare with original employee data
              originalEmergency = originalEmergencyContactData.value || [];
            }

            console.log('🔍 Emergency Contact Change Detection:', {
              action: requestDetail.value?.new_data?.action,
              currentEmergencyData,
              originalEmergency,
              currentJSON: JSON.stringify(currentEmergencyData),
              originalJSON: JSON.stringify(originalEmergency)
            });

            const hasEmergencyChanges = JSON.stringify(currentEmergencyData) !== JSON.stringify(originalEmergency);

            console.log('🔍 Has Emergency Changes:', hasEmergencyChanges);

            if (hasEmergencyChanges) {
              isChangeRequestModalOpen.value = true;
              return;
            } else {
              toastInfo('No changes detected. Please make changes before submitting revision.');
              return;
            }
          } else {
            toastInfo('No changes detected. Please make changes before submitting revision.');
            return;
          }
        }
      }
    }

    if (!hasChangedData && !hasChanges) {
      // For education drafts, validate that we have actual data
      if (activeTab.value === 'education' && isDraft) {
        const draftData = requestDetail.value?.new_data?.data || [];

        // Check if draft has any valid education records
        if (!Array.isArray(draftData) || draftData.length === 0) {
          toastInfo('No education data found in draft. Please add education records first.');
          return;
        }

        // Check if there are actual changes compared to original data
        const originalEducation = originalEducationData.value || [];
        const hasEducationChanges = JSON.stringify(draftData) !== JSON.stringify(originalEducation);

        if (!hasEducationChanges) {
          toastInfo('No changes detected. Please make changes before submitting.');
          return;
        }

        // Validate education attachments BEFORE opening modal
        const educationData = draftData || [];
        if (Array.isArray(educationData) && educationData.length > 0) {
          const validationResult = validateEducationAttachments(educationData);
          if (!validationResult.isValid) {
            toastWarning(validationResult.message);
            return;
          }
        }
      }

      // For drafts, validation passed - now open modal
      // Open ChangeRequestModal directly with existing draft data
      isChangeRequestModalOpen.value = true;
      return;
    }

    // Additional validation for array-based tabs to check for empty arrays
    if (['education', 'emergency-contact'].includes(activeTab.value)) {
      let arrayData = null;

      if (isDraft && requestDetail.value?.new_data?.data) {
        // For drafts, check the saved data
        arrayData = requestDetail.value.new_data.data;
      } else {
        // For non-drafts, check the changes
        // Try both key formats: with and without "Data" suffix
        const tabKey = activeTab.value.replace('-', '_');
        const tabKeyWithData = tabKey + 'Data';

        // First try with "Data" suffix (used by calculateChanges)
        const changeObj = changes && (changes[tabKeyWithData] || changes[tabKey]);

        // Extract .new from change object if it exists
        if (changeObj && typeof changeObj === 'object') {
          arrayData = changeObj.new || changeObj;
        } else {
          arrayData = changeObj;
        }

        console.log('🔍 Additional array validation:', {
          activeTab: activeTab.value,
          tabKey,
          tabKeyWithData,
          changes,
          changesKeys: changes ? Object.keys(changes) : [],
          changeObj,
          arrayData,
          hasArrayData: !!arrayData,
          arrayDataLength: Array.isArray(arrayData) ? arrayData.length : 'not array'
        });
      }

      if (!arrayData || (Array.isArray(arrayData) && arrayData.length === 0)) {
        console.log('❌ Array validation FAILED - showing toast');
        toastInfo('No changes detected. Please make changes before submitting revision.');
        return;
      } else {
        console.log('✅ Array validation PASSED');
      }
    }

    // Skip array validation for family tab - always proceed

    // FIXED: For drafts, prepare modal data with our corrected draft data
    if (isDraft && requestDetail.value?.new_data?.data) {
      // For education drafts, use the array data directly
      if (activeTab.value === 'education') {
        const draftData = requestDetail.value.new_data.data;

        // Validate education attachments BEFORE preparing modal data
        if (Array.isArray(draftData) && draftData.length > 0) {
          const validationResult = validateEducationAttachments(draftData);
          if (!validationResult.isValid) {
            toastWarning(validationResult.message);
            return;
          }
        }

        modalDataForSubmit.value = {
          data: draftData, // Array data directly for education
          changes: changes
        };
      } else {
        // For other tabs, create proper modal data structure
        const draftData = requestDetail.value.new_data.data;
        const tabKey = activeTab.value.replace('-', '_') + 'Data';

        modalDataForSubmit.value = {
          data: {
            [tabKey]: {
              old: requestDetail.value?.old_data || (Array.isArray(draftData) ? [] : {}),
              new: draftData
            }
          },
          changes: changes
        };
      }

    } else {
      // For non-drafts, clear modal override data to use default functions
      modalDataForSubmit.value = { data: null, changes: null };

      // Validate education attachments for non-draft submissions
      if (activeTab.value === 'education') {
        const currentEducationData = getChangesForCurrentTab();
        if (Array.isArray(currentEducationData) && currentEducationData.length > 0) {
          const validationResult = validateEducationAttachments(currentEducationData);
          if (!validationResult.isValid) {
            toastWarning(validationResult.message);
            return;
          }
        }
      }
    }

    // Log modal data for debugging
    const modalData = {
      currentTab: activeTab.value,
      requestType: getRequestTypeFromTab(activeTab.value),
      action: 'update',
      data: modalDataForSubmit.value.data || (isDraft && activeTab.value === 'education' && requestDetail.value?.new_data?.data ? requestDetail.value.new_data.data : getChangesForCurrentTab()),
      changes: modalDataForSubmit.value.changes || changes,
      existingRequestId: requestDetail.value?.id_change_req
    };

    // Reset submitting state before opening modal to prevent conflicts
    isSubmitting.value = false;

    // Open ChangeRequestModal for final submission

    isChangeRequestModalOpen.value = true;

  } catch (error) {
    toastError(`Error in submit process: ${error.message}`);
  } finally {
    isSubmitting.value = false;
  }
};

// Function to get only changed fields from current form data vs original data
const getChangedFieldsOnly = () => {
  // Filter out forbidden fields from current form data for basic-information
  let currentData = formData.value || {};
  console.log('🔍 getChangedFieldsOnly - Raw formData.value:', formData.value);
  console.log('🔍 getChangedFieldsOnly - activeTab.value:', activeTab.value);

  // Additional debugging: Check if form has the updated phone number
  if (activeTab.value === 'basic-information') {
    console.log('🔍 Current main_phone_number in formData:', currentData.main_phone_number);
    console.log('🔍 All phone number related fields:', {
      main_phone_number: currentData.main_phone_number,
      secondary_phone_number: currentData.secondary_phone_number,
      main_phone_number_id: currentData.main_phone_number_id,
      secondary_phone_number_id: currentData.secondary_phone_number_id
    });
  }

  if (activeTab.value === 'basic-information') {
    const { name, nik, business_email, ...filteredCurrentData } = currentData;
    currentData = filteredCurrentData;
    console.log('🔍 getChangedFieldsOnly - Filtered currentData after removing forbidden fields:', currentData);
  }

  // Filter out forbidden fields for payroll-account
  if (activeTab.value === 'payroll-account') {
    const {
      bank, // Remove bank field, only keep bank_id
      tax_status, // Remove tax_status field (read-only)
      tax_status_id, // Remove tax_status_id (read-only, never send to API)
      npwp_doc, // Remove npwp_doc (view only)
      saving_book_doc, // Remove saving_book_doc (view only)
      npwp_doc_id, // Remove npwp_doc_id
      saving_book_doc_id, // Remove saving_book_doc_id
      ...filteredCurrentData
    } = currentData;
    currentData = filteredCurrentData;
  }

  // FIXED: Ensure array-based tabs always have array data to prevent EDC category errors
  const arrayBasedTabs = ['emergency-contact', 'family', 'education'];
  if (arrayBasedTabs.includes(activeTab.value)) {
    if (!Array.isArray(currentData)) {
      currentData = [];
    } else {
    }
  }
  let originalData = {};

  // For comparison, we now use original data from API as baseline (consistent with dynamicFormData)
  // FIXED: Use normalize helper for consistent status detection
  const statusInfo = normalizeStatus(requestDetail.value);
  const isDraft = statusInfo.isDraft;

  // Set original data based on active tab
  switch (activeTab.value) {
    case 'basic-information':
      // Debug all available data sources
      console.log('🔍 === DATA SOURCES DEBUG ===');
      console.log('🔍 employeeData.value keys:', employeeData.value ? Object.keys(employeeData.value) : 'null/undefined');
      console.log('🔍 originalEmployeeData.value keys:', originalEmployeeData.value ? Object.keys(originalEmployeeData.value) : 'null/undefined');
      console.log('🔍 requestDetail.value?.old_data keys:', requestDetail.value?.old_data ? Object.keys(requestDetail.value.old_data) : 'null/undefined');
      console.log('🔍 isDraft:', isDraft);

      // For basic information, prioritize employee data from API as original baseline
      // Try multiple fallback sources to ensure we have original data
      originalData = employeeData.value || originalEmployeeData.value || {};

      // If still empty, try to get from request detail
      if (Object.keys(originalData).length === 0 && requestDetail.value?.old_data) {
        originalData = requestDetail.value.old_data;
      }

      // For draft status, we should NOT merge with old_data because old_data contains previous changes
      // We want to compare with the TRUE original employee data, not with previous draft changes
      // So we keep originalData as is (from employeeData/originalEmployeeData)

      console.log('🔍 For basic-information draft, using pure employee data as baseline (not merging with old_data)');
      console.log('🔍 This ensures comparison is against original employee data, not previous draft changes');

      // Debug what we ended up with
      console.log('🔍 Final originalData keys:', Object.keys(originalData));
      console.log('🔍 Final originalData sample fields:', {
        main_phone_number: originalData.main_phone_number,
        birth_place: originalData.birth_place,
        birth_date: originalData.birth_date,
        no_ktp: originalData.no_ktp,
        gender_id: originalData.gender_id,
        religion_id: originalData.religion_id,
        marital_status_id: originalData.marital_status_id
      });

      // Check if we're missing critical fields and try to get them from other sources
      const criticalFields = ['main_phone_number', 'birth_place', 'birth_date', 'no_ktp'];
      const missingFields = criticalFields.filter(field => !originalData[field] || originalData[field] === '');

      if (missingFields.length > 0) {
        console.warn('🔍 Missing critical fields in originalData:', missingFields);

        // Try to get missing fields from requestDetail.old_data if available
        if (requestDetail.value?.old_data) {
          missingFields.forEach(field => {
            if (requestDetail.value.old_data[field]) {
              console.log(`🔍 Found ${field} in requestDetail.old_data:`, requestDetail.value.old_data[field]);
              originalData[field] = requestDetail.value.old_data[field];
            }
          });
        }

        console.log('🔍 After filling missing fields, originalData:', {
          main_phone_number: originalData.main_phone_number,
          birth_place: originalData.birth_place,
          birth_date: originalData.birth_date,
          no_ktp: originalData.no_ktp
        });
      }

      break;
    case 'address':
      // For address, use the old_data from request detail as baseline for comparison
      if (isDraft && requestDetail.value?.old_data) {
        originalData = requestDetail.value.old_data;
      } else {
        originalData = originalAddressData.value || {};
      }
      break;
    case 'payroll-account':
      // Always use original payroll data from composable as baseline for comparison
      // This ensures we compare against true database state, not previous draft changes
      originalData = originalPayrollAccountData.value || payrollAccountData.value || {};
      break;
    case 'social-security':
      originalData = socialSecurityData.value || {};
      break;
    case 'medical-record':
      originalData = originalMedicalRecordData.value || {};
      break;
    case 'emergency-contact':
      // ✅ FIX: For INSERT action, compare with new_data from request, not original employee data
      if (requestDetail.value?.new_data?.action === 'insert') {
        // For INSERT, use initial new_data from request as baseline
        originalData = requestDetail.value?.new_data?.data || [];
      } else {
        // For UPDATE/EDIT, use original employee data as baseline
        originalData = originalEmergencyContactData.value || emergencyContactData.value || [];
      }

      console.log('🔍 getChangedFieldsOnly - Emergency Contact:', {
        action: requestDetail.value?.new_data?.action,
        originalData,
        currentData
      });
      break;
    case 'family':
      // ✅ FIX: For INSERT action, compare with new_data from request, not original employee data
      if (requestDetail.value?.new_data?.action === 'insert') {
        // For INSERT, use initial new_data from request as baseline
        originalData = requestDetail.value?.new_data?.data || [];
      } else {
        // For UPDATE/EDIT, use original employee data as baseline
        originalData = originalFamilyData.value || familyData.value || [];
      }

      console.log('🔍 getChangedFieldsOnly - Family:', {
        action: requestDetail.value?.new_data?.action,
        originalData,
        currentData
      });
      break;
    case 'education':
      originalData = originalEducationData.value || [];
      break;
    default:
      originalData = {};
  }

  // CRITICAL SAFETY CHECK: If originalData is still empty after all fallbacks,
  // it means this is likely the first time editing - use empty object but
  // send all currentData as new changes with empty old_data
  const isOriginalDataEmpty = Array.isArray(originalData) ? originalData.length === 0 : Object.keys(originalData).length === 0;

  console.log('🔍 getChangedFieldsOnly - isOriginalDataEmpty:', isOriginalDataEmpty);
  console.log('🔍 getChangedFieldsOnly - originalData keys:', Object.keys(originalData));

  if (isOriginalDataEmpty) {
    console.log('🔍 getChangedFieldsOnly - Original data is empty, treating all currentData as changes');
  }

  const changedFields = {};
  const oldData = {};

  // SPECIAL HANDLING: If original data is empty for basic-information,
  // it means employee data hasn't loaded yet - don't save anything until it loads
  if (isOriginalDataEmpty && activeTab.value === 'basic-information') {
    console.warn('⚠️ Original employee data is not loaded yet for basic-information comparison. Cannot determine changes.');
    console.warn('⚠️ Please wait for employee data to load before making changes.');

    // Return empty to prevent saving all fields as changes
    return {
      newData: {},
      oldData: {}
    };
  }

  // SPECIAL HANDLING: If original data is empty for other tabs, treat all current data as changes
  if (isOriginalDataEmpty && currentData && Object.keys(currentData).length > 0) {

    // For arrays (emergency contacts, family, education)
    if (Array.isArray(currentData)) {
      const tabKey = activeTab.value.replace('-', '_');
      // Normalize current data without IDs for insert action
      const normalizedCurrentData = normalizeData(currentData, activeTab.value, false);
      changedFields[tabKey] = normalizedCurrentData;
      oldData[tabKey] = []; // Empty array as old data
    } else {
      // For objects (most other tabs)
      Object.keys(currentData).forEach(key => {
        const currentValue = currentData[key];

        // Only include non-empty values as changes
        if (currentValue !== null && currentValue !== undefined && currentValue !== '' && currentValue !== '-') {
          changedFields[key] = currentValue;
          oldData[key] = null; // null as old data to indicate no previous value
        }
      });
    }

    return {
      newData: changedFields,
      oldData: oldData
    };
  }

  // Get all unique keys from both datasets for comprehensive comparison
  const allKeys = new Set([...Object.keys(currentData), ...Object.keys(originalData)]);

  // Special handling for array data (emergency-contact, family, education)
  const arrayTabs = ['emergency-contact', 'family', 'education'];
  if (arrayTabs.includes(activeTab.value) && (Array.isArray(currentData) || Array.isArray(originalData))) {
    const currentArray = Array.isArray(currentData) ? currentData : [];
    const originalArray = Array.isArray(originalData) ? originalData : [];

    // Special handling for education - only send changed fields
    if (activeTab.value === 'education') {
      const changedEducationRecords = [];

      // Check if this is INSERT action (from requestDetail)
      const isInsertAction = requestDetail.value?.new_data?.action === 'insert';

      console.log('🔍 Education - comparing records');
      console.log('🔍 isInsertAction:', isInsertAction);
      console.log('🔍 currentArray:', currentArray);
      console.log('🔍 originalArray:', originalArray);

      currentArray.forEach((currentItem, index) => {
        // ✅ FIX: For INSERT action, don't skip records without id_education
        let originalItem;

        if (isInsertAction) {
          // For INSERT, match by client_key or index
          if (currentItem.client_key) {
            originalItem = originalArray.find(orig => orig.client_key === currentItem.client_key);
          }
          if (!originalItem) {
            // Fallback to index matching
            originalItem = originalArray[index];
          }
          console.log('🔍 INSERT action - matched by client_key/index:', originalItem);
        } else {
          // For UPDATE, must have id_education
          if (!currentItem.id_education) {
            console.log('🔍 Skipping record without id_education (UPDATE action)');
            return;
          }

          // Find corresponding original record by id_education
          originalItem = originalArray.find(orig => orig.id_education === currentItem.id_education);
          if (!originalItem) {
            console.log('🔍 No original found for id_education:', currentItem.id_education);
            return;
          }
        }

        console.log('🔍 Comparing education record:', currentItem.id_education || currentItem.client_key);

        // Compare each field and only include changed ones
        // IMPORTANT: Preserve existing client_key if it exists (from file upload), otherwise generate new one
        if (!currentItem.client_key) {
          currentItem.client_key = generateClientKey();
        }

        const changedRecord = {
          client_key: currentItem.client_key, // Use the preserved/existing client_key
          status: currentItem.status !== undefined ? currentItem.status : 1
        };

        // ✅ FIX: Only include id_education if it exists (for UPDATE action)
        if (currentItem.id_education) {
          changedRecord.id_education = currentItem.id_education;
        }

        const fieldsToCheck = ['edu_level_id', 'edu_major_id', 'edu_institution_id', 'edu_start_date', 'edu_end_date'];
        let hasChanges = false;

        fieldsToCheck.forEach(field => {
          const currentValue = currentItem[field];
          const originalValue = originalItem[field];

          // Normalize values for comparison - handle both number and string
          const currentNormalized = currentValue === null || currentValue === undefined || currentValue === '' ? '' : String(currentValue).trim();
          const originalNormalized = originalValue === null || originalValue === undefined || originalValue === '' ? '' : String(originalValue).trim();

          console.log(`🔍 Field ${field}:`, {
            current: currentNormalized,
            original: originalNormalized,
            changed: currentNormalized !== originalNormalized
          });

          if (currentNormalized !== originalNormalized) {
            // Convert ID fields to number for API compatibility
            if (field === 'edu_level_id' || field === 'edu_major_id' || field === 'edu_institution_id') {
              changedRecord[field] = currentValue != null && currentValue !== '' ? Number(currentValue) : null;
            } else {
              changedRecord[field] = currentValue;
            }
            hasChanges = true;
          }
        });

        console.log('🔍 hasChanges:', hasChanges);
        console.log('🔍 changedRecord:', changedRecord);

        // Only add record if there are actual changes
        if (hasChanges) {
          changedEducationRecords.push(changedRecord);
        }
      });

      console.log('🔍 Final changedEducationRecords:', changedEducationRecords);

      // Only set changed fields if there are actual changes
      if (changedEducationRecords.length > 0) {
        changedFields[activeTab.value.replace('-', '_')] = changedEducationRecords;
        oldData[activeTab.value.replace('-', '_')] = originalArray;
      }
    } else if (activeTab.value === 'emergency-contact') {
      // Emergency contact - only send changed fields
      const changedRecords = [];

      currentArray.forEach(currentItem => {
        if (!currentItem.id_contact) return; // Skip records without ID

        // Find corresponding original record
        const originalItem = originalArray.find(orig => orig.id_contact === currentItem.id_contact);
        if (!originalItem) return; // Skip if no original found

        // Compare each field and only include changed ones
        const changedRecord = {
          id_contact: currentItem.id_contact,
          status: currentItem.status !== undefined ? currentItem.status : 1
        };

        const fieldsToCheck = ['emgc_name', 'emgc_relationship_id', 'emgc_number', 'emgc_address'];
        let hasChanges = false;

        fieldsToCheck.forEach(field => {
          const currentValue = currentItem[field];
          const originalValue = originalItem[field];

          // Normalize values for comparison
          const currentNormalized = currentValue === null || currentValue === undefined ? '' : String(currentValue);
          const originalNormalized = originalValue === null || originalValue === undefined ? '' : String(originalValue);

          if (currentNormalized !== originalNormalized) {
            changedRecord[field] = currentValue;
            hasChanges = true;
          }
        });

        // Only add record if there are actual changes
        if (hasChanges) {
          changedRecords.push(changedRecord);
        }
      });

      // Only set changed fields if there are actual changes
      if (changedRecords.length > 0) {
        changedFields[activeTab.value.replace('-', '_')] = changedRecords;
        oldData[activeTab.value.replace('-', '_')] = originalArray;
      }
    } else if (activeTab.value === 'family') {
      // Family - only send changed fields
      const changedRecords = [];

      // Check if this is INSERT action (from requestDetail)
      const isInsertAction = requestDetail.value?.new_data?.action === 'insert';

      console.log('🔍 Family - comparing records');
      console.log('🔍 isInsertAction:', isInsertAction);
      console.log('🔍 currentArray:', currentArray);
      console.log('🔍 originalArray:', originalArray);

      currentArray.forEach((currentItem, index) => {
        // ✅ FIX: For INSERT action, don't skip records without id_family
        let originalItem;

        if (isInsertAction) {
          // For INSERT family, match by index (no client_key used)
          originalItem = originalArray[index] || {};
          console.log('🔍 INSERT action - matched by index:', originalItem);
        } else {
          // For UPDATE, must have id_family
          if (!currentItem.id_family && !currentItem.id) {
            console.log('🔍 Skipping record without id_family (UPDATE action)');
            return;
          }

          const itemId = currentItem.id_family || currentItem.id;

          // Find corresponding original record by id_family
          originalItem = originalArray.find(orig => (orig.id_family || orig.id) === itemId);
          if (!originalItem) {
            console.log('🔍 No original found for id_family:', itemId);
            return;
          }
        }

        console.log('🔍 Comparing family record:', currentItem.id_family || index);

        // Compare each field and only include changed ones
        const changedRecord = {
          status: currentItem.status !== undefined ? currentItem.status : 1
        };

        // ✅ FIX: Only include id_family if it exists (for UPDATE action)
        if (currentItem.id_family) {
          changedRecord.id_family = currentItem.id_family;
        }

        // Note: Family INSERT does NOT use client_key (unlike education)

        const fieldsToCheck = [
          'name',
          'gender_id',
          'birth_date',
          'birth_place',
          'address',
          'occupation_id',
          'relation_id',
          'marital_status_id',
          'kk_doc'
        ];
        let hasChanges = false;

        fieldsToCheck.forEach(field => {
          const currentValue = currentItem[field];
          const originalValue = originalItem[field];

          // Normalize values for comparison - handle both number and string
          const currentNormalized = currentValue === null || currentValue === undefined || currentValue === '' ? '' : String(currentValue).trim();
          const originalNormalized = originalValue === null || originalValue === undefined || originalValue === '' ? '' : String(originalValue).trim();

          console.log(`🔍 Field ${field}:`, {
            current: currentNormalized,
            original: originalNormalized,
            changed: currentNormalized !== originalNormalized
          });

          if (currentNormalized !== originalNormalized) {
            // Convert ID fields to number for API compatibility
            if (field === 'occupation_id' || field === 'relation_id' || field === 'marital_status_id' || field === 'gender_id') {
              changedRecord[field] = currentValue != null && currentValue !== '' ? Number(currentValue) : null;
            } else {
              changedRecord[field] = currentValue;
            }
            hasChanges = true;
          }
        });

        console.log('🔍 hasChanges:', hasChanges);
        console.log('🔍 changedRecord:', changedRecord);

        // Only add record if there are actual changes
        if (hasChanges) {
          changedRecords.push(changedRecord);
        }
      });

      console.log('🔍 Final changedFamilyRecords:', changedRecords);

      // Only set changed fields if there are actual changes
      if (changedRecords.length > 0) {
        changedFields[activeTab.value.replace('-', '_')] = changedRecords;
        oldData[activeTab.value.replace('-', '_')] = originalArray;
      }
    }
  } else {
    // Special handling for address - map form fields to API fields
    if (activeTab.value === 'address') {

      // Map form fields to API fields for address - only changed fields
      const mapAddressFormToAPI = (formData, originalData) => {
        const apiData = {};

        // Only map fields that are accepted by API
        const acceptedFields = {
          // Official address (KTP) fields
          'official_address_detail': 'detail_ktp',
          'official_address_province': 'province_ktp_id',
          'official_address_city': 'city_ktp_id',
          'official_address_postal_code': 'postal_code_ktp',
          'official_address_subdistrict': 'sub_distric_ktp',
          'official_address_administrative_village': 'administrative_village_ktp',
          'official_address_rt': 'rt_ktp',
          'official_address_rw': 'rw_ktp',
          'official_address_street': 'street_name_ktp',
          'official_address_house_number': 'house_number_ktp',

          // Domicile address fields
          'domicile_address_detail': 'detail_domicile',
          'domicile_address_province': 'province_domicile_id',
          'domicile_address_city': 'city_domicile_id',
          'domicile_address_postal_code': 'postal_code_domicile',
          'domicile_address_subdistrict': 'sub_distric_domicile',
          'domicile_address_administrative_village': 'administrative_village_domicile',
          'domicile_address_rt': 'rt_domicile',
          'domicile_address_rw': 'rw_domicile',
          'domicile_address_street': 'street_name_domicile',
          'domicile_address_house_number': 'house_number_domicile'
        };

        // Only process accepted fields that have actually changed
        Object.keys(acceptedFields).forEach(formField => {
          const apiField = acceptedFields[formField];
          const currentValue = formData[formField];
          const originalValue = originalData[apiField];

          // Normalize values for comparison - treat null, undefined, empty string as equivalent
          const normalizeValue = (val) => {
            if (val === null || val === undefined || val === '') return '';
            return String(val).trim();
          };

          const normalizedCurrent = normalizeValue(currentValue);
          const normalizedOriginal = normalizeValue(originalValue);

          // Skip fields that are empty in both current and original
          const isEmptyInBoth = normalizedCurrent === '' && normalizedOriginal === '';

          // Debug logging for each field
          // Only include fields that have actually changed
          if (normalizedCurrent !== normalizedOriginal) {
            // Additional check: don't include fields where both are empty
            if (!isEmptyInBoth) {
              // Convert ID fields to number for API compatibility
              if (apiField === 'province_ktp_id' || apiField === 'city_ktp_id' ||
                apiField === 'province_domicile_id' || apiField === 'city_domicile_id') {
                apiData[apiField] = Number(currentValue);
              } else {
                apiData[apiField] = currentValue;
              }
            }
          }
        });

        return apiData;
      };

      // Map current form data to API format - this already filters only changed fields
      let currentApiData = {};
      try {
        currentApiData = mapAddressFormToAPI(currentData, originalData);
      } catch (error) {
        console.error('🔍 Error in mapAddressFormToAPI (getChangedFieldsOnly):', error);
        currentApiData = {};
      }
      // For old data, we need to map the original data to get the corresponding API field values
      const mapOriginalDataToAPI = (originalData) => {
        const apiData = {};
        const acceptedFields = {
          'official_address_detail': 'detail_ktp',
          'official_address_province': 'province_ktp_id',
          'official_address_city': 'city_ktp_id',
          'official_address_postal_code': 'postal_code_ktp',
          'official_address_subdistrict': 'sub_distric_ktp',
          'official_address_administrative_village': 'administrative_village_ktp',
          'official_address_rt': 'rt_ktp',
          'official_address_rw': 'rw_ktp',
          'official_address_street': 'street_name_ktp',
          'official_address_house_number': 'house_number_ktp',
          'domicile_address_detail': 'detail_domicile',
          'domicile_address_province': 'province_domicile_id',
          'domicile_address_city': 'city_domicile_id',
          'domicile_address_postal_code': 'postal_code_domicile',
          'domicile_address_subdistrict': 'sub_distric_domicile',
          'domicile_address_administrative_village': 'administrative_village_domicile',
          'domicile_address_rt': 'rt_domicile',
          'domicile_address_rw': 'rw_domicile',
          'domicile_address_street': 'street_name_domicile',
          'domicile_address_house_number': 'house_number_domicile'
        };

        Object.keys(acceptedFields).forEach(formField => {
          const apiField = acceptedFields[formField];
          const originalValue = originalData[apiField];
          if (originalValue !== undefined) {
            apiData[apiField] = originalValue;
          }
        });

        return apiData;
      };

      const originalApiData = mapOriginalDataToAPI(originalData);

      // Use the already filtered currentApiData (only changed fields)
      Object.keys(currentApiData).forEach(key => {
        changedFields[key] = currentApiData[key];
        oldData[key] = originalApiData[key] || '';
      });
    } else {
      // Compare current data with original data for non-array or non-emergency-contact data
      allKeys.forEach(key => {
        // Skip immutable fields on basic-information
        if (activeTab.value === 'basic-information' && key === 'name') {
          return;
        }

        // For payroll-account and address in need revision, only include fields that are in editableFields
        if ((activeTab.value === 'payroll-account' || activeTab.value === 'address') && statusInfo.isRejected) {
          const editableFieldsSet = formConfig.value?.editableFields;
          if (editableFieldsSet && !editableFieldsSet.has(key)) {
            // Skip fields that are not editable in need revision
            return;
          }
        }

        const currentValue = currentData[key];
        const originalValue = originalData[key];

        // For array data (e.g., emergency-contact, family, education)
        if (Array.isArray(currentValue) || Array.isArray(originalValue)) {
          const currentArray = Array.isArray(currentValue) ? currentValue : [];
          const originalArray = Array.isArray(originalValue) ? originalValue : [];

          if (JSON.stringify(currentArray) !== JSON.stringify(originalArray)) {

            // Special handling for emergency contact to only send changed items
            if (activeTab.value === 'emergency-contact') {
              const changedItems = [];
              const originalChangedItems = [];

              // Use ID-based matching instead of index-based to ensure proper pairing
              for (const currentItem of currentArray) {
                if (!currentItem || Object.keys(currentItem).length === 0) continue;

                // Find matching original item by ID
                let originalItem = {};
                if (currentItem.id_contact || currentItem.id) {
                  const itemId = currentItem.id_contact || currentItem.id;
                  originalItem = originalArray.find(orig => (orig.id_contact || orig.id) === itemId) || {};
                }

                // Compare each item field by field with more precise comparison
                const fieldsToCompare = ['emgc_name', 'emgc_number', 'emgc_relationship_id', 'emgc_address', 'status'];
                let isItemChanged = false;

                for (const field of fieldsToCompare) {
                  const currentFieldValue = currentItem[field];
                  const originalFieldValue = originalItem[field];

                  // Normalize values for comparison
                  const currentNormalized = currentFieldValue === null || currentFieldValue === undefined ? '' : String(currentFieldValue);
                  const originalNormalized = originalFieldValue === null || originalFieldValue === undefined ? '' : String(originalFieldValue);

                  if (currentNormalized !== originalNormalized) {
                    isItemChanged = true;
                    break;
                  }
                }

                if (isItemChanged) {
                  // Only include the changed item with necessary fields
                  const changedItem = {
                    emgc_name: currentItem.emgc_name || '',
                    emgc_number: currentItem.emgc_number || '',
                    emgc_relationship_id: currentItem.emgc_relationship_id ? Number(currentItem.emgc_relationship_id) : null,
                    emgc_address: currentItem.emgc_address || '',
                    status: currentItem.status !== undefined ? currentItem.status : 1
                  };

                  // Include id_contact for existing items to enable updates
                  if (currentItem.id_contact) {
                    changedItem.id_contact = currentItem.id_contact;
                  }

                  changedItems.push(changedItem);

                  // Store corresponding original item - only if it has valid data
                  if (originalItem && Object.keys(originalItem).length > 0 && (originalItem.id_contact || originalItem.id)) {
                    // This is an update operation - include only the fields that actually exist in originalItem
                    const validOriginalItem = {
                      emgc_name: originalItem.emgc_name || null,
                      emgc_number: originalItem.emgc_number || null,
                      emgc_relationship_id: originalItem.emgc_relationship_id || null,
                      emgc_address: originalItem.emgc_address || null,
                      status: originalItem.status !== undefined ? originalItem.status : null,
                      id_contact: originalItem.id_contact || originalItem.id
                    };
                    originalChangedItems.push(validOriginalItem);
                  } else {
                    // This is likely an insert operation - create minimal original item structure
                    const emptyOriginalItem = {
                      emgc_name: null,
                      emgc_number: null,
                      emgc_relationship_id: null,
                      emgc_address: null,
                      status: null,
                      // Don't include id_contact for insert operations
                    };
                    originalChangedItems.push(emptyOriginalItem);
                  }

                } else {
                }
              }

              if (changedItems.length > 0) {
                changedFields[key] = changedItems;
                oldData[key] = originalChangedItems; // Only send old data for changed items
              } else {
              }
            } else if (activeTab.value === 'family' || activeTab.value === 'education') {
              // For family and education, also use ID-based matching like emergency contact
              const changedItems = [];
              const originalChangedItems = [];

              for (const currentItem of currentArray) {
                if (!currentItem || Object.keys(currentItem).length === 0) continue;

                // Find matching original item by ID
                let originalItem = {};
                const idField = activeTab.value === 'family' ? 'id_family' : 'id_education';
                if (currentItem[idField] || currentItem.id) {
                  const itemId = currentItem[idField] || currentItem.id;
                  originalItem = originalArray.find(orig => (orig[idField] || orig.id) === itemId) || {};
                }

                // Define fields to compare based on category
                let fieldsToCompare = [];
                if (activeTab.value === 'family') {
                  fieldsToCompare = ['name', 'birth_date', 'birth_place', 'address', 'occupation', 'relation_id', 'relation', 'marital_status_id', 'marital_status', 'gender_id', 'gender', 'member_sequence', 'no_telkomedika', 'member_status', 'status'];
                } else if (activeTab.value === 'education') {
                  fieldsToCompare = ['edu_level_id', 'edu_level', 'edu_major_id', 'edu_major', 'edu_institution_id', 'edu_institution', 'edu_start_date', 'edu_end_date', 'status'];
                }

                let isItemChanged = false;

                for (const field of fieldsToCompare) {
                  const currentFieldValue = currentItem[field];
                  const originalFieldValue = originalItem[field];

                  // Normalize values for comparison
                  const currentNormalized = currentFieldValue === null || currentFieldValue === undefined ? '' : String(currentFieldValue);
                  const originalNormalized = originalFieldValue === null || originalFieldValue === undefined ? '' : String(originalFieldValue);

                  if (currentNormalized !== originalNormalized) {
                    isItemChanged = true;
                    break;
                  }
                }

                if (isItemChanged) {
                  // Create changed item with all current data and ensure proper ID field
                  const changedItem = { ...currentItem };
                  if (activeTab.value === 'family' && changedItem.relation_id) {
                    changedItem.relation_id = changedItem.relation_id ? Number(changedItem.relation_id) : changedItem.relation_id;
                  } else if (activeTab.value === 'education') {
                    if (changedItem.edu_level_id) changedItem.edu_level_id = Number(changedItem.edu_level_id);
                    if (changedItem.edu_major_id) changedItem.edu_major_id = Number(changedItem.edu_major_id);
                    if (changedItem.edu_institution_id) changedItem.edu_institution_id = Number(changedItem.edu_institution_id);
                  }

                  changedItems.push(changedItem);

                  // Store corresponding original item - only if it has valid data
                  if (originalItem && Object.keys(originalItem).length > 0 && (originalItem[idField] || originalItem.id)) {
                    // This is an update operation - include the original item as is
                    originalChangedItems.push(originalItem);
                  } else {
                    // This is likely an insert operation - create minimal original item structure
                    const emptyOriginalItem = {};
                    originalChangedItems.push(emptyOriginalItem);
                  }

                } else {
                }
              }

              if (changedItems.length > 0) {
                changedFields[key] = changedItems;
                oldData[key] = originalChangedItems; // Only send old data for changed items
              } else {
              }
            } else {
              // For other array types, send entire array (existing behavior)
              changedFields[key] = currentValue;
              oldData[key] = originalValue;
            }
          }
        } else {
          // Normalisasi nilai untuk perbandingan
          const normalizedCurrent = currentValue === null || currentValue === undefined ? '' : String(currentValue);
          const normalizedOriginal = originalValue === null || originalValue === undefined ? '' : String(originalValue);

          // Debug logging for field comparison
          if (activeTab.value === 'basic-information') {
            console.log(`🔍 Comparing field '${key}':`, {
              currentValue,
              originalValue,
              normalizedCurrent,
              normalizedOriginal,
              isChanged: normalizedCurrent !== normalizedOriginal
            });
          }

          if (normalizedCurrent !== normalizedOriginal) {
            changedFields[key] = currentValue;
            oldData[key] = originalValue;
          }
        }
      });
    }
  }

  // For basic-information, remove immutable fields that backend forbids updating
  if (activeTab.value === 'basic-information') {
    const immutableFields = ['name'];
    immutableFields.forEach(f => {
      if (f in changedFields) {
        delete changedFields[f];
      }
      if (f in oldData) {
        delete oldData[f];
      }
    });
  }

  // ENHANCED LOGGING: Show final result before returning

  // Additional validation logging
  if (Object.keys(changedFields).length === 0) {
  } else {
  }

  // Filter out non-modifiable fields for basic-information
  let finalChangedFields = changedFields;
  let finalOldData = oldData;

  if (activeTab.value === 'basic-information') {
    // Remove fields that cannot be modified
    const { name, nik, business_email, ...filteredChangedFields } = changedFields;
    const { name: oldName, nik: oldNik, business_email: oldBusinessEmail, ...filteredOldData } = oldData;

    // Additional validation: Only include fields that are actually editable
    const editableBasicFields = [
      'no_ktp', 'main_phone_number', 'private_email', 'secondary_phone_number',
      'birth_date', 'birth_place', 'gender_id', 'marital_status_id', 'religion_id',
      'nationality_id', 'clothing_size_id'
    ];

    console.log('🔍 clothing_size_id in editableBasicFields?', editableBasicFields.includes('clothing_size_id'));

    // Further filter to only include editable fields that have actual changes
    const validChangedFields = {};
    const validOldData = {};

    console.log('🔍 Processing filteredChangedFields:', Object.keys(filteredChangedFields));
    console.log('🔍 editableBasicFields list:', editableBasicFields);

    // NEW APPROACH: Include fields that are either:
    // 1. Edited by user in this session, OR
    // 2. Already exist in previous draft (user can modify existing draft fields)
    const userEditedFields = editedFieldKeys.value || new Set();
    const previousDraftFields = Object.keys(requestDetail.value?.new_data?.data || {});

    console.log('🔍 Fields edited by user in this session:', Array.from(userEditedFields));
    console.log('🔍 Fields in previous draft:', previousDraftFields);

    Object.keys(filteredChangedFields).forEach(field => {
      console.log(`🔍 Checking field '${field}': isEditable = ${editableBasicFields.includes(field)}`);

      if (editableBasicFields.includes(field)) {
        const currentValue = filteredChangedFields[field];
        const originalValue = filteredOldData[field];

        // Check if this field was edited by user OR exists in previous draft
        const wasEditedByUser = userEditedFields.has(field);
        const existsInPreviousDraft = previousDraftFields.includes(field);
        const isAllowedField = wasEditedByUser || existsInPreviousDraft;

        console.log(`🔍 Field '${field}':`, {
          wasEditedByUser,
          existsInPreviousDraft,
          isAllowedField,
          currentValue: currentValue,
          originalValue: originalValue
        });

        // Only include if:
        // 1. Field is in editable list, AND
        // 2. (User edited this field OR field exists in previous draft), AND
        // 3. Value is not empty/default
        const isIdFieldWithZero = field.endsWith('_id') && currentValue === '0';
        const hasValidValue = (currentValue !== '' && currentValue !== null && currentValue !== undefined) && !isIdFieldWithZero;
        const shouldInclude = isAllowedField && hasValidValue;

        console.log(`🔍 Should include '${field}': ${shouldInclude}`);

        if (shouldInclude) {
          validChangedFields[field] = currentValue;
          if (field in filteredOldData) {
            validOldData[field] = originalValue;
          }
          console.log(`🔍 ✅ Including field '${field}' with value '${currentValue}'`);
        } else {
          if (!isAllowedField) {
            console.log(`🔍 ❌ Skipping field '${field}' - not edited by user and not in previous draft`);
          } else if (!hasValidValue) {
            console.log(`🔍 ❌ Skipping field '${field}' - invalid value: '${currentValue}'`);
          }
        }
      } else {
        console.log(`🔍 ❌ Field '${field}' not in editableBasicFields, skipping`);
      }
    });

    finalChangedFields = validChangedFields;
    finalOldData = validOldData;

    // Debug log for basic information changes
    console.log('🔍 Basic Information - Final changed fields:', finalChangedFields);
    console.log('🔍 Basic Information - Original data used for comparison:', originalData);
  }

  console.log('🔍 getChangedFieldsOnly - FINAL RESULT:', {
    activeTab: activeTab.value,
    newDataKeys: Object.keys(finalChangedFields),
    newData: finalChangedFields,
    oldData: finalOldData,
    hasChanges: Object.keys(finalChangedFields).length > 0
  });

  return {
    newData: finalChangedFields,
    oldData: finalOldData // Send only changed fields as old data
  };
};

// Watch for changes in dynamicFormData to sync with formData when form loads
watch(dynamicFormData, (newData) => {

  // No need to skip sync - let normal flow handle it

  // CRITICAL: Sync conditions for draft data
  const isFormDataEmpty = !formData.value || Object.keys(formData.value).length === 0;
  const hasNewData = newData && Object.keys(newData).length > 0;
  // For draft status, enhanced conditions
  const statusInfo = normalizeStatus(requestDetail.value);
  const isDraftStatus = statusInfo.isDraft;

  // Enhanced sync logic for draft data
  const shouldSyncInitial = hasNewData && isFormDataEmpty && window.isInitialLoad;
  const shouldSyncDraft = hasNewData && isDraftStatus && window.isDraftDataLoading;
  const shouldSync = shouldSyncInitial || shouldSyncDraft;

  if (shouldSync) {
    const reason = shouldSyncInitial ? "Initial load" : "Draft data loading";

    if (!window.isUpdatingFormData) {
      // Strong guard: if Draft + Address and user has edited, skip background sync entirely
      const statusInfo = normalizeStatus(requestDetail.value);
      if (activeTab.value === 'address' && statusInfo?.isDraft && editedFieldKeys.value.size > 0) {
        return;
      }
      // Additional guard: if user just typed, skip to avoid cursor jumps/overwrites
      if (isWithinUserEditWindow()) {
        return;
      }
      window.isUpdatingFormData = true;
      // On first hydration for this tab, clear edited marks to allow initial sync
      if (shouldSyncInitial) {
        editedFieldKeys.value = new Set();
      }
      window.isDraftDataLoading = false; // Reset flag after sync
      setFormDataSafely(newData);
      // For need revision, also snapshot baseline after initial sync
      if (requestDetail.value?.status === 'rejected' || requestDetail.value?.status === '3') {
        needRevisionBaseline.value = { ...(formData.value || {}) };
      }
      setTimeout(() => {
        window.isUpdatingFormData = false;
      }, 100);
    } else {
    }
  } else {
    const isUserActivelyEditing = !window.isInitialLoad && !window.isDraftDataLoading &&
      formData.value && Object.keys(formData.value).length > 0;

    // IMPORTANT: If user is actively editing, make sure we don't accidentally overwrite their data
    if (isUserActivelyEditing) {
      // Prevent any accidental data sync during active editing
      return;
    }
  }
}, { immediate: false, deep: true });

// Watch for changes in requestDetail to update form data when draft is loaded (ONE TIME ONLY)
watch(requestDetail, (newRequestDetail) => {
  if (newRequestDetail) {
    // FIXED: Use normalize helper for consistent status detection
    const statusInfo = normalizeStatus(newRequestDetail);
    const isDraft = statusInfo.isDraft;

    if (isDraft) {

      // Normal sync flow - no special handling needed

      // Only sync on initial load to avoid overwriting user changes
      if (window.isInitialLoad) {
        nextTick(() => {
          const computedData = dynamicFormData.value;
          if (computedData && Object.keys(computedData).length > 0) {
            setFormDataSafely(computedData);
          }
        });
      } else {
      }
    }
  }
}, { immediate: false, deep: true });

// Watch activeTab changes to load appropriate data (SAFELY)
watch(activeTab, async (newTab, oldTab) => {
  if (newTab && newTab !== oldTab && requestDetail.value) {
    // Reset edited keys when switching tabs
    editedFieldKeys.value = new Set();

    // Don't reset formData - let dynamicFormData handle the data loading
    // This prevents data loss during initial tab setup

    // Set flag for draft data loading
    const isDraftStatus = requestDetail.value.status === 'draft' || requestDetail.value.status === '1';
    if (isDraftStatus) {
      window.isDraftDataLoading = true;
    }

    // Special handling for address tab - ensure data is loaded
    if (newTab === 'address') {

      // If no address data is available, force load it
      if ((!originalAddressData.value || Object.keys(originalAddressData.value).length === 0) &&
        (!addressData.value || Object.keys(addressData.value).length === 0)) {
        try {
          await loadAddress();
        } catch (error) {
        }
      }
    }

    // Special handling for emergency contact tab - ensure data is loaded
    if (newTab === 'emergency-contact') {

      // Always reload emergency contact data to ensure it's fresh
      try {
        await loadEmergencyContact();
      } catch (error) {
        // Error loading emergency contact data
      }
    }

    // Special handling for medical-record tab - load master options for selects
    if (newTab === 'medical-record') {
      try {
        await loadMedicalMasterOptions();
      } catch (error) {
        // Error loading medical master options
      }
    }

    // For draft status, trigger dynamicFormData recalculation
    if (isDraftStatus) {
      // Allow dynamicFormData to recalculate for new tab
      await nextTick();
      // The watcher will handle the sync automatically via isDraftDataLoading flag
    }
  }
});

// Note: Removed problematic watch(dynamicTabs) logic that caused race conditions.
// activeTab is now properly set in onMounted after loadRequestDetail() completes,
// matching the stable ESS-Sigma implementation.

// Ensure options are available when first landing directly on medical-record
onMounted(async () => {
  try {
    if (activeTab.value === 'medical-record') {
      await loadMedicalMasterOptions();
    }
  } catch (e) {
    // Error loading initial medical master options
  }
});

// Missing functions that are referenced in template
const handleOpenChangeRequestModal = () => {
  isChangeRequestModalOpen.value = true;
};

// Handle education attachment uploads manually
const handleEducationAttachmentUploads = async (changeRequestId) => {
  const { uploadAttachment } = useAttachments();
  const pendingUploadsList = [];
  const seenClientKeys = new Set(); // Prevent duplicates
  // Helper function to add unique uploads only
  const addUniqueUpload = (pendingFile, source) => {
    const clientKey = pendingFile.clientKey || pendingFile.file?.clientKey;
    if (clientKey && !seenClientKeys.has(clientKey)) {
      seenClientKeys.add(clientKey);
      pendingUploadsList.push({
        ...pendingFile,
        changeRequestId: changeRequestId,
        source: source
      });
    } else {
    }
  };

  // Source 1: formData education records (PRIMARY SOURCE)
  if (Array.isArray(formData.value)) {
    formData.value.forEach((record, recordIndex) => {
      if (record.pendingUploads && record.pendingUploads.length > 0) {
        record.pendingUploads.forEach(pendingFile => {
          addUniqueUpload(pendingFile, 'formData');
        });
      }
    });
  }

  // Source 2: dynamicFormData education records (only if formData is empty)
  if (pendingUploadsList.length === 0 && Array.isArray(dynamicFormData.value)) {
    dynamicFormData.value.forEach((record, recordIndex) => {
      if (record.pendingUploads && record.pendingUploads.length > 0) {
        record.pendingUploads.forEach(pendingFile => {
          addUniqueUpload(pendingFile, 'dynamicFormData');
        });
      }
    });
  }

  // Source 3: global pendingUploads (only if no data sources have uploads)
  if (pendingUploadsList.length === 0 && pendingUploads.value.length > 0) {
    pendingUploads.value.forEach(pendingUpload => {
      if (pendingUpload.file) {
        addUniqueUpload({
          file: pendingUpload.file.file || pendingUpload.file,
          clientKey: pendingUpload.file.clientKey
        }, 'global');
      }
    });
  }
  if (pendingUploadsList.length === 0) {
    return { success: true, uploaded: 0 };
  }
  try {
    // Upload all pending files
    const uploadPromises = pendingUploadsList.map(async (pendingFile) => {
      try {
        // Use the client_key from the pending file, or try to get it from the record
        let clientKey = pendingFile.clientKey;

        // If no clientKey in pendingFile, try to get it from the record
        if (!clientKey && pendingFile.record && pendingFile.record.client_key) {
          clientKey = pendingFile.record.client_key;
        }

        // If still no clientKey, generate one (fallback)
        if (!clientKey) {
          clientKey = generateClientKey();
        }
        const result = await uploadAttachment(
          changeRequestId,
          pendingFile.file,
          ['8'], // Education attachment type
          null,
          { client_key: clientKey }
        );

        if (result.success) {
          // Clear pending uploads based on source
          if (pendingFile.source === 'formData' || pendingFile.source === 'dynamicFormData' || pendingFile.source === 'educationForm') {
            const record = pendingFile.record;
            if (record && record.pendingUploads) {
              record.pendingUploads = record.pendingUploads.filter(
                p => p !== pendingFile
              );
            }
          }

          return { success: true, data: result.data };
        } else {
          throw new Error(result.message || 'Upload failed');
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        return { success: false, error: error.message };
      }
    });

    const results = await Promise.all(uploadPromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    if (successful > 0) {
      toastSuccess(`${successful} file(s) uploaded successfully`);

      // Refresh data to update both edit form and document section
      try {
        await loadRequestDetail();
      } catch (refreshError) {
        console.error('Error refreshing data after upload:', refreshError);
        // Don't show error toast here as upload was successful
      }
    }

    if (failed > 0) {
      toastError(`${failed} file(s) failed to upload`);
    }

    return { success: true, uploaded: successful, failed: failed };

  } catch (error) {
    toastError('Failed to upload files: ' + error.message);
    return { success: false, error: error.message };
  }
};

const handleEditRequest = async (eventData) => {
  if (!eventData || !eventData.action) {
    console.warn('Invalid edit request event data:', eventData);
    return;
  }

  if (eventData.action === 'update') {
    // Handle education form save changes
    if (activeTab.value === 'education' && eventData.data) {
      // IMPORTANT: Update formData with the latest data from EducationForm
      if (eventData.data.education_records) {
        formData.value = eventData.data.education_records;
      }

      // Note: Save functionality is handled by handleSaveAsDraft button click
      // This function just updates the formData and lets the user manually save
    }
  }
};

const deleteDocument = async (event) => {
  // Handle document deletion from DocumentSection
  const { itemId, attachment } = event;
  if (!itemId) {
    console.warn('No itemId provided for document deletion');
    return;
  }

  try {
    // Show loading state
    isLoadingDetail.value = true;
    // Refresh request detail to get updated data
    await loadRequestDetail();

    // Force refresh EducationForm by updating formData
    if (activeTab.value === 'education' && requestDetail.value?.new_data?.education) {
      // Update formData with fresh data from requestDetail
      formData.value = requestDetail.value.new_data.education;

      // Also update dynamicFormData to ensure consistency
      dynamicFormData.value = requestDetail.value.new_data.education;

      // Trigger reactivity by updating ref
      await nextTick();
    }

    // Show success message (removed because DocumentSection already shows it)
  } catch (error) {
    console.error('Error refreshing data after document deletion:', error);
    toastError('Failed to refresh data after deletion');
  } finally {
    isLoadingDetail.value = false;
  }
};

// Handle document deleted from DocumentSection
const handleDocumentDeleted = (event) => {
  // Delegate to existing deleteDocument method
  deleteDocument(event);
};

// Handle document view from DocumentSection
const handleDocumentView = (doc) => {
  // Delegate to existing openDocumentPreview method
  openDocumentPreview(doc);
};

const handleRefreshRequestDetail = async () => {
  // Handle refresh request detail from form components
  try {
    // Show loading state
    isLoadingDetail.value = true;

    // Refresh request detail to get updated data
    await loadRequestDetail();

    // Show success message
    toastSuccess('Data refreshed successfully');
  } catch (error) {
    console.error('Error refreshing request detail:', error);
    toastError('Failed to refresh data');
  } finally {
    isLoadingDetail.value = false;
  }
};

const handlePendingUpload = (event) => {
  // Handle pending upload from form components
  const { file, recordIndex } = event;
  // Add to pending uploads with proper structure
  pendingUploads.value.push({
    file: file, // This should contain { file: File, clientKey: string, recordIndex: number, record: object }
    recordIndex: recordIndex,
    timestamp: Date.now()
  });
};

const closeInsertRequestModal = () => {
  isInsertRequestModalOpen.value = false;
  pendingInsertData.value = null;
};

const handleInsertRequestSuccess = () => {
  // Handle insert request success
  closeInsertRequestModal();
  // Refresh data or show success message
  toastSuccess('Data inserted successfully');
};

const isEditDraftPage = computed(() => {
  return true; // This is an edit draft page
});

const isFieldVisible = (fieldName) => {
  // Simple field visibility logic - can be enhanced based on requirements
  return true;
};

// Fix typo in template - should be requestDetail not requestDatail
const requestDatail = computed(() => requestDetail.value);

const getMaxFiles = (tabName) => {
  const maxFilesMap = {
    'basic-information': 1, // KTP only
    'address': 1, // KTP only
    'family': 1, // Family Card (KK) only
    'payroll-account': 2, // Bank Account Book + NPWP
    'social-security': 2, // BPJS + Telkomedika
    'education': 3 // Multiple certificates allowed
  };

  return maxFilesMap[tabName] || 1;
};

// Get required documents based on category
const getRequiredDocuments = (tabName) => {
  const documentMap = {
    'basic-information': [
      {
        code: 'ktp',
        label: 'ID Card (KTP)',
        required: true,
        description: 'Upload your KTP/ID Card (required for personal data changes)'
      }
    ],
    'address': [
      {
        code: 'ktp',
        label: 'ID Card (KTP)',
        required: true,
        description: 'Upload your KTP/ID Card (required for address changes)'
      }
    ],
    'family': [
      {
        code: 'kk',
        label: 'Family Card (KK)',
        required: true,
        description: 'Upload your Family Card (KK) document'
      }
    ],
    'payroll-account': [
      {
        code: 'account_book',
        label: 'Bank Account Book',
        required: true,
        description: 'Upload your bank account book or statement'
      },
      {
        code: 'npwp',
        label: 'NPWP Document',
        required: false,
        description: 'Upload your NPWP document (optional)'
      }
    ],
    'social-security': [
      {
        code: 'bpjs',
        label: 'BPJS Card',
        required: true,
        description: 'Upload your BPJS card or certificate'
      },
      {
        code: 'telkomedika',
        label: 'Telkomedika Card',
        required: false,
        description: 'Upload your Telkomedika card (optional)'
      }
    ]
  };

  return documentMap[tabName] || [];
};

// Get document upload title based on category
const getDocumentUploadTitle = (tabName) => {
  const titleMap = {
    'basic-information': 'KTP Document Upload',
    'address': 'KTP Document Upload',
    'family': 'Family Card (KK) Document Upload',
    'payroll-account': 'Bank Account Document Upload',
    'social-security': 'BPJS Document Upload'
  };

  return titleMap[tabName] || 'Document Upload';
};

// Get document upload subtitle based on category
const getDocumentUploadSubtitle = (tabName) => {
  const subtitleMap = {
    'basic-information': 'Upload your <span class="text-primary-500 font-bold">KTP</span> document (required)',
    'address': 'Upload your <span class="text-primary-500 font-bold">KTP</span> document (required)',
    'family': 'Upload your <span class="text-primary-500 font-bold">Family Card (KK)</span> document (required)',
    'payroll-account': 'Upload your <span class="text-primary-500 font-bold">NPWP Document</span> and <span class="text-primary-500 font-bold">Saving Book Document</span> (required)',
    'social-security': 'Upload your <span class="text-primary-500 font-bold">Telkomedika Card Photo</span> and <span class="text-primary-500 font-bold">BPJS Card Photo</span> (required)'
  };

  return subtitleMap[tabName] || 'Upload supporting documents for this category.';
};

// Get required document count based on category
const getRequiredDocumentCount = (tabName) => {
  const countMap = {
    'basic-information': 1, // KTP required
    'address': 1, // KTP required
    'family': 1, // Family Card required
    'payroll-account': 1, // Bank Account Book required (NPWP optional)
    'social-security': 1, // BPJS required (Telkomedika optional)
    'education': 1 // At least one certificate required
  };

  return countMap[tabName] || 1;
};

// Dynamic category function using requestDetail data
const getSideEditPageCategory = (tabName) => {
  // If no requestDetail, fallback to tab-based mapping
  if (!requestDetail.value) {
    const tabCategoryMap = {
      'basic-information': 'Basic Information',
      'address': 'Address',
      'payroll-account': 'Payroll Account',
      'social-security': 'Benefit',
      'education': 'Education',
      'family': 'Family',
      'emergency-contact': 'Emergency Contact'
    };
    return tabCategoryMap[tabName] || 'Document Upload';
  }
  
  const requestType = requestDetail.value.request_type;
  
  // Map request type to category label (SideEditPage expects string, not object)
  const categoryMap = {
    'BSC': 'Basic Information',
    'ADR': 'Address', 
    'EMC': 'Emergency Contact',
    'PYR': 'Payroll Account',
    'FMY': 'Family',
    'EDC': 'Education',
    'SSI': 'Benefit'
  };
  
  return categoryMap[requestType] || 'Update Data';
};

  // Dynamic document types and selector behavior for MultiDocumentUpload
  // Mirror behavior from UpdateData sections
  import { useDocumentTypes } from '~/composables/useDocumentTypes'
  const { documentTypes, fetchDocumentTypes, getDocumentTypeCode } = useDocumentTypes()
  fetchDocumentTypes()

  const docTypeOptions = computed(() => {
    const list = Array.isArray(documentTypes.value) ? documentTypes.value : []
    const tab = activeTab.value
    if (tab === 'payroll-account') {
      return list.filter(dt => ['4','7'].includes(String(dt.code))).map(dt => ({ value: String(dt.code), label: dt.value }))
    }
    if (tab === 'social-security') {
      return list.filter(dt => ['5','6'].includes(String(dt.code))).map(dt => ({ value: String(dt.code), label: dt.value }))
    }
    // Default: map all
    return list.map(dt => ({ value: String(dt.code), label: dt.value }))
  })

  const shouldShowTypeSelector = computed(() => {
    const tab = activeTab.value
    return tab === 'payroll-account' || tab === 'social-security'
  })

  const shouldLockType = computed(() => {
    const tab = activeTab.value
    // Lock for KTP-driven tabs and family (KK)
    return tab === 'basic-information' || tab === 'address' || tab === 'family'
  })

  const lockedTypeValue = computed(() => {
    const tab = activeTab.value
    if (tab === 'basic-information' || tab === 'address') {
      return getDocumentTypeCode ? getDocumentTypeCode('KTP') : '3'
    }
    if (tab === 'family') {
      // Try resolve KK code; fallback to existing KTP code if not found
      const kk = getDocumentTypeCode ? getDocumentTypeCode('KK') : ''
      return kk || '3'
    }
    return ''
  })
  // Function to handle scroll to upload section
  const handleScrollToUpload = () => {
    // For education, scroll to the first education record's upload area
    if (activeTab.value === 'education') {
      const firstEducationCard = document.querySelector('.education-record-card');
      if (firstEducationCard) {
        firstEducationCard.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        // Add highlight effect
        firstEducationCard.classList.add('ring-2', 'ring-red-500', 'ring-offset-2');
        setTimeout(() => {
          firstEducationCard.classList.remove('ring-2', 'ring-red-500', 'ring-offset-2');
        }, 3000);
        return;
      }
    }

    // For other categories, find multi-upload section and scroll to it
    const multiUploadElement = document.querySelector('[class*="multi-upload"], [class*="document-upload"], .multi-document-upload');
    if (multiUploadElement) {
      multiUploadElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      // Add highlight effect
      multiUploadElement.classList.add('animate-pulse');
      setTimeout(() => {
        multiUploadElement.classList.remove('animate-pulse');
      }, 3000);
    }
  }
</script>

<style>
/* Hide Add New button in EducationForm only on edit page */
.hide-add-education .flex.gap-2>button:last-of-type {
  display: none !important;
}
</style>