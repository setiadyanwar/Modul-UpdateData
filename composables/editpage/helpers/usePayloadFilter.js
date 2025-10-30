export function usePayloadFilter() {

  /**
   * Filter basic information fields untuk hanya mengirim field yang diubah dan diperbolehkan
   * @param {Object} currentData - Data form saat ini
   * @param {Object} originalData - Data original untuk perbandingan
   * @returns {Object} Filtered payload with only changed allowed fields
   */
  const filterBasicInformationPayload = (currentData, originalData) => {
    // Field yang diperbolehkan untuk basic information (sesuai backup file)
    const allowedFields = [
      'main_phone_number', 'private_email', 'secondary_phone_number',
      'birth_date', 'birth_place', 'gender_id', 'marital_status_id',
      'religion_id', 'nationality_id', 'clothing_size_id', 'passport_number',
      'no_ktp'
    ]

    // Field yang HARUS dihilangkan dari payload - TAMBAH LEBIH BANYAK FORBIDDEN FIELDS
    const forbiddenFields = [
      'name', 'nik', 'business_email', 'employeeId', 'firstName', 'lastName',
      'nationalId', 'place_of_birth', 'email', 'phone', 'dateOfBirth',
      'photo', 'photo_ktp', 'professionalPhoto', 'professional_photo',
      'employee_name', 'ktp_doc', // TAMBAHAN
      // Label fields (hanya kirim ID)
      'gender', 'marital_status', 'religion', 'nationality', 'clothing_size'
    ]

    const changedFields = {}
    const oldFields = {}


    // STRICT FILTERING: First remove ALL forbidden fields from currentData
    const cleanCurrentData = {}
    const cleanOriginalData = {}

    // Only copy allowed fields, exclude forbidden fields completely
    // Process both current and original data with same logic
    allowedFields.forEach(field => {
      if (!forbiddenFields.includes(field)) {
        // Get value from current data
        cleanCurrentData[field] = currentData[field]
        // Get value from original data
        cleanOriginalData[field] = originalData[field]
      }
    })


    // Hanya proses field yang diperbolehkan dan tidak forbidden
    allowedFields.forEach(field => {
      if (forbiddenFields.includes(field)) return

      let currentValue = cleanCurrentData[field]
      let originalValue = cleanOriginalData[field]

      // Handle phone field mapping
      if (field === 'main_phone_number') {
        currentValue = cleanCurrentData.main_phone_number || currentData.phone
        originalValue = cleanOriginalData.main_phone_number || originalData.phone
      }


      // Only include if value has actually changed and is not empty
      // Juga include jika original value kosong (field baru)
      if (currentValue !== originalValue &&
          currentValue !== undefined &&
          currentValue !== null &&
          currentValue !== '') {

        // Keep original field name for basic information - no mapping needed
        // API expects: main_phone_number, secondary_phone_number, etc.
        changedFields[field] = currentValue
        oldFields[field] = originalValue || ''
      }
    })


    return {
      newData: changedFields,
      oldData: oldFields
    }
  }

  /**
   * Filter address fields untuk hanya mengirim field yang diubah
   * @param {Object} currentData - Data form saat ini
   * @param {Object} originalData - Data original untuk perbandingan
   * @returns {Object} Filtered payload with only changed address fields
   */
  const filterAddressPayload = (currentData, originalData) => {
    // CRITICAL FIX: The form uses form field names (official_address_detail) but originalData uses API field names (detail_ktp)
    // We need to compare properly by mapping both sides correctly

    // Form field to API field mapping (for output payload)
    const formToApiMapping = {
      'official_address_detail': 'detail_ktp',
      'official_address_province': 'province_ktp_id',
      'official_address_city': 'city_ktp_id',
      'official_address_postal_code': 'postal_code_ktp',
      'official_address_subdistrict': 'sub_distric_ktp',
      'official_address_administrative_village': 'administrative_village_ktp',
      'official_address_rt': 'rt_ktp',
      'official_address_rw': 'rw_ktp',
      'official_address_street': 'street_name_ktp',
      'official_address_house_number': 'house_number_ktp',
      'domicile_address_detail': 'detail_domicile',
      'domicile_address_province': 'province_domicile_id',
      'domicile_address_city': 'city_domicile_id',
      'domicile_address_postal_code': 'postal_code_domicile',
      'domicile_address_subdistrict': 'sub_distric_domicile',
      'domicile_address_administrative_village': 'administrative_village_domicile',
      'domicile_address_rt': 'rt_domicile',
      'domicile_address_rw': 'rw_domicile',
      'domicile_address_street': 'street_name_domicile',
      'domicile_address_house_number': 'house_number_domicile'
    }

    const changedFields = {}
    const oldFields = {}


    // Compare each form field with corresponding original field
    Object.keys(formToApiMapping).forEach(formField => {
      const apiField = formToApiMapping[formField]
      const currentValue = currentData[formField]
      const originalValue = originalData[apiField] // Use API field name for original data

      // Normalize for comparison (handle select field type coercion)
      const currentNormalized = currentValue === null || currentValue === undefined ? '' : String(currentValue)
      const originalNormalized = originalValue === null || originalValue === undefined ? '' : String(originalValue)

        currentValue,
        originalValue,
        currentNormalized,
        originalNormalized,
        hasChanged: currentNormalized !== originalNormalized
      })

      if (currentNormalized !== originalNormalized &&
          currentValue !== undefined &&
          currentValue !== null &&
          currentValue !== '') {
        changedFields[formField] = currentValue // Keep form field name for API submission
        oldFields[formField] = originalValue || ''
      }
    })


    return {
      newData: changedFields,
      oldData: oldFields
    }
  }

  /**
   * Filter family data untuk hanya mengirim record yang diubah dengan field yang diperbolehkan
   * @param {Array} currentData - Data form saat ini
   * @param {Array} originalData - Data original untuk perbandingan
   * @returns {Object} Filtered payload with only changed family records
   */
  const filterFamilyPayload = (currentData, originalData) => {
    if (!Array.isArray(currentData)) return { newData: [], oldData: [] }

    const changedItems = []
    const oldItems = []

    currentData.forEach((currentItem) => {
      if (!currentItem || !currentItem.id_family) return

      // Cari item original yang sesuai
      const originalItem = Array.isArray(originalData)
        ? originalData.find(orig => orig.id_family === currentItem.id_family) || {}
        : {}

      // Field yang akan diperiksa untuk family
      const fieldsToCheck = [
        'name', 'birth_date', 'birth_place', 'address', 'occupation',
        'relation_id', 'marital_status_id', 'gender_id', 'member_sequence',
        'no_telkomedika', 'member_status', 'status'
      ]

      let isChanged = false
      const changedItem = {}
      const oldItem = {}

      fieldsToCheck.forEach(field => {
        const currentValue = currentItem[field]
        const originalValue = originalItem[field]

        // Normalize for comparison (handle select field type coercion)
        const currentNormalized = currentValue === null || currentValue === undefined ? '' : String(currentValue)
        const originalNormalized = originalValue === null || originalValue === undefined ? '' : String(originalValue)

        // Check if value has changed using normalized comparison
        const hasChanged = currentNormalized !== originalNormalized &&
          !(currentValue == null && originalValue == null) &&
          !(currentValue === '' && originalValue == null) &&
          !(currentValue == null && originalValue === '')

        if (hasChanged) {
          isChanged = true
          changedItem[field] = currentValue
          oldItem[field] = originalValue
        }
      })

      if (isChanged) {
        // Include id_family untuk update
        changedItem.id_family = currentItem.id_family
        oldItem.id_family = currentItem.id_family
        changedItems.push(changedItem)
        oldItems.push(oldItem)
      }
    })

    return {
      newData: changedItems,
      oldData: oldItems
    }
  }

  /**
   * Filter emergency contact data untuk hanya mengirim record yang diubah
   * @param {Array} currentData - Data form saat ini
   * @param {Array} originalData - Data original untuk perbandingan
   * @returns {Object} Filtered payload with only changed emergency contact records
   */
  const filterEmergencyContactPayload = (currentData, originalData) => {
    if (!Array.isArray(currentData)) return { newData: [], oldData: [] }

    const changedItems = []
    const oldItems = []

    currentData.forEach((currentItem) => {
      if (!currentItem || !currentItem.id_contact) return

      const originalItem = Array.isArray(originalData)
        ? originalData.find(orig => orig.id_contact === currentItem.id_contact) || {}
        : {}

      const fieldsToCheck = ['emgc_name', 'emgc_number', 'emgc_relationship_id', 'emgc_address', 'status']

      let isChanged = false
      const changedItem = {}
      const oldItem = {}

      fieldsToCheck.forEach(field => {
        const currentValue = currentItem[field]
        const originalValue = originalItem[field]

        // Normalize for comparison (handle select field type coercion)
        const currentNormalized = currentValue === null || currentValue === undefined ? '' : String(currentValue)
        const originalNormalized = originalValue === null || originalValue === undefined ? '' : String(originalValue)

        if (currentNormalized !== originalNormalized) {
          isChanged = true
          changedItem[field] = currentValue
          oldItem[field] = originalValue
        }
      })

      if (isChanged) {
        changedItem.id_contact = currentItem.id_contact
        oldItem.id_contact = currentItem.id_contact
        changedItems.push(changedItem)
        oldItems.push(oldItem)
      }
    })

    return {
      newData: changedItems,
      oldData: oldItems
    }
  }

  /**
   * Filter education data untuk hanya mengirim record yang diubah
   * @param {Array} currentData - Data form saat ini
   * @param {Array} originalData - Data original untuk perbandingan
   * @returns {Object} Filtered payload with only changed education records
   */
  const filterEducationPayload = (currentData, originalData) => {
    if (!Array.isArray(currentData)) return { newData: [], oldData: [] }

    // Untuk education, kirim semua data yang ada (sesuai backup file)
    const filteredData = currentData.map(item => {
      const {
        // Remove client_key dan field lain yang tidak perlu
        client_key,
        // Remove label fields, hanya kirim ID
        edu_level, edu_institution, edu_major,
        ...filteredItem
      } = item

      return filteredItem
    }).filter(item => Object.keys(item).length > 0)

    return {
      newData: filteredData,
      oldData: []
    }
  }

  /**
   * Filter payroll account data untuk hanya mengirim field yang diubah
   * @param {Object} currentData - Data form saat ini
   * @param {Object} originalData - Data original untuk perbandingan
   * @returns {Object} Filtered payload with only changed payroll fields
   */
  const filterPayrollAccountPayload = (currentData, originalData) => {
    // Remove field yang tidak boleh dikirim
    const {
      bank, tax_status, // Remove label fields
      npwp_doc, saving_book_doc, npwp_doc_id, saving_book_doc_id, // Remove document fields
      ...filteredCurrentData
    } = currentData

    const changedFields = {}
    const oldFields = {}

    Object.keys(filteredCurrentData).forEach(key => {
      const currentValue = filteredCurrentData[key]
      const originalValue = originalData[key]

      // Normalize for comparison (handle select field type coercion)
      const currentNormalized = currentValue === null || currentValue === undefined ? '' : String(currentValue)
      const originalNormalized = originalValue === null || originalValue === undefined ? '' : String(originalValue)

      if (currentNormalized !== originalNormalized &&
          currentValue !== undefined &&
          currentValue !== null &&
          currentValue !== '') {
        changedFields[key] = currentValue
        oldFields[key] = originalValue || ''
      }
    })

    return {
      newData: changedFields,
      oldData: oldFields
    }
  }

  /**
   * Main function untuk filter payload berdasarkan category
   * @param {Object|Array} currentData - Data form saat ini
   * @param {Object|Array} originalData - Data original untuk perbandingan
   * @param {string} category - Category name
   * @returns {Object} Filtered payload
   */
  const getFilteredPayload = (currentData, originalData, category) => {

    switch (category) {
      case 'basic-information':
        return filterBasicInformationPayload(currentData, originalData)

      case 'address':
        return filterAddressPayload(currentData, originalData)

      case 'family':
        return filterFamilyPayload(currentData, originalData)

      case 'emergency-contact':
        return filterEmergencyContactPayload(currentData, originalData)

      case 'education':
        return filterEducationPayload(currentData, originalData)

      case 'payroll-account':
        return filterPayrollAccountPayload(currentData, originalData)

      default:
        console.warn('🚨 Unknown category for payload filtering:', category)
        return { newData: {}, oldData: {} }
    }
  }

  /**
   * Build final payload untuk submit dengan format yang benar
   * @param {Object} filteredData - Data yang sudah difilter
   * @param {string} category - Category name
   * @param {string} requestType - Request type (BSC, ADR, etc.)
   * @param {Object} options - Additional options
   * @returns {Object} Final payload ready for submission
   */
  const buildSubmitPayload = (filteredData, category, requestType, options = {}) => {
    const {
      noteEmployee = '',
      consent = true,
      submit = true,
      attachments = []
    } = options

      filteredData,
      category,
      requestType,
      options
    })

    // Prepare new_data structure - HANYA field yang berubah
    const newData = {
      action: "update",
      data: filteredData.newData || {} // HANYA gunakan newData yang sudah difilter
    }

    // Jangan handle array categories di sini - itu sudah dihandle di filter
    // Array categories sudah difilter dengan benar di getFilteredPayload

    const payload = {
      request_type: requestType,
      note_employee: noteEmployee,
      consent: consent,
      new_data: newData,
      attachments: attachments,
      submit: submit
    }


    return payload
  }

  /**
   * Map API field names back to form field names untuk basic information
   * @param {string} apiField - API field name
   * @returns {string} Form field name
   */
  const mapApiToFormField = (apiField) => {
    const mapping = {
      // No phone mapping needed - API uses main_phone_number directly
      // Add more mappings as needed
    }
    return mapping[apiField] || apiField
  }

  /**
   * Map form field names to API field names untuk basic information
   * @param {string} formField - Form field name
   * @returns {string} API field name
   */
  const mapFormToApiField = (formField) => {
    const mapping = {
      // No phone mapping needed - API expects main_phone_number directly
      // Add more mappings as needed
    }
    return mapping[formField] || formField
  }

  return {
    filterBasicInformationPayload,
    filterAddressPayload,
    filterFamilyPayload,
    filterEmergencyContactPayload,
    filterEducationPayload,
    filterPayrollAccountPayload,
    getFilteredPayload,
    buildSubmitPayload,
    mapApiToFormField,
    mapFormToApiField
  }
}