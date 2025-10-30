<template>
  <div
    v-if="isVisible"
    class="fixed inset-0 z-50 overflow-y-auto"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <!-- Background overlay -->
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div
        class="fixed inset-0 bg-grey-500 bg-opacity-75 transition-opacity"
        aria-hidden="true"
        @click="handleBackgroundClick"
      ></div>

      <!-- Modal panel -->
      <div class="inline-block align-bottom bg-white dark:bg-grey-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <div class="bg-white dark:bg-grey-900 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900 sm:mx-0 sm:h-10 sm:w-10">
              <i class="pi pi-clock text-yellow-600 dark:text-yellow-400 text-xl"></i>
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3
                class="text-lg leading-6 font-medium text-grey-900 dark:text-white"
                id="modal-title"
              >
                Session Will Expire Soon
              </h3>
              <div class="mt-2">
                <p class="text-sm text-grey-500 dark:text-grey-400">
                  Your session will expire in
                  <span class="font-semibold text-yellow-600 dark:text-yellow-400">
                    {{ formatTime(remainingTime) }}
                  </span>
                  due to inactivity. Click "Extend Session" to stay signed in.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-grey-50 dark:bg-grey-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm transition-colors"
            @click="handleExtendSession"
            :disabled="isLoading"
          >
            <i v-if="isLoading" class="pi pi-spin pi-spinner mr-2"></i>
            {{ isLoading ? 'Extending...' : 'Extend Session' }}
          </button>
          <button
            type="button"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-grey-300 dark:border-grey-600 shadow-sm px-4 py-2 bg-white dark:bg-grey-700 text-base font-medium text-grey-700 dark:text-grey-300 hover:bg-grey-50 dark:hover:bg-grey-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
            @click="handleLogout"
            :disabled="isLoading"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  remainingTime: {
    type: Number,
    default: 300
  }
});

const emit = defineEmits(['logout', 'extend-session']);

const isLoading = ref(false);

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds) || seconds < 0) {
    return '5:00';
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const handleExtendSession = async () => {
  isLoading.value = true;
  try {
    emit('extend-session');
  } finally {
    isLoading.value = false;
  }
};

const handleLogout = () => {
  emit('logout');
};

const handleBackgroundClick = () => {
  // Prevent closing by clicking background
};
</script>

