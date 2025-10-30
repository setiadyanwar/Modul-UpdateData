export function useFamily() {

  const mapFamilyApiToFormFields = (apiData) => {
    if (!Array.isArray(apiData)) return []

    return apiData.map(family => ({
      family_name: family.family_name || '',
      family_relationship: family.family_relationship || '',
      family_birth_date: family.family_birth_date || '',
      family_gender: family.family_gender || '',
      family_occupation: family.family_occupation || '',
      family_phone: family.family_phone || '',
      client_key: family.client_key || generateClientKey()
    }))
  }

  const mapFamilyFormToAPI = (formData) => {
    if (!Array.isArray(formData)) return []

    return formData.map(family => ({
      family_name: family.family_name || '',
      family_relationship: family.family_relationship || '',
      family_birth_date: family.family_birth_date || '',
      family_gender: family.family_gender || '',
      family_occupation: family.family_occupation || '',
      family_phone: family.family_phone || '',
      client_key: family.client_key
    }))
  }

  const generateClientKey = () => {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
  }

  const getFamilyTabConfig = () => ({
    id: 'family',
    label: 'Family',
    icon: 'pi-users',
    category: 'family',
    hasDocuments: false,
    isArrayBased: true
  })

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

  return {
    mapFamilyApiToFormFields,
    mapFamilyFormToAPI,
    generateClientKey,
    getFamilyTabConfig,
    validateFamily
  }
}