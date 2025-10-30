<template>
  <div class="status-tracker" :class="containerBgClass">
    <div class="flex items-center justify-center">
      <!-- Status Steps -->
      <div class="flex items-center space-x-1">
        <div 
          v-for="(step, index) in steps" 
          :key="index"
          class="flex items-center"
        >
          <!-- Step Circle -->
          <div 
            class="w-4 h-4 flex items-center justify-center text-xs font-medium transition-all duration-200"
            :class="getStepClasses(step, index)"
          >
            <i v-if="step.icon" :class="step.icon" class="text-xs"></i>
            <span v-else>{{ index + 1 }}</span>
          </div>
          
          <!-- Step Label -->
          <span 
            class="ml-0.5 text-xs font-medium transition-colors duration-200"
            :class="getLabelClasses(step, index)"
          >
            {{ step.label }}
          </span>
          
          <!-- Connector Line (except for last item) -->
          <div 
            v-if="index < steps.length - 1"
            class="w-4 h-0.5 mx-1 transition-colors duration-200"
            :class="getConnectorClasses(index)"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useColorMode } from '#imports'

const colorMode = useColorMode()
const props = defineProps({
  currentStatus: {
    type: String,
    default: 'draft'
  },
  steps: {
    type: Array,
        default: () => [
      { 
        key: 'draft', 
        label: 'Draft', 
        icon: 'pi pi-file-edit',
        color: 'text-grey-400'
      },
      { 
        key: 'submitted', 
        label: 'Submitted', 
        icon: 'pi pi-send',
        color: 'text-primary'
      },
      { 
        key: 'waiting_approval', 
        label: 'Waiting Approval', 
        icon: 'pi pi-clock',
        color: 'text-orange-500'
      },
      { 
        key: 'approved', 
        label: 'Approved', 
        icon: 'pi pi-check',
        color: 'text-green-500'
      },
      { 
        key: 'need_revision', 
        label: 'Need Revision', 
        icon: 'pi pi-exclamation-triangle',
        color: 'text-yellow-500'
      },
      { 
        key: 'revision', 
        label: 'Revision', 
        icon: 'pi pi-refresh',
        color: 'text-purple-500'
      }
    ]
  }
});

// Explicit background/border based on color mode to avoid wrong dark bg in light mode
const containerBgClass = computed(() => {
  const isDark = colorMode?.value === 'dark'
  return isDark
    ? 'bg-grey-800 border border-grey-700'
    : 'bg-white border border-grey-200'
})

const getStepClasses = (step, index) => {
  const currentIndex = props.steps.findIndex(s => s.key === props.currentStatus);
  
  if (index < currentIndex) {
    // Completed steps
    return 'text-green-500';
  } else if (index === currentIndex) {
    // Current step - use primary-500 for active status
    return 'text-primary';
  } else {
    // Future steps
    return 'text-grey-400 dark:text-grey-500';
  }
};

const getLabelClasses = (step, index) => {
  const currentIndex = props.steps.findIndex(s => s.key === props.currentStatus);
  
  if (index < currentIndex) {
    // Completed steps
    return 'text-green-600 dark:text-green-400';
  } else if (index === currentIndex) {
    // Current step - use primary-500 for active status
    return 'text-primary font-semibold';
  } else {
    // Future steps
    return 'text-text-secondary';
  }
};

const getConnectorClasses = (index) => {
  const currentIndex = props.steps.findIndex(s => s.key === props.currentStatus);
  
  if (index < currentIndex) {
    // Completed connectors
    return 'bg-green-500';
  } else if (index === currentIndex - 1) {
    // Connector leading to current step - use primary-500
    return 'bg-primary';
  } else {
    // Future connectors
    return 'bg-grey-200 dark:bg-grey-700';
  }
};
</script>

<style scoped>
.status-tracker {
  @apply p-2 rounded-md;
}
</style>
