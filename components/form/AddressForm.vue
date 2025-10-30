<template>
  <div class="bg-white dark:bg-grey-800 rounded-md">
    <!-- Debug Info (only in development) -->
    <div v-if="$nuxt.isDev && formConfig" class="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-6">
      <h4 class="text-sm font-medium text-yellow-800 mb-2">Address Form Debug Info</h4>
      <div class="text-xs text-yellow-700">
        <p>Status: {{ formConfig.status }}</p>
        <p>Is Need Revision: {{ formConfig.isNeedRevision }}</p>
        <p>Visible Fields: {{ formConfig.visibleFields ? Array.from(formConfig.visibleFields) : 'All' }}</p>
        <p>Official Address Visible: {{ isOfficialAddressVisible }}</p>
        <p>Domicile Address Visible: {{ isDomicileAddressVisible }}</p>
      </div>
    </div>

    <div class="space-y-6">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Official Address -->
      <div v-if="isOfficialAddressVisible">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center">
            <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-md flex items-center justify-center mr-3">
              <i class="pi pi-building text-blue-600 dark:text-blue-400 text-lg"></i>
            </div>
            <h4 class="text-xl font-bold text-text-main">Official Address</h4>
          </div>
          <Toggle
            v-if="editMode"
            v-model="sameAsOfficial"
            label="Same as Official Address"
            :container-class="'items-center'"
            :label-class="'text-sm text-gray-700 dark:text-gray-300'"
          />
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Full Address field hidden - no longer required -->
          <!-- <FormField 
            v-if="isFieldVisible('official_address_detail')" 
            label="Full Address" 
            type="text" 
            v-model="localData.official_address_detail" 
            :disabled="!isFieldEditable('official_address_detail')" 
            :maxLength="255"
          /> -->
          
          <!-- Province with searchable dropdown -->
          <FormField 
            v-if="isFieldVisible('official_address_province')" 
            label="Province *" 
            type="select" 
            v-model="localData.official_address_province" 
            :disabled="!isFieldEditable('official_address_province')" 
            :options="provinces"
            :searchable="true"
            placeholder="Search province..."
            @update:model-value="handleOfficialProvinceChange"
          />
          
          <FormField 
            v-if="isFieldVisible('official_address_city')" 
            label="City *" 
            type="select" 
            v-model="localData.official_address_city" 
            :disabled="!isFieldEditable('official_address_city')" 
            :options="officialCityOptions"
            :searchable="true"
            placeholder="Search city..."
            @update:model-value="handleOfficialCityChange"
          />
          
          <FormField 
            v-if="isFieldVisible('official_address_postal_code')" 
            label="Postal Code" 
            type="text" 
            v-model="localData.official_address_postal_code" 
            :disabled="!isFieldEditable('official_address_postal_code')" 
            @update:model-value="val => handlePostalCodeFormat('official_address_postal_code', val)" 
            placeholder="Enter postal code" 
            :maxLength="5"
          />
          <FormField 
            v-if="isFieldVisible('official_address_subdistrict')" 
            label="Kecamatan" 
            type="text" 
            v-model="localData.official_address_subdistrict" 
            :disabled="!isFieldEditable('official_address_subdistrict')" 
            :maxLength="100"
          />
          <FormField 
            v-if="isFieldVisible('official_address_administrative_village')" 
            label="Kelurahan" 
            type="text" 
            v-model="localData.official_address_administrative_village" 
            :disabled="!isFieldEditable('official_address_administrative_village')" 
            :maxLength="100"
          />
          <FormField 
            v-if="isFieldVisible('official_address_rt')" 
            label="RT" 
            type="text" 
            v-model="localData.official_address_rt" 
            :disabled="!isFieldEditable('official_address_rt')" 
            @update:model-value="val => handleRTRWFormat('official_address_rt', val)" 
            placeholder="RT Number(1-3 digits)" 
            :maxLength="3"
          />
          <FormField 
            v-if="isFieldVisible('official_address_rw')" 
            label="RW" 
            type="text" 
            v-model="localData.official_address_rw" 
            :disabled="!isFieldEditable('official_address_rw')" 
            @update:model-value="val => handleRTRWFormat('official_address_rw', val)" 
            placeholder="RW Number(1-3 digits)" 
            :maxLength="3"
          />
          <FormField 
            v-if="isFieldVisible('official_address_street')" 
            label="Street Name" 
            type="text" 
            v-model="localData.official_address_street" 
            :disabled="!isFieldEditable('official_address_street')" 
            :maxLength="255"
          />
          <FormField 
            v-if="isFieldVisible('official_address_house_number')" 
            label="House Number" 
            type="text" 
            v-model="localData.official_address_house_number" 
            :disabled="!isFieldEditable('official_address_house_number')" 
            @update:model-value="val => handleHouseNumberFormat('official_address_house_number', val)" 
            placeholder="Enter house number (letters/numbers, max 4 chars)" 
            :maxLength="4"
          />
        </div>
      </div>
      
      <!-- Domicile Address -->
      <div v-if="isDomicileAddressVisible">
        <div class="flex items-center mb-6">
          <div class="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-md flex items-center justify-center mr-3">
            <i class="pi pi-home text-green-600 dark:text-green-400 text-lg"></i>
          </div>
          <h4 class="text-xl font-bold text-text-main">Domicile Address</h4>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Full Address field hidden - no longer required -->
          <!-- <FormField 
            v-if="isFieldVisible('domicile_address_detail')" 
            label="Full Address" 
            type="text" 
            v-model="localData.domicile_address_detail" 
            :disabled="!isFieldEditable('domicile_address_detail')" 
            :maxLength="255"
          /> -->
          
          <!-- Province with searchable dropdown -->
          <FormField 
            v-if="isFieldVisible('domicile_address_province')" 
            label="Province" 
            type="select" 
            v-model="localData.domicile_address_province" 
            :disabled="!isFieldEditable('domicile_address_province')" 
            :options="provinces"
            :searchable="true"
            placeholder="Search province..."
            @update:model-value="handleDomicileProvinceChange"
          />
          
          <!-- City with searchable dropdown filtered by province -->
          <FormField 
            v-if="isFieldVisible('domicile_address_city')" 
            label="City" 
            type="select" 
            v-model="localData.domicile_address_city" 
            :disabled="!isFieldEditable('domicile_address_city')" 
            :options="domicileCityOptions"
            :searchable="true"
            placeholder="Search city..."
            @update:model-value="handleDomicileCityChange"
          />
          
          <!-- Debug info for domicile city -->
          <div v-if="$nuxt.isDev && localData.domicile_address_city" class="col-span-2 bg-green-50 p-2 rounded text-xs">
            <p>🔍 Domicile City Debug:</p>
            <p>Selected City Value: {{ localData.domicile_address_city }}</p>
            <p>City Options Count: {{ domicileCityOptions.length }}</p>
            <p>City Options: {{ domicileCityOptions.map(c => `${c.code}:${c.value}`).join(', ') }}</p>
            <p>Matching Option: {{ domicileCityOptions.find(c => c.code == localData.domicile_address_city)?.value || 'NOT FOUND' }}</p>
          </div>
          
          <FormField 
            v-if="isFieldVisible('domicile_address_postal_code')" 
            label="Postal Code" 
            type="text" 
            v-model="localData.domicile_address_postal_code" 
            :disabled="!isFieldEditable('domicile_address_postal_code')" 
            @update:model-value="val => handlePostalCodeFormat('domicile_address_postal_code', val)" 
            placeholder="Enter postal code" 
            :maxLength="5"
          />
          <FormField 
            v-if="isFieldVisible('domicile_address_subdistrict')" 
            label="Kecamatan" 
            type="text" 
            v-model="localData.domicile_address_subdistrict" 
            :disabled="!isFieldEditable('domicile_address_subdistrict')" 
            :maxLength="100"
          />
          <FormField 
            v-if="isFieldVisible('domicile_address_administrative_village')" 
            label="Kelurahan" 
            type="text" 
            v-model="localData.domicile_address_administrative_village" 
            :disabled="!isFieldEditable('domicile_address_administrative_village')" 
            :maxLength="100"
          />
          <FormField 
            v-if="isFieldVisible('domicile_address_rt')" 
            label="RT" 
            type="text" 
            v-model="localData.domicile_address_rt" 
            :disabled="!isFieldEditable('domicile_address_rt')" 
            @update:model-value="val => handleRTRWFormat('domicile_address_rt', val)" 
            placeholder="RT Number(1-3 digits)" 
            :maxLength="3"
          />
          <FormField 
            v-if="isFieldVisible('domicile_address_rw')" 
            label="RW" 
            type="text" 
            v-model="localData.domicile_address_rw" 
            :disabled="!isFieldEditable('domicile_address_rw')" 
            @update:model-value="val => handleRTRWFormat('domicile_address_rw', val)" 
            placeholder="RW Number(1-3 digits)" 
            :maxLength="3"
          />
          <FormField 
            v-if="isFieldVisible('domicile_address_street')" 
            label="Street Name" 
            type="text" 
            v-model="localData.domicile_address_street" 
            :disabled="!isFieldEditable('domicile_address_street')" 
            :maxLength="255"
          />
          <FormField 
            v-if="isFieldVisible('domicile_address_house_number')" 
            label="House Number" 
            type="text" 
            v-model="localData.domicile_address_house_number" 
            :disabled="!isFieldEditable('domicile_address_house_number')" 
            @update:model-value="val => handleHouseNumberFormat('domicile_address_house_number', val)" 
            placeholder="Enter house number (letters/numbers, max 4 chars)" 
            :maxLength="4"
          />
        </div>
      </div>
    </div>

    <!-- Fallback message when no fields are visible -->
    <div v-if="formConfig && formConfig.isNeedRevision && !isOfficialAddressVisible && !isDomicileAddressVisible" 
         class="text-center py-12 text-gray-500">
      <i class="pi pi-info-circle text-3xl mb-4"></i>
      <p class="text-lg font-medium mb-2">No Address fields to revise</p>
      <p class="text-sm">This revision request doesn't include any address changes.</p>
    </div>
    </div>
  </div>
