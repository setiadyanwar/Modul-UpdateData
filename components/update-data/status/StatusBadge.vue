<template>
  <span
    :class="badgeClass"
    class="w-fit items-center px-2 sm:px-3 py-1 rounded-md text-xs font-medium"
  >
    <span class="truncate">{{ displayStatus }}</span>
  </span>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  status: {
    type: String,
    required: true,
  },
  statusLabel: {
    type: String,
    default: null,
  },
});

// Computed untuk menampilkan text status yang benar
const displayStatus = computed(() => {
  // Jika ada statusLabel, gunakan itu
  if (props.statusLabel) {
    return props.statusLabel;
  }
  
  // Jika status adalah "3" (Need Revision), tampilkan sebagai "Need Revision"
  if (props.status === '3' || props.status === 3) {
    return 'Need Revision';
  }
  
  // Map status ke label yang lebih user-friendly
  const statusLabelMap = {
    '1': 'Draft',
    '2': 'Waiting Approval',
    '3': 'Need Revision',
    '4': 'Approved',
    '5': 'Rejected',
    'draft': 'Draft',
    'waiting_approval': 'Waiting Approval',
    'rejected': 'Need Revision',
    'approved': 'Approved'
  };
  
  return statusLabelMap[props.status] || props.status;
});

const badgeClass = computed(() => {
  // Gunakan status yang sudah di-normalize untuk styling
  const normalizedStatus = props.status === '3' || props.status === 3 ? 'rejected' : props.status;
  
  const statusMap = {
    draft:
      "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700",
    submitted:
      "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700",
    approved:
      "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700",
    waiting_approval:
      "bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-700",
    rejected:
      "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700",
    // Consent status
    active:
      "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700",
    inactive:
      "bg-grey-50 text-grey-700 border border-grey-200 dark:bg-grey-700 dark:text-grey-300 dark:border-grey-600",
    // Fallback untuk status yang tidak dikenal
    "1":
      "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700",
    "3":
      "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700",
    Draft:
      "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700",
    Approved:
      "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700",
    "Waiting Approval":
      "bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-700",
    Rejected:
      "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700",
    "Need Revision":
      "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700",
  };
  return (
    statusMap[normalizedStatus] ||
    "bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-700"
  );
});
</script>
