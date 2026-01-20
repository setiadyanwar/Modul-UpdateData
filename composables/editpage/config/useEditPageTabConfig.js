/**
 * Edit Page Tab Configurations
 * 
 * Static tab configuration data extracted from pages/update-data/edit/[id].vue
 * Contains tab definitions, icons, components, and skeletons
 */

// Import skeleton components
import BasicInformationSkeleton from '~/components/form/BasicInformationSkeleton.vue'
import AddressSkeleton from '~/components/form/AddressSkeleton.vue'
import EmergencyContactSkeleton from '~/components/form/EmergencyContactSkeleton.vue'
import FamilySkeleton from '~/components/form/FamilySkeleton.vue'
import EducationSkeleton from '~/components/form/EducationSkeleton.vue'
import PayrollAccountSkeleton from '~/components/form/PayrollAccountSkeleton.vue'
import SocialSecuritySkeleton from '~/components/form/SocialSecuritySkeleton.vue'
import MedicalRecordSkeleton from '~/components/form/MedicalRecordSkeleton.vue'

// Import form components
import EmergencyContactForm from '~/components/form/EmergencyContactForm.vue'
import FamilyForm from '~/components/form/FamilyForm.vue'
import EducationForm from '~/components/form/EducationForm.vue'
import UpdateDataPayrollAccountSection from '~/components/update-data/sections/UpdateDataPayrollAccountSection.vue'
import UpdateDataSocialSecuritySection from '~/components/update-data/sections/UpdateDataSocialSecuritySection.vue'
import UpdateDataMedicalRecordSection from '~/components/update-data/sections/UpdateDataMedicalRecordSection.vue'

/**
 * Tab configurations for all edit page categories
 * @type {Object}
 */
export const tabConfigs = {
    "basic-information": {
        id: "basic-information",
        label: "Basic Information",
        icon: "pi-user",
        component: null, // Handled separately by EditDataBasicInformation
        skeleton: BasicInformationSkeleton,
    },
    address: {
        id: "address",
        label: "Address",
        icon: "pi-map-marker",
        component: null, // Handled separately by EditDataAddress/ReviseDataAddress
        skeleton: AddressSkeleton,
    },
    "emergency-contact": {
        id: "emergency-contact",
        label: "Emergency Contact",
        icon: "pi-phone",
        component: EmergencyContactForm,
        skeleton: EmergencyContactSkeleton,
    },
    family: {
        id: "family",
        label: "Family",
        icon: "pi-users",
        component: FamilyForm,
        skeleton: FamilySkeleton,
    },
    education: {
        id: "education",
        label: "Education",
        icon: "pi-book",
        component: EducationForm,
        skeleton: EducationSkeleton,
    },
    "payroll-account": {
        id: "payroll-account",
        label: "Payroll Account",
        icon: "pi-credit-card",
        component: UpdateDataPayrollAccountSection,
        skeleton: PayrollAccountSkeleton,
    },
    "social-security": {
        id: "social-security",
        label: "Benefit",
        icon: "pi-shield",
        component: UpdateDataSocialSecuritySection,
        skeleton: SocialSecuritySkeleton,
    },
    "medical-record": {
        id: "medical-record",
        label: "Medical Record",
        icon: "pi-heart",
        component: UpdateDataMedicalRecordSection,
        skeleton: MedicalRecordSkeleton,
    },
}

/**
 * Get required documents for a specific tab/category
 * @param {string} tabName - Tab name/ID
 * @returns {Array} Array of required document configurations
 */
