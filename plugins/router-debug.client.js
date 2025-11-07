export default defineNuxtPlugin((nuxtApp) => {
  const router = nuxtApp.$router;

  if (router) {
    // Log setiap navigation
    router.beforeEach((to, from) => {
      console.log('');
      console.log('🧭 [ROUTER DEBUG] Navigation detected:');
      console.log('  From:', from.fullPath || 'INITIAL');
      console.log('  To:', to.fullPath);
      console.log('  localStorage.last_visited_route:', localStorage.getItem('last_visited_route') || 'NONE');
      return true; // Allow navigation
    });

    console.log('[Router Debug] ✅ Router debug plugin installed');
  }
});
