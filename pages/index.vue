<template>
  <div class="h-screen w-full flex items-center justify-center bg-dashboard dark:bg-grey-900">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p class="text-grey-600 dark:text-grey-400">Initializing Update Data...</p>
      <p class="text-sm text-grey-500 dark:text-grey-500 mt-2">Redirecting to update data...</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { navigateTo } from '#app';
import envConfig from '~/config/environment.js';

// Notify parent that iframe is ready
const notifyParentReady = () => {
  if (window.parent !== window) {
    window.parent.postMessage({
      type: 'IFRAME_READY',
      source: 'update-data'
    }, envConfig.REMOTE_APP.HOST_ORIGIN);

    console.log('[Update-Data] Notified parent that iframe is ready');
  }
};

onMounted(async () => {
  // Redirect to update-data page after brief delay
  setTimeout(() => {
    navigateTo('/update-data');
  }, 500);
});

// SEO
useHead({
  title: 'Update Data - Loading',
});
</script>
