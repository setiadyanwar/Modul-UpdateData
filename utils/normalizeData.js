/**
 * Normalization and Deep Comparison Utility
 *
 * Purpose: Provide consistent, normalized data comparison to prevent false positives
 * in change detection (null vs "", whitespace, type mismatches, etc.)
 *
 * @module utils/normalizeData
 */

/**
 * Normalize a single value for comparison
 *
 * Rules:
 * - null, undefined, "" → null (all treated as "empty")
 * - Strings → trimmed
 * - Numeric strings → converted to numbers (if valid)
 * - Other types → unchanged
 *
 * @param {*} value - Value to normalize
 * @returns {*} Normalized value
 *
 * @example
 * normalizeValue(null)        // → null
 * normalizeValue(undefined)   // → null
 * normalizeValue("")          // → null
 * normalizeValue("  ")        // → null (empty after trim)
 * normalizeValue("John ")     // → "John"
 * normalizeValue("123")       // → 123
 * normalizeValue("1.5")       // → 1.5
 * normalizeValue("abc")       // → "abc"
 */
export function normalizeValue(value) {
  // Treat null, undefined, empty string as same (normalized to null)
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // Handle strings
  if (typeof value === 'string') {
    const trimmed = value.trim();

    // Empty after trim = null
    if (trimmed === '') {
      return null;
    }

    // Try to convert numeric strings to numbers
    // But only if it's a valid number (not "0abc" or "12.34.56")
    if (!isNaN(trimmed) && !isNaN(parseFloat(trimmed))) {
      const num = Number(trimmed);
      // Check if conversion is lossless (no precision issues)
      if (String(num) === trimmed || trimmed === String(num)) {
        return num;
      }
    }

    return trimmed;
  }

  // Numbers, booleans, etc. pass through unchanged
  return value;
}

/**
 * Deep comparison with automatic normalization
 *
 * Handles:
 * - Primitives (string, number, boolean, null, undefined)
 * - Arrays (deep comparison of elements)
 * - Objects (deep comparison of properties)
 * - Nested structures
 *
 * @param {*} obj1 - First value to compare
 * @param {*} obj2 - Second value to compare
 * @returns {boolean} - True if values are equal after normalization
 *
 * @example
 * deepEqualNormalized(null, "")           // → true
 * deepEqualNormalized("John ", "John")    // → true
 * deepEqualNormalized("1", 1)             // → true
 * deepEqualNormalized([1, 2], [1, 2])     // → true
 * deepEqualNormalized({a: "1"}, {a: 1})   // → true
 */
export function deepEqualNormalized(obj1, obj2) {
  // Normalize both values first
  const norm1 = normalizeValue(obj1);
  const norm2 = normalizeValue(obj2);

  // If both are null after normalization, they're equal
  if (norm1 === null && norm2 === null) {
    return true;
  }

  // If one is null and the other isn't, not equal
  if (norm1 === null || norm2 === null) {
    return false;
  }

  // If both are primitives and equal, return true
  if (norm1 === norm2) {
    return true;
  }

  // Handle Date objects
  if (norm1 instanceof Date && norm2 instanceof Date) {
    return norm1.getTime() === norm2.getTime();
  }

  // Handle arrays
  if (Array.isArray(norm1) && Array.isArray(norm2)) {
    if (norm1.length !== norm2.length) {
      return false;
    }

    for (let i = 0; i < norm1.length; i++) {
      if (!deepEqualNormalized(norm1[i], norm2[i])) {
        return false;
      }
    }

    return true;
  }

  // Handle objects (but not null or arrays which were handled above)
  if (typeof norm1 === 'object' && typeof norm2 === 'object' &&
      norm1 !== null && norm2 !== null &&
      !Array.isArray(norm1) && !Array.isArray(norm2)) {

    const keys1 = Object.keys(norm1);
    const keys2 = Object.keys(norm2);

    // Get all unique keys from both objects
    const allKeys = new Set([...keys1, ...keys2]);

    for (const key of allKeys) {
      // Recursively compare each property
      if (!deepEqualNormalized(norm1[key], norm2[key])) {
        return false;
      }
    }

    return true;
  }

  // Different types or values = not equal
  return false;
}

/**
 * Check if data has changed (inverse of deepEqualNormalized)
 *
 * @param {*} original - Original value
 * @param {*} current - Current value
 * @returns {boolean} - True if values are different
 *
 * @example
 * hasChanged({ name: "John" }, { name: "John" })      // → false
 * hasChanged({ name: "John" }, { name: "Jane" })      // → true
 * hasChanged({ phone: null }, { phone: "" })          // → false (normalized)
 * hasChanged({ age: "25" }, { age: 25 })              // → false (normalized)
 */
