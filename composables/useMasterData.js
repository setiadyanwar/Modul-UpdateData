import { readonly } from "vue";
import { useState } from "#app";

// ✅ SINGLETON: Global maps for shared state (non-reactive, safe for module scope)
const cache = new Map();
const loadingPromises = new Map();
const cacheExpiry = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes cache TTL

// ✅ SINGLETON: Rate limiting to prevent server overload
const requestTimestamps = new Map();
const RATE_LIMIT_WINDOW = 5 * 1000; // 5 seconds between requests for same category
const MAX_REQUESTS_PER_WINDOW = 3; // Max 3 requests per 5 seconds per category

// ✅ SINGLETON: Request deduplication with better tracking
const activeRequests = new Set();
const requestCounters = new Map();

export const useMasterData = () => {
  // ✅ FIXED: Move useState inside composable function to avoid Nuxt error
  // useState with same key returns same instance across all calls (singleton behavior)
  const masterData = useState('masterData', () => ({}));
  const loading = useState('masterDataLoading', () => false);
  const error = useState('masterDataError', () => null);

  // Available categories for master data
  const availableCategories = [
    'GENDER',
    'RELIGION', 
    'MARITAL_STATUS',
    'FAMILY_RELATION',
    // NEW: generic FAMILY category supports sub_category like occupation
    'FAMILY',
    'MEMBER_STATUS',
    'CLOTHING',
    'NATIONALITY',
    'PROVINCE',
    'CITY',
    'BANK',
    'EDU_INSTITUTIONS',
    'EDU_LEVELS',
    'EDU_MAJORS',
    'EDUCATION_INSTITUTION',
    'EDUCATION_LEVEL',
    'EDUCATION_MAJOR',
    'TAX_STATUS',
    'EMP_HEALTH',
  ];

  // ✅ NEW: Check if cache is still valid
  const isCacheValid = (cacheKey) => {
    const expiry = cacheExpiry.get(cacheKey);
    return expiry && Date.now() < expiry;
  };

  // ✅ NEW: Rate limiting check
  const checkRateLimit = (category) => {
    const now = Date.now();
    const timestamps = requestTimestamps.get(category) || [];
    
    // Remove old timestamps outside the window
    const validTimestamps = timestamps.filter(time => now - time < RATE_LIMIT_WINDOW);
    
    if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
      // Rate limit exceeded
      return false;
    }
    
    // Add current timestamp
    validTimestamps.push(now);
    requestTimestamps.set(category, validTimestamps);
    return true;
  };

  // ✅ NEW: Request deduplication
  const getRequestKey = (category, subcategory) => {
    return subcategory ? `${category}_${subcategory}` : category;
  };

  // ✅ OPTIMIZED: Load master data with enhanced caching and rate limiting
  const loadMasterData = async (category, subcategory = null) => {
    if (!availableCategories.includes(category)) {
      return [];
    }

    const cacheKey = subcategory ? `${category}_${subcategory}` : category;
    const requestKey = getRequestKey(category, subcategory);

    // ✅ CHECK 1: Return cached data if valid
    if (masterData.value[cacheKey] && isCacheValid(cacheKey)) {
      // Cache hit
      return masterData.value[cacheKey];
    }

    // ✅ CHECK 2: Prevent duplicate API calls for the same category
    if (loadingPromises.has(requestKey)) {
      // Request already in progress
      return loadingPromises.get(requestKey);
    }

    // ✅ CHECK 3: Rate limiting
    if (!checkRateLimit(category)) {
      // Return cached data even if expired, or empty array
      const cachedData = masterData.value[cacheKey] || [];
      // Rate limited, returning cached data
      return cachedData;
    }

    // ✅ CHECK 4: Request deduplication
    if (activeRequests.has(requestKey)) {
      // Request already active
      return loadingPromises.get(requestKey);
    }

    loading.value = true;
    error.value = null;
    activeRequests.add(requestKey);

    // ✅ NEW: Track request count for monitoring
    const currentCount = requestCounters.get(category) || 0;
    requestCounters.set(category, currentCount + 1);
    // Request count incremented

    // Create promise for this category
    const loadPromise = (async () => {
      try {
        // Map logical category -> real endpoint
        let endpoint = null;

        // Categories that use query param ?category=...
        const queryCategories = ['GENDER', 'RELIGION', 'MARITAL_STATUS', 'FAMILY_RELATION', 'MEMBER_STATUS', 'CLOTHING', 'EMP_HEALTH', 'FAMILY'];

        if (queryCategories.includes(category)) {
          // Special handling for FAMILY_RELATION - API uses lowercase
          if (category === 'FAMILY_RELATION') {
            endpoint = `/master-api/?category=family_relation`;
          } else if (category === 'FAMILY') {
            // FAMILY with optional sub_category e.g. occupation
            endpoint = `/master-api/?category=family${subcategory ? `&sub_category=${subcategory}` : ''}`;
          } else if (category === 'EMP_HEALTH') {
            // Special handling for EMP_HEALTH with subcategory support
            endpoint = `/master-api/?category=emp_health${subcategory ? `&sub_category=${subcategory}` : ''}`;
          } else {
            endpoint = `/master-api/?category=${category.toLowerCase()}`;
          }
        } else {
          // Direct endpoints for collection resources
          // NOTE: Backend no longer provides default limit, so we must explicitly set limit parameter
          const DEFAULT_LIMIT = 1000; // Set high limit to ensure all data is retrieved
          
          switch (category) {
            case 'PROVINCE':
              endpoint = `/master-api/provinces?limit=${DEFAULT_LIMIT}`;
              break;
            case 'CITY':
              endpoint = `/master-api/cities?limit=${DEFAULT_LIMIT}`;
              break;
            case 'BANK':
              endpoint = `/master-api/banks?limit=${DEFAULT_LIMIT}`;
              break;
            case 'TAX_STATUS':
              endpoint = `/master-api/tax-statuses?limit=${DEFAULT_LIMIT}`;
              break;
            case 'NATIONALITY':
              endpoint = `/master-api/nations?limit=${DEFAULT_LIMIT}`;
              break;
            case 'EDU_INSTITUTIONS':
              endpoint = `/master-api/edu-institutions?limit=${DEFAULT_LIMIT}`;
              break;
            case 'EDU_LEVELS':
              endpoint = `/master-api/edu-levels?limit=${DEFAULT_LIMIT}`;
              break;
            case 'EDU_MAJORS':
              endpoint = `/master-api/edu-majors?limit=${DEFAULT_LIMIT}`;
              break;
            case 'EDUCATION_INSTITUTION':
              endpoint = `/master-api/edu-institutions?limit=${DEFAULT_LIMIT}`;
              break;
            case 'EDUCATION_LEVEL':
              endpoint = `/master-api/edu-levels?limit=${DEFAULT_LIMIT}`;
              break;
            case 'EDUCATION_MAJOR':
              endpoint = `/master-api/edu-majors?limit=${DEFAULT_LIMIT}`;
              break;

            default:
              // Generic master endpoint with optional sub_category support (correct param name)
              endpoint = `/master-api/?category=${category.toLowerCase()}${subcategory ? `&sub_category=${subcategory}` : ''}&limit=${DEFAULT_LIMIT}`;
          }
        }

        // Loading data from endpoint

        // Load from endpoint
        const { useApi } = await import('./useApi');
        const { apiGet } = useApi();
        const response = await apiGet(endpoint);

        // console.log(`[useMasterData] API Response for ${cacheKey}:`, {
        //   endpoint,
        //   hasResponse: !!response,
        //   responseType: typeof response,
        //   responseKeys: response ? Object.keys(response) : [],
        //   responseData: response,
        //   responseDataKeys: response?.data ? Object.keys(response.data) : [],
        //   responseDataData: response?.data
        // });

        // Helper to extract items from response
        const extractItems = (res) => {
          if (!res) return [];
          
          // If axios-like response: actual body may be in res.data
          const body = res.data ?? res;

          if (Array.isArray(body)) return body;
          
          // Handle direct response structure (like { "items": [...] })
          if (body?.items && Array.isArray(body.items)) return body.items;
          if (body?.master_data && Array.isArray(body.master_data)) return body.master_data;
          
          // Nested: { data: { items: [...] } }
          if (body?.data && Array.isArray(body.data)) return body.data;
          if (body?.data?.items && Array.isArray(body.data.items)) return body.data.items;
          if (body?.data?.master_data && Array.isArray(body.data.master_data)) return body.data.master_data;
          
          // Check if response has any array properties at root level
          const rootArrayProps = Object.keys(body).filter(key => Array.isArray(body[key]));
          if (rootArrayProps.length > 0) {
            return body[rootArrayProps[0]]; // Use the first array property found
          }
          
          return [];
        };

        let raw = extractItems(response) || [];

        // console.log(`[useMasterData] Extracted raw items for ${cacheKey}:`, {
        //   rawLength: raw.length,
        //   firstRawItem: raw[0],
        //   sampleRawItems: raw.slice(0, 3)
        // });

        // If subcategory provided but backend returns unfiltered list, filter client-side by sub_category
        if (subcategory && Array.isArray(raw) && raw.length > 0) {
          const subcatKeyCandidates = ['sub_category', 'subCategory', 'subcategory'];
          const hasSubcatKey = (obj) => subcatKeyCandidates.some(k => Object.prototype.hasOwnProperty.call(obj, k));
          if (hasSubcatKey(raw[0])) {
            raw = raw.filter(it => {
              const sc = it.sub_category ?? it.subCategory ?? it.subcategory;
              return String(sc).toLowerCase() === String(subcategory).toLowerCase();
            });
          }
        }

        // Raw items extracted

        if (raw.length === 0) {
          // console.warn(`[useMasterData] No data returned for ${cacheKey}`);
          return [];
        }

        // Normalize different API response shapes into consistent format
        const normalized = raw.map((it) => {
          if (!it) return null;

          // Handle province responses
          if (it.province_name) {
            return { 
              code: String(it.id_province || it.id || ''), 
              value: it.province_name, 
              order_1: 0 
            };
          }
          // Handle city responses  
          if (it.city_name) {
            return { 
              code: String(it.id_city || it.id || ''), 
              value: it.city_name, 
              order_1: 0 
            };
          }
          // Handle bank responses
          if (it.bank_name) {
            return { 
              code: String(it.id_bank || it.id || ''), 
              value: it.bank_name, 
              order_1: 0 
            };
          }
          // Handle education institution responses
          if (it.name && (category === 'EDU_INSTITUTIONS' || category === 'EDUCATION_INSTITUTION')) {
            return { 
              code: String(it.id_edu_institution || it.id || ''), 
              value: it.name, 
              order_1: 0 
            };
          }
          // Handle education level responses
          if (it.name && (category === 'EDU_LEVELS' || category === 'EDUCATION_LEVEL')) {
            return { 
              code: String(it.id_edu_level || it.id || ''), 
              value: it.name, 
              order_1: 0 
            };
          }
          // Handle education major responses
          if (it.name && (category === 'EDU_MAJORS' || category === 'EDUCATION_MAJOR')) {
            return { 
              code: String(it.id_edu_major || it.id || ''), 
              value: it.name, 
              order_1: 0 
            };
          }
          // Handle tax status responses
          if (it.status_pajak && category === 'TAX_STATUS') {
            return { 
              code: String(it.id_status_pajak || it.id || ''), 
              value: it.status_pajak, 
              order_1: 0 
            };
          }
          // Handle nationality responses
          if (it.country_name && category === 'NATIONALITY') {
            return { 
              code: String(it.id_country || it.id || ''), 
              value: it.country_name, 
              order_1: 0 
            };
          }

          // Handle provinces format: { id_province, province_name }
          if (it.id_province !== undefined || it.province_name !== undefined) {
            return {
              code: String(it.id_province ?? ''),
              value: it.province_name ?? '',
              label: it.province_name ?? '',
              order_1: it.order_1 || 0
            };
          }

          // Handle cities format: { id_city, id_province, city_name }  
          if (it.id_city !== undefined || it.city_name !== undefined) {
            return {
              code: String(it.id_city ?? ''),
              value: it.city_name ?? '',
              label: it.city_name ?? '',
              id_province: it.id_province, // Keep province relation for filtering
              order_1: it.order_1 || 0
            };
          }

          // Handle FAMILY_RELATION specifically
          if (category === 'FAMILY_RELATION') {
            return {
              code: String(it.code ?? it.id ?? it.id_family_relation ?? ''),
              value: it.value ?? it.name ?? it.relationship_name ?? it.label ?? it.description ?? '',
              order_1: it.order_1 || 0
            };
          }

          // Special handling for EMP_HEALTH: prefer human-readable description/name over numeric value
          if (category === 'EMP_HEALTH') {
            return {
              code: String(it.code ?? it.id ?? ''),
              value: it.description ?? it.name ?? it.label ?? it.value ?? '',
              order_1: it.order_1 || 0
            };
          }

          // Handle standard master_data format (code/value from category endpoints)
          const normalizedItem = {
            code: String(it.code ?? it.id ?? ''),
            value: it.value ?? it.name ?? it.label ?? it.description ?? '',
            order_1: it.order_1 || 0
          };

          // Debug code removed

          return normalizedItem;
        }).filter(Boolean);

        // ✅ NEW: Set cache with expiry
        masterData.value[cacheKey] = normalized;
        cacheExpiry.set(cacheKey, Date.now() + CACHE_TTL);
        
        // Data normalized successfully
        
        // Only log in development
        if (process.dev) {
          // Successfully loaded data
        }
        
        return normalized;
      } catch (err) {
        // Only log in development
        if (process.dev) {
          // Error loading master data
        }
        error.value = err.message || `Failed to load master data for ${cacheKey}`;
        
        // ✅ NEW: Return cached data even if expired on error
        const cachedData = masterData.value[cacheKey] || [];
        if (cachedData.length > 0) {
          // Only log in development
          if (process.dev) {
            // Returning cached data on error
          }
          return cachedData;
        }
        
        return [];
      } finally {
        loading.value = false;
        // Remove from loading promises and active requests
        loadingPromises.delete(requestKey);
        activeRequests.delete(requestKey);
      }
    })();

    // Store the promise to prevent duplicate calls
    loadingPromises.set(requestKey, loadPromise);
    return loadPromise;
  };

  // ✅ OPTIMIZED: Get master data with better caching
  const getMasterData = async (category, subcategory = null) => {
    const cacheKey = subcategory ? `${category}_${subcategory}` : category;
    
    // Return cached data if available and valid
    if (masterData.value[cacheKey] && isCacheValid(cacheKey)) {
      // Using cached data
      return masterData.value[cacheKey];
    }
    
    // Check if data is already in masterData but cache expired
    if (masterData.value[cacheKey]) {
      // Cache expired but data exists
      return masterData.value[cacheKey];
    }
    
    // No cached data, loading
    return await loadMasterData(category, subcategory);
  };

  // ✅ OPTIMIZED: Get options for form dropdowns with caching
  const getOptions = async (category, subcategory = null) => {
    const cacheKey = subcategory ? `${category}_${subcategory}` : category;

    // console.log(`[useMasterData] getOptions called:`, {
    //   category,
    //   subcategory,
    //   cacheKey,
    //   masterDataKeys: Object.keys(masterData.value),
    //   masterDataHasKey: !!masterData.value[cacheKey]
    // });

    const data = await getMasterData(category, subcategory);

    // console.log(`[useMasterData] getMasterData returned:`, {
    //   cacheKey,
    //   dataType: Array.isArray(data) ? 'array' : typeof data,
    //   dataLength: Array.isArray(data) ? data.length : 'N/A',
    //   firstItem: Array.isArray(data) ? data[0] : null
    // });

    if (!data || !Array.isArray(data)) {
      // console.warn(`[useMasterData] Invalid data for ${cacheKey}:`, data);
      return [];
    }

    // Transform API response to form options
    const options = data.map((item) => {
      return {
        code: item.code,           // ID value untuk form submission
        value: item.value,         // Label untuk display
        order: item.order_1 || 0,
        remarks: item.remarks || ""
      };
    }).filter(Boolean).sort((a, b) => a.order - b.order);

    // console.log(`[useMasterData] Transformed options:`, {
    //   cacheKey,
    //   optionsCount: options.length,
    //   firstOption: options[0]
    // });

    return options;
  };

  // ✅ NEW: Preload common categories with better error handling and rate limiting
  const preloadCommonData = async () => {
    const commonCategories = [
      ['GENDER'],
      ['RELIGION'], 
      ['MARITAL_STATUS'], 
      ['FAMILY_RELATION'],
      ['CLOTHING'], 
      ['NATIONALITY'],
      ['BANK'], 
      ['TAX_STATUS']
    ];
    
    // Only log in development
    if (process.dev) {
      // Preloading common categories
    }
    
    try {
      // ✅ NEW: Sequential loading with delays to prevent server overload
      for (const [cat, subcat] of commonCategories) {
        try {
          // ✅ CACHE CHECK: Skip if already loaded and valid
          const cacheKey = subcat ? `${cat}_${subcat}` : cat;
          if (masterData.value[cacheKey] && isCacheValid(cacheKey)) {
            // Already cached, skipping
            continue;
          }
          
          // Add delay between requests to prevent server overload
          if (cat !== 'GENDER') { // Skip delay for first request
            await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay for faster preload
          }
          
          await loadMasterData(cat, subcat);
          // Only log in development
          if (process.dev) {
            // Preloaded category
          }
        } catch (e) {
          // Only log in development
          if (process.dev) {
            // Failed to preload category
          }
        }
      }
      // Only log in development
      if (process.dev) {
        // Common categories preloading completed
      }
    } catch (e) {
      // Only log in development
      if (process.dev) {
        // Some master data failed to preload
      }
    }
  };

  // ✅ NEW: Clear specific category cache
  const clearCategoryCache = (category, subcategory = null) => {
    const cacheKey = subcategory ? `${category}_${subcategory}` : category;
    masterData.value[cacheKey] = undefined;
    cacheExpiry.delete(cacheKey);
    // Cache cleared
  };

  // ✅ OPTIMIZED: Clear all loaded data
  const clearMasterData = () => {
    masterData.value = {};
    cache.clear();
    loadingPromises.clear();
    cacheExpiry.clear();
    requestTimestamps.clear();
    activeRequests.clear();
    requestCounters.clear();
    // All cache cleared
  };

  // ✅ NEW: Bulk load multiple categories efficiently with error resilience
  const loadMultipleMasterData = async (categories) => {
    if (!Array.isArray(categories)) {
      // Categories must be an array
      return {};
    }
    
    const results = {};
    const toLoad = [];
    
    // Check cache first for all categories
    for (const category of categories) {
      if (masterData.value[category] && isCacheValid(category)) {
        results[category] = masterData.value[category];
      } else {
        toLoad.push(category);
      }
    }
    
    if (toLoad.length === 0) {
      // All categories served from cache
      return results;
    }
    
    // Bulk loading categories
    
    // Load remaining categories with individual error handling
    const loadPromises = toLoad.map(async (category) => {
      try {
        const data = await loadMasterData(category);
        return { category, data, success: true };
      } catch (error) {
        // Failed to load category
        
        // Return cached data even if expired, or empty array as fallback
        const fallbackData = masterData.value[category] || [];
        return { category, data: fallbackData, success: false, error: error.message };
      }
    });
    
    const loadResults = await Promise.allSettled(loadPromises);
    
    // Process results
    let successCount = 0;
    loadResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const { category, data, success } = result.value;
        results[category] = data;
        
        if (success) {
          successCount++;
        } else {
          // Using fallback data
        }
      } else {
        const category = toLoad[index];
        // Promise rejected
        results[category] = masterData.value[category] || [];
      }
    });
    
    // Bulk load completed
    return results;
  };

  // ✅ NEW: Get cache statistics for monitoring
  const getCacheStats = () => {
    return {
      cachedCategories: Object.keys(masterData.value).length,
      activeRequests: activeRequests.size,
      requestCounts: Object.fromEntries(requestCounters),
      cacheExpiry: Object.fromEntries(cacheExpiry)
    };
  };

  return {
    // State
    masterData: readonly(masterData),
    loading: readonly(loading),
    error: readonly(error),

    // Actions
    loadMasterData,
    loadMultipleMasterData,
    getMasterData,
    getOptions,
    preloadCommonData,
    clearMasterData,
    clearCategoryCache,

    // ✅ NEW: Monitoring and debugging
    getCacheStats,

    // Computed
    availableCategories: readonly(availableCategories)
  };
};
