<template>
  <div class="mt-6 bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700 p-4 md:p-6">
    <h4 class="text-lg font-semibold text-text-main mb-4 flex items-center">
      <i class="pi pi-file-upload text-primary"></i>
      {{ title || 'Document Upload' }}
      <span class="text-red-500">*</span>
    </h4>

    <p v-if="description" class="text-sm text-text-secondary mb-4" v-html="description"></p>

    <!-- File Upload Area -->
    <div v-if="canAttachFiles">
      <div
        class="relative border-2 border-dashed border-grey-300 dark:border-grey-600 rounded-md p-6 text-center hover:border-primary transition-colors"
        :class="{ 
          'border-primary bg-primary/5': isDragOver && !isUploadDisabled,
          'pointer-events-none': isUploadDisabled,
          'opacity-50 cursor-not-allowed': isUploadDisabled && !isUploading,
          'cursor-pointer': !isUploadDisabled
        }"
        @click="!isUploadDisabled && triggerFileUpload()"
        @dragover.prevent="!isUploadDisabled && handleDragOver"
        @dragleave.prevent="!isUploadDisabled && handleDragLeave"
        @drop.prevent="!isUploadDisabled && handleFileDrop"
      >
        <input
          ref="fileInput"
          type="file"
          :multiple="allowMultiple"
          :accept="accept"
          class="hidden"
          @change="handleFileChange"
        />

        <!-- Loading Overlay -->
        <div v-if="isUploading" class="absolute inset-0 bg-white/80 dark:bg-grey-800/80 rounded-md flex items-center justify-center z-10">
          <div class="text-center">
            <div class="mx-auto w-12 h-12 mb-3">
              <div class="animate-spin rounded-full h-12 w-12 border-4 border-grey-300 border-t-primary"></div>
            </div>
            <p class="text-sm font-medium text-text-main">Uploading files...</p>
            <p class="text-xs text-text-secondary mt-1">Please wait while we process your files</p>
          </div>
        </div>

        <div class="space-y-3" :class="{ 'opacity-50': isUploading }">
          <div class="mx-auto w-12 h-12 bg-grey-100 dark:bg-grey-700 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 37 37" fill="none">
              <g clip-path="url(#clip0_40000627_18326)">
                <path
                  d="M29.525 15.56C28.505 10.385 23.96 6.5 18.5 6.5C14.165 6.5 10.4 8.96 8.525 12.56C4.01 13.04 0.5 16.865 0.5 21.5C0.5 26.465 4.535 30.5 9.5 30.5H29C33.14 30.5 36.5 27.14 36.5 23C36.5 19.04 33.425 15.83 29.525 15.56ZM29 27.5H9.5C6.185 27.5 3.5 24.815 3.5 21.5C3.5 18.425 5.795 15.86 8.84 15.545L10.445 15.38L11.195 13.955C12.62 11.21 15.41 9.5 18.5 9.5C22.43 9.5 25.82 12.29 26.585 16.145L27.035 18.395L29.33 18.56C31.67 18.71 33.5 20.675 33.5 23C33.5 25.475 31.475 27.5 29 27.5ZM12.5 20H16.325V24.5H20.675V20H24.5L18.5 14L12.5 20Z"
                  fill="#004AAD" />
              </g>
              <defs>
                <clipPath id="clip0_40000627_18326">
                  <rect width="36" height="36" fill="white" transform="translate(0.5 0.5)" />
                </clipPath>
              </defs>
            </svg>
          </div>

          <div>
            <p v-if="!isUploadDisabled" class="text-sm font-medium text-text-main">
              Drag your file(s) or browse
            </p>
            <p v-else-if="category === 'basic-information'" class="text-sm font-medium text-red-600">
              Cannot upload more documents - KTP document already exists
            </p>
            <p v-else-if="category === 'address'" class="text-sm font-medium text-red-600">
              Cannot upload more documents - KTP document already exists
            </p>
            <p v-else-if="category === 'family'" class="text-sm font-medium text-red-600">
              Cannot upload more documents - Family Card (KK) document already exists
            </p>
            <p v-else-if="category === 'payroll-account'" class="text-sm font-medium text-red-600">
              Cannot upload more documents - NPWP and Saving Book documents already uploaded ({{ existingDocumentCount }}/{{ requiredDocumentCount }})
            </p>
            <p v-else-if="category === 'social-security'" class="text-sm font-medium text-red-600">
              Cannot upload more documents - BPJS and Telkomedika documents already uploaded ({{ existingDocumentCount }}/{{ requiredDocumentCount }})
            </p>
            <p v-else class="text-sm font-medium text-red-600">
              Cannot upload more documents - Maximum required documents reached ({{ existingDocumentCount }}/{{ requiredDocumentCount }})
            </p>
            <p class="text-xs text-text-secondary mt-1">
              {{ hint || `Max ${maxSizeMB} MB per file • ${acceptDescription}` }}
            </p>
          </div>
        </div>
      </div>

      <p class="text-xs text-text-secondary mt-2">
        {{ footerHint || `Only support ${acceptDescription}` }}
      </p>

      <!-- Uploaded Files List -->
      <div v-if="uploadedFiles.length > 0" class="mt-4">
        <h5 class="text-sm font-medium text-text-main mb-3">
          {{ listTitle || 'Uploaded Files:' }}
        </h5>

        <div class="space-y-3 max-h-32 overflow-y-auto">
          <div v-for="(file, index) in uploadedFiles" :key="index"
            class="flex items-center justify-between p-3 bg-grey-50 dark:bg-grey-700 rounded border"
            :class="{
              'border-red-300': file.error,
              'border-secondary-300': file.uploading,
            }"
          >
            <div class="flex items-center space-x-3 flex-1">
              <div class="flex-shrink-0">
                <i v-if="file.uploading" class="pi pi-spinner pi-spin text-secondary-500 text-sm"></i>
                <i v-else-if="file.error" class="pi pi-exclamation-triangle text-red-500 text-sm"></i>
                <component v-else :is="getFileIcon(file.name)" />
              </div>

              <div class="flex-1 min-w-0">
                <p class="text-sm text-text-main truncate" :title="file.name">
                  {{ truncateFileName(file.name) }}
                </p>

                <div class="flex items-center space-x-2 text-xs text-text-secondary">
                  <span>{{ formatFileSize(file.size) }}</span>

                  <span v-if="file.documentType === ktpType" class="text-blue-600 font-medium">
                    • {{ ktpLabel }}
                  </span>

                  <span v-else-if="file.documentType === photoType" class="text-blue-600 font-medium">
                    • {{ photoLabel }}
                  </span>

                  <span v-else-if="file.uploading" class="text-secondary-600 font-medium">
                    • Uploading {{ file.uploadProgress || 0 }}%
                  </span>

                  <span v-else-if="file.error" class="text-red-600 font-medium">
                    • Error: {{ file.error }}
                  </span>

                  <span v-else-if="file.uploadProgress === 100" class="text-green-600 font-medium">
                    • Ready
                  </span>

                  <span v-else class="text-grey-500">
                    • Pending
                  </span>
                </div>
              </div>
            </div>

            <div class="flex items-center space-x-2 ml-3">
              <template v-if="showTypeSelector || lockType">
                <select
                  v-model="file.documentType"
                  :disabled="file.uploading || lockType"
                  class="px-2 py-1 text-xs border border-grey-300 dark:border-grey-600 rounded bg-white dark:bg-grey-700 text-text-main focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  @change="updateFileType(index, $event.target.value)"
                >
                  <option value="">Select Type</option>
                  <template v-if="documentTypeOptions && documentTypeOptions.length">
                    <!-- Show all available types (includes current selection + unselected types) -->
                    <option v-for="opt in getAvailableDocumentTypes(index)" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                  </template>
                  <template v-else>
                    <option :value="ktpType">{{ ktpLabel }}</option>
                    <option v-if="!lockType" :value="photoType">{{ photoLabel }}</option>
                  </template>
                  <!-- Debug info in console -->
                  <option v-if="false" disabled>DEBUG: {{ JSON.stringify({fileType: file.documentType, optionsCount: documentTypeOptions?.length, lockType, lockTypeValue}) }}</option>
                </select>
              </template>

              <button
                @click="removeFile(index)"
                :disabled="file.uploading"
                class="text-red-500 hover:text-red-700 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Remove file"
              >
                <i class="pi pi-trash text-sm"></i>
              </button>
            </div>
          </div>
        </div>

        <div v-if="hasFilesWithoutType" class="mt-2">
          <p class="text-xs text-red-500">
            {{ missingTypeMessage || 'Please select document type for all uploaded files' }}
          </p>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-6 text-grey-500 dark:text-grey-400">
      <i class="pi pi-lock text-2xl mb-2 block"></i>
      <p class="text-sm">{{ noPermissionTitle || `You don't have permission to upload attachments` }}</p>
      <p class="text-xs text-grey-400">{{ noPermissionSubtitle || 'Contact your administrator for access' }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, h } from 'vue';
