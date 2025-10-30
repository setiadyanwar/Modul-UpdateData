/**
 * Update Data Navigation Plugin
 * Menangani reset cache saat navigasi antar halaman update-data
 */
import { defineNuxtPlugin, useRouter } from '#app';
import { useTabManagement } from '~/composables/useTabManagement';

export default defineNuxtPlugin(() => {
  // Hanya berjalan di client side
  if (process.server) return;

  const router = useRouter();
  const tabManagement = useTabManagement();

  // Pantau perubahan rute
  router.beforeEach((to, from) => {
    // Reset cache saat navigasi dari history ke update-data
    if (from.path.includes('/update-data/history') && to.path === '/update-data') {
      // Reset cache untuk memastikan data terbaru dimuat
      tabManagement.resetChangeRequestsCache();
      
      // Log untuk debugging
      if (process.dev) {
        console.log('[update-data-navigation] Cache reset karena navigasi dari history ke update-data');
      }
    }
  });
});