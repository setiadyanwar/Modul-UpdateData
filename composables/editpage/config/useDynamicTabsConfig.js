/**
 * Edit Page Dynamic Tabs & Form Config
 * 
 * Functions for generating dynamic tabs and form configuration based on request detail
 * Extracted from pages/update-data/edit/[id].vue
 */

import { getTabIcon } from '../helpers/useEditPageHelpers'

/**
 * Generate dynamic tabs based on request detail
 * @param {Object} requestDetail - Request detail object
 * @param {string} activeTab - Currently active tab ID
 * @returns {Array} Array of tab objects
 */
export const getDynamicTabs = (requestDetail, activeTab = '') => {
    // Always ensure we have at least one tab
    if (!requestDetail) {
        // No requestDetail, return default tab
        return [{
            id: 'basic-information',
            label: 'Basic Information',
            icon: getTabIcon('basic-information')
        }];
    }

    // If we have categories, use them
    if (requestDetail.categories && requestDetail.categories.length > 0) {
        // Using categories from requestDetail
        const tabs = requestDetail.categories.map((category) => {
            const icon = getTabIcon(category);
            return {
                id: category,
                label: category
                    .replace(/-/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase()),
                icon: icon,
                isActive: category === activeTab
            };
        });
        return tabs;
    }

    // Fallback: generate tab based on request type or update
    const fallbackCategory = requestDetail.request_type ||
        requestDetail.update ||
        requestDetail.category ||
        'basic-information';

    // Map to kebab-case if needed
    const normalizedCategory = fallbackCategory
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/_/g, '-');

    const finalCategory = normalizedCategory === 'data-employee' ? 'basic-information' : normalizedCategory;
    const icon = getTabIcon(finalCategory);

    return [{
        id: finalCategory,
        label: finalCategory
            .replace(/-/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
        icon: icon,
        isActive: finalCategory === activeTab
    }];
}

/**
 * Get editable fields for need revision status
 * @param {Object} requestDetail - Request detail object
 * @param {string} activeTab - Currently active tab ID
 * @returns {Set|null} Set of editable field names, or null if all fields editable
 */
