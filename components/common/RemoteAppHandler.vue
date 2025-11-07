<template>
  <div class="remote-app-container" :class="{ 'loading': isLoading }">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <i class="pi pi-spin pi-spinner text-2xl text-primary"></i>
        <p class="mt-2 text-sm text-gray-600">Loading {{ appName }}...</p>
      </div>
    </div>
    
    <!-- Error State -->
    <div v-else-if="hasError" class="error-state">
      <div class="error-content">
        <i class="pi pi-exclamation-triangle text-4xl text-red-500 mb-4"></i>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Failed to Load Application</h3>
        <p class="text-sm text-gray-600 mb-4">{{ errorMessage }}</p>
        <UiButton @click="retryLoad" variant="primary" size="small">
          <i class="pi pi-refresh mr-2"></i>
          Retry
        </UiButton>
      </div>
    </div>
    
    <!-- Success: Navigate to remote app -->
    <div v-else class="success-redirect">
      <div class="success-content">
        <i class="pi pi-check-circle text-4xl text-green-500 mb-4"></i>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Redirecting to {{ appName }}</h3>
        <p class="text-sm text-gray-600">Loading microfrontend...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from '~/composables/useToast';

// Props
const props = defineProps({
  appName: {
    type: String,
    required: true
  },
  appPath: {
    type: String,
    required: true
  },
  redirectDelay: {
    type: Number,
    default: 1000
  }
});

// Composables
const { error: showError } = useToast();
const { $config } = useNuxtApp();

// State
const isLoading = ref(true);
const hasError = ref(false);
const errorMessage = ref('');

// Computed
const appUrl = computed(() => {
  const remoteApps = $config.public.remoteApps || {};
  return remoteApps.updateDataMf || 'http://localhost:3001';
});

// Check if remote app is available
const checkAppHealth = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`${appUrl.value}/api/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      // Health check passed, redirect to app
      setTimeout(() => {
        const isAbsolute = /^https?:\/\//i.test(props.appPath);
        if (isAbsolute) {
          navigateTo(props.appPath, { external: true });
        } else {
          navigateTo(props.appPath);
        }
      }, props.redirectDelay);
      
      isLoading.value = false;
    } else {
      throw new Error(`Service responded with ${response.status}`);
    }
  } catch (err) {
    hasError.value = true;
    isLoading.value = false;
    
    if (err.name === 'AbortError') {
      errorMessage.value = 'Connection timeout. The service might be starting up.';
    } else if (err.message.includes('CORS')) {
      errorMessage.value = 'CORS error. Please check service configuration.';
    } else {
      errorMessage.value = `Unable to connect to ${props.appName}. Please ensure the service is running.`;
    }
  }
};

// Retry loading
const retryLoad = () => {
  hasError.value = false;
  isLoading.value = true;
  errorMessage.value = '';
  checkAppHealth();
};

// Initialize
onMounted(() => {
  checkAppHealth();
});
</script>

<style scoped>
.remote-app-container {
  @apply w-full h-full relative bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700;
  min-height: 400px;
}

.loading-overlay, .error-state, .success-redirect {
  @apply absolute inset-0 flex items-center justify-center;
}

.loading-spinner, .error-content, .success-content {
  @apply text-center p-8;
}

.loading .remote-app-content {
  @apply opacity-50;
}
</style>