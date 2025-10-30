<template>
  <div class="bg-card-bg rounded-lg border border-grey-200 dark:border-grey-700 p-8">
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Consent Title -->
      <UiInput
        v-model="form.title"
        label="Consent Title"
        placeholder="Enter consent title"
        :disabled="isSubmitting"
        required
      />

      <!-- Consent Description -->
      <ConsentEditor
        v-model="form.content"
        label="Consent Description"
        placeholder="Describe the consent details that will be given..."
        :required="true"
        :disabled="isSubmitting"
        height="200px"
      />

      <!-- Consent Status -->
      <UiCheckbox
        v-model="form.isActive"
        label="Active Consent"
        :disabled="isSubmitting"
      />

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-4 pt-6 border-t border-grey-200 dark:border-grey-700">
        <UiButton
          type="submit"
          variant="primary"
          size="small"
          :disabled="isSubmitting || !isFormValid"
          class="flex items-center gap-2"
        >
          <i v-if="isSubmitting" class="pi pi-spin pi-spinner"></i>
          <i v-else class="pi pi-save"></i>
          {{ isSubmitting ? 'Saving...' : submitText }}
        </UiButton>
        
        <UiButton
          type="button"
          variant="secondary"
          size="small"
          @click="$emit('cancel')"
          :disabled="isSubmitting"
          class="flex items-center gap-2"
        >
          <i class="pi pi-times"></i>
          Cancel
        </UiButton>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import ConsentEditor from './ConsentEditor.vue'

const props = defineProps({
  consent: {
    type: Object,
    default: null
  },
  isSubmitting: {
    type: Boolean,
    default: false
  },
  submitText: {
    type: String,
    default: 'Save Consent'
  }
})

const emit = defineEmits(['submit', 'cancel'])


const form = ref({
  title: '',
  content: '',
  isActive: true
})

const isFormValid = computed(() => {
  return form.value.title.trim() !== '' && form.value.content.trim() !== ''
})

// Watch for consent changes
watch(() => props.consent, (newConsent) => {
  if (newConsent) {
    form.value = {
      title: newConsent.title || '',
      content: newConsent.content || '',
      isActive: newConsent.status === 1 || newConsent.is_active === true
    }
    
  }
}, { immediate: true })

const handleSubmit = () => {
  if (!isFormValid.value) return
  
  emit('submit', form.value)
}

</script>

<style scoped>
/* Empty - using PrimeVue Editor styles */
</style>
