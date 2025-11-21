import { ref, computed } from 'vue'
import { useAttachments } from '~/composables/useAttachments'

export function useDocumentManagement() {
  const { uploadAttachment } = useAttachments()

  const uploadedDocuments = ref([])
  const isUploading = ref(false)
  const documentCount = ref(0)
  const documentSectionKey = ref(0)
  const multiDocumentUploadKey = ref(0)
  const pendingUploads = ref([])
  const isDocumentPreviewOpen = ref(false)
  const previewDocumentUrl = ref('')
  const previewDocumentName = ref('')
  const previewItemId = ref('')

  const documentSectionRef = ref(null)
  const multiDocumentUploadRef = ref(null)

  const getCategoryDocumentTypes = (category) => {
    const documentTypes = {
      'basic-information': [
        { code: '3', name: 'KTP', required: true }
      ],
      'address': [
        { code: '3', name: 'KTP', required: true }
      ],
      'family': [
        { code: '2', name: 'KK', required: true }
      ],
      'payroll-account': [
        { code: '4', name: 'NPWP', required: true },
        { code: '7', name: 'Buku Tabungan (Saving Book)', required: true }
      ],
      'social-security': [
        { code: '6', name: 'BPJS', required: true },
        { code: '5', name: 'Telkomedika', required: true }
      ],
      'education': [
        { code: '8', name: 'Ijazah', required: true }
      ],
      'emergency-contact': []
    }
    return documentTypes[category] || []
  }

  const getDocumentIcon = (type) => {
    const icons = {
      'pdf': 'pi-file-pdf',
      'jpg': 'pi-image',
      'jpeg': 'pi-image',
      'png': 'pi-image',
    }
    return icons[type?.toLowerCase()] || 'pi-file'
  }

  const getMaxFiles = (tabName) => {
    const maxFiles = {
      'basic-information': 1, // Hanya KTP
      'address': 1, // Hanya KTP
      'payroll-account': 2, // NPWP + Saving Book
      'social-security': 2, // Telkomedika + BPJS
      'education': 3,
      'emergency-contact': 0,
      'family': 1 // Hanya KK
    }
    return maxFiles[tabName] || 1
  }

  const getRequiredDocuments = (tabName) => {
    return getCategoryDocumentTypes(tabName)
  }

  const getDocumentUploadTitle = (tabName) => {
    const titles = {
      'basic-information': 'Upload Supporting Documents',
      'address': 'Upload Address Documents',
      'payroll-account': 'Upload Payroll Documents',
      'education': 'Upload Education Documents',
      'emergency-contact': 'No documents required',
      'family': 'No documents required'
    }
    return titles[tabName] || 'Upload Documents'
  }

  const getDocumentUploadSubtitle = (tabName) => {
    const subtitles = {
      'basic-information': `Upload your <span class='text-primary-500 font-bold'>KTP</span> document (required)`,
      'address': `Upload your <span class='text-primary-500 font-bold'>KTP</span> document (required)`,
      'payroll-account': `Upload your <span class='text-primary-500 font-bold'>NPWP Document</span> and <span class='text-primary-500 font-bold'>Saving Book Document</span> (required)`,
      'social-security': `Upload your <span class='text-primary-500 font-bold'>Telkomedika Card Photo</span> and <span class='text-primary-500 font-bold'>BPJS Card Photo</span> (required)`,
      'education': `Upload your <span class='text-primary-500 font-bold'>Ijazah</span> document (required)`,
      'emergency-contact': '',
      'family': `Upload your <span class='text-primary-500 font-bold'>Family Card (KK)</span> document (required)`
    }
    return subtitles[tabName] || ''
  }

  const getRequiredDocumentCount = (tabName) => {
    const docTypes = getCategoryDocumentTypes(tabName)
    return Array.isArray(docTypes) ? docTypes.length : 0
  }

  const shouldShowTypeSelector = computed(() => {
    return true
  })

  const docTypeOptions = computed(() => {
    return [
      { label: 'KTP', value: 'KTP' },
      { label: 'Foto Diri', value: 'Foto Diri' },
      { label: 'Kartu Keluarga', value: 'Kartu Keluarga' },
      { label: 'Rekening Bank', value: 'Rekening Bank' },
      { label: 'NPWP', value: 'NPWP' },
      { label: 'BPJS Kesehatan', value: 'BPJS Kesehatan' },
      { label: 'BPJS Ketenagakerjaan', value: 'BPJS Ketenagakerjaan' },
      { label: 'Ijazah', value: 'Ijazah' },
      { label: 'Transkrip Nilai', value: 'Transkrip Nilai' },
      { label: 'Sertifikat', value: 'Sertifikat' }
    ]
  })

  const shouldLockType = computed(() => {
    // For now, keep it false - will be handled by props in MultiDocumentUpload
    return false
  })

  const lockedTypeValue = computed(() => {
    // For now, keep it null - will be handled by props in MultiDocumentUpload
    return null
  })

  const handleFilesChanged = (files) => {
    if (Array.isArray(files)) {
      pendingUploads.value = files
    }
  }

  const handleUpload = async (uploadData) => {
    try {
      isUploading.value = true
      const response = await uploadAttachment(uploadData)

      if (response && response.data) {
        uploadedDocuments.value.push(...response.data)
        documentCount.value = uploadedDocuments.value.length
        multiDocumentUploadKey.value++
      }

      return response
    } catch (error) {
      // console.error('Upload error:', error)
      throw error
    } finally {
      isUploading.value = false
    }
  }

  const handleDocumentDeleted = (event) => {
    const { itemId, documentId } = event
    // Use itemId (from DocumentSection) or documentId (fallback) for filtering
    const idToFilter = itemId || documentId
    uploadedDocuments.value = uploadedDocuments.value.filter(doc =>
      (doc.item_id || doc.id) !== idToFilter
    )
    documentCount.value = uploadedDocuments.value.length
  }

  const handleDocumentView = (doc) => {
    previewDocumentUrl.value = doc.file_url || doc.url
    previewDocumentName.value = doc.file_name || doc.name
    previewItemId.value = doc.item_id || doc.id
    isDocumentPreviewOpen.value = true
  }

  const handleDocumentCountChanged = (count) => {
    documentCount.value = count
  }

  const handlePendingUpload = (event) => {
    if (event && event.files) {
      pendingUploads.value = event.files
    }
  }

  const checkRequiredDocuments = () => {
    return {
      isValid: true,
      missingDocuments: []
    }
  }

  return {
    // State
    uploadedDocuments,
    isUploading,
    documentCount,
    documentSectionKey,
    multiDocumentUploadKey,
    pendingUploads,
    isDocumentPreviewOpen,
    previewDocumentUrl,
    previewDocumentName,
    previewItemId,
    documentSectionRef,
    multiDocumentUploadRef,

    // Computed
    shouldShowTypeSelector,
    docTypeOptions,
    shouldLockType,
    lockedTypeValue,

    // Methods
    getCategoryDocumentTypes,
    getDocumentIcon,
    getMaxFiles,
    getRequiredDocuments,
    getDocumentUploadTitle,
    getDocumentUploadSubtitle,
    getRequiredDocumentCount,
    handleFilesChanged,
    handleUpload,
    handleDocumentDeleted,
    handleDocumentView,
    handleDocumentCountChanged,
    handlePendingUpload,
    checkRequiredDocuments
  }
}