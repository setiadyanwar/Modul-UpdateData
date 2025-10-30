<template>
  <div v-if="isOpen" class="fixed inset-0 z-[9999] overflow-y-auto" aria-labelledby="modal-title" role="dialog"
    aria-modal="true">
    <!-- Background overlay -->

    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" @click="closeModal"></div>

    <!-- Modal panel -->

    <div class="relative z-10 flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
      <div
        class="relative transform overflow-hidden rounded-md bg-white dark:bg-grey-800 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-5xl max-h-[90vh] flex flex-col border border-grey-200 dark:border-grey-700">
        <!-- Modal header -->

        <div class="flex items-center justify-between p-4 border-b border-grey-200 dark:border-grey-700">
          <h3 class="text-lg font-semibold text-text-main">
            {{
              props.action === "insert"
                ? "Submit Insert Request"
                : "Submit Change Request"
            }}
          </h3>

          <button @click="closeModal"
            class="text-grey-400 hover:text-grey-600 dark:hover:text-grey-300 transition-colors">
            <i class="pi pi-times text-xl"></i>
          </button>
        </div>

        <!-- Modal content -->

        <div class="p-4 flex-1 overflow-y-auto">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Left Column: Change Reason & Agreement -->

            <div class="space-y-4">
              <!-- Change Reason Form -->

              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="block text-sm font-medium text-text-main">
                    Change Reason <span class="text-red-500">*</span>
                  </label>
                  <span :class="['text-xs', hasReachedMaxReason ? 'text-red-600' : 'text-text-secondary']">
                    {{ changeReasonLength }}/{{ MAX_REASON_LENGTH }}
                  </span>
                </div>

                <textarea v-model="changeReason" @input="onChangeReasonInput" :maxlength="MAX_REASON_LENGTH" rows="4"
                  class="w-full px-3 py-2 border border-grey-300 dark:border-grey-600 rounded-md shadow-sm placeholder-grey-400 bg-white dark:bg-grey-700 text-text-main focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                  placeholder="Please provide a detailed explanation for your data change request..."></textarea>

                <p class="text-xs text-text-secondary mt-1">
                  ⚠️ Please ensure your reason is clear and justifiable
                </p>
                <p v-if="hasReachedMaxReason" class="text-xs text-red-600 mt-1">
                  Maksimal 200 karakter
                </p>
              </div>

              <!-- Status Tracker -->

              <div class="bg-blue-50 dark:bg-blue-900/20 rounded-md p-4 border border-blue-200 dark:border-blue-800">
                <h4 class="font-semibold text-text-main text-sm mb-3 flex items-center">
                  <i class="pi pi-diagram text-blue-600 dark:text-blue-400 mr-2"></i>

                  Status Request
                </h4>

                <StatusTracker :current-status="getCurrentStatus()" :steps="getStatusSteps()" />
              </div>

              <!-- Personal Data Update Terms -->

              <Alert variant="info" title="Personal Data Update Terms" size="small" :no-margin="true">
                <ul class="text-xs space-y-1 mt-2">
                  <li class="flex items-start space-x-2">
                    <span class="text-secondary-600 dark:text-secondary-400">•</span>

                    <span>Upload supporting documents.</span>
                  </li>

                  <li class="flex items-start space-x-2">
                    <span class="text-secondary-600 dark:text-secondary-400">•</span>

                    <span>Check personal data consent.</span>
                  </li>

                  <li class="flex items-start space-x-2">
                    <span class="text-secondary-600 dark:text-secondary-400">•</span>

                    <span>Wait for verification process.</span>
                  </li>

                  <li class="flex items-start space-x-2">
                    <span class="text-secondary-600 dark:text-secondary-400">•</span>

                    <span>Status updates will be displayed in notifications and
                      status tab.</span>
                  </li>
                </ul>
              </Alert>
            </div>

            <!-- Right Column: Consent Only -->

            <div class="space-y-4">
              <!-- Personal Data Processing Agreement (always visible) -->

              <div class="mt-6 rounded-md p-4 bg-grey-50 dark:bg-grey-800">
                <h4 class="font-bold text-text-main text-sm mb-3">
                  <Skeleton v-if="isLoadingConsents || isLoadingStatus" type="text" width="60%" />
                  <span v-else>{{ latestConsent?.title || "Personal Data Processing Agreement" }}</span>
                </h4>

                <!-- Expandable Consent Content -->

                <div class="space-y-2">
                  <!-- Full consent content, no clipping -->
                  <div class="border border-grey-200 dark:border-grey-600 rounded-md p-3 consent-content-scroll">
                    <div class="text-xs text-text-secondary">
                      <!-- Skeleton loading for consent content -->
                      <div v-if="isLoadingConsents || isLoadingStatus" class="space-y-3 consent-skeleton">
                        <Skeleton type="text" width="100%" />
                        <Skeleton type="text" width="95%" />
                        <Skeleton type="text" width="90%" />
                        <Skeleton type="text" width="85%" />
                        <Skeleton type="text" width="80%" />
                        <Skeleton type="text" width="75%" />
                        <Skeleton type="text" width="70%" />
                      </div>
                      <div v-else-if="renderedConsentContent" class="consent-rich ql-editor" v-html="renderedConsentContent"></div>
                      <div v-else class="text-center py-4">
                        <p class="text-sm text-gray-600 mb-2">Consent content unavailable</p>
                        <p class="text-xs text-gray-500">By submitting this request, you agree to our standard data processing terms and conditions.</p>
                      </div>
                    </div>
                  </div>

                  <!-- Fixed checkbox section - outside scroll area -->

                  <div class="flex items-start space-x-2 mt-3">
                    <!-- Skeleton for checkbox and label while loading -->
                    <div v-if="isLoadingConsents || isLoadingStatus" class="flex items-start space-x-2 w-full consent-skeleton">
                      <div class="w-4 h-4 bg-grey-200 dark:bg-grey-700 rounded animate-pulse mt-0.5"></div>
                      <div class="flex-1 space-y-2">
                        <Skeleton type="text" width="90%" />
                        <Skeleton type="text" width="70%" />
                        <Skeleton type="text" width="40%" />
                      </div>
                    </div>
                    <!-- Actual checkbox and label when loaded -->
                    <template v-else>
                      <Checkbox :model-value="dataConsent || isConsentApproved" :disabled="isConsentApproved"
                        @update:model-value="dataConsent = $event" variant="modal" />

                      <div class="flex-1">
                        <label class="text-xs text-text-main">
                          I consent to the collection and processing of personal
                          data in accordance with the privacy policy explained
                          above.
                          <span v-if="isConsentApproved && consentStatus?.approve_date"
                            class="text-xs text-text-secondary ml-1">
                            (Already approved on {{ consentStatus.approve_date }})
                          </span>
                          <button type="button" @click="showConsentModal = true"
                            class="text-xs text-secondary underline ml-2 hover:text-secondary-dark">
                            View details
                          </button>

                          <!-- Full details always visible -->
                        </label>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Fixed Action Buttons -->

        <div
          class="flex flex-col space-y-2 p-4 border-t border-grey-200 dark:border-grey-700 bg-white dark:bg-grey-800">
          <!-- Validation Message -->

          <div v-if="validationMessage"
            class="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-2">
            <i class="pi pi-exclamation-triangle mr-2"></i>

            {{ validationMessage }}
          </div>

          <!-- Action Buttons Row -->

          <div class="flex justify-end space-x-3">
            <button @click="closeModal"
              class="px-4 py-2 text-sm font-medium text-text-secondary bg-grey-100 dark:bg-grey-700 border border-grey-300 dark:border-grey-600 rounded-md hover:bg-grey-200 dark:hover:bg-grey-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-grey-500 transition-colors">
              Cancel
            </button>

            <button @click="handleSubmit" :disabled="!isFormValid || apiSubmitting"
              :title="!isFormValid ? validationMessage : ''"
              class="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2">
              <span>{{
                apiSubmitting
                  ? "Submitting..."
                  : props.action === "insert"
                    ? "Submit Insert Request"
                    : "Send Update Request"
              }}</span>
              <i v-if="!apiSubmitting" class="pi pi-send"></i>
              <i v-else class="pi pi-spinner pi-spin"></i>
            </button>
          </div>
        </div>

        <!-- Divider -->

        <div class="border-t border-grey-200 dark:border-grey-700"></div>
      </div>
    </div>
    <!-- Consent Details Modal (inside template so it renders) -->
    <ConsentDetailsModal v-model="showConsentModal"
      :title="latestConsent?.title || 'Personal Data Processing Agreement'" :content="renderedConsentContent"
      :loading="isLoadingConsents || isLoadingStatus" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from "vue";
