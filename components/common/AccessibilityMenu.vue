<template>
  <!-- Overlay untuk menutup menu saat klik di luar -->
  <div v-if="isOpen" @click="isOpen = false" class="fixed inset-0 z-40"></div>

  <div class="fixed bottom-8 right-8 z-50">
    <button
      @click="isOpen = !isOpen"
      class="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform"
      aria-label="Accessibility Menu"
    >
      <i class="pi pi-spin pi-cog text-lg"></i>
    </button>

    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        @click.stop
        class="absolute bottom-full right-0 mb-2 w-40 bg-background rounded-xl shadow-xl border border-grey-200 p-2 space-y-2"
      >
        <div>
          <p class="font-semibold text-text-main mb-1 text-xs">Mode</p>
          <div
            @click="
              colorMode.preference =
                colorMode.value === 'light' ? 'dark' : 'light'
            "
            class="w-full p-1 bg-grey-200 dark:bg-grey-700 rounded-md flex items-center cursor-pointer"
          >
            <div
              :class="[
                'w-1/2 p-1 text-center rounded-md transition-all duration-300',
                colorMode.value === 'light'
                  ? 'bg-primary text-white shadow'
                  : 'text-text-main',
              ]"
            >
              <i class="pi pi-sun text-xs"></i>
            </div>
            <div
              :class="[
                'w-1/2 p-1 text-center rounded-md transition-all duration-300',
                colorMode.value === 'dark'
                  ? 'bg-primary text-white shadow'
                  : 'text-text-main',
              ]"
            >
              <i class="pi pi-moon text-xs"></i>
            </div>
          </div>
        </div>

        <div>
          <p class="font-semibold text-text-main mb-1 text-xs">Text Size</p>
          <div
            class="flex items-center bg-grey-200 dark:bg-grey-700 rounded-md p-1"
          >
            <button
              @click="changeFontSize('increase')"
              class="p-1 w-1/2 rounded-md hover:bg-grey-300 dark:hover:bg-grey-600 text-xs"
            >
              A<sup>+</sup>
            </button>
            <button
              @click="changeFontSize('decrease')"
              class="p-1 w-1/2 rounded-md hover:bg-grey-300 dark:hover:bg-grey-600 text-xs"
            >
              A<sup>-</sup>
            </button>
          </div>
        </div>

        <div>
          <p class="font-semibold text-text-main mb-1 text-xs">Color</p>
          <div class="flex items-center justify-start gap-2">
            <button
              @click="setPrimaryColor('#004AAD')"
              class="w-5 h-5 rounded-full bg-[#004AAD] ring-2 ring-offset-2 ring-offset-background"
              :class="
                primaryColor === '#004AAD'
                  ? 'ring-blue-500'
                  : 'ring-transparent'
              "
            ></button>
            <button
              @click="setPrimaryColor('#D63B24')"
              class="w-5 h-5 rounded-full bg-[#D63B24] ring-2 ring-offset-2 ring-offset-background"
              :class="
                primaryColor === '#D63B24' ? 'ring-red-500' : 'ring-transparent'
              "
            ></button>
            <button
              @click="setPrimaryColor('#2E7E2E')"
              class="w-5 h-5 rounded-full bg-[#2E7E2E] ring-2 ring-offset-2 ring-offset-background"
              :class="
                primaryColor === '#2E7E2E'
                  ? 'ring-green-500'
                  : 'ring-transparent'
              "
            ></button>
            <button
              @click="setPrimaryColor('#9333ea')"
              class="w-5 h-5 rounded-full bg-[#9333ea] ring-2 ring-offset-2 ring-offset-background"
              :class="
                primaryColor === '#9333ea'
                  ? 'ring-purple-500'
                  : 'ring-transparent'
              "
            ></button>
          </div>
        </div>

        <hr class="border-grey-200 dark:border-grey-700 my-1" />

        <div>
          <button
            @click="resetSettings"
            class="w-full p-1 text-xs text-center rounded-md bg-grey-200 dark:bg-grey-700 hover:bg-grey-300 dark:hover:bg-grey-600 text-text-main"
          >
            Reset to Default
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";

// State lokal HANYA untuk membuka/menutup menu
const isOpen = ref(false);

// Memanggil composable global
const colorMode = useColorMode();
const nuxtApp = useNuxtApp();
const { primaryColor, setPrimaryColor, changeFontSize, resetSettings } =
  useAccessibility();

// Sinkronkan perubahan mode ke Host
watch(
  () => colorMode.value,
  (newMode) => {
    try {
      nuxtApp?.$postAccessibilityToHost?.({
        mode: newMode,
        primaryColor: primaryColor?.value,
        rootFontSize: undefined,
      });
    } catch {}
  }
);

// Handle ESC key untuk menutup menu
const handleKeydown = (event) => {
  if (event.key === "Escape" && isOpen.value) {
    isOpen.value = false;
  }
};

// Add/remove event listener
onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});
</script>
