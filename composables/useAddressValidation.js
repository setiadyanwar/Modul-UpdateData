// Address field validation rules based on backend specifications
export const useAddressValidation = () => {
  
  // Address field validation rules
  const addressValidationRules = {
    // Official Address Fields
    official_address_detail: {
      type: 'text',
      required: false,
      max_length: 255,
      message: 'Detail address must not exceed 255 characters'
    },
    official_address_province: {
      type: 'repo_master',
      repo: 'PROVINCE',
      id_field: 'id_province',
      label_field: 'province_name',
      required: true,
      message: 'Province is required'
    },
    official_address_city: {
      type: 'repo_master',
      repo: 'CITY',
      id_field: 'id_city',
      label_field: 'city_name',
      required: true,
      depends_on: 'official_address_province',
      message: 'City is required and must match selected province'
    },
    official_address_postal_code: {
      type: 'numeric_string',
      min_length: 5,
      max_length: 5,
      required: false,
      pattern: /^\d{5}$/,
      message: 'Postal code must be exactly 5 digits'
    },
    official_address_subdistrict: {
      type: 'string',
      required: false,
      max_length: 100,
      message: 'Sub district must not exceed 100 characters'
    },
    official_address_administrative_village: {
      type: 'string',
      required: false,
      max_length: 100,
      message: 'Administrative village must not exceed 100 characters'
    },
    official_address_rt: {
      type: 'numeric_string',
      min_length: 1,
      max_length: 3,
      required: false,
      pattern: /^\d{1,3}$/,
      message: 'RT must be 1-3 digits'
    },
    official_address_rw: {
      type: 'numeric_string',
      min_length: 1,
      max_length: 3,
      required: false,
      pattern: /^\d{1,3}$/,
      message: 'RW must be 1-3 digits'
    },
    official_address_street: {
      type: 'string',
      required: false,
      max_length: 255,
      message: 'Street name must not exceed 255 characters'
    },
    official_address_house_number: {
      type: 'string',
      required: false,
      max_length: 4,
      message: 'House number must not exceed 4 characters'
    },
    
    // Domicile Address Fields  
    domicile_address_detail: {
      type: 'text',
      required: false,
      max_length: 255,
      message: 'Detail address must not exceed 255 characters'
    },
    domicile_address_province: {
      type: 'repo_master',
      repo: 'PROVINCE',
      id_field: 'id_province',
      label_field: 'province_name',
      required: false,
      message: 'Invalid province selection'
    },
    domicile_address_city: {
      type: 'repo_master',
      repo: 'CITY',
      id_field: 'id_city',
      label_field: 'city_name',
      required: false,
      depends_on: 'domicile_address_province',
      message: 'City must match selected province'
    },
    domicile_address_postal_code: {
      type: 'numeric_string',
      min_length: 5,
      max_length: 5,
      required: false,
      pattern: /^\d{5}$/,
      message: 'Postal code must be exactly 5 digits'
    },
    domicile_address_subdistrict: {
      type: 'string',
      required: false,
      max_length: 100,
      message: 'Sub district must not exceed 100 characters'
    },
    domicile_address_administrative_village: {
      type: 'string',
      required: false,
      max_length: 100,
      message: 'Administrative village must not exceed 100 characters'
    },
    domicile_address_rt: {
      type: 'numeric_string',
      min_length: 1,
      max_length: 3,
      required: false,
      pattern: /^\d{1,3}$/,
      message: 'RT must be 1-3 digits'
    },
    domicile_address_rw: {
      type: 'numeric_string',
      min_length: 1,
      max_length: 3,
      required: false,
      pattern: /^\d{1,3}$/,
      message: 'RW must be 1-3 digits'
    },
    domicile_address_street: {
      type: 'string',
      required: false,
      max_length: 255,
      message: 'Street name must not exceed 255 characters'
    },
    domicile_address_house_number: {
      type: 'string',
      required: false,
      max_length: 4,
      message: 'House number must not exceed 4 characters'
    }
  };

  // Validate a single field
  const validateField = (fieldName, value, allData = {}) => {
    const rule = addressValidationRules[fieldName];
    if (!rule) return null; // No validation rule found
    
    // Required validation
    if (rule.required && (!value || String(value).trim() === '')) {
      return rule.message || `${fieldName} is required`;
    }
    
    // Skip further validation if value is empty and not required
    if (!value || String(value).trim() === '') {
      return null;
    }
    
    const stringValue = String(value).trim();
    
    // Length validations
    if (rule.min_length && stringValue.length < rule.min_length) {
      return rule.message || `${fieldName} must be at least ${rule.min_length} characters`;
    }
    
    if (rule.max_length && stringValue.length > rule.max_length) {
      return rule.message || `${fieldName} must not exceed ${rule.max_length} characters`;
    }
    
    // Pattern validation
    if (rule.pattern && !rule.pattern.test(stringValue)) {
      return rule.message || `${fieldName} format is invalid`;
    }
    
    // Dependency validation (e.g., city depends on province)
    if (rule.depends_on) {
      const dependencyValue = allData[rule.depends_on];
      if (!dependencyValue) {
        return `Please select ${rule.depends_on.replace(/_/g, ' ')} first`;
      }
    }
    
    return null; // Valid
  };

  // Validate all address fields
  const validateAddressData = (data) => {
    const errors = {};
    const warnings = [];
    
    Object.keys(addressValidationRules).forEach(fieldName => {
      const error = validateField(fieldName, data[fieldName], data);
      if (error) {
        errors[fieldName] = error;
      }
    });
    
    // Cross-field validations
    
    // If official address province is set, official address city should be set too
    if (data.official_address_province && !data.official_address_city) {
      if (!errors.official_address_city) {
        warnings.push('Official address city should be specified when province is selected');
      }
    }
    
    // If domicile address province is set, domicile address city should be set too  
    if (data.domicile_address_province && !data.domicile_address_city) {
      if (!errors.domicile_address_city) {
        warnings.push('Domicile address city should be specified when province is selected');
      }
    }
    
    // Check if at least one address section has meaningful data
    const hasOfficialAddress = data.official_address_province || data.official_address_city || 
                              data.official_address_detail || data.official_address_street;
    const hasDomicileAddress = data.domicile_address_province || data.domicile_address_city || 
                              data.domicile_address_detail || data.domicile_address_street;
    
    if (!hasOfficialAddress && !hasDomicileAddress) {
      warnings.push('At least one address section should be filled');
    }
    
    return {
      errors,
      warnings,
      isValid: Object.keys(errors).length === 0
    };
  };

  // Format phone number to Indonesian standard
  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    
    let cleaned = phone.replace(/\D/g, ''); // Remove non-digits
    
    // Convert various formats to standard Indonesian format
    if (cleaned.startsWith('62')) {
      cleaned = '+' + cleaned;
    } else if (cleaned.startsWith('0')) {
      cleaned = '+62' + cleaned.substring(1);
    } else if (cleaned.length >= 9) {
      cleaned = '+62' + cleaned;
    }
    
    return cleaned;
  };

  // Format postal code
  const formatPostalCode = (postalCode) => {
    if (!postalCode) return '';
    return postalCode.replace(/\D/g, '').substring(0, 5); // Only digits, max 5 chars
  };

  // Format RT/RW numbers
  const formatRTRW = (value) => {
    if (!value) return '';
    return value.replace(/\D/g, '').substring(0, 3); // Only digits, max 3 chars
  };

  return {
    addressValidationRules,
    validateField,
    validateAddressData,
    formatPhoneNumber,
    formatPostalCode,
    formatRTRW
  };
};
