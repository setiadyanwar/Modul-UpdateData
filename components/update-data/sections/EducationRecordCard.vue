<template>
  <div class="bg-white dark:bg-grey-800 rounded-lg border border-grey-200 dark:border-grey-700 p-4 hover:shadow-md transition-shadow duration-200">
    <!-- Header -->
    <div class="flex items-start justify-between mb-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
          <i class="pi pi-graduation-cap text-primary text-lg"></i>
        </div>
        <div>
          <h4 class="font-semibold text-grey-900 dark:text-grey-100 text-sm md:text-base">
            {{ record.edu_level || 'Education Level' }}
          </h4>
          <p class="text-xs text-grey-500 dark:text-grey-400">
            {{ record.edu_major || 'Major/Field of Study' }}
          </p>
        </div>
      </div>
      
      <!-- Action buttons -->
      <div class="flex items-center gap-2">
        <button
          v-if="!readonly"
          @click="$emit('edit', record)"
          class="p-1.5 text-grey-500 hover:text-primary hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md transition-colors"
          title="Edit"
        >
          <i class="pi pi-pencil text-sm"></i>
        </button>
        <button
          v-if="!readonly"
          @click="$emit('delete', record)"
          class="p-1.5 text-grey-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
          title="Delete"
        >
          <i class="pi pi-trash text-sm"></i>
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="space-y-2">
      <!-- Institution -->
      <div class="flex items-center gap-2 text-sm">
        <i class="pi pi-building text-grey-400 w-4"></i>
        <span class="text-grey-700 dark:text-grey-300">
          {{ record.edu_institution || 'Institution name not specified' }}
        </span>
      </div>

      <!-- Duration -->
      <div class="flex items-center gap-2 text-sm">
        <i class="pi pi-calendar text-grey-400 w-4"></i>
        <span class="text-grey-700 dark:text-grey-300">
          {{ formatDate(record.edu_start_date) }} - {{ formatDate(record.edu_end_date) }}
        </span>
      </div>

      <!-- Document -->
      <div v-if="record.ijazah_doc" class="flex items-center gap-2 text-sm">
        <i class="pi pi-file-pdf text-grey-400 w-4"></i>
        <span class="text-grey-700 dark:text-grey-300">
          {{ getFileName(record.ijazah_doc) }}
        </span>
      </div>
    </div>

    <!-- Status badge -->
    <div class="mt-3 pt-3 border-t border-grey-100 dark:border-grey-700">
      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
        <i class="pi pi-check-circle mr-1"></i>
        Completed
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  record: {
    type: Object,
    required: true
  },
  readonly: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['edit', 'delete']);

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return 'Not specified';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'long' 
    });
  } catch {
    return dateString;
  }
};

// Get filename from URL or filename
const getFileName = (value) => {
  if (!value) return '';
  
  if (value.startsWith('http')) {
    const urlParts = value.split('/');
    return urlParts[urlParts.length - 1] || 'Document';
  }
  
  return value;
};
</script>

