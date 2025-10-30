<template>
  <div class="flex items-center gap-3">
    <UiButton
      variant="outline"
      size="small"
      class="w-fit whitespace-nowrap"
      @click="$emit('openChangeHistory')"
    >
      <i class="pi pi-clock mr-2"></i>
      Change Logs
    </UiButton>
    
    <UiButton
      v-if="canEdit"
      variant="secondary"
      size="small"
      class="w-fit whitespace-nowrap"
      @click="$emit('handleEdit')"
    >
      <i class="pi pi-pencil mr-2"></i>
      Edit
    </UiButton>
  </div>
</template>

<script setup>
const props = defineProps({
  canEdit: { type: Boolean, default: false }
})

defineEmits(['openChangeHistory', 'handleEdit'])
</script>
