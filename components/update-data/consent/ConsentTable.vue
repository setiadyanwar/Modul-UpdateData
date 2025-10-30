<template>
  <div class="bg-card-bg rounded-lg border border-grey-200 dark:border-grey-700 overflow-hidden">
    <!-- Table Header -->
    <div class="px-6 py-4 border-b border-grey-200 dark:border-grey-700">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-grey-900 dark:text-white">
          Consents ({{ consents.length }})
        </h3>
        <div class="flex items-center gap-2">
          <UiButton
            @click="$emit('refresh')"
            variant="secondary"
            size="small"
            class="flex items-center gap-2"
          >
            <i class="pi pi-refresh"></i>
            Refresh
          </UiButton>
        </div>
      </div>
    </div>

    <!-- Table Content -->
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-grey-50 dark:bg-grey-800">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-grey-500 dark:text-grey-400 uppercase tracking-wider">
              Title
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-grey-500 dark:text-grey-400 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-grey-500 dark:text-grey-400 uppercase tracking-wider">
              Created
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-grey-500 dark:text-grey-400 uppercase tracking-wider">
              Updated
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-grey-500 dark:text-grey-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-grey-700 divide-y divide-grey-200 dark:divide-grey-600">
          <tr
            v-for="consent in consents"
            :key="consent.id_consent"
            class="hover:bg-grey-50 dark:hover:bg-grey-600 transition-colors"
          >
            <!-- Title -->
            <td class="px-6 py-4">
              <div class="flex items-start">
                <div class="flex-1 min-w-0">
                  <h4 class="text-sm font-medium text-grey-900 dark:text-white truncate">
                    {{ consent.title || 'Untitled Consent' }}
                  </h4>
                  <div 
                    class="text-xs text-grey-500 dark:text-grey-400 mt-1 line-clamp-2"
                    v-html="getContentPreview(consent.content)"
                  ></div>
                </div>
              </div>
            </td>

            <!-- Status -->
            <td class="px-6 py-4">
              <span 
                :class="consent.status === 1 
                  ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700' 
                  : 'bg-grey-50 text-grey-700 border border-grey-200 dark:bg-grey-700 dark:text-grey-300 dark:border-grey-600'"
                class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium"
              >
                {{ consent.status === 1 ? 'Active' : 'Inactive' }}
              </span>
            </td>

            <!-- Created Date -->
            <td class="px-6 py-4 whitespace-nowrap text-sm text-grey-500 dark:text-grey-400">
              {{ formatDate(consent.created_date) }}
            </td>

            <!-- Updated Date -->
            <td class="px-6 py-4 whitespace-nowrap text-sm text-grey-500 dark:text-grey-400">
              {{ formatDate(consent.updated_date) }}
            </td>

            <!-- Actions -->
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex items-center justify-end gap-1">
                <!-- View Button -->
                <button
                  @click="$emit('view', consent)"
                  class="inline-flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 rounded-md transition-colors"
                  title="View Consent"
                >
                  <i class="pi pi-eye text-xs"></i>
                </button>

                <!-- Edit Button -->
                <button
                  @click="$emit('edit', consent)"
                  class="inline-flex items-center justify-center w-6 h-6 bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 text-green-600 dark:text-green-400 rounded-md transition-colors"
                  title="Edit Consent"
                >
                  <i class="pi pi-pencil text-xs"></i>
                </button>

                <!-- Status Toggle -->
                <button
                  @click="toggleStatus(consent)"
                  :class="consent.status === 1 
                    ? 'bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 text-green-600 dark:text-green-400' 
                    : 'bg-grey-100 dark:bg-grey-700 hover:bg-grey-200 dark:hover:bg-grey-600 text-grey-600 dark:text-grey-400'"
                  class="inline-flex items-center justify-center w-6 h-6 rounded-md transition-all duration-200 hover:scale-105 active:scale-95"
                  :title="consent.status === 1 ? 'Deactivate Consent' : 'Activate Consent'"
                >
                  <i :class="consent.status === 1 ? 'pi pi-check text-xs' : 'pi pi-times text-xs'"></i>
                </button>

              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile List View -->
    <div v-if="consents.length > 0" class="lg:hidden px-6">
      <div class="space-y-4">
        <div
          v-for="consent in consents"
          :key="consent.id_consent"
          class="bg-white dark:bg-grey-800 border border-grey-200 dark:border-grey-700 rounded-md p-4 space-y-3 hover:bg-grey-50 dark:hover:bg-grey-800 transition-colors"
        >
          <!-- Header with title and status -->
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-medium text-grey-900 dark:text-white truncate">
                {{ consent.title || 'Untitled Consent' }}
              </h4>
              <div 
                class="text-xs text-grey-500 dark:text-grey-400 mt-1 line-clamp-2"
                v-html="getContentPreview(consent.content)"
              ></div>
            </div>
            <StatusBadge
              :status="getConsentStatus(consent)"
              :variant="getConsentStatusVariant(consent)"
            />
          </div>

          <!-- Created and Updated Date -->
          <div class="flex items-center justify-between text-xs text-grey-500">
            <span>Created: {{ formatDate(consent.created_date) }}</span>
            <span>Updated: {{ formatDate(consent.updated_date) }}</span>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-2 pt-2 border-t border-grey-100 dark:border-grey-700">
            <button
              @click="$emit('view', consent)"
              class="inline-flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 rounded-md transition-colors"
              title="View Consent"
            >
              <i class="pi pi-eye text-sm"></i>
            </button>
            <button
              @click="$emit('edit', consent)"
              class="inline-flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 text-green-600 dark:text-green-400 rounded-md transition-colors"
              title="Edit Consent"
            >
              <i class="pi pi-pencil text-sm"></i>
            </button>
            <button
              @click="toggleStatus(consent)"
              :class="consent.status === 1 
                ? 'bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 text-green-600 dark:text-green-400' 
                : 'bg-grey-100 dark:bg-grey-700 hover:bg-grey-200 dark:hover:bg-grey-600 text-grey-600 dark:text-grey-400'"
              class="inline-flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200 hover:scale-105 active:scale-95"
              :title="consent.status === 1 ? 'Deactivate Consent' : 'Activate Consent'"
            >
              <i :class="consent.status === 1 ? 'pi pi-check text-sm' : 'pi pi-times text-sm'"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="consents.length === 0" class="p-12 text-center">
      <i class="pi pi-inbox text-4xl text-grey-400 dark:text-grey-500 mb-4"></i>
      <h3 class="text-lg font-medium text-grey-900 dark:text-grey-100 mb-2">
        No consents found
      </h3>
      <p class="text-grey-600 dark:text-grey-400">
        There are no consents to display at the moment.
      </p>
    </div>
  </div>
