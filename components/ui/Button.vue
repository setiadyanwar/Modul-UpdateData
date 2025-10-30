<template>
  <!--
    UiButton Component
    -----------------
    A reusable button component with support for variants, sizes, full width, and accessibility (aria-label).
    The slot is used for button content (text or icon).
  -->
  <button
    :type="type"
    :disabled="disabled"
    :class="[
      'flex justify-center items-center gap-1 rounded-lg font-semibold transition focus:outline-none',
      fullWidth && 'w-full',
      size === 'small' && 'px-2 py-1.5 md:px-2 md:py-2 text-xs md:text-sm',
      size === 'default' && 'py-2 px-4 md:px-5 text-sm md:text-base',
      size === 'large' && 'py-3 md:py-4 px-6 md:px-8 text-base md:text-lg',
      // Primary Variant
      effectiveVariant === 'primary' && !disabled &&
        (
          effectivePalette === 'secondary'
            ? 'text-white bg-secondary-500 hover:bg-secondary-600 focus:ring-2 focus:ring-secondary-500'
            : 'text-white bg-primary hover:bg-primary-700 focus:ring-2 focus:ring-primary-600'
        ),
      effectiveVariant === 'primary' && disabled &&
        (
          effectivePalette === 'secondary'
            ? 'bg-secondary-100 dark:bg-secondary-800/20 dark:text-secondary-400 text-white cursor-not-allowed'
            : 'bg-primary-100 dark:bg-primary-800/20 dark:text-primary-400 text-white cursor-not-allowed'
        ),
      // Secondary Variant
      effectiveVariant === 'secondary' &&
        !disabled &&
        'text-main border border-grey-300 dark:border-grey-700 bg-background hover:bg-primary-50 hover:border-primary dark:hover:bg-primary-900/40 dark:hover:border-primary-700',
      effectiveVariant === 'secondary' &&
        disabled &&
        'bg-grey-100 text-grey-400 border border-grey-200 cursor-not-allowed dark:bg-grey-800 dark:text-grey-600 dark:border-grey-700',
      // Error Variant
      effectiveVariant === 'error' &&
        !disabled &&
        'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 focus:ring-2 focus:ring-red-400/50 border border-red-200 dark:border-red-800/50 shadow-sm hover:shadow-md transition-all duration-200',
      effectiveVariant === 'error' &&
        disabled &&
        'bg-red-50 dark:bg-red-900/10 text-red-300 dark:text-red-600 border border-red-100 dark:border-red-800/30 cursor-not-allowed',
    ]"
    :aria-label="ariaLabel"
  >
    <slot />
  </button>
</template>

<script setup>
// Import Vue utilities
import { computed, useSlots, onMounted } from 'vue';
// Define props for the button
const props = defineProps({
  type: { type: String, default: "button" },
  disabled: { type: Boolean, default: false },
  variant: { type: String, default: "primary" }, // 'primary' | 'secondary' | 'error'
  // Optional color override: when provided, will override palette used by variant
  color: { type: String, default: undefined }, // 'primary' | 'secondary' | 'error'
  size: { type: String, default: "default" }, // 'small' | 'default' | 'large'
  fullWidth: { type: Boolean, default: false },
  ariaLabel: { type: String, default: '' },
});
const slots = useSlots();
// Variant controls behavior (solid, outline, etc.)
const effectiveVariant = computed(() => {
  return props.variant;
});
// Palette is the color family used for styling (e.g., primary, secondary)
const effectivePalette = computed(() => {
  return props.color ?? props.variant;
});
// Compute the aria-label for accessibility
const ariaLabel = computed(() => {
  // If slot is empty, fallback to "Button"
  if (!slots.default || slots.default().length === 0) return 'Button';
  // If slot only contains an icon, developer should provide aria-label prop
  return props.ariaLabel || undefined;
});
// Warn in development if button has no accessible name
onMounted(() => {
  if (!slots.default || slots.default().length === 0) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
    }
  }
});
</script>