import '@vueup/vue-quill/dist/vue-quill.snow.css'

import { navigateTo } from "#app";

import Alert from "./Alert.vue";

import StatusTracker from "./StatusTracker.vue";
import Checkbox from "./Checkbox.vue";
import ConsentDetailsModal from "./ConsentDetailsModal.vue";
import Skeleton from "./Skeleton.vue";
import { useChangeRequestSubmit } from "~/composables/useChangeRequestSubmit";
import { useAttachments } from "~/composables/useAttachments";
import { useToast } from "~/composables/useToast";
import { useDocumentTypes } from "~/composables/useDocumentTypes";
import { useRBAC } from "~/composables/useRBAC";
import {
  formatFileSize,
  truncateFileName,
} from "~/composables/useTextFormatting.js";
import { useConsent } from "~/composables/useConsent";

const props = defineProps({
  isOpen: {
    type: Boolean,

    default: false,
  },

  currentTab: {
    type: String,

    required: true,
  },

  changes: {
    type: Object,

    required: true,
  },

  requestType: {
    type: String,

    required: true,
  },

  action: {
    type: String,

    required: true,

    validator: (value) => ["insert", "update"].includes(value),
  },

  isDraft: {
    type: Boolean,

    default: false,
  },

  data: {
    type: [Object, Array],

    required: true,
  },

  note: {
    type: String,

    default: "",
  },

  existingRequestId: {
    type: [String, Number],

    default: null,
  },
  redirectOnSuccess: {
    type: Boolean,
    default: false,
  },

  professionalPhotoFile: {
    type: File,
    default: null,
  },
  disableSubmit: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "success", "submit-data"]);

// Debug props when modal opens

watch(
  () => props.isOpen,
  (newValue) => {
    if (newValue) {
    }
  },
  { immediate: true }
);

const { submitChangeRequest, isSubmitting: apiSubmitting } =
  useChangeRequestSubmit();

const { uploadAttachment, validateFile } = useAttachments();

const { documentTypes, fetchDocumentTypes } = useDocumentTypes();

const { success, error: showError } = useToast();

// RBAC checks
const { canAttachFiles } = useRBAC();

// Helper function to determine current status based on context

const getCurrentStatus = () => {
  // If we have existingRequestId, it means we're editing an existing request

  if (props.existingRequestId) {
    // Check if it's a need revision status

    if (
      (props.note && props.note.includes("revision")) ||
      (props.note && props.note.includes("revisi"))
    ) {
      return "need_revision"; // Status aktif adalah need_revision
    }

    // Otherwise it's a draft being edited - status aktif adalah draft

    return "draft";
  }

  // If no existingRequestId, it's a new submission from update-data

  return "submitted";
};

// Helper function to get status steps based on context

const getStatusSteps = () => {
  // If we have existingRequestId, it means we're editing an existing request

  if (props.existingRequestId) {
    // Check if it's a need revision status

    if (
      (props.note && props.note.includes("revision")) ||
      (props.note && props.note.includes("revisi"))
    ) {
      // For need revision, show only 3 steps: Need Revision - Waiting Approval - Approved

      return [
        {
          key: "need_revision",
          label: "Need Revision",
          icon: "pi pi-exclamation-triangle",
        },

        {
          key: "waiting_approval",
          label: "Waiting Approval",
          icon: "pi pi-clock",
        },

        { key: "approved", label: "Approved", icon: "pi pi-check" },
      ];
    } else {
      // For draft status, show only 4 steps: Draft - Submitted - Waiting Approval - Approved

      return [
        { key: "draft", label: "Draft", icon: "pi pi-file-edit" },

        { key: "submitted", label: "Submitted", icon: "pi pi-send" },

        {
          key: "waiting_approval",
          label: "Waiting Approval",
          icon: "pi pi-clock",
        },

        { key: "approved", label: "Approved", icon: "pi pi-check" },
      ];
    }
  }

  // If no existingRequestId, it's a new submission from update-data

  // Only show the basic flow without draft, rejected and need revision

  return [
    { key: "submitted", label: "Submitted", icon: "pi pi-send" },

    { key: "waiting_approval", label: "Waiting Approval", icon: "pi pi-clock" },

    { key: "approved", label: "Approved", icon: "pi pi-check" },
  ];
};

// Form data

const changeReason = ref("");
const MAX_REASON_LENGTH = 200;
const hasShownMaxWarning = ref(false);
const changeReasonLength = computed(() => changeReason.value.length);
const hasReachedMaxReason = computed(() => changeReasonLength.value >= MAX_REASON_LENGTH);
const dataConsent = ref(false);
const uploadedFiles = ref([]);
const isDragOver = ref(false);
const showConsentDetail = ref(false); // legacy flag (no longer used)
const showConsentModal = ref(false);

// File input ref

const fileInput = ref(null);

// Guard to prevent double submission
const isSubmitting = ref(false);

// Consent integration
const {
  activeConsents,
  consentStatus,
  isLoadingConsents,
  isLoadingStatus,
  hasActiveConsent,
  isConsentApproved,
  latestConsent,
  fetchActiveConsents,
  fetchConsentStatus,
} = useConsent();

// Decode HTML entities and clean attributes that may disturb rendering
const decodeHtmlEntities = (input) => {
  if (!input) return "";
  const str = String(input);
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value;
  }
  // SSR-safe minimal decode
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
};

const cleanHtmlContent = (html) => {
  if (!html) return "";
  const decoded = decodeHtmlEntities(html);
  return decoded
    .replace(/\s*data-start="[^"]*"/g, "")
    .replace(/\s*data-end="[^"]*"/g, "")
    .trim();
};

const renderedConsentContent = computed(() => {
  const content = latestConsent.value?.content || "";
  if (!content) return "";
  return cleanHtmlContent(content);
});

// No snippet; always show full consent content

// Computed properties

const hasFilesWithoutType = computed(() => {
  return uploadedFiles.value.some((file) => !file.documentType);
});

// Check if current tab is basic information

const isBasicInformationTab = computed(() => {
  const isBasic =
    props.currentTab === "basic-information" ||
    props.currentTab === "basic_information" ||
    props.currentTab === "basic-info" ||
    props.currentTab === "basic_info";


  return isBasic;
});

