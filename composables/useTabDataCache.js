import { ref, computed } from 'vue'

// ✅ GLOBAL CACHE: Shared across all tab instances
const tabDataCache = ref({})
const cacheTimestamps = ref({})
const loadingStates = ref({})

// Cache configuration
const CACHE_CONFIG = {
  // Cache TTL (Time To Live) in milliseconds
  personalData: 5 * 60 * 1000, // 5 minutes for personal data
  masterData: 30 * 60 * 1000,  // 30 minutes for master data (already handled)
  requestStatus: 1 * 60 * 1000, // 1 minute for request status (critical for workflow)

  // Tabs that should always refresh (never cache)
  alwaysFresh: ['employment-information'], // Read-only, always fresh

  // Tabs with smart caching
  smartCache: [
    'basic-information',
    'address',
    'emergency-contact',
    'payroll-account',
    'family',
    'education',
    'social-security',
    'medical-record'
  ]
}

export const useTabDataCache = () => {

  // ✅ CHECK: Is cached data still valid
  const isCacheValid = (tabId, dataType = 'personalData') => {
    const cacheKey = `${tabId}_${dataType}`
    const timestamp = cacheTimestamps.value[cacheKey]

    if (!timestamp) return false

    // Always fresh tabs never cache
    if (CACHE_CONFIG.alwaysFresh.includes(tabId)) return false

    const ttl = CACHE_CONFIG[dataType] || CACHE_CONFIG.personalData
    const isValid = Date.now() - timestamp < ttl

    return isValid
  }

  // ✅ GET: Cached data if valid
  const getCachedData = (tabId, dataKey, dataType = 'personalData') => {
    const cacheKey = `${tabId}_${dataKey}`

    if (!isCacheValid(tabId, dataType)) {
      return null
    }

    return tabDataCache.value[cacheKey] || null
  }

  // ✅ SET: Cache data with timestamp
  const setCachedData = (tabId, dataKey, data, dataType = 'personalData') => {
    const cacheKey = `${tabId}_${dataKey}`

    // Don't cache always-fresh tabs
    if (CACHE_CONFIG.alwaysFresh.includes(tabId)) {
      return
    }

    tabDataCache.value[cacheKey] = data
    cacheTimestamps.value[cacheKey] = Date.now()
  }

  // ✅ INVALIDATE: Clear cache for specific tab or all
  const invalidateCache = (tabId = null, reason = 'manual') => {
    if (tabId) {
      // Clear specific tab cache
      Object.keys(tabDataCache.value).forEach(key => {
        if (key.startsWith(`${tabId}_`)) {
          delete tabDataCache.value[key]
          delete cacheTimestamps.value[key]
        }
      })
    } else {
      // Clear all cache
      tabDataCache.value = {}
      cacheTimestamps.value = {}
    }
  }

  // ✅ LOADING: Track loading states per tab
  const setLoading = (tabId, dataKey, isLoading) => {
    const loadingKey = `${tabId}_${dataKey}`
    loadingStates.value[loadingKey] = isLoading
  }

  const isLoading = (tabId, dataKey) => {
    const loadingKey = `${tabId}_${dataKey}`
    return loadingStates.value[loadingKey] || false
  }

  // ✅ STATS: Get cache statistics for monitoring
  const getCacheStats = computed(() => {
    const stats = {
      totalCachedItems: Object.keys(tabDataCache.value).length,
      cacheByTab: {},
      validCache: 0,
      expiredCache: 0
    }

    // Group by tab
    Object.keys(tabDataCache.value).forEach(key => {
      const tabId = key.split('_')[0]
      if (!stats.cacheByTab[tabId]) {
        stats.cacheByTab[tabId] = 0
      }
      stats.cacheByTab[tabId]++

      // Check if valid
      const timestamp = cacheTimestamps.value[key]
      if (timestamp && Date.now() - timestamp < CACHE_CONFIG.personalData) {
        stats.validCache++
      } else {
        stats.expiredCache++
      }
    })

    return stats
  })

  // ✅ CLEANUP: Remove expired cache entries
  const cleanupExpiredCache = () => {
    let cleanedCount = 0

    Object.keys(cacheTimestamps.value).forEach(key => {
      const timestamp = cacheTimestamps.value[key]
      const tabId = key.split('_')[0]

      // Skip always fresh tabs (they shouldn't be cached anyway)
      if (CACHE_CONFIG.alwaysFresh.includes(tabId)) {
        if (tabDataCache.value[key]) {
          delete tabDataCache.value[key]
          delete cacheTimestamps.value[key]
          cleanedCount++
        }
        return
      }

      // Remove expired entries
      if (Date.now() - timestamp > CACHE_CONFIG.personalData) {
        delete tabDataCache.value[key]
        delete cacheTimestamps.value[key]
        cleanedCount++
      }
    })

    return cleanedCount
  }

  // ✅ AUTO CLEANUP: Run cleanup every 5 minutes
  if (process.client) {
    setInterval(() => {
      const cleaned = cleanupExpiredCache()
      if (cleaned > 0 && process.dev) {
      }
    }, 5 * 60 * 1000) // 5 minutes
  }

  return {
    // State
    tabDataCache: tabDataCache,
    cacheTimestamps: cacheTimestamps,
    loadingStates: loadingStates,

    // Methods
    isCacheValid,
    getCachedData,
    setCachedData,
    invalidateCache,
    setLoading,
    isLoading,
    cleanupExpiredCache,

    // Computed
    getCacheStats,

    // Config
    CACHE_CONFIG
  }
}