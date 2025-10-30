/**
 * Role-Based Access Control (RBAC) Composable
 * Manages user permissions and access control throughout the application
 *
 * Features:
 * - Permission checking for routes and components
 * - Role management integration
 * - JWT token-based access control
 * - Admin permission management
 *
 * @version 1.0.0
 * @author ESS Sigma Team
 */

import { ref, computed, watch } from 'vue';
import { useAuthenticationCore } from './useAuthenticationCore';
import { $fetch } from 'ofetch';
import envConfig from '~/config/environment.js';

// Global RBAC state
let rbacInstance = null;

// Permission constants - matching your backend response
const PERMISSIONS = {
  UPDATE_DATA_PERSONAL: 'update_data_personal',
  MANAGE_CONSENT: 'manage_consent',
  ATTACHMENT: 'attachment',
  EXPORT_PDF: 'export_pdf',
  REQUEST_HISTORY_AND_STATUS: 'request_history_and_status',
  RBAC_ADMIN: 'rbac_admin'
};

// Role to permissions mapping - only 2 roles: ADMIN_HC and Employee
export const ROLE_PERMISSIONS = {
  'ADMIN_HC': [
    PERMISSIONS.UPDATE_DATA_PERSONAL,
    PERMISSIONS.MANAGE_CONSENT,
    PERMISSIONS.ATTACHMENT,
    PERMISSIONS.EXPORT_PDF,
    PERMISSIONS.REQUEST_HISTORY_AND_STATUS
  ],
  'Employee': [
    PERMISSIONS.UPDATE_DATA_PERSONAL,
    PERMISSIONS.ATTACHMENT
  ]
};

// Route to permission mapping
const ROUTE_PERMISSIONS = {
  '/update-data/consent': [PERMISSIONS.MANAGE_CONSENT],
  '/update-data/history': [PERMISSIONS.REQUEST_HISTORY_AND_STATUS],
  '/rbac': [PERMISSIONS.RBAC_ADMIN],
  '/rbac/manage': [PERMISSIONS.RBAC_ADMIN],
};

