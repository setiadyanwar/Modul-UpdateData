<template>
  <div class="bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700">
    <div class="p-3 md:p-4 border-b border-grey-200 dark:border-grey-700 flex items-center justify-between">
      <h3 class="font-semibold text-text-main text-sm md:text-base">
        Documents
      </h3>
    </div>
    
    <div class="p-3 md:p-4 space-y-3 md:space-y-4">
      <!-- Loading skeleton -->
      <div v-if="isDeleting" class="space-y-2">
        <div class="grid grid-cols-1 gap-3">
          <div v-for="i in 2" :key="i" class="animate-pulse">
            <div class="flex items-center justify-between p-3 bg-grey-100 dark:bg-grey-700 rounded-md">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-grey-300 dark:bg-grey-600 rounded"></div>
                <div class="space-y-2">
                  <div class="h-4 bg-grey-300 dark:bg-grey-600 rounded w-32"></div>
                  <div class="h-3 bg-grey-300 dark:bg-grey-600 rounded w-20"></div>
                </div>
              </div>
              <div class="w-6 h-6 bg-grey-300 dark:bg-grey-600 rounded"></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Document attachments section -->
      <div v-else-if="documentAttachments.length > 0">
        <div class="space-y-2">
          <div class="grid grid-cols-1 gap-3">
            <DocumentItem
              v-for="(attachment, index) in documentAttachments"
              :key="attachment.id || index"
              :attachment="attachment"
              :can-delete="canDelete"
              :record-info="getRecordInfo(attachment, index)"
              @view="$emit('view', $event)"
              @delete="handleDelete"
            />
          </div>
        </div>
      </div>
      
      <!-- Empty state with primary actions -->
      <div v-else class="text-center py-8 text-grey-500 dark:text-grey-400">
        <i class="pi pi-file text-3xl mb-2"></i>
        <p class="text-sm mb-3">No attachments available</p>
        <div class="flex items-center justify-center gap-3">
          <p class="text-sm text-grey-500">No actions available</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { useMasterData } from '~/composables/useMasterData'
import DocumentItem from './DocumentItem.vue'
import { formatFileSize } from "~/composables/useTextFormatting.js"
import { useApi } from "~/composables/useApi.js"
import { useToast } from "~/composables/useToast.js"

const { apiDelete } = useApi()
const { success: toastSuccess, error: toastError } = useToast()

// Loading state for delete operations
const isDeleting = ref(false)

// Local state for documents to handle immediate removal
const localDocuments = ref([])

const props = defineProps({
  requestDetail: { type: Object, default: null },
  requestData: { type: Object, default: null },
  canDelete: { type: Boolean, default: false },
  originalEducationData: { type: Array, default: () => [] }
})

const emit = defineEmits(['view', 'deleted', 'documentCountChanged'])

// Delete function - now integrated in the component
const handleDelete = async (attachment) => {
  const itemId = attachment.item_id || attachment.id
  
  if (!itemId) {
    toastError('Cannot delete: No file ID found')
    return
  }

  // Show confirmation dialog
  const confirmed = confirm(`Are you sure you want to delete "${attachment.name || attachment.filename || 'this document'}"?`)
  if (!confirmed) return

  try {
    // Set loading state
    isDeleting.value = true
    
    
    // Make API call to delete document using the correct endpoint and method
    const response = await apiDelete(`/employee/attachments/${itemId}/delete`)
    
    if (response.success || response.status) {
      toastSuccess('Document deleted successfully')
      
      // Immediately remove document from local state for instant UI update
      localDocuments.value = localDocuments.value.filter(doc => 
        (doc.item_id || doc.id) !== itemId
      )
      
      // Keep loading state for a moment to show skeleton effect
      setTimeout(() => {
        isDeleting.value = false
        // Emit deleted event to parent AFTER skeleton effect to ensure accurate refresh
        emit('deleted', { itemId, attachment })
      }, 1500) // 1.5 seconds skeleton effect
    } else {
      throw new Error(response.message || 'Failed to delete document')
    }
  } catch (error) {
    toastError(error.message || 'Failed to delete document. Please try again.')
    
    // Reset loading state on error
    isDeleting.value = false
  }
}

