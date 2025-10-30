import { ref } from "vue";
import { usePersonalData } from "~/composables/usePersonalData";
import { useAuth } from "~/composables/useAuth";

export const useExportData = () => {
  const isModalOpen = ref(false);
  const isLoading = ref(false);
  const isDownloading = ref(false);
  const error = ref(null);

  // Data untuk preview PDF
  const previewData = ref({
    'basic-information': null,
    address: null,
    emergency_contact: null,
    payroll_account: null,
    family: null,
    education: null,
    social_security: null,
    medical_record: null,
    employment_info: null,
  });

  // Data types yang tersedia sesuai API contract
  const dataTypes = ref([
    {
      id: "basic-information",
      title: "Basic Information",
      description: "Informasi dasar karyawan",
      icon: "pi-user",
      selected: true,
      disabled: true, // Tidak bisa diuncheck
      endpoint: "/employee/basic-information",
    },
    {
      id: "employment_info",
      title: "Employment",
      description: "Informasi pekerjaan dan penugasan",
      icon: "pi-briefcase",
      selected: false, // Default tidak terceklist
      endpoint: "/employee/employment-information",
    },
    {
      id: "address",
      title: "Address",
      description: "Alamat sesuai KTP dan domisili",
      icon: "pi-map-marker",
      selected: false,
      endpoint: "/employee/address",
    },
    {
      id: "family",
      title: "Family",
      description: "Data anggota keluarga",
      icon: "pi-users",
      selected: false,
      endpoint: "/employee/family",
    },
    {
      id: "emergency_contact",
      title: "Emergency Contact",
      description: "Kontak darurat",
      icon: "pi-phone",
      selected: false,
      endpoint: "/employee/emergency-contact",
    },
    {
      id: "education",
      title: "Education",
      description: "Riwayat pendidikan",
      icon: "pi-graduation-cap",
      selected: false,
      endpoint: "/employee/education",
    },
    {
      id: "payroll_account",
      title: "Account",
      description: "Informasi rekening dan NPWP",
      icon: "pi-credit-card",
      selected: false,
      endpoint: "/employee/payroll-account",
    },
    {
      id: "social_security",
      title: "Benefit",
      description: "BPJS dan asuransi",
      icon: "pi-shield",
      selected: false,
      endpoint: "/employee/social-securities",
    },
    {
      id: "medical_record",
      title: "Medical",
      description: "Data kesehatan",
      icon: "pi-heart",
      selected: false,
      endpoint: "/employee/medical-record",
    },
  ]);

  // Computed untuk data types yang dipilih
  const selectedDataTypes = ref([]);

  // Helper untuk update selectedDataTypes
  const updateSelectedDataTypes = () => {
    selectedDataTypes.value = dataTypes.value.filter((type) => type.selected);
  };

  // Fungsi untuk membuka modal
  const openModal = async () => {
    isModalOpen.value = true;
    error.value = null;
    updateSelectedDataTypes();
    await loadPreviewData();
  };

  // Fungsi untuk menutup modal
  const closeModal = () => {
    isModalOpen.value = false;
    error.value = null;
  };

  // Fungsi untuk toggle selection
  const toggleSelection = async (dataType) => {
    // Jangan izinkan toggle jika dataType disabled
    if (dataType.disabled) {
      return;
    }
    dataType.selected = !dataType.selected;
    updateSelectedDataTypes();
    await loadPreviewData();
  };

  // Fungsi untuk select all
  const selectAll = async () => {
    dataTypes.value.forEach((type) => {
      // Jangan ubah yang disabled
      if (!type.disabled) {
        type.selected = true;
      }
    });
    updateSelectedDataTypes();
    await loadPreviewData();
  };

  // Fungsi untuk clear all
  const clearAll = async () => {
    dataTypes.value.forEach((type) => {
      // Jangan ubah yang disabled
      if (!type.disabled) {
        type.selected = false;
      }
    });
    updateSelectedDataTypes();
    await loadPreviewData();
  };

  // Fungsi untuk mengambil data dari API berdasarkan data types yang dipilih
  const loadPreviewData = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      // Selalu ambil basic-information dan employment_info untuk Employee Details
      const requiredEndpoints = [
        {
          id: "basic-information",
          endpoint: "/employee/basic-information",
        },
        {
          id: "employment_info",
          endpoint: "/employee/employment-information",
        },
      ];

      // Gabungkan dengan data types yang dipilih (hindari duplikasi)
      const allEndpoints = [...requiredEndpoints];
      selectedDataTypes.value.forEach((dataType) => {
        if (!allEndpoints.find((ep) => ep.id === dataType.id)) {
          allEndpoints.push({ id: dataType.id, endpoint: dataType.endpoint });
        }
      });

      const promises = allEndpoints.map(async (endpoint) => {
        try {
                     // Get auth token
           const { user, getValidAccessToken } = useAuth();
           let token = user.value?.accessToken || localStorage.getItem("access_token");
           
           // Try to get valid token with auto-refresh
           try {
             token = await getValidAccessToken();
           } catch (tokenError) {
             // Token refresh failed, continue with existing token
             console.warn('Token refresh failed:', tokenError.message);
           }

          if (!token) {
            return { type: endpoint.id, data: null, error: 'No authentication token' };
          }

          // Use $fetch to get data from API with proper auth
          const response = await globalThis.$fetch(endpoint.endpoint, {
            method: "GET",
            baseURL: '/api/proxy',
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
          });
          
         
          // Check different possible response structures
          let data = null;
          if (response?.success && response?.data) {
            data = response.data;
          } else if (response?.status && response?.data) {
            data = response.data;
          } else if (response?.data) {
            data = response.data;
          } else if (response?.success && response) {
            data = response;
          } else if (response) {
            data = response;
          }
          
          if (data) {
            return { type: endpoint.id, data: data };
          } else {
            return { type: endpoint.id, data: null, error: response.error };
          }
        } catch (err) {
          return { type: endpoint.id, data: null, error: err.message };
        }
      });

      const results = await Promise.all(promises);

      // Reset preview data
      Object.keys(previewData.value).forEach((key) => {
        previewData.value[key] = null;
      });

      // Update preview data dengan data yang berhasil diambil
      results.forEach((result) => {
        
        if (result.data) {
          switch (result.type) {
            case "basic-information":
              previewData.value['basic-information'] = normalizeBasicInformation(result.data);
              break;
            case "employment_info":
              previewData.value.employment_info = normalizeEmploymentInfo(result.data);
              break;
            case "address":
              previewData.value.address = normalizeAddress(result.data);
              break;
            case "family":
              previewData.value.family = normalizeFamily(result.data);
              break;
            case "emergency_contact":
              previewData.value.emergency_contact = normalizeEmergencyContact(result.data);
              break;
            case "education":
              previewData.value.education = normalizeEducation(result.data);
              break;
            case "payroll_account":
              previewData.value.payroll_account = normalizePayrollAccount(result.data);
              break;
            case "social_security":
              previewData.value.social_security = normalizeSocialSecurity(result.data);
              break;
            case "medical_record":
              previewData.value.medical_record = normalizeMedicalRecord(result.data);
              break;
            default:
              previewData.value[result.type] = result.data;
          }
        } else if (result.error) {
          // Set error message for failed data types
          error.value = `Gagal memuat data ${result.type}: ${result.error}`;
        }
      });

      // Log final preview data state
      
      // Fallback: If no data loaded, try to use data from usePersonalData
      const hasAnyData = Object.values(previewData.value).some(data => data !== null);
      if (!hasAnyData) {
        try {
          const personalData = usePersonalData();
          
          // Try to get data from personalData composable
          if (personalData.employeeData.value && Object.keys(personalData.employeeData.value).length > 0) {
            previewData.value['basic-information'] = normalizeBasicInformation(personalData.employeeData.value);
          }
          
          if (personalData.employmentInfoData.value && Object.keys(personalData.employmentInfoData.value).length > 0) {
            previewData.value.employment_info = normalizeEmploymentInfo(personalData.employmentInfoData.value);
          }
          
          if (personalData.addressData.value && Object.keys(personalData.addressData.value).length > 0) {
            previewData.value.address = normalizeAddress(personalData.addressData.value);
          }
          
        } catch (fallbackError) {
          console.warn('Fallback data loading failed:', fallbackError.message);
        }
      }
    } catch (err) {
      console.error('Error loading preview data:', err);
      error.value = "Gagal memuat data untuk preview";
    } finally {
      isLoading.value = false;
    }
  };

  // Fungsi untuk mengunduh PDF
  const exportPDF = async () => {
    isDownloading.value = true;
    error.value = null;

    try {
      // Map data types ke kategori API
      const categoryMapping = {
        "Basic Information": "basic",
        "Employment": "employment",
        "Address": "address", 
        "Emergency Contact": "emergency",
        "Account": "payroll",
        "Family": "family",
        "Education": "education",
        "Benefit": "social",
        "Medical": "medical"
      };

      // Siapkan kategori yang dipilih
      const selectedCategories = [];
      
      // Selalu include basic dan employment untuk Employee Details
      selectedCategories.push("basic", "employment");
      
      // Tambahkan kategori yang dipilih user
      selectedDataTypes.value.forEach((dataType) => {
        const category = categoryMapping[dataType.title];
        if (category && !selectedCategories.includes(category)) {
          selectedCategories.push(category);
        }
      });

      // Siapkan payload untuk API
      const exportPayload = {
        categories: selectedCategories,
        include_images: true
      };


      // Validasi data sebelum dikirim
      if (!selectedCategories || selectedCategories.length === 0) {
        error.value = "Tidak ada data yang dipilih untuk diekspor";
        return;
      }

      // Get auth token
      const { user, getValidAccessToken } = useAuth();
      let token = user.value?.accessToken || localStorage.getItem("access_token");
      
      // Try to get valid token with auto-refresh
      try {
        token = await getValidAccessToken();
      } catch (tokenError) {
        console.warn('Token refresh failed during PDF export:', tokenError.message);
      }

      if (!token) {
        error.value = "Token autentikasi tidak ditemukan";
        return;
      }

      // Call new PDF export endpoint
      const response = await globalThis.$fetch("/employee/pdf-export", {
        method: "POST",
        baseURL: '/api/proxy',
        body: exportPayload,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "*/*",
        },
        responseType: "blob",
      });


      if (response) {
        // Pastikan response adalah Blob
        if (!(response instanceof Blob)) {
          error.value = "Format response tidak valid";
          return;
        }

        // Download langsung dari response blob
        const url = window.URL.createObjectURL(response);
        const link = document.createElement("a");
        link.href = url;

        // Generate nama file
        const timestamp = new Date().toISOString().split("T")[0];
        link.download = `Employee_Export_${timestamp}.pdf`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        // Tutup modal setelah download berhasil
        closeModal();
      } else {
        error.value = "Gagal mengunduh PDF";
      }
    } catch (err) {
      // PDF download error handled
      error.value = err.message || "Terjadi kesalahan saat mengunduh PDF";
    } finally {
      isDownloading.value = false;
    }
  };

  return {
    isModalOpen,
    isLoading,
    isDownloading,
    error,
    dataTypes,
    selectedDataTypes,
    previewData,
    openModal,
    closeModal,
    toggleSelection,
    selectAll,
    clearAll,
    exportPDF,
  };
};

