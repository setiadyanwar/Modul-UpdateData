<template>
  <component :is="isLoading ? skeletonComponent : contentComponent" v-bind="contentProps" />
</template>

<script setup>
defineProps({
  isLoading: { type: Boolean, required: true },
  skeletonComponent: { type: [Object, String], required: true },
  contentComponent: { type: [Object, String], required: true },
  contentProps: { type: Object, default: () => ({}) },
});
</script>