export function hasChanged(original, current) {
  return !deepEqualNormalized(original, current);
}

/**
 * Find all changed fields between two objects
 *
 * @param {Object} original - Original object
 * @param {Object} current - Current object
 * @returns {Object} - Object containing only changed fields with { old, new } values
 *
 * @example
 * const original = { name: "John", age: 25, city: "Jakarta" };
 * const current = { name: "John", age: 26, city: "Bandung" };
 *
 * findChangedFields(original, current);
 * // Returns: {
 * //   age: { old: 25, new: 26 },
 * //   city: { old: "Jakarta", new: "Bandung" }
 * // }
 */
export function findChangedFields(original, current) {
  if (!original || !current) {
    return {};
  }

  const changes = {};

  // Get all unique keys
  const allKeys = new Set([
    ...Object.keys(original),
    ...Object.keys(current)
  ]);

  for (const key of allKeys) {
    const oldValue = original[key];
    const newValue = current[key];

    // Check if this field changed (using normalized comparison)
    if (hasChanged(oldValue, newValue)) {
      changes[key] = {
        old: oldValue,
        new: newValue
      };
    }
  }

  return changes;
}

/**
 * Validate if all required files are uploaded for a tab
 *
 * @param {string} tabId - Tab identifier
 * @param {Object} uploadedFiles - Object containing uploaded files by doc_type
 * @param {Array} requiredDocTypes - Array of required document types for this tab
 * @returns {Object} - { isValid: boolean, missingDocs: array, message: string }
 *
 * @example
 * validateRequiredFiles('basic-information', uploadedFiles, ['ktp', 'kk']);
 * // Returns: { isValid: false, missingDocs: ['ktp'], message: '...' }
 */
export function validateRequiredFiles(tabId, uploadedFiles, requiredDocTypes) {
  if (!requiredDocTypes || requiredDocTypes.length === 0) {
    return { isValid: true, missingDocs: [], message: '' };
  }

  const missingDocs = requiredDocTypes.filter(docType => {
    // Check if this doc type has been uploaded
    const files = uploadedFiles[docType];
    return !files || files.length === 0;
  });

  if (missingDocs.length > 0) {
    return {
      isValid: false,
      missingDocs,
      message: `Please upload required documents: ${missingDocs.join(', ')}`
    };
  }

  return {
    isValid: true,
    missingDocs: [],
    message: ''
  };
}

/**
 * Get required document types for a specific tab
 *
 * Based on business rules:
 * - basic-information: KTP required if name/NIK/birth info changed
 * - address: KK (Kartu Keluarga) required
 * - payroll-account: Bank statement/passbook required
 * - social-security: BPJS card required
 * - family: KK (Kartu Keluarga) required
 *
 * @param {string} tabId - Tab identifier
 * @param {Object} changes - Changed fields for this tab
 * @returns {Array} - Array of required document type codes
 */
export function getRequiredDocTypesForTab(tabId, changes = {}) {
  const changedFields = Object.keys(changes);

  switch (tabId) {
    case 'basic-information':
      // KTP required if sensitive fields changed
      const sensitiveFields = ['full_name', 'nik', 'birth_place', 'birth_date', 'gender'];
      const hasSensitiveChange = sensitiveFields.some(field => changedFields.includes(field));
      return hasSensitiveChange ? ['ktp'] : [];

    case 'address':
      // KK required for address changes
      return changedFields.length > 0 ? ['kk'] : [];

    case 'payroll-account':
      // Bank document required for payroll changes
      return changedFields.length > 0 ? ['bank_statement'] : [];

    case 'social-security':
      // BPJS card required for BPJS changes
      const bpjsFields = ['bpjs_kesehatan_number', 'bpjs_ketenagakerjaan_number'];
      const hasBPJSChange = bpjsFields.some(field => changedFields.includes(field));
      return hasBPJSChange ? ['bpjs_card'] : [];

    case 'family':
      // KK required for family member changes
      return changedFields.length > 0 ? ['kk'] : [];

    case 'emergency-contact':
    case 'education':
    case 'medical-record':
    case 'employment-information':
      // No required documents for these tabs
      return [];

    default:
      return [];
  }
}

export default {
  normalizeValue,
  deepEqualNormalized,
  hasChanged,
  findChangedFields,
  validateRequiredFiles,
  getRequiredDocTypesForTab
};
