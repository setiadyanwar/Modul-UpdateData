<template>
  <div :class="['rounded-md shadow-sm border p-6', 'bg-white dark:bg-grey-800', 'border-grey-200 dark:border-grey-700']">
    <div class="flex items-center mb-6">
      <div :class="['w-10 h-10 rounded-md flex items-center justify-center mr-3', iconBg, darkIconBg]">
        <i :class="[icon, iconColor, darkIconColor, 'text-lg']"></i>
      </div>
      <h4 class="text-xl font-bold text-text-main">{{ title }}</h4>
    </div>
    <slot />
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  icon: { type: String, required: true },
  iconColor: { type: String, default: '' },
  iconBg: { type: String, default: '' },
  darkIconColor: { type: String, default: '' },
  darkIconBg: { type: String, default: '' },
});
</script>
