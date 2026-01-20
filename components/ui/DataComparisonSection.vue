  <template>
<div v-if="normalizedChanges.length > 0" class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700 p-4">
    <div class="flex items-center gap-2 mb-4">
      <div class="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
        <i class="pi pi-sync text-blue-600 dark:text-blue-400 text-sm"></i>
      </div>
      <h3 class="font-semibold text-text-main text-base">Data Changes</h3>
      <span class="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs font-medium px-2 py-1 rounded-full">
        {{ normalizedChanges.length }} {{ normalizedChanges.length === 1 ? 'field' : 'fields' }}
      </span>
    </div>
    
    <div class="space-y-6">
      <!-- Multi-record data with grouping -->
      <div v-for="(group, groupIndex) in groupedMultiRecordChanges" :key="`group-${groupIndex}`" class="space-y-4">
        <!-- Group Header -->
        <div class="flex items-center gap-3 mb-4">
          <div class="w-8 h-8 bg-indigo-100 dark:bg-indigo-800 rounded-full flex items-center justify-center">
            <i :class="getGroupIcon(group.category)" class="text-indigo-600 dark:text-indigo-400 text-sm"></i>
          </div>
          <h4 class="text-lg font-semibold text-grey-800 dark:text-grey-200">
            {{ getGroupTitle(group.recordIndex, group.category) }}
          </h4>
          <div class="bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 text-xs font-medium px-3 py-1 rounded-full">
            {{ group.changes.length }} {{ group.changes.length === 1 ? 'field' : 'fields' }}
          </div>
        </div>
        
        <!-- Group Content -->
        <div class="bg-white dark:bg-grey-800 rounded-lg border border-indigo-200 dark:border-indigo-700 p-4 shadow-sm">
          <div class="space-y-4">
            <div v-for="(change, changeIndex) in group.changes" :key="`${change.field}-${changeIndex}`" 
                 class="bg-grey-50 dark:bg-grey-700/50 rounded-md p-4 border border-grey-200 dark:border-grey-600">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <span class="text-base font-semibold text-grey-800 dark:text-grey-200">{{ change.label }}</span>
              </div>
              
              <!-- Previous Value vs Updated Value -->
              <div class="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Previous Value -->
                <div class="bg-gray-50 dark:bg-red-900/20 rounded-md p-3 border border-grey-200 dark:border-grey-800">
                  <div class="text-sm font-medium text-grey-700 dark:text-grey-300 mb-2 flex items-center gap-2">
                    <i class="pi pi-times-circle text-grey-400 dark:text-grey-400"></i>
                    Before:
                  </div>
                  <div class="text-sm text-text-main font-medium break-words bg-white dark:bg-grey-800 p-3 rounded border min-h-[3rem] flex items-center">
                    {{ change.before }}
                  </div>
                </div>
                
                <!-- Updated Value -->
                <div class="bg-green-50 dark:bg-green-900/20 rounded-md p-3 border border-green-200 dark:border-green-800">
                  <div class="text-sm font-medium text-green-700 dark:text-green-300 mb-2 flex items-center gap-2">
                    <i class="pi pi-check-circle text-green-600 dark:text-green-400"></i>
                    After:
                  </div>
                  <div class="text-sm text-text-main font-medium break-words bg-white dark:bg-grey-800 p-3 rounded border min-h-[3rem] flex items-center">
                    {{ change.after }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Single record data without grouping -->
      <div v-if="singleRecordChanges.length > 0" class="space-y-4">
        <div v-for="(change, index) in singleRecordChanges" :key="`${change.field}-${index}`" 
             class="bg-white dark:bg-grey-800 rounded-md border border-blue-100 dark:border-blue-800 p-4 shadow-sm">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span class="text-base font-semibold text-grey-800 dark:text-grey-200">{{ change.label }}</span>
          </div>
          
          <!-- Previous Value vs Updated Value -->
          <div class="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Previous Value -->
            <div class="bg-gray-50 dark:bg-red-900/20 rounded-md p-3 border border-grey-200 dark:border-grey-800">
              <div class="text-sm font-medium text-grey-700 dark:text-grey-300 mb-2 flex items-center gap-2">
                <i class="pi pi-times-circle text-grey-400 dark:text-grey-400"></i>
                Before:
              </div>
              <div class="text-sm text-text-main font-medium break-words bg-white dark:bg-grey-800 p-3 rounded border min-h-[3rem] flex items-center">
                {{ change.before }}
              </div>
            </div>
            
            <!-- Updated Value -->
            <div class="bg-green-50 dark:bg-green-900/20 rounded-md p-3 border border-green-200 dark:border-green-800">
              <div class="text-sm font-medium text-green-700 dark:text-green-300 mb-2 flex items-center gap-2">
                <i class="pi pi-check-circle text-green-600 dark:text-green-400"></i>
                After:
              </div>
              <div class="text-sm text-text-main font-medium break-words bg-white dark:bg-grey-800 p-3 rounded border min-h-[3rem] flex items-center">
                {{ change.after }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- No Data State -->
    <div v-if="normalizedChanges.length === 0" class="text-center py-6">
      <div class="mb-3">
        <i class="pi pi-info-circle text-2xl text-grey-400 dark:text-grey-500"></i>
      </div>
      <p class="text-sm text-grey-600 dark:text-grey-400">No data available for comparison.</p>
      <!-- Debug info -->
      <div class="mt-4 text-xs text-grey-500 dark:text-grey-400" v-if="$nuxt.isDev">
        <p>Debug: oldData = {{ !!oldData ? 'exists' : 'null' }}</p>
        <p>Debug: newData = {{ !!newData ? 'exists' : 'null' }}</p>
      </div>
    </div>
  </div>

  <!-- Always show section for debugging when no changes -->
  <div v-else class="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700 p-4">
    <div class="flex items-center gap-2 mb-4">
      <div class="w-8 h-8 bg-yellow-100 dark:bg-yellow-800 rounded-full flex items-center justify-center">
        <i class="pi pi-exclamation-triangle text-yellow-600 dark:text-yellow-400 text-sm"></i>
      </div>
      <h3 class="font-semibold text-text-main text-base">Data Comparison Debug</h3>
    </div>
    
    <div class="text-sm text-grey-600 dark:text-grey-400 space-y-2">
      <p><strong>Old Data:</strong> {{ oldData ? 'Present' : 'Not Available' }}</p>
      <p><strong>New Data:</strong> {{ newData ? 'Present' : 'Not Available' }}</p>
      <p><strong>Processed Changes:</strong> {{ normalizedChanges.length }}</p>
      
      <div class="mt-4" v-if="$nuxt.isDev">
        <details class="bg-white dark:bg-grey-800 rounded p-3 border">
          <summary class="cursor-pointer font-medium">Raw Data (Click to expand)</summary>
          <div class="mt-2 space-y-2">
            <div>
              <strong>oldData:</strong>
              <pre class="text-xs bg-grey-100 dark:bg-grey-700 p-2 rounded mt-1 overflow-auto max-h-32">{{ JSON.stringify(oldData, null, 2) }}</pre>
            </div>
            <div>
              <strong>newData:</strong>
              <pre class="text-xs bg-grey-100 dark:bg-grey-700 p-2 rounded mt-1 overflow-auto max-h-32">{{ JSON.stringify(newData, null, 2) }}</pre>
            </div>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed, onMounted, ref } from 'vue';
import { useApi } from '~/composables/useApi';
import { useMasterOptions } from '~/composables/useMasterOptions';
import { useMasterData } from '~/composables/useMasterData';

const props = defineProps({
  oldData: {
    type: Object,
    default: null
  },
  newData: {
    type: Object,
    default: null
  }
});

// ✅ OPTIMIZED: Use singleton master data - no more onMounted fetch
const { options, getOption } = useMasterOptions();
const { masterData, getMasterData } = useMasterData();
const { apiGet } = useApi();
const refreshTick = ref(0);

// Ensure address master data is available for label translation
onMounted(async () => {
  try {
    // ✅ FIX: Load ALL master data categories before comparison to prevent showing IDs
    await Promise.all([
      // Address data
      getMasterData('PROVINCE'),
      getMasterData('CITY'),
      getMasterData('PROVINCES'),
      getMasterData('CITIES'),

      // Medical/Health data
      getMasterData('EMP_HEALTH', 'blood_type'),
      getMasterData('EMP_HEALTH', 'overall_status'),

      // ✅ ADD: Education data (frequently missing causing ID display)
      getMasterData('EDU_LEVELS'),
      getMasterData('EDU_MAJORS'),
      getMasterData('EDU_INSTITUTIONS'),

      // ✅ ADD: Personal data
      getMasterData('GENDER'),
      getMasterData('RELIGION'),
      getMasterData('MARITAL_STATUS'),
      getMasterData('NATIONALITY'),
      getMasterData('CLOTHING'),

      // ✅ ADD: Family/Relationship data
      getMasterData('FAMILY_RELATION'),

      // ✅ ADD: Financial data
      getMasterData('BANK'),
      getMasterData('TAX_STATUS')
    ]);

    console.log('[DataComparisonSection] ✅ All master data loaded for translation');
    // Extract possible IDs from incoming data to ensure availability
    const collectIds = (obj) => {
      const ids = [];
      if (!obj || typeof obj !== 'object') return ids;
      Object.keys(obj).forEach(k => {
        const v = obj[k];
        if (typeof v === 'object' && v && !Array.isArray(v)) {
          ids.push(...collectIds(v));
        } else if ((/city|kabupaten|kota/i.test(k) && /id|code/i.test(k)) || /city_.*_id|_city_id|city_domicile_id|city_ktp_id|official_address_city|domicile_address_city/i.test(k)) {
          if (v) ids.push({ type: 'CITY', id: String(v) });
        } else if ((/province|provinsi/i.test(k) && /id|code/i.test(k)) || /province_.*_id|_province_id|province_domicile_id|province_ktp_id|official_address_province|domicile_address_province/i.test(k)) {
          if (v) ids.push({ type: 'PROVINCE', id: String(v) });
        }
      });
      return ids;
    };
    const idsNeeded = [
      ...collectIds(props.oldData || {}),
      ...collectIds(props.newData || {})
    ];
    const uniqueCity = Array.from(new Set(idsNeeded.filter(x => x.type==='CITY').map(x => x.id)));
    const uniqueProvince = Array.from(new Set(idsNeeded.filter(x => x.type==='PROVINCE').map(x => x.id)));

    // Fetch missing city/province by id
    const fetchByIds = async (type, ids) => {
      if (ids.length === 0) return;
      await Promise.all(ids.map(async (id) => {
        try {
          if (type === 'CITY') {
            const res = await apiGet(`/master-api/cities?id_city=${encodeURIComponent(id)}&limit=1000`);
            const items = res?.data?.items || res?.data?.data || res?.items || [];
            if (items.length) {
              const it = items[0];
              const normalized = { code: String(it.id_city ?? id), value: it.city_name ?? '', label: it.city_name ?? '' };
              const key = masterData.value.CITY ? 'CITY' : (masterData.value.CITIES ? 'CITIES' : 'CITY');
              const arr = masterData.value[key] || [];
              if (!arr.some(x => String(x.code) === normalized.code)) masterData.value[key] = [...arr, normalized];
            }
          } else {
            const res = await apiGet(`/master-api/provinces?id_province=${encodeURIComponent(id)}&limit=1000`);
            const items = res?.data?.items || res?.data?.data || res?.items || [];
            if (items.length) {
              const it = items[0];
              const normalized = { code: String(it.id_province ?? id), value: it.province_name ?? '', label: it.province_name ?? '' };
              const key = masterData.value.PROVINCE ? 'PROVINCE' : (masterData.value.PROVINCES ? 'PROVINCES' : 'PROVINCE');
              const arr = masterData.value[key] || [];
              if (!arr.some(x => String(x.code) === normalized.code)) masterData.value[key] = [...arr, normalized];
            }
          }
        } catch {}
      }));
    };
    await fetchByIds('CITY', uniqueCity);
    await fetchByIds('PROVINCE', uniqueProvince);
    refreshTick.value++;
  } catch {}
});

// Field name mapping untuk tampilan yang lebih user-friendly
const formatFieldName = (fieldName) => {
  if (!fieldName) return '';
  
  // Field mapping untuk tampilan yang lebih baik
  const fieldNameMap = {
    // Basic Information
    'employee_name': 'Employee Name',
    'first_name': 'First Name',
    'last_name': 'Last Name',
    // ... rest of map is unchanged, handled by context replacement ...

    'name': 'Name',
    'gender': 'Gender',
    'gender_id': 'Gender',
    'religion': 'Religion',
    'religion_id': 'Religion',
    'marital_status': 'Marital Status',
    'marital_status_id': 'Marital Status',
    'martial_status_id': 'Marital Status',
    'nationality': 'Nationality',
    'nationality_id': 'Nationality',
    'birth_date': 'Birth Date',
    'birth_place': 'Birth Place',
    'place_of_birth': 'Place of Birth',
    'id_number': 'ID Number',
    'no_ktp': 'ID Number (KTP)',
    'passport_number': 'Passport Number',
    'private_email': 'Private Email',
    'business_email': 'Business Email',
    'main_phone_number': 'Main Phone Number',
    'phone': 'Main Phone Number',
    'secondary_phone_number': 'Secondary Phone Number',
    'nik': 'NIK',
    'nik_telkom': 'NIK Telkom',
    'clothing_size': 'Clothing Size',
    'photo_ktp': 'KTP Photo',
    'professional_photo': 'Professional Photo',
    
    // Address - Official Address (KTP) - API field names
    'detail_ktp': 'KTP Detail Address',
    'province_ktp': 'KTP Province',
    'province_ktp_id': 'KTP Province',
    'city_ktp': 'KTP City', 
    'city_ktp_id': 'KTP City',
    'postal_code_ktp': 'KTP Postal Code',
    'sub_distric_ktp': 'KTP Sub District',
    'sub_distric_ktp_id': 'KTP Sub District',
    'administrative_village_ktp': 'KTP Administrative Village',
    'administrative_village_ktp_id': 'KTP Administrative Village',
    'rt_ktp': 'KTP RT',
    'rw_ktp': 'KTP RW',
    'street_name_ktp': 'KTP Street Name',
    'house_number_ktp': 'KTP House Number',
    
    // Address - Domicile Address - API field names
    'detail_domicile': 'Domicile Detail Address',
    'province_domicile': 'Domicile Province',
    'province_domicile_id': 'Domicile Province',
    'city_domicile': 'Domicile City',
    'city_domicile_id': 'Domicile City',
    'postal_code_domicile': 'Domicile Postal Code',
    'sub_distric_domicile': 'Domicile Sub District',
    'sub_distric_domicile_id': 'Domicile Sub District',
    'administrative_village_domicile': 'Domicile Administrative Village',
    'administrative_village_domicile_id': 'Domicile Administrative Village',
    'rt_domicile': 'Domicile RT',
    'rw_domicile': 'Domicile RW',
    'street_name_domicile': 'Domicile Street Name',
    'house_number_domicile': 'Domicile House Number',
    
    // Address - Form field names (for backward compatibility)
    'official_address_detail': 'Official Address Detail',
    'official_address_province': 'Official Address Province',
    'official_address_province_id': 'Official Address Province',
    'official_address_city': 'Official Address City',
    'official_address_city_id': 'Official Address City',
    'official_address_postal_code': 'Official Address Postal Code',
    'official_address_subdistrict': 'Official Address Sub District',
    'official_address_subdistrict_id': 'Official Address Sub District',
    'official_address_administrative_village': 'Official Address Administrative Village',
    'official_address_administrative_village_id': 'Official Address Administrative Village',
    'official_address_rt': 'Official Address RT',
    'official_address_rw': 'Official Address RW',
    'official_address_street': 'Official Address Street',
    'official_address_house_number': 'Official Address House Number',
    'official_address_phone': 'Official Address Phone',
    
    'domicile_address_detail': 'Domicile Address Detail',
    'domicile_address_province': 'Domicile Address Province',
    'domicile_address_province_id': 'Domicile Address Province',
    'domicile_address_city': 'Domicile Address City',
    'domicile_address_city_id': 'Domicile Address City',
    'domicile_address_postal_code': 'Domicile Address Postal Code',
    'domicile_address_subdistrict': 'Domicile Address Sub District',
    'domicile_address_subdistrict_id': 'Domicile Address Sub District',
    'domicile_address_administrative_village': 'Domicile Address Administrative Village',
    'domicile_address_administrative_village_id': 'Domicile Address Administrative Village',
    'domicile_address_rt': 'Domicile Address RT',
    'domicile_address_rw': 'Domicile Address RW',
    'domicile_address_street': 'Domicile Address Street',
    'domicile_address_house_number': 'Domicile Address House Number',
    'domicile_address_phone': 'Domicile Address Phone',

    // Legacy Address fields (for backward compatibility)
    'street_name': 'Street Name',
    'house_number': 'House Number',
    'rt': 'RT',
    'rw': 'RW',
    'village': 'Village',
    'district': 'District',
    'city': 'City',
    'province': 'Province',
    'postal_code': 'Postal Code',
    'detail': 'Detail',
    'sub_district': 'Sub District',
    'administrative_village': 'Administrative Village',
    'domicile_same_as_ktp': 'Domicile Same as KTP',
    
    // Payroll
    'bank': 'Bank',
    'bank_id': 'Bank',
    'number_rekening': 'Bank Account Number',
    'holder_name': 'Account Holder Name',
    'tax_status': 'Tax Status',
    'tax_status_id': 'Tax Status',
    'npwp': 'NPWP',
    'npwp_doc': 'NPWP Document',
    'saving_book_doc': 'Saving Book Document',
    
    // Medical Record
    'blood_type': 'Blood Type',
    'height': 'Height',
    'weight': 'Weight',
    'has_disability': 'Has Disability',
    'head_size': 'Head Size',
    'health_concern': 'Health Concern',
    'medical_treatment_record': 'Medical Treatment Record',
    'last_mcu_date': 'Last MCU Date',
    'health_status': 'Health Status',
    'telkomedika_card_number': 'Telkomedika Card Number',
    'bpjs_tk_number': 'BPJS TK Number',
    'bpjs_tk_effective_date': 'BPJS TK Effective Date',
    'bpjs_health_number': 'BPJS Health Number',
    'telkomedika_doc': 'Telkomedika Document',
    'bpjs_doc': 'BPJS Document',
    
    // Benefit
    'no_telkomedika': 'Telkomedika Card Number',
    
    // Employment
    'employee_id': 'Employee ID',
    'join_date': 'Join Date',
    'department': 'Department',
    'position': 'Position',
    'employment_status': 'Employment Status',
    'work_location': 'Work Location',
    'reporting_manager': 'Reporting Manager',
    'employee_type': 'Employee Type',
    'grade': 'Grade',
    'directorate': 'Directorate',
    'business_unit': 'Business Unit',
    'division': 'Division',
    'grade_date': 'Grade Date',
    'band_position': 'Band Position',
    'band_position_date': 'Band Position Date',
    'level': 'Level',
    'level_date': 'Level Date',
    'supervisor': 'Direct Superior',
    'start_date': 'Start Date',
    'terminate_date': 'Terminate Date',
    'reason_employee_in': 'Reason Employee In',
    'reason_employee_out': 'Reason Employee Out',
    'status': 'Status',
    'retirement_date': 'Retirement Date',
    
    // Emergency Contact
    'emgc_name': 'Contact Name',
    'emgc_relationship': 'Relationship',
    'emgc_number': 'Phone Number',
    'emgc_address': 'Address',
    
    // Family
    'family_name': 'Family Member Name',
    'family_relationship': 'Relationship',
    'family_birth_date': 'Birth Date',
    'family_gender': 'Gender',
    'family_occupation': 'Occupation',
    'family_company': 'Company',
    'family_phone': 'Phone Number',
    'family_address': 'Address',
    'relation': 'Relationship',
    'relation_id': 'Relationship',
    
    // Education
    'education_level': 'Education Level',
    'education_institution': 'Institution',
    'education_major': 'Major/Field of Study',
    'education_start_date': 'Start Date',
    'education_end_date': 'End Date',
    'education_gpa': 'GPA',
    'education_certificate': 'Certificate',
    
    // Education (short form)
    'edu_level': 'Education Level',
    'edu_level_id': 'Education Level',
    'edu_institution': 'Institution', 
    'edu_institution_id': 'Institution',
    'edu_major': 'Major/Field of Study',
    'edu_major_id': 'Major/Field of Study',
    'edu_start_date': 'Start Date',
    'edu_end_date': 'End Date',
    'edu_gpa': 'GPA',
    'edu_certificate': 'Certificate',
  };
  
  // Check if we have a direct mapping
  if (fieldNameMap[fieldName]) {
    return fieldNameMap[fieldName];
  }
  
  // Fallback to generic formatting
  return fieldName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Format field value untuk tampilan yang lebih baik dengan dynamic master data
const formatFieldValue = (value, fieldName = '') => {
  if (value === null || value === undefined || value === '') {
    return 'Not set';
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  // Handle numeric boolean fields (0/1)
  if (fieldName.includes('disability') || fieldName.includes('has_disability') || 
      fieldName.includes('member_status') || fieldName.includes('consent') ||
      fieldName.includes('same_as') || fieldName.includes('domicile_same_as_ktp')) {
    if (value === 0 || value === '0' || value === false || value === 'false') return 'No';
    if (value === 1 || value === '1' || value === true || value === 'true') return 'Yes';
  }
  
  if (typeof value === 'object') {
    // For objects, just show "Object data" to avoid confusion
    return 'Object data';
  }
  
  if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
    // Handle date strings
    try {
      const date = new Date(value);
      return date.toLocaleDateString('id-ID');
    } catch {
      return value;
    }
  }
  
  return String(value);
};

// ✅ OPTIMIZED: Enhanced helper function to get master data value by code using singleton
const getMasterValue = (fieldName, code) => {
  if (!code && code !== 0) return code; // Handle 0 as valid code
  
  // Convert code to string for consistent comparison
  const codeStr = String(code);
  
  // Map field names to master data categories
  const fieldToMasterDataMap = {
    'gender': 'GENDER',
    'gender_id': 'GENDER',
    'religion': 'RELIGION', 
    'religion_id': 'RELIGION',
    'marital_status': 'MARITAL_STATUS',
    'marital_status_id': 'MARITAL_STATUS',
    'martial_status_id': 'MARITAL_STATUS', // Handle typo in API
    'clothing_size': 'CLOTHING',
    'clothing_size_id': 'CLOTHING',
    'relation': 'FAMILY_RELATION',
    'relation_id': 'FAMILY_RELATION',
    'emgc_relationship': 'FAMILY_RELATION',
    'emgc_relationship_id': 'FAMILY_RELATION',
    // Family occupation (master family with subcategory occupation)
    'occupation': 'FAMILY_occupation',
    'occupation_id': 'FAMILY_occupation',
    'edu_level': 'EDU_LEVELS',
    'edu_level_id': 'EDU_LEVELS',
    'education_level': 'EDU_LEVELS', 
    'education_level_id': 'EDU_LEVELS',
    'edu_major': 'EDU_MAJORS',
    'edu_major_id': 'EDU_MAJORS', 
    'education_major': 'EDU_MAJORS',
    'education_major_id': 'EDU_MAJORS',
    'edu_institution': 'EDU_INSTITUTIONS',
    'edu_institution_id': 'EDU_INSTITUTIONS',
    'education_institution': 'EDU_INSTITUTIONS',
    'education_institution_id': 'EDU_INSTITUTIONS',
    'bank': 'BANK',
    'bank_id': 'BANK',
    'nationality': 'NATIONALITY', 
    'nationality_id': 'NATIONALITY',
    'tax_status': 'TAX_STATUS',
    'tax_status_id': 'TAX_STATUS',
    
    // Medical Record fields - using proper API endpoints
    'health_status': 'EMP_HEALTH_OVERALL_STATUS',
    'health_status_id': 'EMP_HEALTH_OVERALL_STATUS', 
    'blood_type': 'EMP_HEALTH_BLOOD_TYPE',
    'blood_type_id': 'EMP_HEALTH_BLOOD_TYPE',
    
    // Address - Province fields (API field names)
    'province': 'PROVINCE',
    'province_id': 'PROVINCE',
    'province_ktp': 'PROVINCE',
    'province_ktp_id': 'PROVINCE',
    'province_domicile': 'PROVINCE',
    'province_domicile_id': 'PROVINCE',
    
    // Address - City fields (API field names)
    'city': 'CITY',
    'city_id': 'CITY',
    'city_ktp': 'CITY',
    'city_ktp_id': 'CITY',
    'city_domicile': 'CITY',
    'city_domicile_id': 'CITY',
    
    // Address - Sub district fields (API field names)
    'sub_district': 'SUB_DISTRICTS',
    'sub_district_id': 'SUB_DISTRICTS',
    'sub_distric_ktp': 'SUB_DISTRICTS',
    'sub_distric_ktp_id': 'SUB_DISTRICTS',
    'sub_distric_domicile': 'SUB_DISTRICTS',
    'sub_distric_domicile_id': 'SUB_DISTRICTS',
    
    // Address - Administrative village fields (API field names)
    'administrative_village': 'ADMIN_VILLAGES',
    'administrative_village_id': 'ADMIN_VILLAGES',
    'administrative_village_ktp': 'ADMIN_VILLAGES',
    'administrative_village_ktp_id': 'ADMIN_VILLAGES',
    'administrative_village_domicile': 'ADMIN_VILLAGES',
    'administrative_village_domicile_id': 'ADMIN_VILLAGES',
    
    // Address - Form field names (for backward compatibility)
    'official_address_province': 'PROVINCE',
    'official_address_province_id': 'PROVINCE',
    'domicile_address_province': 'PROVINCE',
    'domicile_address_province_id': 'PROVINCE',
    'official_address_city': 'CITY',
    'official_address_city_id': 'CITY',
    'domicile_address_city': 'CITY',
    'domicile_address_city_id': 'CITY',
    'official_address_subdistrict': 'SUB_DISTRICTS',
    'official_address_subdistrict_id': 'SUB_DISTRICTS',
    'domicile_address_subdistrict': 'SUB_DISTRICTS',
    'domicile_address_subdistrict_id': 'SUB_DISTRICTS',
    'official_address_administrative_village': 'ADMIN_VILLAGES',
    'official_address_administrative_village_id': 'ADMIN_VILLAGES',
    'domicile_address_administrative_village': 'ADMIN_VILLAGES',
    'domicile_address_administrative_village_id': 'ADMIN_VILLAGES'
  };
  
  let masterDataCategory = fieldToMasterDataMap[fieldName];
  // Normalize form keys to API keys for translation (city/province)
  if (!masterDataCategory && fieldName === 'official_address_city') masterDataCategory = 'CITY';
  if (!masterDataCategory && fieldName === 'official_address_province') masterDataCategory = 'PROVINCE';
  
  // Special handling for medical record fields that need to be fetched from specific endpoints
  if (masterDataCategory === 'EMP_HEALTH_OVERALL_STATUS') {
    // Try to fetch health status data if not already loaded
    if (!masterData.value[masterDataCategory]) {
      try {
        // Use the getMasterData function to fetch emp_health overall_status
        getMasterData('emp_health', 'overall_status').then((data) => {
          if (data && Array.isArray(data)) {
            masterData.value[masterDataCategory] = data;
          }
        });
      } catch (error) {
      }
    }
  } else if (masterDataCategory === 'EMP_HEALTH_BLOOD_TYPE') {
    // Try to fetch blood type data if not already loaded  
    if (!masterData.value[masterDataCategory]) {
      try {
        // Use the getMasterData function to fetch emp_health blood_type
        getMasterData('emp_health', 'blood_type').then((data) => {
          if (data && Array.isArray(data)) {
            masterData.value[masterDataCategory] = data;
          }
        });
      } catch (error) {
      }
    }
  } else if (masterDataCategory === 'EDU_LEVELS') {
    // Try to fetch education levels data if not already loaded
    if (!masterData.value[masterDataCategory]) {
      try {
        getMasterData('EDU_LEVELS').then((data) => {
          if (data && Array.isArray(data)) {
            masterData.value[masterDataCategory] = data;
          }
        });
      } catch (error) {
      }
    }
  } else if (masterDataCategory === 'EDU_MAJORS') {
    // Try to fetch education majors data if not already loaded
    if (!masterData.value[masterDataCategory]) {
      try {
        getMasterData('EDU_MAJORS').then((data) => {
          if (data && Array.isArray(data)) {
            masterData.value[masterDataCategory] = data;
          }
        });
      } catch (error) {
      }
    }
  } else if (masterDataCategory === 'EDU_INSTITUTIONS') {
    // Try to fetch education institutions data if not already loaded
    if (!masterData.value[masterDataCategory]) {
      try {
        getMasterData('EDU_INSTITUTIONS').then((data) => {
          if (data && Array.isArray(data)) {
            masterData.value[masterDataCategory] = data;
          }
        });
      } catch (error) {
      }
    }
  } else if (masterDataCategory === 'FAMILY_occupation') {
    // Ensure family occupation master data is loaded (category=family&sub_category=occupation)
    if (!masterData.value[masterDataCategory]) {
      try {
        getMasterData('FAMILY', 'occupation').then((data) => {
          if (data && Array.isArray(data)) {
            masterData.value[masterDataCategory] = data;
          }
        });
      } catch (error) {
      }
    }
  }
  
  // Resolve possible cache keys (handle EMP_HEALTH subcategory casing)
  const candidateKeys = [];
  if (masterDataCategory) {
    candidateKeys.push(masterDataCategory);
    if (masterDataCategory === 'EMP_HEALTH_OVERALL_STATUS') {
      candidateKeys.push('EMP_HEALTH_overall_status');
    } else if (masterDataCategory === 'EMP_HEALTH_BLOOD_TYPE') {
      candidateKeys.push('EMP_HEALTH_blood_type');
    }
  }

  // Expand candidate keys for Province/City caches
  if (masterDataCategory === 'PROVINCE') {
    candidateKeys.push('PROVINCES');
  }
  if (masterDataCategory === 'CITY') {
    candidateKeys.push('CITIES');
  }

  const resolvedKey = candidateKeys.find(k => Array.isArray(masterData.value[k]) && masterData.value[k].length > 0);
  if (resolvedKey) {
    const masterDataItems = masterData.value[resolvedKey];
    const item = masterDataItems.find(item => {
      const comps = [item.code, item.id, item.value, item.key, item.keyId, item.code_id, item.id_city];
      return comps.some(v => v !== undefined && v !== null && (String(v) === codeStr || Number(v) === Number(code)));
    });
    if (item) {
      const labels = [item.label, item.value, item.name, item.text, item.title];
      const label = labels.find(v => v !== undefined && v !== null && String(v).trim() !== '');
      return label ?? code;
    }
  }

  // Last-resort fallback for CITY/PROVINCE: scan all cached master arrays
  if (masterDataCategory === 'CITY' || masterDataCategory === 'PROVINCE') {
    const allKeys = Object.keys(masterData.value || {});
    for (const k of allKeys) {
      const arr = masterData.value[k];
      if (!Array.isArray(arr)) continue;
      const hit = arr.find(it => {
        const comps = [it.code, it.id, it.value, it.key, it.keyId, it.code_id, it.id_city, it.id_province, it.codeId];
        return comps.some(v => v !== undefined && v !== null && (String(v) === codeStr || Number(v) === Number(code)));
      });
      if (hit) {
        const labels = [hit.label, hit.value, hit.name, hit.text, hit.title, hit.city_name, hit.province_name];
        const label = labels.find(v => v !== undefined && v !== null && String(v).trim() !== '');
        if (label) return label;
      }
    }
  }

  // If still not found, return code (loading handled by onMounted pre-fetch)
  return code;
  
  // Fallback: try generic options getter if available
  try {
    const label = getOption ? (getOption(masterDataCategory, codeStr)?.label) : null;
    if (label) return label;
  } catch {}
  
  return code;
};

// Helper function to get member status label (hardcoded since no API)
const getMemberStatusLabel = (value) => {
  if (value === 1 || value === '1' || value === true) {
    return 'Active';
  } else if (value === 0 || value === '0' || value === false) {
    return 'Inactive';
  }
  return value;
};

// Helper function to flatten nested objects with proper naming
const flattenObjectForComparison = (obj, prefix = '') => {
  const flattened = {};
  
  if (!obj || typeof obj !== 'object') {
    return flattened;
  }
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    const fullKey = prefix ? `${prefix}${key}` : key;
    
    if (value && typeof value === 'object' && !Array.isArray(value) && value !== null) {
      // Recursively flatten nested objects
      Object.assign(flattened, flattenObjectForComparison(value, `${fullKey}_`));
    } else {
      // Add leaf values (including null values)
      flattened[fullKey] = value;
    }
  });
  
  return flattened;
};