</template>

<script setup>
import FormField from "./FormField.vue";
import Toggle from "~/components/ui/Toggle.vue";
import { onMounted, ref, watch, computed, nextTick } from 'vue';
import { useAddressData } from '~/composables/useAddressData';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
    default: () => ({
      // Official address fields
      official_address_detail: "",
      official_address_province: "",
      official_address_city: "",
      official_address_postal_code: "",
      official_address_subdistrict: "",
      official_address_administrative_village: "",
      official_address_rt: "",
      official_address_rw: "",
      official_address_street: "",
      official_address_house_number: "",
      // Domicile address fields
      domicile_address_detail: "",
      domicile_address_province: "",
      domicile_address_city: "",
      domicile_address_postal_code: "",
      domicile_address_subdistrict: "",
      domicile_address_administrative_village: "",
      domicile_address_rt: "",
      domicile_address_rw: "",
      domicile_address_street: "",
      domicile_address_house_number: "",
    }),
  },
  editMode: {
    type: Boolean,
    default: false,
  },
  formConfig: {
    type: Object,
    default: () => ({}),
  },
  disableEditRevision: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "validation-change"]);

// Address data composable
const { 
  provinces, 
  cities, 
  loading, 
  loadProvinces, 
  loadCitiesByProvince, 
  loadCityById,
  loadProvincesByCity 
} = useAddressData();

