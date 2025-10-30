export function useChangeDetection() {

  const generateClientKey = () => {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
  }

  const normalizeStatus = (statusData) => {
    if (!statusData) return null

    const status = statusData.status || statusData.status_raw || statusData
    const statusAlias = statusData.status_alias

    if (status === true || status === '1' || status === 1 || statusAlias === 'draft') {
      return { normalized: '1', isDraft: true, isRejected: false }
    }
    if (status === '2' || status === 2 || statusAlias === 'waiting_approval') {
      return { normalized: '2', isDraft: false, isRejected: false }
    }
    if (status === '3' || status === 3 || statusAlias === 'rejected' || statusAlias === 'need_revision') {
      return { normalized: '3', isDraft: false, isRejected: true }
    }
    if (status === '4' || status === 4 || statusAlias === 'approved') {
      return { normalized: '4', isDraft: false, isRejected: false }
    }

    return { normalized: status, isDraft: false, isRejected: false }
  }

  const normalizeData = (data, tabType, includeIds = true) => {
    if (!data) return null

    if (Array.isArray(data)) {
      return data.map(item => {
        if (!item || typeof item !== 'object') return item

        const normalized = { ...item }

        if (!includeIds) {
          delete normalized.id
          delete normalized.item_id
        }

        if (!normalized.client_key) {
          normalized.client_key = generateClientKey()
        }

        return normalized
      })
    }

    if (typeof data === 'object') {
      const normalized = { ...data }

      if (!includeIds) {
        delete normalized.id
        delete normalized.item_id
      }

      return normalized
    }

    return data
  }

  const deepEqual = (obj1, obj2) => {
    if (obj1 === obj2) return true

    if (obj1 == null || obj2 == null) return obj1 === obj2

    if (typeof obj1 !== typeof obj2) return false

    if (typeof obj1 !== 'object') return obj1 === obj2

    if (Array.isArray(obj1) !== Array.isArray(obj2)) return false

    if (Array.isArray(obj1)) {
      if (obj1.length !== obj2.length) return false
      for (let i = 0; i < obj1.length; i++) {
        if (!deepEqual(obj1[i], obj2[i])) return false
      }
      return true
    }

    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)

    if (keys1.length !== keys2.length) return false

    for (const key of keys1) {
      if (!(key in obj2)) return false
      if (!deepEqual(obj1[key], obj2[key])) return false
    }

    return true
  }

  const compareData = (current, original, tabType) => {
    if (!current && !original) return false

    const normalizedCurrent = normalizeData(current, tabType, false)
    const normalizedOriginal = normalizeData(original, tabType, false)

    return !deepEqual(normalizedCurrent, normalizedOriginal)
  }

  const hasChanges = (formData, requestDetail) => {
    if (!formData || !requestDetail) return false

    const categories = ['basic-information', 'address', 'payroll-account', 'education', 'emergency-contact', 'family']

    for (const category of categories) {
      const currentData = formData[category]
      const originalData = requestDetail[category]

      if (compareData(currentData, originalData, category)) {
        return true
      }
    }

    return false
  }

  const calculateChanges = (formData, requestDetail, activeTab) => {
    if (!formData || !requestDetail || !activeTab) {
      return { hasChanges: false, changes: {} }
    }

    const currentData = formData[activeTab]
    const originalData = requestDetail[activeTab]

    const hasTabChanges = compareData(currentData, originalData, activeTab)

    return {
      hasChanges: hasTabChanges,
      changes: {
        [activeTab]: {
          current: currentData,
          original: originalData,
          hasChanges: hasTabChanges
        }
      }
    }
  }

  const getChangedFields = (current, original) => {
    if (!current || !original) return []

    const changes = []

    if (Array.isArray(current) && Array.isArray(original)) {
      const maxLength = Math.max(current.length, original.length)
      for (let i = 0; i < maxLength; i++) {
        const currentItem = current[i]
        const originalItem = original[i]

        if (!deepEqual(currentItem, originalItem)) {
          changes.push(`Item ${i + 1}`)
        }
      }
    } else if (typeof current === 'object' && typeof original === 'object') {
      const allKeys = new Set([...Object.keys(current), ...Object.keys(original)])

      for (const key of allKeys) {
        if (!deepEqual(current[key], original[key])) {
          changes.push(key)
        }
      }
    }

    return changes
  }

  return {
    generateClientKey,
    normalizeStatus,
    normalizeData,
    deepEqual,
    compareData,
    hasChanges,
    calculateChanges,
    getChangedFields
  }
}