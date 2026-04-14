import { logger } from '~/utils/logger';
import { apiService } from '~/axios/api.client';

export const useUserProfile = (user, isLoading) => {
  
  // 🔒 Prevent duplicate profile fetches - only one in-flight at a time
  let inFlightPromise = null;
  
  // Resolve user permissions based on roles
  const resolvePermissions = (profile) => {
    try {
      const roles = profile?.roles || [];
      const permissions = new Set();
      
      roles.forEach(role => {
        if (role.permissions) {
          role.permissions.forEach(p => permissions.add(p.name || p));
        }
      });
      
      return Array.from(permissions);
    } catch (error) {
      logger.authError('PERMISSION_RESOLUTION_FAILED', error);
      return [];
    }
  };

  // Fetch complete user profile from API
  const fetchUserProfile = async () => {
    if (process.server) return null;

    // 🔒 If a fetch is already in-flight, wait for it instead of starting a new one
    if (inFlightPromise) {
      return inFlightPromise;
    }

    // Create the fetch promise
    inFlightPromise = (async () => {
      isLoading.value = true;
      const startTime = Date.now();
      const timeoutId = setTimeout(() => {
        if (isLoading.value) {
          isLoading.value = false;
        }
      }, 8000); // 8 second timeout

      try {
        // Use apiService (axios) which handles auth header and proxy properly
        const response = await apiService.get('/auth/profile');

        // Handle axios response structure (data is in response.data)
        let profileData = null;
        const responseData = response.data || response;

        // Format 1: { data: { user: { ...profile } } } - ESS Backend format
        if (responseData?.data?.user && typeof responseData.data.user === 'object') {
          profileData = responseData.data.user;
        }
        // Format 2: { data: { ...profile } }
        else if (responseData?.data && typeof responseData.data === 'object' && !responseData.data.user) {
          profileData = responseData.data;
        }
        // Format 3: { status, data: { ...profile } }
        else if (responseData?.status && responseData?.data) {
          profileData = responseData.data.user || responseData.data;
        }
        // Format 4: Direct profile object { email, employee_name, ... }
        else if (responseData && typeof responseData === 'object' && !Array.isArray(responseData)) {
          profileData = responseData;
        }

        if (profileData && typeof profileData === 'object') {
          const permissions = resolvePermissions(profileData);
          
          user.value = {
            ...profileData,
            mappedPermissions: permissions
          };

          logger.authEvent('PROFILE_FETCHED_SUCCESS', {
            userId: profileData.id || profileData.user_id,
            username: profileData.email || profileData.employee_name
          });

          // ✅ Save FULL PROFILE to localStorage as backup
          if (typeof window !== 'undefined') {
            localStorage.setItem('user_profile', JSON.stringify(user.value));
          }

          // ✅ Save roles from profile if available
          if (profileData.roles && Array.isArray(profileData.roles)) {
            localStorage.setItem('user_roles', JSON.stringify(profileData.roles));
            // Dispatch event so useUserRoles listener picks it up
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('user-roles-saved'));
            }
          }

          return user.value;
        } else {
          logger.authError('PROFILE_FETCH_FAILED', new Error('Invalid response format: no profile data found'));
          return null;
        }
      } catch (error) {
        logger.authError('PROFILE_FETCH_FAILED', error);
        return null;
      } finally {
        clearTimeout(timeoutId);
        isLoading.value = false;
        inFlightPromise = null; // Clear the in-flight promise
      }
    })();

    return inFlightPromise;
  };

  return {
    fetchUserProfile,
    resolvePermissions
  };
};
