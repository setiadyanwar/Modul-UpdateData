// Mapping and resolver utilities for combining baseline + old_data + new_data

export type AddressForm = {
  official_address_detail?: string
  official_address_province?: string
  official_address_city?: string
  official_address_postal_code?: string
  official_address_subdistrict?: string
  official_address_administrative_village?: string
  official_address_rt?: string
  official_address_rw?: string
  official_address_street?: string
  official_address_house_number?: string
  domicile_address_detail?: string
  domicile_address_province?: string
  domicile_address_city?: string
  domicile_address_postal_code?: string
  domicile_address_subdistrict?: string
  domicile_address_administrative_village?: string
  domicile_address_rt?: string
  domicile_address_rw?: string
  domicile_address_street?: string
  domicile_address_house_number?: string
}

const pick = (...vals: any[]) => {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== '') return String(v)
  }
  return ''
}

export const mapAddress = (src: any): AddressForm => {
  if (!src || typeof src !== 'object') return {}
  return {
    official_address_detail: pick(src.official_address_detail, src.detail_ktp),
    official_address_province: pick(src.official_address_province, src.province_ktp_id, src.province_ktp),
    official_address_city: pick(src.official_address_city, src.city_ktp_id, src.city_ktp),
    official_address_postal_code: pick(src.official_address_postal_code, src.postal_code_ktp),
    official_address_subdistrict: pick(src.official_address_subdistrict, src.sub_distric_ktp),
    official_address_administrative_village: pick(src.official_address_administrative_village, src.administrative_village_ktp),
    official_address_rt: pick(src.official_address_rt, src.rt_ktp),
    official_address_rw: pick(src.official_address_rw, src.rw_ktp),
    official_address_street: pick(src.official_address_street, src.street_name_ktp),
    official_address_house_number: pick(src.official_address_house_number, src.house_number_ktp),
    domicile_address_detail: pick(src.domicile_address_detail, src.detail_domicile),
    domicile_address_province: pick(src.domicile_address_province, src.province_domicile_id, src.province_domicile),
    domicile_address_city: pick(src.domicile_address_city, src.city_domicile_id, src.city_domicile),
    domicile_address_postal_code: pick(src.domicile_address_postal_code, src.postal_code_domicile),
    domicile_address_subdistrict: pick(src.domicile_address_subdistrict, src.sub_distric_domicile),
    domicile_address_administrative_village: pick(src.domicile_address_administrative_village, src.administrative_village_domicile),
    domicile_address_rt: pick(src.domicile_address_rt, src.rt_domicile),
    domicile_address_rw: pick(src.domicile_address_rw, src.rw_domicile),
    domicile_address_street: pick(src.domicile_address_street, src.street_name_domicile),
    domicile_address_house_number: pick(src.domicile_address_house_number, src.house_number_domicile),
  }
}

export const mergePreferDefined = <T extends Record<string, any>>(base: T, overlay: T): T => {
  const out: T = { ...(base as any) }
  Object.keys(overlay || {}).forEach(k => {
    const v = (overlay as any)[k]
    const isEmpty = v === '' || v === null || v === undefined
    if (!isEmpty) (out as any)[k] = v
  })
  return out
}

export const resolveAddress = (employeeBase: any, oldData: any, newData: any): AddressForm => {
  const e = mapAddress(employeeBase || {})
  const o = mapAddress(oldData || {})
  const n = mapAddress(newData || {})
  let resolved = mergePreferDefined<AddressForm>(e as any, o as any)
  resolved = mergePreferDefined<AddressForm>(resolved as any, n as any)
  return resolved
}

// ========== Payroll Account ==========
export type PayrollForm = {
  bank_id?: number
  number_rekening?: string
  holder_name?: string
  tax_status_id?: number
  npwp?: string
  npwp_doc?: string
  saving_book_doc?: string
}

