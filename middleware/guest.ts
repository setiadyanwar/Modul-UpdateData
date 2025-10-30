// middleware/guest.ts
export default defineNuxtRouteMiddleware((to, from) => {
  // Hanya jalankan di client side
  if (process.client) {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("auth-token") ||
      localStorage.getItem("token");

    // Jika user sudah login dan mencoba akses login page, redirect ke root
    if (token) {
      return navigateTo("/", { replace: true });
    }
  }
});

