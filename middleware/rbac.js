import { defineNuxtRouteMiddleware, navigateTo } from '#app';
import { createError } from 'h3';

/**
 * RBAC Route Protection Middleware
 * Protects routes based on user permissions from JWT token
 *
 * Usage:
 * - Add 'rbac' to definePageMeta in pages
 * - Specify required permissions in meta.permissions array
 * - Or use meta.requireAdmin: true for admin-only routes
 *
 * Example in page:
 * definePageMeta({
 *   middleware: 'rbac',
 *   permissions: ['manage_consent', 'update_data_personal'], // Any of these
 *   requireAdmin: false // or true for admin-only
 * })
 */

export default defineNuxtRouteMiddleware((to) => {
  // Skip on server-side rendering
  if (process.server) return;

  // Get route meta
  const meta = to.meta;

  // Check if this route requires RBAC protection
  if (!meta.permissions && !meta.requireAdmin) {
    return; // No protection needed
  }

  // Get user permissions from JWT token OR localStorage
  const getUserPermissions = () => {
    try {
      const token = localStorage.getItem('access_token');

      // ✅ FIX: Try JWT token first, fallback to localStorage
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));

          // Check if token is expired
          const exp = payload.exp;
          const now = Math.floor(Date.now() / 1000);

          if (exp && exp > now) {
            // Token valid, use JWT permissions
            const jwtPermissions = payload.access || [];
            if (jwtPermissions.length > 0) {
              console.log('[RBAC] ✅ Using JWT permissions:', jwtPermissions);
              return jwtPermissions;
            }
          } else {
            console.warn('[RBAC] ⚠️ JWT token expired, falling back to localStorage');
          }
        } catch (jwtError) {
          console.warn('[RBAC] ⚠️ Failed to parse JWT, falling back to localStorage:', jwtError);
        }
      }

      // ✅ Fallback: Get permissions from localStorage (synced from ESSHost)
      const storedPermissions = localStorage.getItem('user_permissions');
      if (storedPermissions) {
        try {
          const permissions = JSON.parse(storedPermissions);
          // Extract permission codes from objects
          const permissionCodes = permissions.map(p => p.permission_code || p);
          console.log('[RBAC] ✅ Using localStorage permissions:', permissionCodes);
          return permissionCodes;
        } catch (storageError) {
          console.error('[RBAC] ❌ Failed to parse stored permissions:', storageError);
        }
      }

      console.warn('[RBAC] ⚠️ No permissions found in JWT or localStorage');
      return [];
    } catch (error) {
      console.error('[RBAC] ❌ Error getting user permissions:', error);
      return [];
    }
  };

  const userPermissions = getUserPermissions();

  // Check if user is authenticated
  if (userPermissions.length === 0) {
    // For iframe/remote app mode, request token from parent instead of redirecting to login
    if (process.client && window.parent !== window) {
      console.log('[Update-Data RBAC] No token found, requesting from parent');

      // ✅ FIX: Detect actual parent origin or use wildcard
      const getParentOrigin = () => {
        try {
          // Try to get referrer (works for same-origin or with proper CORS)
          if (document.referrer) {
            return new URL(document.referrer).origin;
          }
        } catch (e) {
          // Fallback
        }
        // Use wildcard for REQUEST_TOKEN (safe for requesting, not for sensitive data)
        return '*';
      };

      const parentOrigin = getParentOrigin();
      console.log('[Update-Data RBAC] Sending REQUEST_TOKEN to:', parentOrigin);

      // Request token from parent
      window.parent.postMessage({
        type: 'REQUEST_TOKEN',
        source: 'update-data',
        timestamp: Date.now()
      }, parentOrigin);

      // Allow navigation to continue - token handler will manage authentication
      // Show loading state while waiting for token
      return;
    }

    // If not in iframe mode, redirect to login (fallback for standalone mode)
    return navigateTo('/login', { replace: true });
  }

  // Check admin requirement
  if (meta.requireAdmin && !userPermissions.includes('rbac_admin')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. Admin privileges required.'
    });
  }

  // Check specific permissions
  if (meta.permissions && meta.permissions.length > 0) {
    const hasRequiredPermission = meta.permissions.some(permission =>
      userPermissions.includes(permission)
    );

    if (!hasRequiredPermission) {
      throw createError({
        statusCode: 403,
        statusMessage: `Access denied. Required permissions: ${meta.permissions.join(', ')}`
      });
    }
  }

  // Access granted - permissions verified
  if (process.dev) {
    // Debug logging disabled
  }
});