<template>
  <div class="space-y-2">
    <label
      :for="id"
      class="block text-xs md:text-sm font-medium text-grey-700 dark:text-grey-300"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <!-- Document Display (View Mode) -->
    <div v-if="readonly && modelValue" class="flex items-center gap-3 p-3 bg-grey-50 dark:bg-grey-800 rounded-md border border-grey-200 dark:border-grey-700">
      <div class="flex-shrink-0">
        <i class="pi pi-file-pdf text-red-500 text-xl"></i>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-grey-900 dark:text-grey-100 truncate">
          {{ getFileName(modelValue) }}
        </p>
        <p class="text-xs text-grey-500 dark:text-grey-400">
          {{ getFileSize(modelValue) }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="downloadDocument"
          class="p-1.5 text-grey-500 hover:text-primary hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md transition-colors"
          title="Download"
        >
          <i class="pi pi-download text-sm"></i>
        </button>
        <button
          type="button"
          @click="openPreviewModal"
          class="p-1.5 text-grey-500 hover:text-primary hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md transition-colors"
          title="View"
        >
          <i class="pi pi-eye text-sm"></i>
        </button>
      </div>
    </div>

    <!-- File Input (Edit Mode) -->
    <div v-else-if="!readonly" class="space-y-2">
      <div class="relative">
        <input
          ref="fileInput"
          :id="id"
          type="file"
          :accept="accept"
          @change="handleFileChange"
          class="hidden"
          :disabled="disabled"
        />

        <!-- Custom file input display -->
        <div class="flex items-center gap-2">
          <!-- File input button -->
          <button
            type="button"
            @click="openFileDialog"
            class="px-4 py-2 border border-grey-300 dark:border-grey-600 rounded-l-md bg-white dark:bg-grey-800 text-grey-700 dark:text-grey-300 hover:bg-grey-50 dark:hover:bg-grey-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="disabled"
          >
            <i class="pi pi-upload mr-2"></i>
            Browse
          </button>

          <!-- File name display -->
          <div
            class="flex-1 px-3 py-2 border border-grey-300 dark:border-grey-600 rounded-r-md bg-white dark:bg-grey-800 text-grey-900 dark:text-grey-100 text-sm min-h-[2.5rem] flex items-center min-w-0"
          >
            <span v-if="!modelValue" class="text-grey-500">Choose file...</span>
            <span v-else class="truncate max-w-full">{{ getFileName(modelValue) }}</span>
          </div>

          <!-- Clear button -->
          <button
            v-if="modelValue"
            type="button"
            @click="clearFile"
            class="p-2 text-grey-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            title="Clear file"
          >
            <i class="pi pi-times text-sm"></i>
          </button>
        </div>
      </div>

      <!-- File info -->
      <div v-if="modelValue && selectedFile" class="flex items-center gap-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
        <i class="pi pi-info-circle text-blue-500"></i>
        <div class="flex-1 text-xs text-blue-700 dark:text-blue-300">
          <p class="font-medium">{{ selectedFile.name }}</p>
          <p>{{ formatFileSize(selectedFile.size) }} • {{ getFileType(selectedFile.name) }}</p>
        </div>
      </div>

      <!-- File requirements hint -->
      <div class="text-xs text-grey-500 dark:text-grey-400">
        <p>{{ fileHint || `Accepted formats: ${accept || 'All files'}` }}</p>
        <p v-if="maxFileSize">Maximum size: {{ formatFileSize(maxFileSize) }}</p>
      </div>
    </div>

    <!-- No document message (View Mode) -->
    <div v-else-if="readonly && !modelValue" class="p-3 bg-grey-50 dark:bg-grey-800 rounded-md border border-grey-200 dark:border-grey-700">
      <p class="text-sm text-grey-500 dark:text-grey-400 text-center">
        No document uploaded
      </p>
    </div>

    <!-- Document Preview Modal -->
    <DocumentPreviewModal
      :is-open="showPreviewModal"
      :document-url="modelValue"
      :document-name="getFileName(modelValue)"
      @close="closePreviewModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import DocumentPreviewModal from '~/components/update-data/modals/DocumentPreviewModal.vue';

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  modelValue: {
    type: [String, File],
    default: ''
  },
  accept: {
    type: String,
    default: '.pdf,.jpg,.jpeg,.png'
  },
  fileHint: {
    type: String,
    default: ''
  },
  maxFileSize: {
    type: Number,
    default: 10 * 1024 * 1024 // 10MB
  },
  disabled: {
    type: Boolean,
    default: false
  },
  readonly: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'file-upload']);

// Preview modal state
const showPreviewModal = ref(false);

const fileInput = ref(null);
const selectedFile = ref(null);

// Generate unique ID
const id = computed(() => `doc-${Math.random().toString(36).substr(2, 9)}`);

// Watch for modelValue changes
watch(() => props.modelValue, (newValue) => {
  if (newValue instanceof File) {
    selectedFile.value = newValue;
  } else {
    selectedFile.value = null;
  }
});

const openFileDialog = () => {
  if (!props.disabled && fileInput.value) {
    fileInput.value.click();
  }
};

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    // Validate file size
    if (props.maxFileSize && file.size > props.maxFileSize) {
      alert(`File size must be less than ${formatFileSize(props.maxFileSize)}`);
      return;
    }

    // Validate file type
    if (props.accept) {
      const allowedTypes = props.accept.split(',').map(type => type.trim());
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      const fileType = file.type;
      
      const isValidType = allowedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension === type.toLowerCase();
        } else {
          return fileType === type;
        }
      });
      
      if (!isValidType) {
        alert(`File type not allowed. Accepted types: ${props.accept}`);
        return;
      }
    }

    selectedFile.value = file;
    emit('file-upload', file);
    emit('update:modelValue', file);
  }
};

const clearFile = () => {
  selectedFile.value = null;
  emit('update:modelValue', '');
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const getFileName = (value) => {
  if (!value) return '';
  
  if (value instanceof File) {
    return value.name;
  }
  
  if (typeof value === 'string' && value.startsWith('http')) {
    const urlParts = value.split('/');
    return urlParts[urlParts.length - 1] || 'Document';
  }
  
  return value;
};

const getFileSize = (value) => {
  if (!value) return '';
  
  if (value instanceof File) {
    return formatFileSize(value.size);
  }
  
  return 'File size not available';
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileType = (filename) => {
  if (!filename) return '';
  
  const extension = filename.split('.').pop().toLowerCase();
  const typeMap = {
    'pdf': 'PDF Document',
    'jpg': 'JPEG Image',
    'jpeg': 'JPEG Image',
    'png': 'PNG Image',
    'doc': 'Word Document',
    'docx': 'Word Document',
    'xls': 'Excel Spreadsheet',
    'xlsx': 'Excel Spreadsheet'
  };
  
  return typeMap[extension] || `${extension.toUpperCase()} File`;
};

const downloadDocument = () => {
  if (props.modelValue) {
    const link = document.createElement('a');
    link.href = props.modelValue;
    link.download = getFileName(props.modelValue);
    link.click();
  }
};

const openPreviewModal = () => {
  if (props.modelValue) {
    showPreviewModal.value = true;
  }
};

const closePreviewModal = () => {
  showPreviewModal.value = false;
};
</script>
