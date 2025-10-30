<template>
  <div
    :class="[
      'flex items-start gap-2 md:gap-3 p-3 md:p-4 rounded-md border',
      variantClasses,
      sizeClasses,
      { 'mb-4': !noMargin },
    ]"
  >
    <!-- Icon -->
    <div class="flex-shrink-0">
      <i :class="iconClass" class="w-5 h-5"></i>
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <div v-if="title" class="font-medium mb-1" :class="titleColor">
        {{ title }}
      </div>
      <div :class="textColor">
        <slot>
          {{ message }}
        </slot>
      </div>
    </div>

    <!-- Close button -->
    <button
      v-if="dismissible"
      @click="$emit('dismiss')"
      class="flex-shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      :class="closeButtonColor"
    >
      <i class="pi pi-times text-sm"></i>
    </button>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  variant: {
    type: String,
    default: "info",
    validator: (value) =>
      ["info", "success", "warning", "error"].includes(value),
  },
  size: {
    type: String,
    default: "medium",
    validator: (value) => ["small", "medium", "large"].includes(value),
  },
  title: {
    type: String,
    default: "",
  },
  message: {
    type: String,
    default: "",
  },
  dismissible: {
    type: Boolean,
    default: false,
  },
  noMargin: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["dismiss"]);

const variantClasses = computed(() => {
  const variants = {
    info: "bg-secondary-50 border-secondary-200 dark:bg-grey-800 dark:border-secondary-800",
    success:
      "bg-success-50 border-success-200 dark:bg-success-900/20 dark:border-success-800",
    warning:
      "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800",
    error: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
  };
  return variants[props.variant];
});

const sizeClasses = computed(() => {
  const sizes = {
    small: "text-xs md:text-sm",
    medium: "text-sm md:text-base",
    large: "text-base md:text-lg",
  };
  return sizes[props.size];
});

const titleColor = computed(() => {
  const colors = {
    info: "text-secondary-800 dark:text-secondary-200",
    success: "text-success-800 dark:text-success-200",
    warning: "text-yellow-800 dark:text-yellow-200",
    error: "text-red-800 dark:text-red-200",
  };
  return colors[props.variant];
});

const textColor = computed(() => {
  const colors = {
    info: "text-secondary-700 dark:text-secondary-300",
    success: "text-success-700 dark:text-success-300",
    warning: "text-yellow-700 dark:text-yellow-300",
    error: "text-red-700 dark:text-red-300",
  };
  return colors[props.variant];
});

const closeButtonColor = computed(() => {
  const colors = {
    info: "text-secondary-600 hover:text-secondary-800 dark:text-secondary-400 dark:hover:text-secondary-200",
    success:
      "text-success-600 hover:text-success-800 dark:text-success-400 dark:hover:text-success-200",
    warning:
      "text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200",
    error:
      "text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200",
  };
  return colors[props.variant];
});

const iconClass = computed(() => {
  const icons = {
    info: "pi pi-info-circle text-secondary-600 dark:text-secondary-400",
    success: "pi pi-check-circle text-success-600 dark:text-success-400",
    warning: "pi pi-exclamation-triangle text-yellow-600 dark:text-yellow-400",
    error: "pi pi-times-circle text-red-600 dark:text-red-400",
  };
  return icons[props.variant];
});
</script>