import { useAttachments } from "~/composables/useAttachments";
import { useToast } from "~/composables/useToast";
import { useRBAC } from "~/composables/useRBAC";
import { formatFileSize, truncateFileName } from "~/composables/useTextFormatting.js";

const props = defineProps({
  editMode: { type: Boolean, default: true },
  allowMultiple: { type: Boolean, default: true },
  maxSize: { type: Number, default: 25 * 1024 * 1024 },
  accept: { type: String, default: '.jpg,.jpeg,.png,.pdf' },
  title: { type: String, default: 'Document Upload' },
  description: { type: String, default: '' },
  listTitle: { type: String, default: 'Uploaded Files:' },
  showTypeSelector: { type: Boolean, default: true },
  lockType: { type: Boolean, default: false },
  lockTypeValue: { type: String, default: '' },
  documentTypeOptions: { type: Array, default: () => [] }, // [{ value: '3', label: 'KTP' }]
  ktpType: { type: String, default: '3' },
  ktpLabel: { type: String, default: 'KTP Document' },
  photoType: { type: String, default: '1' },
  photoLabel: { type: String, default: 'Professional Photo' },
  maxFiles: { type: Number, default: 2 },
  hint: { type: String, default: '' },
  footerHint: { type: String, default: '' },
  missingTypeMessage: { type: String, default: '' },
  // New props for document validation
  existingDocumentCount: { type: Number, default: 0 },
  category: { type: String, default: '' },
  requiredDocumentCount: { type: Number, default: 1 },
  existingDocuments: { type: Array, default: () => [] }, // Array of existing documents with document_type
});