export const mapPayroll = (src: any): PayrollForm => {
  if (!src || typeof src !== 'object') return {}
  
  // Convert string IDs to numbers for bank_id and tax_status_id
  const convertToNumber = (value: any): number | undefined => {
    if (value === null || value === undefined || value === '') return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  };
  
  return {
    bank_id: convertToNumber(pick(src.bank_id, src.bank)),
    number_rekening: pick(src.number_rekening, src.account_number),
    holder_name: pick(src.holder_name, src.account_holder_name),
    tax_status_id: convertToNumber(pick(src.tax_status_id, src.tax_status)),
    npwp: pick(src.npwp),
    npwp_doc: pick(src.npwp_doc, src.npwp_doc_id),
    saving_book_doc: pick(src.saving_book_doc, src.saving_book_doc_id),
  }
}

export const resolvePayroll = (employeeBase: any, oldData: any, newData: any): PayrollForm => {
  const e = mapPayroll(employeeBase || {})
  const o = mapPayroll(oldData || {})
  const n = mapPayroll(newData || {})
  let r = mergePreferDefined<PayrollForm>(e as any, o as any)
  r = mergePreferDefined<PayrollForm>(r as any, n as any)
  return r
}

// ========== Benefit ==========
export type SocialForm = {
  no_telkomedika?: string
  no_bpjs_tk?: string
  bpjs_tk_effective_date?: string
  no_bpjs?: string
  telkomedika_doc?: string
  bpjs_doc?: string
}

export const mapSocial = (src: any): SocialForm => {
  if (!src || typeof src !== 'object') return {}
  return {
    no_telkomedika: pick(src.no_telkomedika, src.telkomedika_card_number),
    no_bpjs_tk: pick(src.no_bpjs_tk, src.bpjs_tk_number),
    bpjs_tk_effective_date: pick(src.bpjs_tk_effective_date),
    no_bpjs: pick(src.no_bpjs, src.bpjs_health_number),
    telkomedika_doc: pick(src.telkomedika_doc),
    bpjs_doc: pick(src.bpjs_doc),
  }
}

export const resolveSocial = (employeeBase: any, oldData: any, newData: any): SocialForm => {
  const e = mapSocial(employeeBase || {})
  const o = mapSocial(oldData || {})
  const n = mapSocial(newData || {})
  let r = mergePreferDefined<SocialForm>(e as any, o as any)
  r = mergePreferDefined<SocialForm>(r as any, n as any)
  return r
}

// ========== Medical Record ==========
export type MedicalForm = {
  blood_type?: string
  height?: any
  weight?: any
  head_size?: any
  health_status?: string
  last_mcu_date?: string
  has_disability?: any
  health_concern?: string
  medical_treatment_record?: string
  vaccination_record?: string
  special_conditions?: string
}

export const mapMedical = (src: any): MedicalForm => {
  if (!src || typeof src !== 'object') return {}
  return {
    blood_type: pick(src.blood_type),
    height: pick(src.height),
    weight: pick(src.weight),
    head_size: pick(src.head_size),
    health_status: pick(src.health_status),
    last_mcu_date: pick(src.last_mcu_date),
    has_disability: pick(src.has_disability),
    health_concern: pick(src.health_concern),
    medical_treatment_record: pick(src.medical_treatment_record),
    vaccination_record: pick(src.vaccination_record),
    special_conditions: pick(src.special_conditions),
  }
}

export const resolveMedical = (employeeBase: any, oldData: any, newData: any): MedicalForm => {
  const e = mapMedical(employeeBase || {})
  const o = mapMedical(oldData || {})
  const n = mapMedical(newData || {})
  let r = mergePreferDefined<MedicalForm>(e as any, o as any)
  r = mergePreferDefined<MedicalForm>(r as any, n as any)
  return r
}

// ========== Emergency Contact (Array) ==========
export type EmergencyItem = {
  id_contact?: any
  emgc_name?: string
  emgc_relationship_id?: any
  emgc_relationship?: any
  emgc_number?: string
  emgc_address?: string
  status?: any
}