// Check if current tab is address

const isAddressTab = computed(() => {
  return (
    props.currentTab === "address" || props.currentTab === "address-information"
  );
});

// All categories: uploads are handled outside this modal now
const isNoDocumentRequiredTab = computed(() => {
  return true;
});

// Hide document upload section for all tabs
const isUploadHiddenTab = computed(() => true);

// Get filtered document types based on current tab

const filteredDocumentTypes = computed(() => {


  if (isBasicInformationTab.value) {
    // For basic information, show KTP (code: 3) and Professional Photo (code: 1)
    const filtered = documentTypes.value.filter(
      (docType) => docType.code === "3" || docType.code === "1" ||
        docType.value === "KTP" || docType.value === "Professional Photo"
    );



    return filtered;
  }

  if (isAddressTab.value) {
    // For address, only show KTP (code: 3)
    const filtered = documentTypes.value.filter(
      (docType) => docType.code === "3" || docType.value === "KTP"
    );


    return filtered;
  }

  if (
    props.currentTab === "payroll-account" ||
    props.currentTab === "payroll_account"
  ) {
    // For payroll account, show Buku Tabungan (code: 7) and NPWP (code: 4)

    const filtered = documentTypes.value.filter(
      (docType) =>
        docType.code === "7" || // Buku Tabungan (Saving Book)
        docType.code === "4" || // NPWP
        docType.value === "Buku Tabungan" ||
        docType.value === "NPWP" ||
        docType.value === "Saving Book" ||
        docType.value === "Bank Book" ||
        docType.value === "Tabungan" ||
        docType.value === "Buku Bank" ||
        docType.value === "Buku Tabungan (Saving Book)" || // API format
        docType.value.includes("Buku Tabungan") || // Contains Buku Tabungan
        docType.value.includes("Saving Book") // Contains Saving Book
    );



    return filtered;
  }

  if (
    props.currentTab === "family" ||
    props.currentTab === "family-information"
  ) {
    // For family, show KK (code: 2)

    return documentTypes.value.filter(
      (docType) => docType.code === "2" || docType.value === "KK"
    );
  }

  if (
    props.currentTab === "education" ||
    props.currentTab === "education-information"
  ) {
    // For education, show Ijazah (code: 8)

    return documentTypes.value.filter(
      (docType) => docType.code === "8" || docType.value === "Ijazah"
    );
  }

  if (
    props.currentTab === "social-security" ||
    props.currentTab === "social_security" ||
    props.currentTab === "insurance" ||
    props.currentTab === "social-security-insurance"
  ) {
    // For Benefit, show Telkomedika (code: 5) and BPJS (code: 6)

    return documentTypes.value.filter(
      (docType) =>
        docType.code === "5" || // Telkomedika
        docType.code === "6" || // BPJS
        docType.value === "Telkomedika" ||
        docType.value === "BPJS"
    );
  }

  // For other tabs, show all document types

  return documentTypes.value;
});

// Check if required documents are uploaded based on category

const hasRequiredDocuments = computed(() => {
  // For tabs that require no documents, always return true

  if (isNoDocumentRequiredTab.value) {
    return true;
  }

  // Basic information is handled in the form; no modal requirement
  if (isBasicInformationTab.value) {
    return true;
  }

  // Address: no modal requirement
  if (isAddressTab.value) {
    return true;
  }

  // For payroll account, require Buku Tabungan and NPWP

  if (
    props.currentTab === "payroll-account" ||
    props.currentTab === "payroll_account"
  ) {
    const hasBukuTabungan = uploadedFiles.value.some((file) => {
      const docType = documentTypes.value.find(
        (dt) => dt.code === file.documentType
      );

      return (
        file.documentType === "7" || // Buku Tabungan code is '7'
        (docType &&
          (docType.value === "Buku Tabungan" ||
            docType.value === "Saving Book" ||
            docType.value === "Bank Book" ||
            docType.value === "Tabungan" ||
            docType.value === "Buku Bank" ||
            docType.value === "Buku Tabungan (Saving Book)" || // API format
            docType.value.includes("Buku Tabungan") || // Contains Buku Tabungan
            docType.value.includes("Saving Book"))) // Contains Saving Book
      );
    });

    const hasNPWP = uploadedFiles.value.some(
      (file) =>
        file.documentType === "4" || // NPWP code is '4'
        (file.documentType &&
          documentTypes.value.find((dt) => dt.code === file.documentType)
            ?.value === "NPWP")
    );

    return true;
  }

  // For family, require KK (code: 2)

  if (
    props.currentTab === "family" ||
    props.currentTab === "family-information"
  ) {
    return true;
  }

  // For education, we hide upload in modal, so don't require files here
  if (
    props.currentTab === "education" ||
    props.currentTab === "education-information"
  ) {
    return true;
  }

  // For Benefit, require Telkomedika (code: 5) and BPJS (code: 6)

  if (
    props.currentTab === "social-security" ||
    props.currentTab === "social_security" ||
    props.currentTab === "insurance" ||
    props.currentTab === "social-security-insurance"
  ) {
    const hasTelkomedika = uploadedFiles.value.some(
      (file) =>
        file.documentType === "5" || // Telkomedika code is '5'
        (file.documentType &&
          documentTypes.value.find((dt) => dt.code === file.documentType)
            ?.value === "Telkomedika")
    );

    const hasBPJS = uploadedFiles.value.some(
      (file) =>
        file.documentType === "6" || // BPJS code is '6'
        (file.documentType &&
          documentTypes.value.find((dt) => dt.code === file.documentType)
            ?.value === "BPJS")
    );

    return true;
  }

  // For other tabs, no specific requirements

  return true;
});

const consentOk = computed(() => dataConsent.value || isConsentApproved.value);

const isFormValid = computed(() => {
  // Check basic form validation

  const basicValidation = changeReason.value.trim() !== "" && consentOk.value;

  // Check if form has valid data to submit

  const hasValidData = checkFormDataValidity();


  // For tabs that require no documents, skip file validation

  if (isNoDocumentRequiredTab.value) {
    const result = basicValidation && hasValidData;


    return result;
  }

  // Check if any files are currently uploading

  const hasUploadingFiles = uploadedFiles.value.some((file) => file.uploading);

  // Check if all files have document types selected

  const allFilesHaveTypes = uploadedFiles.value.every(
    (file) => file.documentType && file.documentType.trim() !== ""
  );

  // Check if there are files without types (for error display)

  const hasFilesWithoutType = uploadedFiles.value.some(
    (file) => !file.documentType || file.documentType.trim() === ""
  );

  // Check if required documents are uploaded based on category

  const documentValidation = hasRequiredDocuments.value;


  const result =
    basicValidation &&
    hasValidData &&
    !hasUploadingFiles &&
    allFilesHaveTypes &&
    documentValidation;


  return result;
});

// Function to check if form data has valid content

