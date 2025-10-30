<template>
  <div class="mb-6 sm:mb-8">
    <!-- Loading State -->
    <div v-if="isLoading">
      <!-- Mobile: Horizontal scroll skeleton -->
      <div class="lg:hidden overflow-x-auto">
        <div class="flex gap-2 sm:gap-3 min-w-max px-3 sm:px-4">
          <div v-for="i in 4" :key="i" class="animate-pulse">
            <div class="w-32 h-20 bg-grey-200 dark:bg-grey-700 rounded-md"></div>
          </div>
        </div>
      </div>

      <!-- Desktop: Grid layout skeleton -->
      <div class="hidden lg:grid lg:grid-cols-4 lg:gap-4">
        <div v-for="i in 4" :key="i" class="animate-pulse">
          <div class="h-20 bg-grey-200 dark:bg-grey-700 rounded-md"></div>
        </div>
      </div>
    </div>

    <!-- Content State -->
    <div v-else>
      <!-- Mobile: Horizontal scroll -->
      <div class="lg:hidden overflow-x-auto">
        <div class="flex gap-2 sm:gap-3 min-w-max px-3 sm:px-4">
          <StatCard title="Draft" :value="stats.draft" icon="pi-file-edit" color="blue" :active="activeFilter === 'draft'" @click="emitFilter('draft')" />
          <StatCard title="Waiting Approval" :value="stats.waiting" icon="pi-clock" color="orange" :active="activeFilter === 'waiting_approval'" @click="emitFilter('waiting_approval')" />
          <StatCard title="Approved" :value="stats.approved" icon="pi-check" color="green" :active="activeFilter === 'approved'" @click="emitFilter('approved')" />
          <StatCard title="Rejected" :value="stats.rejected" icon="pi-times-circle" color="red" :active="activeFilter === 'need_revision'" @click="emitFilter('need_revision')" />
        </div>
      </div>

      <!-- Desktop: Grid layout -->
      <div class="hidden lg:grid lg:grid-cols-4 lg:gap-4">
        <StatCard title="Draft" :value="stats.draft" icon="pi-file-edit" color="blue" :active="activeFilter === 'draft'" @click="emitFilter('draft')" />
        <StatCard title="Waiting Approval" :value="stats.waiting" icon="pi-clock" color="orange" :active="activeFilter === 'waiting_approval'" @click="emitFilter('waiting_approval')" />
        <StatCard title="Approved" :value="stats.approved" icon="pi-check" color="green" :active="activeFilter === 'approved'" @click="emitFilter('approved')" />
        <StatCard title="Rejected" :value="stats.rejected" icon="pi-times-circle" color="red" :active="activeFilter === 'need_revision'" @click="emitFilter('need_revision')" />
      </div>
    </div>
  </div>
  </template>

<script setup>
import StatCard from "~/components/dashboard/StatCard.vue";

const emit = defineEmits(['filter']);

const props = defineProps({
  stats: {
    type: Object,
    required: true,
    default: () => ({ draft: 0, approved: 0, waiting: 0, rejected: 0 })
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  activeFilter: {
    type: String,
    default: 'all'
  }
});

const emitFilter = (value) => {
  const next = props.activeFilter === value ? 'all' : value;
  emit('filter', next);
};
</script>


