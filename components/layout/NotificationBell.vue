<template>
  <button class="relative p-2 rounded-full hover:bg-grey-100 dark:hover:bg-grey-800 transition-colors">
    <i class="pi pi-bell text-xl text-grey-600 dark:text-grey-400"></i>
    
    <span 
      v-if="count > 0" 
      class="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-md px-1.5 py-0.5 text-xs font-medium bg-secondary text-white ring-secondary-500/10 dark:bg-secondary-800 dark:text-secondary-300"
    >
      {{ count }}
    </span>
  </button>
</template>

<script setup>
defineProps({
  count: {
    type: Number,
    default: 0,
  },
});
</script>