const checkFormDataValidity = () => {
  const changes = props.changes || props.data;

  if (!changes) {
    return false;
  }

  let formData = null;

  // Extract form data from changes structure
  if (Array.isArray(changes)) {
    formData = changes[0];
  } else if (changes["basic-information"]) {
    formData = changes["basic-information"];
  } else if (changes.new) {
    formData = changes.new;
  } else {
    formData = changes;
  }
  if (!formData) {
    return false;
  }

  // Check if any field has meaningful data (not empty, null, or just whitespace)

  const hasData = Object.values(formData).some((value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim() !== "";
    if (typeof value === "number") return value !== 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return true;
  });



  // For basic information, validate specific fields only if they exist and have values

  if (isBasicInformationTab.value) {
    // Check if KTP is present and valid (only if it exists in the data)

    const ktpValue = formData.no_ktp;

    if (ktpValue && ktpValue.trim() !== "") {
      // Only validate KTP if it's being updated (has a value)

      if (ktpValue.length !== 16) {
        return false;
      }
      if (!/^\d+$/.test(ktpValue)) {
        return false;
      }
    }

    // Allow submission when only KTP document is uploaded (Professional Photo optional)
    if (!hasData) {
      const hasKTPFile = uploadedFiles.value.some((file) =>
        file.documentType === "3" ||
        (file.documentType &&
          documentTypes.value.find((dt) => dt.code === file.documentType)?.value === "KTP")
      );
      if (hasKTPFile) {
        return true;
      }
    }

    // If KTP field doesn't exist or is empty, continue with general validation
  }

  return hasData;
};

// Computed property for validation message

const validationMessage = computed(() => {





  if (changeReason.value.trim() === "") {
    return "Please provide a reason for the change";
  }

  if (!consentOk.value) {
    return "Please agree to the data processing terms";
  }

  if (!checkFormDataValidity()) {
    return "Please fill in at least one field before submitting";
  }

  // For tabs that require no documents, skip file validation

  if (isNoDocumentRequiredTab.value) {

    return "";
  }

  // Check document requirements based on category

  if (!hasRequiredDocuments.value) {
    if (isBasicInformationTab.value) {
      return "KTP document is required for basic information updates. Professional Photo is optional. Please upload your KTP document.";
    }

    if (isAddressTab.value) {
      return "KTP document is required for address updates. Please upload your KTP document.";
    }

    if (
      props.currentTab === "payroll-account" ||
      props.currentTab === "payroll_account"
    ) {
      return "Buku Tabungan and NPWP documents are required for payroll account updates. Please upload both documents.";
    }

    if (
      props.currentTab === "family" ||
      props.currentTab === "family-information"
    ) {
      return "KK (Kartu Keluarga) document is required for family updates. Please upload your KK document.";
    }

    // No message for education since upload is handled per-record in form

    if (
      props.currentTab === "social-security" ||
      props.currentTab === "social_security" ||
      props.currentTab === "insurance" ||
      props.currentTab === "social-security-insurance"
    ) {
      return "Telkomedika and BPJS documents are required for Benefit updates. Please upload both documents.";
    }
  }

  const filesWithoutType = uploadedFiles.value.filter(
    (file) => !file.documentType || file.documentType.trim() === ""
  );

  if (filesWithoutType.length > 0) {
    const fileNames = filesWithoutType.map((f) => f.name).join(", ");

    return `Please select document type for: ${fileNames}`;
  }

  const uploadingFiles = uploadedFiles.value.filter((file) => file.uploading);

  if (uploadingFiles.length > 0) {
    return "Please wait for file uploads to complete";
  }

  return "";
});

// Watch for modal open to fetch document types

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      // Fetch document types when modal opens

      // Load consent content and status
      fetchActiveConsents()
        .then(() => {
          const id = latestConsent.value?.id_consent;
          if (id) {
            return fetchConsentStatus(id);
          } else {
            console.warn("No consent ID available for status check");
            return Promise.resolve();
          }
        })
        .then(() => {
          if (isConsentApproved.value) {
            dataConsent.value = true;
          }
        })
        .catch((error) => {
          console.warn("Failed to load consent status:", error);
          // Default to requiring consent if status check fails
          dataConsent.value = false;
        })
    }
  }
);

// Methods

const closeModal = () => {
  // Reset form when modal is closed
  changeReason.value = "";
  hasShownMaxWarning.value = false;
  dataConsent.value = false;
  uploadedFiles.value = [];
  showConsentDetail.value = false;
  // Clear any stored form data

  if (process.client) {
    localStorage.removeItem("familyInsertForms");
    localStorage.removeItem("emergencyContactInsertForms");
  }

  emit("close");
};

const onChangeReasonInput = (event) => {
  const value = event?.target?.value ?? "";
  if (value.length > MAX_REASON_LENGTH) {
    changeReason.value = value.slice(0, MAX_REASON_LENGTH);
    if (!hasShownMaxWarning.value) {
      try { showError("Maksimal 200 karakter"); } catch (_) {}
      hasShownMaxWarning.value = true;
    }
  } else {
    changeReason.value = value;
    hasShownMaxWarning.value = false;
  }
};

const triggerFileUpload = () => {
  fileInput.value?.click();
};

const handleFileChange = (event) => {
  const files = Array.from(event.target.files);

  addFiles(files);
};

const handleDragOver = (event) => {
  event.preventDefault();

  isDragOver.value = true;
};

const handleDragLeave = (event) => {
  event.preventDefault();

  isDragOver.value = false;
};

const handleFileDrop = (event) => {
  event.preventDefault();

  isDragOver.value = false;

  const files = Array.from(event.dataTransfer.files);

  addFiles(files);
};

