<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <div class="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
          <i class="pi pi-info-circle text-2xl text-blue-600 dark:text-blue-400"></i>
        </div>
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
          Update Data - ESS Sigma
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Remote Application
        </p>
      </div>

      <div class="mt-8 bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <div class="space-y-6">
          <div class="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <i class="pi pi-exclamation-triangle text-yellow-400"></i>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Access Restriction
                </h3>
                <div class="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <p>
                    This application is a <strong>remote module</strong> and must be accessed through the main ESS Sigma application.
                  </p>
                  <p class="mt-2">
                    Direct access to this URL is not permitted for security reasons.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6">
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
              How to access:
            </h4>
            <ol class="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>Login to the main ESS Sigma application</li>
              <li>Navigate to the Update Data menu</li>
              <li>The application will load automatically in the iframe</li>
            </ol>
          </div>

          <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
            <a
              :href="mainAppUrl"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Main Application
            </a>
          </div>

          <!-- Development Mode Info -->
          <div v-if="isDevelopment" class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <h4 class="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
              Development Mode
            </h4>
            <div class="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <p><strong>Remote App URL:</strong> http://localhost:3001</p>
              <p><strong>Host App URL:</strong> {{ hostOrigin }}</p>
              <p class="mt-2">To test locally, open the host application and it will load this remote app in an iframe.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="text-center text-xs text-gray-500 dark:text-gray-400">
        <p>Update Data Module v{{ appVersion }}</p>
        <p class="mt-1">Part of ESS Sigma Application Suite</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import envConfig from '~/config/environment';

// App info
const appVersion = ref(envConfig.APP.VERSION || '1.0.0');
const isDevelopment = computed(() => envConfig.IS_DEVELOPMENT);
const hostOrigin = ref(envConfig.REMOTE_APP.HOST_ORIGIN || 'http://localhost:3000');

// Main app URL
const mainAppUrl = computed(() => {
  if (isDevelopment.value) {
    return hostOrigin.value;
  }
  // Production main app URL
  return 'https://ess.telkomsigma.co.id';
});

// Set page title
useHead({
  title: 'Access Restricted - Update Data ESS Sigma',
  meta: [
    { name: 'description', content: 'This is a remote application module that must be accessed through the main ESS Sigma application.' }
  ]
});
</script>