const emit = defineEmits(['filesChanged']);

const { validateFile } = useAttachments();
const { error: showError } = useToast();
const { canAttachFiles } = useRBAC();

const uploadedFiles = ref([]);
const isDragOver = ref(false);
const isUploading = ref(false);
const fileInput = ref(null);

const maxSizeMB = computed(() => Math.round(props.maxSize / (1024 * 1024)));
const acceptDescription = computed(() => props.accept.split(',').join(', ').replaceAll('.', '.'));

// Computed property to get available document types for each file (filtering already selected types)
const getAvailableDocumentTypes = (currentFileIndex) => {
  if (!props.documentTypeOptions || props.documentTypeOptions.length === 0) {
    return [];
  }

  const currentFile = uploadedFiles.value[currentFileIndex];
  const currentFileType = currentFile?.documentType;

  // Get all selected document types from OTHER uploaded files (not current file)
  const selectedTypesByOtherFiles = uploadedFiles.value
    .map((file, index) => index !== currentFileIndex ? file.documentType : null)
    .filter(type => type !== null && type !== '');

  // Get doc types from existing documents (already saved)
  const existingDocTypes = (props.existingDocuments || [])
    .map(doc => String(doc.document_type || doc.documentType))
    .filter(type => type);

  // Combine all taken doc types
  const allTakenTypes = [...selectedTypesByOtherFiles, ...existingDocTypes];

  // Filter: show options that are either:
  // 1. Not selected by any other file or existing document
  // 2. OR is the current file's selected type (so user can keep their selection)
  return props.documentTypeOptions.filter(opt =>
    !allTakenTypes.includes(opt.value) || opt.value === currentFileType
  );
};

