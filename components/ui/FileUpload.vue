<template>
  <div
    class="rounded-md border bg-white dark:bg-grey-800 p-4 transition-all"
    :class="[
      hasExistingFiles ? 'border-solid border-grey-300 dark:border-grey-700' : 'border-dashed border-grey-300 dark:border-grey-700',
      isDragging && !hasExistingFiles ? 'border-primary-500 border-solid bg-primary-50 dark:bg-primary-900/20' : ''
    ]"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-medium text-text-main">{{ title }}</span>
      <span class="text-xs text-grey-500">{{ fileInfo }}</span>
    </div>

    <!-- PrimeVue FileUpload -->
    <div class="edu-fileupload">
      <FileUpload
        :name="name"
        mode="advanced"
        :custom-upload="true"
        :multiple="multiple"
        :accept="accept"
        :max-file-size="maxFileSize"
        :disabled="disabled || hasExistingFiles"
        @select="onSelect"
        @uploader="onUploader"
      >
        <template #content="{ files, removeFileCallback }">
          <div class="flex flex-col gap-3">
            
            <!-- Existing files -->
            <div 
              v-for="(file, fIdx) in existingFiles" 
              :key="'existing-' + file.item_id" 
              class="flex items-center justify-between border border-blue-200 dark:border-blue-700 rounded-md p-2 bg-blue-50 dark:bg-blue-900/20"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 flex items-center justify-center bg-blue-100 dark:bg-blue-800 rounded">
                  <i :class="getFileIcon(file.file_name)" class="text-lg"></i>
                </div>
                <div class="flex flex-col">
                  <span class="text-sm font-medium text-grey-900 dark:text-grey-100">{{ file.file_name }}</span>
                  <span class="text-xs text-grey-500">{{ file.file_size_display }} • {{ file.uploaded_date }}</span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button 
                  @click="onPreviewExisting(file)" 
                  class="text-blue-600 hover:text-blue-700 p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                  :disabled="disabled"
                  title="View file"
                >
                  <i class="pi pi-eye"></i>
                </button>
                <button 
                  @click="onRemoveExisting(file)" 
                  class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                  :disabled="disabled"
                  title="Delete file"
                  style="display: block !important; opacity: 1 !important; visibility: visible !important; width: auto !important; height: auto !important; min-width: 24px !important; min-height: 24px !important; position: relative !important; z-index: 1 !important; background: transparent !important; border: none !important; margin: 0 !important; padding: 4px !important;"
                >
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </div>
            
            <!-- Files being uploaded -->
            <div 
              v-for="(file, fIdx) in files" 
              :key="'file-' + file.name + file.type + file.size" 
              class="flex items-center justify-between border border-grey-200 dark:border-grey-700 rounded-md p-2"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 flex items-center justify-center bg-grey-100 dark:bg-grey-800 rounded">
                  <img 
                    v-if="file.name && !file.name.toLowerCase().endsWith('.pdf')" 
                    :src="file.objectURL" 
                    alt="thumb" 
                    class="max-h-8 max-w-8 object-contain" 
                  />
                  <i v-else class="pi pi-file-pdf text-red-500 text-lg"></i>
                </div>
                <div class="flex flex-col">
                  <span class="text-sm font-medium text-grey-900 dark:text-grey-100">{{ file.name }}</span>
                  <span class="text-xs text-grey-500">{{ formatFileSize(file.size) }}</span>
                </div>
              </div>
              <button 
                @click="removeFileCallback(fIdx)" 
                class="text-red-500 hover:text-red-700 p-1"
                :disabled="disabled"
                title="Remove file"
              >
                <i class="pi pi-times"></i>
              </button>
            </div>
          </div>
        </template>
        <template #empty>
          <div class="flex items-center justify-center text-center py-6 min-h-[96px] w-full">
            <!-- Show message only if no existing files -->
            <span v-if="!hasExistingFiles" class="text-xs text-grey-500">{{ emptyText }}</span>
            <span v-else class="text-xs text-grey-500">File already uploaded. Delete the existing file to upload a new one.</span>
          </div>
        </template>
      </FileUpload>
    </div>
  </div>
</template>

<script setup>
import FileUpload from 'primevue/fileupload'
import { ref, computed } from 'vue'

const props = defineProps({
  name: {
    type: String,
    default: 'file'
  },
  title: {
    type: String,
    default: 'Upload File'
  },
  fileInfo: {
    type: String,
    default: 'PNG, JPG, JPEG, PDF · max 25MB'
  },
  emptyText: {
    type: String,
    default: 'Drag & drop or browse file.'
  },
  multiple: {
    type: Boolean,
    default: false
  },
  accept: {
    type: String,
    default: '.jpg,.jpeg,.png,.pdf,application/pdf,image/jpeg,image/png'
  },
  maxFileSize: {
    type: Number,
    default: 25 * 1024 * 1024 // 25MB
  },
  disabled: {
    type: Boolean,
    default: false
  },
  existingFiles: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['select', 'uploader', 'view-existing', 'remove-existing'])

// Drag and drop state
const isDragging = ref(false)

// Check if there are existing files
const hasExistingFiles = computed(() => {
  return props.existingFiles && props.existingFiles.length > 0
})

// Drag and drop handlers
const onDragOver = (event) => {
  if (hasExistingFiles.value || props.disabled) return
  event.preventDefault()
  isDragging.value = true
}

const onDragLeave = (event) => {
  event.preventDefault()
  isDragging.value = false
}

const onDrop = (event) => {
  event.preventDefault()
  isDragging.value = false
}

const onSelect = (event) => {
  emit('select', event)
}

const onUploader = (event) => {
  emit('uploader', event)
}

// Handle existing file actions
const onPreviewExisting = (file) => {
  emit('view-existing', file)
}

const onRemoveExisting = (file) => {
  emit('remove-existing', file)
}

// Get file icon based on file extension
const getFileIcon = (fileName) => {
  if (!fileName) return 'pi pi-file text-gray-500';
  
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return 'pi pi-file-pdf text-red-500';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return 'pi pi-image text-green-500';
    case 'doc':
    case 'docx':
      return 'pi pi-file-word text-blue-500';
    case 'xls':
    case 'xlsx':
      return 'pi pi-file-excel text-green-600';
    case 'ppt':
    case 'pptx':
      return 'pi pi-file-powerpoint text-orange-500';
    default:
      return 'pi pi-file text-gray-500';
  }
}


// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style>
/* PrimeVue FileUpload theming override - Global styles for better specificity */

/* Ultra-specific selectors to override any global styles */
div.edu-fileupload .p-fileupload .p-fileupload-choose-button,
div.edu-fileupload .p-fileupload .p-fileupload-upload-button,
div.edu-fileupload .p-fileupload .p-button:not(.p-fileupload-cancel-button),
div.edu-fileupload .p-fileupload button.p-button:not(.p-fileupload-cancel-button) {
  @apply bg-primary-500 border-primary-500 text-white px-3 py-1.5 text-xs !important;
}

div.edu-fileupload .p-fileupload .p-fileupload-choose-button:hover,
div.edu-fileupload .p-fileupload .p-fileupload-upload-button:hover,
div.edu-fileupload .p-fileupload .p-button:not(.p-fileupload-cancel-button):hover,
div.edu-fileupload .p-fileupload button.p-button:not(.p-fileupload-cancel-button):hover {
  @apply bg-primary-600 border-primary-600 !important;
}
.edu-fileupload .p-fileupload {
  --p-fileupload-header-padding: 0.5rem 0.75rem;
  --p-fileupload-content-padding: 0.75rem 0.75rem 0.75rem 0.75rem;
}

.edu-fileupload .p-fileupload-header {
  padding-top: 0.75rem;
  padding-bottom: 0.5rem;
}

.edu-fileupload .p-fileupload-content {
  padding-top: 0.75rem;
  min-height: 6rem;
}

/* Force primary button styling with multiple selectors for better coverage */
.edu-fileupload .p-fileupload-choose-button,
.edu-fileupload .p-fileupload-upload-button,
.edu-fileupload .p-button:not(.p-fileupload-cancel-button),
.edu-fileupload button.p-button:not(.p-fileupload-cancel-button),
.edu-fileupload .p-fileupload .p-button:not(.p-fileupload-cancel-button) {
  @apply bg-primary-500 border-primary-500 text-white px-3 py-1.5 text-xs !important;
}

/* Additional specificity for PrimeVue buttons */
.edu-fileupload .p-fileupload .p-fileupload-choose-button {
  @apply bg-primary-500 border-primary-500 text-white !important;
}

.edu-fileupload .p-fileupload-upload-button {
  display: none !important;
}

.edu-fileupload .p-fileupload-choose-button:hover,
.edu-fileupload .p-fileupload-upload-button:hover,
.edu-fileupload .p-button:not(.p-fileupload-cancel-button):hover,
.edu-fileupload button.p-button:not(.p-fileupload-cancel-button):hover,
.edu-fileupload .p-fileupload .p-button:not(.p-fileupload-cancel-button):hover {
  @apply bg-primary-600 border-primary-600 !important;
}

/* Even more specific selectors to override any global styles */
.edu-fileupload .p-fileupload .p-fileupload-choose-button:hover {
  @apply bg-primary-600 border-primary-600 !important;
}

.edu-fileupload .p-fileupload-cancel-button {
  @apply px-3 py-1.5 text-xs !important;
  background-color: #f3f4f6 !important;
  border-color: #d1d5db !important;
  color: #374151 !important;
}

.edu-fileupload .p-fileupload-cancel-button:hover {
  background-color: #e5e7eb !important;
  border-color: #9ca3af !important;
}

/* Ultra-specific cancel button styling to override any global styles */
div.edu-fileupload .p-fileupload .p-fileupload-cancel-button,
div.edu-fileupload .p-fileupload button.p-fileupload-cancel-button {
  background-color: #f3f4f6 !important;
  border-color: #d1d5db !important;
  color: #374151 !important;
}

div.edu-fileupload .p-fileupload .p-fileupload-cancel-button:hover,
div.edu-fileupload .p-fileupload button.p-fileupload-cancel-button:hover {
  background-color: #e5e7eb !important;
  border-color: #9ca3af !important;
}

/* Force override any primary colors on cancel button */
.edu-fileupload .p-fileupload-cancel-button,
.edu-fileupload .p-fileupload .p-fileupload-cancel-button,
.edu-fileupload button.p-fileupload-cancel-button {
  background: #f3f4f6 !important;
  background-color: #f3f4f6 !important;
  border: 1px solid #d1d5db !important;
  border-color: #d1d5db !important;
  color: #374151 !important;
}

.edu-fileupload .p-fileupload-cancel-button:hover,
.edu-fileupload .p-fileupload .p-fileupload-cancel-button:hover,
.edu-fileupload button.p-fileupload-cancel-button:hover {
  background: #e5e7eb !important;
  background-color: #e5e7eb !important;
  border: 1px solid #9ca3af !important;
  border-color: #9ca3af !important;
}

.edu-fileupload .p-fileupload-file-name {
  @apply text-xs;
}

.edu-fileupload .p-fileupload-file-size {
  @apply text-xs;
}
</style>
