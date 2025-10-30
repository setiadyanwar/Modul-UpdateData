<template>
  <label v-if="label" :class="['inline-flex items-center cursor-pointer select-none leading-none', disabled ? 'opacity-60 cursor-not-allowed' : '']">
    <span class="relative inline-flex items-center leading-none shrink-0">
      <input
        type="checkbox"
        class="peer appearance-none w-[var(--cb-size)] h-[var(--cb-size)] min-w-[var(--cb-size)] min-h-[var(--cb-size)] border rounded transition-colors duration-150 focus:ring-2 focus:ring-primary-300 dark:focus:ring-primary-700 outline-none"
        :checked="modelValue"
        :disabled="disabled"
        :indeterminate.prop="indeterminate"
        @change="$emit('update:modelValue', $event.target.checked); $emit('change', $event.target.checked)"
        :style="`--cb-size: ${computedSize}px;`"
      />
      <span
        class="absolute left-0 top-0 w-full h-full rounded pointer-events-none border transition-colors duration-150"
        :class="[
          modelValue
            ? 'bg-secondary-500 border-secondary-500 dark:bg-secondary-400 dark:border-secondary-400'
            : 'bg-white border-gray-300 dark:bg-grey-800 dark:border-grey-600',
          disabled ? 'opacity-60' : '',
        ]"
      >
        <svg v-if="modelValue" class="w-full h-full text-white" viewBox="0 0 16 16" fill="none">
          <path d="M4 8.5L7 11.5L12 5.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <svg v-else-if="indeterminate" class="w-full h-full text-white" viewBox="0 0 16 16" fill="none">
          <rect x="4" y="7.25" width="8" height="1.5" rx="0.75" fill="white"/>
        </svg>
      </span>
    </span>
    <span class="ml-2 text-sm text-gray-900 dark:text-grey-100">{{ label }}</span>
  </label>
  <span v-else class="relative inline-flex items-center leading-none shrink-0">
    <input
      type="checkbox"
      class="peer appearance-none w-[var(--cb-size)] h-[var(--cb-size)] min-w-[var(--cb-size)] min-h-[var(--cb-size)] border rounded transition-colors duration-150 focus:ring-2 focus:ring-primary-300 dark:focus:ring-primary-700 outline-none"
      :checked="modelValue"
      :disabled="disabled"
      :indeterminate.prop="indeterminate"
      @change="$emit('update:modelValue', $event.target.checked); $emit('change', $event.target.checked)"
      :style="`--cb-size: ${computedSize}px;`"
    />
    <span
      class="absolute left-0 top-0 w-full h-full rounded pointer-events-none border transition-colors duration-150"
      :class="[
        modelValue
          ? 'bg-secondary-500 border-secondary-500 dark:bg-secondary-400 dark:border-secondary-400'
          : 'bg-white border-gray-300 dark:bg-grey-800 dark:border-grey-600',
        disabled ? 'opacity-60' : '',
      ]"
    >
      <svg v-if="modelValue" class="w-full h-full text-white" viewBox="0 0 16 16" fill="none">
        <path d="M4 8.5L7 11.5L12 5.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <svg v-else-if="indeterminate" class="w-full h-full text-white" viewBox="0 0 16 16" fill="none">
        <rect x="4" y="7.25" width="8" height="1.5" rx="0.75" fill="white"/>
      </svg>
    </span>
  </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: Boolean,
  disabled: Boolean,
  indeterminate: Boolean,
  label: String,
  size: {
    type: Number,
    default: 16,
  },
  variant: {
    type: String,
    default: 'default', // 'default', 'form', 'modal'
    validator: (value) => ['default', 'form', 'modal'].includes(value)
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

// Computed size based on variant
const computedSize = computed(() => {
  switch (props.variant) {
    case 'form':
      return 20;
    case 'modal':
      return 18;
    default:
      return props.size;
  }
});
</script>

<style scoped>
input[type="checkbox"] {
  /* Hide default */
  position: relative;
  z-index: 2;
  opacity: 0;
}
</style>

