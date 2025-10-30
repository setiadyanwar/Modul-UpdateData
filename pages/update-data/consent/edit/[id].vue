<template>
  <div>
    <!-- Breadcrumb -->
    <UiBreadcrumb :items="breadcrumbItems" class="mb-6" />

    <!-- Header Section -->
    <div class="mb-8">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-main dark:text-white mb-2">
            Edit Consent
          </h1>
          <p class="text-grey-600 dark:text-grey-400">
            Edit consent for personal data usage
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span 
            v-if="consent"
            :class="consent.status === 1 
              ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700' 
              : 'bg-grey-50 text-grey-700 border border-grey-200 dark:bg-grey-700 dark:text-grey-300 dark:border-grey-600'"
            class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium"
          >
            {{ consent.status === 1 ? 'Active' : 'Inactive' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-6">
      <div class="bg-card-bg rounded-lg border border-grey-200 dark:border-grey-700 p-8">
        <div class="animate-pulse">
          <div class="space-y-6">
            <div class="h-6 bg-grey-200 dark:bg-grey-700 rounded w-48"></div>
            <div class="space-y-4">
              <div class="h-4 bg-grey-200 dark:bg-grey-700 rounded w-full"></div>
              <div class="h-4 bg-grey-200 dark:bg-grey-700 rounded w-3/4"></div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="h-10 bg-grey-200 dark:bg-grey-700 rounded"></div>
              <div class="h-10 bg-grey-200 dark:bg-grey-700 rounded"></div>
            </div>
            <div class="h-24 bg-grey-200 dark:bg-grey-700 rounded"></div>
            <div class="h-10 bg-grey-200 dark:bg-grey-700 rounded w-32"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Consent Form -->
    <div v-else-if="consent" class="bg-card-bg rounded-lg border border-grey-200 dark:border-grey-700 p-8">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Consent Title -->
        <div class="relative">
          <UiInput
            v-model="form.title"
            label="Consent Title"
            placeholder="Enter consent title"
            :disabled="isSubmitting"
            required
          />
          <div 
            v-if="form.title !== originalForm.title"
            class="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"
            title="This field has been modified"
          ></div>
        </div>

        <!-- Consent Description -->
        <div class="relative">
          <ConsentEditor
            v-model="form.content"
            label="Consent Content"
            :required="true"
            :disabled="isSubmitting"
            height="200px"
          />
          <div 
            v-if="form.content !== originalForm.content"
            class="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"
            title="This field has been modified"
          ></div>
        </div>

        <!-- Consent Status -->
        <div class="flex items-center space-x-2 relative">
          <UiCheckbox
            id="isActive"
            v-model="isActiveCheckbox"
            :disabled="isSubmitting"
            :label="'Active Consent'"
          />
          <div 
            v-if="form.status !== originalForm.status"
            class="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"
            title="This field has been modified"
          ></div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 pt-6 border-t border-grey-200 dark:border-grey-700">
          <UiButton
            type="submit"
            variant="primary"
            size="small"
            :disabled="isSubmitting || !isFormValid || !hasChanges"
            class="flex items-center gap-2"
          >
            <i v-if="isSubmitting" class="pi pi-spin pi-spinner"></i>
            <i v-else class="pi pi-save"></i>
            {{ isSubmitting ? 'Saving...' : hasChanges ? 'Update Consent' : 'No Changes' }}
          </UiButton>
          
          <UiButton
            type="button"
            variant="secondary"
            size="small"
            @click="goBack"
            :disabled="isSubmitting"
            class="flex items-center gap-2"
          >
            <i class="pi pi-arrow-left"></i>
            Back
          </UiButton>
        </div>
      </form>
    </div>

    <!-- Not Found -->
    <div v-else class="text-center py-12">
      <i class="pi pi-exclamation-triangle text-4xl text-grey-400 dark:text-grey-500 mb-4"></i>
      <h3 class="text-lg font-medium text-grey-900 dark:text-grey-100 mb-2">
        Consent Not Found
      </h3>
      <p class="text-grey-600 dark:text-grey-400 mb-4">
        The consent you are looking for was not found or has been deleted.
      </p>
      <UiButton
        @click="goBack"
        variant="primary"
        size="small"
        class="flex items-center gap-2"
      >
        <i class="pi pi-arrow-left"></i>
        Back to List
      </UiButton>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useConsent } from '~/composables/useConsent'
import { useToast } from '~/composables/useToast'
import ConsentEditor from '~/components/update-data/consent/ConsentEditor.vue'
import UiCheckbox from '~/components/ui/Checkbox.vue'

// Meta
definePageMeta({
  layout: 'update-data',
  middleware: 'rbac',
  permissions: ['manage_consent']
})

// Get route params
const route = useRoute()
const consentId = route.params.id

// Composables
const { showToast } = useToast()
const { 
  consents,
  getConsents,
  updateConsent,
  getConsentById,
  getConsentStatus,
  getConsentStatusVariant
} = useConsent()

// State
const isLoading = ref(false)
const isSubmitting = ref(false)
const consent = ref(null)

// Form data
const form = ref({
  title: '',
  content: '',
  status: 1
})

// Original form data for comparison
const originalForm = ref({
  title: '',
  content: '',
  status: 1
})

// Separate ref for checkbox to ensure reactivity
const isActiveCheckbox = ref(true)

// Computed
const isFormValid = computed(() => {
  return form.value.title.trim() !== '' && form.value.content.trim() !== ''
})

// Prepare form data for submission - send all fields but null unchanged ones
const changedFields = computed(() => {
  const changes = {
    title: form.value.title !== originalForm.value.title ? form.value.title : null,
    content: form.value.content !== originalForm.value.content ? form.value.content : null,
    status: form.value.status !== originalForm.value.status ? form.value.status : null
  }
  
  return changes
})

// Check if form has any changes
const hasChanges = computed(() => {
  return form.value.title !== originalForm.value.title ||
         form.value.content !== originalForm.value.content ||
         form.value.status !== originalForm.value.status
})

const breadcrumbItems = computed(() => [
  { label: 'Home', href: '/' },
  { label: 'Update Data', href: '/update-data' },
  { label: 'Consent Management', href: '/update-data/consent' },
  { label: 'Edit Consent', href: `/update-data/consent/edit/${consentId}` }
])

// Methods
const loadConsent = async () => {
  try {
    isLoading.value = true
    
    // Load all consents first
    await getConsents()
    
    // Find the specific consent
    const foundConsent = getConsentById(consentId)
    
    if (foundConsent) {
      consent.value = foundConsent
      populateForm(foundConsent)
    } else {
      consent.value = null
    }
    
  } catch (error) {
    showToast('Failed to load consent data', 'error')
  } finally {
    isLoading.value = false
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value) {
    showToast('Please complete all required fields', 'error')
    return
  }

  // Check if there are any changes
  if (!hasChanges.value) {
    showToast('No changes detected', 'info')
    return
  }

  try {
    isSubmitting.value = true
    
    // Only send changed fields
    const consentData = changedFields.value
    
    
    await updateConsent(consentId, consentData)
    
    // Update original form data after successful update
    originalForm.value = {
      title: form.value.title,
      content: form.value.content,
      status: form.value.status
    }
    
    // Navigate back to list with refresh flag so index reloads data
    await navigateTo({ path: '/update-data/consent', query: { refresh: Date.now().toString() } })
    
  } catch (error) {
    showToast('Failed to update consent', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const populateForm = (consentData) => {
  // Preserve 0 from DB; only default to 1 when status is null/undefined
  const status = consentData.status !== null && consentData.status !== undefined
    ? Number(consentData.status)
    : 1
  
  form.value = {
    title: consentData.title || '',
    content: consentData.content || '',
    status: status
  }
  
  // Set the separate checkbox ref
  isActiveCheckbox.value = status === 1
  
  // Set original form data for comparison
  originalForm.value = {
    title: consentData.title || '',
    content: consentData.content || '',
    status: status
  }
  
}

const goBack = () => {
  navigateTo('/update-data/consent')
}

// Watchers
watch(() => isActiveCheckbox.value, (newValue) => {
  form.value.status = newValue ? 1 : 0
})

// Watch form.status changes
watch(() => form.value.status, (newValue) => {
  isActiveCheckbox.value = newValue === 1
})

// Lifecycle
onMounted(() => {
  loadConsent()
})
</script>

<style scoped>
/* Empty - no custom styles needed */
</style>