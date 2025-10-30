<template>
  <div
    :class="[active ? activeClass : hoverClass]"
    class="rounded-md border border-grey-200 dark:border-grey-700 p-3 sm:p-4 lg:p-6 shadow-sm hover:shadow-md transition-all duration-200 min-w-[160px] sm:min-w-[180px] lg:min-w-[200px] cursor-pointer"
    @click="$emit('click')"
  >
    <div class="flex flex-col">
      <div class="flex items-center mb-1">
        <div
          :class="active ? iconBgActiveClass : iconBgClass"
          class="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center flex-shrink-0"
        >
          <i :class="iconClass" class="text-xs sm:text-sm lg:text-base"></i>
        </div>
        <p
          class="ml-2 sm:ml-3 lg:ml-4 text-xs sm:text-sm lg:text-sm font-medium text-grey-700 dark:text-grey-200 uppercase tracking-wide truncate"
        >
          {{ title }}
        </p>
      </div>
      <p
        class="text-xl sm:text-2xl lg:text-3xl font-bold text-grey-900 dark:text-grey-100 ml-8 sm:ml-10 lg:ml-12"
      >
        {{ value }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const emit = defineEmits(['click']);

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  value: {
    type: [String, Number],
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    default: "blue",
  },
  active: {
    type: Boolean,
    default: false,
  },
});

const iconClass = computed(() => `pi ${props.icon} ${iconColorClass.value}`);

const iconColorClass = computed(() => {
  const colorMap = {
    blue: "text-blue-600",
    green: "text-green-600",
    yellow: "text-yellow-600",
    orange: "text-orange-600",
    red: "text-red-600",
    gray: "text-gray-600",
  };
  return colorMap[props.color] || colorMap.blue;
});

const hoverClass = computed(() => {
  const base = "bg-white dark:bg-grey-800";
  const colorMap = {
    blue: `${base} hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/10 dark:hover:border-blue-600`,
    green: `${base} hover:bg-green-50 hover:border-green-300 dark:hover:bg-green-900/10 dark:hover:border-green-600`,
    yellow: `${base} hover:bg-yellow-50 hover:border-yellow-300 dark:hover:bg-yellow-900/10 dark:hover:border-yellow-600`,
    orange: `${base} hover:bg-orange-50 hover:border-orange-300 dark:hover:bg-orange-900/10 dark:hover:border-orange-600`,
    red: `${base} hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-900/10 dark:hover:border-red-600`,
    gray: `${base} hover:bg-gray-50 hover:border-gray-300 dark:hover:bg-gray-900/10 dark:hover:border-gray-600`,
  };
  return colorMap[props.color] || colorMap.blue;
});

const activeClass = computed(() => {
  const colorMap = {
    blue: "bg-blue-50 border-blue-300 ring-1 ring-blue-200 shadow-sm dark:bg-blue-900/20 dark:border-blue-600 dark:ring-blue-700",
    green:
      "bg-green-50 border-green-300 ring-1 ring-green-200 shadow-sm dark:bg-green-900/20 dark:border-green-600 dark:ring-green-700",
    yellow:
      "bg-yellow-50 border-yellow-300 ring-1 ring-yellow-200 shadow-sm dark:bg-yellow-900/20 dark:border-yellow-600 dark:ring-yellow-700",
    orange:
      "bg-orange-50 border-orange-300 ring-1 ring-orange-200 shadow-sm dark:bg-orange-900/20 dark:border-orange-600 dark:ring-orange-700",
    red: "bg-red-50 border-red-300 ring-1 ring-red-200 shadow-sm dark:bg-red-900/20 dark:border-red-600 dark:ring-red-700",
    gray: "bg-gray-50 border-gray-300 ring-1 ring-gray-200 shadow-sm dark:bg-gray-900/20 dark:border-gray-600 dark:ring-gray-700",
  };
  return colorMap[props.color] || colorMap.blue;
});

const iconBgActiveClass = computed(() => {
  const colorMap = {
    blue: "bg-blue-100",
    green: "bg-green-100",
    yellow: "bg-yellow-100",
    orange: "bg-orange-100",
    red: "bg-red-100",
    gray: "bg-gray-100",
  };
  return colorMap[props.color] || colorMap.blue;
});

const iconBgClass = computed(() => {
  const colorMap = {
    blue: "bg-blue-50",
    green: "bg-green-50",
    yellow: "bg-yellow-50",
    orange: "bg-orange-50",
    red: "bg-red-50",
    gray: "bg-gray-50",
  };
  return colorMap[props.color] || colorMap.blue;
});
</script>
