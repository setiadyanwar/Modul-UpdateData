import { ref } from 'vue'
import { useMasterData } from '~/composables/useMasterData'

export function useEducation() {
  const { getOptions } = useMasterData()
  const educationFormKey = ref(0)

  const enrichEducationDataWithLabels = async (educationData) => {
    if (!Array.isArray(educationData) || educationData.length === 0) {
      return
    }

    try {
      const [levels, majors, institutions] = await Promise.all([
        getOptions('EDU_LEVELS'),
        getOptions('EDU_MAJORS'),
        getOptions('EDU_INSTITUTIONS')
      ])

      educationData.forEach((record, index) => {
        if (record.edu_level_id && levels) {
          const levelData = levels.find(level => level.code == record.edu_level_id)
          if (levelData) {
            record.edu_level = levelData.value || levelData.label || levelData.name || `Level ${record.edu_level_id}`
          }
        }

        if (record.edu_major_id && majors) {
          const majorData = majors.find(major => major.code == record.edu_major_id)
          if (majorData) {
            record.edu_major = majorData.value || majorData.label || majorData.name || `Major ${record.edu_major_id}`
          }
        }

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

  const mapAttachmentsToEducationRecords = (educationRecords, attachments) => {
    if (!Array.isArray(attachments) || attachments.length === 0) {
      return []
    }

    return educationRecords.map((record, index) => {
      const recordClientKey = record.client_key

      if (!recordClientKey) {
        return null
      }

      const attachment = attachments.find(att => att.client_key === recordClientKey)

      if (!attachment) {
        return null
      }

      return {
        item_id: attachment.item_id,
        document_type: attachment.document_type,
        file_name: attachment.file_name,
        file_size: attachment.file_size,
        uploaded_date: attachment.uploaded_date,
        file_size_display: attachment.file_size_display,
        client_key: recordClientKey,
        education_record: record
      }
    }).filter(Boolean)
  }

  const validateEducationAttachments = (educationData) => {
    if (!Array.isArray(educationData) || educationData.length === 0) {
      return { isValid: true, errors: [] }
    }

    const errors = []
    educationData.forEach((edu, index) => {
      if (!edu.attachment || !edu.attachment.file_name) {
        errors.push(`Education record ${index + 1} requires an attachment`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  const getEducationTabConfig = () => ({
    id: 'education',
    label: 'Education',
    icon: 'pi-graduation-cap',
    category: 'education',
    hasDocuments: true,
    isArrayBased: true
  })

  return {
    educationFormKey,
    enrichEducationDataWithLabels,
    mapAttachmentsToEducationRecords,
    validateEducationAttachments,
    getEducationTabConfig
  }
}