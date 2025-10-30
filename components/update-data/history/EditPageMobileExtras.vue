<template>
  <div>
    <div v-if="showReason" class="lg:hidden mt-4 md:mt-6">
      <ChangeReasonSection :reason="reason" :reason-when-waiting="reasonWhenWaiting" :variant="'view'" />
    </div>
  </div>
</template>

<script setup>
import ChangeReasonSection from '~/components/update-data/modals/ChangeReasonSection.vue'

const props = defineProps({
  showReason: Boolean,
  reason: String,
  reasonWhenWaiting: String
})
</script>