export const mapEmergencyArray = (arr: any[]): EmergencyItem[] => {
  if (!Array.isArray(arr)) return []
  
  const result = arr.map((i: any, index: number) => {
    // FIXED: Handle different data structures from API vs old_data
    const hasRelationshipId = i.emgc_relationship_id !== undefined;
    const relationshipId = hasRelationshipId ? i.emgc_relationship_id : i.emgc_relationship;
    
    // FIXED: Get relationship label from the data itself
    // Priority: relationship_label > emgc_relationship > fallback to empty (don't use ID as label)
    const relationshipLabel = i.relationship_label || (typeof i.emgc_relationship === 'string' ? i.emgc_relationship : '') || '';

    // Emergency contact relationship processing completed

    // Don't fallback to ID as label - let the form handle the label lookup
    const finalRelationshipLabel = relationshipLabel;
    
    const mapped = {
      id_contact: i.id_contact || i.id || `temp_${index}`,
      // FIXED: Map name field correctly - form expects emgc_name
      emgc_name: pick(i.emgc_name, i.name) || '',
      // FIXED: Use emgc_relationship_id as primary field for API compatibility - ensure number type
      emgc_relationship_id: relationshipId ? Number(relationshipId) : null,
      // FIXED: Use emgc_relationship for the label text (as per API standard)
      emgc_relationship: finalRelationshipLabel || '',
      emgc_number: pick(i.emgc_number, i.phone, i.phone_number) || '',
      emgc_address: pick(i.emgc_address, i.address) || '',
      status: i.status !== undefined ? i.status : 1,
    };
    
    return mapped;
  });
  
  return result;
}

export const resolveEmergency = (employeeBase: any[], oldData: any, newData: any): EmergencyItem[] => {
  const e = mapEmergencyArray(employeeBase || [])
  const o = mapEmergencyArray((oldData as any) || [])
  const n = mapEmergencyArray((newData as any) || [])

  // Emergency data resolution: employeeBase length: employeeBase?.length || 0, oldData length: oldData?.length || 0, newData length: newData?.length || 0
  // Mapped arrays: e length: e.length, o length: o.length, n length: n.length
  
  // If we have new data, we need to merge it with the original data
  if (n.length > 0) {
    // Start with the employee base data as foundation
    const baseData = e.length > 0 ? e : o

    if (baseData.length === 0) {
      return n
    }

    // Create a map of new data by id_contact for efficient lookup
    const newDataMap = new Map()
    n.forEach(newItem => {
      const id = newItem.id_contact
      if (id) {
        newDataMap.set(id, newItem)
      }
    })

    // FIXED: For edit draft mode, only show items that are being edited (in newData)
    // Instead of showing all baseData items, only show items with changes
    const mergedData: EmergencyItem[] = []

    // First, process items that have changes (merge base with new data)
    n.forEach(newItem => {
      const id = newItem.id_contact

      if (id) {
        // Find corresponding base item
        const baseItem = baseData.find(base => base.id_contact === id)

        if (baseItem) {
          // Merge base item with new changes, preferring non-empty new values
          const merged: EmergencyItem = { ...baseItem }
          ;(Object.keys(newItem) as (keyof EmergencyItem)[]).forEach((key) => {
            const newValue = newItem[key]
            if (newValue !== null && newValue !== undefined && newValue !== '') {
              ;(merged as EmergencyItem)[key] = newValue as any
            }
          })
          mergedData.push(merged)
        } else {
          // This is a completely new item
          mergedData.push(newItem)
        }
      }
    })

    // Add remaining baseData items that are NOT being edited (for view-only context)
    // NOTE: For edit draft mode, we might want to skip this to show only edited items
    // Uncomment below if you want to show all original items
    /*
    baseData.forEach(baseItem => {
      const id = baseItem.id_contact
      if (!newDataMap.has(id)) {
        mergedData.push(baseItem)
      }
    })
    */

    return mergedData
  }
  
  // Fallback to employee base data (original data) or old data
  if (e.length > 0) return e
  return o
}

// ========== Family Members (Array) ==========
export type FamilyItem = {
  id_family?: any
  name?: string
  birth_place?: string
  birth_date?: string
  address?: string
  occupation?: string
  relation_id?: any
  relation?: string
  marital_status_id?: any
  marital_status?: string
  gender_id?: any
  gender?: string
  member_sequence?: any
  no_telkomedika?: string
  member_status?: any
  kk_doc_id?: any
  kk_doc?: any
  status?: any
}

