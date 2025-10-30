<template>
  <div>
    <!-- Breadcrumb -->
    <UiBreadcrumb :items="breadcrumbItems" class="mb-6" />

    <!-- Header Section -->
    <div class="mb-8">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-main dark:text-white mb-2">
            Consent Management
          </h1>
          <p class="text-grey-600 dark:text-grey-400">
            Manage consent for your personal data usage
          </p>
        </div>
        <div v-if="consents.length > 0" class="flex items-center gap-3">
          <UiButton
            @click="openCreateModal"
            variant="primary"
            size="small"
            class="flex items-center gap-2"
          >
            <i class="pi pi-plus"></i>
            Add Consent
          </UiButton>
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

    <!-- Consent List -->
    <ConsentTable
      v-else
      :consents="consents"
      @view="handleView"
      @edit="handleEdit"
      @refresh="loadConsents"
    />

    <!-- Create/View Modal -->
    <ConsentModal
      v-if="showModal"
      :is-open="showModal"
      :consent="selectedConsent"
      :is-view="isViewMode"
      @close="closeModal"
      @saved="handleConsentSaved"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useConsent } from '~/composables/useConsent'
import { useToast } from '~/composables/useToast'
import ConsentTable from '~/components/update-data/consent/ConsentTable.vue'
import ConsentModal from '~/components/update-data/consent/ConsentModal.vue'

// Meta
definePageMeta({
  layout: 'update-data',
  middleware: 'auth'
})

// Composables
const { showToast } = useToast()
const { 
  consents,
  isLoading: isLoadingConsents,
  getConsents,
  createConsent,
  updateConsent,
  getConsentStatus,
  getConsentStatusVariant,
  formatDate
} = useConsent()

// State
const showModal = ref(false)
const selectedConsent = ref(null)
const isViewMode = ref(false)

// Computed
const isLoading = computed(() => isLoadingConsents.value)

const breadcrumbItems = computed(() => [
  { label: 'Home', href: '/' },
  { label: 'Update Data', href: '/update-data' },
  { label: 'Consent Management', href: '/update-data/consent' }
])

// Methods
const loadConsents = async () => {
  try {
    await getConsents()
  } catch (error) {
  }
}

const openCreateModal = () => {
  selectedConsent.value = null
  isViewMode.value = false
  showModal.value = true
}

const handleView = (consent) => {
  selectedConsent.value = consent
  isViewMode.value = true
  showModal.value = true
}

const handleEdit = (consent) => {
  // Navigate to edit page
  navigateTo(`/update-data/consent/edit/${consent.id_consent}`)
}


const closeModal = () => {
  showModal.value = false
  selectedConsent.value = null
  isViewMode.value = false
}

const handleConsentSaved = async () => {
  showModal.value = false
  selectedConsent.value = null
  isViewMode.value = false
  await loadConsents()
}


// Lifecycle
onMounted(() => {
  loadConsents()
})

// Auto-reload when coming back with refresh query
const route = useRoute()
watch(
  () => route.query.refresh,
  async (val, oldVal) => {
    if (val && val !== oldVal) {
      await loadConsents()
    }
  },
  { immediate: false }
)
</script>

<style scoped>
/* Empty - no custom styles needed */
</style>