const addFiles = async (files) => {
  for (const file of files) {
    try {
      // Check file size first with detailed error message
      const maxSize = 25 * 1024 * 1024; // 25MB
      if (file.size > maxSize) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
        showError(
          `File "${file.name}" is too large (${fileSizeMB} MB). Maximum allowed size is 25 MB. Please compress or split the file.`
        );
        continue;
      }

      // Validate file first

      validateFile(file);

      // Check file limits based on category

      if (isBasicInformationTab.value) {
        // For basic information, allow 2 files (KTP required + Professional Photo optional)

        if (uploadedFiles.value.length >= 2) {
          showError("Maximum 2 documents allowed for basic information updates (KTP + Professional Photo).");

          break;
        }
      } else if (isAddressTab.value) {
        // For address, only allow 1 file (KTP)

        if (uploadedFiles.value.length >= 1) {
          showError("Only 1 KTP document is allowed for address updates.");

          break;
        }
      } else if (
        props.currentTab === "payroll-account" ||
        props.currentTab === "payroll_account"
      ) {
        // For payroll account, allow 2 files (Buku Tabungan and NPWP)

        if (uploadedFiles.value.length >= 2) {
          showError(
            "Only 2 documents are allowed for payroll account updates (Buku Tabungan and NPWP)."
          );

          break;
        }
      } else if (
        props.currentTab === "family" ||
        props.currentTab === "family-information"
      ) {
        // For family, only allow 1 file (KK)

        if (uploadedFiles.value.length >= 1) {
          showError("Only 1 KK document is allowed for family updates.");

          break;
        }
      } else if (
        props.currentTab === "education" ||
        props.currentTab === "education-information"
      ) {
        // For education, only allow 1 file (Ijazah)

        if (uploadedFiles.value.length >= 1) {
          showError("Only 1 Ijazah document is allowed for education updates.");

          break;
        }
      } else if (
        props.currentTab === "social-security" ||
        props.currentTab === "social_security" ||
        props.currentTab === "insurance" ||
        props.currentTab === "social-security-insurance"
      ) {
        // For Benefit, allow 2 files (Telkomedika and BPJS)

        if (uploadedFiles.value.length >= 2) {
          showError(
            "Only 2 documents are allowed for Benefit updates (Telkomedika and BPJS)."
          );

          break;
        }
      } else {
        // For other tabs that don't have specific requirements, allow reasonable number of files

        if (uploadedFiles.value.length >= 3) {
          showError("Maximum 3 files allowed for this category.");

          break;
        }
      }

      // Check for duplicate files

      const isDuplicate = uploadedFiles.value.some(
        (existingFile) =>
          existingFile.name === file.name && existingFile.size === file.size
      );

      if (isDuplicate) {
        showError(`File "${file.name}" is already added.`);

        continue;
      }

      // Auto-select document type based on category

      let autoSelectedType = "";




      if (isBasicInformationTab.value) {
        // For basic information, auto-select KTP if no KTP uploaded yet, otherwise don't auto-select
        const hasKTP = uploadedFiles.value.some(file =>
          file.documentType === "3" ||
          (file.documentType && documentTypes.value.find(dt => dt.code === file.documentType)?.value === "KTP")
        );

        if (!hasKTP) {
          // No KTP uploaded yet, auto-select KTP
          const ktpDocType = documentTypes.value.find(
            (dt) => dt.code === "3" || dt.value === "KTP"
          );

          if (ktpDocType) {
            autoSelectedType = ktpDocType.code;
          } else {
            autoSelectedType = "3";
          }
        } else {
          // KTP already uploaded, don't auto-select (user can choose Professional Photo or another KTP)
          autoSelectedType = "";
        }
      } else if (isAddressTab.value) {
        // For address, always auto-select KTP
        const ktpDocType = documentTypes.value.find(
          (dt) => dt.code === "3" || dt.value === "KTP"
        );

        if (ktpDocType) {
          autoSelectedType = ktpDocType.code;
        } else {
          autoSelectedType = "3";
        }
      } else if (
        props.currentTab === "family" ||
        props.currentTab === "family-information"
      ) {
        // Find KK document type from available types

        const kkDocType = documentTypes.value.find(
          (dt) => dt.code === "2" || dt.value === "KK"
        );

        if (kkDocType) {
          autoSelectedType = kkDocType.code;

        } else {
          autoSelectedType = "2"; // Fallback

        }
      } else if (
        props.currentTab === "education" ||
        props.currentTab === "education-information"
      ) {
        // Find Ijazah document type from available types

        const ijazahDocType = documentTypes.value.find(
          (dt) => dt.code === "8" || dt.value === "Ijazah"
        );

        if (ijazahDocType) {
          autoSelectedType = ijazahDocType.code;

        } else {
          autoSelectedType = "8"; // Fallback

        }
      } else if (
        props.currentTab === "payroll-account" ||
        props.currentTab === "payroll_account"
      ) {
        // For payroll account, don't auto-select - user needs to choose between Buku Tabungan and NPWP

        autoSelectedType = "";

      } else if (
        props.currentTab === "social-security" ||
        props.currentTab === "social_security" ||
        props.currentTab === "insurance" ||
        props.currentTab === "social-security-insurance"
      ) {
        // For Benefit, don't auto-select - user needs to choose between Telkomedika and BPJS
        autoSelectedType = "";
      }

      // Add file to ready list immediately (no upload yet - will upload after submit)

      const tempFile = {
        file: file,
        name: file.name,
        size: file.size,
        documentType: autoSelectedType,
        uploading: false, // Not uploading yet
        uploadProgress: 0,
        error: null,
        itemId: null, // Will be set after successful upload during submit
        ready: true, // File is ready to be uploaded on submit
      };

      uploadedFiles.value.push(tempFile);
    } catch (error) {
      showError(error.message);
    }
  }
};

const updateFileType = (index, type) => {
  uploadedFiles.value[index].documentType = type;
};

const removeFile = (index) => {
  uploadedFiles.value.splice(index, 1);
};

// Upload files to SharePoint after change request is created

