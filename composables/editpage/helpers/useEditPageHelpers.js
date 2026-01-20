/**
 * Edit Page Helper Functions
 * 
 * Pure utility functions extracted from pages/update-data/edit/[id].vue
 * These are stateless helper functions that don't depend on reactive state
 */

import { useMasterData } from '~/composables/useMasterData'

/**
 * Generate a unique client key for records
 * @returns {string} UUID-like client key
 */
export const generateClientKey = () => {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
}

/**
 * Map request type code to tab ID
 * @param {string} type - Request type code (BSC, ADR, EMC, etc.)
 * @returns {string} Tab ID
 */
export const mapRequestTypeToTab = (type) => {
    const mapping = {
        BSC: 'basic-information',
        ADR: 'address',
        PYR: 'payroll-account',
        EMC: 'emergency-contact',
        EDC: 'education',
        SSI: 'social-security',
        MDR: 'medical-record',
        FMY: 'family'
    }
    return mapping[type] || 'basic-information' // Default to basic-information if type not found
}

/**
 * Enrich education data with labels from master data
 * @param {Array} educationData - Array of education records
 * @returns {Promise<void>}
 */
export const enrichEducationDataWithLabels = async (educationData) => {
    if (!Array.isArray(educationData) || educationData.length === 0) {
        return
    }

    try {
        const { getOptions } = useMasterData()

        // Load master data for education
        const [levels, majors, institutions] = await Promise.all([
            getOptions('EDU_LEVELS'),
            getOptions('EDU_MAJORS'),
            getOptions('EDU_INSTITUTIONS')
        ])

        // Enrich each education record with labels
        educationData.forEach((record, index) => {
            // Add level label
            if (record.edu_level_id && levels) {
                const levelData = levels.find(level => level.code == record.edu_level_id)
                if (levelData) {
                    record.edu_level = levelData.value || levelData.label || levelData.name || `Level ${record.edu_level_id}`
                }
            }

            // Add major label
            if (record.edu_major_id && majors) {
                const majorData = majors.find(major => major.code == record.edu_major_id)
                if (majorData) {
                    record.edu_major = majorData.value || majorData.label || majorData.name || `Major ${record.edu_major_id}`
                }
            }

            // Add institution label
            if (record.edu_institution_id && institutions) {
                const institutionData = institutions.find(institution => institution.code == record.edu_institution_id)
                if (institutionData) {
                    record.edu_institution = institutionData.value || institutionData.label || institutionData.name || `Institution ${record.edu_institution_id}`
                }
            }
        })
    } catch (error) {
        console.error('❌ Error enriching education data with labels:', error)
    }
}

/**
 * Map attachments to education records by client_key
 * @param {Array} educationRecords - Array of education records
 * @param {Array} attachments - Array of attachments
 * @returns {Array} Mapped attachments
 */
export const mapAttachmentsToEducationRecords = (educationRecords, attachments) => {
    if (!Array.isArray(attachments) || attachments.length === 0) {
        return []
    }

    // Map attachments by client_key to education records
    const result = educationRecords.map((record, index) => {
        const recordClientKey = record.client_key

        if (!recordClientKey) {
            return null
        }

        // Find attachment by matching client_key
        const attachment = attachments.find(att => att.client_key === recordClientKey)

        if (!attachment) {
            return null
        }

        const mappedAttachment = {
            item_id: attachment.item_id,
            document_type: attachment.document_type,
            file_name: attachment.file_name,
            file_size: attachment.file_size,
            uploaded_date: attachment.uploaded_date,
            file_size_display: attachment.file_size_display,
            client_key: attachment.client_key,
            // Add preview and download URLs
            preview_url: `/employee/attachments/${attachment.item_id}/preview`,
            download_url: `/employee/attachments/${attachment.item_id}/download`,
            info_url: `/employee/attachments/${attachment.item_id}/information`,
        }
        return mappedAttachment
    })
    return result
}

/**
 * Format date string to Indonesian locale
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date or "-"
 */
export const formatDate = (dateString) => {
    if (!dateString) return "-"

    try {
        const date = new Date(dateString)
        return date.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        })
    } catch (error) {
        return "-"
    }
}

/**
 * Get icon for each tab category
 * @param {string} category - Tab category ID
 * @returns {string} PrimeIcons icon class
 */
export const getTabIcon = (category) => {
    const iconMap = {
        'basic-information': 'pi-user',
        'address': 'pi-map-marker',
        'emergency-contact': 'pi-phone',
        'payroll-account': 'pi-credit-card',
        'family': 'pi-users',
        'education': 'pi-graduation-cap',
        'social-security': 'pi-shield',
        'medical-record': 'pi-heart'
    }

    return iconMap[category] || 'pi-circle'
}

/**
 * Normalize status from various API response formats
 * @param {Object} statusData - Status data from API
 * @returns {Object|null} Normalized status object
 */
export const normalizeStatus = (statusData) => {
    if (!statusData) return null

    // Extract status from different possible formats
    const status = statusData.status || statusData.status_raw || statusData
    const statusAlias = statusData.status_alias

    // Normalize to consistent format
    if (status === true || status === '1' || status === 1 || statusAlias === 'draft') {
        return { normalized: '1', isDraft: true, isRejected: false, isNeedRevision: false }
    }
    if (status === '2' || status === 2 || statusAlias === 'waiting_approval') {
        return { normalized: '2', isDraft: false, isRejected: false, isNeedRevision: false }
    }
    if (status === '3' || status === 3 || statusAlias === 'rejected' || statusAlias === 'need_revision') {
        return { normalized: '3', isDraft: false, isRejected: true, isNeedRevision: true }
    }
    if (status === '4' || status === 4 || statusAlias === 'approved') {
        return { normalized: '4', isDraft: false, isRejected: false, isNeedRevision: false }
    }

    // Default fallback
    return { normalized: status, isDraft: false, isRejected: false, isNeedRevision: false }
}

/**
 * Get request type from tab ID
 * @param {string} tabId - Tab ID
 * @returns {string} Request type code
 */
export const getRequestTypeFromTab = (tabId) => {
    const typeMap = {
        'basic-information': 'BSC',
        'address': 'ADR',
        'emergency-contact': 'EMC',
        'family': 'FMY',
        'education': 'EDC',
        'payroll-account': 'PYR',
        'social-security': 'SSI',
        'medical-record': 'MDR',
    }
    return typeMap[tabId] || 'BSC'
}
