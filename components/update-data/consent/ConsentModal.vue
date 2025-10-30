<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto"
    @click.self="closeModal"
  >
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>

    <!-- Modal -->
    <div class="flex min-h-full items-center justify-center p-4">
      <div
        class="relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-white dark:bg-grey-800 shadow-xl transition-all"
        @click.stop
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-grey-200 dark:border-grey-700 px-6 py-4">
          <h3 class="text-lg font-semibold text-grey-900 dark:text-white">
            {{ isView ? 'View Consent' : (isEdit ? 'Edit Consent' : 'Create New Consent') }}
          </h3>
          <button
            @click="closeModal"
            class="text-grey-400 hover:text-grey-600 dark:hover:text-grey-300 transition-colors"
          >
            <i class="pi pi-times text-xl"></i>
          </button>
        </div>

        <!-- Content -->
        <div class="px-6 py-4">
          <!-- Draft Indicator -->
          <div v-if="hasDraft && !isEdit && !isView" class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i class="pi pi-info-circle text-blue-600 dark:text-blue-400"></i>
                <span class="text-sm text-blue-800 dark:text-blue-200">
                  Draft saved automatically. Your input will be preserved even if the modal is closed.
                </span>
              </div>
              <button
                type="button"
                @click="clearDraftAndReset"
                class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline"
                :disabled="isSubmitting"
              >
                Clear
              </button>
            </div>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-4">
            <!-- Title -->
            <div>
              <label class="block text-sm font-medium text-grey-700 dark:text-grey-300 mb-2">
                Consent Title <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.title"
                type="text"
                class="w-full px-3 py-2 border border-grey-300 dark:border-grey-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-grey-700 dark:text-white"
                placeholder="Enter consent title"
                required
                :disabled="isSubmitting || isView"
              />
            </div>

            <!-- Content -->
            <ConsentEditor
              v-if="isView"
              v-model="form.content"
              label="Consent Content"
              :disabled="true"
              :showToolbar="false"
              height="150px"
            />
            <ConsentEditor
              v-else
              v-model="form.content"
              label="Consent Content"
              placeholder="Enter consent content"
              :required="true"
              :disabled="isSubmitting"
              :showToolbar="true"
              height="150px"
            />

            <!-- Status -->
            <UiCheckbox
              v-model="form.isActive"
              label="Active Consent"
              :disabled="isSubmitting || isView"
            />
          </form>
        </div>

        <!-- Footer -->
        <div v-if="!isView" class="flex items-center justify-end gap-3 border-t border-grey-200 dark:border-grey-700 px-6 py-4">
          <UiButton
            type="button"
            variant="secondary"
            size="small"
            @click="closeModal"
            :disabled="isSubmitting"
          >
            Cancel
          </UiButton>
          <UiButton
            type="button"
            variant="primary"
            size="small"
            @click="handleSubmit"
            :disabled="isSubmitting || !isFormValid"
            class="flex items-center gap-2"
          >
            <i v-if="isSubmitting" class="pi pi-spin pi-spinner"></i>
            <i v-else class="pi pi-save"></i>
            {{ isSubmitting ? 'Saving...' : (isEdit ? 'Update' : 'Create') }}
          </UiButton>
        </div>
        
        <!-- View Mode Footer -->
        <div v-else class="flex items-center justify-end gap-3 border-t border-grey-200 dark:border-grey-700 px-6 py-4">
          <UiButton
            type="button"
            variant="primary"
            size="small"
            @click="closeModal"
            class="flex items-center gap-2"
          >
            <i class="pi pi-times"></i>
            Close
          </UiButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import ConsentEditor from './ConsentEditor.vue'
import { useConsent } from '~/composables/useConsent'

const props = defineProps({
  consent: {
    type: Object,
    default: null
  },
  isEdit: {
    type: Boolean,
    default: false
  },
  isView: {
    type: Boolean,
    default: false
  },
  isOpen: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['close', 'saved'])

// Composables
const { createConsent, updateConsent } = useConsent()

// isOpen is now a prop, no need for ref
const isSubmitting = ref(false)

const form = ref({
  title: '',
  content: '',
  isActive: true
})

const isFormValid = computed(() => {
  return form.value.title.trim() !== '' && form.value.content.trim() !== ''
})

// Draft storage key
const DRAFT_KEY = 'consent-form-draft'

// Load draft from localStorage
const loadDraft = () => {
  if (props.isEdit || props.isView) return // Don't load draft for edit or view mode
  
  try {
    const draft = localStorage.getItem(DRAFT_KEY)
    if (draft) {
      const parsedDraft = JSON.parse(draft)
      form.value = {
        title: parsedDraft.title || '',
        content: parsedDraft.content || '',
        isActive: parsedDraft.isActive !== undefined ? parsedDraft.isActive : true
      }
    }
  } catch (error) {
  }
}

// Save draft to localStorage
const saveDraft = () => {
  if (props.isEdit) return // Don't save draft for edit mode
  
  try {
    const draft = {
      title: form.value.title,
      content: form.value.content,
      isActive: form.value.isActive,
      timestamp: Date.now()
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch (error) {
  }
}

// Clear draft from localStorage
const clearDraft = () => {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch (error) {
  }
}

// Clear draft and reset form
const clearDraftAndReset = () => {
  clearDraft()
  form.value = {
    title: '',
    content: '',
    isActive: true
  }
}

// Watch for form changes to auto-save draft
watch(form, () => {
  if (!props.isEdit && !props.isView) {
    saveDraft()
  }
}, { deep: true })

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

const closeModal = () => {
  emit('close')
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  try {
    isSubmitting.value = true
    
    const consentData = {
      title: form.value.title,
      content: form.value.content,
      status: Number(form.value.isActive ? 1 : 0)
    }
    
    if (props.isEdit && props.consent) {
      // Update existing consent
      await updateConsent(props.consent.id_consent, consentData)
    } else {
      // Create new consent
      await createConsent(consentData)
    }
    
    // Clear draft after successful save
    clearDraft()
    
    emit('saved', consentData)
    
  } catch (error) {
  } finally {
    isSubmitting.value = false
  }
}

// Check if there's a draft available
const hasDraft = computed(() => {
  if (props.isEdit || props.isView) return false
  
  try {
    const draft = localStorage.getItem(DRAFT_KEY)
    if (draft) {
      const parsedDraft = JSON.parse(draft)
      return parsedDraft.title.trim() !== '' || parsedDraft.content.trim() !== ''
    }
  } catch (error) {
  }
  return false
})

// Load draft on mount
onMounted(() => {
  loadDraft()
})

// Cleanup on unmount
onUnmounted(() => {
  // Don't clear draft on unmount, let it persist
})
</script>