// Tambahkan helper normalisasi data
function normalizeBasicInformation(data) {
  if (!data || typeof data !== 'object') {
    return {};
  }
  
  // Handle case where data might be nested differently
  let basicData = data;
  if (data.data && typeof data.data === 'object') {
    basicData = data.data;
  }
  
  const result = {
    nik: basicData.nik || '',
    business_email: basicData.business_email || '',
    name: basicData.name || basicData.employee_name || basicData.full_name || '',
    birth_place: basicData.birth_place || basicData.place_of_birth || '',
    birth_date: basicData.birth_date || '',
    gender_id: basicData.gender_id || '',
    gender: basicData.gender || '',
    no_ktp: basicData.no_ktp || '',
    passport_number: basicData.passport_number || '',
    religion_id: basicData.religion_id || '',
    religion: basicData.religion || '',
    marital_status_id: basicData.marital_status_id || '',
    marital_status: basicData.marital_status || '',
    nationality_id: basicData.nationality_id || '',
    nationality: basicData.nationality || '',
    clothing_size_id: basicData.clothing_size_id || '',
    clothing_size: basicData.clothing_size || '',
    main_phone_number_id: basicData.main_phone_number_id || '',
    main_phone_number: basicData.main_phone_number || '',
    secondary_phone_number_id: basicData.secondary_phone_number_id || '',
    secondary_phone_number: basicData.secondary_phone_number || '',
    private_email: basicData.private_email || '',
    professional_photo_doc_id: basicData.professional_photo_doc_id || '',
    professional_photo: basicData.professional_photo || '',
    ktp_doc_id: basicData.ktp_doc_id || '',
    ktp_doc: basicData.ktp_doc || '',
  };
  
  return result;
}