const uploadFilesToSharePoint = async (changeRequestId, files) => {



  // Validate changeRequestId immediately

  if (
    !changeRequestId ||
    changeRequestId === "undefined" ||
    changeRequestId === null
  ) {
    // Invalid changeRequestId received

    throw new Error(
      `Invalid change request ID: ${changeRequestId}. Cannot upload files.`
    );
  }

  const uploadResults = [];

  // Process files sequentially to avoid conflicts

  for (let i = 0; i < files.length; i++) {
    const fileData = files[i];

    try {
      // Reset file state before upload

      fileData.uploading = true;

      fileData.error = null;

      fileData.uploadProgress = 0;

      // Get document type code - now fileData.documentType should already be the code (1-7)

      // from the select dropdown populated by master API data

      let documentTypeCode = "7"; // default to 'Other'

      if (fileData.documentType) {
        // fileData.documentType should now be the code directly from select (1, 2, 3, etc.)

        documentTypeCode = fileData.documentType;
      }

      const documentTypes = [documentTypeCode];

      const result = await uploadAttachment(
        changeRequestId,

        fileData.file,

        documentTypes,

        (progress) => {
          fileData.uploadProgress = progress;
        }
      );

      if (result.success) {
        // Extract item_id from response (API returns item_id, not spacebox_item_id)

        const itemId = result.data?.item_id || result.data?.spacebox_item_id;
        fileData.itemId = itemId;
        fileData.uploading = false;
        fileData.uploadProgress = 100;
        uploadResults.push({
          success: true,
          fileName: fileData.name,
          itemId: itemId,
        });
      } else {
        throw new Error(
          result.message || "Upload failed without error message"
        );
      }
    } catch (error) {
      fileData.uploading = false;

      // Handle specific file size error with user-friendly message

      let errorMessage = error.message;

      if (
        error.message.includes("25 MB") ||
        error.message.includes("PAYLOAD_TOO_LARGE") ||
        error.message.includes("413")
      ) {
        errorMessage =
          "File size exceeds 25 MB limit. Please compress or split the file.";
      }

      fileData.error = errorMessage;
      fileData.uploadProgress = 0;
      uploadResults.push({
        success: false,
        fileName: fileData.name,
        error: errorMessage,
      });
    }

    // Larger delay between uploads to prevent server overload, especially for larger files
    if (i < files.length - 1) {
      const delay = fileData.file.size > 1024 * 1024 ? 2000 : 1000; // 2s for files >1MB, 1s otherwise
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return uploadResults;
};

// Helper functions for localStorage simulation

// Pre-upload files before creating change request

const preUploadFiles = async () => {
  if (uploadedFiles.value.length === 0) {
    return { success: true, uploadedFiles: [] };
  }

  const validFiles = [];

  for (let i = 0; i < uploadedFiles.value.length; i++) {
    const fileData = uploadedFiles.value[i];

    // Check if file has document type selected
    if (!fileData.documentType) {
      showError(`Please select document type for file: ${fileData.name}`);
      return { success: false };
    }
    // Validate file

    try {
      validateFile(fileData.file);
      validFiles.push(fileData);
    } catch (error) {
      showError(
        `File validation failed for ${fileData.name}: ${error.message}`
      );
      return { success: false };
    }
  }

  return { success: true, uploadedFiles: validFiles };
};

// Handle submit logic - either emit data or submit API directly
const handleSubmit = async () => {
  if (props.disableSubmit) {
    // Just emit data for parent to handle submission
    emit("submit-data", {
      reason: changeReason.value,
      consent: dataConsent.value,
      note_employee: changeReason.value,
      changes: props.changes,
      data: props.data
    });
    return;
  }

  // Otherwise, use the original API submission
  await submitRequestAPI();
};

// New API-based submit function with pre-upload validation

const submitRequestAPI = async () => {
  // Prevent double submission
  if (isSubmitting.value) {
    return;
  }

  isSubmitting.value = true;

  try {
    if (!changeReason.value.trim()) {
      showError("Please provide a reason for the change");
      isSubmitting.value = false;
      return;
    }

    if (!dataConsent.value) {
      showError("Please agree to the data processing terms");
      isSubmitting.value = false;
      return;
    }

    // Validate required fields based on current tab
    if (props.currentTab === "basic-information") {
      const changes = props.changes || props.data;
      let basicData = null;

      // Extract basic data from changes structure
      if (changes && typeof changes === "object") {
        if (Array.isArray(changes)) {
          basicData = changes[0];
        } else if (changes["basic-information"]) {
          basicData = changes["basic-information"];
        } else if (changes.new) {
          basicData = changes.new;
        } else {
          basicData = changes;
        }
      }

      if (basicData) {
        // Check if KTP is present and valid (only if it exists in the data and has a value)
        const ktpValue = basicData.no_ktp;
        if (ktpValue && ktpValue.trim() !== "") {
          // Check if KTP has valid length
          if (ktpValue.length !== 16) {
            showError("KTP Number must be exactly 16 digits");
            isSubmitting.value = false;
            return;
          }

          // Check if KTP contains only numbers
          if (!/^\d+$/.test(ktpValue)) {
            showError("KTP Number can only contain numbers");
            isSubmitting.value = false;
            return;
          }
        }
      }
    }

    // Validate files before proceeding

    const fileValidation = await preUploadFiles();

    if (!fileValidation.success) {
      isSubmitting.value = false;
      return; // Error already shown in preUploadFiles
    }

    // Continue with the main logic
    // Step 1: First try to create/update change request without files

    const currentTab = props.currentTab || "basic-information"; // Fallback if undefined


    // Determine the operation type based on category/tab
    const insertSupportedTabs = ["emergency-contact", "family", "education"];
    // Categories that only support update operations:
    // social-security, basic-info, employment-info, payroll-account, address, medical-record
    const currentTabName = currentTab || props.requestType || props.currentTab;
    const supportsInsert = insertSupportedTabs.includes(currentTabName);

    // Universal action detection based on tab capabilities
    let operationAction;
    if (supportsInsert && props.action === "insert") {
      operationAction = "insert";
    } else {
      operationAction = "update"; // Default to update for all other cases
    }

    const requestData = {
      currentTab: currentTab,

      changes:
        operationAction === "insert"
          ? Array.isArray(props.data)
            ? props.data
            : [props.data]
          : props.changes,

      note_employee: changeReason.value, // Use 'note_employee' to match backend field name
      note: changeReason.value, // Also include 'note' field as backup
      consent: dataConsent.value,
      submit: props.isDraft ? false : true, // Set to false for drafts, true for final submission
      updated_date: new Date().toISOString(), // Add current timestamp
      files: [], // Don't include files in initial request
      action: operationAction, // Pass action parameter to useChangeRequestSubmit
      requestAction: operationAction, // Category-aware action detection
      requestType: operationAction, // Also pass as requestType for compatibilit
      type: operationAction, // Additional type parameter for compatibility
      forcePost: !props.isDraft && props.existingRequestId, // Use POST for final submission from draft edit
    };


    // For Need Revision status (existingRequestId), ensure we send the correct data structure
    if (props.existingRequestId) {
      // For Need Revision, we need to send the current form data as new_data
      // The backend expects the structure: { new_data: { action: "update", data: {...} } }

      if (!props.changes || Object.keys(props.changes).length === 0) {
        requestData.changes = Array.isArray(props.data)
          ? props.data
          : [props.data];
      } else {
        if (!requestData.changes) {
          requestData.changes = Array.isArray(props.data)
            ? props.data
            : [props.data];
        }
      }
    }

    // For Education update (save as draft), backend expects data array at root rather than nested changes structure
    if (
      (currentTab === "education" || currentTab === "education-information") &&
      operationAction === "update" &&
      props.data
    ) {
      const dataArray = Array.isArray(props.data) ? props.data : [props.data];
      // Ensure client_key exists per record
      const ensureCk = (item) => {
        if (!item) return item;
        if (!item.client_key || String(item.client_key).trim() === "") {
          // generate uuid v4-ish
          const gen = () => {
            if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
              const b = new Uint8Array(16);
              crypto.getRandomValues(b);
              b[6] = (b[6] & 0x0f) | 0x40; // v4
              b[8] = (b[8] & 0x3f) | 0x80; // variant
              const h = Array.from(b, n => n.toString(16).padStart(2, '0')).join('');
              return `${h.substr(0, 8)}-${h.substr(8, 4)}-${h.substr(12, 4)}-${h.substr(16, 4)}-${h.substr(20)}`;
            }
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
              const r = (Math.random() * 16) | 0, v = c === 'x' ? r : (r & 0x3) | 0x8; return v.toString(16);
            });
          };
          item.client_key = gen();
        }
        return item;
      };
      const withCk = dataArray.map(ensureCk);
      requestData.changes = withCk;
      requestData.data = withCk;
    }

    // If we have an existing request ID (for Need Revision status), use PUT method
    if (props.existingRequestId) {
      requestData.id = props.existingRequestId;

      requestData.method = "PUT";
    }


    let result = await submitChangeRequest(requestData);


    // Handle 409 conflict (existing request) by trying PUT method
    // Skip retry for pure insert flows to avoid double submit

    if (!result.success && result.error?.includes("409") && operationAction !== 'insert') {
      // Extract existing change request ID from error response if available

      const existingId =
        result.data?.id_change_req || result.data?.id || result.id;

      if (existingId) {
        // Try to update the existing request
        try {
          const updateData = {
            currentTab: currentTab,
            changes:
              supportsInsert && props.action === "insert"
                ? Array.isArray(props.data)
                  ? props.data
                  : [props.data]
                : props.changes,
            note_employee: changeReason.value, // Use 'note_employee' to match backend field name
            note: changeReason.value, // Also include 'note' field as backup
            consent: dataConsent.value,
            submit: true,
            updated_date: new Date().toISOString(), // Add current timestamp
            id: existingId,
            method: "PUT", // Indicate this is an update
            requestAction: "update", // Always update for existing draft
            requestType: "update",
          };

          result = await submitChangeRequest(updateData);
        } catch (updateError) {
          // If update fails, still try to proceed with existing ID for file upload

          result = {
            success: true,
            id: existingId,
            data: { id_change_req: existingId },
          };
        }
      }
    }

    // Handle case where API returns success but indicates existing draft
    // Skip all auto-continue logic for insert operations to prevent double requests

    if (operationAction !== 'insert' &&
      result.success &&
      result.data?.message?.includes("already have an active")
    ) {
      // Try to extract ID from nested data structure

      const existingId =
        result.data?.data?.existing_request?.id ||
        result.data?.data?.existing_request?.id_change_req ||
        result.data?.data?.existing_request?.change_request_id ||
        result.data?.data?.existing_request?.request_id ||
        result.data?.data?.existing_request?.code ||
        result.data?.data?.id ||
        result.data?.data?.id_change_req ||
        result.data?.data?.change_request_id ||
        result.data?.data?.request_id ||
        result.data?.data?.code;

      if (existingId) {
        // Update result to include the ID

        result.id = existingId;

        // Also check if we need to update the existing draft to submitted status

        if (
          result.data?.data?.action_required?.includes("continue your draft")
        ) {
          try {

            const updateData = {
              currentTab: currentTab, // Use the fallback currentTab variable

              changes:
                supportsInsert && props.action === "insert"
                  ? Array.isArray(props.data)
                    ? props.data
                    : [props.data]
                  : props.changes,

              note_employee: changeReason.value, // Use 'note_employee' to match backend field name

              note: changeReason.value, // Also include 'note' field as backup

              consent: dataConsent.value,

              submit: true,

              updated_date: new Date().toISOString(), // Add current timestamp

              id: existingId,

              method: "PUT",

              requestAction: "update", // Always update for existing draft

              requestType: "update",
            };

            const updateResult = await submitChangeRequest(updateData);
            if (updateResult.success) {
              result = updateResult;
            }
          } catch (updateError) {
            console.error("❌ Draft continuation failed", updateError);
            // Continue with current result if update fails
          }
        }
      }
    }

    // For insert operations, still extract ID if available but skip all auto-continue logic
    if (operationAction === 'insert' &&
      result.success &&
      result.data?.message?.includes("already have an active")
    ) {
      const existingId =
        result.data?.data?.existing_request?.id ||
        result.data?.data?.existing_request?.id_change_req ||
        result.data?.data?.existing_request?.change_request_id ||
        result.data?.data?.existing_request?.request_id ||
        result.data?.data?.existing_request?.code ||
        result.data?.data?.id ||
        result.data?.data?.id_change_req ||
        result.data?.data?.change_request_id ||
        result.data?.data?.request_id ||
        result.data?.data?.code;

      if (existingId) {
        result.id = existingId;
      }
    }

    // Improved success condition - check for various success indicators

    const isSuccess =
      result.success === true ||
      (result.success !== false && result.data && !result.error) ||
      (result.status && result.status >= 200 && result.status < 300);

    if (isSuccess) {
      // Extract change request ID - handle various response structures

      let changeRequestId = null;






      // For update action with existing request ID, use the existing ID

      if (props.action === "update" && props.existingRequestId) {
        changeRequestId = props.existingRequestId;

      }

      // Check if ID is already extracted by the composable (only if not using existing ID)

      if (!changeRequestId && result.id) {
        changeRequestId = result.id;

      }

      // Try multiple possible ID fields - handle nested data structure

      if (!changeRequestId && result.data?.id) {
        changeRequestId = result.data.id;

      } else if (!changeRequestId && result.data?.id_change_req) {
        changeRequestId = result.data.id_change_req;

      } else if (!changeRequestId && result.data?.change_request_id) {
        changeRequestId = result.data.change_request_id;

      } else if (!changeRequestId && result.data?.request_id) {
        changeRequestId = result.data.request_id;

      } else if (!changeRequestId && result.data?.code) {
        changeRequestId = result.data.code;

      } else if (!changeRequestId && result.data?.data?.id) {
        // Handle nested data structure

        changeRequestId = result.data.data.id;

      } else if (!changeRequestId && result.data?.data?.id_change_req) {
        changeRequestId = result.data.data.id_change_req;

      } else if (!changeRequestId && result.data?.data?.change_request_id) {
        changeRequestId = result.data.data.change_request_id;

      } else if (!changeRequestId && result.data?.data?.request_id) {
        changeRequestId = result.data.data.request_id;

      } else if (!changeRequestId && result.data?.data?.code) {
        changeRequestId = result.data.data.code;

      } else if (!changeRequestId && result.data?.existing_request?.id) {
        changeRequestId = result.data.existing_request.id;

      } else if (
        !changeRequestId &&
        result.data?.existing_request?.id_change_req
      ) {
        changeRequestId = result.data.existing_request.id_change_req;

      } else if (
        !changeRequestId &&
        result.data?.existing_request?.change_request_id
      ) {
        changeRequestId = result.data.existing_request.change_request_id;

      } else if (
        !changeRequestId &&
        result.data?.existing_request?.request_id
      ) {
        changeRequestId = result.data.existing_request.request_id;

      } else if (!changeRequestId && result.data?.existing_request?.code) {
        changeRequestId = result.data.existing_request.code;

      }

      // Validate changeRequestId - ensure it's not an invalid string

      if (changeRequestId && typeof changeRequestId === "string") {
        const invalidStrings = [
          "ation",
          "information",
          "validation",
          "creation",
          "submission",
          "action",
        ];

        // Check if ID contains invalid characters, is too short, or is a known invalid string

        if (
          changeRequestId.length < 3 ||
          /[^a-zA-Z0-9-_]/.test(changeRequestId) ||
          invalidStrings.includes(changeRequestId.toLowerCase())
        ) {

          changeRequestId = null;
        }
      }

      // Determine status and status label

      let status = "2"; // Default to Waiting Approval

      let statusLabel = "Waiting Approval";

      // Check various possible status fields

      if (result.data?.status) {
        status = result.data.status;
      } else if (result.status) {
        status = result.status;
      }

      // Check various possible status label fields

      if (result.data?.status_label) {
        statusLabel = result.data.status_label;
      } else if (
        result.data?.message &&
        result.data.message.includes("Waiting Approval")
      ) {
        statusLabel = "Waiting Approval";
      } else if (
        result.data?.message &&
        result.data.message.includes("Draft")
      ) {
        statusLabel = "Draft";
      }



      if (!changeRequestId) {

        // Check if response has fallback ID or success flag

        if (result.fallbackId || result.success) {

          changeRequestId = result.id;

          // Show warning if fallback ID is used

          if (result.fallbackId && result.warning) {

            // You can show a toast warning here if needed

            // toast.warning(result.warning);
          }
        } else {
          // 🔍 [ID-EXTRACTION] FAILED - Complete result structure:
          // JSON.stringify(result, null, 2)

          showError(
            "Change request created but no ID received. Please check console for details."
          );

          return;
        }
      }

      // Step 2: Upload files to the created/existing change request

      if (uploadedFiles.value.length > 0) {
        // Final validation before upload

        if (
          !changeRequestId ||
          changeRequestId === "undefined" ||
          changeRequestId === null
        ) {
          // 🔍 [FILE-UPLOAD] CRITICAL: changeRequestId is invalid before upload:
          // changeRequestId

          showError(
            "Cannot upload files: Change request ID is invalid. Please try again."
          );

          return;
        }



        try {
          const uploadResults = await uploadFilesToSharePoint(
            changeRequestId,
            uploadedFiles.value
          );

          // Check upload results

          const failedUploads = uploadResults.filter((r) => !r.success);

          const successfulUploads = uploadResults.filter((r) => r.success);

          if (failedUploads.length > 0) {
            const failedNames = failedUploads.map((f) => f.fileName).join(", ");

            if (successfulUploads.length > 0) {
              showError(
                `Change request submitted. Some files failed to upload: ${failedNames}`
              );
            } else {
              showError(
                `Change request submitted but all files failed to upload: ${failedNames}`
              );
            }
          } else {
            // Success message will be handled by parent component

          }
        } catch (uploadError) {
          // Handle specific file size error

          if (
            uploadError.message.includes("25 MB") ||
            uploadError.message.includes("PAYLOAD_TOO_LARGE") ||
            uploadError.message.includes("413")
          ) {
            showError(
              `File upload failed: File size exceeds 25 MB limit. Please compress or split your files before uploading.`
            );
          } else {
            showError(
              `Change request submitted but file upload failed: ${uploadError.message}`
            );
          }
        }
      } else {
        // Success message will be handled by parent component

      }

      // Step 3: Upload professional photo if provided (for basic-information tab)

      if (props.professionalPhotoFile && props.currentTab === 'basic-information') {
        try {
          const photoUploadResult = await uploadAttachment(
            changeRequestId,
            props.professionalPhotoFile,
            ['1'] // Professional Photo document type code
          );

          if (!photoUploadResult.success) {
            showError(`Professional photo upload failed: ${photoUploadResult.message || 'Unknown error'}`);
          } else {
          }
        } catch (photoError) {
          console.error('❌ Professional photo upload error:', photoError);
          showError(`Professional photo upload failed: ${photoError.message}`);
        }
      } else {
      }

      // Clear form and close modal

      changeReason.value = "";

      dataConsent.value = false;

      uploadedFiles.value = [];

      // Dispatch event to notify parent components that data has been updated

      window.dispatchEvent(
        new CustomEvent("changeRequestSubmitted", {
          detail: {
            success: true,

            id: changeRequestId,

            data: result.data,

            status: status,

            status_label: statusLabel,

            tab: props.currentTab,

            submitted: true,

            updated: true,

            // FIXED: Include education data with client keys for modal submission
            educationData: props.data,
          },
        })
      );

      emit("submit", {
        success: true,

        id: changeRequestId,

        data: result.data,

        reason: changeReason.value,

        consent: dataConsent.value,
      });

      // Close modal first

      closeModal();

      // Small delay to ensure event is processed

      setTimeout(() => {
        // Force reset all forms

        if (process.client) {
          // Clear any stored form data

          localStorage.removeItem("familyInsertForms");

          localStorage.removeItem("emergencyContactInsertForms");

          // Dispatch additional reset event

          window.dispatchEvent(
            new CustomEvent("formReset", {
              detail: {
                success: true,
                tab: props.currentTab,
              },
            })
          );
        }
      }, 100);

      // Store success message and navigate

      const successMessage = {
        title: "Change Request Submitted",
        message: "Change request submitted successfully",
        type: "success",
      };

      // Show success message
      success(successMessage.message, {
        title: successMessage.title
      });

      // Emit success event to parent
      emit("success", {
        reason: changeReason.value,
        consent: dataConsent.value
      });

      // Redirect only when requested by the caller (e.g., from history edit page)
      try {
        if (props.redirectOnSuccess) {
          await navigateTo('/update-data/history');
        }
      } catch (e) {
        // ignore navigation errors
      }
    } else {
      throw new Error(
        result.message || result.error || "Failed to create change request"
      );
    }
  } catch (error) {
    // Enhanced validation error toast (400/422)
    try {
      const status = error?.status;
      const data = error?.data;
      if (status === 400 || status === 422) {
        // Try to extract detailed validation messages
        const errorsObj = data?.data?.errors || data?.errors;
        if (errorsObj && typeof errorsObj === "object") {
          const parts = [];
          Object.keys(errorsObj).forEach((field) => {
            const val = errorsObj[field];
            if (Array.isArray(val)) {
              val.forEach((msg) => parts.push(`${field}: ${msg}`));
            } else if (typeof val === "string") {
              parts.push(`${field}: ${val}`);
            } else if (val && typeof val === "object") {
              // Nested errors
              Object.keys(val).forEach((k) => {
                const nested = val[k];
                if (Array.isArray(nested))
                  nested.forEach((m) => parts.push(`${field}.${k}: ${m}`));
                else if (typeof nested === "string")
                  parts.push(`${field}.${k}: ${nested}`);
              });
            }
          });
          const header = data?.message || "Validation failed";
          const message = parts.length > 0
            ? `${header}\n${parts.map(p => `• ${p}`).join("\n")}`
            : header;
          showError(message);
          return;
        }
        // Fallback to top-level message
        showError(data?.message || error.message || "Validation failed");
        return;
      }
    } catch (_) {
      // ignore and show generic error below
    }
    showError(error.message || "Failed to submit change request");
  } finally {
    // Always reset submission flag
    isSubmitting.value = false;
  }
};

