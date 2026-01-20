/**
 * Edit Page Field Mapping Functions
 * 
 * Pure functions for mapping between API field names and form field names
 * Extracted from pages/update-data/edit/[id].vue
 */

import { mapAddress } from '~/utils/dataResolver'

/**
 * Map API field names to form field names for all categories
 * @param {Object} apiData - Data from API
 * @param {string} category - Category name
 * @returns {Object|Array} Mapped form data
 */
export const mapApiToFormFields = (apiData, category) => {
    switch (category) {
        case 'basic-information':
            return {
                // Basic Information fields - using exact field names from BasicInformationForm
                // Map API field names to form field names based on actual API response
                nik: apiData.nik || '',
                name: apiData.name || '',
                // Use no_ktp field directly
                no_ktp: apiData.no_ktp || '',
                business_email: apiData.business_email || '',
                private_email: apiData.private_email || '',
                main_phone_number: apiData.main_phone_number || apiData.phone || '',
                secondary_phone_number: apiData.secondary_phone_number || '',
                birth_date: apiData.birth_date || '',
                birth_place: apiData.birth_place || '',
                // FIX: Ensure gender_id is properly mapped - handle numeric IDs correctly
                gender_id: (() => {

                    // Priority: gender_id (numeric/string) > gender text mapping > empty
                    if (apiData.gender_id !== null && apiData.gender_id !== undefined && apiData.gender_id !== '') {
                        return String(apiData.gender_id);
                    }

                    // Fallback: Try to map from gender text
                    if (apiData.gender) {
                        const genderMap = {
                            'LAKI-LAKI': '1',
                            'MALE': '1',
                            'L': '1',
                            'PEREMPUAN': '2',
                            'FEMALE': '2'
                        };
                        const mappedGender = genderMap[String(apiData.gender).toUpperCase()] || '';
                        return mappedGender;
                    }

                    return '';
                })(),
                marital_status_id: (() => {
                    // Return marital_status_id directly if available
                    // Note: marital_status_id can be 0 (SINGLE), so we check for !== null and !== undefined
                    if (apiData.marital_status_id !== null && apiData.marital_status_id !== undefined) {
                        return String(apiData.marital_status_id);
                    }
                    return '';
                })(),
                religion_id: (() => {

                    // Priority: religion_id > religion text mapping > empty
                    if (apiData.religion_id !== null && apiData.religion_id !== undefined && apiData.religion_id !== '') {
                        return String(apiData.religion_id);
                    }

                    // Fallback: Try to map from religion text
                    if (apiData.religion) {
                        const religionMap = {
                            'ISLAM': '1',
                            'KRISTEN': '2',
                            'KATOLIK': '3',
                            'HINDU': '4',
                            'BUDDHA': '5',
                            'KONGHUCU': '6',
                            'LAINNYA': '7'
                        };
                        const mappedReligion = religionMap[String(apiData.religion).toUpperCase()] || '';
                        return mappedReligion;
                    }

                    return '';
                })(),
                nationality_id: (() => {

                    // Priority: nationality_id > nationality text mapping > empty
                    if (apiData.nationality_id !== null && apiData.nationality_id !== undefined && apiData.nationality_id !== '') {
                        return String(apiData.nationality_id);
                    }

                    // Fallback: Try to map from nationality text
                    if (apiData.nationality) {
                        const nationalityMap = {
                            'INDONESIA': '1',
                            'WNI': '1'
                        };
                        const mappedNationality = nationalityMap[String(apiData.nationality).toUpperCase()] || '';
                        return mappedNationality;
                    }

                    return '';
                })(),
                clothing_size_id: String(apiData.clothing_size_id || ''),
                passport_number: apiData.passport_number || '',
                ktp_doc: apiData.ktp_doc || '',
                professional_photo: apiData.professional_photo || apiData.photo || '',
            };

        case 'address':

            // Use the mapAddress function from dataResolver for consistent mapping
            const mappedData = mapAddress(apiData);

            return mappedData;

        case 'emergency-contact':
            return {
                emergency_contact_name: apiData.emergency_contact_name || apiData.name || '',
                emergency_contact_relationship: apiData.emergency_contact_relationship || apiData.relationship || '',
                emergency_contact_phone: apiData.emergency_contact_phone || apiData.phone_number || '',
                emergency_contact_address: apiData.emergency_contact_address || apiData.address || '',
            };

        case 'payroll-account':
            // Convert string IDs to numbers for bank_id and tax_status_id
            const convertToNumber = (value) => {
                if (value === null || value === undefined || value === '') return undefined;
                const num = Number(value);
                return isNaN(num) ? undefined : num;
            };

            return {
                bank_id: convertToNumber(apiData.bank_id || apiData.bank),
                number_rekening: apiData.number_rekening || apiData.account_number || '',
                holder_name: apiData.holder_name || '',
                tax_status_id: convertToNumber(apiData.tax_status_id || apiData.tax_status),
                npwp: apiData.npwp || '',
                npwp_doc: apiData.npwp_doc || '',
                saving_book_doc: apiData.saving_book_doc || '',
            };

        case 'family':
            return {
                family_name: apiData.family_name || apiData.name || '',
                family_relationship: apiData.family_relationship || apiData.relationship || '',
                family_birth_date: apiData.family_birth_date || apiData.birth_date || '',
                family_gender: apiData.family_gender || apiData.gender || '',
                family_occupation: apiData.family_occupation || apiData.occupation || '',
                family_document: apiData.family_document || '',
                kk_doc: apiData.kk_doc || '',
            };

        case 'education':
            // Education is array data - return as array
            if (Array.isArray(apiData)) {
                return apiData.map(education => ({
                    id_education: education.id_education || education.id || '',
                    edu_level_id: education.edu_level_id || education.id_edu_level || education.edu_level || '',
                    edu_level: education.edu_level || education.education_level || education.level || '',
                    edu_major_id: education.edu_major_id || education.id_edu_major || education.edu_major || '',
                    edu_major: education.edu_major || education.major || education.field_of_study || '',
                    edu_institution_id: education.edu_institution_id || education.id_edu_institution || education.edu_institution || '',
                    edu_institution: education.edu_institution || education.institution || education.school_name || '',
                    start_date: education.start_date || education.edu_start_date || '',
                    end_date: education.end_date || education.edu_end_date || '',
                    // Remove ijazah_doc_id and ijazah_doc as they are handled by attachments API
                    // ijazah_doc_id: education.ijazah_doc_id || education.ijazah_doc || null,
                    // ijazah_doc: education.ijazah_doc || null,
                    status: education.status !== undefined ? education.status : 1,
                }));
            }
            return [];

        case 'social-security':
            return {
                no_bpjs_tk: apiData.bpjs_tk_number || apiData.no_bpjs_tk || '',
                bpjs_tk_effective_date: apiData.bpjs_tk_effective_date || '',
                no_bpjs: apiData.bpjs_health_number || apiData.no_bpjs || '',
                bpjs_doc: apiData.bpjs_doc || '',
                no_telkomedika: apiData.no_telkomedika || apiData.telkomedika_card_number || '',
                telkomedika_doc: apiData.telkomedika_doc || '',
            };

        case 'medical-record':
            return {
                // Medical Record fields - using camelCase to match dataResolver.ts
                bloodType: apiData.blood_type || apiData.bloodType || '',
                heightCm: apiData.height || apiData.heightCm || '',
                weightKg: apiData.weight || apiData.weightKg || '',
                headSize: apiData.head_size || apiData.headSize || '',
                healthStatus: (() => {
                    // Handle both health_status_id and health_status
                    const rawStatus = apiData.health_status_id || apiData.health_status || apiData.healthStatus || '';
                    if (!rawStatus) return '';

                    // If it's a number (ID), we need to resolve it to label
                    if (typeof rawStatus === 'number' || /^\d+$/.test(rawStatus)) {
                        // For now, return the ID as string - will be resolved by master data
                        return String(rawStatus);
                    }

                    // Valid health status options
                    const validOptions = ['Fit', 'Unfit', 'Under Treatment', 'Requires Monitoring'];

                    // Try exact match first
                    if (validOptions.includes(rawStatus)) {
                        return rawStatus;
                    }

                    // Try case-insensitive match
                    const normalizedValue = String(rawStatus).toLowerCase().trim();
                    const match = validOptions.find(option =>
                        option.toLowerCase() === normalizedValue
                    );

                    return match || String(rawStatus);
                })(),
                lastMcuDate: apiData.last_mcu_date || apiData.lastMcuDate || '',
                hasDisability: apiData.has_disability || apiData.hasDisability || false,
                healthConcern: apiData.health_concern || apiData.healthConcern || '',
                medicalTreatmentRecord: apiData.medical_treatment_record || apiData.medicalTreatmentRecord || '',
                vaccinationRecord: apiData.vaccination_record || apiData.vaccinationRecord || '',
                specialConditions: apiData.special_conditions || apiData.specialConditions || '',

                // Additional fields from API response
                nik: apiData.nik || '',
                employeeName: apiData.employee_name || apiData.employeeName || '',
            };

        case 'employment-information':
            // Employment Info is read-only, no field mapping needed
            return {};

        default:
            // Return all fields as-is if category not specified
            return apiData;
    }
};

