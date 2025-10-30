import { computed } from 'vue'

export function usePayroll() {

  const mapPayrollApiToFormFields = (apiData) => {
    if (!apiData || typeof apiData !== 'object') return {}

    return {
      bank_name: apiData.bank_name || '',
      bank_account_number: apiData.bank_account_number || '',
      bank_account_holder_name: apiData.bank_account_holder_name || '',
      npwp: apiData.npwp || '',
      bpjs_kesehatan: apiData.bpjs_kesehatan || '',
      bpjs_ketenagakerjaan: apiData.bpjs_ketenagakerjaan || ''
    }
  }

  const mapPayrollFormToAPI = (formData) => {
    if (!formData || typeof formData !== 'object') return {}

    return {
      bank_name: formData.bank_name || '',
      bank_account_number: formData.bank_account_number || '',
      bank_account_holder_name: formData.bank_account_holder_name || '',
      npwp: formData.npwp || '',
      bpjs_kesehatan: formData.bpjs_kesehatan || '',
      bpjs_ketenagakerjaan: formData.bpjs_ketenagakerjaan || ''
    }
  }

  const getPayrollTabConfig = () => ({
    id: 'payroll-account',
    label: 'Payroll Account',
    icon: 'pi-credit-card',
    category: 'payroll-account',
    hasDocuments: true
  })

  const getPayrollRequiredDocuments = () => [
    'Rekening Bank',
    'NPWP',
    'BPJS Kesehatan',
    'BPJS Ketenagakerjaan'
  ]

  return {
    mapPayrollApiToFormFields,
    mapPayrollFormToAPI,
    getPayrollTabConfig,
    getPayrollRequiredDocuments
  }
}