// Reset form when modal opens

watch(
  () => props.isOpen,

  async (newValue) => {
    if (newValue) {
      // Load existing note_employee if available (for edit draft/revision)
      changeReason.value = props.note || "";

      dataConsent.value = false;

      uploadedFiles.value = [];

      showConsentDetail.value = false;
      showConsentModal.value = false;

      // Prevent body scroll when modal is open

      document.body.style.overflow = "hidden";

      // Fetch document types and consent data in parallel when modal opens

      try {
        // Load document types and consents in parallel to improve performance
        const [docTypesResult, consentsResult] = await Promise.allSettled([
          fetchDocumentTypes(),
          fetchActiveConsents()
        ]);

        if (docTypesResult.status === 'rejected') {
          console.warn("Failed to load document types:", docTypesResult.reason);
        }

        if (consentsResult.status === 'rejected') {
          console.warn("Failed to load active consents:", consentsResult.reason);
        }

        // Load consent status if we have a consent ID
        const id = latestConsent.value?.id_consent;
        if (id) {
          try {
            await fetchConsentStatus(id);
            if (isConsentApproved.value) {
              dataConsent.value = true;
            }
          } catch (statusError) {
            console.warn("Failed to load consent status:", statusError);
            // Default to requiring consent if status check fails
            dataConsent.value = false;
          }
        } else {
          // No consent ID available, default to requiring consent
          dataConsent.value = false;
        }
      } catch (error) {
        console.warn("Failed to load some modal data:", error);
        // Don't show error toast, as fallback data is provided
        // Ensure consent is required by default if loading fails
        dataConsent.value = false;
      }
    } else {
      // Restore body scroll when modal is closed

      document.body.style.overflow = "auto";
    }
  }
);

