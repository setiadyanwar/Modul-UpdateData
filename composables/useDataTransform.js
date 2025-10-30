import { ref } from 'vue'

export const useDataTransform = () => {
  
  // Helper: check if value is empty
  const isEmptyValue = (val) => {
    if (val === null || val === undefined) return true
    if (typeof val === 'string') return val.trim() === ''
    if (Array.isArray(val)) return val.length === 0
    if (typeof val === 'object') return Object.keys(val).length === 0
    return false
  }

  // Helper: deep equal comparison
  const deepEqual = (a, b) => {
    try {
      return JSON.stringify(a) === JSON.stringify(b)
    } catch {
      return a === b
    }
  }

  /**
   * Clean data extractor - removes all wrapper nonsense
   * @param {Object} data - Raw data from form/changes
   * @returns {Object} - Clean flat object with only changed non-empty values
   */
  const extractCleanData = (data) => {
    if (!data || typeof data !== 'object') return {}
    
    const result = {}
    
    // Function to recursively extract data
    const extractFromObject = (obj, prefix = '') => {
      if (!obj || typeof obj !== 'object') return
      
      Object.keys(obj).forEach(key => {
        const value = obj[key]
        
        // Skip numeric keys (wrapper indices like "0", "1")
        if (!isNaN(parseInt(key)) && key === String(parseInt(key))) {
          if (typeof value === 'object') {
            extractFromObject(value, prefix)
          }
          return
        }
        
        // Skip wrapper keys ending with 'data' (like 'social_securitydata')
        if (key.endsWith('data') && typeof value === 'object') {
          extractFromObject(value, prefix)
          return
        }
        
        // Handle old/new wrapper
        if (key === 'old' || key === 'new') {
          if (key === 'new' && typeof value === 'object') {
            extractFromObject(value, prefix)
          }
          return
        }
        
        // Extract actual field values
        if (!isEmptyValue(value)) {
          const fieldKey = prefix ? `${prefix}.${key}` : key
          result[fieldKey.replace(/^\./, '')] = value
        }
      })
    }
    
    extractFromObject(data)
    return result
  }

  /**
   * Transform changes object to clean API payload
   * @param {Object} changes - Changes object from form
   * @returns {Object} - Clean data for API
   */
  const transformToApiPayload = (changes) => {
    
    if (!changes || typeof changes !== 'object') {
      return {}
    }
    
    // Extract clean data
    const cleanData = extractCleanData(changes)
    
    return cleanData
  }

  /**
   * Build complete API request payload
   * @param {Object} params - Request parameters
   * @returns {Object} - Complete API payload
   */
  const buildApiPayload = ({ 
    tab, 
    changes, 
    originalData = {}, 
    note_employee, 
    consent = true, 
    submit = true,
    action = 'update' // Default to update, but allow override for insert operations
  }) => {
    // Map tab to request type
    const requestTypeMap = {
      'basic-information': 'BSC',
      'address': 'ADR', 
      'emergency-contact': 'EMC',
      'payroll-account': 'PYR',
      'family': 'FMY',
      'education': 'EDC',
      'social-security': 'SSI',
      'medical-record': 'MDR',
      'employment-information': 'EMP'
    }
    
    const cleanData = transformToApiPayload(changes)
    
    // Extract old data from original employee data that corresponds to changed fields
    const oldData = {}
    Object.keys(cleanData).forEach(key => {
      if (originalData[key] !== undefined) {
        oldData[key] = originalData[key]
      } else {
        // If field doesn't exist in original data, set to null
        oldData[key] = null
      }
    })
    
    // Handle array data tabs (education, family, emergency-contact) vs object data tabs
    const arrayTabs = ['education', 'family', 'emergency-contact'];
    let newDataPayload;
    
    if (arrayTabs.includes(tab)) {
      // For array data, ensure data is properly formatted as array
      let dataArray;
      
      if (Array.isArray(cleanData)) {
        // Already an array
        dataArray = cleanData;
      } else if (cleanData && typeof cleanData === 'object') {
        // Convert object to array - handle cases where data got flattened
        const keys = Object.keys(cleanData);
        if (keys.length === 1 && !isNaN(parseInt(keys[0]))) {
          // Single item with numeric key like {0: {...}}
          dataArray = [cleanData[keys[0]]];
        } else if (keys.some(key => ['id_education', 'id_contact', 'id_family'].includes(key))) {
          // Direct object with ID field - wrap in array
          dataArray = [cleanData];
        } else {
          // Multiple items or complex structure
          dataArray = Object.values(cleanData).filter(Boolean);
        }
      } else {
        dataArray = [];
      }
      
      
      newDataPayload = {
        action: action,
        data: dataArray
      };
    } else {
      // For object data, keep as object
      newDataPayload = {
        action: action,
        data: cleanData
      };
    }

    const payload = {
      request_type: requestTypeMap[tab] || 'BSC',
      note_employee: note_employee || (submit ? 'Change request submitted' : 'Draft - Auto saved changes'),
      consent: consent === true,
      old_data: oldData,
      new_data: newDataPayload,
      submit: submit
    }
    
    return payload
  }

  /**
   * Extract only changed fields by comparing old vs new
   * @param {Object} oldData - Original data
   * @param {Object} newData - Updated data  
   * @returns {Object} - Only changed fields
   */
  const extractChangedFields = (oldData = {}, newData = {}) => {
    const changes = {}
    
    Object.keys(newData).forEach(key => {
      const oldVal = oldData[key]
      const newVal = newData[key]
      
      // Include if value changed (including when new value is empty - represents deletion)
      if (!deepEqual(oldVal, newVal)) {
        changes[key] = newVal
      }
    })
    
    return changes
  }

  return {
    extractCleanData,
    transformToApiPayload,
    buildApiPayload,
    extractChangedFields,
    isEmptyValue,
    deepEqual
  }
}
