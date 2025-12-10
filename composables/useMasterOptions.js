import { ref } from "vue";
import { useMasterData } from "~/composables/useMasterData";

// ✅ OPTIMIZED: Centralized master options loader using useMasterData to avoid duplicate API calls
// This now uses useMasterData which has better caching and deduplication
export const useMasterOptions = () => {
  const { getOptions } = useMasterData();

  const options = ref({
    gender: [],
    religion: [],
    maritalStatus: [],
    clothingSize: [],
    // Nationality master is not ready yet: keep minimal fallback here
    // Default: Indonesia (id/code = "1")
    nationality: []
  });

  // ✅ NEW: Enhanced caching system
  const cache = new Map();
  const cacheExpiry = new Map();
  const CACHE_TTL = 30 * 60 * 1000; // 30 minutes cache TTL
  const loadingPromises = new Map();
  const lastLoadTime = ref(0);
  const MIN_RELOAD_INTERVAL = 5 * 60 * 1000; // 5 minutes minimum between reloads

  // ✅ NEW: Check if cache is still valid
  const isCacheValid = (key) => {
    const expiry = cacheExpiry.get(key);
    return expiry && Date.now() < expiry;
  };

  // ✅ NEW: Check if we should reload (rate limiting)
  const shouldReload = () => {
    const now = Date.now();
    return now - lastLoadTime.value >= MIN_RELOAD_INTERVAL;
  };

  // Map possible master API item into { code, value }
  const normalize = (item) => {
    if (!item) return null;
    return {
      code: item.code ?? item.id ?? item.value_id ?? (item.value ? String(item.value) : ""),
      value: item.name ?? item.value ?? item.label ?? item.description ?? ""
    };
  };

  // ✅ FIXED: Use useMasterData categories (uppercase) to match FormField usage
  // This ensures we use the same endpoint as FormField components
  const categoryMapping = {
    gender: 'GENDER',
    religion: 'RELIGION',
    maritalStatus: 'MARITAL_STATUS',
    clothingSize: 'CLOTHING' // with subcategory 'size'
  };

  // ✅ OPTIMIZED: Load master options using useMasterData to avoid duplicate API calls
  const loadMasterOptions = async (forceReload = false) => {
    // ✅ CHECK 1: Return cached data if valid and not forcing reload
    if (!forceReload && !shouldReload()) {
      const hasValidCache = Object.keys(categoryMapping).every(key =>
        options.value[key] && options.value[key].length > 0
      );

      if (hasValidCache) {
        return;
      }
    }

    // ✅ CHECK 2: Prevent duplicate loading
    if (loadingPromises.has('master_options')) {
      return loadingPromises.get('master_options');
    }

    // ✅ CHECK 3: Rate limiting
    if (!forceReload && !shouldReload()) {
      return;
    }

    lastLoadTime.value = Date.now();

    // Create loading promise
    const loadPromise = (async () => {
      try {
        // ✅ FIXED: Use useMasterData.getOptions instead of direct API calls
        // This ensures we use the same endpoint and caching as FormField components
        const loadPromises = [];
        
        // Load gender
        loadPromises.push(
          getOptions('GENDER').then(data => {
            options.value.gender = data.map(normalize).filter(Boolean);
            cache.set('gender', options.value.gender);
            cacheExpiry.set('gender', Date.now() + CACHE_TTL);
          }).catch(() => {})
        );
        
        // Load religion
        loadPromises.push(
          getOptions('RELIGION').then(data => {
            options.value.religion = data.map(normalize).filter(Boolean);
            cache.set('religion', options.value.religion);
            cacheExpiry.set('religion', Date.now() + CACHE_TTL);
          }).catch(() => {})
        );
        
        // Load marital status
        loadPromises.push(
          getOptions('MARITAL_STATUS').then(data => {
            options.value.maritalStatus = data.map(normalize).filter(Boolean);
            cache.set('maritalStatus', options.value.maritalStatus);
            cacheExpiry.set('maritalStatus', Date.now() + CACHE_TTL);
          }).catch(() => {})
        );
        
        // Load clothing size
        loadPromises.push(
          getOptions('CLOTHING', 'size').then(data => {
            options.value.clothingSize = data.map(normalize).filter(Boolean);
            cache.set('clothingSize', options.value.clothingSize);
            cacheExpiry.set('clothingSize', Date.now() + CACHE_TTL);
          }).catch(() => {})
        );
        
        // Wait for all to complete
        await Promise.allSettled(loadPromises);

      } catch (error) {
      } finally {
        // Remove from loading promises
        loadingPromises.delete('master_options');
      }
    })();

    // Store the promise to prevent duplicate calls
    loadingPromises.set('master_options', loadPromise);
    return loadPromise;
  };

  // ✅ NEW: Get specific option with caching
  const getOption = (key) => {
    if (options.value[key] && options.value[key].length > 0) {
      return options.value[key];
    }

    // Try to load if not available
    if (!loadingPromises.has('master_options')) {
      loadMasterOptions();
    }

    return options.value[key] || [];
  };

  // ✅ NEW: Clear specific option cache
  const clearOptionCache = (key) => {
    if (key) {
      options.value[key] = [];
      cache.delete(key);
      cacheExpiry.delete(key);
    } else {
      // Clear all
      Object.keys(categoryMapping).forEach(k => {
        options.value[k] = [];
        cache.delete(k);
        cacheExpiry.delete(k);
      });
    }
  };

  // ✅ NEW: Get cache statistics for monitoring
  const getCacheStats = () => {
    return {
      cachedOptions: Object.keys(cache).length,
      optionCounts: Object.fromEntries(
        Object.entries(options.value).map(([key, value]) => [key, value?.length || 0])
      ),
      cacheExpiry: Object.fromEntries(cacheExpiry),
      lastLoadTime: lastLoadTime.value,
      timeSinceLastLoad: Date.now() - lastLoadTime.value
    };
  };

  // Caller can trigger loadMasterOptions(); do not auto-run here to keep control to caller.
  return {
    options,
    loadMasterOptions,

    // ✅ NEW: Enhanced functionality
    getOption,
    clearOptionCache,
    getCacheStats
  };
};