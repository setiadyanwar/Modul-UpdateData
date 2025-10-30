<template>
  <div v-if="shouldShow">
    <!-- Desktop Layout -->
    <div class="hidden lg:block">
      <div
        class="bg-red-50 dark:bg-red-900/20 rounded-md shadow-sm border border-red-200 dark:border-red-800"
      >
        <div class="p-3 md:p-4 border-b border-red-200 dark:border-red-800">
          <h3
            class="font-semibold text-red-800 dark:text-red-200 text-sm md:text-base"
          >
            <i class="pi pi-exclamation-triangle mr-2"></i>
            HC Review Notes
          </h3>
        </div>
        <div class="p-3 md:p-4 space-y-3">
          <ReviewNote
            :content="displayNote || 'No content available'"
            :reviewer="displayReviewer"
            icon="pi-exclamation-triangle"
          />
        </div>
      </div>
    </div>

    <!-- Mobile Layout with Horizontal Scroll -->
    <div class="lg:hidden">
      <div class="space-y-3">
        <h3
          class="font-semibold text-red-800 dark:text-red-200 text-sm md:text-base"
        >
          <i class="pi pi-exclamation-triangle mr-2"></i>
          HC Review Notes
        </h3>
        <div class="flex gap-3 overflow-x-auto pb-2">
          <div class="flex-shrink-0 w-80">
            <ReviewNote
              :title="'HC Review'"
              :content="displayNote || 'No content available'"
              :reviewer="displayReviewer"
              icon="pi-exclamation-triangle"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import ReviewNote from "~/components/update-data/status/ReviewNote.vue";

const props = defineProps({
  note: {
    type: String,
    default: "",
  },
  reviewer: {
    type: String,
    default: "HC Team",
  },
  reviewNotes: {
    type: Array,
    default: () => [],
  },
  status: {
    type: String,
    default: "",
  },
});

// Show whenever there is a note or review notes
const shouldShow = computed(() => {
  const hasNote = !!(props.note && String(props.note).trim());
  const hasReviewNotes = Array.isArray(props.reviewNotes) && props.reviewNotes.length > 0;
  return hasNote || hasReviewNotes;
});

// Get the first review note for display
const displayNote = computed(() => {
  if (props.note && String(props.note).trim()) {
    return props.note;
  }
  if (Array.isArray(props.reviewNotes) && props.reviewNotes.length > 0) {
    const firstNote = props.reviewNotes[0];
    return firstNote.note || firstNote.content || firstNote.message || '';
  }
  return '';
});

// Get reviewer from review notes
const displayReviewer = computed(() => {
  
  if (props.reviewer && props.reviewer !== 'HC Team') {
    return props.reviewer;
  }
  
  if (Array.isArray(props.reviewNotes) && props.reviewNotes.length > 0) {
    const firstNote = props.reviewNotes[0];
    
    const reviewer = firstNote.request_approver?.name_approver || 
           firstNote.reviewer || 
           firstNote.reviewed_by || 
           firstNote.reviewer_name || 
           'HC Team';
    return reviewer;
  }
  
  return 'HC Team';
});
</script>
