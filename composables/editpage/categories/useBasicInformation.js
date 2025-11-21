import { ref } from 'vue'
import { usePersonalData } from '~/composables/usePersonalData'
import { useToast } from '~/composables/useToast'

export function useBasicInformation() {
  const { error: toastError } = useToast()

  const personalData = usePersonalData()
  const {
    employeeData,
    originalData: originalEmployeeData,
    loadBasicInformation,
  } = personalData

  const basicInfoRef = ref(null)
  const editDataBasicInfoRef = ref(null)
  const isLoadingBasicInfo = ref(false)
  const basicInfoLoaded = ref(false)
  const professionalPhotoFile = ref(null)

  const basicInformationTabConfig = {
    id: "basic-information",
    label: "Basic Information",
    icon: "pi-user",
    component: 'EditDataBasicInformation',
  }

  const getBasicInformationTabIcon = () => 'pi-user'

  const mapBasicInformationApiToFormFields = (apiData) => {
    return {
      nik: apiData.nik || '',
      name: apiData.name || '',
      no_ktp: apiData.no_ktp || '',
      business_email: apiData.business_email || '',
      birth_date: apiData.birth_date || '',
      birth_place: apiData.birth_place || '',
      gender: apiData.gender || '',
      marital_status: apiData.marital_status || '',
      religion: apiData.religion || '',
      nationality: apiData.nationality || '',
      blood_type: apiData.blood_type || '',
      phone_number: apiData.phone_number || '',
      personal_email: apiData.personal_email || '',
      height: apiData.height || '',
      weight: apiData.weight || ''
    }
  }

  const mapBasicInformationFormToAPI = (formData) => {
    return {
      nik: formData.nik || '',
      name: formData.name || '',
      no_ktp: formData.no_ktp || '',
      business_email: formData.business_email || '',
      birth_date: formData.birth_date || '',
      birth_place: formData.birth_place || '',
      gender: formData.gender || '',
      marital_status: formData.marital_status || '',
      religion: formData.religion || '',
      nationality: formData.nationality || '',
      blood_type: formData.blood_type || '',
      phone_number: formData.phone_number || '',
      personal_email: formData.personal_email || '',
      height: formData.height || '',
      weight: formData.weight || ''
    }
  }

  const validateBasicInformation = (basicData) => {
    const errors = []

    if (!basicData.name?.trim()) {
      errors.push('Name is required')
    }

    if (!basicData.nik?.trim()) {
      errors.push('NIK is required')
    } else if (basicData.nik.length !== 16) {
      errors.push('NIK must be 16 digits')
    }

    if (!basicData.business_email?.trim()) {
      errors.push('Business email is required')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(basicData.business_email)) {
      errors.push('Business email format is invalid')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  const getBasicInformationRequiredDocuments = () => [
    'KTP',
    'Foto Diri'
  ]

  const loadBasicInformationData = async (requestId) => {
    try {
      isLoadingBasicInfo.value = true
      await loadBasicInformation()
      basicInfoLoaded.value = true
    } catch (error) {
      // console.error('Error loading basic information:', error)
      toastError('Failed to load basic information')
    } finally {
      isLoadingBasicInfo.value = false
    }
  }

  const handleProfessionalPhotoUpload = (photoData) => {
    professionalPhotoFile.value = photoData
  }

  return {
    // State
    employeeData,
    originalEmployeeData,
    basicInfoRef,
    editDataBasicInfoRef,
    isLoadingBasicInfo,
    basicInfoLoaded,
    professionalPhotoFile,

    // Config
    basicInformationTabConfig,

    // Methods
    getBasicInformationTabIcon,
    mapBasicInformationApiToFormFields,
    mapBasicInformationFormToAPI,
    validateBasicInformation,
    getBasicInformationRequiredDocuments,
    loadBasicInformationData,
    handleProfessionalPhotoUpload,
    loadBasicInformation
  }
}