export const mapFamilyArray = (arr: any[]): FamilyItem[] => {
  if (!Array.isArray(arr)) return []
  return arr.map((i: any) => {
    // Handle marital status mapping - if we have marital_status_id but no marital_status text
    let maritalStatusText = pick(i.marital_status);
    const maritalStatusId = pick(i.marital_status_id);
    
    // If we have marital_status_id but no marital_status text, try to map it
    // Note: marital_status_id can be 0 (SINGLE), so we check for !== null and !== undefined
    if (maritalStatusId !== null && maritalStatusId !== undefined && maritalStatusId !== '' && !maritalStatusText) {
      const maritalStatusMap: { [key: string]: string } = {
        '0': 'SINGLE',
        '1': 'MARRIED', 
        '2': 'DIVORCED',
        '3': 'WIDOWED'
      };
      maritalStatusText = maritalStatusMap[String(maritalStatusId)] || '';
    }
    
    return {
      id_family: i.id_family || i.id,
      name: pick(i.name),
      birth_place: pick(i.birth_place),
      birth_date: pick(i.birth_date),
      address: pick(i.address),
      occupation: pick(i.occupation),
      relation_id: pick(i.relation_id),
      relation: pick(i.relation),
      marital_status_id: maritalStatusId,
      marital_status: maritalStatusText,
      gender_id: pick(i.gender_id),
      gender: pick(i.gender),
      member_sequence: pick(i.member_sequence),
      no_telkomedika: pick(i.no_telkomedika),
      member_status: pick(i.member_status),
      kk_doc_id: pick(i.kk_doc_id),
      kk_doc: pick(i.kk_doc),
      status: i.status !== undefined ? i.status : 1,
    }
  })
}

export const resolveFamily = (employeeBase: any[], oldData: any, newData: any): FamilyItem[] => {
  const e = mapFamilyArray(employeeBase || [])
  const o = mapFamilyArray((oldData as any) || [])
  const n = mapFamilyArray((newData as any) || [])

  // Family data resolution: employeeBase length: employeeBase?.length || 0, oldData length: oldData?.length || 0, newData length: newData?.length || 0
  // Mapped arrays: e length: e.length, o length: o.length, n length: n.length
  
  // If we have new data, we need to merge it with the original data
  if (n.length > 0) {
    // Start with the employee base data as foundation
    const baseData = e.length > 0 ? e : o
    
    if (baseData.length === 0) {
      return n
    }
    
    
    // Create a map of new data by id_family for efficient lookup
    const newDataMap = new Map()
    n.forEach(newItem => {
      const id = newItem.id_family
      if (id) {
        newDataMap.set(id, newItem)
      }
    })
    
    // Merge base data with new data
    const mergedData = baseData.map(baseItem => {
      const id = baseItem.id_family
      const newItem = newDataMap.get(id)
      
      if (newItem) {
        // Merge base item with new changes, preferring non-empty new values
        const merged: FamilyItem = { ...baseItem }
        ;(Object.keys(newItem) as (keyof FamilyItem)[]).forEach((key) => {
          const newValue = newItem[key]
          if (newValue !== null && newValue !== undefined && newValue !== '') {
            ;(merged as FamilyItem)[key] = newValue as any
          }
        })
        
        // Special handling: if relation_id changed, also update relation field for form compatibility
        // Debug info: newItem.relation_id: newItem.relation_id, newItem.relation: newItem.relation, baseItem.relation: baseItem.relation
        
        if (newItem.relation_id !== undefined && newItem.relation_id !== null && newItem.relation_id !== '') {
          merged.relation = newItem.relation_id
        } else if (newItem.relation !== undefined && newItem.relation !== null && newItem.relation !== '') {
          // Also handle direct relation field updates
          merged.relation = newItem.relation
        } else {
        }
        
        return merged
      }
      
      return baseItem
    })
    
    // Add any completely new items that don't exist in base data
    n.forEach(newItem => {
      const id = newItem.id_family
      if (id && !baseData.find(base => base.id_family === id)) {
        // Ensure relation field is set for form compatibility
        const itemToAdd = { ...newItem }
        if (newItem.relation_id !== undefined && newItem.relation_id !== null && newItem.relation_id !== '') {
          itemToAdd.relation = newItem.relation_id
        } else if (newItem.relation !== undefined && newItem.relation !== null && newItem.relation !== '') {
          itemToAdd.relation = newItem.relation
        }
        mergedData.push(itemToAdd)
      }
    })
    
    return mergedData
  }
  
  // Fallback to employee base data (original data) or old data
  
  if (e.length > 0) {
    return e
  }
  
  return o
}

