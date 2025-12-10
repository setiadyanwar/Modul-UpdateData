/**
 * Centralized User Storage Utility
 * Single source of truth for user data persistence
 *
 * Benefits:
 * - DRY principle (no code duplication)
 * - Consistent data format
 * - Built-in validation
 * - Easy to add encryption/compression later
 * - Single point for debugging
 *
 * @version 1.0.0
 */

// Storage keys (with prefix for namespace isolation)
const STORAGE_KEYS = {
  USER: 'user',
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_ROLES: 'user_roles',
  USER_PERMISSIONS: 'user_permissions',
  TOKEN_EXPIRY: 'token_expiry',
  LAST_TICKET: 'last_processed_ticket',
  LAST_ROUTE: 'last_visited_route'
};

/**
 * Validate and normalize user data structure
 * Ensures consistent data format across the app
 *
 * @param {Object} data - Raw user data from backend
 * @returns {Object|null} Normalized user data or null if invalid
 */
function validateUserData(data) {
  // Null/undefined check
  if (!data || typeof data !== 'object') {
    return null;
  }

  // Required fields check - accept multiple possible ID keys
  const normalizedId = data.user_id || data.employee_id || data.id || data.userId || data.employeeId;
  if (!normalizedId) {
    console.warn('[UserStorage] User data missing required ID fields');
    return null;
  }

  // Normalize structure - ensure all expected fields exist with fallbacks
  return {
    // IDs (ensure both exist)
    user_id: data.user_id || data.employee_id || data.id || data.userId || data.employeeId,
    employee_id: data.employee_id || data.user_id || data.id || data.userId || data.employeeId,

    // Basic info
    employee_name: data.employee_name || data.name || '',
    name: data.name || data.employee_name || '',
    email: data.email || '',
    nik: data.nik || '',

    // Company info
    company_code: data.company_code || data.company || '',
    company: data.company || data.company_code || '',
    company_address: data.company_address || '',

    // Contact
    phone_number: data.phone_number || '',

    // Photo
    photo: data.photo || data.photo_profile_ess || '',
    photo_profile_ess: data.photo_profile_ess || data.photo || '',

    // Position info
    employee_level: data.employee_level || '',
    employee_position: data.employee_position || '',
    unit: data.unit || '',
    organization: data.organization || '',

    // Supervisor
    spv_id: data.spv_id || '',
    spv_name: data.spv_name || '',

    // Auth info
    authenticator: data.authenticator || data.source || '',
    source: data.source || data.authenticator || '',

    // Keep any additional fields from backend (for forward compatibility)
    ...data
  };
}

/**
 * User Storage Class
 * Centralized methods for user data operations
 */
class UserStorage {
  /**
   * Save user data to localStorage
   *
   * @param {Object} userData - User data to save
   * @returns {boolean} Success status
   *
   * @example
   * UserStorage.saveUser({ user_id: '123', employee_name: 'John' })
   */
  static saveUser(userData) {
    try {
      // Validate and normalize
      const validated = validateUserData(userData);
      if (!validated) {
        console.error('[UserStorage] Failed to validate user data');
        return false;
      }

      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(validated));

      // Trigger custom event for cross-component reactivity
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('user-data-saved', {
          detail: validated
        }));
      }

      return true;
    } catch (error) {
      console.error('[UserStorage] Failed to save user:', error);
      return false;
    }
  }

  /**
   * Get user data from localStorage
   *
   * @returns {Object|null} User data or null if not found/invalid
   *
   * @example
   * const user = UserStorage.getUser()
   * if (user) console.log(user.employee_name)
   */
  static getUser() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER);
      if (!stored || stored === 'null' || stored === 'undefined') {
        return null;
      }

      const parsed = JSON.parse(stored);

      // Validate on retrieval (in case data was corrupted)
      return validateUserData(parsed);
    } catch (error) {
      console.error('[UserStorage] Failed to get user:', error);
      return null;
    }
  }

  /**
   * Update specific user fields (merge with existing)
   *
   * @param {Object} updates - Fields to update
   * @returns {boolean} Success status
   *
   * @example
   * UserStorage.updateUser({ phone_number: '08123456789' })
   */
  static updateUser(updates) {
    const current = this.getUser();
    if (!current) {
      console.warn('[UserStorage] No existing user data to update');
      return false;
    }

    const merged = { ...current, ...updates };
    return this.saveUser(merged);
  }

  /**
   * Remove user data from localStorage
   */
  static removeUser() {
    localStorage.removeItem(STORAGE_KEYS.USER);
  }

  /**
   * Check if user data exists
   *
   * @returns {boolean}
   */
  static hasUser() {
    const user = this.getUser();
    return user !== null;
  }

  /**
   * Save user roles (normalized format)
   *
   * @param {Array} roles - User roles array
   * @returns {boolean} Success status
   */
  static saveRoles(roles) {
    try {
      const normalized = Array.isArray(roles) ? roles : [];
      localStorage.setItem(STORAGE_KEYS.USER_ROLES, JSON.stringify(normalized));

      // ✅ Trigger custom event for reactive updates (fixes roles not showing on first load)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('user-roles-saved', {
          detail: normalized
        }));
      }

      return true;
    } catch (error) {
      console.error('[UserStorage] Failed to save roles:', error);
      return false;
    }
  }

  /**
   * Get user roles
   *
   * @returns {Array} User roles array (empty if not found)
   */
  static getRoles() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_ROLES);
      if (!stored || stored === 'null' || stored === 'undefined') {
        return [];
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error('[UserStorage] Failed to get roles:', error);
      return [];
    }
  }

  /**
   * Save user permissions (normalized format)
   *
   * @param {Array} permissions - User permissions array
   * @returns {boolean} Success status
   */
  static savePermissions(permissions) {
    try {
      const normalized = Array.isArray(permissions) ? permissions : [];
      localStorage.setItem(STORAGE_KEYS.USER_PERMISSIONS, JSON.stringify(normalized));
      return true;
    } catch (error) {
      console.error('[UserStorage] Failed to save permissions:', error);
      return false;
    }
  }

  /**
   * Get user permissions
   *
   * @returns {Array} User permissions array (empty if not found)
   */
  static getPermissions() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_PERMISSIONS);
      if (!stored || stored === 'null' || stored === 'undefined') {
        return [];
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error('[UserStorage] Failed to get permissions:', error);
      return [];
    }
  }

  /**
   * Clear all user-related data from localStorage
   * Use on logout
   */
  static clearAll() {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  /**
   * Get storage size (for debugging)
   *
   * @returns {Object} Size info
   */
  static getStorageInfo() {
    try {
      const user = localStorage.getItem(STORAGE_KEYS.USER) || '';
      const roles = localStorage.getItem(STORAGE_KEYS.USER_ROLES) || '';
      const permissions = localStorage.getItem(STORAGE_KEYS.USER_PERMISSIONS) || '';

      return {
        userSize: new Blob([user]).size,
        rolesSize: new Blob([roles]).size,
        permissionsSize: new Blob([permissions]).size,
        totalSize: new Blob([user + roles + permissions]).size
      };
    } catch (error) {
      return null;
    }
  }
}

// Export as default for cleaner imports
export default UserStorage;

// Also export keys for direct access if needed
export { STORAGE_KEYS, validateUserData };