/**
 * Map Address form fields (used in UI) back to API field names
 * @param {Object} formData - Form data
 * @returns {Object} API-formatted data
 */
export const mapAddressFormToAPI = (formData) => {
    const apiData = {};
    const acceptedFields = {
        // Official address (KTP)
        'official_address_detail': 'detail_ktp',
        'official_address_province': 'province_ktp_id',
        'official_address_city': 'city_ktp_id',
        'official_address_postal_code': 'postal_code_ktp',
        'official_address_subdistrict': 'sub_distric_ktp',
        'official_address_administrative_village': 'administrative_village_ktp',
        'official_address_rt': 'rt_ktp',
        'official_address_rw': 'rw_ktp',
        'official_address_street': 'street_name_ktp',
        'official_address_house_number': 'house_number_ktp',

        // Domicile address
        'domicile_address_detail': 'detail_domicile',
        'domicile_address_province': 'province_domicile_id',
        'domicile_address_city': 'city_domicile_id',
        'domicile_address_postal_code': 'postal_code_domicile',
        'domicile_address_subdistrict': 'sub_distric_domicile',
        'domicile_address_administrative_village': 'administrative_village_domicile',
        'domicile_address_rt': 'rt_domicile',
        'domicile_address_rw': 'rw_domicile',
        'domicile_address_street': 'street_name_domicile',
        'domicile_address_house_number': 'house_number_domicile'
    };

    Object.keys(acceptedFields).forEach((formField) => {
        if (formData && Object.prototype.hasOwnProperty.call(formData, formField)) {
            const apiField = acceptedFields[formField];
            const value = formData[formField];
            if (['province_ktp_id', 'city_ktp_id', 'province_domicile_id', 'city_domicile_id'].includes(apiField)) {
                apiData[apiField] = value === '' || value === null || value === undefined ? '' : Number(value);
            } else {
                apiData[apiField] = value;
            }
        }
    });

    return apiData;
};
