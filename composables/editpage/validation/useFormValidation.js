import { computed } from 'vue'

export function useFormValidation() {

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
    if (addressData.is_domicile_different) {
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

  const validatePayroll = (payrollData) => {
    const errors = []

    if (!payrollData.bank_name?.trim()) {
      errors.push('Bank name is required')
    }

    if (!payrollData.bank_account_number?.trim()) {
      errors.push('Bank account number is required')
    }

    if (!payrollData.bank_account_holder_name?.trim()) {
      errors.push('Account holder name is required')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  const validateEducation = (educationData) => {
    if (!Array.isArray(educationData) || educationData.length === 0) {
      return { isValid: false, errors: ['At least one education record is required'] }
    }

    const errors = []
    educationData.forEach((edu, index) => {
      if (!edu.edu_level_id) {
        errors.push(`Education ${index + 1}: Level is required`)
      }

      if (!edu.edu_institution_id) {
        errors.push(`Education ${index + 1}: Institution is required`)
      }

      if (!edu.edu_major_id) {
        errors.push(`Education ${index + 1}: Major is required`)
      }

      if (!edu.graduation_year) {
        errors.push(`Education ${index + 1}: Graduation year is required`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  const validateEmergencyContact = (emergencyData) => {
    if (!Array.isArray(emergencyData) || emergencyData.length === 0) {
      return { isValid: false, errors: ['At least one emergency contact is required'] }
    }

    const errors = []
    emergencyData.forEach((contact, index) => {
      if (!contact.emergency_name?.trim()) {
        errors.push(`Emergency contact ${index + 1}: Name is required`)
      }

      if (!contact.emergency_phone?.trim()) {
        errors.push(`Emergency contact ${index + 1}: Phone is required`)
      }

      if (!contact.emergency_relationship?.trim()) {
        errors.push(`Emergency contact ${index + 1}: Relationship is required`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  const validateFamily = (familyData) => {
    if (!Array.isArray(familyData)) {
      return { isValid: true, errors: [] }
    }

    const errors = []
    familyData.forEach((family, index) => {
      if (!family.family_name?.trim()) {
        errors.push(`Family member ${index + 1}: Name is required`)
      }

      if (!family.family_relationship?.trim()) {
        errors.push(`Family member ${index + 1}: Relationship is required`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  const validateForm = (formData, activeTab) => {
    switch (activeTab) {
      case 'basic-information':
        return validateBasicInformation(formData)
      case 'address':
        return validateAddress(formData)
      case 'payroll-account':
        return validatePayroll(formData)
      case 'education':
        return validateEducation(formData.education || [])
      case 'emergency-contact':
        return validateEmergencyContact(formData.emergency_contact || [])
      case 'family':
        return validateFamily(formData.family || [])
      default:
        return { isValid: true, errors: [] }
    }
  }

  const validateAllTabs = (formData) => {
    const allErrors = {}
    const tabs = ['basic-information', 'address', 'payroll-account', 'education', 'emergency-contact', 'family']

    let overallValid = true

    tabs.forEach(tab => {
      const validation = validateForm(formData, tab)
      if (!validation.isValid) {
        allErrors[tab] = validation.errors
        overallValid = false
      }
    })

    return {
      isValid: overallValid,
      errors: allErrors
    }
  }

  return {
    validateBasicInformation,
    validateAddress,
    validatePayroll,
    validateEducation,
    validateEmergencyContact,
    validateFamily,
    validateForm,
    validateAllTabs
  }
}