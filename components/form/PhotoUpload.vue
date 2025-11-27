<!-- Start of Selection -->
<template>
  <div class="flex flex-col items-center w-full">
    <div class="relative mb-4 w-full">
      <!-- Show nothing when parent is loading -->
      <div v-if="parentLoading" class="mx-auto w-full max-w-[8rem] md:max-w-[10rem] lg:max-w-[11rem] xl:max-w-[13rem] aspect-[3/4]"></div>
      

      <!-- Loading skeleton only when fetching image preview -->
      <div
        v-else-if="isLoadingPreview"
        class="mx-auto w-full max-w-[8rem] md:max-w-[10rem] lg:max-w-[11rem] xl:max-w-[13rem] aspect-[3/4] rounded-md bg-gradient-to-br from-grey-50 to-grey-100 dark:from-grey-800 dark:to-grey-900 overflow-hidden"
      >
        <div class="w-full h-full flex items-center justify-center p-4">
          <div class="w-full h-full bg-gradient-to-br from-grey-200 to-grey-300 dark:from-grey-600 dark:to-grey-700 rounded-md animate-pulse"></div>
        </div>
      </div>

      <!-- Display photo if available -->
      <div v-else-if="realPhotoUrl" class="relative">
        <img
          :src="realPhotoUrl"
          :alt="altText"
          class="mx-auto w-full max-w-[8rem] md:max-w-[10rem] lg:max-w-[11rem] xl:max-w-[13rem] aspect-[3/4] rounded-md object-cover shadow-md"
          @error="handleImageError"
          @load="handleImageLoad"
        />
        <!-- Cancel Upload Overlay -->
        <button
          v-if="!disabled"
          @click="handleRemovePhoto"
          class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors z-10"
          title="Remove Photo"
        >
          <i class="pi pi-times text-xs"></i>
        </button>
      </div>

      <!-- Placeholder when no photo available -->
      <div
        v-else
        class="mx-auto w-full max-w-[8rem] md:max-w-[10rem] lg:max-w-[11rem] xl:max-w-[13rem] aspect-[3/4] rounded-md bg-gradient-to-br from-grey-100 to-grey-200 dark:from-grey-700 dark:to-grey-800 border-2 border-dashed border-grey-300 dark:border-grey-600 flex flex-col items-center justify-center text-grey-400 dark:text-grey-500 skeleton-shimmer"
      >
        <i class="pi pi-user text-4xl mb-2"></i>
        <span class="text-xs text-center px-2">No Photo</span>
      </div>
    </div>

    <!-- Upload Professional Photo action -->
    <div v-if="!parentLoading" class="w-full flex justify-center">
      <div class="w-full">
        <input ref="fileInput" type="file" accept="image/*" class="hidden" :disabled="disabled" @change="onSelectPhoto" />
        <UiButton
          type="button"
          variant="primary"
          color="secondary"
          size="small"
          class="mt-1"
          :fullWidth="true"
          :disabled="disabled"
          @click="triggerSelect"
        >
          Upload Photo
        </UiButton>
      </div>
    </div>

    <!-- Alert for photo change instructions -->
    <UiAlert
      v-if="!parentLoading"
      variant="info"
      size="small"
      class="mt-3 md:mt-4 w-full"
      :no-margin="true"
    >
       Please upload an official employee photograph to update your profile photo.
    </UiAlert>
  </div>
</template>

<script setup>
import { computed, ref, watch, onUnmounted } from 'vue';
import UiAlert from '~/components/ui/Alert.vue';
import UiButton from '~/components/ui/Button.vue';

const emit = defineEmits(['photo-changed']);