</template>

<script setup>
import StatusBadge from '~/components/update-data/status/StatusBadge.vue'
import { useConsent } from '~/composables/useConsent'
import { useToast } from '~/composables/useToast'

const props = defineProps({
  consents: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['view', 'edit', 'refresh'])

// Composables
const { 
  getConsentStatus, 
  getConsentStatusVariant, 
  formatDate,
  updateConsentStatus 
} = useConsent()

const { warning: toastWarning } = useToast()

// Methods
const getContentPreview = (content) => {
  if (!content) return 'No content'
  
  // Remove HTML tags and get first 100 characters
  const textContent = content.replace(/<[^>]*>/g, '')
  return textContent.length > 100 
    ? textContent.substring(0, 100) + '...'
    : textContent
}

const toggleStatus = async (consent) => {
  try {
    const newStatus = consent.status === 1 ? 0 : 1
    // Prevent activating more than one consent at a time
    if (newStatus === 1) {
      const anotherActive = (props.consents || []).some(c => c && c.id_consent !== consent.id_consent && c.status === 1)
      if (anotherActive) {
        toastWarning('Only one consent can be active at a time')
        return
      }
    }
    const action = newStatus === 1 ? 'activated' : 'deactivated'
    
    // Show immediate visual feedback
    consent.status = newStatus
    
    await updateConsentStatus(consent.id_consent, newStatus)
    
    // Emit refresh to update the list
    emit('refresh')
  } catch (error) {
    // Revert the status change on error
    consent.status = consent.status === 1 ? 0 : 1
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>