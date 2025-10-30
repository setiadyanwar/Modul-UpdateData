<template>
  <div v-if="changes && changes.length > 0" class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700 p-4">
    <div class="flex items-center gap-2 mb-4">
      <div class="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
        <i class="pi pi-sync text-blue-600 dark:text-blue-400 text-sm"></i>
      </div>
      <h3 class="font-semibold text-text-main text-base">Data Changes</h3>
      <span class="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs font-medium px-2 py-1 rounded-full">
        {{ changes.length }} {{ changes.length === 1 ? 'change' : 'changes' }}
      </span>
    </div>
    
    <div class="space-y-3">
      <div v-for="(change, index) in changes" :key="change.field || index" 
           class="bg-white dark:bg-grey-800 rounded-md border border-blue-100 dark:border-blue-800 p-3 shadow-sm">
        <div class="flex items-start justify-between mb-2">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span class="text-sm font-medium text-grey-700 dark:text-grey-300">{{ change.label || change.field || `Field ${index + 1}` }}</span>
          </div>
          <span class="text-xs text-grey-500 bg-grey-100 dark:bg-grey-700 px-2 py-1 rounded">
            Field {{ index + 1 }}
          </span>
        </div>
        
        <!-- Old and New Values - Side by Side -->
        <div class="w-full grid grid-cols-1 md:grid-cols-2 gap-3">
          <!-- Old Value -->
          <div class="bg-red-50 dark:bg-red-900/20 rounded-md p-3 border border-red-200 dark:border-red-800">
            <div class="text-xs font-medium text-red-600 dark:text-red-400 mb-1 flex items-center gap-1">
              <i class="pi pi-times-circle text-xs"></i>
              Previous Value:
            </div>
            <div v-if="typeof change.old === 'object'" class="text-sm text-text-main">
              <pre class="whitespace-pre-wrap break-words bg-white dark:bg-grey-800 p-2 rounded border text-xs">{{ JSON.stringify(change.old, null, 2) }}</pre>
            </div>
            <div v-else class="text-sm text-text-main font-medium break-words bg-white dark:bg-grey-800 p-2 rounded border" :title="getFullValue(change.old)">
              {{ formatValue(change.old) || 'Not set' }}
            </div>
          </div>
          
          <!-- New Value -->
          <div class="bg-green-50 dark:bg-green-900/20 rounded-md p-3 border border-green-200 dark:border-green-800">
            <div class="text-xs font-medium text-green-600 dark:text-green-400 mb-1 flex items-center gap-1">
              <i class="pi pi-check-circle text-xs"></i>
              Updated Value:
            </div>
            <div v-if="typeof change.new === 'object'" class="text-sm text-text-main">
              <pre class="whitespace-pre-wrap break-words bg-white dark:bg-grey-800 p-2 rounded border text-xs">{{ JSON.stringify(change.new, null, 2) }}</pre>
            </div>
            <div v-else class="text-sm text-text-main font-medium break-words bg-white dark:bg-grey-800 p-2 rounded border" :title="getFullValue(change.new)">
              {{ formatValue(change.new) || 'Not set' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- No Changes State -->
  <div v-else class="text-center py-6">
    <div class="mb-3">
      <i class="pi pi-info-circle text-2xl text-grey-400 dark:text-grey-500"></i>
    </div>
    <p class="text-sm text-grey-600 dark:text-grey-400">No data changes available.</p>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  changes: {
    type: Array,
    default: () => []
  },
  showFieldNumbers: {
    type: Boolean,
    default: true
  }
});

/**
 * Format value for display
 */
const formatValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'Not set';
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
};

/**
 * Get full value for tooltip
 */
const getFullValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'Not set';
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  
  return String(value);
};
</script>