// Reactive data for options
const officialCityOptions = ref([]);
const domicileCityOptions = ref([]);

// Cache for city options to prevent reloading during discard changes
const cityOptionsCache = new Map();

// Loading states to prevent concurrent API calls
const loadingOfficialCities = ref(false);
const loadingDomicileCities = ref(false);

// Toggle: use domicile same as official
const sameAsOfficial = ref(false);


// Helper function to load specific city data by ID
const loadSpecificCityData = async (cityId, type) => {
  if (!cityId) return;
  
  
  try {
    const cityOptions = await loadCityById(cityId);
    if (cityOptions.length > 0) {
      const cityData = cityOptions[0];
      
      // Add to appropriate options array
      if (type === 'official') {
        officialCityOptions.value = cityOptions;
        localData.value.official_address_city = cityId; // Ensure value is preserved
      } else if (type === 'domicile') {
        domicileCityOptions.value = cityOptions;
        localData.value.domicile_address_city = cityId; // Ensure value is preserved
      }
      
      return cityData;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
};

// Function to load city options with cache (similar to province approach)
const loadCityOptionsWithCache = async (provinceId, addressType) => {
  if (!provinceId) return [];

  const cacheKey = `${addressType}_${provinceId}`;

  // Check cache first
  if (cityOptionsCache.has(cacheKey)) {
    return cityOptionsCache.get(cacheKey);
  }

  // Check if already loading for this type to prevent concurrent calls
  const loadingFlag = addressType === 'official' ? loadingOfficialCities : loadingDomicileCities;
  if (loadingFlag.value) {
    return [];
  }

  // Set loading flag
  loadingFlag.value = true;

  try {
    // Load from API
    const cityOptions = await loadCitiesByProvince(provinceId);

    // Cache the result
    cityOptionsCache.set(cacheKey, cityOptions);

    return cityOptions;
  } catch (error) {
    console.error(`❌ [AddressForm] Error loading cities for ${addressType}:`, error);
    return [];
  } finally {
    // Clear loading flag
    loadingFlag.value = false;
  }
};


// Field visibility control based on formConfig
const isFieldVisible = (fieldName) => {
  // If no formConfig or no visibleFields specified, show all fields
  if (!props.formConfig || !props.formConfig.visibleFields) {
    return true;
  }
  
  // For need revision status, only show fields that are in visibleFields
  if (props.formConfig.isNeedRevision && props.formConfig.visibleFields) {
    // For flat structure, check the field name directly
    const isVisible = props.formConfig.visibleFields.has(fieldName);
    
    
    return isVisible;
  }
  
  // For other statuses, show all fields
  return true;
};

// Check if sections are visible
const isOfficialAddressVisible = computed(() => {
  if (!props.formConfig || !props.formConfig.isNeedRevision) {
    return true;
  }
  
  // If no visibleFields specified, show all fields
  if (!props.formConfig.visibleFields) {
    return true;
  }
  
  const officialFields = [
    // 'official_address_detail', // Hidden - no longer required
    'official_address_province', 'official_address_city', 'official_address_postal_code', 
    'official_address_subdistrict', 'official_address_administrative_village', 'official_address_rt', 'official_address_rw',
    'official_address_street', 'official_address_house_number'
  ];
  
  return officialFields.some(field => isFieldVisible(field));
});

const isDomicileAddressVisible = computed(() => {
  if (!props.formConfig || !props.formConfig.isNeedRevision) {
    return true;
  }
  
  // If no visibleFields specified, show all fields
  if (!props.formConfig.visibleFields) {
    return true;
  }
  
  const domicileFields = [
    // 'domicile_address_detail', // Hidden - no longer required
    'domicile_address_province', 'domicile_address_city', 'domicile_address_postal_code',
    'domicile_address_subdistrict', 'domicile_address_administrative_village', 'domicile_address_rt', 'domicile_address_rw',
    'domicile_address_street', 'domicile_address_house_number'
  ];
  
  return domicileFields.some(field => isFieldVisible(field));
});

// Field editability control based on formConfig
const isFieldEditable = (fieldName) => {
  // When sameAsOfficial is enabled, lock domicile fields
  if (sameAsOfficial.value && fieldName && fieldName.startsWith('domicile_')) {
    return false;
  }
  // For need revision status, only allow editing fields that are in editableFields (new_data)
  if (props.formConfig && props.formConfig.isNeedRevision) {
    // Only allow editing fields that are in editableFields (new_data fields)
    if (props.formConfig.editableFields) {
      const isEditable = props.formConfig.editableFields.has(fieldName);
      return isEditable && props.editMode;
    }
    // If no editableFields specified in need revision, disable all fields
    return false;
  }
  
  // Default behavior for non-revision mode
  return props.editMode;
};


// Defaults for flat form structure
const defaultFormModel = () => ({
  official_address_detail: "",
  official_address_province: "",
  official_address_city: "",
  official_address_postal_code: "",
  official_address_subdistrict: "",
  official_address_administrative_village: "",
  official_address_rt: "",
  official_address_rw: "",
  official_address_street: "",
  official_address_house_number: "",
  domicile_address_detail: "",
  domicile_address_province: "",
  domicile_address_city: "",
  domicile_address_postal_code: "",
  domicile_address_subdistrict: "",
  domicile_address_administrative_village: "",
  domicile_address_rt: "",
  domicile_address_rw: "",
  domicile_address_street: "",
  domicile_address_house_number: ""
});

// Normalize incoming model (API snake_case → flat form fields) if needed
const normalizeToFormModel = (input) => {
  const model = { ...(defaultFormModel()) };
  const v = input || {};

  const isApiShape =
    Object.prototype.hasOwnProperty.call(v, 'detail_ktp') ||
    Object.prototype.hasOwnProperty.call(v, 'province_ktp_id') ||
    Object.prototype.hasOwnProperty.call(v, 'detail_domicile');

  if (!isApiShape) {
    // Assume it's already in flat form shape; merge safely
    return { ...model, ...v };
  }

  // Map API fields to flat form fields
  model.official_address_detail = v.detail_ktp || '';
  model.official_address_province = v.province_ktp_id || '';
  model.official_address_city = v.city_ktp_id || '';
  model.official_address_postal_code = v.postal_code_ktp || '';
  model.official_address_subdistrict = v.sub_distric_ktp || '';
  model.official_address_administrative_village = v.administrative_village_ktp || '';
  model.official_address_rt = v.rt_ktp || '';
  model.official_address_rw = v.rw_ktp || '';
  model.official_address_street = v.street_name_ktp || '';
  model.official_address_house_number = v.house_number_ktp || '';

  model.domicile_address_detail = v.detail_domicile || '';
  model.domicile_address_province = v.province_domicile_id || '';
  model.domicile_address_city = v.city_domicile_id || '';
  model.domicile_address_postal_code = v.postal_code_domicile || '';
  model.domicile_address_subdistrict = v.sub_distric_domicile || '';
  model.domicile_address_administrative_village = v.administrative_village_domicile || '';
  model.domicile_address_rt = v.rt_domicile || '';
  model.domicile_address_rw = v.rw_domicile || '';
  model.domicile_address_street = v.street_name_domicile || '';
  model.domicile_address_house_number = v.house_number_domicile || '';

  return model;
};

// Local reactive copy of data - always flat form structure
const localData = ref(normalizeToFormModel(props.modelValue));

// Store original values for proper change detection
const originalValues = ref(normalizeToFormModel(props.modelValue));

// External reset guard to prevent emitting while resetting from parent
const isExternalResetting = ref(false);

// Watch for props.modelValue changes to reset localData when data is reset
watch(
  () => props.modelValue,
  (newValue, oldValue) => {
    // Only reset if the values are actually different to prevent infinite loop
    if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      // If edit mode is off, always sync from props
      if (!props.editMode) {
        nextTick(() => {
          const normalized = normalizeToFormModel(newValue);
          localData.value = { ...normalized };
          originalValues.value = { ...normalized };
        });
        return;
      }
      // If external reset is in progress, always accept props
      if (isExternalResetting.value) {
        nextTick(() => {
          localData.value = { ...newValue };
          originalValues.value = { ...newValue };
        });
        return;
      }

      // Check if user is actively editing - if so, don't reset
      const isUserEditing = document.activeElement &&
        (document.activeElement.tagName === 'INPUT' ||
         document.activeElement.tagName === 'SELECT' ||
         document.activeElement.tagName === 'TEXTAREA');

      if (!isUserEditing) {
        // reset localData from props and update original values
        nextTick(() => {
          const normalized = normalizeToFormModel(newValue);
          localData.value = { ...normalized };
          originalValues.value = { ...normalized };
        });
      }
    }
  },
  { deep: true }
);

// Watch for changes and emit updates
watch(
  localData,
  (newValue) => {
    // Do not emit when not in edit mode or during external reset
    if (isExternalResetting.value || !props.editMode) {
      return; // Don't emit during external reset
    }
    // Compare with stored original values to detect actual changes
    const originalValue = originalValues.value || {};
    
    // Check if there are meaningful changes
    const addressFields = [
      // 'official_address_detail', // Hidden - no longer required
      'official_address_province', 'official_address_city', 'official_address_postal_code',
      'official_address_subdistrict', 'official_address_administrative_village', 'official_address_rt', 'official_address_rw',
      'official_address_street', 'official_address_house_number',
      // 'domicile_address_detail', // Hidden - no longer required
      'domicile_address_province', 'domicile_address_city', 'domicile_address_postal_code',
      'domicile_address_subdistrict', 'domicile_address_administrative_village', 'domicile_address_rt', 'domicile_address_rw',
      'domicile_address_street', 'domicile_address_house_number'
    ];
    
    let hasChanges = false;
    for (const field of addressFields) {
      if (newValue[field] !== originalValue[field]) {
        hasChanges = true;
        break;
      }
    }
    
    if (hasChanges) {
      // Emit updated model to parent
      nextTick(() => emit("update:modelValue", newValue));
    }
  },
  { deep: true, immediate: false }
);

// Watch for formConfig changes and log debug info
watch(
  () => props.formConfig,
  (newConfig) => {
    if (newConfig && newConfig.visibleFields) {
    }
  },
  { deep: true, immediate: true }
);



// Handle province change for official address
const handleOfficialProvinceChange = async (provinceId) => {
  localData.value.official_address_province = provinceId;
  
  // Clear city when province changes
  localData.value.official_address_city = '';
  officialCityOptions.value = [];
  
  // Load cities for the selected province
  if (provinceId) {
    const cityOptions = await loadCityOptionsWithCache(provinceId, 'official');
    officialCityOptions.value = cityOptions;
  }
};

// Handle province change for domicile address
const handleDomicileProvinceChange = async (provinceId) => {
  localData.value.domicile_address_province = provinceId;
  
  // Clear city when province changes
  localData.value.domicile_address_city = '';
  domicileCityOptions.value = [];
  
  // Load cities for the selected province
  if (provinceId) {
    const cityOptions = await loadCityOptionsWithCache(provinceId, 'domicile');
    domicileCityOptions.value = cityOptions;
  }
};

// Handle city change for official address
const handleOfficialCityChange = async (cityId) => {
  localData.value.official_address_city = cityId;
  
  // If no province is selected, try to find province by city
  if (!localData.value.official_address_province && cityId) {
    const provinceOptions = await loadProvincesByCity(cityId);
    if (provinceOptions.length === 1) {
      localData.value.official_address_province = provinceOptions[0].code;
    }
  }
};

// Handle city change for domicile address
const handleDomicileCityChange = async (cityId) => {
  localData.value.domicile_address_city = cityId;
  
  // If no province is selected, try to find province by city
  if (!localData.value.domicile_address_province && cityId) {
    const provinceOptions = await loadProvincesByCity(cityId);
    if (provinceOptions.length === 1) {
      localData.value.domicile_address_province = provinceOptions[0].code;
    }
  }
};


const handlePostalCodeFormat = (fieldName, value) => {
  const formatted = value.replace(/\D/g, '').substring(0, 5); // Only digits, max 5 chars
  localData.value[fieldName] = formatted;
};

const handleRTRWFormat = (fieldName, value) => {
  const formatted = value.replace(/\D/g, '').substring(0, 3); // Only digits, max 3 chars
  localData.value[fieldName] = formatted;
};

const handleHouseNumberFormat = (fieldName, value) => {
  const formatted = value.substring(0, 4); // Allow letters and numbers, max 4 chars
  localData.value[fieldName] = formatted;
};

// Copy helper: apply official values to domicile (and load city options)
const applyOfficialToDomicile = async () => {
  const src = localData.value;
  // Primitive fields
  src.domicile_address_detail = src.official_address_detail || '';
  src.domicile_address_province = src.official_address_province || '';
  src.domicile_address_city = src.official_address_city || '';
  src.domicile_address_postal_code = src.official_address_postal_code || '';
  src.domicile_address_subdistrict = src.official_address_subdistrict || '';
  src.domicile_address_administrative_village = src.official_address_administrative_village || '';
  src.domicile_address_rt = src.official_address_rt || '';
  src.domicile_address_rw = src.official_address_rw || '';
  src.domicile_address_street = src.official_address_street || '';
  src.domicile_address_house_number = src.official_address_house_number || '';

  // Sync city options for domicile based on the copied province
  domicileCityOptions.value = [];
  if (src.domicile_address_province) {
    const cityOptions = await loadCityOptionsWithCache(src.domicile_address_province, 'domicile');
    domicileCityOptions.value = cityOptions;
    // Ensure copied city exists in options; if not, clear it
    if (!cityOptions.some(c => String(c.code) === String(src.domicile_address_city))) {
      src.domicile_address_city = '';
    }
  } else {
    src.domicile_address_city = '';
  }
};

// React to toggle changes
watch(sameAsOfficial, async (enabled) => {
  if (!props.editMode) return;
  if (enabled) {
    await applyOfficialToDomicile();
  }
});

// Auto-sync when official fields change while toggle is enabled
watch(
  () => ([
    localData.value.official_address_detail,
    localData.value.official_address_province,
    localData.value.official_address_city,
    localData.value.official_address_postal_code,
    localData.value.official_address_subdistrict,
    localData.value.official_address_administrative_village,
    localData.value.official_address_rt,
    localData.value.official_address_rw,
    localData.value.official_address_street,
    localData.value.official_address_house_number
  ]),
  async () => {
    if (!props.editMode) return;
    if (sameAsOfficial.value) {
      await applyOfficialToDomicile();
    }
  }
);

// Transform form data back to API format
const transformToApiFormat = (formData) => {
  return {
    // Official address fields (KTP)
    detail_ktp: formData.official_address_detail || '',
    province_ktp_id: formData.official_address_province || '',
    province_ktp: formData.official_address_province_name || '',
    city_ktp_id: formData.official_address_city || '',
    city_ktp: formData.official_address_city_name || '',
    postal_code_ktp: formData.official_address_postal_code || '',
    sub_distric_ktp: formData.official_address_subdistrict || '',
    administrative_village_ktp: formData.official_address_administrative_village || '',
    rt_ktp: formData.official_address_rt || '',
    rw_ktp: formData.official_address_rw || '',
    street_name_ktp: formData.official_address_street || '',
    house_number_ktp: formData.official_address_house_number || '',
    
    // Domicile address fields
    detail_domicile: formData.domicile_address_detail || '',
    province_domicile_id: formData.domicile_address_province || '',
    province_domicile: formData.domicile_address_province_name || '',
    city_domicile_id: formData.domicile_address_city || '',
    city_domicile: formData.domicile_address_city_name || '',
    postal_code_domicile: formData.domicile_address_postal_code || '',
    sub_distric_domicile: formData.domicile_address_subdistrict || '',
    administrative_village_domicile: formData.domicile_address_administrative_village || '',
    rt_domicile: formData.domicile_address_rt || '',
    rw_domicile: formData.domicile_address_rw || '',
    street_name_domicile: formData.domicile_address_street || '',
    house_number_domicile: formData.domicile_address_house_number || ''
  };
};

// Expose transform function for parent components
defineExpose({
  getApiFormatData: () => transformToApiFormat(localData.value),
  getFormFormatData: () => localData.value
});


onMounted(async () => {
  // Load provinces first
  await loadProvinces();

  // Load cities sequentially to prevent concurrent API calls
  if (localData.value.official_address_province) {
    const cityOptions = await loadCityOptionsWithCache(localData.value.official_address_province, 'official');
    officialCityOptions.value = cityOptions;
  }

  if (localData.value.domicile_address_province) {
    const cityOptions = await loadCityOptionsWithCache(localData.value.domicile_address_province, 'domicile');
    domicileCityOptions.value = cityOptions;
  }
});

// Listen for global form reset to force-sync from props without emitting back
const handleFormReset = () => {
  isExternalResetting.value = true;
  sameAsOfficial.value = false; // reset toggle to avoid syncing empties
  // Force nextTick to allow parent to push props first
  nextTick(() => {
    const normalized = normalizeToFormModel(props.modelValue);
    localData.value = { ...normalized };
    originalValues.value = { ...normalized };
    // Release the guard after state settles
    setTimeout(() => { isExternalResetting.value = false; }, 0);
  });
};

if (process.client) {
  window.addEventListener('formReset', handleFormReset);
}

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('formReset', handleFormReset);
  }
});
</script>
