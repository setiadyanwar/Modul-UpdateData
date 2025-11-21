import { ref } from 'vue'
import { usePersonalData } from '~/composables/usePersonalData'
import { useToast } from '~/composables/useToast'

export function useAddress() {
  const { error: toastError } = useToast()

  const personalData = usePersonalData()
  const {
    addressData,
    originalAddressData,
    loadAddress
  } = personalData

  const addressRef = ref(null)
  const editDataAddressRef = ref(null)
  const isLoadingAddress = ref(false)
  const addressLoaded = ref(false)

  const addressTabConfig = {
    title: 'Address',
    icon: 'pi-home',
    category: 'address',
    hasDocuments: true,
    requiresKTP: true
  }

  const getAddressTabIcon = () => 'pi pi-home'

  const mapAddressApiToFormFields = (apiData) => {
    if (!apiData || typeof apiData !== 'object') return {}

    return {
      // Official address fields (from KTP)
      official_address_detail: apiData.detail_ktp || apiData.official_address_detail || '',
      official_address_province: apiData.province_ktp_id || apiData.official_address_province || '',
      official_address_city: apiData.city_ktp_id || apiData.official_address_city || '',
      official_address_postal_code: apiData.postal_code_ktp || apiData.official_address_postal_code || '',
      official_address_subdistrict: apiData.sub_distric_ktp || apiData.official_address_subdistrict || '',
      official_address_administrative_village: apiData.administrative_village_ktp || apiData.official_address_administrative_village || '',
      official_address_rt: apiData.rt_ktp || apiData.official_address_rt || '',
      official_address_rw: apiData.rw_ktp || apiData.official_address_rw || '',
      official_address_street_name: apiData.street_name_ktp || apiData.official_address_street_name || '',
      official_address_house_number: apiData.house_number_ktp || apiData.official_address_house_number || '',

      // Domicile address fields
      domicile_address_detail: apiData.detail_domicile || apiData.domicile_address_detail || '',
      domicile_address_province: apiData.province_domicile_id || apiData.domicile_address_province || '',
      domicile_address_city: apiData.city_domicile_id || apiData.domicile_address_city || '',
      domicile_address_postal_code: apiData.postal_code_domicile || apiData.domicile_address_postal_code || '',
      domicile_address_subdistrict: apiData.sub_distric_domicile || apiData.domicile_address_subdistrict || '',
      domicile_address_administrative_village: apiData.administrative_village_domicile || apiData.domicile_address_administrative_village || '',
      domicile_address_rt: apiData.rt_domicile || apiData.domicile_address_rt || '',
      domicile_address_rw: apiData.rw_domicile || apiData.domicile_address_rw || '',
      domicile_address_street_name: apiData.street_name_domicile || apiData.domicile_address_street_name || '',
      domicile_address_house_number: apiData.house_number_domicile || apiData.domicile_address_house_number || '',

      // Flags
      is_domicile_same_as_ktp: apiData.is_domicile_same_as_ktp || false,
      has_domicile_address: apiData.has_domicile_address || false
    }
  }

  const mapAddressFormToAPI = (formData) => {
    if (!formData || typeof formData !== 'object') return {}

    return {
      // KTP address fields (API format)
      detail_ktp: formData.official_address_detail || '',
      province_ktp_id: formData.official_address_province || '',
      city_ktp_id: formData.official_address_city || '',
      postal_code_ktp: formData.official_address_postal_code || '',
      sub_distric_ktp: formData.official_address_subdistrict || '',
      administrative_village_ktp: formData.official_address_administrative_village || '',
      rt_ktp: formData.official_address_rt || '',
      rw_ktp: formData.official_address_rw || '',
      street_name_ktp: formData.official_address_street_name || '',
      house_number_ktp: formData.official_address_house_number || '',

      // Domicile address fields (API format)
      detail_domicile: formData.domicile_address_detail || '',
      province_domicile_id: formData.domicile_address_province || '',
      city_domicile_id: formData.domicile_address_city || '',
      postal_code_domicile: formData.domicile_address_postal_code || '',
      sub_distric_domicile: formData.domicile_address_subdistrict || '',
      administrative_village_domicile: formData.domicile_address_administrative_village || '',
      rt_domicile: formData.domicile_address_rt || '',
      rw_domicile: formData.domicile_address_rw || '',
      street_name_domicile: formData.domicile_address_street_name || '',
      house_number_domicile: formData.domicile_address_house_number || '',

      // Flags
      is_domicile_same_as_ktp: formData.is_domicile_same_as_ktp || false,
      has_domicile_address: formData.has_domicile_address || false
    }
  }

  const validateAddress = (addressData) => {
    const errors = []

    // KTP Address validation
    if (!addressData.official_address_detail?.trim()) {
      errors.push('KTP address detail is required')
    }

    if (!addressData.official_address_province) {
      errors.push('KTP province is required')
    }

    if (!addressData.official_address_city) {
      errors.push('KTP city is required')
    }

    // Domicile Address validation (if different from KTP)
    if (addressData.has_domicile_address && !addressData.is_domicile_same_as_ktp) {
      if (!addressData.domicile_address_detail?.trim()) {
        errors.push('Domicile address detail is required')
      }

      if (!addressData.domicile_address_province) {
        errors.push('Domicile province is required')
      }

      if (!addressData.domicile_address_city) {
        errors.push('Domicile city is required')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  const getAddressRequiredDocuments = () => [
    'KTP',
    'Kartu Keluarga'
  ]

  const loadAddressData = async () => {
    try {
      isLoadingAddress.value = true
      await loadAddress()
      addressLoaded.value = true
    } catch (error) {
      // console.error('Error loading address:', error)
      toastError('Failed to load address data')
    } finally {
      isLoadingAddress.value = false
    }
  }

  const fetchMissingAddressData = async () => {
    // Implementasi untuk fetch missing address data jika diperlukan
    try {
      await loadAddressData()
    } catch (error) {
      // console.error('Error fetching missing address data:', error)
    }
  }

  return {
    // State
    addressData,
    originalAddressData,
    addressRef,
    editDataAddressRef,
    isLoadingAddress,
    addressLoaded,

    // Config
    addressTabConfig,

    // Methods
    getAddressTabIcon,
    mapAddressApiToFormFields,
    mapAddressFormToAPI,
    validateAddress,
    getAddressRequiredDocuments,
    loadAddressData,
    fetchMissingAddressData,
    loadAddress
  }
}