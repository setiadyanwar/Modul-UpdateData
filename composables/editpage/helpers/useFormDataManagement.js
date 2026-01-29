import { ref, computed } from 'vue'
import {
  mapAddress,
  mapPayroll,
  resolveAddress,
  resolvePayroll,
  resolveEducation,
  resolveEmergency,
  resolveFamily
} from '~/utils/dataResolver'

export function useFormDataManagement() {
  const tabHydrated = ref({})
  const editedFieldKeys = ref(new Set())
  const lastUserEditAt = ref(0)
  const needRevisionBaseline = ref(null)

  const USER_EDIT_GRACE_MS = 1200
  const arrayBasedTabs = ['emergency-contact', 'family', 'education']
  const forbiddenFields = ['name', 'nik', 'business_email']

  const defaultAddressFields = {
    detail_ktp: '',
    province_ktp_id: '',
    city_ktp_id: '',
    postal_code_ktp: '',
    sub_distric_ktp: '',
    administrative_village_ktp: '',
    rt_ktp: '',
    rw_ktp: '',
    street_name_ktp: '',
    house_number_ktp: '',
    detail_domicile: '',
    province_domicile_id: '',
    city_domicile_id: '',
    postal_code_domicile: '',
    sub_distric_domicile: '',
    administrative_village_domicile: '',
    rt_domicile: '',
    rw_domicile: '',
    street_name_domicile: '',
    house_number_domicile: '',
    is_domicile_same_as_ktp: false,
    has_domicile_address: false
  }

  const isWithinUserEditWindow = () => Date.now() - lastUserEditAt.value < USER_EDIT_GRACE_MS

  const setFormDataSafely = (formDataRef, newData) => {
    if (!newData || typeof newData !== 'object') return

    const currentData = formDataRef.value || {}
    const mergedData = { ...currentData, ...newData }

    formDataRef.value = mergedData
    lastUserEditAt.value = Date.now()
  }

  const assignFormData = (newData) => {
    if (!newData || typeof newData !== 'object') return {}

    return {
      ...newData,
      // Ensure address fields are properly structured
      ...defaultAddressFields,
      ...newData
    }
  }

  const mapApiToFormFields = (apiData, category) => {
    if (!apiData || typeof apiData !== 'object') return {}

    switch (category) {
      case 'basic-information':
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
          nationality: apiData.nationality || ''
        }

      case 'address':
        return {
          ...defaultAddressFields,
          detail_ktp: apiData.detail_ktp || apiData.official_address_detail || '',
          province_ktp_id: apiData.province_ktp_id || apiData.official_address_province || '',
          city_ktp_id: apiData.city_ktp_id || apiData.official_address_city || '',
          postal_code_ktp: apiData.postal_code_ktp || apiData.official_address_postal_code || '',
          sub_distric_ktp: apiData.sub_distric_ktp || apiData.official_address_subdistrict || '',
          administrative_village_ktp: apiData.administrative_village_ktp || apiData.official_address_administrative_village || '',
          rt_ktp: apiData.rt_ktp || apiData.official_address_rt || '',
          rw_ktp: apiData.rw_ktp || apiData.official_address_rw || '',
          detail_domicile: apiData.detail_domicile || apiData.domicile_address_detail || '',
          province_domicile_id: apiData.province_domicile_id || apiData.domicile_address_province || '',
          city_domicile_id: apiData.city_domicile_id || apiData.domicile_address_city || '',
          postal_code_domicile: apiData.postal_code_domicile || apiData.domicile_address_postal_code || '',
          sub_distric_domicile: apiData.sub_distric_domicile || apiData.domicile_address_subdistrict || '',
          administrative_village_domicile: apiData.administrative_village_domicile || apiData.domicile_address_administrative_village || '',
          rt_domicile: apiData.rt_domicile || apiData.domicile_address_rt || '',
          rw_domicile: apiData.rw_domicile || apiData.domicile_address_rw || '',
          is_domicile_same_as_ktp: apiData.is_domicile_same_as_ktp || false,
          has_domicile_address: apiData.has_domicile_address || false
        }

      case 'payroll-account':
        return {
          bank_name: apiData.bank_name || '',
          bank_account_number: apiData.bank_account_number || '',
          bank_account_holder_name: apiData.bank_account_holder_name || '',
          npwp: apiData.npwp || '',
          bpjs_kesehatan: apiData.bpjs_kesehatan || '',
          bpjs_ketenagakerjaan: apiData.bpjs_ketenagakerjaan || ''
        }

      case 'education':
        return Array.isArray(apiData) ? apiData.map(edu => ({
          edu_level_id: edu.edu_level_id || '',
          edu_institution_id: edu.edu_institution_id || '',
          edu_major_id: edu.edu_major_id || '',
          graduation_year: edu.graduation_year || '',
          graduation_year: edu.graduation_year || '',
          client_key: edu.client_key || generateClientKey()
        })) : []

      case 'emergency-contact':
        return Array.isArray(apiData) ? apiData.map(contact => ({
          emergency_name: contact.emergency_name || '',
          emergency_relationship: contact.emergency_relationship || '',
          emergency_phone: contact.emergency_phone || '',
          emergency_address: contact.emergency_address || '',
          client_key: contact.client_key || generateClientKey()
        })) : []

      case 'family':
        return Array.isArray(apiData) ? apiData.map(family => ({
          family_name: family.family_name || '',
          family_relationship: family.family_relationship || '',
          family_birth_date: family.family_birth_date || '',
          family_gender: family.family_gender || '',
          family_occupation: family.family_occupation || '',
          family_phone: family.family_phone || '',
          client_key: family.client_key || generateClientKey()
        })) : []

      default:
        return apiData
    }
  }

  const generateClientKey = () => {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
  }

  const mapBasicInfo = (src) => {
    if (!src || typeof src !== 'object') return {}

    return {
      nik: src.nik || '',
      name: src.name || '',
      no_ktp: src.no_ktp || '',
      business_email: src.business_email || '',
      birth_date: src.birth_date || '',
      birth_place: src.birth_place || '',
      gender: src.gender || '',
      marital_status: src.marital_status || '',
      religion: src.religion || '',
      nationality: src.nationality || '',
      blood_type: src.blood_type || '',
      phone_number: src.phone_number || src.phone || '',
      personal_email: src.personal_email || '',
      height: src.height || '',
      weight: src.weight || ''
    }
  }

  const mapAttachmentsToEducationRecords = (educationRecords, attachments) => {
    if (!Array.isArray(educationRecords) || !Array.isArray(attachments)) {
      return []
    }

    return attachments.filter(att => {
      if (!att || !att.client_key) return false
      return educationRecords.some(rec => rec && rec.client_key === att.client_key)
    })
  }

  const mapEducationArray = (dataArray) => {
    if (!Array.isArray(dataArray)) return []

    return dataArray.map(item => ({
      id_education: item.id_education || item.id,
      edu_level_id: item.edu_level_id || '',
      edu_level: item.edu_level || '',
      edu_major_id: item.edu_major_id || '',
      edu_major: item.edu_major || '',
      edu_institution_id: item.edu_institution_id || '',
      edu_institution: item.edu_institution || '',
      edu_start_date: item.edu_start_date || null,
      edu_end_date: item.edu_end_date || null,
      status: item.status !== undefined ? item.status : 1,
      client_key: item.client_key || generateClientKey()
    }))
  }

  const mapFamilyArray = (dataArray) => {
    if (!Array.isArray(dataArray)) return []

    return dataArray.map(item => {
      const mapped = {
        id_family: item.id_family || item.id,
        family_name: item.family_name || item.name || '',
        family_relationship: item.family_relationship || item.relationship || '',
        family_birth_date: item.family_birth_date || item.birth_date || null,
        family_gender: item.family_gender || item.gender || '',
        family_occupation: item.family_occupation || item.occupation || '',
        family_phone: item.family_phone || item.phone || '',
        marital_status: item.marital_status || '',
        marital_status_id: item.marital_status_id,
        status: item.status !== undefined ? item.status : 1,
        client_key: item.client_key || generateClientKey()
      }

      if (mapped.marital_status_id !== null && mapped.marital_status_id !== undefined) {
        const maritalStatusMap = {
          '0': 'SINGLE',
          '1': 'MARRIED',
          '2': 'DIVORCED',
          '3': 'WIDOWED'
        }
        mapped.marital_status = maritalStatusMap[String(mapped.marital_status_id)] || mapped.marital_status || ''
      }

      return mapped
    })
  }

  const mapEmergencyArray = (dataArray) => {
    if (!Array.isArray(dataArray)) return []

    return dataArray.map(item => ({
      id_emergency: item.id_emergency || item.id,
      emergency_name: item.emergency_name || item.name || '',
      emergency_relationship: item.emergency_relationship || item.relationship || '',
      emergency_phone: item.emergency_phone || item.phone || '',
      emergency_address: item.emergency_address || item.address || '',
      status: item.status !== undefined ? item.status : 1,
      client_key: item.client_key || generateClientKey()
    }))
  }

  const processComplexData = (activeTab, requestDetail, originalDataSources) => {
    if (!requestDetail || !activeTab) return null

    const status = requestDetail.status
    const statusLabel = requestDetail.status_label || ''
    const newData = requestDetail.new_data?.data || requestDetail.new_data

    if (status === 'draft' || status === '1' || statusLabel.toLowerCase() === 'draft') {
      const currentTabType = requestDetail.request_type
      const tabMapping = {
        'BSC': 'basic-information',
        'ADR': 'address',
        'EMC': 'emergency-contact',
        'PYR': 'payroll-account',
        'FMY': 'family',
        'EDC': 'education'
      }

      const targetTab = tabMapping[currentTabType]
      if (activeTab !== targetTab) return null

      if (newData) {
        switch (activeTab) {
          case 'basic-information':
            return mapBasicInfo(newData)
          case 'address':
            return mapAddress(newData)
          case 'payroll-account':
            return mapPayroll(newData)
          case 'education':
            return { education_records: mapEducationArray(Array.isArray(newData) ? newData : []) }
          case 'emergency-contact':
            return mapEmergencyArray(Array.isArray(newData) ? newData : [])
          case 'family':
            return mapFamilyArray(Array.isArray(newData) ? newData : [])
        }
      }
      return null
    }

    if (Array.isArray(newData)) {
      let processedNewData = newData
      if (activeTab === 'education') {
        processedNewData = newData.map(item => ({
          ...item,
          client_key: item.client_key || generateClientKey()
        }))
      } else if (activeTab === 'family') {
        processedNewData = newData.map(item => {
          const mapped = { ...item, client_key: item.client_key || generateClientKey() }
          if (mapped.marital_status_id !== null && mapped.marital_status_id !== undefined) {
            const maritalStatusMap = {
              '0': 'SINGLE', '1': 'MARRIED', '2': 'DIVORCED', '3': 'WIDOWED'
            }
            mapped.marital_status = maritalStatusMap[String(mapped.marital_status_id)] || mapped.marital_status || ''
          }
          return mapped
        })
      } else if (activeTab === 'emergency-contact') {
        processedNewData = newData.map(item => ({
          ...item,
          client_key: item.client_key || generateClientKey()
        }))
      }

      if (status === '3' || statusLabel.toLowerCase().includes('revision')) {
        let originalArrayData = []
        switch (activeTab) {
          case 'family':
            originalArrayData = originalDataSources.familyData || []
            break
          case 'education':
            originalArrayData = originalDataSources.educationData || []
            break
          case 'emergency-contact':
            originalArrayData = originalDataSources.emergencyContactData || []
            break
        }

        const mergedData = []
        processedNewData.forEach(newItem => {
          let recordId = null
          if (activeTab === 'education') {
            recordId = newItem.id_education || newItem.id
          } else if (activeTab === 'family') {
            recordId = newItem.id_family || newItem.id
          } else if (activeTab === 'emergency-contact') {
            recordId = newItem.id_emergency || newItem.id
          }

          const originalItem = originalArrayData.find(orig => {
            if (activeTab === 'education') {
              return (orig.id_education || orig.id) === recordId
            } else if (activeTab === 'family') {
              return (orig.id_family || orig.id) === recordId
            } else if (activeTab === 'emergency-contact') {
              return (orig.id_emergency || orig.id) === recordId
            }
            return false
          }) || {}

          const mergedItem = { ...originalItem, ...newItem }

          if (activeTab === 'family' && mergedItem.marital_status_id !== null && mergedItem.marital_status_id !== undefined) {
            const maritalStatusMap = {
              '0': 'SINGLE', '1': 'MARRIED', '2': 'DIVORCED', '3': 'WIDOWED'
            }
            mergedItem.marital_status = maritalStatusMap[String(mergedItem.marital_status_id)] || mergedItem.marital_status || ''
          }

          mergedData.push(mergedItem)
        })

        return mergedData
      }

      let originalArrayData = []
      switch (activeTab) {
        case 'family':
          originalArrayData = originalDataSources.familyData || []
          break
        case 'education':
          originalArrayData = originalDataSources.educationData || []
          break
        case 'emergency-contact':
          originalArrayData = originalDataSources.emergencyContactData || []
          break
      }

      const oldData = requestDetail.old_data || []
      let mergedData = processedNewData

      if (activeTab === 'education') {
        mergedData = resolveEducation(originalArrayData, oldData, processedNewData)
      } else if (activeTab === 'emergency-contact') {
        mergedData = resolveEmergency(originalArrayData, oldData, processedNewData)
      } else if (activeTab === 'family') {
        mergedData = resolveFamily(originalArrayData, oldData, processedNewData)
      }

      return mergedData
    }

    if (activeTab === 'family' && newData && !Array.isArray(newData)) {
      let familyArray = []
      if (newData.family && Array.isArray(newData.family)) {
        familyArray = newData.family
      } else if (newData.family_members && Array.isArray(newData.family_members)) {
        familyArray = newData.family_members
      } else if (Array.isArray(newData)) {
        familyArray = newData
      } else {
        familyArray = [newData]
      }

      if (familyArray.length > 0) {
        const originalArrayData = originalDataSources.familyData || []
        const mergedData = resolveFamily(originalArrayData, requestDetail.old_data?.family || [], familyArray)
        return mergedData
      }
    }

    if (requestDetail.old_data) {
      let oldDataArray = []
      switch (activeTab) {
        case 'family':
          oldDataArray = requestDetail.old_data.family || []
          break
        case 'education':
          oldDataArray = requestDetail.old_data.education || []
          break
        case 'emergency-contact':
          oldDataArray = requestDetail.old_data.emergency_contact || []
          break
      }

      if (Array.isArray(oldDataArray) && oldDataArray.length > 0) {
        if (activeTab === 'emergency-contact') {
          return mapEmergencyArray(oldDataArray)
        } else if (activeTab === 'family') {
          return mapFamilyArray(oldDataArray)
        } else if (activeTab === 'education') {
          return mapEducationArray(oldDataArray)
        }
      }
    }

    return []
  }

  const getFormConfig = (activeTab) => {
    const configs = {
      'basic-information': {
        type: 'object',
        fields: ['nik', 'name', 'business_email', 'birth_date', 'gender', 'marital_status'],
        component: 'EditDataBasicInformation'
      },
      'address': {
        type: 'object',
        fields: ['detail_ktp', 'province_ktp_id', 'city_ktp_id'],
        component: 'EditDataAddress'
      },
      'payroll-account': {
        type: 'object',
        fields: ['bank_name', 'bank_account_number', 'bank_account_holder_name'],
        component: 'EditDataPayrollAccount'
      },
      'education': {
        type: 'array',
        fields: ['edu_level_id', 'edu_institution_id', 'edu_major_id', 'graduation_year'],
        component: 'EditDataEducation'
      },
      'emergency-contact': {
        type: 'array',
        fields: ['emergency_name', 'emergency_phone', 'emergency_relationship'],
        component: 'EditDataEmergencyContact'
      },
      'family': {
        type: 'array',
        fields: ['family_name', 'family_relationship', 'family_birth_date'],
        component: 'EditDataFamily'
      }
    }

    return configs[activeTab] || { type: 'object', fields: [], component: 'div' }
  }

  // ===== DATA FILTERING FUNCTIONS =====

  /**
   * Filter forbidden fields from basic information data
   * @param {Object} data - Raw form data
   * @returns {Object} Filtered data
   */
  const filterBasicInformationFields = (data) => {
    const {
      // Remove forbidden fields (non-modifiable)
      name, nik, business_email,

      // Remove label fields (only send IDs)
      gender, marital_status, religion, nationality, clothing_size,

      // Remove other non-API fields
      employeeId, firstName, lastName, nationalId, place_of_birth,
      email, phone, dateOfBirth, photo, photo_ktp, professionalPhoto,

      // Keep only modifiable fields
      ...filteredData
    } = data

    return filteredData
  }

  /**
   * Filter forbidden fields from payroll account data
   * @param {Object} data - Raw form data
   * @returns {Object} Filtered data
   */
  const filterPayrollAccountFields = (data) => {
    const {
      // Remove label fields (only send IDs)
      bank, tax_status,

      // Remove document fields (view only)
      npwp_doc, saving_book_doc, npwp_doc_id, saving_book_doc_id,

      // Keep only modifiable fields
      ...filteredData
    } = data

    return filteredData
  }

  /**
   * Filter forbidden fields from family data
   * @param {Array} data - Raw form data array
   * @returns {Array} Filtered data array
   */
  const filterFamilyFields = (data) => {
    if (!Array.isArray(data)) return []

    return data.map(item => {
      const {
        // Remove label fields (only send IDs)
        gender, marital_status, relation,

        // Keep only modifiable fields
        ...filteredItem
      } = item

      return filteredItem
    })
  }

  /**
   * Filter forbidden fields from education data
   * @param {Array} data - Raw form data array
   * @returns {Array} Filtered data array
   */
  const filterEducationFields = (data) => {
    if (!Array.isArray(data)) return []

    return data.map(item => {
      const {
        // Remove label fields (only send IDs)
        degree, major, institution,

        // Keep only modifiable fields
        ...filteredItem
      } = item

      return filteredItem
    })
  }

  /**
   * Filter forbidden fields from emergency contact data
   * @param {Array} data - Raw form data array
   * @returns {Array} Filtered data array
   */
  const filterEmergencyContactFields = (data) => {
    if (!Array.isArray(data)) return []

    return data.map(item => {
      const {
        // Remove label fields (only send IDs)
        relationship,

        // Keep only modifiable fields
        ...filteredItem
      } = item

      return filteredItem
    })
  }

  /**
   * Get modifiable fields for specific category
   * @param {string} category - Category name
   * @returns {Array} List of modifiable field names
   */
  const getModifiableFields = (category) => {
    const fieldMappings = {
      'basic-information': [
        'main_phone_number', 'private_email', 'secondary_phone_number',
        'birth_date', 'birth_place', 'gender_id', 'marital_status_id',
        'religion_id', 'nationality_id', 'clothing_size_id', 'passport_number',
        'ktp_doc', 'no_ktp'
      ],
      'payroll-account': [
        'bank_id', 'account_number', 'account_holder_name',
        'tax_status_id', 'npwp_number', 'npwp_name'
      ],
      'address': [
        // Official address fields
        'official_address_detail', 'official_address_province', 'official_address_city',
        'official_address_postal_code', 'official_address_subdistrict', 'official_address_administrative_village',
        'official_address_rt', 'official_address_rw', 'official_address_street', 'official_address_phone',

        // Domicile address fields
        'domicile_address_detail', 'domicile_address_province', 'domicile_address_city',
        'domicile_address_postal_code', 'domicile_address_subdistrict', 'domicile_address_administrative_village',
        'domicile_address_rt', 'domicile_address_rw', 'domicile_address_street', 'domicile_address_phone'
      ],
      'family': [
        'name', 'birth_date', 'birth_place', 'address', 'occupation',
        'relation_id', 'marital_status_id', 'gender_id', 'member_sequence',
        'no_telkomedika', 'member_status', 'status'
      ],
      'education': [
        'degree_id', 'major_id', 'institution_id', 'graduation_year',
        'certificate_number', 'status'
      ],
      'emergency-contact': [
        'emgc_name', 'emgc_relationship_id', 'emgc_number', 'emgc_address', 'status'
      ],
      'medical-record': [
        'blood_type_id', 'health_status_id', 'allergies', 'medical_notes'
      ],
      'social-security': [
        'bpjs_kes_number', 'bpjs_tk_number', 'jht_number', 'jp_number'
      ]
    }

    return fieldMappings[category] || []
  }

  /**
   * Get filtering function for specific category
   * @param {string} category - Category name
   * @returns {Function} Filtering function
   */
  const getFilterFunction = (category) => {
    const filterFunctions = {
      'basic-information': filterBasicInformationFields,
      'payroll-account': filterPayrollAccountFields,
      'address': (data) => data, // Address fields are already properly mapped
      'family': filterFamilyFields,
      'education': filterEducationFields,
      'emergency-contact': filterEmergencyContactFields,
      'medical-record': filterBasicInformationFields, // Same as basic info
      'social-security': filterBasicInformationFields // Same as basic info
    }

    return filterFunctions[category] || (data => data)
  }

  /**
   * Check if field is a label field (should be filtered out)
   * @param {string} fieldName - Field name to check
   * @returns {boolean} True if field is a label field
   */
  const isLabelField = (fieldName) => {
    const labelFields = [
      'gender', 'marital_status', 'religion', 'nationality', 'clothing_size',
      'bank', 'tax_status', 'degree', 'major', 'institution', 'relationship',
      'blood_type', 'health_status'
    ]
    return labelFields.includes(fieldName)
  }

  /**
   * Check if field is a forbidden field (should be filtered out)
   * @param {string} fieldName - Field name to check
   * @param {string} category - Category name
   * @returns {boolean} True if field is forbidden
   */
  const isForbiddenField = (fieldName, category) => {
    const forbiddenFields = {
      'basic-information': ['name', 'nik', 'business_email', 'employeeId', 'firstName', 'lastName', 'nationalId', 'place_of_birth', 'email', 'phone', 'dateOfBirth', 'photo', 'photo_ktp', 'professionalPhoto'],
      'payroll-account': ['npwp_doc', 'saving_book_doc', 'npwp_doc_id', 'saving_book_doc_id'],
      'address': [],
      'family': [],
      'education': [],
      'emergency-contact': [],
      'medical-record': ['name', 'nik', 'business_email'],
      'social-security': ['name', 'nik', 'business_email']
    }

    const categoryForbiddenFields = forbiddenFields[category] || []
    return categoryForbiddenFields.includes(fieldName)
  }

  /**
   * Get only changed fields from current form data vs original data
   * @param {Object} currentData - Current form data
   * @param {Object} originalData - Original data for comparison
   * @param {string} category - Category name
   * @returns {Object} Object with newData and oldData containing only changed fields
   */
  const getChangedFieldsOnly = (currentData, originalData, category) => {

    // Filter current data based on category
    const filterFunction = getFilterFunction(category)
    const filteredCurrentData = filterFunction(currentData)

    const changedFields = {}
    const oldData = {}

    // Get modifiable fields for this category
    const modifiableFields = getModifiableFields(category)

    if (modifiableFields.length > 0) {
      // For categories with defined modifiable fields, only check those fields
      modifiableFields.forEach(field => {
        const currentValue = filteredCurrentData[field]
        const originalValue = originalData[field]

        // Only include if value has actually changed and is not empty
        if (currentValue !== originalValue &&
          currentValue !== undefined &&
          currentValue !== null &&
          currentValue !== '') {
          changedFields[field] = currentValue
          oldData[field] = originalValue || ''
        }
      })
    } else {
      // For categories without defined modifiable fields, check all fields but filter out label/forbidden fields
      Object.keys(filteredCurrentData).forEach(key => {
        // Skip label fields and forbidden fields
        if (isLabelField(key) || isForbiddenField(key, category)) {
          return
        }

        const currentValue = filteredCurrentData[key]
        const originalValue = originalData[key]

        if (currentValue !== originalValue &&
          currentValue !== undefined &&
          currentValue !== null &&
          currentValue !== '') {
          changedFields[key] = currentValue
          oldData[key] = originalValue || ''
        }
      })
    }


    return {
      newData: changedFields,
      oldData: oldData
    }
  }

  return {
    tabHydrated,
    editedFieldKeys,
    lastUserEditAt,
    needRevisionBaseline,
    USER_EDIT_GRACE_MS,
    arrayBasedTabs,
    forbiddenFields,
    defaultAddressFields,
    isWithinUserEditWindow,
    setFormDataSafely,
    assignFormData,
    mapApiToFormFields,
    generateClientKey,
    getFormConfig,
    mapAttachmentsToEducationRecords,
    mapEducationArray,
    mapFamilyArray,
    mapEmergencyArray,
    processComplexData,

    // Data filtering functions
    filterBasicInformationFields,
    filterPayrollAccountFields,
    filterFamilyFields,
    filterEducationFields,
    filterEmergencyContactFields,
    getModifiableFields,
    getFilterFunction,
    isLabelField,
    isForbiddenField,
    getChangedFieldsOnly
  }
}