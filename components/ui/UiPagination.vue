<template>
  <div class="flex items-center justify-center gap-1">
    <button
      @click="$emit('prev-page')"
      :disabled="!hasPrevPage"
      class="inline-flex items-center justify-center w-8 h-8 text-sm rounded hover:bg-grey-100 active:bg-grey-200 dark:hover:bg-grey-700/70 dark:active:bg-grey-700 transition-colors text-grey-500 dark:text-grey-400 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <i class="pi pi-angle-left"></i>
    </button>

    <template v-for="(item, idx) in pageButtons" :key="`pg-${idx}-${item}`">
      <button
        v-if="item !== '…'"
        @click="$emit('goto-page', item)"
        :class="[
          'inline-flex items-center justify-center w-8 h-8 text-sm rounded transition-colors',
          item === (currentPage || 1)
            ? 'bg-primary text-white'
            : 'text-grey-600 dark:text-grey-300 hover:bg-grey-100 active:bg-grey-200 dark:hover:bg-grey-700/70 dark:active:bg-grey-700'
        ]"
      >
        {{ item }}
      </button>
      <span v-else class="inline-flex items-center justify-center w-8 h-8 text-sm text-grey-400">…</span>
    </template>

    <button
      @click="$emit('next-page')"
      :disabled="!hasNextPage"
      class="inline-flex items-center justify-center w-8 h-8 text-sm rounded hover:bg-grey-100 active:bg-grey-200 dark:hover:bg-grey-700/70 dark:active:bg-grey-700 transition-colors text-grey-500 dark:text-grey-400 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <i class="pi pi-angle-right"></i>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  currentPage: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 },
  hasPrevPage: { type: Boolean, default: false },
  hasNextPage: { type: Boolean, default: false },
});

defineEmits(['prev-page', 'next-page', 'goto-page']);

const pageButtons = computed(() => {
  const total = Math.max(1, props.totalPages || 1);
  const current = Math.max(1, props.currentPage || 1);
  const ELLIPSIS = '…';

  if (total <= 3) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const buttons = [];

  if (current <= 2) {
    buttons.push(1);
    buttons.push(2);
    if (total > 3) buttons.push(ELLIPSIS);
    buttons.push(total);
    return buttons;
  }

  if (current >= total - 1) {
    if (total > 3) buttons.push(ELLIPSIS);
    buttons.push(total - 2);
    buttons.push(total - 1);
    buttons.push(total);
    return buttons;
  }

  buttons.push(ELLIPSIS);
  buttons.push(current - 1);
  buttons.push(current);
  buttons.push(current + 1);
  if (current + 1 < total) buttons.push(ELLIPSIS);
  if (buttons[buttons.length - 1] !== total) buttons.push(total);
  return buttons;
});
</script>


