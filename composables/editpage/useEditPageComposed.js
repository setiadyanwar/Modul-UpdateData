import { ref, computed, shallowRef } from 'vue'
import { useRoute } from 'nuxt/app'

// Category composables
import { useEducation } from './categories/useEducation'
import { usePayroll } from './categories/usePayroll'
import { useEmergencyContact } from './categories/useEmergencyContact'
import { useFamily } from './categories/useFamily'

// Helper composables
import { useTabHelpers } from './helpers/useTabHelpers'
import { useFormatters } from './helpers/useFormatters'

// Feature composables
import { useDocumentManagement } from './documents/useDocumentManagement'
import { useModalManagement } from './modals/useModalManagement'
import { useFormValidation } from './validation/useFormValidation'
import { useEditPageApi } from './api/useEditPageApi'

// Existing composables
import { useFormDataManagement } from './helpers/useFormDataManagement'
import { useChangeDetection } from './helpers/useChangeDetection'
import { useBasicInformation } from './categories/useBasicInformation'
import { useAddress } from './categories/useAddress'

// External composables
import { useToast } from '~/composables/useToast'
import { useAuth } from '#imports'
import { useMasterData } from '~/composables/useMasterData'

export function useEditPageComposed() {
  const route = useRoute()
  const { user } = useAuth()
  const { success: toastSuccess, error: toastError, info: toastInfo, warning: toastWarning } = useToast()
  const { getOptions } = useMasterData()

  // Main state
  const requestDetail = ref(null)
  const categoryData = ref(null)
  const formData = ref({})
  const activeTab = ref('')
  const isInitializing = ref(true)
  const error = ref('')
  const consent = ref(false)

  // State tracking for form management
  const editedFieldKeys = ref(new Set())
  const needRevisionBaseline = ref(null)
  const lastUserEditAt = ref(0)
  const USER_EDIT_GRACE_MS = 1200

  // Reset function for debugging
  const resetState = () => {
    isInitializing.value = true
    error.value = ''
    requestDetail.value = null
    activeTab.value = ''
    
    // Reset state tracking
    editedFieldKeys.value.clear()
    needRevisionBaseline.value = null
    lastUserEditAt.value = 0

    // Force close all modals
    modalManagement.isChangeHistoryOpen.value = false
    modalManagement.isSubmitRevisionModalOpen.value = false
    modalManagement.isChangeRequestModalOpen.value = false

  }

  // Computed values
  const requestId = computed(() => {
    return route.params.id
  })

  const isDraft = computed(() => {
    if (!requestDetail.value) return true
    const status = requestDetail.value.status || requestDetail.value.status_raw
    return status === '1' || status === 1 || status === 'draft'
  })

  const displayRequestCode = computed(() => {
    return requestDetail.value?.request_code || requestDetail.value?.code || `REQ-${requestId.value}`
  })

  const reviewerName = computed(() => {
    // Priority: request_approver.name_approver (for Need Revision status)
    const approverName = requestDetail.value?.request_approver?.name_approver
    if (approverName) return approverName

    // Fallback to reviewer field
    return requestDetail.value?.reviewer?.name || 'Belum ditentukan'
  })

  const isEditDraftPage = computed(() => {
    return isDraft.value
  })

  // Use composed features
  const education = useEducation()
  const payroll = usePayroll()
  const emergencyContact = useEmergencyContact()
  const family = useFamily()
  const tabHelpers = useTabHelpers()
  const formatters = useFormatters()
  const documentManagement = useDocumentManagement()
  const modalManagement = useModalManagement()
  const formValidation = useFormValidation()
  const editPageApi = useEditPageApi()
  const formDataManagement = useFormDataManagement()
  const changeDetection = useChangeDetection()
  const basicInformation = useBasicInformation()
  const address = useAddress()

  // Extract functions from formDataManagement
  const { processComplexData } = formDataManagement

  // Tab configuration - will be computed in [id].vue with proper logic
  const dynamicTabs = computed(() => {
    // This will be overridden by [id].vue computed
    return []
  })

  const currentFormComponent = computed(() => {
    const tab = dynamicTabs.value.find(t => t.id === activeTab.value)
    return tab?.component || 'EditDataBasicInformation'
  })

  const hasValidFormData = computed(() => {
    if (!formData.value || typeof formData.value !== 'object') return false
    return Object.keys(formData.value).length > 0
  })

  const hasUnsavedChanges = computed(() => {
    return changeDetection.hasChanges(formData.value, requestDetail.value)
  })

  const canSubmit = computed(() => {
    return hasValidFormData.value && !editPageApi.isSubmitting.value
  })

  // Status steps (from original file)
  const statusSteps = computed(() => {
    if (!requestDetail.value) {
      return [
        { label: "Draft", icon: "pi pi-file", status: "current" },
        { label: "Submitted", icon: "pi pi-user", status: "pending" },
        { label: "Waiting Approval", icon: "pi pi-calendar", status: "pending" },
        { label: "Approved", icon: "pi pi-check", status: "pending" },
      ]
    }

    const currentStatus = requestDetail.value.status || "pending"

    if (currentStatus === "rejected" || currentStatus === "3") {
      return [
        { label: "Draft", icon: "pi pi-file", status: "completed" },
        { label: "Submitted", icon: "pi pi-user", status: "completed" },
        { label: "Needs Revision", icon: "pi pi-exclamation-triangle", status: "current" },
        { label: "Approved", icon: "pi pi-check", status: "pending" },
      ]
    } else if (currentStatus === "draft" || currentStatus === "1") {
      return [
        { label: "Draft", icon: "pi pi-file", status: "current" },
        { label: "Submitted", icon: "pi pi-user", status: "pending" },
        { label: "Waiting Approval", icon: "pi pi-calendar", status: "pending" },
        { label: "Approved", icon: "pi pi-check", status: "pending" },
      ]
    } else if (currentStatus === "in-review" || currentStatus === "waiting_approval" || currentStatus === "2") {
      return [
        { label: "Draft", icon: "pi pi-file", status: "completed" },
        { label: "Submitted", icon: "pi pi-user", status: "completed" },
        { label: "Waiting Approval", icon: "pi pi-calendar", status: "current" },
        { label: "Approved", icon: "pi pi-check", status: "pending" },
      ]
    } else if (currentStatus === "approved" || currentStatus === "completed" || currentStatus === "4") {
      return [
        { label: "Draft", icon: "pi pi-file", status: "completed" },
        { label: "Submitted", icon: "pi pi-user", status: "completed" },
        { label: "Waiting Approval", icon: "pi pi-calendar", status: "completed" },
        { label: "Approved", icon: "pi pi-check", status: "current" },
      ]
    } else {
      return [
        { label: "Draft", icon: "pi pi-file", status: "completed" },
        { label: "Submitted", icon: "pi pi-user", status: "completed" },
        { label: "Waiting Approval", icon: "pi pi-calendar", status: "current" },
        { label: "Approved", icon: "pi pi-check", status: "pending" },
      ]
    }
  })

  // Breadcrumb items
  const breadcrumbItems = computed(() => {
    const code = displayRequestCode.value || `REQ-${requestId.value}`
    return [
      { label: 'Update Data', href: '/update-data' },
      { label: 'Request History', href: '/update-data/history' },
      { label: `Edit Request (${code})`, href: `/update-data/edit/${requestId.value}`, current: true }
    ]
  })

  // Form data handlers
  const handleFormDataUpdate = (newData) => {
    formDataManagement.setFormDataSafely(formData, newData)
  }

  // Field edit tracking
  const trackFieldEdit = (fieldName, newValue, oldValue) => {
    if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      editedFieldKeys.value.add(fieldName)
      lastUserEditAt.value = Date.now()
    }
  }

  const isWithinUserEditWindow = () => {
    return Date.now() - lastUserEditAt.value < USER_EDIT_GRACE_MS
  }

  const clearEditedFields = () => {
    editedFieldKeys.value.clear()
    lastUserEditAt.value = 0
  }

  const setNeedRevisionBaseline = (baselineData) => {
    needRevisionBaseline.value = baselineData
  }

  const handleTabChange = (tabId) => {
    if (activeTab.value === tabId) return
    activeTab.value = tabId
  }

  // Modal handlers
  const openChangeHistory = () => modalManagement.openChangeHistory()
  const closeChangeHistory = () => modalManagement.closeChangeHistory()

  // Submit handlers
  const handleSaveAsDraft = async () => {
    try {
      await editPageApi.saveAsDraft(requestId.value, formData.value, activeTab.value)
    } catch (error) {
      // console.error('Save draft error:', error)
    }
  }

  const handleSubmitDirect = async () => {
    try {
      await editPageApi.submitForApproval(requestId.value, formData.value, activeTab.value)
    } catch (error) {
      // console.error('Submit error:', error)
    }
  }

  // Document handlers
  const {
    handleFilesChanged,
    handleUpload,
    handleDocumentDeleted,
    handleDocumentView,
    handleDocumentCountChanged,
    handlePendingUpload
  } = documentManagement

  // Field visibility
  const isFieldVisible = (fieldName) => {
    const forbiddenFields = ['name', 'nik', 'business_email']
    return !forbiddenFields.includes(fieldName)
  }

  return {
    // State
    requestDetail,
    categoryData,
    formData,
    activeTab,
    isInitializing,
    error,
    consent,

    // State tracking
    editedFieldKeys,
    needRevisionBaseline,
    lastUserEditAt,
    USER_EDIT_GRACE_MS,

    // Computed
    requestId,
    isDraft,
    displayRequestCode,
    reviewerName,
    isEditDraftPage,
    dynamicTabs,
    currentFormComponent,
    hasValidFormData,
    hasUnsavedChanges,
    canSubmit,
    statusSteps,
    breadcrumbItems,

    // Handlers
    handleFormDataUpdate,
    handleTabChange,
    openChangeHistory,
    closeChangeHistory,
    handleSaveAsDraft,
    handleSubmitDirect,
    handleFilesChanged,
    handleUpload,
    handleDocumentDeleted,
    handleDocumentView,
    handleDocumentCountChanged,
    handlePendingUpload,
    isFieldVisible,
    resetState,

    // State tracking functions
    trackFieldEdit,
    isWithinUserEditWindow,
    clearEditedFields,
    setNeedRevisionBaseline,

    // Features (return objects, not just functions)
    education,
    payroll,
    emergencyContact,
    family,
    tabHelpers,
    formatters,
    documentManagement,
    modalManagement,
    formValidation,
    editPageApi,
    formDataManagement,
    changeDetection,
    basicInformation,
    address
  }
}