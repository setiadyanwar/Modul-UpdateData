<template>
  <div class="bg-yellow-50 rounded-sm p-3 border-l-4 border-yellow-500">
    <div class="max-h-32 overflow-y-auto mb-2">
      <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
        {{ content }}
      </p>
    </div>

    <p class="text-xs text-gray-500">Reviewed by: {{ getReviewerName(reviewer) }}</p>
  </div>
</template>

<script setup>
defineProps({
  content: {
    type: String,
    default: "",
  },
  reviewer: {
    type: String,
    default: "",
  },
  icon: {
    type: String,
    default: "pi-user",
  },
});

// Helper function to format reviewer name (same as RequestHistoryTable)
const getReviewerName = (reviewer) => {
  const toProperName = (str) => {
    if (!str || typeof str !== 'string') return str;
    return str
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (!reviewer) return "System";
  if (typeof reviewer === "string") return toProperName(reviewer);
  if (typeof reviewer === "object" && reviewer.name) return toProperName(reviewer.name);
  return "System";
};
</script>
