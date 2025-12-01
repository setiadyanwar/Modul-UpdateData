<template>
  <!-- Modal Overlay -->
  <div v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] md:items-center"
    @click="$emit('close')">
    <!-- Modal Content -->
    <div class="bg-white dark:bg-grey-800 rounded-lg shadow-xl max-w-4xl w-full mx-6 md:mx-4 md:my-0" @click.stop>
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-3 border-b border-grey-200 dark:border-grey-700">
        <div class="min-w-0 flex-1">
          <h2 class="text-base md:text-lg font-semibold text-grey-900 dark:text-grey-100 truncate">
            Document Preview
          </h2>
          <p class="text-xs md:text-sm text-grey-500 dark:text-grey-400 mt-1 truncate">
            {{ documentName }}
          </p>
        </div>
        <button @click="$emit('close')"
          class="p-1.5 md:p-2 rounded-lg hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors flex-shrink-0 ml-2">
          <i class="pi pi-times text-grey-500 dark:text-grey-300 text-lg md:text-xl"></i>
        </button>
      </div>


      <!-- Document Preview Area -->
      <div class="bg-primary-50 dark:bg-grey-900 p-2">
        <div
          class="bg-white dark:bg-grey-900 rounded-lg p-2 md:p-6 min-h-[300px] md:min-h-[400px] max-h-[70vh] relative overflow-auto">
          <!-- Loading State -->
          <div v-if="loading" class="flex items-center justify-center h-full">
            <div class="text-center space-y-4">
              <!-- Document preview skeleton -->
              <div class="w-16 h-20 md:w-20 md:h-24 bg-grey-200 dark:bg-grey-700 rounded-lg mx-auto animate-pulse">
              </div>

              <!-- Loading text skeleton -->
              <div class="h-4 bg-grey-200 dark:bg-grey-700 rounded w-32 mx-auto animate-pulse"></div>

              <!-- Loading dots -->
              <div class="flex items-center justify-center space-x-2">
                <div class="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <div class="w-2 h-2 bg-primary rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
                <div class="w-2 h-2 bg-primary rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
              </div>
            </div>
          </div>


          <!-- Document Content from API -->
          <div v-else-if="documentContent" class="w-full h-full">
            <!-- SharePoint Preview iframe -->
            <div class="relative w-full min-h-[500px] max-h-[70vh] overflow-hidden rounded-lg">
              <iframe :src="documentContent" class="absolute left-0 w-full border-0 bg-white dark:bg-grey-900"
                :style="{ top: `-${previewOffset}px`, height: `calc(100% + ${previewOffset}px)` }" frameborder="0"
                allowfullscreen
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                @error="handleIframeError"></iframe>
            </div>

            <!-- Fallback if iframe fails -->
            <div v-if="iframeError" class="text-center py-8">
              <div class="text-grey-700 dark:text-grey-300">
                <i class="pi pi-exclamation-triangle text-3xl mb-2 text-yellow-600 dark:text-yellow-500"></i>
                <p class="text-sm md:text-base">Preview not available</p>
                <p class="text-xs text-grey-500 dark:text-grey-400 mt-1">This file may be corrupted or in an unsupported
                  format</p>
                <button @click="downloadDocument"
                  class="mt-4 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
                  <i class="pi pi-download mr-2"></i>
                  Download File
                </button>
              </div>
            </div>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="space-y-3 md:space-y-4 flex items-center justify-center h-full text-center">
            <div class="text-red-600 dark:text-red-400">
              <i class="pi pi-exclamation-triangle text-3xl mb-2"></i>
              <p class="text-sm md:text-base">{{ error }}</p>
              <p class="text-xs text-grey-500 dark:text-grey-400 mt-1">Failed to load document preview</p>
            </div>
          </div>

          <!-- No Content State -->
          <div v-else class="space-y-3 md:space-y-4 flex items-center justify-center h-full text-center">
            <div class="text-grey-700 dark:text-grey-300">
              <i class="pi pi-file text-3xl mb-2 text-grey-600 dark:text-grey-400"></i>
              <p class="text-sm md:text-base">No preview available</p>
              <p class="text-xs text-grey-500 dark:text-grey-400 mt-1">This document type may not support preview</p>
            </div>
          </div>
        </div>
      </div>
      <!-- close preview wrapper and preview container above -->

      <!-- Footer with action buttons -->
      <div class="flex justify-end gap-2 md:gap-3 p-3 md:p-6 border-t border-grey-200 dark:border-grey-700">
        <button type="button" @click="$emit('close')"
          class="px-2 md:px-4 py-1.5 md:py-2 bg-grey-200 dark:bg-grey-700 text-grey-700 dark:text-grey-200 rounded-lg hover:bg-grey-300 dark:hover:bg-grey-600 transition-colors text-xs md:text-sm">
          Cancel
        </button>
        <button type="button" @click="downloadDocument"
          :disabled="isDownloading"
          class="px-2 md:px-4 py-1.5 md:py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors flex items-center gap-1 md:gap-2 text-xs md:text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          :aria-busy="isDownloading">
          <i v-if="!isDownloading" class="pi pi-download text-xs md:text-sm"></i>
          <svg v-else class="animate-spin h-3 w-3 md:h-4 md:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <span>{{ isDownloading ? 'Processing...' : 'Download' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useApi } from '~/composables/useApi';