// Multi-record changes with grouping (education, family, emergency_contact)
const groupedMultiRecordChanges = computed(() => {
  const changes = normalizedChanges.value;
  const groups = {};
  
  // Only group multi-record categories
  const multiRecordCategories = ['education', 'family', 'emergency_contact'];
  
  changes.forEach(change => {
    if (multiRecordCategories.includes(change.category) && change.recordIndex !== undefined) {
      const recordIndex = change.recordIndex;
      const category = change.category;
      
      if (!groups[recordIndex]) {
        groups[recordIndex] = {
          recordIndex: recordIndex,
          category: category,
          changes: []
        };
      }
      
      groups[recordIndex].changes.push(change);
    }
  });
  
  // Convert to array and sort by record index
  return Object.values(groups).sort((a, b) => a.recordIndex - b.recordIndex);
});

// Single record changes without grouping
const singleRecordChanges = computed(() => {
  const changes = normalizedChanges.value;
  const multiRecordCategories = ['education', 'family', 'emergency_contact'];
  
  return changes.filter(change => {
    // Include if it's not a multi-record category OR if it's a multi-record category but has no recordIndex
    return !multiRecordCategories.includes(change.category) || change.recordIndex === undefined;
  });
});

// Helper function to get group title
const getGroupTitle = (recordIndex, category) => {
  // Map category to display name
  const categoryMap = {
    'education': 'Education',
    'family': 'Family',
    'emergency_contact': 'Emergency Contact',
    'employment': 'Employment',
    'Data': 'Data'
  };
  
  const categoryName = categoryMap[category] || category;
  return `${categoryName}-${recordIndex + 1}`;
};