const props = defineProps({
  photoUrl: {
    type: String,
    default: "",
  },
  altText: {
    type: String,
    default: "Profile Photo",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  // Add prop to control if parent is loading
  parentLoading: {
    type: Boolean,
    default: false,
  }
});


const previewPhotoUrl = ref('');
const isLoadingPreview = ref(false);
const fileInput = ref(null);

// Parse parent_id dan item_id dari professional_photo string
// Support both formats: parent_id,item_id (new, comma-delimited) and parent_id-item_id (legacy)
const parsePhotoId = (photoString) => {
  if (!photoString || typeof photoString !== 'string') return null;

  const sanitized = photoString.trim();
  if (!sanitized) return null;

  let parent_id = '';
  let item_id = '';

  // Prefer comma-delimited payloads (can have more than two segments, join the tail back)
  if (sanitized.includes(',')) {
    const parts = sanitized
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    if (parts.length >= 2) {
      parent_id = parts[0];
      item_id = parts.slice(1).join(',');
    }
  }

  // Fallback to old format (hyphen-separated, use last hyphen to survive IDs containing '-')
  if ((!parent_id || !item_id) && sanitized.includes('-')) {
    const lastHyphenIndex = sanitized.lastIndexOf('-');
    if (lastHyphenIndex > 0 && lastHyphenIndex < sanitized.length - 1) {
      parent_id = sanitized.slice(0, lastHyphenIndex).trim();
      item_id = sanitized.slice(lastHyphenIndex + 1).trim();
    }
  }

  return parent_id && item_id ? { parent_id, item_id } : null;
};

// Get photo direct URL for preview
const getPhotoDirectUrl = async (photoString) => {
  const photoIds = parsePhotoId(photoString);
  if (!photoIds) return null; // invalid id, skip

  try {
    const { useAuth } = await import('~/composables/useAuth');
    const { getValidAccessToken } = useAuth();
    const token = await getValidAccessToken();

    if (!token) return null;

    // Final guard: do not call if any id missing
    if (!photoIds.parent_id || !photoIds.item_id) return null;
    const downloadUrl = `/api/proxy/employee/attachments/parent/${photoIds.parent_id}/item/${photoIds.item_id}/download`;

    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) return null;

    // Check if this is an image
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      return null;
    }

    // Convert response to blob and create object URL
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    return objectUrl;
  } catch (error) {
    console.error('Failed to get photo direct URL:', error);
    return null;
  }
};

// Load preview photo when photoUrl changes
watch(() => props.photoUrl, async (newPhotoUrl) => {
  // Cleanup previous URL
  if (previewPhotoUrl.value && previewPhotoUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewPhotoUrl.value);
    previewPhotoUrl.value = '';
  }

  if (!newPhotoUrl || newPhotoUrl === 'null' || newPhotoUrl === 'undefined' || newPhotoUrl.trim() === '') {
    return;
  }

  // Check if it's a regular URL or parent_id,item_id format
  if (newPhotoUrl.startsWith('http') || newPhotoUrl.startsWith('blob:')) {
    // Regular URL or blob URL, use as is
    previewPhotoUrl.value = newPhotoUrl;
    return;
  }

  // Assume it's parent_id,item_id format
  const photoIds = parsePhotoId(newPhotoUrl);
  if (!photoIds) {
    return;
  }

  // Don't show loading state if parent is loading
  if (props.parentLoading) {
    return;
  }
  
  isLoadingPreview.value = true;
  try {
    const url = await getPhotoDirectUrl(newPhotoUrl);
    if (url) {
      previewPhotoUrl.value = url;
    }
  } catch (error) {
    console.error('Photo preview load error:', error);
  } finally {
    isLoadingPreview.value = false;
  }
}, { immediate: true });

const realPhotoUrl = computed(() => {
  return previewPhotoUrl.value;
});

// Handle image error
const handleImageError = (event) => {
  // Image failed to load, cleanup blob URL if it exists
  if (previewPhotoUrl.value && previewPhotoUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewPhotoUrl.value);
    previewPhotoUrl.value = '';
  }
};

// Handle image load
const handleImageLoad = (event) => {
  // Image loaded successfully
  isLoadingPreview.value = false;
};

// Trigger file select
const triggerSelect = () => {
  if (props.disabled) return;
  fileInput.value?.click();
};

// Handle photo selection from FE and preview immediately
const onSelectPhoto = (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  try {
    const objectUrl = URL.createObjectURL(file);
    // Revoke previous
    if (previewPhotoUrl.value && previewPhotoUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(previewPhotoUrl.value);
    }
    previewPhotoUrl.value = objectUrl;
    // Emit to parent so it can upload/save later
    emit('photo-changed', file);
  } catch (_) {
    // noop
  } finally {
    // reset input to allow re-select same file
    if (fileInput.value) fileInput.value.value = '';
  }
};

// Handle remove photo
const handleRemovePhoto = () => {
  // Cleanup blob URL if exists
  if (previewPhotoUrl.value && previewPhotoUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewPhotoUrl.value);
  }

  // Clear preview
  previewPhotoUrl.value = '';

  // Reset file input
  if (fileInput.value) {
    fileInput.value.value = '';
  }

  // Emit null to parent to indicate removal
  emit('photo-changed', null);
};

// Cleanup when component unmounts
onUnmounted(() => {
  if (previewPhotoUrl.value && previewPhotoUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewPhotoUrl.value);
  }
});
</script>

<style scoped>
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}

/* Shimmer effect that stays within bounds */
.skeleton-shimmer {
  position: relative;
  overflow: hidden;
}
.skeleton-shimmer::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: shimmer 2s infinite;
  pointer-events: none;
}
</style>
