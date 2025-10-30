import { computed } from 'vue'

export function useTabHelpers() {

  const getTabIcon = (category) => {
    const icons = {
      'basic-information': 'pi pi-user',
      'address': 'pi pi-home',
      'payroll-account': 'pi pi-credit-card',
      'education': 'pi pi-graduation-cap',
      'emergency-contact': 'pi pi-phone',
      'family': 'pi pi-users',
    }
    return icons[category] || 'pi pi-circle'
  }

  const getTabLabel = (category) => {
    const labels = {
      'basic-information': 'Basic Information',
      'address': 'Address',
      'payroll-account': 'Payroll Account',
      'education': 'Education',
      'emergency-contact': 'Emergency Contact',
      'family': 'Family',
    }
    return labels[category] || category
  }

  const getRequestTypeFromTab = (tabId) => {
    const requestTypes = {
      'basic-information': 'BSC',
      'address': 'ADR',
      'payroll-account': 'PYR',
      'education': 'EDC',
      'emergency-contact': 'EMC',
      'family': 'FMY',
      'social-security': 'SSI',
      'medical-record': 'MDR',
    }
    return requestTypes[tabId] || 'BSC'
  }

  const getChangeTypeFromTab = (tab) => {
    const changeTypes = {
      'basic-information': 'personal_data',
      'address': 'address',
      'payroll-account': 'payroll',
      'education': 'education',
      'emergency-contact': 'emergency_contact',
      'family': 'family',
    }
    return changeTypes[tab] || tab
  }

  const getSideEditPageCategory = (tabName) => {
    const categories = {
      'basic-information': 'basic-information',
      'address': 'address',
      'payroll-account': 'payroll-account',
      'education': 'education',
      'emergency-contact': 'emergency-contact',
      'family': 'family',
    }
    return categories[tabName] || tabName
  }

  const getFieldStructureForTab = (tabId) => {
    const structures = {
      'basic-information': {
        type: 'object',
        fields: ['name', 'nik', 'business_email', 'birth_date', 'gender', 'marital_status']
      },
      'address': {
        type: 'object',
        fields: ['official_address_detail', 'official_address_province', 'official_address_city']
      },
      'payroll-account': {
        type: 'object',
        fields: ['bank_name', 'bank_account_number', 'bank_account_holder_name']
      },
      'education': {
        type: 'array',
        fields: ['edu_level_id', 'edu_institution_id', 'edu_major_id', 'graduation_year']
      },
      'emergency-contact': {
        type: 'array',
        fields: ['emergency_name', 'emergency_phone', 'emergency_relationship']
      },
      'family': {
        type: 'array',
        fields: ['family_name', 'family_relationship', 'family_birth_date']
      }
    }
    return structures[tabId] || { type: 'object', fields: [] }
  }

  const isArrayBasedTab = (tabId) => {
    const arrayTabs = ['education', 'emergency-contact', 'family']
    return arrayTabs.includes(tabId)
  }

  const hasDocuments = (tabId) => {
    const documentTabs = ['basic-information', 'address', 'payroll-account', 'education']
    return documentTabs.includes(tabId)
  }

  const tabConfigs = computed(() => ({
    'basic-information': {
      id: 'basic-information',
      label: 'Basic Information',
      icon: 'pi-user',
      category: 'basic-information',
      hasDocuments: true,
      isArrayBased: false,
      component: 'EditDataBasicInformation'
    },
    'address': {
      id: 'address',
      label: 'Address',
      icon: 'pi-home',
      category: 'address',
      hasDocuments: true,
      isArrayBased: false,
      component: 'EditDataAddress'
    },
    'payroll-account': {
      id: 'payroll-account',
      label: 'Payroll Account',
      icon: 'pi-credit-card',
      category: 'payroll-account',
      hasDocuments: true,
      isArrayBased: false,
      component: 'EditDataPayrollAccount'
    },
    'education': {
      id: 'education',
      label: 'Education',
      icon: 'pi-graduation-cap',
      category: 'education',
      hasDocuments: true,
      isArrayBased: true,
      component: 'EditDataEducation'
    },
    'emergency-contact': {
      id: 'emergency-contact',
      label: 'Emergency Contact',
      icon: 'pi-phone',
      category: 'emergency-contact',
      hasDocuments: false,
      isArrayBased: true,
      component: 'EditDataEmergencyContact'
    },
    'family': {
      id: 'family',
      label: 'Family',
      icon: 'pi-users',
      category: 'family',
      hasDocuments: false,
      isArrayBased: true,
      component: 'EditDataFamily'
    }
  }))

  return {
    getTabIcon,
    getTabLabel,
    getRequestTypeFromTab,
    getChangeTypeFromTab,
    getSideEditPageCategory,
    getFieldStructureForTab,
    isArrayBasedTab,
    hasDocuments,
    tabConfigs
  }
}