// Cleanup when component is unmounted

onUnmounted(() => {
  document.body.style.overflow = "auto";
});
</script>

<!-- Consent details modal removed (full content shown inline) -->

<style scoped>
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(100%);
  }
}

/* Ensure consent content is never clipped */
:deep(.consent-rich.ql-editor) {
  max-height: none !important;
  overflow: visible !important;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

/* Limit consent area height to fit modal content and enable scrolling */
.consent-content-scroll {
  max-height: 40vh;
  overflow-y: auto;
}

/* Enhanced skeleton loading styles for consent section */
.consent-skeleton {
  animation: pulse 1.5s ease-in-out infinite;
}

.consent-skeleton .space-y-3 > * {
  animation-delay: calc(var(--index) * 0.1s);
}

/* Staggered animation for skeleton lines */
.consent-skeleton .space-y-3 > *:nth-child(1) { animation-delay: 0s; }
.consent-skeleton .space-y-3 > *:nth-child(2) { animation-delay: 0.1s; }
.consent-skeleton .space-y-3 > *:nth-child(3) { animation-delay: 0.2s; }
.consent-skeleton .space-y-3 > *:nth-child(4) { animation-delay: 0.3s; }
.consent-skeleton .space-y-3 > *:nth-child(5) { animation-delay: 0.4s; }
.consent-skeleton .space-y-3 > *:nth-child(6) { animation-delay: 0.5s; }
.consent-skeleton .space-y-3 > *:nth-child(7) { animation-delay: 0.6s; }
</style>
