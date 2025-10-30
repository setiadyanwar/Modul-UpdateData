import { ref } from "vue";
import { useApi } from "./useApi";

export const useChangeRequestSubmit = () => {
  const { apiPost, apiPut } = useApi();

  // Debugging in this module is controlled by DEBUG_SUBMIT; no global console overrides.

  // Expose a couple of debug helpers in the browser for quick inspection
  if (process.client) {
    // last payload staged for submit
    window.__lastChangeRequestPayload = null;

    // helper to run transform without submitting
    window.__debugTransform = (tab, changes, action = null) => {
      try {
        return transformDataForAPI(tab, changes, action);
      } catch (e) {
        try {
          window.dispatchEvent(
            new CustomEvent("debugTransformError", {
              detail: { error: String(e) },
            })
          );
        } catch {
          // ignore
        }
        return null;
      }
    };
  }

  const isSubmitting = ref(false);
  const submitError = ref(null);

  // Client key generator
  const generateClientKey = () => {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
      (
        c ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
      ).toString(16)
    );
  };

  // Helper: consider empty values (used when building delta)
  const isEmptyValue = (val) => {
    if (val === null || val === undefined) return true;
    if (typeof val === "string") return val.trim() === "";
    if (Array.isArray(val)) return val.length === 0;
    if (typeof val === "object") return Object.keys(val).length === 0;
    return false;
  };

  const deepEqual = (a, b) => {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return a === b;
    }
  };

  // Map tab/section to API request type
  const getRequestTypeFromTab = (tab) => {
    const requestTypeMap = {
      "basic-information": "BSC",
      address: "ADR",
      "emergency-contact": "EMC",
      "payroll-account": "PYR",
      family: "FMY",
      education: "EDC",
      "social-security": "SSI",
      "medical-record": "MDR",
      "employment-information": "EMP",
      "employment-info": "EMP",
    };

    return requestTypeMap[tab] || "BSC";
  };

  // Tab ID mapping for legacy support
  const getTabDisplayName = (tab) => {
    const tabNames = {
      "basic-information": "BSC",
      address: "ADR",
      "emergency-contact": "EMC",
      "payroll-account": "PYR",
      family: "FMY",
      education: "EDC",
      "social-security": "SSI",
      "medical-record": "MDR",
      "employment-information": "EMP",
    };

    return tabNames[tab] || "BSC";
  };

  // Main validation
  const validatePayload = (payload) => {
    if (!payload) return false;
    if (!payload.request_type) return false;
    if (!payload.new_data || typeof payload.new_data !== "object") return false;
    return true;
  };

  // Map form field names to API field names for specific tabs
  const mapFormFieldsToAPI = (tab, data) => {
    if (!data) return data;

    // Handle array data (for family, emergency-contact, education)
    if (Array.isArray(data)) {
      return data.map((item) => mapFormFieldsToAPI(tab, item));
    }

    if (typeof data !== "object") return data;

    // Create a copy to avoid mutating original data
    const mappedData = { ...data };

    if (tab === "basic-information") {
      // Convert ID fields to numbers for basic information
      const idFields = [
        "nationality_id",
        "clothing_size_id",
        "gender_id",
        "religion_id",
        "marital_status_id",
      ];

      idFields.forEach((field) => {
        if (field in mappedData) {
          const num = Number(mappedData[field]);
          mappedData[field] = isNaN(num) ? undefined : num;
        }
      });
    }

    if (tab === "payroll-account") {
      // Normalize NPWP to clean numeric only (remove dots/dashes/spaces) as per spec
      if ("npwp" in mappedData && typeof mappedData.npwp === "string") {
        const digitsOnly = mappedData.npwp.replace(/[.\s-]/g, "");
        // If provided, store digits only; allow empty because not required
        mappedData.npwp = digitsOnly || "";
      }

      // Convert bank_id and tax_status_id to numbers
      if ("bank_id" in mappedData) {
        const bankId = Number(mappedData.bank_id);
        mappedData.bank_id = isNaN(bankId) ? undefined : bankId;
      }
      if ("tax_status_id" in mappedData) {
        const taxStatusId = Number(mappedData.tax_status_id);
        mappedData.tax_status_id = isNaN(taxStatusId) ? undefined : taxStatusId;
      }
    }

    if (tab === "family") {
      // Map family form fields to API field names
      if ("gender" in mappedData) {
        mappedData.gender_id = mappedData.gender;
        delete mappedData.gender;
      }
      if ("relation" in mappedData) {
        mappedData.relation_id = mappedData.relation;
        delete mappedData.relation;
      }
      if ("marital_status" in mappedData) {
        mappedData.marital_status_id = mappedData.marital_status;
        delete mappedData.marital_status;
        // Also remove the misspelled variant if it exists
        delete mappedData.martial_status;
      }
      // Remove duplicate telkomedika fields, keep only the main one
      if ("telkomedika_card_number" in mappedData) {
        delete mappedData.telkomedika_card_number;
      }
      if ("telkomedika_member_status" in mappedData) {
        delete mappedData.telkomedika_member_status;
      }
      // Remove kk_doc field as it's not needed in payload
      if ("kk_doc" in mappedData) {
        delete mappedData.kk_doc;
      }
      // Validate member_sequence to ensure it's between 1 and 12
      if (
        "member_sequence" in mappedData &&
        mappedData.member_sequence !== null
      ) {
        const seq = parseInt(mappedData.member_sequence);
        if (!isNaN(seq)) {
          // Clamp value between 1 and 12
          mappedData.member_sequence = Math.max(1, Math.min(12, seq));
        } else {
          // If invalid, set to null
          mappedData.member_sequence = null;
        }
      }
      // Ensure name field is preserved (don't delete it)
      // name field should remain as 'name' for family category
    }

    if (tab === "education") {
      // Map education form fields to API field names and ensure correct data types
      if ("edu_level_id" in mappedData) {
        // Convert string to number to match old_data format
        const levelId = parseInt(mappedData.edu_level_id);
        mappedData.edu_level_id = isNaN(levelId) ? null : levelId;
      }
      if ("edu_major_id" in mappedData) {
        // Convert string to number
        const majorId = parseInt(mappedData.edu_major_id);
        mappedData.edu_major_id = isNaN(majorId) ? null : majorId;
      }
      if ("edu_institution_id" in mappedData) {
        // Convert string to number
        const institutionId = parseInt(mappedData.edu_institution_id);
        mappedData.edu_institution_id = isNaN(institutionId)
          ? null
          : institutionId;
      }
      // Ensure API uses edu_start_date and edu_end_date (backend expects these keys)
      if (
        "start_date" in mappedData &&
        mappedData.start_date !== undefined &&
        !("edu_start_date" in mappedData)
      ) {
        mappedData.edu_start_date = mappedData.start_date;
        delete mappedData.start_date;
      }
      if (
        "end_date" in mappedData &&
        mappedData.end_date !== undefined &&
        !("edu_end_date" in mappedData)
      ) {
        mappedData.edu_end_date = mappedData.end_date;
        delete mappedData.end_date;
      }
      if ("id_education" in mappedData) {
        // Convert string to number
        const educationId = parseInt(mappedData.id_education);
        mappedData.id_education = isNaN(educationId) ? null : educationId;
      }
      if ("status" in mappedData) {
        // Ensure status is number
        const status = parseInt(mappedData.status);
        mappedData.status = isNaN(status) ? 1 : status;
      }

      // Generate client_key if not present
      if (!mappedData.client_key) {
        mappedData.client_key = generateClientKey();
      }

      // Remove label fields as they're not needed in API payload
      if ("edu_level" in mappedData) {
        delete mappedData.edu_level;
      }
      if ("edu_major" in mappedData) {
        delete mappedData.edu_major;
      }
      if ("edu_institution" in mappedData) {
        delete mappedData.edu_institution;
      }
    }

    if (tab === "address") {
      // Check if data is already in API format (from index page filtering)
      const hasApiFields =
        "detail_ktp" in mappedData || "province_ktp_id" in mappedData;
      const hasFormFields =
        "official_address_detail" in mappedData ||
        "official_address_province" in mappedData;

      if (hasApiFields && !hasFormFields) {
        // Data is already in API format and filtered - don't transform
        return mappedData;
      }

      // Map address form fields to API field names (for edit page)
      // Official address fields (KTP)
      if ("official_address_detail" in mappedData) {
        mappedData.detail_ktp = mappedData.official_address_detail;
        delete mappedData.official_address_detail;
      }
      if ("official_address_province" in mappedData) {
        mappedData.province_ktp_id = mappedData.official_address_province;
        delete mappedData.official_address_province;
      }
      if ("official_address_city" in mappedData) {
        mappedData.city_ktp_id = mappedData.official_address_city;
        delete mappedData.official_address_city;
      }
      if ("official_address_postal_code" in mappedData) {
        mappedData.postal_code_ktp = mappedData.official_address_postal_code;
        delete mappedData.official_address_postal_code;
      }
      if ("official_address_subdistrict" in mappedData) {
        mappedData.sub_distric_ktp = mappedData.official_address_subdistrict;
        delete mappedData.official_address_subdistrict;
      }
      if ("official_address_administrative_village" in mappedData) {
        mappedData.administrative_village_ktp =
          mappedData.official_address_administrative_village;
        delete mappedData.official_address_administrative_village;
      }
      if ("official_address_rt" in mappedData) {
        mappedData.rt_ktp = mappedData.official_address_rt;
        delete mappedData.official_address_rt;
      }
      if ("official_address_rw" in mappedData) {
        mappedData.rw_ktp = mappedData.official_address_rw;
        delete mappedData.official_address_rw;
      }
      if ("official_address_street" in mappedData) {
        mappedData.street_name_ktp = mappedData.official_address_street;
        delete mappedData.official_address_street;
      }
      if ("official_address_house_number" in mappedData) {
        mappedData.house_number_ktp = mappedData.official_address_house_number;
        delete mappedData.official_address_house_number;
      }

      // Domicile address fields
      if ("domicile_address_detail" in mappedData) {
        mappedData.detail_domicile = mappedData.domicile_address_detail;
        delete mappedData.domicile_address_detail;
      }
      if ("domicile_address_province" in mappedData) {
        mappedData.province_domicile_id = mappedData.domicile_address_province;
        delete mappedData.domicile_address_province;
      }
      if ("domicile_address_city" in mappedData) {
        mappedData.city_domicile_id = mappedData.domicile_address_city;
        delete mappedData.domicile_address_city;
      }
      if ("domicile_address_postal_code" in mappedData) {
        mappedData.postal_code_domicile =
          mappedData.domicile_address_postal_code;
        delete mappedData.domicile_address_postal_code;
      }
      if ("domicile_address_subdistrict" in mappedData) {
        mappedData.sub_distric_domicile =
          mappedData.domicile_address_subdistrict;
        delete mappedData.domicile_address_subdistrict;
      }
      if ("domicile_address_administrative_village" in mappedData) {
        mappedData.administrative_village_domicile =
          mappedData.domicile_address_administrative_village;
        delete mappedData.domicile_address_administrative_village;
      }
      if ("domicile_address_rt" in mappedData) {
        mappedData.rt_domicile = mappedData.domicile_address_rt;
        delete mappedData.domicile_address_rt;
      }
      if ("domicile_address_rw" in mappedData) {
        mappedData.rw_domicile = mappedData.domicile_address_rw;
        delete mappedData.domicile_address_rw;
      }
      if ("domicile_address_street" in mappedData) {
        mappedData.street_name_domicile = mappedData.domicile_address_street;
        delete mappedData.domicile_address_street;
      }
      if ("domicile_address_house_number" in mappedData) {
        mappedData.house_number_domicile =
          mappedData.domicile_address_house_number;
        delete mappedData.domicile_address_house_number;
      }
    }

    if (tab === "medical-record") {
      // Normalize numeric fields
      if ("height" in mappedData) {
        const n = parseInt(mappedData.height);
        mappedData.height = isNaN(n) ? null : n;
      }
      if ("weight" in mappedData) {
        const n = parseInt(mappedData.weight);
        mappedData.weight = isNaN(n) ? null : n;
      }
      if ("head_size" in mappedData) {
        const n = parseInt(mappedData.head_size);
        mappedData.head_size = isNaN(n) ? null : n;
      }

      // IDs: prefer explicit *_id fields; coerce to number if numeric
      if ("health_status_id" in mappedData) {
        const raw = mappedData.health_status_id;
        const num = parseInt(raw);
        mappedData.health_status_id = isNaN(num) ? String(raw) : num;
      }
      if ("blood_type_id" in mappedData) {
        const raw = mappedData.blood_type_id;
        const num = parseInt(raw);
        mappedData.blood_type_id = isNaN(num) ? String(raw) : num;
      }

      // Checkbox has_disability: map to has_disability_id and send 1/0 (number)
      if ("has_disability" in mappedData) {
        const v = mappedData.has_disability;
        mappedData.has_disability_id =
          v === true || v === "true" || v === 1 || v === "1" ? 1 : 0;
        delete mappedData.has_disability;
      }
      // Also support camelCase from UI
      if (
        "hasDisability" in mappedData &&
        !("has_disability_id" in mappedData)
      ) {
        const v = mappedData.hasDisability;
        mappedData.has_disability_id =
          v === true || v === "true" || v === 1 || v === "1" ? 1 : 0;
        delete mappedData.hasDisability;
      }

      // Drop all label/camelCase fields forbidden by backend
      const forbiddenMedicalFields = [
        "health_status",
        "blood_type",
        "bloodType",
        "heightCm",
        "weightKg",
        "headSize",
        "healthStatus",
        "lastMcuDate",
        "hasDisability",
        "healthConcern",
        "medicalTreatmentRecord",
        "blood_type_text",
        "health_status_text",
      ];
      forbiddenMedicalFields.forEach((f) => {
        if (f in mappedData) delete mappedData[f];
      });

      // Ensure only allowed keys remain by whitelisting
      const allowedKeys = new Set([
        "blood_type_id",
        "health_status_id",
        "height",
        "weight",
        "head_size",
        "last_mcu_date",
        "has_disability_id",
        "health_concern",
        "medical_treatment_record",
        "vaccination_record",
        "special_conditions",
      ]);
      Object.keys(mappedData).forEach((k) => {
        if (!allowedKeys.has(k)) delete mappedData[k];
      });
    }

    return mappedData;
  };

  // Transform data for API submission
  const transformDataForAPI = (currentTab, changes, requestAction = null) => {
    if (!changes) {
      return { action: "update", data: {} };
    }

    let transformedData = {};

    // Check if data is nested wrapper (like { basicData: {...} })
    if (typeof changes === "object" && !Array.isArray(changes)) {
      const changeKeys = Object.keys(changes);

      if (
        changeKeys.length === 1 &&
        (changeKeys[0].endsWith("Data") ||
          changeKeys[0] === currentTab?.replace("-", "_"))
      ) {
        // This is wrapped data, extract it
        const wrappedData = changes[changeKeys[0]];

        if (wrappedData && typeof wrappedData === "object") {
          if (wrappedData.new) {
            transformedData = wrappedData.new;
          } else {
            transformedData = wrappedData;
          }
        }
      } else {
        // Direct data
        transformedData = { ...changes };
      }
    } else if (Array.isArray(changes)) {
      // Filter out any invalid/empty items from array

      const validItems = changes.filter((item) => {
        if (!item || typeof item !== "object") {
          return false;
        }

        // For education, check if has meaningful data (at least one required field)
        if (currentTab === "education") {
          const hasRequiredData =
            item.edu_level_id ||
            item.edu_major_id ||
            item.edu_institution_id ||
            item.edu_start_date ||
            item.edu_end_date ||
            item.id_education;
          return hasRequiredData;
        }

        // For emergency contact, family - check if has meaningful data
        const hasData = Object.values(item).some(
          (value) => value !== null && value !== undefined && value !== ""
        );
        return hasData;
      });

      transformedData = validItems;
    }

    // CRITICAL: Filter out forbidden fields before returning
    if (
      typeof transformedData === "object" &&
      !Array.isArray(transformedData)
    ) {
      // For family category, only filter out nik and business_email, keep name
      const forbiddenFields =
        currentTab === "family"
          ? ["nik", "business_email"]
          : ["name", "nik", "business_email"];

      forbiddenFields.forEach((field) => {
        if (field in transformedData) {
          delete transformedData[field];
        }
      });
    }

    // Apply field mapping for specific tabs (form field names -> API field names)
    if (typeof transformedData === "object") {
      transformedData = mapFormFieldsToAPI(currentTab, transformedData);
    }

    // Additional validation: for array data, ensure it's not empty for insert operations
    if (Array.isArray(transformedData) && transformedData.length === 0) {
      // For array-based tabs (education, emergency-contact, family), return null ONLY for insert operations
      // For update operations (like draft saves), allow empty arrays to pass through
      const arrayBasedTabs = ["education", "emergency-contact", "family"];
      if (arrayBasedTabs.some((tab) => currentTab?.includes(tab))) {
        // Only return null for insert operations, allow updates with existing data to proceed
        if (requestAction === "insert") {
          return null; // Return null to indicate no valid data to submit
        } else {
          // For update operations, return the data structure with empty array
          return {
            action: requestAction || "update",
            data: transformedData,
          };
        }
      }
      // For other tabs, return empty object
      return {
        action: "update",
        data: {},
      };
    }

    // Use provided action or default to 'update'
    const finalAction = requestAction || "update";

    return {
      action: finalAction,
      data: transformedData,
    };
  };

  // Submit new change request
  const submitChangeRequest = async (requestData) => {
    try {
      isSubmitting.value = true;
      submitError.value = null;

      const {
        currentTab,
        changes,
        note_employee,
        reason,
        consent,
        submit = true,
        dryRun = false,
        mock = false,
        id,
        action: componentAction,
        requestAction,
        requestType,
        forcePost = false,
        skipTransform = false,
      } = requestData;

      // If dryRun/mock requested, don't call API — return simulated success
      if (dryRun || mock) {
        return {
          success: true,
          message: "Dry run success",
          data: { id: "mock-123" },
        };
      }
      if (!currentTab) {
        throw new Error("currentTab is required");
      }

      // Transform data for API - use action or requestAction, prioritize action
      const finalAction = componentAction || requestAction || "update";

      // Skip transformation if data is already filtered and processed
      const payloadData = skipTransform
        ? { action: finalAction, data: changes }
        : transformDataForAPI(currentTab, changes, finalAction);

      // Check if transformDataForAPI returned null (no valid data to submit)
      if (payloadData === null) {
        return {
          success: false,
          message:
            "No valid data to submit. Please add some data before saving.",
          data: null,
        };
      }

      // Determine request type from current tab
      const request_type = getRequestTypeFromTab(currentTab);

      // Build the base payload
      const payload = {
        request_type: request_type,
        note_employee: note_employee || reason || null,
        consent: consent === true,
        new_data: {
          action: payloadData.action || "update",
          data: payloadData.data,
        },
        // old_data: Backend will generate old_data automatically, no need to send it
        attachments: [],
        submit: submit,
      };

      // Backend generates old_data automatically based on current employee data

      // Determine action based on request parameters or changes structure
      let action = "update"; // default action

      // Only Emergency Contact, Education, and Family can use 'insert' action
      const insertAllowedTabs = ["emergency-contact", "education", "family"];

      // Use multiple sources for action detection (with priority order)
      const actionSources = [
        componentAction, // action parameter from component
        requestAction, // requestAction parameter
        requestType, // requestType parameter
      ].filter(Boolean); // Remove undefined/null values

      // First check if any explicit action is provided for insert-allowed tabs
      const explicitInsertAction = actionSources.find(
        (src) => src === "insert"
      );
      const explicitUpdateAction = actionSources.find(
        (src) => src === "update"
      );

      if (
        explicitInsertAction &&
        insertAllowedTabs.includes(currentTab) &&
        submit === true
      ) {
        // Only use 'insert' action for final submission (submit=true) of new data
        action = "insert";
      } else if (
        explicitUpdateAction ||
        (actionSources.length > 0 && actionSources[0] === "update")
      ) {
        action = "update";
      }
      // For drafts (submit === false), ALWAYS use 'update' action regardless of tab
      else if (submit === false) {
        action = "update";
      }
      // For final submissions (submit === true) with insert-allowed tabs
      else if (
        submit === true &&
        insertAllowedTabs.includes(currentTab) &&
        actionSources.includes("insert")
      ) {
        action = "insert";
      } else {
        // For submitted requests (submit === true), default to 'update'
        action = "update";
      }

      // CRITICAL: Filter forbidden fields from payloadData.data before assignment
      // For family category, only filter out nik and business_email, keep name
      const forbiddenFieldsFilter =
        currentTab === "family"
          ? ["nik", "business_email"]
          : ["name", "nik", "business_email"];

      // Preserve arrays (EMC/FMY/EDC insert expects array). Filter forbidden fields per-item for arrays
      let filteredNewData;
      if (Array.isArray(payloadData.data)) {
        filteredNewData = payloadData.data.map((item) => {
          if (item && typeof item === "object" && !Array.isArray(item)) {
            const copy = { ...item };
            forbiddenFieldsFilter.forEach((field) => {
              if (field in copy) {
                delete copy[field];
              }
            });
            return copy;
          }
          return item;
        });
      } else if (payloadData.data && typeof payloadData.data === "object") {
        filteredNewData = { ...payloadData.data };
        forbiddenFieldsFilter.forEach((field) => {
          if (field in filteredNewData) {
            delete filteredNewData[field];
          }
        });
      } else {
        filteredNewData = payloadData.data;
      }

      // Apply field mapping to the final payload data
      const finalMappedData = mapFormFieldsToAPI(currentTab, filteredNewData);

      payload.new_data = {
        action: action, // Use final action determined by our logic, not from payloadData
        data: finalMappedData,
      };

      // Backend generates old_data automatically, no need to send it

      // CRITICAL: Check for forbidden fields in final payload before API call
      // For family category, only filter out nik and business_email, keep name
      const forbiddenFields =
        currentTab === "family"
          ? ["nik", "business_email"]
          : ["name", "nik", "business_email"];
      const payloadNewData = payload.new_data?.data;

      // If forbidden fields still exist, filter them out one more time from payload directly
      if (payloadNewData) {
        if (Array.isArray(payloadNewData)) {
          payload.new_data.data = payloadNewData.map((item) => {
            if (item && typeof item === "object") {
              const copy = { ...item };
              forbiddenFields.forEach((field) => {
                if (field in copy) {
                  delete copy[field];
                }
              });
              return copy;
            }
            return item;
          });
        } else if (typeof payloadNewData === "object") {
          forbiddenFields.forEach((field) => {
            if (field in payload.new_data.data) {
              delete payload.new_data.data[field];
            }
          });
        }
      }

      // Cache payload for debugging
      if (process.client) {
        window.__lastChangeRequestPayload = payload;
      }

      let response;
      if (id && submit === true) {
        // Submit from draft or submit revision → use PUT with ID
        response = await apiPut(
          `/employee/change-request/${id}`,
          payload
        );
      } else if (id && submit === false) {
        // Draft editing (save as draft) → use PUT with ID
        response = await apiPut(
          `/employee/change-request/${id}`,
          payload
        );
      } else if (submit === true || forcePost) {
        // Direct submit (no existing draft) → use POST to create new request
        response = await apiPost("/employee/change-request", payload);
      } else {
        // No ID and not final submit → create draft via POST
        response = await apiPost("/employee/change-request", payload);
      }

      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || "Failed to submit change request");
      }
    } catch (error) {
      submitError.value = error.message || "Failed to submit change request";
      throw error;
    } finally {
      isSubmitting.value = false;
    }
  };

  // Update existing change request
  const updateChangeRequest = async (requestId, requestData) => {
    try {
      isSubmitting.value = true;
      submitError.value = null;

      const {
        currentTab,
        changes,
        note_employee,
        reason,
        consent,
        submit = true,
      } = requestData;

      if (!requestId) {
        throw new Error("Request ID is required for update");
      }

      if (!currentTab) {
        throw new Error("currentTab is required");
      }

      // Transform data for API
      const transformedData = transformDataForAPI(
        currentTab,
        changes,
        "update"
      );

      // Check if transformDataForAPI returned null (no valid data to submit)
      if (transformedData === null) {
        return {
          success: false,
          message:
            "No valid data to submit. Please add some data before saving.",
          data: null,
        };
      }

      // Backend generates old_data automatically for updates too

      // Determine action for update operations
      const updateAction = "update"; // default action for updates

      // Apply field mapping to the transformed data
      const finalMappedData = mapFormFieldsToAPI(currentTab, transformedData);

      // Build update payload
      const updatePayload = {
        request_type: getRequestTypeFromTab(currentTab),
        note_employee: note_employee || reason || null,
        consent: consent === true,
        new_data: {
          action: updateAction,
          data: finalMappedData,
        },
        // old_data: Backend will generate old_data automatically, no need to send it
        submit: submit,
      };

      // Cache payload for debugging
      if (process.client) {
        window.__lastChangeRequestPayload = updatePayload;
      }

      // Use proper endpoint with ID so backend updates the correct change request
      const response = await apiPut(
        `/employee/change-request/${requestId}`,
        updatePayload
      );

      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || "Failed to update change request");
      }
    } catch (error) {
      submitError.value = error.message || "Failed to update change request";
      throw error;
    } finally {
      isSubmitting.value = false;
    }
  };

  return {
    // State
    isSubmitting,
    submitError,

    // Functions
    submitChangeRequest,
    updateChangeRequest,
    transformDataForAPI,
    getRequestTypeFromTab,
    getTabDisplayName,
    validatePayload,

    // Utilities
    isEmptyValue,
    deepEqual,
  };
};