export const useRBAC = () => {
  // Return existing instance if available (singleton pattern)
  if (rbacInstance) {
    return rbacInstance;
  }

  // Get authentication instance
  const auth = useAuthenticationCore();

  // Reactive state
  const userPermissions = ref([]);
  const isLoading = ref(false);
  const error = ref(null);

  // Extract permissions from JWT token
  const extractPermissionsFromToken = () => {
    if (process.server) return [];

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        return [];
      }

      // Parse JWT payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      const directPermissions = payload.access || [];
      const userRoles = payload.role || payload.roles || [];

      // JWT payload parsed

      // Convert roles to permissions
      const rolePermissions = [];
      if (Array.isArray(userRoles)) {
        userRoles.forEach(role => {
          // Try both exact match and case-insensitive match
          const exactMatch = ROLE_PERMISSIONS[role];
          const caseInsensitiveMatch = ROLE_PERMISSIONS[role?.toLowerCase()] || ROLE_PERMISSIONS[role?.toUpperCase()];
          const match = exactMatch || caseInsensitiveMatch;
          
          if (match) {
            // Role permissions found
            rolePermissions.push(...match);
          } else {
            // Unknown role
          }
        });
      } else if (typeof userRoles === 'string') {
        // Try both exact match and case-insensitive match
        const exactMatch = ROLE_PERMISSIONS[userRoles];
        const caseInsensitiveMatch = ROLE_PERMISSIONS[userRoles?.toLowerCase()] || ROLE_PERMISSIONS[userRoles?.toUpperCase()];
        const match = exactMatch || caseInsensitiveMatch;
        
        if (match) {
          rolePermissions.push(...match);
        } else {
          // Unknown single role
        }
      }
      
      // Combine direct permissions and role-based permissions, remove duplicates
      const allPermissions = [...new Set([...directPermissions, ...rolePermissions])];

      // All permissions combined

      return allPermissions;
    } catch (error) {
      // Token parsing error
      return [];
    }
  };

  // Force update permissions - can be called externally
  const forceUpdatePermissions = () => {
    const newPermissions = extractPermissionsFromToken();
    userPermissions.value = newPermissions;

    // Permissions updated
  };

  // Update permissions when user authentication changes
  const updatePermissions = () => {
    const permissions = extractPermissionsFromToken();
    userPermissions.value = permissions;

    // Permissions refreshed
  };

  // Watch for authentication changes
  watch(() => auth.isAuthenticated.value, (isAuthenticated) => {
    if (isAuthenticated) {
      updatePermissions();
    } else {
      userPermissions.value = [];
    }
  }, { immediate: true });

  // Watch for user changes (token refresh)
  watch(() => auth.user.value, () => {
    if (auth.isAuthenticated.value) {
      updatePermissions();
    }
  });

  // Watch for localStorage changes (token updates)
  if (process.client) {
    window.addEventListener('storage', (e) => {
      if (e.key === 'access_token') {
        updatePermissions();
      }
    });

    // Also listen for custom events from auth system
    window.addEventListener('user-login', () => {
      setTimeout(() => {
        updatePermissions();
      }, 100); // Small delay to ensure token is saved
    });

    window.addEventListener('user-logout', () => {
      userPermissions.value = [];
    });
  }

  // Computed properties
  const hasAnyPermission = computed(() => userPermissions.value.length > 0);

  const isAdmin = computed(() =>
    userPermissions.value.includes(PERMISSIONS.RBAC_ADMIN)
  );

  const canManageConsent = computed(() =>
    userPermissions.value.includes(PERMISSIONS.MANAGE_CONSENT)
  );

  const canUpdatePersonalData = computed(() =>
    userPermissions.value.includes(PERMISSIONS.UPDATE_DATA_PERSONAL)
  );

  const canViewHistory = computed(() =>
    userPermissions.value.includes(PERMISSIONS.REQUEST_HISTORY_AND_STATUS)
  );

  const canAttachFiles = computed(() =>
    userPermissions.value.includes(PERMISSIONS.ATTACHMENT)
  );

  const canExportPDF = computed(() =>
    userPermissions.value.includes(PERMISSIONS.EXPORT_PDF)
  );

  // Core permission checking functions

  /**
   * Check if user has a specific permission
   * @param {string} permission - Permission code to check
   * @returns {boolean}
   */
  const hasPermission = (permission) => {
    const hasAccess = userPermissions.value.includes(permission);

    // Permission check result
    return hasAccess;
  };

  const hasPermissionFeature = (permission) => {
    const userPermissions = localStorage.getItem('user_permissions');
    
    try {
      if (!userPermissions) {
        return false;
      }
      
      const userPermissionsArray = JSON.parse(userPermissions);
      const userPermissionsCode = userPermissionsArray.map(item => item.permission_code);
      const hasAccess = userPermissionsCode.includes(permission);
      
      return hasAccess;
    } catch (error) {
      // Error handling for localStorage parsing
      return false;
    }
  };

  /**
   * Check if user has any of the specified permissions
   * @param {string[]} permissions - Array of permission codes
   * @returns {boolean}
   */
  const hasAnyOfPermissions = (permissions) => {
    return permissions.some(permission => hasPermission(permission));
  };

  /**
   * Check if user has all specified permissions
   * @param {string[]} permissions - Array of permission codes
   * @returns {boolean}
   */
  const hasAllPermissions = (permissions) => {
    return permissions.every(permission => hasPermission(permission));
  };

  /**
   * Check if user can access a specific route
   * @param {string} route - Route path to check
   * @returns {boolean}
   */
  const canAccessRoute = (route) => {
    const requiredPermissions = ROUTE_PERMISSIONS[route];
    if (!requiredPermissions) {
      return true; // No permissions required for this route
    }
    return hasAnyOfPermissions(requiredPermissions);
  };

  // API functions for RBAC management (admin only)

  /**
   * Fetch all available permissions
   * @returns {Promise<Object>}
   */
  const fetchPermissions = async () => {
    if (!hasPermission(PERMISSIONS.RBAC_ADMIN)) {
      throw new Error('Insufficient permissions to fetch permissions');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const token = await auth.getValidAccessToken();
      if (!token) throw new Error('No valid token available');

      const response = await $fetch('/api/proxy/permissions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Fetch all users
   * @returns {Promise<Object>}
   */
  const fetchAllUsers = async (params = { offset: 0, limit: 50 }) => {
    if (!hasPermission(PERMISSIONS.RBAC_ADMIN)) {
      throw new Error('Insufficient permissions to fetch users');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const token = await auth.getValidAccessToken();
      if (!token) throw new Error('No valid token available');

      // Remove null/undefined/empty string params to prevent sending blank query keys
      const cleanParams = Object.entries(params || {}).reduce((acc, [key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await $fetch('/api/proxy/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        query: cleanParams
      });

      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Fetch user detail by ID
   * @param {string|number} userId
   * @returns {Promise<Object>}
   */
  const fetchUserDetail = async (userId) => {
    if (!hasPermission(PERMISSIONS.RBAC_ADMIN)) {
      throw new Error('Insufficient permissions to fetch user detail');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const token = await auth.getValidAccessToken();
      if (!token) throw new Error('No valid token available');

      const response = await $fetch(`/api/proxy/user/${parseInt(userId, 10)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Update user roles (batch)
   * @param {string|number} userId
   * @param {Array<{role_id:number, role_name:string}>} roles
   * @returns {Promise<Object>}
   */
  const updateUserRolesBatch = async (userId, roles) => {
    if (!hasPermission(PERMISSIONS.RBAC_ADMIN)) {
      throw new Error('Insufficient permissions to update user roles');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const token = await auth.getValidAccessToken();
      if (!token) throw new Error('No valid token available');

      const response = await $fetch(`/api/proxy/user/${parseInt(userId, 10)}/roles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: roles
      });

      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Create a new permission
   */
  const createPermission = async (payload) => {
    if (!hasPermission(PERMISSIONS.RBAC_ADMIN)) {
      throw new Error('Insufficient permissions to create permission');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const token = await auth.getValidAccessToken();
      if (!token) throw new Error('No valid token available');

      const response = await $fetch('/api/proxy/permissions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: payload
      });

      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Update a permission
   */
  const updatePermission = async (permissionId, payload) => {
    if (!hasPermission(PERMISSIONS.RBAC_ADMIN)) {
      throw new Error('Insufficient permissions to update permission');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const token = await auth.getValidAccessToken();
      if (!token) throw new Error('No valid token available');

      const response = await $fetch(`/api/proxy/permission/${permissionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: payload
      });

      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Delete a permission
   */
  const deletePermission = async (permissionId) => {
    if (!hasPermission(PERMISSIONS.RBAC_ADMIN)) {
      throw new Error('Insufficient permissions to delete permission');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const token = await auth.getValidAccessToken();
      if (!token) throw new Error('No valid token available');

      const response = await $fetch(`/api/proxy/permission/${permissionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Fetch all roles
   * @returns {Promise<Object>}
   */
  const fetchRoles = async () => {
    if (!hasPermission(PERMISSIONS.RBAC_ADMIN)) {
      throw new Error('Insufficient permissions to fetch roles');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const token = await auth.getValidAccessToken();
      if (!token) throw new Error('No valid token available');

      const response = await $fetch('/api/proxy/roles', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Create a new role
   */
  const createRole = async (payload) => {
    if (!hasPermission(PERMISSIONS.RBAC_ADMIN)) {
      throw new Error('Insufficient permissions to create role');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const token = await auth.getValidAccessToken();
      if (!token) throw new Error('No valid token available');

      const response = await $fetch('/api/proxy/roles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: payload
      });

      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Update a role
   */
  const updateRole = async (roleId, payload) => {
    if (!hasPermission(PERMISSIONS.RBAC_ADMIN)) {
      throw new Error('Insufficient permissions to update role');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const token = await auth.getValidAccessToken();
      if (!token) throw new Error('No valid token available');

      const response = await $fetch(`/api/proxy/role/${roleId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: payload
      });

      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Delete a role
   */
  const deleteRole = async (roleId) => {
    if (!hasPermission(PERMISSIONS.RBAC_ADMIN)) {
      throw new Error('Insufficient permissions to delete role');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const token = await auth.getValidAccessToken();
      if (!token) throw new Error('No valid token available');

      const response = await $fetch(`/api/proxy/role/${roleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Fetch permissions for a specific role
   * @param {string|number} roleId - Role ID
   * @returns {Promise<Object>}
   */
  const fetchRolePermissions = async (roleId) => {
    if (!hasPermission(PERMISSIONS.RBAC_ADMIN)) {
      throw new Error('Insufficient permissions to fetch role permissions');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const token = await auth.getValidAccessToken();
      if (!token) throw new Error('No valid token available');

      const response = await $fetch(`/api/proxy/role/${roleId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Fetch user roles
   * @param {string|number} userId - User ID
   * @returns {Promise<Object>}
   */
  const fetchUserRoles = async (userId) => {
    if (!hasPermission(PERMISSIONS.RBAC_ADMIN)) {
      throw new Error('Insufficient permissions to fetch user roles');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const token = await auth.getValidAccessToken();
      if (!token) throw new Error('No valid token available');

      const response = await $fetch(`/api/proxy/users/${parseInt(userId, 10)}/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Assign role to user
   * @param {string|number} userId - User ID
   * @param {string|number} roleId - Role ID
   * @returns {Promise<Object>}
   */
  const assignUserRole = async (userId, roleId) => {
    if (!hasPermission(PERMISSIONS.RBAC_ADMIN)) {
      throw new Error('Insufficient permissions to assign user roles');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const token = await auth.getValidAccessToken();
      if (!token) throw new Error('No valid token available');

      // Assigning role API call

      const response = await $fetch(`/api/proxy/users/${parseInt(userId, 10)}/roles/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: {
          role_id: parseInt(roleId, 10) // Ensure it's an integer
        }
      });

      // Role assignment successful
      return response;
    } catch (err) {
      // Role assignment failed
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Remove role from user
   * @param {string|number} userId - User ID
   * @param {string|number} roleId - Role ID
   * @returns {Promise<Object>}
   */
  const removeUserRole = async (userId, roleId) => {
    if (!hasPermission(PERMISSIONS.RBAC_ADMIN)) {
      throw new Error('Insufficient permissions to remove user roles');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const token = await auth.getValidAccessToken();
      if (!token) throw new Error('No valid token available');

      const response = await $fetch(`/api/proxy/users/${parseInt(userId, 10)}/roles/${parseInt(roleId, 10)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Add permission to role
   * @param {string|number} roleId - Role ID
   * @param {string|number} permissionId - Permission ID
   * @returns {Promise<Object>}
   */
  const addRolePermission = async (roleId, permissions) => {
    if (!hasPermission(PERMISSIONS.RBAC_ADMIN)) {
      throw new Error('Insufficient permissions to add role permissions');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const token = await auth.getValidAccessToken();
      if (!token) throw new Error('No valid token available');

      const response = await $fetch(`/api/proxy/role/${roleId}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: permissions
      });

      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Remove permission from role
   * @param {string|number} roleId - Role ID
   * @param {string|number} permissionId - Permission ID
   * @returns {Promise<Object>}
   */
  const removeRolePermission = async (roleId, permissions) => {
    if (!hasPermission(PERMISSIONS.RBAC_ADMIN)) {
      throw new Error('Insufficient permissions to remove role permissions');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const token = await auth.getValidAccessToken();
      if (!token) throw new Error('No valid token available');

      const response = await $fetch(`/api/proxy/role/${roleId}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: permissions
      });

      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Get user roles by user ID (this will also validate if user exists)
   * @param {string|number} userId - User ID to check
   * @returns {Promise<Object>}
   */
  const validateAndGetUser = async (userId) => {
    if (!hasPermission(PERMISSIONS.RBAC_ADMIN)) {
      throw new Error('Insufficient permissions to access user data');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const token = await auth.getValidAccessToken();
      if (!token) throw new Error('No valid token available');

      // Try to get user roles - this will validate if user exists
      const response = await $fetch(`/api/proxy/users/${parseInt(userId, 10)}/roles`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Refresh user permissions (force backend to regenerate JWT with latest roles)
   * @param {string|number} userId - User ID to refresh
   * @returns {Promise<Object>}
   */
  const refreshUserPermissions = async (userId) => {
    if (!hasPermission(PERMISSIONS.RBAC_ADMIN)) {
      throw new Error('Insufficient permissions to refresh user permissions');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const token = await auth.getValidAccessToken();
      if (!token) throw new Error('No valid token available');

      // Refreshing user permissions

      // Try endpoint for refreshing user session/permissions
      const response = await $fetch(`/api/proxy/users/${parseInt(userId, 10)}/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Refresh permissions successful
      return response;
    } catch (err) {
      // Refresh permissions failed
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Initialize permissions on client
  if (process.client) {
    updatePermissions();
  }

  // Create RBAC instance
  rbacInstance = {
    // State
    userPermissions: computed(() => userPermissions.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),

    // Computed permissions
    hasAnyPermission,
    isAdmin,
    canManageConsent,
    canUpdatePersonalData,
    canViewHistory,
    canAttachFiles,
    canExportPDF,

    // Core functions
    hasPermission,
    hasPermissionFeature,
    hasAnyOfPermissions,
    hasAllPermissions,
    canAccessRoute,
    updatePermissions,
    forceUpdatePermissions,

    // API functions
    fetchPermissions,
    createPermission,
    updatePermission,
    deletePermission,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
    fetchRolePermissions,
    fetchUserRoles,
    fetchAllUsers,
    fetchUserDetail,
    updateUserRolesBatch,
    assignUserRole,
    removeUserRole,
    addRolePermission,
    removeRolePermission,
    validateAndGetUser,
    refreshUserPermissions,

    // Constants
    PERMISSIONS
  };

  return rbacInstance;
};