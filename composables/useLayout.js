// composables/useLayout.js
import { ref, onMounted, onBeforeUnmount } from "vue";

// Global state untuk sidebar
const isSidebarCollapsed = ref(true); // Default to collapsed

export const useLayout = () => {
  const toggleSidebar = () => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
  };

  // Responsive: collapse sidebar on mobile, expand on desktop
  onMounted(() => {
    if (process.client) {
      // Set initial state based on window width
      const shouldCollapse = window.innerWidth < 1024; // Changed to 1024px for better mobile experience
      isSidebarCollapsed.value = shouldCollapse;

      const resizeHandler = () => {
        const newShouldCollapse = window.innerWidth < 1024; // Changed to 1024px
        isSidebarCollapsed.value = newShouldCollapse;
      };

      window.addEventListener("resize", resizeHandler);

      onBeforeUnmount(() => {
        window.removeEventListener("resize", resizeHandler);
      });
    }
  });

  return {
    isSidebarCollapsed,
    toggleSidebar,
  };
};
