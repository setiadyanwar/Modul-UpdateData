import { ref } from 'vue'
import { useMasterData } from './useMasterData'

export const useDocumentTypes = () => {
  const { getOptions } = useMasterData()
  
  // Start empty; will be populated from master API
  const documentTypes = ref([])
  
  const isLoading = ref(false)
  const error = ref(null)

  // Fetch document types from master API using useMasterData to avoid duplicate API calls
  const fetchDocumentTypes = async () => {
    try {
      isLoading.value = true
      error.value = null

  // ✅ OPTIMIZED: Use useMasterData instead of direct API call to avoid duplicates
  let data;
  try {
    // Use useMasterData.getOptions to leverage caching and deduplication
    const rawData = await getOptions('EMP_DOCUMENT');
    
    // getOptions returns array directly, but we need to handle response format
    if (Array.isArray(rawData)) {
      data = rawData;
    } else if (rawData && rawData.data) {
      data = rawData.data;
    } else {
      data = rawData;
    }
  } catch (apiError) {
    // console.warn('⚠️ [useDocumentTypes] API call failed, using fallback data:', apiError.message);
    // Use fallback data instead of returning empty array
    documentTypes.value = [
      { code: '1', value: 'Professional Photo', id: 1, order: 7 },
      { code: '2', value: 'KK', id: 2, order: 4 },
      { code: '3', value: 'KTP', id: 3, order: 5 },
      { code: '4', value: 'NPWP', id: 4, order: 6 },
      { code: '5', value: 'Telkomedika', id: 5, order: 8 },
      { code: '6', value: 'BPJS', id: 6, order: 1 },
      { code: '7', value: 'Buku Tabungan (Saving Book)', id: 7, order: 2 },
      { code: '8', value: 'Passport', id: 8, order: 3 }
    ];
    return documentTypes.value;
  }
  // Debug removed

      if (data) {
        // Handle different response formats. Some endpoints return:
        // - data: [ ... ]
        // - data: { master_data: [ ... ], total_records: N }
        // - data: { items: [ ... ] }
        // We try known keys first, then fall back to the first array found in the object.
        let dataArray = data

  let usedArrayKey = null
  if (!Array.isArray(dataArray)) {
          const knownArrayKeys = ['master_data', 'items', 'data', 'results', 'rows', 'list']
          for (const k of knownArrayKeys) {
            if (data && typeof data === 'object' && Array.isArray(data[k])) {
              dataArray = data[k]
              usedArrayKey = k
              break
            }
          }

          // If master_data found, filter by expected category/subcategory
          if (data && typeof data === 'object' && Array.isArray(data.master_data)) {
            const master = data.master_data

            // tolerant matcher for category/subcategory field names
            const matchesCategory = (item, cat, subcat) => {
              if (!item || typeof item !== 'object') return false
              const cands = [
                item.category,
                item.cat,
                item.master_category,
                item.master_data_category,
                item.category_name
              ].filter(Boolean)
              const subcands = [
                item.subcategory,
                item.sub_cat,
                item.sub_category,
                item.master_subcategory,
                item.subcategory_name
              ].filter(Boolean)

              const catMatch = cands.length === 0 ? true : cands.some(v => String(v).toLowerCase() === String(cat).toLowerCase())
              const subMatch = subcands.length === 0 ? true : subcands.some(v => String(v).toLowerCase() === String(subcat).toLowerCase())
              return catMatch && subMatch
            }

            const filtered = master.filter(item => matchesCategory(item, 'emp_document', 'doc_type'))
            if (filtered.length > 0) {
              dataArray = filtered
              usedArrayKey = 'master_data(filtered_by_category)'
            } else {
              // if filter produced nothing, fall back to using full master array
              dataArray = master
              usedArrayKey = 'master_data(full)'
            }
          }

          // If still not an array, look for the first nested array value
          if (!Array.isArray(dataArray) && data && typeof data === 'object') {
            for (const [k, val] of Object.entries(data)) {
              if (Array.isArray(val)) {
                dataArray = val
                usedArrayKey = k
                break
              }
            }
          }

          if (!Array.isArray(dataArray)) {
            // Check if response is HTML (error page) instead of JSON
            if (typeof data === 'string' && data.includes('<html>')) {
              // console.error('❌ API returned HTML instead of JSON:', data.substring(0, 200) + '...');
              // Return empty array instead of throwing error to prevent app crashes
              return [];
            }
            // If it's not an array and not HTML, return empty array
            // console.warn('⚠️ API response is not an array, returning empty array');
            return [];
          }
        }

  // Save raw response for quick inspection in the browser console and record which array key was used
  try { if (typeof window !== 'undefined') window.__lastMasterDataResponse = data } catch { /* noop */ }
  try { if (typeof window !== 'undefined') window.__lastDocTypesKeyUsed = usedArrayKey || 'direct_array' } catch { /* noop */ }

        // Transform the response data to a usable format (tolerant to various field names)
        const normalize = (item) => {
          const code = (item && (item.code || item.id || item.id_system_master || item.master_id || item.id_master))
            ? String(item.code || item.id || item.id_system_master || item.master_id || item.id_master)
            : undefined

          const value = item && (
            item.value || item.name || item.label || item.master_value || item.master_name || item.description || item.text || item.display_name
          )

          const id = item && (item.id_system_master || item.id || item.master_id || item.id_master)
          const order = item && (item.order_1 || item.order || item.order_no || 99)

          return {
            code: code || String(id || value || '0'),
            value: value || String(code || id || 'Unknown'),
            id: id,
            order: order || 99
          }
        }

        documentTypes.value = dataArray.map(normalize).sort((a, b) => a.order - b.order)

        // Debug: record which key/array was used and count
        try { if (typeof window !== 'undefined') window.__lastDocTypesMeta = {
          usedKey: usedArrayKey || 'direct_array',
          usedArrayLength: Array.isArray(dataArray) ? dataArray.length : 0,
          sampleRawItem: Array.isArray(dataArray) && dataArray.length ? dataArray[0] : null
        }} catch { /* noop */ }
        return documentTypes.value
      } else {
        // console.warn('⚠️ [useDocumentTypes] API response not successful, using fallback data');
        // Use fallback data when response is not successful
        documentTypes.value = [
          { code: '1', value: 'Professional Photo', id: 1, order: 7 },
          { code: '2', value: 'KK', id: 2, order: 4 },
          { code: '3', value: 'KTP', id: 3, order: 5 },
          { code: '4', value: 'NPWP', id: 4, order: 6 },
          { code: '5', value: 'Telkomedika', id: 5, order: 8 },
          { code: '6', value: 'BPJS', id: 6, order: 1 },
          { code: '7', value: 'Buku Tabungan (Saving Book)', id: 7, order: 2 },
          { code: '8', value: 'Passport', id: 8, order: 3 }
        ];
        return documentTypes.value;
      }
    } catch (err) {
      // console.error('Error fetching document types:', err)
      error.value = err.message

      // Fallback: provide default document types if API fails - based on actual master data
      documentTypes.value = [
        { code: '1', value: 'Professional Photo', id: 1, order: 7 },
        { code: '2', value: 'KK', id: 2, order: 4 },
        { code: '3', value: 'KTP', id: 3, order: 5 },
        { code: '4', value: 'NPWP', id: 4, order: 6 },
        { code: '5', value: 'Telkomedika', id: 5, order: 8 },
        { code: '6', value: 'BPJS', id: 6, order: 1 },
        { code: '7', value: 'Buku Tabungan (Saving Book)', id: 7, order: 2 },
        { code: '8', value: 'Ijazah', id: 8, order: 3 }
      ]

      return documentTypes.value
    } finally {
      isLoading.value = false
    }
  }

  // Get document type code by value
  const getDocumentTypeCode = (value) => {
    const docType = documentTypes.value.find(type => 
      type.value.toLowerCase() === value.toLowerCase() ||
      type.code === value
    )
    return docType?.code || '7' // default to 'Other'
  }

  // Get document type by code
  const getDocumentTypeByCode = (code) => {
    return documentTypes.value.find(type => type.code === code)
  }

  return {
    documentTypes,
    isLoading,
    error,
    fetchDocumentTypes,
    getDocumentTypeCode,
    getDocumentTypeByCode
  }
}
