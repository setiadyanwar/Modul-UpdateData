export default defineNuxtRouteMiddleware((to) => {
  // If visiting root or root with ticket, redirect immediately to /update-data
  if (to.path === '/') {
    const query = { ...to.query };
    // Preserve ticket if present
    return navigateTo({ path: '/update-data', query }, { redirectCode: 302 });
  }
});


