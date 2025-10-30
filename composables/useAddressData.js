import { ref, readonly } from 'vue';
import { useApi } from './useApi';

export const useAddressData = () => {
  const { apiGet } = useApi();
  
  // Reactive data
  const provinces = ref([]);
  const cities = ref([]);
  const loading = ref(false);
  const error = ref(null);
  
  // Cache untuk menghindari request berulang
  const provinceCache = new Map();
  const cityCache = new Map();
  
  // Load semua provinces
  const loadProvinces = async () => {
    if (loading.value) return provinces.value;
    
    // Check cache first
    if (provinceCache.has('all')) {
      provinces.value = provinceCache.get('all');
      return provinces.value;
    }
    
    loading.value = true;
    error.value = null;
    
    try {
      const response = await apiGet('/master-api/provinces');
      
      if (response?.data?.items) {
        const provinceOptions = response.data.items.map(province => ({
          code: String(province.id_province), // Ensure code is always a string
          value: province.province_name,
          label: province.province_name
        }));
        
        provinces.value = provinceOptions;
        provinceCache.set('all', provinceOptions);
      } else {
        provinces.value = [];
      }
    } catch (err) {
      error.value = err;
      provinces.value = [];
    } finally {
      loading.value = false;
    }
    
    return provinces.value;
  };
  
  // Load cities berdasarkan province ID atau city ID
  const loadCitiesByProvince = async (provinceId) => {
    if (!provinceId) {
      cities.value = [];
      return cities.value;
    }
    
    // Check cache first
    const cacheKey = `province_${provinceId}`;
    if (cityCache.has(cacheKey)) {
      cities.value = cityCache.get(cacheKey);
      return cities.value;
    }
    
    loading.value = true;
    error.value = null;
    
    try {
      const response = await apiGet(`/master-api/cities?id_province=${provinceId}`);
      
      if (response?.data?.items) {
        const cityOptions = response.data.items.map(city => ({
          code: String(city.id_city), // Ensure code is always a string
          value: city.city_name,
          label: city.city_name
        }));
        
        cities.value = cityOptions;
        cityCache.set(cacheKey, cityOptions);
      } else {
        cities.value = [];
      }
    } catch (err) {
      error.value = err;
      cities.value = [];
    } finally {
      loading.value = false;
    }
    
    return cities.value;
  };
  
  // Load specific city by city ID
  const loadCityById = async (cityId) => {
    if (!cityId) {
      return [];
    }
    
    // Check cache first
    const cacheKey = `city_${cityId}`;
    if (cityCache.has(cacheKey)) {
      return cityCache.get(cacheKey);
    }
    
    loading.value = true;
    error.value = null;
    
    try {
      const response = await apiGet(`/master-api/cities?id_city=${cityId}`);
      
      if (response?.data?.items) {
        const cityOptions = response.data.items.map(city => ({
          code: String(city.id_city), // Ensure code is always a string
          value: city.city_name,
          label: city.city_name
        }));
        
        cityCache.set(cacheKey, cityOptions);
        return cityOptions;
      } else {
        return [];
      }
    } catch (err) {
      error.value = err;
      return [];
    } finally {
      loading.value = false;
    }
  };
  
  // Load provinces berdasarkan city ID (reverse lookup)
  const loadProvincesByCity = async (cityId) => {
    if (!cityId) return [];
    
    loading.value = true;
    error.value = null;
    
    try {
      const response = await apiGet(`/master-api/provinces?id_city=${cityId}`);
      
      if (response?.data?.items) {
        const provinceOptions = response.data.items.map(province => ({
          code: String(province.id_province), // Ensure code is always a string
          value: province.province_name,
          label: province.province_name
        }));
        
        return provinceOptions;
      } else {
        return [];
      }
    } catch (err) {
      error.value = err;
      return [];
    } finally {
      loading.value = false;
    }
  };
  
  // Clear cache
  const clearCache = () => {
    provinceCache.clear();
    cityCache.clear();
  };
  
  // Get province name by ID
  const getProvinceName = (provinceId) => {
    const province = provinces.value.find(p => p.code === provinceId);
    return province ? province.value : '';
  };
  
  // Get city name by ID
  const getCityName = (cityId) => {
    const city = cities.value.find(c => c.code === cityId);
    return city ? city.value : '';
  };
  
  return {
    // Data
    provinces: readonly(provinces),
    cities: readonly(cities),
    loading: readonly(loading),
    error: readonly(error),
    
    // Methods
    loadProvinces,
    loadCitiesByProvince,
    loadCityById,
    loadProvincesByCity,
    clearCache,
    getProvinceName,
    getCityName
  };
};