export const getRequiredDocuments = (tabName) => {
    const documentMap = {
        'basic-information': [
            {
                code: 'ktp',
                label: 'ID Card (KTP)',
                required: true,
                description: 'Upload your KTP/ID Card (required for basic information changes)'
            }
        ],
        'address': [
            {
                code: 'ktp',
                label: 'ID Card (KTP)',
                required: true,
                description: 'Upload your KTP/ID Card (required for address changes)'
            }
        ],
        'family': [
            {
                code: 'kk',
                label: 'Family Card (KK)',
                required: true,
                description: 'Upload your Family Card (KK) document'
            }
        ],
        'payroll-account': [
            {
                code: 'account_book',
                label: 'Bank Account Book',
                required: true,
                description: 'Upload your bank account book or statement'
            },
            {
                code: 'npwp',
                label: 'NPWP Document',
                required: false,
                description: 'Upload your NPWP document (optional)'
            }
        ],
        'social-security': [
            {
                code: 'bpjs',
                label: 'BPJS Card',
                required: true,
                description: 'Upload your BPJS card or certificate'
            },
            {
                code: 'telkomedika',
                label: 'Telkomedika Card',
                required: false,
                description: 'Upload your Telkomedika card (optional)'
            }
        ]
    }

    return documentMap[tabName] || []
}

/**
 * Get document upload title based on category
 * @param {string} tabName - Tab name/ID
 * @returns {string} Upload section title
 */
export const getDocumentUploadTitle = (tabName) => {
    const titleMap = {
        'basic-information': 'KTP Document Upload',
        'address': 'KTP Document Upload',
        'family': 'Family Card (KK) Document Upload',
        'payroll-account': 'Bank Account Document Upload',
        'social-security': 'BPJS Document Upload'
    }

    return titleMap[tabName] || 'Document Upload'
}

/**
 * Get document upload subtitle based on category
 * @param {string} tabName - Tab name/ID
 * @returns {string} Upload section subtitle (HTML string)
 */
export const getDocumentUploadSubtitle = (tabName) => {
    const subtitleMap = {
        'basic-information': 'Upload your <span class="text-primary-500 font-bold">KTP</span> document (required)',
        'address': 'Upload your <span class="text-primary-500 font-bold">KTP</span> document (required)',
        'family': 'Upload your <span class="text-primary-500 font-bold">Family Card (KK)</span> document (required)',
        'payroll-account': 'Upload your <span class="text-primary-500 font-bold">NPWP Document</span> and <span class="text-primary-500 font-bold">Saving Book Document</span> (required)',
        'social-security': 'Upload your <span class="text-primary-500 font-bold">Telkomedika Card Photo</span> and <span class="text-primary-500 font-bold">BPJS Card Photo</span> (required)'
    }

    return subtitleMap[tabName] || 'Upload supporting documents for this category.'
}

/**
 * Get required document count based on category
 * @param {string} tabName - Tab name/ID
 * @returns {number} Minimum required document count
 */
export const getRequiredDocumentCount = (tabName) => {
    const countMap = {
        'basic-information': 1, // KTP required
        'address': 1, // KTP required
        'family': 1, // Family Card required
        'payroll-account': 1, // Bank Account Book required (NPWP optional)
        'social-security': 1, // BPJS required (Telkomedika optional)
        'education': 1 // At least one certificate required
    }

    return countMap[tabName] || 1
}

/**
 * Get category label for SideEditPage component
 * @param {string} tabName - Tab name/ID
 * @param {Object} requestDetail - Request detail object (optional)
 * @returns {string} Category label
 */
export const getSideEditPageCategory = (tabName, requestDetail = null) => {
    // If no requestDetail, fallback to tab-based mapping
    if (!requestDetail) {
        const tabCategoryMap = {
            'basic-information': 'Basic Information',
            'address': 'Address',
            'payroll-account': 'Payroll Account',
            'social-security': 'Benefit',
            'education': 'Education',
            'family': 'Family',
            'emergency-contact': 'Emergency Contact'
        }
        return tabCategoryMap[tabName] || 'Document Upload'
    }

    const requestType = requestDetail.request_type

    // Map request type to category label (SideEditPage expects string, not object)
    const categoryMap = {
        'BSC': 'Basic Information',
        'ADR': 'Address',
        'EMC': 'Emergency Contact',
        'PYR': 'Payroll Account',
        'FMY': 'Family',
        'EDC': 'Education',
        'SSI': 'Benefit'
    }

    return categoryMap[requestType] || 'Update Data'
}