const hasFilesWithoutType = computed(() => {
  const shouldShow = props.showTypeSelector || props.lockType;

  // If type selector is disabled, never show warning about missing types
  if (!shouldShow) return false;

  // For locked types, files should auto-select so no warning needed
  if (props.lockType) return false;

  // For non-locked types with type selector, check if any files missing type
  return uploadedFiles.value.some((file) => !file.documentType);
});

// Computed property to check if upload is allowed based on existing documents
const canUploadMore = computed(() => {
  // For single document categories (only need 1 document)
  if (['basic-information', 'address', 'family'].includes(props.category)) {
    return props.existingDocumentCount === 0;
  }

  // For payroll-account and social-security: check doc types instead of count
  if (['payroll-account', 'social-security'].includes(props.category)) {
    // Get doc types from existing documents
    const existingDocTypes = (props.existingDocuments || []).map(doc => String(doc.document_type || doc.documentType));

    // Get doc types from uploaded files (not yet saved)
    const uploadedDocTypes = uploadedFiles.value.map(file => String(file.documentType)).filter(type => type);

    // Combine both
    const allDocTypes = [...new Set([...existingDocTypes, ...uploadedDocTypes])];

    // Check if all required doc types are present
    // For payroll-account: need both '4' (NPWP) and '7' (Buku Tabungan)
    // For social-security: need both '5' (BPJS) and '6' (Telkomedika)
    const requiredDocTypes = props.category === 'payroll-account' ? ['4', '7'] : ['5', '6'];
    const hasAllRequiredTypes = requiredDocTypes.every(type => allDocTypes.includes(type));

    // Allow upload if not all required types are present
    return !hasAllRequiredTypes;
  }

  // For other multiple document categories
  // Allow upload if existing documents < required count
  return props.existingDocumentCount < props.requiredDocumentCount;
});

// Computed property for upload disabled state
const isUploadDisabled = computed(() => {
  return !canUploadMore.value || isUploading.value;
});

// File icon components (same style as DocumentItem.vue)
const ImageIcon = () => h('div', {
  class: 'w-8 h-8 flex items-center justify-center'
}, [
  h('svg', { width: '14', height: '19', viewBox: '0 0 14 19', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' }, [
    h('g', { 'clip-path': 'url(#clip0_594_26920)' }, [
      h('g', { 'clip-path': 'url(#clip1_594_26920)' }, [
        h('path', { d: 'M2.25 0.25C1.00898 0.25 0 1.25898 0 2.5V16C0 17.241 1.00898 18.25 2.25 18.25H11.25C12.491 18.25 13.5 17.241 13.5 16V5.875H9C8.37773 5.875 7.875 5.37227 7.875 4.75V0.25H2.25ZM9 0.25V4.75H13.5L9 0.25ZM2.25 9.25C2.25 8.95163 2.36853 8.66548 2.5795 8.4545C2.79048 8.24353 3.07663 8.125 3.375 8.125C3.67337 8.125 3.95952 8.24353 4.1705 8.4545C4.38147 8.66548 4.5 8.95163 4.5 9.25C4.5 9.54837 4.38147 9.83452 4.1705 10.0455C3.95952 10.2565 3.67337 10.375 3.375 10.375C3.07663 10.375 2.79048 10.2565 2.5795 10.0455C2.36853 9.83452 2.25 9.54837 2.25 9.25ZM7.59375 10.375C7.78008 10.375 7.95234 10.4664 8.05781 10.6176L11.1516 15.1176C11.2711 15.2898 11.2816 15.5148 11.1867 15.6977C11.0918 15.8805 10.8984 16 10.6875 16H7.59375H6.1875H4.5H2.8125C2.60859 16 2.42227 15.891 2.32383 15.7152C2.22539 15.5395 2.22539 15.3215 2.33086 15.1492L4.01836 12.3367C4.12031 12.168 4.30312 12.0625 4.5 12.0625C4.69688 12.0625 4.87969 12.1645 4.98164 12.3367L5.43164 13.0891L7.12969 10.6211C7.23516 10.4699 7.40742 10.3785 7.59375 10.3785V10.375Z', fill: '#3B82F6' })
      ])
    ]),
    h('defs', {}, [
      h('clipPath', { id: 'clip0_594_26920' }, [ h('rect', { width: '13.5', height: '18', fill: 'white', transform: 'translate(0 0.25)' }) ]),
      h('clipPath', { id: 'clip1_594_26920' }, [ h('path', { d: 'M0 0.25H13.5V18.25H0V0.25Z', fill: 'white' }) ])
    ])
  ])
]);

