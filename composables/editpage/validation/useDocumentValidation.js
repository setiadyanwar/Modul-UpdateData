import { computed } from 'vue'

/**
 * Composable for document validation logic in edit page
 * Handles validation for attachments and uploaded documents
 */
export const useDocumentValidation = ({
  requestDetail,
  activeTab,
  uploadedDocuments,
  documentCount
}) => {
  // Check if request has existing attachments
  const hasExistingAttachments = computed(() => {
    const attachments = requestDetail.value?.attachments || requestDetail.value?.documents || []
    return Array.isArray(attachments) && attachments.length > 0
  })

  // Check if there are uploaded files via MultiDocumentUpload
  const hasUploadedFiles = computed(() => {
    const hasMultiUploadFiles = (uploadedDocuments.value?.length || 0) > 0
    return hasMultiUploadFiles
  })

  // Combined validation: attachments + uploaded files
  const hasValidFormData = computed(() => {
    if (!activeTab.value) {
      return false
    }

    // For payroll-account and social-security: check doc types (need 2 specific types)
    if (['payroll-account', 'social-security'].includes(activeTab.value)) {
      const existingDocs = requestDetail.value?.attachments || requestDetail.value?.documents || []
      const existingDocTypes = existingDocs.map(doc => String(doc.document_type || doc.documentType))

      // For payroll-account: need both '4' (NPWP) and '7' (Buku Tabungan)
      // For social-security: need both '5' (BPJS) and '6' (Telkomedika)
      const requiredDocTypes = activeTab.value === 'payroll-account' ? ['4', '7'] : ['5', '6']
      const hasAllRequired = requiredDocTypes.every(type => existingDocTypes.includes(type))

      return hasAllRequired
    }

    // For other categories: simple count check
    return documentCount.value > 0
  })

  // Check if attachments/uploads meet requirements
  const hasDataChanges = computed(() => {
    return hasExistingAttachments.value || hasUploadedFiles.value
  })

  return {
    hasExistingAttachments,
    hasUploadedFiles,
    hasValidFormData,
    hasDataChanges
  }
}