export const getEditableFields = (requestDetail, activeTab) => {
    const status = requestDetail?.status;
    const statusRaw = requestDetail?.status_raw;
    const statusLabel = requestDetail?.status_label;

    // Check multiple possible status formats for need revision
    const isNeedRevision = status === 'rejected' ||
        status === '3' ||
        statusRaw === '3' ||
        statusRaw === 3 ||
        statusLabel === 'rejected' ||
        statusLabel === 'need_revision' ||
        (typeof statusLabel === 'string' && statusLabel.toLowerCase().includes('revision'));

    if (!isNeedRevision) {
        return null; // Not in need revision → all editable as usual
    }

    const newData = requestDetail?.new_data?.data;

    // If no new_data, no fields are editable
    if (!newData || Object.keys(newData).length === 0) {
        return new Set();
    }

    const fields = new Set();

    if (activeTab === 'basic-information') {
        // For basic information, only allow editing fields that exist in new_data
        Object.keys(newData).forEach(apiField => {
            // Only add field if it has a meaningful value (not null, undefined, or empty)
            const value = newData[apiField];

            if (value !== null && value !== undefined && value !== '') {
                let formField = apiField;

                // Map specific API fields to form fields (same as dynamicFormData)
                if (apiField === 'phone') formField = 'main_phone_number';

                fields.add(formField);
            }
        });
    } else if (activeTab === 'address') {
        // For address, map API field names to form field names
        const fieldMapping = {
            // Official address (KTP) fields
            'detail_ktp': 'official_address_detail',
            'province_ktp': 'official_address_province',
            'province_ktp_id': 'official_address_province',
            'city_ktp': 'official_address_city',
            'city_ktp_id': 'official_address_city',
            'postal_code_ktp': 'official_address_postal_code',
            'sub_distric_ktp': 'official_address_subdistrict',
            'administrative_village_ktp': 'official_address_administrative_village',
            'rt_ktp': 'official_address_rt',
            'rw_ktp': 'official_address_rw',
            'street_name_ktp': 'official_address_street',
            'house_number_ktp': 'official_address_house_number',

            // Domicile address fields
            'detail_domicile': 'domicile_address_detail',
            'province_domicile': 'domicile_address_province',
            'province_domicile_id': 'domicile_address_province',
            'city_domicile': 'domicile_address_city',
            'city_domicile_id': 'domicile_address_city',
            'postal_code_domicile': 'domicile_address_postal_code',
            'sub_distric_domicile': 'domicile_address_subdistrict',
            'administrative_village_domicile': 'domicile_address_administrative_village',
            'rt_domicile': 'domicile_address_rt',
            'rw_domicile': 'domicile_address_rw',
            'street_name_domicile': 'domicile_address_street',
            'house_number_domicile': 'domicile_address_house_number'
        };

        // Check each field in new_data and map to form field names
        Object.keys(newData).forEach(apiField => {
            const value = newData[apiField];

            if (value !== null && value !== undefined && value !== '') {
                // Map API field to form field name
                const formField = fieldMapping[apiField];
                if (formField) {
                    fields.add(formField);
                } else {
                    // If no mapping found, add the original field name
                    fields.add(apiField);
                }
            }
        });

        // Also check nested structure if it exists (for backward compatibility)
        if (newData.official_address && typeof newData.official_address === 'object') {
            Object.keys(newData.official_address).forEach(k => {
                const value = newData.official_address[k];
                if (value !== null && value !== undefined && value !== '') {
                    fields.add(`official_${k}`);
                    fields.add(k); // Also allow flat keys
                }
            });
        }
        if (newData.domicile_address && typeof newData.domicile_address === 'object') {
            Object.keys(newData.domicile_address).forEach(k => {
                const value = newData.domicile_address[k];
                if (value !== null && value !== undefined && value !== '') {
                    fields.add(`domicile_${k}`);
                    fields.add(k); // Also allow flat keys
                }
            });
        }
    } else if (activeTab === 'medical-record') {
        // For medical record, map API field names to form field names
        const fieldMapping = {
            'blood_type': 'bloodType',
            'height': 'heightCm',
            'weight': 'weightKg',
            'head_size': 'headSize',
            'has_disability': 'hasDisability',
            'health_status': 'healthStatus',
            'last_mcu_date': 'lastMcuDate',
            'health_concern': 'healthConcern',
            'medical_treatment_record': 'medicalTreatmentRecord',
            'vaccination_record': 'vaccinationRecord',
            'special_conditions': 'specialConditions'
        };

        // Check each field in new_data and map to form field names
        Object.keys(newData).forEach(apiField => {
            const value = newData[apiField];

            if (value !== null && value !== undefined && value !== '') {
                // Map API field to form field name
                const formField = fieldMapping[apiField];
                if (formField) {
                    fields.add(formField);
                } else {
                    // If no mapping found, add the original field name
                    fields.add(apiField);
                }
            }
        });
    } else if (activeTab === 'payroll-account') {
        // For payroll account, map API field names to form field names
        // IMPORTANT: Document fields (npwp_doc, saving_book_doc) are excluded from editable fields
        const fieldMapping = {
            'bank_id': 'bank_id',
            'number_rekening': 'number_rekening',
            'holder_name': 'holder_name',
            'tax_status_id': 'tax_status_id',
            'npwp': 'npwp'
            // npwp_doc and saving_book_doc are intentionally excluded - they are view-only
        };

        // Document fields that should never be editable
        const documentFields = ['npwp_doc', 'saving_book_doc', 'npwp_doc_id', 'saving_book_doc_id'];

        // Check each field in new_data and map to form field names
        Object.keys(newData).forEach(apiField => {
            const value = newData[apiField];

            // Skip document fields - they are always view-only
            if (documentFields.includes(apiField)) {
                return;
            }

            if (value !== null && value !== undefined && value !== '') {
                // Map API field to form field name
                const formField = fieldMapping[apiField];
                if (formField) {
                    fields.add(formField);
                } else {
                    // If no mapping found, add the original field name (but not if it's a document field)
                    if (!documentFields.includes(apiField)) {
                        fields.add(apiField);
                    }
                }
            }
        });
    } else if (activeTab === 'social-security') {
        // For Benefit, map API field names to form field names
        const fieldMapping = {
            'bpjs_tk_number': 'no_bpjs_tk',
            'bpjs_tk_effective_date': 'bpjs_tk_effective_date',
            'bpjs_health_number': 'no_bpjs',
            'bpjs_doc': 'bpjs_doc',
            'no_telkomedika': 'no_telkomedika',
            'telkomedika_card_number': 'telkomedika_card_number',
            'telkomedika_doc': 'telkomedika_doc'
        };

        // Check each field in new_data and map to form field names
        Object.keys(newData).forEach(apiField => {
            const value = newData[apiField];

            if (value !== null && value !== undefined && value !== '') {
                // Map API field to form field name
                const formField = fieldMapping[apiField];
                if (formField) {
                    fields.add(formField);
                } else {
                    // If no mapping found, add the original field name
                    fields.add(apiField);
                }
            }
        });
    } else if (Array.isArray(newData)) {
        // For array-based tabs (family, education, emergency-contact), determine editable fields based on new_data
        const arrayFields = new Set();

        // Get all fields that exist in new_data
        newData.forEach(item => {
            if (item && typeof item === 'object') {
                Object.keys(item).forEach(field => {
                    const value = item[field];
                    if (value !== null && value !== undefined && value !== '') {
                        arrayFields.add(field);
                    }
                });
            }
        });

        return arrayFields;
    } else if (typeof newData === 'object') {
        // For other object-based tabs, only allow editing fields with meaningful values
        Object.keys(newData).forEach(k => {
            const value = newData[k];
            if (value !== null && value !== undefined && value !== '') {
                fields.add(k);
            }
        });
    }

    return fields;
}

/**
 * Get form configuration for components
 * @param {Object} requestDetail - Request detail object
 * @param {Set|null} editableFields - Set of editable fields (from getEditableFields)
 * @returns {Object} Form configuration object
 */
export const getFormConfig = (requestDetail, editableFields) => {
    const currentStatus = requestDetail?.status;
    const statusRaw = requestDetail?.status_raw;
    const statusLabel = requestDetail?.status_label;

    // Check multiple possible status formats for need revision
    const isNeedRevision = currentStatus === 'rejected' ||
        currentStatus === '3' ||
        statusRaw === '3' ||
        statusRaw === 3 ||
        statusLabel === 'rejected' ||
        statusLabel === 'need_revision' ||
        (typeof statusLabel === 'string' && statusLabel.toLowerCase().includes('revision'));

    const config = {
        status: currentStatus,
        isNeedRevision: isNeedRevision,
        isDraft: currentStatus === 'draft',
        visibleFields: null, // show all fields
        // Only allow editing specific fields for need revision (from new_data)
        editableFields: isNeedRevision ? editableFields : null,
        // Disable all fields by default in need revision; components should honor editableFields to re-enable specific ones
        // For draft mode, allow editing all fields
        disableAllByDefault: isNeedRevision && !(currentStatus === 'draft'),
        showFieldLabels: true,
        showOnlyChangedFields: isNeedRevision,
        // Pass new_data to components for array-based tabs
        newData: (isNeedRevision || currentStatus === 'draft') ? (requestDetail?.new_data?.data || []) : null
    };

    return config;
}