const PdfIcon = () => h('div', { class: 'w-8 h-8 flex items-center justify-center' }, [
  h('svg', { width: '18', height: '18', viewBox: '0 0 18 18', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' }, [
    h('g', { 'clip-path': 'url(#clip0_40001075_26890)' }, [
      h('g', { 'clip-path': 'url(#clip1_40001075_26890)' }, [
        h('path', { d: 'M0 2.25C0 1.00898 1.00898 0 2.25 0H7.875V4.5C7.875 5.12227 8.37773 5.625 9 5.625H13.5V10.6875H6.1875C4.94648 10.6875 3.9375 11.6965 3.9375 12.9375V18H2.25C1.00898 18 0 16.991 0 15.75V2.25ZM13.5 4.5H9V0L13.5 4.5ZM6.1875 12.375H7.3125C8.39883 12.375 9.28125 13.2574 9.28125 14.3438C9.28125 15.4301 8.39883 16.3125 7.3125 16.3125H6.75V17.4375C6.75 17.7469 6.49687 18 6.1875 18C5.87813 18 5.625 17.7469 5.625 17.4375V15.75V12.9375C5.625 12.6281 5.87813 12.375 6.1875 12.375ZM7.3125 15.1875C7.78008 15.1875 8.15625 14.8113 8.15625 14.3438C8.15625 13.8762 7.78008 13.5 7.3125 13.5H6.75V15.1875H7.3125ZM10.6875 12.375H11.8125C12.7441 12.375 13.5 13.1309 13.5 14.0625V16.3125C13.5 17.2441 12.7441 18 11.8125 18H10.6875C10.3781 18 10.125 17.7469 10.125 17.4375V12.9375C10.125 12.6281 10.3781 12.375 10.6875 12.375ZM11.8125 16.875C12.1219 16.875 12.375 16.6219 12.375 16.3125V14.0625C12.375 13.7531 12.1219 13.5 11.8125 13.5H11.25V16.875H11.8125ZM14.625 12.9375C14.625 12.6281 14.8781 12.375 15.1875 12.375H16.875C17.1844 12.375 17.4375 12.6281 17.4375 12.9375C17.4375 13.2469 17.1844 13.5 16.875 13.5H15.75V14.625H16.875C17.1844 14.625 17.4375 14.8781 17.4375 15.1875C17.4375 15.4969 17.1844 15.75 16.875 15.75H15.75V17.4375C15.75 17.7469 15.4969 18 15.1875 18C14.8781 18 14.625 17.7469 14.625 17.4375V15.1875V12.9375Z', fill: '#EF4444' })
      ])
    ])
  ])
]);

const DocumentIcon = () => h('div', { class: 'w-8 h-8 bg-gray-500 rounded flex items-center justify-center' }, [
  h('svg', { class: 'w-5 h-5 text-white', fill: 'currentColor', viewBox: '0 0 20 20' }, [
    h('path', { 'fill-rule': 'evenodd', d: 'M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z', 'clip-rule': 'evenodd' })
  ])
]);

const ExcelIcon = () => h('div', { class: 'w-8 h-8 bg-green-500 rounded flex items-center justify-center' }, [
  h('svg', { class: 'w-5 h-5 text-white', fill: 'currentColor', viewBox: '0 0 20 20' }, [
    h('path', { 'fill-rule': 'evenodd', d: 'M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z', 'clip-rule': 'evenodd' })
  ])
]);

const ArchiveIcon = () => h('div', { class: 'w-8 h-8 bg-yellow-500 rounded flex items-center justify-center' }, [
  h('svg', { class: 'w-5 h-5 text-white', fill: 'currentColor', viewBox: '0 0 20 20' }, [
    h('path', { d: 'M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4V5h12v10z' }),
    h('path', { d: 'M6 7h8v2H6V7zm0 4h8v2H6v-2z' })
  ])
]);

