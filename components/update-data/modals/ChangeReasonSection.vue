<template>
  <div
    class="bg-card-bg rounded-lg shadow-sm border border-grey-200 dark:border-grey-700"
  >
    <div class="p-3 md:p-4 border-b border-grey-200 dark:border-grey-700">
      <h3 class="font-semibold text-text-main text-sm md:text-base">
        Change Reason
      </h3>
    </div>
    <div class="p-3 md:p-4">
      <!-- View Only Mode -->
      <div v-if="variant === 'view'">
        <template v-if="displayReason">
          <p class="text-sm text-grey-600 dark:text-grey-400 break-words whitespace-pre-line">
            {{ displayReason }}
          </p>
        </template>
        <template v-else>
          <p class="text-sm text-grey-500 italic dark:text-grey-500">
            Not yet reason.
          </p>
        </template>
      </div>

      <!-- Editable Mode -->
      <div v-else-if="variant === 'edit'">
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-medium text-text-main">Change Reason <span class="text-red-500">*</span></label>
          <span :class="['text-xs', hasReachedMax ? 'text-red-600' : 'text-grey-500']">{{ currentLength }}/{{ MAX_LENGTH }}</span>
        </div>
        <textarea
          v-model="editReason"
          class="w-full p-3 border border-grey-200 dark:border-grey-600 rounded-md bg-white dark:bg-grey-700 text-sm text-text-main placeholder-grey-400 focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          rows="3"
          placeholder="Enter change reason..."
          :maxlength="MAX_LENGTH"
          @input="handleInput"
        ></textarea>
        <p v-if="hasReachedMax" class="text-xs text-red-600 mt-1">Maksimal 200 karakter</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";

const props = defineProps({
  reason: {
    type: String,
    default: "",
  },
  // API-provided value that should take precedence when available
  reasonWhenWaiting: {
    type: String,
    default: "",
  },
  variant: {
    type: String,
    default: "view",
  },
});

const emit = defineEmits(["update:reason"]);

// Displayed reason prefers reasonWhenWaiting (reason_when_waiting) over reason
const displayReason = computed(() => props.reasonWhenWaiting || props.reason || "");

const MAX_LENGTH = 200;
const editReason = ref((displayReason.value || "").slice(0, MAX_LENGTH));
const currentLength = computed(() => (editReason.value || "").length);
const hasReachedMax = computed(() => currentLength.value >= MAX_LENGTH);

// Watch for changes in reason prop
watch(
  () => props.reason,
  (newReason) => {
    // only override when there is no reasonWhenWaiting
    if (!props.reasonWhenWaiting) editReason.value = (newReason || "").slice(0, MAX_LENGTH);
  }
);

// Watch for changes in reasonWhenWaiting prop
watch(
  () => props.reasonWhenWaiting,
  (newVal) => {
    if (newVal) {
      editReason.value = (newVal || "").slice(0, MAX_LENGTH);
    }
  }
);

// Watch for changes in variant prop
watch(
  () => props.variant,
  (newVariant) => {
    if (newVariant === "view") {
      editReason.value = (displayReason.value || "").slice(0, MAX_LENGTH);
    }
  }
);

const handleInput = (e) => {
  const val = e?.target?.value ?? "";
  // Enforce hard cap and emit truncated content
  const truncated = val.slice(0, MAX_LENGTH);
  if (truncated !== editReason.value) {
    editReason.value = truncated;
  }
  emit("update:reason", truncated);
};
</script>
