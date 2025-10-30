<template>
  <div class="bg-white dark:bg-grey-800 rounded-lg border border-grey-200 dark:border-grey-700 p-4 hover:shadow-md transition-shadow duration-200">
    <!-- Header -->
    <div class="flex items-start justify-between mb-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
          <i class="pi pi-users text-blue-600 dark:text-blue-400 text-lg"></i>
        </div>
        <div>
          <h4 class="font-semibold text-grey-900 dark:text-grey-100 text-sm md:text-base">
            {{ member.name || 'Family Member Name' }}
          </h4>
          <p class="text-xs text-grey-500 dark:text-grey-400">
            {{ member.relation || 'Relationship' }}
          </p>
        </div>
      </div>
      
      <!-- Action buttons -->
      <div class="flex items-center gap-2">
        <button
          v-if="!readonly"
          @click="$emit('edit', member)"
          class="p-1.5 text-grey-500 hover:text-primary hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md transition-colors"
          title="Edit"
        >
          <i class="pi pi-pencil text-sm"></i>
        </button>
        <button
          v-if="!readonly"
          @click="$emit('delete', member)"
          class="p-1.5 text-grey-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
          title="Delete"
        >
          <i class="pi pi-trash text-sm"></i>
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="space-y-2">
      <!-- Gender & Birth Info -->
      <div class="flex items-center gap-4 text-sm">
        <div class="flex items-center gap-2">
          <i class="pi pi-venus-mars text-grey-400 w-4"></i>
          <span class="text-grey-700 dark:text-grey-300">
            {{ member.gender || 'Gender not specified' }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <i class="pi pi-calendar text-grey-400 w-4"></i>
          <span class="text-grey-700 dark:text-grey-300">
            {{ formatDate(member.birth_date) }}
          </span>
        </div>
      </div>

      <!-- Birth Place -->
      <div class="flex items-center gap-2 text-sm">
        <i class="pi pi-map-marker text-grey-400 w-4"></i>
        <span class="text-grey-700 dark:text-grey-300">
          {{ member.birth_place || 'Birth place not specified' }}
        </span>
      </div>

      <!-- Address -->
      <div class="flex items-center gap-2 text-sm">
        <i class="pi pi-home text-grey-400 w-4"></i>
        <span class="text-grey-700 dark:text-grey-300">
          {{ member.address || 'Address not specified' }}
        </span>
      </div>

      <!-- Occupation -->
      <div class="flex items-center gap-2 text-sm">
        <i class="pi pi-briefcase text-grey-400 w-4"></i>
        <span class="text-grey-700 dark:text-grey-300">
          {{ member.occupation || 'Occupation not specified' }}
        </span>
      </div>

      <!-- Additional Info -->
      <div class="flex items-center gap-4 text-sm">
        <div class="flex items-center gap-2">
          <i class="pi pi-heart text-grey-400 w-4"></i>
          <span class="text-grey-700 dark:text-grey-300">
            {{ member.marital_status || 'Marital status not specified' }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <i class="pi pi-id-card text-grey-400 w-4"></i>
          <span class="text-grey-700 dark:text-grey-300">
            {{ member.no_telkomedika || 'No Telkomedika not specified' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Status badge -->
    <div class="mt-3 pt-3 border-t border-grey-100 dark:border-grey-700">
      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
        <i class="pi pi-user mr-1"></i>
        {{ getMemberStatusLabel }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  member: {
    type: Object,
    required: true
  },
  readonly: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['edit', 'delete']);

// Get member status label from hardcoded options
const getMemberStatusLabel = computed(() => {
  if (!props.member.member_status && props.member.member_status !== 0) return 'Active Member';
  
  // Simple mapping for member status
  const statusMap = {
    1: 'Active',
    0: 'Inactive',
    '1': 'Active', 
    '0': 'Inactive'
  };
  
  return statusMap[props.member.member_status] || 'Active Member';
});

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return 'Not specified';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};
</script>

