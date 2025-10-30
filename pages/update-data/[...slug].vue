<template>
  <div
    class="min-h-screen bg-grey-50 dark:bg-grey-900 text-grey-800 dark:text-grey-200 flex items-center justify-center p-4 sm:p-6 lg:p-8"
  >
    <div class="w-full max-w-5xl">
      <div class="grid grid-cols-1 md:grid-cols-2 items-center gap-8 md:gap-16">
        <!-- Left side - SVG Illustration -->
        <div class="flex justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="320"
            height="240"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="w-full max-w-sm h-auto text-grey-300 dark:text-grey-700"
          >
            <path
              d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"
            />
            <line x1="9.5" y1="12.5" x2="14.5" y2="17.5" />
            <line x1="14.5" y1="12.5" x2="9.5" y2="17.5" />
          </svg>
        </div>

        <!-- Right side - Content -->
        <div class="text-center md:text-left">
          <div
            class="inline-flex items-center gap-3 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-semibold px-3 py-1 rounded-full text-sm mb-4"
          >
            <span>Error 404</span>
          </div>

          <h1
            class="text-3xl sm:text-4xl font-bold text-grey-900 dark:text-white mb-4"
          >
            Halaman Tidak Ditemukan
          </h1>

          <p class="text-grey-600 dark:text-grey-400 mb-8 leading-relaxed">
            Konten yang Anda tuju tidak dapat diakses atau telah dipindahkan.
            <span
              class="block mt-2 font-mono text-primary bg-primary/10 px-2 py-1 rounded-md text-sm"
            >
              {{ attemptedPath }}
            </span>
          </p>

          <div
            class="flex flex-col sm:flex-row gap-3 justify-center md:justify-start mb-8"
          >
            <UiButton variant="primary" @click="goBack">
              <i class="pi pi-arrow-left mr-2"></i>
              Kembali
            </UiButton>
            <UiButton variant="secondary" @click="goToUpdateData">
              <i class="pi pi-home mr-2"></i>
              Halaman Update Data
            </UiButton>
          </div>
          </div>
        </div>
      </div>
    </div>
</template>

<script setup>
import UiButton from "~/components/ui/Button.vue";

// Import Lottie telah dihapus, tidak ada dependensi eksternal untuk visual.

// --- SEMUA LOGIKA ASLI ANDA TETAP DIPERTAHANKAN ---

const route = useRoute();
const attemptedPath = route.path;


useHead({
  title: "Halaman Tidak Ditemukan",
});

const suggestion = computed(() => {
  if (attemptedPath.includes("/history/")) {
    return {
      name: "History",
      path: "/update-data/history",
    };
  }
  if (attemptedPath.includes("/edit/")) {
    const segments = attemptedPath.split("/");
    const potentialId = segments[segments.length - 1];
    if (potentialId && potentialId !== "edit") {
      return {
        name: "Edit",
        path: `/update-data/edit/${potentialId}`,
      };
    }
  }
  return null;
});

const goToUpdateData = () => {
  navigateTo("/update-data");
};

const goToSuggestion = () => {
  if (suggestion.value) {
    navigateTo(suggestion.value.path);
  }
};

const goBack = () => {
  if (process.client && window.history.length > 1) {
    window.history.back();
  } else {
    navigateTo("/update-data");
  }
};
</script>

<style scoped>
/* Menambahkan sedikit style untuk keterbacaan pada path yang panjang */
.font-mono {
  word-break: break-all;
}
</style>
