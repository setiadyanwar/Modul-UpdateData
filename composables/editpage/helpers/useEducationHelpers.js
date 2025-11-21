/**
 * Helper functions for education data handling
 * Extracted from edit page to reduce file size
 */

/**
 * Enrich education data with labels from master data
 * @param {Array} educationData - Array of education records
 * @param {Function} getOptions - Function to get master data options
 */
export const enrichEducationDataWithLabels = async (educationData, getOptions) => {
  if (!Array.isArray(educationData) || educationData.length === 0) {
    return
  }

  try {
    // Load master data for education
    const [levels, majors, institutions] = await Promise.all([
      getOptions('EDU_LEVELS'),
      getOptions('EDU_MAJORS'),
      getOptions('EDU_INSTITUTIONS')
    ])

    // Enrich each education record with labels
    educationData.forEach((record) => {
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
    // console.error('❌ Error enriching education data with labels:', error)
  }
}

/**
 * Map request type code to tab ID
 * @param {string} type - Request type code (BSC, ADR, etc.)
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
  return mapping[type] || 'basic-information'
}

/**
 * Map attachments to education records by client_key
 * @param {Array} educationRecords - Education records
 * @param {Array} attachments - Attachment records
 * @returns {Array} Mapped attachments
 */
export const mapAttachmentsToEducationRecords = (educationRecords, attachments) => {
  if (!Array.isArray(attachments) || attachments.length === 0) {
    return []
  }

  // Map attachments by client_key to education records
  const result = educationRecords.map((record) => {
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

  return result.filter(Boolean)
}
