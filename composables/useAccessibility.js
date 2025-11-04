import { ref, onMounted, watch } from "vue";

// Definisikan nilai default sebagai konstanta agar mudah diubah
const DEFAULT_COLOR = "#004AAD";
const DEFAULT_FONT_SIZE = 16; // dalam piksel

// State yang akan dibagikan ke seluruh aplikasi
const primaryColor = ref(DEFAULT_COLOR);
const rootFontSize = ref(DEFAULT_FONT_SIZE);

// Simple color mode implementation
const colorMode = ref('light');

export const useAccessibility = () => {
  const nuxtApp = useNuxtApp?.();

  const setPrimaryColor = (color) => {
    primaryColor.value = color;
    // Terapkan ke CSS Variable
    if (process.client) {
      document.documentElement.style.setProperty("--color-primary-500", color);
    }
    // Kirim ke host
    try {
      nuxtApp?.$postAccessibilityToHost?.({
        mode: undefined,
        primaryColor: color,
        rootFontSize: rootFontSize.value,
      });
    } catch {}
  };

  const changeFontSize = (direction) => {
    if (process.client) {
      if (direction === "increase" && rootFontSize.value < 20) {
        rootFontSize.value++;
      } else if (direction === "decrease" && rootFontSize.value > 14) {
        rootFontSize.value--;
      }
      document.documentElement.style.fontSize = `${rootFontSize.value}px`;
    }
    // Kirim ke host
    try {
      nuxtApp?.$postAccessibilityToHost?.({
        mode: undefined,
        primaryColor: primaryColor.value,
        rootFontSize: rootFontSize.value,
      });
    } catch {}
  };

  // Setter eksplisit untuk root font size (dipakai saat menerima postMessage)
  const setRootFontSize = (sizePx) => {
    if (!Number.isFinite(sizePx)) return;
    rootFontSize.value = sizePx;
    if (process.client) {
      document.documentElement.style.fontSize = `${rootFontSize.value}px`;
      localStorage.setItem("root-font-size", String(rootFontSize.value));
    }
    try {
      nuxtApp?.$postAccessibilityToHost?.({
        mode: undefined,
        primaryColor: primaryColor.value,
        rootFontSize: rootFontSize.value,
      });
    } catch {}
  };

  // Setter eksplisit untuk mode (light/dark) agar reactive state ikut berubah
  const setMode = (mode) => {
    if (mode !== 'light' && mode !== 'dark') return;
    // colorMode di-provide Nuxt Color Mode via useColorMode() pada komponen,
    // namun kita simpan mirror state sederhana di ref colorMode untuk sinkronisasi.
    try {
      // Jika tersedia colorMode Nuxt di global, gunakan preference
      if (typeof useColorMode === 'function') {
        const cm = useColorMode();
        cm.preference = mode;
      }
    } catch {}
    colorMode.value = mode;
    try {
      nuxtApp?.$postAccessibilityToHost?.({
        mode,
        primaryColor: primaryColor.value,
        rootFontSize: rootFontSize.value,
      });
    } catch {}
  };

  // --- FUNGSI BARU UNTUK RESET ---
  const resetSettings = () => {
    // Reset warna primer ke default
    setPrimaryColor(DEFAULT_COLOR);
    // Reset ukuran font ke default
    rootFontSize.value = DEFAULT_FONT_SIZE;
    if (process.client) {
      document.documentElement.style.fontSize = `${DEFAULT_FONT_SIZE}px`;
    }
    // Reset mode terang/gelap ke default ('light')
    colorMode.preference = "light";
    try {
      nuxtApp?.$postAccessibilityToHost?.({
        mode: 'light',
        primaryColor: DEFAULT_COLOR,
        rootFontSize: DEFAULT_FONT_SIZE,
      });
    } catch {}
  };

  // Watcher untuk menyimpan preferensi ke localStorage
  watch(primaryColor, (newColor) => {
    if (process.client) {
      localStorage.setItem("primary-color", newColor);
    }
  });

  watch(rootFontSize, (newSize) => {
    if (process.client) {
      localStorage.setItem("root-font-size", newSize);
    }
  });

  // Saat komponen pertama kali dimuat, cek preferensi dari localStorage
  onMounted(() => {
    if (process.client) {
      const savedColor = localStorage.getItem("primary-color");
      setPrimaryColor(savedColor || DEFAULT_COLOR);

      const savedFontSize = localStorage.getItem("root-font-size");
      rootFontSize.value = savedFontSize
        ? parseInt(savedFontSize, 10)
        : DEFAULT_FONT_SIZE;
      document.documentElement.style.fontSize = `${rootFontSize.value}px`;
    }
  });

  return {
    primaryColor,
    rootFontSize,
    setPrimaryColor,
    changeFontSize,
    resetSettings,
    colorMode, // tambahkan agar bisa diakses dari komponen
    setRootFontSize,
    setMode,
  };
};