// Helper function to get all document attachments from various sources
const getDocumentAttachments = () => {
  // Extract attachments from API response format
  const attachments = props.requestDetail?.attachments || []
  const files = props.requestDetail?.files || []
  const documents = props.requestDetail?.documents || []
  
  // Also check props.requestData for fallback
  const propAttachments = props.requestData?.attachments || []
  const propFiles = props.requestData?.files || []
  const propDocuments = props.requestData?.documents || []
  
  // Combine all sources and remove duplicates
  const allAttachments = [
    ...attachments,
    ...files,
    ...documents,
    ...propAttachments,
    ...propFiles,
    ...propDocuments
  ]
  
  // Remove duplicates based on item_id, id, or name
  const uniqueAttachments = allAttachments.filter((attachment, index, self) => {
    const id = attachment.item_id || attachment.id || attachment.name || attachment.filename || attachment.file_name
    return id && self.findIndex(a => (a.item_id || a.id || a.name || a.filename || a.file_name) === id) === index
  })
  
  // Normalize attachment format for display
  const normalizedAttachments = uniqueAttachments.map((att, index) => ({
    id: att.item_id || att.id,
    item_id: att.item_id,
    name: att.file_name || att.name || att.filename || `Document ${index + 1}`,
    filename: att.file_name || att.name || att.filename,
    file_name: att.file_name || att.name || att.filename,
    size: att.file_size || att.size,
    file_size: att.file_size || att.size,
    file_size_display: att.file_size_display || (att.file_size ? formatFileSize(att.file_size) : ''),
    type: att.document_type ? `Document Type ${att.document_type}` : (att.type || 'Document'),
    document_type: att.document_type,
    uploaded_date: att.uploaded_date || att.created_date,
    client_key: att.client_key,
    // Keep original data for actions
    originalData: att
  }))
  
  return normalizedAttachments
}

// Use local documents if available, otherwise fallback to computed
const documentAttachments = computed(() => {
  if (localDocuments.value.length > 0) {
    return localDocuments.value
  }
  return getDocumentAttachments()
})

// Computed property for document count
const documentCount = computed(() => {
  return documentAttachments.value.length
})

// Watch document count changes and emit event
watch(documentCount, (newCount) => {
  emit('documentCountChanged', newCount)
}, { immediate: true })

// Initialize local documents when props change
watch(() => [props.requestDetail, props.requestData], () => {
  localDocuments.value = getDocumentAttachments()
}, { immediate: true, deep: true })

// Get master data for education levels and institutions
const { getOptions } = useMasterData()

// Cache for master data to avoid repeated calls
const masterDataCache = ref({
  eduLevels: [],
  eduMajors: [],
  eduInstitutions: []
})

// Load master data on component mount
const loadMasterData = async () => {
  try {
    
    // Load education levels
    const levelData = await getOptions('EDU_LEVELS')
    masterDataCache.value.eduLevels = Array.isArray(levelData) ? levelData : []
    
    // Load education majors
    const majorData = await getOptions('EDU_MAJORS')
    masterDataCache.value.eduMajors = Array.isArray(majorData) ? majorData : []
    
    // Load education institutions
    const institutionData = await getOptions('EDU_INSTITUTIONS')
    masterDataCache.value.eduInstitutions = Array.isArray(institutionData) ? institutionData : []
    
  } catch (error) {
  }
}

// Load master data when component mounts
onMounted(() => {
  loadMasterData()
})

