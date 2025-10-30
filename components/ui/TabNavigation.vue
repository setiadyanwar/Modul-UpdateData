<template>
  <div class="relative mb-4 md:mb-6">
    <!-- Left Fade Overlay -->
    <div 
      v-show="showLeftFade"
      class="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white dark:from-grey-900 via-white/80 dark:via-grey-900/80 to-transparent z-10 pointer-events-none transition-opacity duration-300"
    ></div>
    
    <!-- Right Fade Overlay -->
    <div 
      v-show="showRightFade"
      class="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white dark:from-grey-900 via-white/80 dark:via-grey-900/80 to-transparent z-10 pointer-events-none transition-opacity duration-300"
    ></div>
    
    <!-- Scroll Container -->
    <div 
      ref="scrollContainer"
      class="overflow-x-auto scroll-smooth scrollbar-hide relative"
      @scroll="handleScroll"
    >
      <nav class="flex items-center min-w-max px-2">
        <template v-for="(tab, index) in tabs" :key="tab.id">
          <button
            @click="emit('update:activeTab', tab.id)"
            :class="[
              'flex items-center space-x-1 md:space-x-2 py-1.5 md:py-2 px-3 md:px-4 rounded-md font-medium text-xs md:text-sm transition-colors duration-200 whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-primary-50 text-primary dark:bg-primary-800/50 dark:text-white hover:bg-primary-50 dark:hover:bg-primary-800/50'
                : 'text-grey-600 dark:text-grey-400 hover:bg-grey-100 dark:hover:bg-grey-800 hover:text-grey-800 dark:hover:text-grey-300',
            ]"
          >
            <i v-if="tab.icon" :class="[tab.icon, 'text-sm md:text-base']"></i>
            <span>{{ tab.label }}</span>
          </button>

          <div
            v-if="index < tabs.length - 1"
            class="w-px h-5 bg-grey-200 dark:bg-grey-700 mx-1"
          ></div>
        </template>
      </nav>
    </div>
    
    <!-- Scroll Hint -->
    <div 
      v-show="showScrollHint"
      class="absolute bottom-2 z-30 right-2 gap-1 animate-pulse text-xs text-white bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md shadow-lg"
    >
      <i class="pi pi-arrow-right"> swipe</i>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';

const props = defineProps({
  tabs: {
    type: Array,
    required: true,
    validator: (tabs) => {
      return tabs.every(
        (tab) =>
          tab.hasOwnProperty("id") &&
          tab.hasOwnProperty("label") &&
          tab.hasOwnProperty("icon")
      );
    },
  },
  activeTab: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["update:activeTab"]);

// Reactive state for fade effects
const showLeftFade = ref(false);
const showRightFade = ref(false);
const showScrollHint = ref(false);
const scrollContainer = ref(null);

// Check if scrolling is needed and update fade states
const updateFadeStates = () => {
  if (!scrollContainer.value) return;
  
  const { scrollLeft, scrollWidth, clientWidth } = scrollContainer.value;
  
  // Show left fade if scrolled to the right
  showLeftFade.value = scrollLeft > 0;
  
  // Show right fade if there's more content to scroll to
  showRightFade.value = scrollLeft < scrollWidth - clientWidth - 1;
  
  // Show scroll hint if content overflows
  showScrollHint.value = scrollWidth > clientWidth;
};

// Handle scroll events
const handleScroll = () => {
  updateFadeStates();
};

// Update fade states when component mounts or tabs change
const updateFadeStatesDelayed = async () => {
  await nextTick();
  updateFadeStates();
};

// Debounced scroll handler
let scrollTimeout;
const debouncedScrollHandler = () => {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(updateFadeStates, 100);
};

let resizeObserver;
onMounted(() => {
  updateFadeStatesDelayed();
  
  // Add resize listener
  window.addEventListener('resize', debouncedScrollHandler);

  // Tambahkan ResizeObserver
  if (scrollContainer.value && window.ResizeObserver) {
    resizeObserver = new ResizeObserver(updateFadeStates);
    resizeObserver.observe(scrollContainer.value);
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', debouncedScrollHandler);
  clearTimeout(scrollTimeout);
  if (resizeObserver && scrollContainer.value) {
    resizeObserver.unobserve(scrollContainer.value);
    resizeObserver = null;
  }
});

// Watch for tabs changes
watch(() => props.tabs, updateFadeStatesDelayed, { deep: true });
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Smooth fade transitions */
.transition-opacity {
  transition: opacity 0.2s ease-in-out;
}

/* Ensure fade overlays are positioned correctly */
.absolute {
  position: absolute;
}
</style>
