/**
 * Data Normalization and Comparison Utilities
 *
 * Purpose: Solve false positive change detection issues by ensuring
 * consistent data normalization across API responses, draft data, and form data.
 *
 * Problems solved:
 * - null vs "" vs undefined mismatches
 * - Number vs string comparisons ("0" vs 0)
 * - Whitespace differences
 * - Object/array reference vs value comparisons
 * 
 * NOTE: normalizeValue and deepEqualNormalized are available in utils/normalizeData.js
 * Those functions were removed from this file to avoid duplicate export warnings.
 * Use utils/normalizeData.js for normalizeValue and deepEqualNormalized.
 */

import { normalizeValue } from '~/utils/normalizeData';

/**
 * Normalize a single value for consistent comparison
 * 
 * NOTE: This function is duplicated in utils/normalizeData.js
 * The version in normalizeData.js is the one being used.
 * This function is kept for backward compatibility but should not be used.
 * 
 * @deprecated Use normalizeValue from '~/utils/normalizeData' instead
 * @param {*} value - The value to normalize
 * @returns {*} Normalized value
 */
// Removed to avoid duplicate export warning
// Use normalizeValue from utils/normalizeData.js instead

/**
 * Recursively normalize an object or array
 *
 * - Handles nested objects
 * - Handles arrays (including arrays of objects)
 * - Applies normalization to all leaf values
 * 
 * NOTE: Uses normalizeValue from utils/normalizeData.js internally
 *
 * @param {Object|Array} obj - The object or array to normalize
 * @returns {Object|Array} Normalized object or array
 */
export const normalizeObject = (obj) => {
  // normalizeValue is imported from normalizeData.js at the top of the file
  
  // Handle null/undefined
  if (obj === null || obj === undefined) {
    return null;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (typeof item === 'object' && item !== null) {
        return normalizeObject(item);
      }
      return normalizeValue(item);
    });
  }

  // Handle objects
  if (typeof obj === 'object') {
    const normalized = {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];

        // Recursively normalize nested objects
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          normalized[key] = normalizeObject(value);
        }
        // Recursively normalize arrays
        else if (Array.isArray(value)) {
          normalized[key] = normalizeObject(value);
        }
        // Normalize leaf values
        else {
          normalized[key] = normalizeValue(value);
        }
      }
    }

    return normalized;
  }

  // Fallback for primitive types
  return normalizeValue(obj);
};

/**
 * Deep equal comparison with automatic normalization
 * 
 * NOTE: This function is duplicated in utils/normalizeData.js
 * The version in normalizeData.js is the one being used.
 * This function is kept for backward compatibility but should not be used.
 * 
 * @deprecated Use deepEqualNormalized from '~/utils/normalizeData' instead
 * @param {*} a - First value/object to compare
 * @param {*} b - Second value/object to compare
 * @returns {boolean} True if equal after normalization
 */
// Removed to avoid duplicate export warning
// Use deepEqualNormalized from utils/normalizeData.js instead

/**
 * Strict deep equal comparison (after normalization)
 *
 * This function assumes values are already normalized.
 * Used internally by findDifferences and hasChanges.
 *
 * @private
 * @param {*} a - First value to compare
 * @param {*} b - Second value to compare
 * @returns {boolean} True if strictly equal
 */
const deepEqualStrict = (a, b) => {
  // Strict equality check
  if (a === b) return true;

  // Handle null/undefined
  if (a == null || b == null) return false;

  // Type check
  if (typeof a !== typeof b) return false;

  // Array comparison
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqualStrict(item, b[index]));
  }

  // Object comparison
  if (typeof a === "object") {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    // Key count must match
    if (keysA.length !== keysB.length) return false;

    // Recursively compare each key
    return keysA.every((key) => deepEqualStrict(a[key], b[key]));
  }

  // Primitive comparison (should have been caught by a === b)
  return false;
};

/**
 * Find differences between two objects (for debugging)
 *
 * Returns an object showing which fields differ.
 * Useful for debugging change detection issues.
 *
 * @param {Object} original - Original object
 * @param {Object} current - Current object
 * @returns {Object} Object with keys that differ and their values
 */
export const findDifferences = (original, current) => {
  const differences = {};

  if (!original || !current) {
    return { error: 'One or both objects are null/undefined' };
  }

  // Normalize both objects first
  const normOriginal = normalizeObject(original);
  const normCurrent = normalizeObject(current);

  // Get all unique keys from both objects
  const allKeys = new Set([
    ...Object.keys(normOriginal),
    ...Object.keys(normCurrent)
  ]);

  // Check each key
  for (const key of allKeys) {
    const origValue = normOriginal[key];
    const currValue = normCurrent[key];

    // If values don't match, record the difference
    if (!deepEqualStrict(origValue, currValue)) {
      differences[key] = {
        original: origValue,
        current: currValue,
        type: `${typeof origValue} → ${typeof currValue}`
      };
    }
  }

  return differences;
};

/**
 * Check if an object has any differences from another (boolean result)
 *
 * Simpler version of findDifferences that just returns true/false.
 *
 * @param {Object} original - Original object
 * @param {Object} current - Current object
 * @returns {boolean} True if objects differ
 */
export const hasChanges = (original, current) => {
  // Use normalizeObject and deepEqualStrict instead of removed deepEqualNormalized
  const normOriginal = normalizeObject(original);
  const normCurrent = normalizeObject(current);
  return !deepEqualStrict(normOriginal, normCurrent);
};

/**
 * Create a deep clone with normalization
 *
 * Useful for creating normalized copies of data objects.
 *
 * @param {*} obj - Object to clone
 * @returns {*} Deep cloned and normalized object
 */
export const cloneNormalized = (obj) => {
  // Use JSON stringify/parse for deep clone, then normalize
  const cloned = JSON.parse(JSON.stringify(obj));
  return normalizeObject(cloned);
};

// Export all functions
// Note: normalizeValue and deepEqualNormalized removed to avoid duplicate export warning
// Use utils/normalizeData.js instead for those functions
export default {
  normalizeObject,
  findDifferences,
  hasChanges,
  cloneNormalized
};
