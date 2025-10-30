<template>
  <div class="fixed inset-0 bg-white dark:bg-grey-900 z-50 flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-6"></div>
      <h2 class="text-xl font-semibold text-grey-800 dark:text-grey-200 mb-2">
        Authenticating...
      </h2>
      <p class="text-grey-600 dark:text-grey-400 mb-4">
        {{ message }}
      </p>
      <div class="text-sm text-grey-500 dark:text-grey-500">
        <i class="pi pi-shield-check mr-2"></i>
        Securing your session
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  timeout: {
    type: Number,
    default: 10000 // 10 seconds
  }
});

const emit = defineEmits(['timeout']);

const message = ref('Waiting for authentication token...');

onMounted(() => {
  // Change message after a delay
  setTimeout(() => {
    message.value = 'Establishing secure connection...';
  }, 2000);

  // Emit timeout event if authentication takes too long
  setTimeout(() => {
    emit('timeout');
  }, props.timeout);
});
</script>

<style scoped>
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
