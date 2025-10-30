<template>
  <div class="fixed top-4 right-2 md:right-4 z-[9999] w-full max-w-xs sm:max-w-sm space-y-2 md:space-y-3 px-2 sm:px-0">
    <TransitionGroup name="toast" tag="div" class="relative space-y-3">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'flex items-center gap-4 p-4 rounded-lg shadow-md w-full',
          toastStyles[toast.type],
        ]"
      >
        <div class="flex-shrink-0">
          <i :class="toastIcons[toast.type]" class="text-xl"></i>
        </div>

        <div class="flex-1 min-w-0 text-sm">
          <p v-if="toast.title" class="font-semibold">
            {{ toast.title }}
          </p>
          <p>
            {{ toast.message }}
          </p>
        </div>

        <button
          @click="removeToast(toast.id)"
          class="flex-shrink-0 p-1.5 rounded-full hover:bg-black/10 transition-colors"
        >
          <i class="pi pi-times text-sm"></i>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { watch } from "vue";
import { useToast } from "~/composables/useToast";

const { toasts, removeToast } = useToast();

// Watch toasts changes for reactivity
watch(toasts, () => {
  // Force reactivity update
}, { deep: true, immediate: true });

// Objek styling disederhanakan: mengatur background dan warna teks/ikon sekaligus
const toastStyles = {
  success: "bg-emerald-50 text-emerald-700",
  error: "bg-red-50 text-red-700",
  warning: "bg-amber-50 text-amber-700",
  info: "bg-sky-50 text-sky-700",
};

// Objek ikon hanya berisi nama kelasnya, warna akan diwarisi dari parent
const toastIcons = {
  success: "pi pi-check-circle",
  error: "pi pi-times-circle",
  warning: "pi pi-exclamation-triangle",
  info: "pi pi-info-circle",
};
</script>

<style scoped>
/* Transisi geser dari kanan ke kiri (enter) dan ke kanan (leave) */
.toast-enter-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toast-leave-active {
  /* Menambahkan posisi absolute saat keluar agar toast lain tidak bergeser */
  position: absolute;
  width: 100%;
  transition: all 0.3s ease-in;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}

/* Animasi pulse pada ikon saat toast pertama kali muncul */
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* Terapkan animasi pulse ke ikon */
.toast-enter-active .pi {
  animation: pulse 0.5s ease-in-out;
}
</style>