// Helper function to get group icon
const getGroupIcon = (category) => {
  const iconMap = {
    'education': 'pi pi-graduation-cap',
    'family': 'pi pi-users',
    'emergency_contact': 'pi pi-phone',
    'employment': 'pi pi-briefcase',
    'Data': 'pi pi-file'
  };
  
  return iconMap[category] || 'pi pi-file';
};

// Normalized changes computed - fokus pada perbandingan old_data vs new_data
const normalizedChanges = computed(() => {
  // Force recompute when async master data fetch completes
  void refreshTick.value;
  try {
    const changes = [];
    
    // Early return if both are null/undefined
    if (!props.oldData && !props.newData) {
      return changes;
    }
    
    // Extract the actual data based on the structure
    let actualOldData = props.oldData || {};
    let actualNewData = props.newData || {};

    // Handle common envelope shapes where old/new are nested under data
    if (actualOldData && actualOldData.data && typeof actualOldData.data === 'object') {
      actualOldData = actualOldData.data;
    }
    if (actualNewData && actualNewData.data && typeof actualNewData.data === 'object' && !Array.isArray(actualNewData.data)) {
      actualNewData = actualNewData.data;
    }

    // Handle new_data structure with action and data properties
    if (actualNewData && actualNewData.action && actualNewData.data) {
      // If data is an array, take the first item for comparison
      if (Array.isArray(actualNewData.data) && actualNewData.data.length > 0) {
        actualNewData = actualNewData.data[0];
      } else {
        actualNewData = actualNewData.data;
      }
    }

    // If we still don't have new data, return empty
    if (!actualNewData || (Array.isArray(actualNewData) && actualNewData.length === 0) || (!Array.isArray(actualNewData) && Object.keys(actualNewData).length === 0)) {
      return changes;
    }

    // Handle array data (like education, family, emergency contact)
    let flatOldData = {};
    let flatNewData = {};
    
    if (Array.isArray(actualOldData) && Array.isArray(actualNewData)) {
      // Both are arrays - compare each item
      const maxLength = Math.max(actualOldData.length, actualNewData.length);
      
      for (let i = 0; i < maxLength; i++) {
        const oldItem = actualOldData[i] || {};
        const newItem = actualNewData[i] || {};
        
        // Flatten each item with index prefix
        const flatOldItem = flattenObjectForComparison(oldItem, `${i}_`);
        const flatNewItem = flattenObjectForComparison(newItem, `${i}_`);
        
        Object.assign(flatOldData, flatOldItem);
        Object.assign(flatNewData, flatNewItem);
      }
    } else if (Array.isArray(actualOldData) && !Array.isArray(actualNewData)) {
      // Old data is array, new data is object (like in your API response)
      // Compare first item of old array with new data
      const oldItem = actualOldData[0] || {};
      flatOldData = flattenObjectForComparison(oldItem);
      flatNewData = flattenObjectForComparison(actualNewData);
    } else {
      // Regular object comparison
      flatOldData = flattenObjectForComparison(actualOldData);
      flatNewData = flattenObjectForComparison(actualNewData);
    }
    

    // Get all possible fields to compare (from both old and new data)
    const allPossibleFields = new Set([
      ...Object.keys(flatOldData),
      ...Object.keys(flatNewData)
    ]);


    // Helper to resolve "before" value when old/new keys differ (API vs form keys)
    const resolveBeforeValue = (key, oldObj, newObj) => {
      let val = oldObj[key];
      if (val !== undefined) return val;
      // Fallback key aliases between API field names and form field names
      const aliases = {
        // KTP (official) address
        'detail_ktp': ['official_address_detail', 'official_address_detail_ktp'],
        'province_ktp_id': ['official_address_province', 'province_ktp', 'official_address_province_ktp_id'],
        'city_ktp_id': ['official_address_city', 'city_ktp', 'official_address_city_ktp_id'],
        'postal_code_ktp': ['official_address_postal_code', 'official_address_postal_code_ktp'],
        'sub_distric_ktp': ['official_address_subdistrict', 'sub_district_ktp', 'official_address_subdistrict_ktp'],
        'administrative_village_ktp': ['official_address_administrative_village', 'official_address_administrative_village_ktp'],
        'rt_ktp': ['official_address_rt', 'official_address_rt_ktp'],
        'rw_ktp': ['official_address_rw', 'official_address_rw_ktp'],
        'street_name_ktp': ['official_address_street', 'official_address_street_ktp'],
        'house_number_ktp': ['official_address_house_number', 'official_address_house_number_ktp', 'official_address_phone'],
        // Domicile address
        'detail_domicile': ['domicile_address_detail', 'domicile_address_detail_domicile'],
        'province_domicile_id': ['domicile_address_province', 'province_domicile', 'domicile_address_province_domicile_id'],
        'city_domicile_id': ['domicile_address_city', 'city_domicile', 'domicile_address_city_domicile_id'],
        'postal_code_domicile': ['domicile_address_postal_code', 'domicile_address_postal_code_domicile'],
        'sub_distric_domicile': ['domicile_address_subdistrict', 'sub_district_domicile', 'domicile_address_subdistrict_domicile'],
        'administrative_village_domicile': ['domicile_address_administrative_village', 'domicile_address_administrative_village_domicile'],
        'rt_domicile': ['domicile_address_rt', 'domicile_address_rt_domicile'],
        'rw_domicile': ['domicile_address_rw', 'domicile_address_rw_domicile'],
        'street_name_domicile': ['domicile_address_street', 'domicile_address_street_domicile'],
        'house_number_domicile': ['domicile_address_house_number', 'domicile_address_house_number_domicile', 'domicile_address_phone']
      };
      const alts = aliases[key] || [];
      for (const alt of alts) {
        if (oldObj[alt] !== undefined) return oldObj[alt];
      }
      // Also handle case where old had API key and new has form key
      const reverse = Object.entries(aliases).find(([, arr]) => arr.includes(key));
      if (reverse && oldObj[reverse[0]] !== undefined) return oldObj[reverse[0]];
      return undefined;
    };

    allPossibleFields.forEach((field) => {
      const beforeValue = resolveBeforeValue(field, flatOldData, flatNewData);
      const afterValue = flatNewData[field];
      
      
      // Skip only structural IDs and document/photo fields; allow value *_id to be shown (translated later)
      if (field === 'status' || field === 'id_contact' || field === 'id' || field === 'id_education' || field === 'id_family' ||
          field.match(/^\d+_status$/) ||
          field.match(/^\d+_id_contact$/) ||
          field.match(/^\d+_id_education$/) ||
          field.match(/^\d+_id_family$/) ||
          field.includes('_doc') || field.endsWith('_doc') || 
          field.includes('document') || field.includes('photo') ||
          field === 'npwp_doc' || field === 'saving_book_doc' || 
          field === 'telkomedika_doc' || field === 'bpjs_doc' ||
          field === 'photo_ktp' || field === 'professional_photo' ||
          field === 'ijazah_doc' ||
          // Skip detail address fields (KTP and Domicile)
          field === 'detail_ktp' || field === 'detail_domicile' ||
          field.includes('detail_ktp') || field.includes('detail_domicile') ||
          field.match(/^\d+_detail_ktp$/) || field.match(/^\d+_detail_domicile$/) ||
          field === 'official_address_detail' || field === 'domicile_address_detail' ||
          field.includes('official_address_detail') || field.includes('domicile_address_detail') ||
          // Security: Hide client_key fields
          field === 'client_key' || field.includes('client_key') ||
          field.match(/^\d+_client_key$/)) {
        return;
      }


      // Show field only if it exists in new data (the request)
      // This ensures we only show fields that are being changed/updated
      if (field in flatNewData) {
        // Extract record index from field name (e.g., "0_name" -> index: 0, fieldName: "name")
        let recordIndex = undefined;
        let cleanFieldName = field;
        
        // Check if field starts with a number (indicating array index)
        const indexMatch = field.match(/^(\d+)_(.+)$/);
        if (indexMatch) {
          recordIndex = parseInt(indexMatch[1]);
          cleanFieldName = indexMatch[2];
        }
        
        // Get user-friendly field label - don't strip _id, let formatFieldName handle it
        // Clean up label: remove trailing " Id" and unify naming
        const rawLabel = formatFieldName(cleanFieldName);
        const fieldLabel = rawLabel.endsWith(' Id') ? rawLabel.slice(0, -3) : rawLabel;

        // Format display values for specific types
        // If beforeValue is undefined but we have aliases that resolve, use that
        // This ensures "Before" won't show Not set when old_data exists but uses different keys
        let resolvedBefore = beforeValue;
        if (resolvedBefore === undefined) {
          // Try additional alias resolution for *_id dropping suffix
          const simpleKey = cleanFieldName.replace(/_id$/, '');
          if (flatOldData[simpleKey] !== undefined) {
            resolvedBefore = flatOldData[simpleKey];
          }
        }

        let formattedBefore = formatFieldValue(resolvedBefore, cleanFieldName);
        let formattedAfter = formatFieldValue(afterValue, cleanFieldName);

        // Handle specific field mappings using enhanced dynamic master data translation
        // Use the enhanced getMasterValue function for all ID fields
        const masterTranslationPromises = [];
        
        // Check if field needs master data translation
        const needsTranslation = cleanFieldName.includes('_id') || 
          ['gender', 'religion', 'marital_status', 'martial_status', 'clothing_size', 'nationality', 
           'bank', 'tax_status', 'edu_level', 'edu_major', 'edu_institution', 'education_level', 
           'education_major', 'education_institution', 'relation', 'emgc_relationship', 
           'blood_type', 'health_status', 'blood_type_id', 'health_status_id',
           // API field names
           'province', 'city', 'province_id', 'city_id', 'sub_district', 'sub_distric', 'administrative_village',
           'province_ktp', 'city_ktp', 'province_domicile', 'city_domicile',
           'sub_distric_ktp', 'sub_distric_domicile', 'administrative_village_ktp', 'administrative_village_domicile',
           // Form field names (for backward compatibility)
           'official_address_province', 'official_address_city', 'official_address_subdistrict', 'official_address_administrative_village',
           'domicile_address_province', 'domicile_address_city', 'domicile_address_subdistrict', 'domicile_address_administrative_village'].some(key => 
           cleanFieldName.includes(key));
        
        if (needsTranslation) {
          // Try master data translation
          try {
            // Use proper field key for translation, mapping aliases for city/province
            const translationKey = (() => {
              if (cleanFieldName === 'official_address_city') return 'city_ktp_id';
              if (cleanFieldName === 'official_address_province') return 'province_ktp_id';
              if (cleanFieldName === 'domicile_address_city') return 'city_domicile_id';
              if (cleanFieldName === 'domicile_address_province') return 'province_domicile_id';
              return cleanFieldName;
            })();

            const beforeTranslated = getMasterValue(translationKey, resolvedBefore);
            const afterTranslated = getMasterValue(translationKey, afterValue);

            // Always prefer translated labels when available
            if (beforeTranslated !== undefined && beforeTranslated !== null) formattedBefore = beforeTranslated;
            if (afterTranslated !== undefined && afterTranslated !== null) formattedAfter = afterTranslated;

            // Manual fallback for domicile/ktp city and province if still numeric
            const looksNumeric = (v) => v !== undefined && v !== null && /^\d+$/.test(String(v));
            if ((cleanFieldName.includes('city') || cleanFieldName.includes('province')) && (looksNumeric(resolvedBefore) || looksNumeric(afterValue))) {
              const tryArrays = [];
              if (cleanFieldName.includes('city')) {
                if (masterData.value.CITY) tryArrays.push(masterData.value.CITY);
                if (masterData.value.CITIES) tryArrays.push(masterData.value.CITIES);
              } else {
                if (masterData.value.PROVINCE) tryArrays.push(masterData.value.PROVINCE);
                if (masterData.value.PROVINCES) tryArrays.push(masterData.value.PROVINCES);
              }
              const translateWith = (val) => {
                for (const arr of tryArrays) {
                  const hit = Array.isArray(arr) && arr.find(it => {
                    const comps = [it.code, it.id, it.id_city, it.id_province, it.code_id];
                    return comps.some(x => x !== undefined && x !== null && String(x) === String(val));
                  });
                  if (hit) {
                    const labels = [hit.label, hit.value, hit.city_name, hit.province_name, hit.name, hit.text, hit.title];
                    const label = labels.find(v => v);
                    if (label) return label;
                  }
                }
                return null;
              };
              if (looksNumeric(resolvedBefore)) {
                const lbl = translateWith(resolvedBefore);
                if (lbl) formattedBefore = lbl;
              }
              if (looksNumeric(afterValue)) {
                const lbl = translateWith(afterValue);
                if (lbl) formattedAfter = lbl;
              }
            }
          } catch (error) {
            // Continue with original values if translation fails
          }
        }
        
        // Special case handlers for fields that don't follow the standard pattern
        if (cleanFieldName === "member_status" || cleanFieldName.includes('member_status')) {
          // Use hardcoded member status labels
          formattedBefore = getMemberStatusLabel(beforeValue);
          formattedAfter = getMemberStatusLabel(afterValue);
        } else if (cleanFieldName === "has_disability" || cleanFieldName.includes('disability')) {
          // Handle both boolean and numeric values for disability
          const disabilityMap = {
            true: "Yes",
            false: "No",
            "true": "Yes",
            "false": "No",
            "1": "Yes",
            "0": "No",
            1: "Yes",
            0: "No"
          };
          formattedBefore = disabilityMap[beforeValue] || disabilityMap[beforeValue?.toString()] || formattedBefore;
          formattedAfter = disabilityMap[afterValue] || disabilityMap[afterValue?.toString()] || formattedAfter;
        }

        // Determine if this is a change or addition
        const isChanged = JSON.stringify(beforeValue) !== JSON.stringify(afterValue);
        const status = (beforeValue !== null && beforeValue !== undefined) ? 
          (isChanged ? "modified" : "unchanged") : "added";

        // Final safeguard: if still numeric for address *_id fields, try more variants
        const isNumericLike = (v) => v !== undefined && v !== null && /^\d+$/.test(String(v));
        if (isNumericLike(afterValue) && (/city_.*_id|province_.*_id|_city_id|_province_id|city_ktp_id|city_domicile_id|province_ktp_id|province_domicile_id/.test(cleanFieldName))) {
          const keyVariants = [
            cleanFieldName,
            cleanFieldName.replace(/_id$/, ''),
            cleanFieldName.includes('city') ? 'city' : (cleanFieldName.includes('province') ? 'province' : cleanFieldName),
            cleanFieldName.includes('city_ktp_id') ? 'city_ktp' : (cleanFieldName.includes('city_domicile_id') ? 'city_domicile' : cleanFieldName),
            cleanFieldName.includes('province_ktp_id') ? 'province_ktp' : (cleanFieldName.includes('province_domicile_id') ? 'province_domicile' : cleanFieldName)
          ];
          for (const k of keyVariants) {
            const t = getMasterValue(k, afterValue);
            if (t && t !== afterValue) {
              formattedAfter = t;
              break;
            }
          }
        }

        // Detect category based on field patterns
        let category = 'Data';
        if (cleanFieldName.includes('edu_') || cleanFieldName.includes('education_')) {
          category = 'education';
        } else if (cleanFieldName.includes('family_') || cleanFieldName.includes('emgc_')) {
          category = 'family';
        } else if (cleanFieldName.includes('emgc_')) {
          category = 'emergency_contact';
        } else if (cleanFieldName.includes('employment_') || cleanFieldName.includes('employee_')) {
          category = 'employment';
        }

        // Add to changes array
        changes.push({
          field: field,
          label: fieldLabel,
          before: formattedBefore,
          after: formattedAfter,
          status: status,
          isChanged: isChanged,
          recordIndex: recordIndex,
          category: category
        });
        
      }
    });

    
    return changes;
  } catch (error) {
    return [];
  }
});
</script>