function normalizeEmploymentInfo(data) {
  if (!data || typeof data !== 'object') {
    return {};
  }
  
  // Handle case where data might be nested differently
  let employmentData = data;
  if (data.data && typeof data.data === 'object') {
    employmentData = data.data;
  }
  
  const result = {
    nik: employmentData.nik || '',
    nik_telkom: employmentData.nik_telkom || '',
    business_email: employmentData.business_email || '',
    name: employmentData.name || '',
    directorate: employmentData.directorate || '',
    business_unit: employmentData.business_unit || '',
    divisi: employmentData.divisi || employmentData.division || employmentData.department || '',
    grade: employmentData.grade || '',
    grade_date: employmentData.grade_date || '',
    band_position: employmentData.band_position || '',
    band_position_date: employmentData.band_position_date || '',
    level: employmentData.level || '',
    level_date: employmentData.level_date || '',
    position: employmentData.position || '',
    supervisor: employmentData.supervisor || '',
    status: employmentData.status || '',
  };
  
  return result;
}

function normalizeAddress(data) {
  if (!data) {
    return {};
  }
  
  // Handle case where data might be nested differently
  let addressData = data;
  
  // If data has a 'data' property, use that instead
  if (data.data && typeof data.data === 'object') {
    addressData = data.data;
  }
  
  // Return the data directly as it already has the correct structure
  return {
    detail_ktp: addressData.detail_ktp || '',
    province_ktp: addressData.province_ktp || '',
    city_ktp: addressData.city_ktp || '',
    postal_code_ktp: addressData.postal_code_ktp || '',
    sub_distric_ktp: addressData.sub_distric_ktp || '',
    administrative_village_ktp: addressData.administrative_village_ktp || '',
    rt_ktp: addressData.rt_ktp || '',
    rw_ktp: addressData.rw_ktp || '',
    street_name_ktp: addressData.street_name_ktp || '',
    house_number_ktp: addressData.house_number_ktp || '',
    detail_domicile: addressData.detail_domicile || '',
    province_domicile: addressData.province_domicile || '',
    city_domicile: addressData.city_domicile || '',
    postal_code_domicile: addressData.postal_code_domicile || '',
    sub_distric_domicile: addressData.sub_distric_domicile || '',
    administrative_village_domicile: addressData.administrative_village_domicile || '',
    rt_domicile: addressData.rt_domicile || '',
    rw_domicile: addressData.rw_domicile || '',
    street_name_domicile: addressData.street_name_domicile || '',
    house_number_domicile: addressData.house_number_domicile || '',
  };
}

