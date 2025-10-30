<template>
  <div v-if="modelValue" class="fixed inset-0 z-[10000]" role="dialog" aria-modal="true">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('update:modelValue', false)"></div>
    <div class="relative z-10 flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
      <div
        class="relative transform overflow-hidden rounded-md bg-white dark:bg-grey-800 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-3xl max-h-[90vh] flex flex-col border border-grey-200 dark:border-grey-700">
        <div class="flex items-center justify-between p-4 border-b border-grey-200 dark:border-grey-700">
          <h3 class="text-lg font-semibold text-text-main">{{ title || 'Personal Data Processing Agreement' }}</h3>
          <button @click="$emit('update:modelValue', false)"
            class="text-grey-400 hover:text-grey-600 dark:hover:text-grey-300 transition-colors">
            <i class="pi pi-times text-xl"></i>
          </button>
        </div>
        <div class="p-4 overflow-y-auto">
          <div class="text-sm text-text-main">
            <div v-if="loading" class="text-text-secondary">Loading consent...</div>
            <div v-else class="consent-rich ql-editor" v-html="content"></div>
          </div>
        </div>
        <div
          class="flex justify-end space-x-3 p-4 border-t border-grey-200 dark:border-grey-700 bg-white dark:bg-grey-800">
          <button @click="$emit('update:modelValue', false)"
            class="px-4 py-2 text-sm font-medium text-text-secondary bg-grey-100 dark:bg-grey-700 border border-grey-300 dark:border-grey-600 rounded-md hover:bg-grey-200 dark:hover:bg-grey-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-grey-500 transition-colors">Close</button>
        </div>
      </div>
    </div>
  </div>
  
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  content: { type: String, default: '' },
  loading: { type: Boolean, default: false },
});

defineEmits(['update:modelValue']);
</script>

<style scoped>
/* Keep same rich content behavior */
::deep(.consent-rich.ql-editor) {
  max-height: none !important;
  overflow: visible !important;
}
</style>