// ========== Education (Array) ==========
export type EducationItem = {
  id_education?: any
  edu_level?: any
  edu_level_id?: any
  edu_major?: any
  edu_major_id?: any
  edu_institution?: any
  edu_institution_id?: any
  start_date?: string
  end_date?: string
  ijazah_doc?: any
  ijazah_doc_id?: any
  status?: any
}

export const mapEducationArray = (arr: any[]): EducationItem[] => {
  if (!Array.isArray(arr)) return []
  
  return arr.map((i: any) => ({
    id_education: i.id_education || i.id,
    // Use the ID fields as primary, fallback to label fields for backwards compatibility
    edu_level_id: pick(i.edu_level_id, i.id_edu_level, i.edu_level),
    edu_level: pick(i.edu_level, i.education_level, i.level),
    edu_major_id: pick(i.edu_major_id, i.id_edu_major, i.edu_major),
    edu_major: pick(i.edu_major, i.major, i.field_of_study),
    edu_institution_id: pick(i.edu_institution_id, i.id_edu_institution, i.edu_institution),
    edu_institution: pick(i.edu_institution, i.institution, i.school_name),
    // API uses start_date and end_date, not edu_start_date/edu_end_date
    start_date: pick(i.start_date, i.edu_start_date),
    end_date: pick(i.end_date, i.edu_end_date),
    ijazah_doc_id: pick(i.ijazah_doc_id, i.ijazah_doc),
    ijazah_doc: pick(i.ijazah_doc),
    status: i.status !== undefined ? i.status : 1,
  }));
}

export const resolveEducation = (employeeBase: any[], oldData: any, newData: any): EducationItem[] => {
  const e = mapEducationArray(employeeBase || [])
  const o = mapEducationArray((oldData as any) || [])
  const n = mapEducationArray((newData as any) || [])
  
  // Debug logging removed for cleaner output
  
  // If we have new data, we need to merge it with the original data
  if (n.length > 0) {
    // Start with the employee base data as foundation
    const baseData = e.length > 0 ? e : o
    
    if (baseData.length === 0) {
      return n
    }
    
    // Create a map of new data by id_education for efficient lookup
    const newDataMap = new Map()
    n.forEach(newItem => {
      const id = newItem.id_education
      if (id) {
        newDataMap.set(id, newItem)
      }
    })
    
    // Merge base data with new data
    const mergedData = baseData.map(baseItem => {
      const id = baseItem.id_education
      const newItem = newDataMap.get(id)
      
      if (newItem) {
        // Merge base item with new changes, preferring non-empty new values
        const merged: EducationItem = { ...baseItem }
        ;(Object.keys(newItem) as (keyof EducationItem)[]).forEach((key) => {
          const newValue = newItem[key]
          if (newValue !== null && newValue !== undefined && newValue !== '') {
            ;(merged as EducationItem)[key] = newValue as any
          }
        })
        return merged
      }
      
      return baseItem
    })
    
    // Add any completely new items that don't exist in base data
    n.forEach(newItem => {
      const id = newItem.id_education
      if (id && !baseData.find(base => base.id_education === id)) {
        mergedData.push(newItem)
      }
    })
    
    return mergedData
  }
  
  // Fallback to employee base data (original data) or old data
  if (e.length > 0) return e
  return o
}