function normalizeFamily(data) {
  if (!data) return {};
  
  // Handle case where data might be nested differently
  let familyData = data;
  if (data.data && typeof data.data === 'object') {
    familyData = data.data;
  }
  
  // Return the data with family_members array
  return {
    family_members: familyData.family_members || [],
    total_family_members: familyData.total_family_members || 0
  };
}

function normalizeEmergencyContact(data) {
  if (!data) return {};
  
  // Handle case where data might be nested differently
  let contactData = data;
  if (data.data && typeof data.data === 'object') {
    contactData = data.data;
  }
  
  return {
    emergency_contacts: contactData.emergency_contacts || [],
    total_contacts: contactData.total_contacts || 0
  };
}

function normalizeEducation(data) {
  if (!data) return {};
  
  // Handle case where data might be nested differently
  let educationData = data;
  if (data.data && typeof data.data === 'object') {
    educationData = data.data;
  }
  
  return {
    education_history: educationData.education_history || [],
    total_education_records: educationData.total_education_records || 0
  };
}

function normalizePayrollAccount(data) {
  if (!data) return {};
  
  // Handle case where data might be nested differently
  let accountData = data;
  if (data.data && typeof data.data === 'object') {
    accountData = data.data;
  }
  
  return {
    bank: accountData.bank || '',
    bank_id: accountData.bank_id || '',
    number_rekening: accountData.number_rekening || '',
    holder_name: accountData.holder_name || '',
    tax_status: accountData.tax_status || '',
    tax_status_id: accountData.tax_status_id || '',
    npwp: accountData.npwp || '',
    npwp_doc_id: accountData.npwp_doc_id || '',
    saving_book_doc_id: accountData.saving_book_doc_id || '',
  };
}

function normalizeSocialSecurity(data) {
  if (!data) return {};
  
  // Handle case where data might be nested differently
  let securityData = data;
  if (data.data && typeof data.data === 'object') {
    securityData = data.data;
  }
  
  return {
    no_telkomedika: securityData.no_telkomedika || '',
    no_bpjs_tk: securityData.no_bpjs_tk || '',
    bpjs_tk_effective_date: securityData.bpjs_tk_effective_date || '',
    no_bpjs: securityData.no_bpjs || '',
    telkomedika_doc_id: securityData.telkomedika_doc_id || '',
    bpjs_doc_id: securityData.bpjs_doc_id || '',
  };
}

function normalizeMedicalRecord(data) {
  if (!data) return {};
  
  // Handle case where data might be nested differently
  let medicalData = data;
  if (data.data && typeof data.data === 'object') {
    medicalData = data.data;
  }
  
  return {
    blood_type: medicalData.blood_type || '',
    blood_type_id: medicalData.blood_type_id || '',
    height: medicalData.height || '',
    weight: medicalData.weight || '',
    health_status: medicalData.health_status || '',
    health_status_id: medicalData.health_status_id || '',
    last_mcu_date: medicalData.last_mcu_date || '',
    has_disability: medicalData.has_disability || '',
    has_disability_id: medicalData.has_disability_id || '',
    head_size: medicalData.head_size || '',
    health_concern: medicalData.health_concern || '',
    medical_treatment_record: medicalData.medical_treatment_record || '',
  };
}
