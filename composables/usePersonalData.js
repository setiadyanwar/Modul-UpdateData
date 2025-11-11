import { ref, nextTick } from "vue";
import { useApi } from "~/composables/useApi";
import { useAuth } from "~/composables/useAuth";
import { useMasterOptions } from "~/composables/useMasterOptions";

export const usePersonalData = () => {
  // Setup auth using custom auth
  useAuth();
  const { apiGet, apiPost } = useApi();

  // Centralized master options composable (nationality still has small fallback)
  const { options: masterOptions, loadMasterOptions } = useMasterOptions();
  // Provide backward-compatible name `dummyOptions` for consumers
  const dummyOptions = masterOptions;

  // Data models with proper initialization
  const employeeData = ref({
    // Basic Information fields from API contract
    nik: "",
    name: "",
    photo: "",
    birth_place: "",
    birth_date: "",
    gender: "",
    no_ktp: "",
    passport_number: "",
    religion: "",
    marital_status: "",
    nationality_id: "",
    clothing_size: "",
    main_phone_number: "",
    secondary_phone_number: "",
    business_email: "",
    private_email: "",
    ktp_doc: "",
    // Legacy fields for backward compatibility
    employeeId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    nationalId: "",
    professionalPhoto: "",
    professional_photo: "",
    employee_name: "",
    place_of_birth: "",
    photo_ktp: "",
  });

  const addressData = ref({
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
    domicile_address_house_number: ""
  });

  const emergencyContactData = ref([]);

  const payrollAccountData = ref({
    number_rekening: "",
    bank_id: "",
    holder_name: "",
    tax_status_id: "",
    npwp: "",
    npwp_doc: "",
    saving_book_doc: "",
  });
  const payrollAccountMessage = ref("");

  const familyData = ref([]);
  const educationData = ref([]);

  const socialSecurityData = ref({
    no_telkomedika: "",
    no_bpjs_tk: "",
    bpjs_tk_effective_date: "",
    no_bpjs: "",
    telkomedika_doc: "",
    bpjs_doc: "",
  });

  const medicalRecordData = ref({
    health_status_id: null,
    health_status: "",
    last_mcu_date: "",
    blood_type_id: null,
    blood_type: "",
    height: null,
    weight: null,
    has_disability_id: false,
    has_disability: "",
    head_size: null,
    health_concern: "",
    medical_treatment_record: "",
  });

  const employmentInfoData = ref({
    nik: "",
    nik_telkom: "",
    business_email: "",
    directorate: "",
    business_unit: "",
    divisi: "",
    grade: "",
    grade_date: "",
    band_position: "",
    band_position_date: "",
    level: "",
    level_date: "",
    position: "",
    supervisor: "",
    join_date: "",
    start_date: "",
    terminate_date: "",
    reason_employee_in: "",
    reason_employee_out: "",
    status: "",
    retirement_date: "",
  });

  // Original data for change tracking
  const originalData = ref({});
  const originalAddressData = ref({
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
    domicile_address_house_number: ""
  });
  const originalEmergencyContactData = ref([]);
  const originalPayrollAccountData = ref({});
  const originalFamilyData = ref([]);
  const originalEducationData = ref([]);
  const originalSocialSecurityData = ref({});
  const originalMedicalRecordData = ref({});
  const originalEmploymentInfoData = ref({});

  // Loading states
  // ✅ FIX: Start with TRUE to show skeleton immediately on page load
  // Will be set to false after data is loaded in onMounted
  const isLoadingBasicInfo = ref(true);
  const isLoadingAddress = ref(true);
  const isLoadingEmergencyContact = ref(true);
  const isLoadingPayrollAccount = ref(true);
  const isLoadingFamily = ref(true);
  const isLoadingEducation = ref(true);
  const isLoadingSocialSecurity = ref(true);
  const isLoadingMedicalRecord = ref(true);
  const isLoadingEmploymentInfo = ref(true);
  
  // Reset state to prevent infinite loops
  const isResetting = ref(false);

  // Submitting states
  const isSubmittingBasicInfo = ref(false);
  const isSubmittingAddress = ref(false);
  const isSubmittingEmergencyContact = ref(false);
  const isSubmittingPayrollAccount = ref(false);
  const isSubmittingFamily = ref(false);
  const isSubmittingEducation = ref(false);
  const isSubmittingSocialSecurity = ref(false);
  const isSubmittingMedicalRecord = ref(false);
  const isSubmittingEmploymentInfo = ref(false);

  // Helper function to safely merge API data
  const safeMergeData = (target, source) => {
    if (!source) {
      return target;
    }

    // Deep merge to ensure nested objects are properly initialized
    const merged = { ...target };
    for (const key in source) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        // Ensure target[key] exists before spreading
        if (!merged[key]) {
          merged[key] = {};
        }
        merged[key] = { ...merged[key], ...source[key] };
      } else {
        merged[key] = source[key];
      }
    }

    return merged;
  };

  // Filter function to only merge relevant fields for specific data types
  const safeMergeDataWithFilter = (target, source, allowedFields) => {
    if (!source) {
      return target;
    }

    const merged = { ...target };
    for (const key in source) {
      // Only merge if the field is in the allowed list
      if (allowedFields.includes(key)) {
        if (
          source[key] &&
          typeof source[key] === "object" &&
          !Array.isArray(source[key])
        ) {
          // Ensure target[key] exists before spreading
          if (!merged[key]) {
            merged[key] = {};
          }
          merged[key] = { ...merged[key], ...source[key] };
        } else {
          merged[key] = source[key];
        }
      }
    }

    return merged;
  };

  // Load functions with proper error handling and data initialization
  const loadBasicInformation = async () => {
    try {
      // ✅ GUARD: Wait for token to be available before making API calls
      if (process.client) {
        let retries = 0;
        const maxRetries = 20; // Wait max 4 seconds (20 * 200ms)

        while (!localStorage.getItem('access_token') && retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 200));
          retries++;
        }

        if (!localStorage.getItem('access_token')) {
          console.error('[loadBasicInformation] ❌ No token available after waiting');
          throw new Error('Authentication token not available. Please refresh the page.');
        }

      }

      // ✅ OPTIMIZED: Load master options only once per session
      // Check if master options are already loaded to prevent redundant calls
      const hasMasterOptions = Object.values(masterOptions.value).some(options =>
        Array.isArray(options) && options.length > 0
      );

      if (!hasMasterOptions) {
        await loadMasterOptions();
      } else {
      }

      // Updated endpoint according to new API contract
      const response = await apiGet("/employee/basic-information");

      // Check if we have valid API response
      let apiData = null;
      
      if (response && response.success && response.data) {
        apiData = response.data;
      } else if (response && response.data) {
        apiData = response.data;
      } else if (response && typeof response === 'object') {
        // Response might be the data directly
        apiData = response;
      } else {
        throw new Error("Invalid API response structure");
      }
      
      // Transform API data to match our form structure
      const transformedData = {
        nik: apiData.nik || "", // Add missing NIK field
        name: apiData.name || "",
        gender: apiData.gender || "", // Tambah field gender (bukan hanya gender_id)
        gender_id: apiData.gender_id || "",
        religion: apiData.religion || "", // Tambah field religion (bukan hanya religion_id)
        religion_id: apiData.religion_id || "",
        birth_place: apiData.birth_place || "",
        birth_date: apiData.birth_date ? convertDateFormat(apiData.birth_date) : "", // Konversi format tanggal
        no_ktp: apiData.no_ktp || "",
        passport_number: apiData.passport_number || "",
        marital_status: apiData.marital_status || "", // Tambah field marital_status
        marital_status_id: apiData.marital_status_id !== null && apiData.marital_status_id !== undefined ? String(apiData.marital_status_id) : "", // Pastikan string untuk dropdown, termasuk "0"
        nationality: apiData.nationality || "", // Tambah field nationality
        nationality_id: String(apiData.nationality_id || ""), // Pastikan string untuk dropdown
        clothing_size: apiData.clothing_size || "", // Tambah field clothing_size
        clothing_size_id: apiData.clothing_size_id || "",
        main_phone_number: apiData.main_phone_number || "",
        secondary_phone_number: apiData.secondary_phone_number || "",
        business_email: apiData.business_email || "",
        private_email: apiData.private_email || "",
        ktp_doc: apiData.ktp_doc || "",
        professional_photo: apiData.professional_photo || "", // Perbaiki field name
      };
      
  // Removed debug logs

      const mergedData = safeMergeData(employeeData.value, transformedData);
      
      employeeData.value = mergedData;
      originalData.value = JSON.parse(JSON.stringify(employeeData.value));
    } catch (error) {
      console.error('Failed to load basic information:', error);
      // Don't throw the error - continue with existing data to prevent app crash
    } finally {
      isLoadingBasicInfo.value = false;
    }
  };

  // Helper function to convert date format to DD-MM-YYYY
  const convertDateFormat = (dateString) => {
    if (!dateString) return "";
    
    // If already in DD-MM-YYYY format, return as is
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      return dateString;
    }
    
    // If in YYYY-MM-DD format, convert to DD-MM-YYYY
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const parts = dateString.split('-');
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    
    // If in DD/MM/YYYY format, convert to DD-MM-YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const parts = dateString.split('/');
      return `${parts[0]}-${parts[1]}-${parts[2]}`;
    }
    
    // If in other format, try to parse and convert
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      }
    } catch {
      // ignore parse errors
    }
    
    return dateString; // Return original if can't parse
  };

  const loadAddress = async () => {
    try {
      isLoadingAddress.value = true;
      isResetting.value = true; // 🔧 Set flag to prevent watchers from triggering
      
      // Updated endpoint according to new API contract
      const response = await apiGet("/employee/address");

      if (response && response.data) {
        // Transform API response to flat address structure
        const transformedData = {
          // Official address fields (map from _ktp fields to official_address_)
          official_address_detail: response.data.detail_ktp || "",
          official_address_province: response.data.province_ktp_id || response.data.province_ktp || "",
          official_address_city: response.data.city_ktp_id || response.data.city_ktp || "",
          official_address_postal_code: response.data.postal_code_ktp || "",
          official_address_subdistrict: response.data.sub_distric_ktp || "",
          official_address_administrative_village: response.data.administrative_village_ktp || "",
          official_address_rt: response.data.rt_ktp || "",
          official_address_rw: response.data.rw_ktp || "",
          official_address_street: response.data.street_name_ktp || "",
          official_address_house_number: response.data.house_number_ktp || "",
          
          // Domicile address fields 
          domicile_address_detail: response.data.detail_domicile || "",
          domicile_address_province: response.data.province_domicile_id || response.data.province_domicile || "",
          domicile_address_city: response.data.city_domicile_id || response.data.city_domicile || "",
          domicile_address_postal_code: response.data.postal_code_domicile || "",
          domicile_address_subdistrict: response.data.sub_distric_domicile || "",
          domicile_address_administrative_village: response.data.administrative_village_domicile || "",
          domicile_address_rt: response.data.rt_domicile || "",
          domicile_address_rw: response.data.rw_domicile || "",
          domicile_address_street: response.data.street_name_domicile || "",
          domicile_address_house_number: response.data.house_number_domicile || ""
        };
        
  // debug logs removed
        
        addressData.value = safeMergeData(addressData.value, transformedData);
        // Store both: raw and flat original for reliable rendering and comparison
        // Prefer flat original for UI consumption so original values appear correctly
        const flatOriginal = { ...transformedData };
        originalAddressData.value = JSON.parse(JSON.stringify(flatOriginal));
        
  // debug logs removed
      } else {
        // No data available, initialize with empty values
        originalAddressData.value = JSON.parse(JSON.stringify(addressData.value));
      }
    } finally {
      isLoadingAddress.value = false;
      isResetting.value = false; // 🔧 Clear flag after data loading is complete
    }
  };

  const loadEmergencyContact = async () => {
    try {
      isResetting.value = true; // 🔧 Set flag to prevent watchers from triggering
      
      // Updated endpoint according to new API contract
      const response = await apiGet("/employee/emergency-contact");

      let contacts = [];
      if (response && (response.success || response.status) && response.data) {
        // Handle the new API structure where data contains emergency_contacts array
        if (response.data.emergency_contacts && Array.isArray(response.data.emergency_contacts)) {
          contacts = response.data.emergency_contacts;
        } else if (Array.isArray(response.data)) {
          contacts = response.data;
        } else if (typeof response.data === 'object' && response.data !== null) {
          contacts = [response.data];
        }
      } else if (response && response.data) {
        if (response.data.emergency_contacts && Array.isArray(response.data.emergency_contacts)) {
          contacts = response.data.emergency_contacts;
        } else if (Array.isArray(response.data)) {
          contacts = response.data;
        } else if (typeof response.data === 'object' && response.data !== null) {
          contacts = [response.data];
        }
      }
      // FIXED: Keep original status from API, don't modify it
      if (contacts.length > 0) {
        contacts = contacts.map((c) => ({ 
          ...c, 
          // Keep original status from API
          status: c.status !== undefined ? c.status : 1,
          // Set active based on status
          active: c.status === 1
        }));
      }
      
      // FIXED: Transform data using mapEmergencyArray to ensure proper field mapping
      const { mapEmergencyArray } = await import('~/utils/dataResolver');
      const transformedContacts = mapEmergencyArray(contacts);
      
      emergencyContactData.value = transformedContacts;
      originalEmergencyContactData.value = JSON.parse(JSON.stringify(emergencyContactData.value));
      if (contacts.length === 0) {
        emergencyContactData.value = [];
        originalEmergencyContactData.value = [];
      }
    } finally {
      isLoadingEmergencyContact.value = false;
      isResetting.value = false; // 🔧 Clear flag after data loading is complete
    }
  };

  const loadPayrollAccount = async () => {
    try {
      // Feature flag to skip payroll fetch (dev convenience)
      // Check runtime config, env var, or localStorage flag
      const runtimeConfig = null;
      const skipFlag = (typeof process !== 'undefined' && process?.env?.SKIP_PAYROLL_FETCH === 'true')
        || (runtimeConfig && runtimeConfig.public && runtimeConfig.public.skipPayrollFetch === true)
        || (process.client && localStorage.getItem && localStorage.getItem('skip_payroll_fetch') === '1');
      if (skipFlag) {
        payrollAccountData.value = {};
        originalPayrollAccountData.value = JSON.parse(JSON.stringify(payrollAccountData.value));
        isLoadingPayrollAccount.value = false;
        return;
      }
      // Updated endpoint according to new API contract
      const response = await apiGet("/employee/payroll-account");

      if (response.success && response.data) {
        // Map API response to correct field names
        const mappedData = {
          number_rekening: response.data.number_rekening || "",
          bank_id: response.data.bank_id || response.data.bank || "",
          holder_name: response.data.holder_name || "",
          tax_status_id: response.data.tax_status_id || response.data.tax_status || "",
          npwp: response.data.npwp || "",
          npwp_doc: response.data.npwp_doc || "",
          saving_book_doc: response.data.saving_book_doc || "",
        };
        
        payrollAccountData.value = safeMergeData(
          payrollAccountData.value,
          mappedData
        );
        originalPayrollAccountData.value = JSON.parse(JSON.stringify(payrollAccountData.value));
        payrollAccountMessage.value = "";
      } else {
        // No data available, initialize with empty values
        originalPayrollAccountData.value = JSON.parse(JSON.stringify(payrollAccountData.value));
        // If API returned message, surface it
        payrollAccountMessage.value = response && response.message ? response.message : "Payroll account not available";
      }
  } catch (error) {
      // If endpoint not found (404) treat as no data available instead of erroring
      const msg = (error && error.message) ? String(error.message).toLowerCase() : '';
      if (msg.includes('404') || msg.includes('not found')) {
        payrollAccountData.value = {};
        originalPayrollAccountData.value = JSON.parse(JSON.stringify(payrollAccountData.value));
        payrollAccountMessage.value = 'Employee payroll account information not found';
      } else {
        throw error; // Re-throw other errors to let caller handle
      }
    } finally {
      isLoadingPayrollAccount.value = false;
    }
  };

  const loadFamily = async () => {
    try {
      // Updated endpoint according to new API contract
      const response = await apiGet("/employee/family");

      let familyMembers = [];
      if (response && (response.success || response.status) && response.data) {
        // Handle the new API structure where data contains family array
        if (response.data.family && Array.isArray(response.data.family)) {
          familyMembers = response.data.family;
        } else if (response.data.family_members && Array.isArray(response.data.family_members)) {
          familyMembers = response.data.family_members;
        } else if (Array.isArray(response.data)) {
          familyMembers = response.data;
        } else if (typeof response.data === 'object' && response.data !== null) {
          familyMembers = [response.data];
        }
      } else if (response && response.data) {
        // Handle the new API structure where data contains family array
        if (response.data.family && Array.isArray(response.data.family)) {
          familyMembers = response.data.family;
        } else if (response.data.family_members && Array.isArray(response.data.family_members)) {
          familyMembers = response.data.family_members;
        } else if (Array.isArray(response.data)) {
          familyMembers = response.data;
        } else if (typeof response.data === 'object' && response.data !== null) {
          familyMembers = [response.data];
        }
      }
      
      // Normalize API response to the internal shape used by forms/components
      // Ensure we have master options loaded (non-blocking)
      try {
        if (!masterOptions.value || Object.keys(masterOptions.value).length === 0) {
          await loadMasterOptions();
        }
      } catch {
        // ignore master options load errors - we'll fallback to textual relation
      }

      const familyRelationOptions = (masterOptions.value && masterOptions.value.FAMILY_RELATION) ? masterOptions.value.FAMILY_RELATION : [];

      const normalizeFamilyItem = (item) => {
        const maritalStatusText = item.marital_status || item.martial_status || '';

        // Determine relation id: prefer provided relation_id, else try to map textual relation via master options
        let relationId = null;
        if (item.relation_id !== undefined && item.relation_id !== null) {
          relationId = item.relation_id;
        } else if (item.relation) {
          const match = familyRelationOptions.find(opt => String(opt.value).toLowerCase() === String(item.relation).toLowerCase() || String(opt.code) === String(item.relation));
          if (match) relationId = match.code !== undefined ? match.code : match.id || null;
        }

        return {
          id: item.id || item.id_family || '',
          name: item.name || '',
          gender: item.gender || '', // Add gender field
          gender_id: item.gender_id || null, // Add gender_id field
          birth_place: item.birth_place || '',
          birth_date: item.birth_date || '',
          address: item.address || '',
          occupation: item.occupation || '',
          relation: relationId !== null ? relationId : (item.relation !== undefined ? item.relation : ''),
          relation_id: relationId,
          marital_status: maritalStatusText || (item.marital_status_id ? String(item.marital_status_id) : ''),
          marital_status_id: item.marital_status_id || null,
          member_sequence: item.member_sequence !== undefined ? item.member_sequence : null,
          no_telkomedika: item.no_telkomedika || '',
          member_status: item.member_status !== undefined && item.member_status !== null ? Number(item.member_status) : 1,
          kk_doc_id: item.kk_doc_id || null,
          kk_doc: item.kk_doc || null,
          status: item.status !== undefined && item.status !== null ? Number(item.status) : 1
        };
      };

      familyData.value = familyMembers.map(normalizeFamilyItem);
      originalFamilyData.value = JSON.parse(JSON.stringify(familyData.value));
    } finally {
      isLoadingFamily.value = false;
    }
  };

  const loadEducation = async () => {
    try {
      // Updated endpoint according to new API contract
      const response = await apiGet("/employee/education");

      if (response.success && response.data) {
        // Handle the new API structure: data.education_history contains the array
        const educationArray = response.data.education_history || response.data;
        educationData.value = Array.isArray(educationArray) ? educationArray : [];
        originalEducationData.value = [...educationData.value];
      } else {
        // No data available, initialize with empty array
        educationData.value = [];
        originalEducationData.value = [];
      }
    } catch {
      educationData.value = [];
      originalEducationData.value = [];
    } finally {
      isLoadingEducation.value = false;
    }
  };

  const loadSocialSecurity = async () => {
    try {
      // Updated endpoint according to new API contract
      const response = await apiGet("/employee/social-securities");

      if (response.success && response.data) {
        socialSecurityData.value = safeMergeData(
          socialSecurityData.value,
          response.data
        );
        originalSocialSecurityData.value = JSON.parse(JSON.stringify(socialSecurityData.value));
      } else {
        // No data available, initialize with empty values
        originalSocialSecurityData.value = JSON.parse(JSON.stringify(socialSecurityData.value));
      }
    } finally {
      isLoadingSocialSecurity.value = false;
    }
  };

  const loadMedicalRecord = async () => {
    try {
      isLoadingMedicalRecord.value = true;
      // Updated endpoint according to new API contract
      const response = await apiGet("/employee/medical-record");

      // Define allowed fields for medical record to prevent unwanted fields
      const medicalRecordFields = [
        'health_status_id',
        'health_status',
        'last_mcu_date', 
        'blood_type_id',
        'blood_type',
        'height',
        'weight', 
        'has_disability_id',
        'has_disability',
        'head_size',
        'health_concern',
        'medical_treatment_record'
      ];

      if (response.success && response.data) {
        medicalRecordData.value = safeMergeDataWithFilter(
          medicalRecordData.value,
          response.data,
          medicalRecordFields
        );
        
        // Convert fields to proper types
        if (medicalRecordData.value.height) {
          medicalRecordData.value.height = parseFloat(medicalRecordData.value.height);
        }
        if (medicalRecordData.value.weight) {
          medicalRecordData.value.weight = parseFloat(medicalRecordData.value.weight);
        }
        if (medicalRecordData.value.head_size) {
          medicalRecordData.value.head_size = parseFloat(medicalRecordData.value.head_size);
        }
        if (medicalRecordData.value.health_status_id) {
          medicalRecordData.value.health_status_id = parseInt(medicalRecordData.value.health_status_id);
        }
        if (medicalRecordData.value.blood_type_id) {
          medicalRecordData.value.blood_type_id = parseInt(medicalRecordData.value.blood_type_id);
        }
        if (medicalRecordData.value.has_disability_id !== undefined) {
          medicalRecordData.value.has_disability_id = Boolean(parseInt(medicalRecordData.value.has_disability_id));
        }
        
        originalMedicalRecordData.value = JSON.parse(JSON.stringify(medicalRecordData.value));
      } else {
        // No data available, initialize with empty values
        originalMedicalRecordData.value = JSON.parse(JSON.stringify(medicalRecordData.value));
      }
    } catch {
      // Initialize with empty values on error
      originalMedicalRecordData.value = JSON.parse(JSON.stringify(medicalRecordData.value));
    } finally {
      isLoadingMedicalRecord.value = false;
    }
  };

  const loadEmploymentInfo = async () => {
    try {
      // Updated endpoint according to new API contract
      const response = await apiGet("/employee/employment-information");

      if (response.success && response.data) {
        employmentInfoData.value = safeMergeData(
          employmentInfoData.value,
          response.data
        );
        originalEmploymentInfoData.value = JSON.parse(JSON.stringify(employmentInfoData.value));
      } else {
        // No data available, initialize with empty values
        originalEmploymentInfoData.value = JSON.parse(JSON.stringify(employmentInfoData.value));
      }
    } finally {
      isLoadingEmploymentInfo.value = false;
    }
  };

  // Submit functions
  const submitBasicInformation = async () => {
    try {
      isSubmittingBasicInfo.value = true;
      const formData = new FormData();
      formData.append("data", JSON.stringify(employeeData.value));

      // New unified change request format according to new API contract
      const changeRequestData = {
        request_type: "BSC", // Basic Information
        reason_update: "Update basic information",
        changes: employeeData.value
      };

      const response = await apiPost("/employee/change-request/", changeRequestData);

      if (response.success) {
        originalData.value = JSON.parse(JSON.stringify(employeeData.value));
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      isSubmittingBasicInfo.value = false;
    }
  };

  const submitAddress = async () => {
    try {
      isSubmittingAddress.value = true;
      const formData = new FormData();
      formData.append("data", JSON.stringify(addressData.value));

      // New unified change request format according to new API contract
      const changeRequestData = {
        request_type: "ADR", // Address
        reason_update: "Update address information",
        changes: addressData.value
      };

      const response = await apiPost("/employee/change-request/", changeRequestData);

      if (response.success) {
        originalAddressData.value = JSON.parse(JSON.stringify(addressData.value));
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      isSubmittingAddress.value = false;
    }
  };

  const submitEmergencyContact = async () => {
    try {
      isSubmittingEmergencyContact.value = true;
      const formData = new FormData();
      formData.append("data", JSON.stringify(emergencyContactData.value));

      // New unified change request format according to new API contract
      const changeRequestData = {
        request_type: "EMC", // Emergency Contact
        reason_update: "Update emergency contact information",
        changes: emergencyContactData.value
      };

      const response = await apiPost("/employee/change-request/", changeRequestData);

      if (response.success) {
        originalEmergencyContactData.value = JSON.parse(JSON.stringify(emergencyContactData.value));
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      isSubmittingEmergencyContact.value = false;
    }
  };

  const submitPayrollAccount = async () => {
    try {
      isSubmittingPayrollAccount.value = true;
      
      // Map form data to API field names if needed
      const apiData = {
        number_rekening: payrollAccountData.value.number_rekening || "",
        bank_id: payrollAccountData.value.bank_id || "",
        holder_name: payrollAccountData.value.holder_name || "",
        tax_status_id: payrollAccountData.value.tax_status_id || "",
        npwp: payrollAccountData.value.npwp || "",
        npwp_doc: payrollAccountData.value.npwp_doc || "",
        saving_book_doc: payrollAccountData.value.saving_book_doc || "",
      };
      
      const formData = new FormData();
      formData.append("data", JSON.stringify(apiData));

      // New unified change request format according to new API contract
      const changeRequestData = {
        request_type: "PYR", // Payroll Account
        reason_update: "Update payroll account information",
        changes: apiData
      };

      const response = await apiPost("/employee/change-request/", changeRequestData);

      if (response.success) {
        originalPayrollAccountData.value = JSON.parse(JSON.stringify(payrollAccountData.value));
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      isSubmittingPayrollAccount.value = false;
    }
  };

  const submitFamily = async () => {
    try {
      isSubmittingFamily.value = true;

      const formData = new FormData();
      formData.append("data", JSON.stringify(familyData.value));

      // New unified change request format according to new API contract
      const changeRequestData = {
        request_type: "FMY", // Family
        reason_update: "Update family information",
        changes: familyData.value
      };

      const response = await apiPost("/employee/change-request/", changeRequestData);

      if (response.success) {
        originalFamilyData.value = JSON.parse(JSON.stringify(familyData.value));
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      isSubmittingFamily.value = false;
    }
  };

  const submitEducation = async () => {
    try {
      isSubmittingEducation.value = true;
      const formData = new FormData();
      formData.append("data", JSON.stringify(educationData.value));

      // New unified change request format according to new API contract
      const changeRequestData = {
        request_type: "EDC", // Education
        reason_update: "Update education information",
        changes: educationData.value
      };

      const response = await apiPost("/employee/change-request/", changeRequestData);

      if (response.success) {
        originalEducationData.value = JSON.parse(JSON.stringify(educationData.value));
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      isSubmittingEducation.value = false;
    }
  };

  const submitSocialSecurity = async () => {
    try {
      isSubmittingSocialSecurity.value = true;
      const formData = new FormData();
      formData.append("data", JSON.stringify(socialSecurityData.value));

      // New unified change request format according to new API contract
      const changeRequestData = {
        request_type: "SSI", // Benefit
        reason_update: "Update Benefit information",
        changes: socialSecurityData.value
      };

      const response = await apiPost("/employee/change-request/", changeRequestData);

      if (response.success) {
        originalSocialSecurityData.value = JSON.parse(JSON.stringify(socialSecurityData.value));
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      isSubmittingSocialSecurity.value = false;
    }
  };

  const submitMedicalRecord = async () => {
    try {
      isSubmittingMedicalRecord.value = true;
      
      // Get only changed fields by comparing with original data
      const original = originalMedicalRecordData.value;
      const current = medicalRecordData.value;
      
      if (!original || !current) {
        return false;
      }

      // Find changed fields
      const changedFields = {};
      Object.keys(current).forEach(key => {
        const originalValue = original[key];
        const currentValue = current[key];
        
        // Special handling for numeric fields
        if (['height', 'weight', 'head_size'].includes(key)) {
          const originalNum = originalValue === null || originalValue === undefined || originalValue === '' ? null : parseFloat(originalValue);
          const currentNum = currentValue === null || currentValue === undefined || currentValue === '' ? null : parseFloat(currentValue);
          
          // Both null/empty means no change
          if (originalNum === null && currentNum === null) {
            // No change
          } else if (originalNum !== currentNum) {
            changedFields[key] = currentValue;
          }
        } 
        // Special handling for ID fields (should be compared as numbers)
        else if (['health_status_id', 'blood_type_id'].includes(key)) {
          const originalId = originalValue === null || originalValue === undefined || originalValue === '' ? null : parseInt(originalValue);
          const currentId = currentValue === null || currentValue === undefined || currentValue === '' ? null : parseInt(currentValue);
          
          if (originalId !== currentId) {
            changedFields[key] = currentValue;
          }
        }
        // Special handling for boolean fields
        else if (['has_disability_id'].includes(key)) {
          const originalBool = Boolean(originalValue);
          const currentBool = Boolean(currentValue);
          
          if (originalBool !== currentBool) {
            changedFields[key] = currentValue;
          }
        } 
        // For text fields, normalize values for comparison
        else {
          const normalizedOriginal = originalValue === null || originalValue === undefined ? '' : String(originalValue);
          const normalizedCurrent = currentValue === null || currentValue === undefined ? '' : String(currentValue);
          
          if (normalizedOriginal !== normalizedCurrent) {
            changedFields[key] = currentValue;
          }
        }
      });


      // If no changes, return true (nothing to submit)
      if (Object.keys(changedFields).length === 0) {
        return true;
      }

      // New unified change request format according to new API contract
      const changeRequestData = {
        request_type: "MDR", // Medical Record
        reason_update: "Update medical record information",
        changes: changedFields
      };

      const response = await apiPost("/employee/change-request/", changeRequestData);

      if (response.success) {
        originalMedicalRecordData.value = JSON.parse(JSON.stringify(medicalRecordData.value));
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      isSubmittingMedicalRecord.value = false;
    }
  };

  const submitEmploymentInfo = async () => {
    try {
      isSubmittingEmploymentInfo.value = true;
      const formData = new FormData();
      formData.append("data", JSON.stringify(employmentInfoData.value));

      // New unified change request format according to new API contract
      const changeRequestData = {
        request_type: "EMP", // Employment Information
        reason_update: "Update employment information",
        changes: employmentInfoData.value
      };

      const response = await apiPost("/employee/change-request/", changeRequestData);

      if (response.success) {
        originalEmploymentInfoData.value = JSON.parse(JSON.stringify(employmentInfoData.value));
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      isSubmittingEmploymentInfo.value = false;
    }
  };

  // Helper functions for dynamic data
  const addFamilyMember = () => {
    familyData.value.push({
      name: "",
      gender: "",
      gender_id: null,
      birth_date: "",
      birth_place: "",
      address: "",
      occupation: "",
      relation: "",
      relation_id: null,
      marital_status: "",
      marital_status_id: null,
      member_sequence: "",
      no_telkomedika: "",
      member_status: 1,
      kk_doc: "",
      status: 1
    });
    
    // Auto scroll to the new family member after it's rendered
    nextTick(() => {
      const familyMembers = document.querySelectorAll('.bg-white.dark\\:bg-grey-800.rounded-md.shadow-sm.border');
      if (familyMembers.length > 0) {
        const lastMember = familyMembers[familyMembers.length - 1];
        lastMember.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    });
  };

  const removeFamilyMember = (index) => {
    familyData.value.splice(index, 1);
  };

  const addEducationRecord = () => {
    educationData.value.push({
      edu_level: "",
      edu_major: "",
      edu_institution: "",
      edu_start_date: "",
      edu_end_date: "",
      ijazah_doc: "",
      status: 1, // Default to active status (required by API)
    });
    
    // Auto scroll to the new education record after it's rendered
    nextTick(() => {
      const educationRecords = document.querySelectorAll('.bg-white.dark\\:bg-grey-800.rounded-md.shadow-sm.border');
      if (educationRecords.length > 0) {
        const lastRecord = educationRecords[educationRecords.length - 1];
        lastRecord.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    });
  };

  const removeEducationRecord = (index) => {
    educationData.value.splice(index, 1);
  };

  // Reset all data to original values
  const resetAllDataToOriginal = async () => {
    // Set resetting flag to prevent watchers from triggering
    isResetting.value = true;
    
    // Use nextTick to prevent infinite loops during reactive updates
    await nextTick();

    try {
      // Reset all data to original values, but preserve current data if original is empty
      // This ensures data in other tabs doesn't get lost

      // Basic Information - only reset if original exists
      if (originalData.value && Object.keys(originalData.value).length > 0) {
        employeeData.value = { ...originalData.value };
      }

      // Address - only reset if original exists
      if (
        originalAddressData.value &&
        Object.keys(originalAddressData.value).length > 0
      ) {
        addressData.value = { ...originalAddressData.value };
      }

      // Emergency Contact - only reset if original exists
      if (
        Array.isArray(originalEmergencyContactData.value) &&
        originalEmergencyContactData.value.length > 0
      ) {
        emergencyContactData.value = [...originalEmergencyContactData.value];
      }

      // Payroll Account - only reset if original exists
      if (
        originalPayrollAccountData.value &&
        Object.keys(originalPayrollAccountData.value).length > 0
      ) {
        payrollAccountData.value = { ...originalPayrollAccountData.value };
      }

      // Family - only reset if original exists
      if (originalFamilyData.value && originalFamilyData.value.length > 0) {
        familyData.value = [...originalFamilyData.value];
      }

      // Education - only reset if original exists
      if (
        originalEducationData.value &&
        originalEducationData.value.length > 0
      ) {
        educationData.value = [...originalEducationData.value];
      }

      // Benefit - only reset if original exists
      if (
        originalSocialSecurityData.value &&
        Object.keys(originalSocialSecurityData.value).length > 0
      ) {
        socialSecurityData.value = { ...originalSocialSecurityData.value };
      }

      // Medical Record - only reset if original exists
      if (
        originalMedicalRecordData.value &&
        Object.keys(originalMedicalRecordData.value).length > 0
      ) {
        medicalRecordData.value = { ...originalMedicalRecordData.value };
      }

      // Employment Info - only reset if original exists
      if (
        originalEmploymentInfoData.value &&
        Object.keys(originalEmploymentInfoData.value).length > 0
      ) {
        employmentInfoData.value = { ...originalEmploymentInfoData.value };
      }
    } finally {
      // Always reset the flag after a delay to ensure all watchers have processed
      setTimeout(() => {
        isResetting.value = false;
      }, 200); // 🔧 Increased timeout to ensure all reactive updates complete
    }
  };

  return {
    // Dummy options for select fields
    dummyOptions,
    
    // Data models
    employeeData,
    addressData,
    emergencyContactData,
  payrollAccountData,
  payrollAccountMessage,
    familyData,
    educationData,
    socialSecurityData,
    medicalRecordData,
    employmentInfoData,

    // Original data
    originalData,
    originalAddressData,
    originalEmergencyContactData,
    originalPayrollAccountData,
    originalFamilyData,
    originalEducationData,
    originalSocialSecurityData,
    originalMedicalRecordData,
    originalEmploymentInfoData,

    // Loading states
    isLoadingBasicInfo,
    isLoadingAddress,
    isLoadingEmergencyContact,
    isLoadingPayrollAccount,
    isLoadingFamily,
    isLoadingEducation,
    isLoadingSocialSecurity,
    isLoadingMedicalRecord,
    isLoadingEmploymentInfo,

    // Submitting states
    isSubmittingBasicInfo,
    isSubmittingAddress,
    isSubmittingEmergencyContact,
    isSubmittingPayrollAccount,
    isSubmittingFamily,
    isSubmittingEducation,
    isSubmittingSocialSecurity,
    isSubmittingMedicalRecord,
    isSubmittingEmploymentInfo,

    // Load functions
    loadBasicInformation,
    loadAddress,
    loadEmergencyContact,
    loadPayrollAccount,
    loadFamily,
    loadEducation,
    loadSocialSecurity,
    loadMedicalRecord,
    loadEmploymentInfo,

    // Submit functions
    submitBasicInformation,
    submitAddress,
    submitEmergencyContact,
    submitPayrollAccount,
    submitFamily,
    submitEducation,
    submitSocialSecurity,
    submitMedicalRecord,
    submitEmploymentInfo,

    // Helper functions
    addFamilyMember,
    removeFamilyMember,
    addEducationRecord,
    removeEducationRecord,
    resetAllDataToOriginal,
    
    // Reset state flag
    isResetting,
  };
};

