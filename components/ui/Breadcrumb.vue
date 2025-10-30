<template>
  <nav
    class="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm"
    aria-label="Breadcrumb"
  >
    <ol class="flex items-center space-x-1 md:space-x-2">
      <li v-for="(item, index) in items" :key="index" class="flex items-center">
        <!-- Breadcrumb item -->
        <NuxtLink
          v-if="item.href && !item.current"
          :to="item.href"
          class="transition-colors text-grey-500 hover:text-grey-700 dark:text-grey-400 dark:hover:text-grey-300 cursor-pointer"
        >
          {{ item.label }}
        </NuxtLink>
        <span
          v-else
          class="transition-colors font-medium cursor-default text-primary-600 dark:text-primary-400"
        >
          {{ item.label }}
        </span>

        <!-- Separator -->
        <i
          v-if="index < items.length - 1"
          class="pi pi-chevron-right text-grey-400 mx-1 md:mx-2 text-xs"
        ></i>
      </li>
    </ol>
  </nav>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    required: true,
    validator: (items) => {
      return items.every(
        (item) =>
          typeof item === "object" &&
          item.label &&
          typeof item.label === "string"
      );
    },
  },
});
</script>
