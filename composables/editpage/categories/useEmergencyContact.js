export function useEmergencyContact() {

  const mapEmergencyContactApiToFormFields = (apiData) => {
    if (!Array.isArray(apiData)) return []

    return apiData.map(contact => ({
      emergency_name: contact.emergency_name || '',
      emergency_relationship: contact.emergency_relationship || '',
      emergency_phone: contact.emergency_phone || '',
      emergency_address: contact.emergency_address || '',
      client_key: contact.client_key || generateClientKey()
    }))
  }

  const mapEmergencyContactFormToAPI = (formData) => {
    if (!Array.isArray(formData)) return []

    return formData.map(contact => ({
      emergency_name: contact.emergency_name || '',
      emergency_relationship: contact.emergency_relationship || '',
      emergency_phone: contact.emergency_phone || '',
      emergency_address: contact.emergency_address || '',
      client_key: contact.client_key
    }))
  }

  const generateClientKey = () => {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
  }

  const getEmergencyContactTabConfig = () => ({
    id: 'emergency-contact',
    label: 'Emergency Contact',
    icon: 'pi-phone',
    category: 'emergency-contact',
    hasDocuments: false,
    isArrayBased: true
  })

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

  return {
    mapEmergencyContactApiToFormFields,
    mapEmergencyContactFormToAPI,
    generateClientKey,
    getEmergencyContactTabConfig,
    validateEmergencyContact
  }
}