const getFileIcon = (filename) => {
  if (!filename) return DocumentIcon;
  const extension = filename.toLowerCase().split('.').pop();
  switch (extension) {
    case 'pdf':
      return PdfIcon;
    case 'jpg':
    case 'jpeg':
    case 'png':
      return ImageIcon;
    default:
      return DocumentIcon;
  }
};

const triggerFileUpload = () => {
  fileInput.value?.click();
};

const handleFileChange = (event) => {
  const files = Array.from(event.target.files || []);
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
  const files = Array.from(event.dataTransfer.files || []);
  addFiles(files);
};

const addFiles = async (files) => {
  if (files.length === 0) return;
  
  // Check if upload is allowed based on existing documents
  if (!canUploadMore.value) {
    if (props.category === 'basic-information') {
      showError('Cannot upload more documents. Required document already exists in Document Section.');
    } else {
      showError(`Cannot upload more documents. Maximum required documents (${props.requiredDocumentCount}) already reached.`);
    }
    return;
  }
  
  isUploading.value = true;
  
  try {
    for (const file of files) {
      try {
        if (!props.allowMultiple && uploadedFiles.value.length >= 1) {
          showError('Only one file is allowed.');
          break;
        }

        if (uploadedFiles.value.length >= props.maxFiles) {
          showError(`Maximum ${props.maxFiles} documents allowed.`);
          break;
        }

        if (file.size > props.maxSize) {
          const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
          showError(`File "${file.name}" is too large (${fileSizeMB} MB). Maximum allowed size is ${maxSizeMB.value} MB.`);
          continue;
        }

        validateFile(file);

        const isDuplicate = uploadedFiles.value.some(
          (existingFile) => existingFile.name === file.name && existingFile.size === file.size
        );
        if (isDuplicate) {
          showError(`File "${file.name}" is already added.`);
          continue;
        }

        let autoSelectedType = "";
        const resolvedKtp = props.lockTypeValue || props.ktpType;
        const hasKTP = uploadedFiles.value.some(f => String(f.documentType) === String(resolvedKtp));

        // For locked types, always set the locked type value
        if (props.lockType) {
          autoSelectedType = resolvedKtp;
        } else if (props.showTypeSelector && props.documentTypeOptions && props.documentTypeOptions.length > 0) {
          // For type selector with custom options (like payroll-account), don't auto-select
          // Let user choose from available options
          autoSelectedType = "";
        } else if (props.showTypeSelector && !hasKTP) {
          // For default type selector (no custom options), auto-select KTP if not exists yet
          autoSelectedType = resolvedKtp;
        }


        const tempFile = {
          file,
          name: file.name,
          size: file.size,
          documentType: autoSelectedType,
          uploading: false,
          uploadProgress: 0,
          error: null,
          ready: true,
        };

        uploadedFiles.value.push(tempFile);
        emit('filesChanged', uploadedFiles.value);
      } catch (error) {
        showError(error.message || 'Upload failed');
      }
    }
  } finally {
    // Simulate processing time for better UX
    setTimeout(() => {
      isUploading.value = false;
    }, 1000);
  }
};

const updateFileType = (index, type) => {
  // Check if this type is already selected by another file
  const isTypeAlreadyUsed = uploadedFiles.value.some(
    (file, fileIndex) => fileIndex !== index && file.documentType === type
  );

  if (isTypeAlreadyUsed) {
    showError('This document type is already selected for another file. Please choose a different type.');
    // Reset to empty if trying to select a duplicate type
    uploadedFiles.value[index].documentType = '';
    return;
  }

  uploadedFiles.value[index].documentType = type;
  emit('filesChanged', uploadedFiles.value);
};

const removeFile = (index) => {
  uploadedFiles.value.splice(index, 1);
  emit('filesChanged', uploadedFiles.value);
};

watch(() => props.editMode, (newValue) => {
  if (!newValue) {
    uploadedFiles.value = [];
    emit('filesChanged', []);
  }
});

// Watch for prop changes
watch([() => props.showTypeSelector, () => props.lockType, () => props.documentTypeOptions], () => {
  // Prop changes handled automatically
}, { immediate: true });
</script>