import { useToast } from '~/composables/useToast';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  documentUrl: {
    type: String,
    default: ''
  },
  documentName: {
    type: String,
    default: 'Document'
  },
  itemId: {
    type: [String, Number],
    default: null
  },
  // When provided, use parent-based endpoints for preview/download
  parentId: {
    type: [String, Number],
    default: null
  }
});

const emit = defineEmits(['close']);

const { apiGet } = useApi();
const { error: showError, success: showSuccess } = useToast();

// Document content state
const loading = ref(false);
const documentContent = ref('');
const error = ref('');
const iframeError = ref(false);
const isDownloading = ref(false);

// Pixels to offset the iframe upwards to hide OneDrive header
const previewOffset = 56; // adjust if Microsoft changes header height

// Watch for modal open to load document content
watch(() => props.isOpen, async (newValue) => {
  if (newValue && props.itemId) {
    await loadDocumentContent();
  } else {
    // Reset state when closed
    documentContent.value = '';
    error.value = '';
    iframeError.value = false;
  }
});

// Load document content from API
const loadDocumentContent = async () => {
  if (!props.itemId) {
    error.value = 'No document ID provided';
    return;
  }

  loading.value = true;
  documentContent.value = '';
  error.value = '';

  try {
    // Parse itemId - might contain comma (parent_id,item_id format)
    let actualParentId = props.parentId;
    let actualItemId = props.itemId;

    // If itemId contains comma, extract parent and item
    if (actualItemId && actualItemId.toString().includes(',')) {
      const parts = actualItemId.toString().split(',');
      if (parts.length === 2) {
        actualParentId = parts[0].trim();
        actualItemId = parts[1].trim();
      }
    }

    // Choose endpoint based on presence of parentId
    const previewPath = actualParentId
      ? `/employee/attachments/parent/${actualParentId}/item/${actualItemId}/preview`
      : `/employee/attachments/${actualItemId}/preview`;

    const response = await apiGet(previewPath);

    if (response && (response.success || response.status === true) && (response.data || response.result)) {
      const data = response.data || response.result;
      const previewLink = data.preview_link || data.previewUrl || data.url;

      if (previewLink) {
        documentContent.value = previewLink;
      } else {
        error.value = 'No preview link available';
      }
    } else {
      error.value = response?.message || 'Failed to load document preview';
    }
  } catch (err) {
    error.value = err?.message || 'Failed to load document preview';
  } finally {
    loading.value = false;
  }
};

// Handle iframe loading errors
const handleIframeError = () => {
  iframeError.value = true;
};

const downloadDocument = async () => {
  if (isDownloading.value) return;
  if (!props.itemId) {
    showError('No document ID provided');
    return;
  }

  try {
    isDownloading.value = true;
    const { useAuth } = await import('~/composables/useAuth');
    const { getValidAccessToken } = useAuth();
    const token = await getValidAccessToken();

    if (!token) {
      showError('Authentication required');
      return;
    }

    // Parse itemId - might contain comma (parent_id,item_id format)
    let actualParentId = props.parentId;
    let actualItemId = props.itemId;

    // If itemId contains comma, extract parent and item
    if (actualItemId && actualItemId.toString().includes(',')) {
      const parts = actualItemId.toString().split(',');
      if (parts.length === 2) {
        actualParentId = parts[0].trim();
        actualItemId = parts[1].trim();
      }
    }

    // Choose endpoint based on presence of parentId
    const baseUrl = actualParentId
      ? `/api/proxy/employee/attachments/parent/${actualParentId}/item/${actualItemId}/download`
      : `/api/proxy/employee/attachments/${actualItemId}/download`;
    const urlWithAuth = `${baseUrl}?auth=${encodeURIComponent(`Bearer ${token}`)}`;

    // Use fetch for consistent behavior across all platforms
    const response = await fetch(urlWithAuth, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    // Get the blob from response
    const blob = await response.blob();

    if (!blob || blob.size === 0) {
      throw new Error('Received empty file from server');
    }

    // Get filename from content-disposition header or use default
    const contentDisposition = response.headers.get('content-disposition');
    let filename = props.documentName || 'Document';

    if (contentDisposition) {
      const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/['"]/g, '');
      }
    }

    // Create download link and trigger download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    // Show success message and close modal
    showSuccess(`Download completed: ${filename}`);
    emit('close');

  } catch (err) {
    console.error('Download error:', err);
    showError(`Failed to download document: ${err.message}`);
  } finally {
    isDownloading.value = false;
  }
};
</script>
