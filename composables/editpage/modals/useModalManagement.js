import { ref } from 'vue'

export function useModalManagement() {
  const isChangeHistoryOpen = ref(false)
  const isSubmitRevisionModalOpen = ref(false)
  const isChangeRequestModalOpen = ref(false)
  const isInsertRequestModalOpen = ref(false)
  const isUnsavedChangesModalOpen = ref(false)
  const pendingNavigation = ref(null)
  const pendingInsertData = ref(null)
  const modalDataForSubmit = ref({ data: null, changes: null })

  const openChangeHistory = () => {
    isChangeHistoryOpen.value = true
  }

  const closeChangeHistory = () => {
    isChangeHistoryOpen.value = false
  }

  const openSubmitRevisionModal = (data, changes) => {
    modalDataForSubmit.value = { data, changes }
    isSubmitRevisionModalOpen.value = true
  }

  const closeSubmitRevisionModal = () => {
    isSubmitRevisionModalOpen.value = false
    modalDataForSubmit.value = { data: null, changes: null }
  }

  const openChangeRequestModal = () => {
    isChangeRequestModalOpen.value = true
  }

  const closeChangeRequestModal = () => {
    isChangeRequestModalOpen.value = false
  }

  const openInsertRequestModal = (insertData) => {
    pendingInsertData.value = insertData
    isInsertRequestModalOpen.value = true
  }

  const closeInsertRequestModal = () => {
    isInsertRequestModalOpen.value = false
    pendingInsertData.value = null
  }

  const openUnsavedChangesModal = (navigation) => {
    pendingNavigation.value = navigation
    isUnsavedChangesModalOpen.value = true
  }

  const closeUnsavedChangesModal = () => {
    isUnsavedChangesModalOpen.value = false
    pendingNavigation.value = null
  }

  const handleOpenChangeRequestModal = () => {
    openChangeRequestModal()
  }

  const handleViewPrivacy = () => {
    // Handle privacy view logic
  }

  return {
    // State
    isChangeHistoryOpen,
    isSubmitRevisionModalOpen,
    isChangeRequestModalOpen,
    isInsertRequestModalOpen,
    isUnsavedChangesModalOpen,
    pendingNavigation,
    pendingInsertData,
    modalDataForSubmit,

    // Methods
    openChangeHistory,
    closeChangeHistory,
    openSubmitRevisionModal,
    closeSubmitRevisionModal,
    openChangeRequestModal,
    closeChangeRequestModal,
    openInsertRequestModal,
    closeInsertRequestModal,
    openUnsavedChangesModal,
    closeUnsavedChangesModal,
    handleOpenChangeRequestModal,
    handleViewPrivacy
  }
}