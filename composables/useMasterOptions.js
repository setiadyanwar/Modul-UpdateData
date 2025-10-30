import { ref } from "vue";
import { useApi } from "~/composables/useApi";

// ✅ OPTIMIZED: Centralized master options loader with enhanced caching
// Attempts to fetch option lists from master API and falls back to a small nationality list
export const useMasterOptions = () => {
  const { apiGet } = useApi();

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

  // Endpoints are guessed; adjust if your master API differs.
  // Use master-api pattern: /master-api/{CATEGORY} or /master-api/{CATEGORY}/{subcategory}
  const endpoints = {
    gender: "/master-api/?category=GENDER",
    religion: "/master-api/?category=RELIGION",
    maritalStatus: "/master-api/?category=MARITAL_STATUS",
    // Clothing sizes requested via query parameters per requested pattern
    clothingSize: "/master-api/?category=clothing&subcategory=size"
  };

  // ✅ OPTIMIZED: Load master options with enhanced caching and rate limiting
  const loadMasterOptions = async (forceReload = false) => {
    // ✅ CHECK 1: Return cached data if valid and not forcing reload
    if (!forceReload && !shouldReload()) {
      const hasValidCache = Object.keys(endpoints).every(key =>
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
        // ✅ NEW: Sequential loading with delays to prevent server overload
        for (const [key, endpoint] of Object.entries(endpoints)) {
          try {
            // Add delay between requests to prevent server overload
            if (key !== 'gender') { // Skip delay for first request
              await new Promise(resolve => setTimeout(resolve, 300)); // 300ms delay
            }


            const res = await apiGet(endpoint);

            if (res && (res.success === true || res.status === true) && res.data) {
              // master endpoints commonly return { status: true, data: { master_data: [...] } }
              const payload = res.data.master_data ?? res.data;
              const arr = Array.isArray(payload) ? payload : (Array.isArray(payload.items) ? payload.items : []);
              const normalizedOptions = arr.map(normalize).filter(Boolean);

              // ✅ NEW: Set cache with expiry
              options.value[key] = normalizedOptions;
              cache.set(key, normalizedOptions);
              cacheExpiry.set(key, Date.now() + CACHE_TTL);

            } else {
            }
          } catch (error) {
            // Keep existing data if available
            if (options.value[key] && options.value[key].length > 0) {
            }
          }
        }

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
      Object.keys(endpoints).forEach(k => {
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