// Get record information for education attachments by client_key
const getRecordInfo = (attachment, index) => {
  
  // Only show record info for education category
  const updateCategory = props.requestDetail?.update?.toLowerCase()
  const categories = props.requestDetail?.categories || []
  const isEducationCategory = updateCategory === 'education' || categories.includes('education') || categories.includes('Education')
  
  if (!isEducationCategory) {
    return null
  }
  
  // Get education records from old_data or new_data
  // For education, data might be directly in oldData/newData arrays, not in .education property
  let educationRecords = []
  
  // Determine which data to use based on request status
  const requestStatus = props.requestDetail?.status?.toLowerCase()
  const isDraftMode = requestStatus === '1' || requestStatus === 'draft'
  const isNeedRevision = requestStatus === '2' || requestStatus === 'need revision'
  
  
  // Priority: new_data > originalEducationData > old_data
  if (Array.isArray(props.requestDetail?.new_data?.data) && props.requestDetail.new_data.data.length > 0) {
    const newItem = props.requestDetail.new_data.data[0]
    if (newItem && (newItem.edu_level_id || newItem.edu_major_id || newItem.edu_institution_id)) {
      educationRecords = [...props.requestDetail.new_data.data] // Create a copy
    }
  }
  
  // If no new_data, try originalEducationData (for edit page) - but only if it has education fields
  if (educationRecords.length === 0 && Array.isArray(props.originalEducationData) && props.originalEducationData.length > 0) {
    const firstItem = props.originalEducationData[0]
    if (firstItem && (firstItem.edu_level_id || firstItem.edu_major_id || firstItem.edu_institution_id)) {
      educationRecords = [...props.originalEducationData] // Create a copy
    }
  }
  
  // If still no data, try old_data (for ViewDataModal)
  if (educationRecords.length === 0 && Array.isArray(props.requestDetail?.old_data) && props.requestDetail.old_data.length > 0) {
    const firstItem = props.requestDetail.old_data[0]
    // Check if old_data has education fields (edu_level_id, edu_major_id, edu_institution_id)
    if (firstItem && (firstItem.edu_level_id || firstItem.edu_major_id || firstItem.edu_institution_id)) {
      educationRecords = [...props.requestDetail.old_data] // Create a copy
    }
  }
  
  // Last fallback: old_data.education
  if (educationRecords.length === 0 && props.requestDetail?.old_data?.education) {
    educationRecords = [...props.requestDetail.old_data.education] // Create a copy
  }
  
  // Debug: Check if we have valid education records with required fields
  if (educationRecords.length > 0) {
    const firstRecord = educationRecords[0]
  }
  
  // For draft/need revision mode, overlay new_data changes on top of old_data
  if ((isDraftMode || isNeedRevision) && educationRecords.length > 0 && Array.isArray(props.requestDetail?.new_data?.data) && props.requestDetail.new_data.data.length > 0) {
    const newRecord = props.requestDetail.new_data.data[0]
    const baseRecord = educationRecords[0]
    
    // Overlay new_data changes on top of old_data
    if (newRecord && baseRecord) {
      // Only update fields that exist in new_data
      if (newRecord.edu_level_id !== undefined) {
        baseRecord.edu_level_id = newRecord.edu_level_id
      }
      if (newRecord.edu_major_id !== undefined) {
        baseRecord.edu_major_id = newRecord.edu_major_id
      }
      if (newRecord.edu_institution_id !== undefined) {
        baseRecord.edu_institution_id = newRecord.edu_institution_id
      }
      if (newRecord.edu_start_date !== undefined) {
        baseRecord.edu_start_date = newRecord.edu_start_date
      }
      if (newRecord.edu_end_date !== undefined) {
        baseRecord.edu_end_date = newRecord.edu_end_date
      }
      if (newRecord.status !== undefined) {
        baseRecord.status = newRecord.status
      }
    }
  }
  
  // Find matching education record by client_key instead of using index
  if (educationRecords.length > 0 && attachment.client_key) {
    const matchingRecord = educationRecords.find(record => record.client_key === attachment.client_key)
    
    if (matchingRecord) {
      // Try to get level and institution names from various possible sources
      let levelName = null
      let institutionName = null

      // First try direct field names
      if (matchingRecord.edu_level_name || matchingRecord.edu_level || matchingRecord.level_name || matchingRecord.level) {
        const value = matchingRecord.edu_level_name || matchingRecord.edu_level || matchingRecord.level_name || matchingRecord.level
        // Check if it's not just an ID (not purely numeric)
        if (value && !String(value).match(/^\d+$/)) {
          levelName = value
        }
      }
      if (matchingRecord.edu_institution_name || matchingRecord.edu_institution || matchingRecord.institution_name || matchingRecord.institution) {
        const value = matchingRecord.edu_institution_name || matchingRecord.edu_institution || matchingRecord.institution_name || matchingRecord.institution
        // Check if it's not just an ID (not purely numeric)
        if (value && !String(value).match(/^\d+$/)) {
          institutionName = value
        }
      }

      // Try to get names from master data
      if (!levelName && matchingRecord.edu_level_id) {

        const levelData = masterDataCache.value.eduLevels.find(level => {
          return String(level.code) === String(matchingRecord.edu_level_id) || String(level.id) === String(matchingRecord.edu_level_id)
        })

        if (levelData) {
          levelName = levelData.value || levelData.label || levelData.name || levelData.text
        }
      }

      // Check for institution first (if available)
      if (!institutionName && matchingRecord.edu_institution_id) {

        const institutionData = masterDataCache.value.eduInstitutions.find(institution => {
          return String(institution.code) === String(matchingRecord.edu_institution_id) || String(institution.id) === String(matchingRecord.edu_institution_id)
        })

        if (institutionData) {
          institutionName = institutionData.value || institutionData.label || institutionData.name || institutionData.text
        }
      }

      // Fallback to major if no institution available
      if (!institutionName && matchingRecord.edu_major_id) {

        const majorData = masterDataCache.value.eduMajors.find(major => {
          return String(major.code) === String(matchingRecord.edu_major_id) || String(major.id) === String(matchingRecord.edu_major_id)
        })

        if (majorData) {
          institutionName = majorData.value || majorData.label || majorData.name || majorData.text
        }
      }

      // Calculate record number
      const recordNumber = educationRecords.indexOf(matchingRecord) + 1

      // Build display text with fallback to "Education 1", "Education 2", etc
      let displayText
      if (levelName && institutionName) {
        displayText = `${levelName} | ${institutionName}`
      } else if (levelName) {
        displayText = levelName
      } else if (institutionName) {
        displayText = institutionName
      } else {
        // Fallback to "Education 1", "Education 2", etc
        displayText = `Education ${recordNumber}`
      }

      const result = {
        recordNumber,
        level: levelName || `Education ${recordNumber}`,
        institution: institutionName || '',
        displayText
      }
      
      return result
    } else {
    }
  }
  
  return null
}
</script>