<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[80] p-4"
    @click="handleClose"
  >
    <div
      class="bg-white dark:bg-grey-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col"
      @click.stop
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-4 md:p-6 border-b border-grey-200 dark:border-grey-700">
        <div>
          <h2 class="text-xl font-bold text-grey-900 dark:text-grey-100">
            Crop Photo
          </h2>
          <p class="text-sm text-grey-500 dark:text-grey-400 mt-1">
            Zoom and drag to adjust your photo within the 4x6 (2:3) frame
          </p>
        </div>
        <button
          @click="handleClose"
          class="p-2 rounded-lg hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors"
          aria-label="Close modal"
        >
          <i class="pi pi-times text-grey-500 dark:text-grey-300 text-xl"></i>
        </button>
      </div>

      <!-- Tools Bar -->
      <div class="px-4 md:px-6 py-3 bg-grey-50 dark:bg-grey-900 border-b border-grey-200 dark:border-grey-700 flex items-center justify-between gap-4 flex-wrap">
        <!-- Zoom Controls -->
        <div class="flex items-center gap-2">
          <button
            @click="zoomOut"
            :disabled="isZoomOutDisabled"
            class="p-2 rounded-lg bg-white dark:bg-grey-800 border border-grey-300 dark:border-grey-600 hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom Out"
            aria-label="Zoom out"
          >
            <i class="pi pi-minus text-sm"></i>
          </button>

          <div class="w-24 text-center">
            <span class="text-xs text-grey-600 dark:text-grey-400 font-medium">
              {{ zoomPercentage }}%
            </span>
          </div>

          <button
            @click="zoomIn"
            :disabled="isZoomInDisabled"
            class="p-2 rounded-lg bg-white dark:bg-grey-800 border border-grey-300 dark:border-grey-600 hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom In"
            aria-label="Zoom in"
          >
            <i class="pi pi-plus text-sm"></i>
          </button>
        </div>

        <!-- Reset Button -->
        <div class="flex items-center gap-2">
          <button
            @click="resetZoom"
            class="px-3 py-2 rounded-lg bg-white dark:bg-grey-800 border border-grey-300 dark:border-grey-600 hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors text-sm flex items-center gap-2"
            title="Reset Zoom"
            aria-label="Reset zoom and position"
          >
            <i class="pi pi-refresh text-sm"></i>
            <span class="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      <!-- Cropper Container -->
      <div
        ref="cropperContainerRef"
        class="flex-1 overflow-hidden p-4 md:p-6 bg-grey-50 dark:bg-grey-900 flex items-center justify-center"
      >
        <!-- Fixed 4x6 Frame Container -->
        <div
          ref="containerRef"
          class="relative bg-white dark:bg-grey-800 rounded-lg overflow-hidden shadow-xl mx-auto select-none"
          :style="containerStyle"
        >
          <!-- Image (draggable and zoomable) -->
          <img
            v-if="imageSrc"
            ref="imageRef"
            :src="imageSrc"
            alt="Crop preview"
            class="absolute transition-transform duration-200 cursor-move"
            :style="imageStyle"
            @load="onImageLoad"
            @mousedown="startDrag"
            @touchstart="startDrag"
            draggable="false"
          />

          <!-- Fixed Crop Border (4x6 frame) -->
          <div class="absolute inset-0 border-3 border-primary-500 shadow-2xl pointer-events-none">
            <!-- Grid Lines -->
            <div class="absolute inset-0">
              <div class="absolute top-1/3 left-0 right-0 border-t border-white opacity-40"></div>
              <div class="absolute top-2/3 left-0 right-0 border-t border-white opacity-40"></div>
              <div class="absolute left-1/3 top-0 bottom-0 border-l border-white opacity-40"></div>
              <div class="absolute left-2/3 top-0 bottom-0 border-l border-white opacity-40"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="flex justify-between items-center gap-3 p-4 md:p-6 border-t border-grey-200 dark:border-grey-700 bg-white dark:bg-grey-800">
        <button
          @click="handleClose"
          class="px-4 py-2.5 bg-grey-200 dark:bg-grey-700 text-grey-700 dark:text-grey-200 rounded-lg hover:bg-grey-300 dark:hover:bg-grey-600 transition-colors text-sm font-medium"
        >
          Cancel
        </button>
        <button
          @click="applyCrop"
          :disabled="isProcessing"
          class="px-6 py-2.5 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          <i v-if="isProcessing" class="pi pi-spin pi-spinner"></i>
          <i v-else class="pi pi-check"></i>
          {{ isProcessing ? 'Processing...' : 'Apply Crop' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';

// ========================
// Props & Emits
// ========================
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  imageFile: {
    type: File,
    default: null
  }
});

const emit = defineEmits(['close', 'cropped']);

// ========================
// Constants
// ========================
const ASPECT_RATIO = 2 / 3; // 4x6 ratio (width:height = 2:3)
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;
const OUTPUT_WIDTH = 800; // Fixed output width
const MIN_FRAME_WIDTH = 300;
const MAX_FRAME_WIDTH = 600;

// ========================
// Refs
// ========================
const imageRef = ref(null);
const containerRef = ref(null);
const cropperContainerRef = ref(null);

// ========================
// State
// ========================
const imageSrc = ref('');
const imageNaturalWidth = ref(0);
const imageNaturalHeight = ref(0);
const zoomLevel = ref(1);
const offsetX = ref(0);
const offsetY = ref(0);
const frameWidth = ref(400);
const frameHeight = ref(600);
const isProcessing = ref(false);

// Drag state
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const dragInitialOffsetX = ref(0);
const dragInitialOffsetY = ref(0);

let resizeObserver = null;

// ========================
// Computed Properties
// ========================
const zoomPercentage = computed(() => Math.round(zoomLevel.value * 100));
const isZoomInDisabled = computed(() => zoomLevel.value >= MAX_ZOOM);
const isZoomOutDisabled = computed(() => zoomLevel.value <= MIN_ZOOM);

const containerStyle = computed(() => ({
  width: `${frameWidth.value}px`,
  height: `${frameHeight.value}px`,
  maxWidth: '100%',
  maxHeight: '100%'
}));

const imageStyle = computed(() => {
  if (!isImageLoaded.value) {
    return { display: 'none' };
  }

  const scaledDimensions = getScaledImageDimensions();
  const position = getImagePosition(scaledDimensions);

  return {
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: `${scaledDimensions.width}px`,
    height: `${scaledDimensions.height}px`,
    display: 'block'
  };
});

const isImageLoaded = computed(() => {
  return imageNaturalWidth.value > 0 &&
         imageNaturalHeight.value > 0 &&
         frameWidth.value > 0 &&
         frameHeight.value > 0;
});

// ========================
// Image Calculations
// ========================
function getInitialScale() {
  if (!imageNaturalWidth.value || !imageNaturalHeight.value) return 1;

  const scaleX = frameWidth.value / imageNaturalWidth.value;
  const scaleY = frameHeight.value / imageNaturalHeight.value;

  // Use max to ensure image covers the entire frame
  return Math.max(scaleX, scaleY);
}

function getScaledImageDimensions() {
  const baseScale = getInitialScale();
  const totalScale = baseScale * zoomLevel.value;

  return {
    width: imageNaturalWidth.value * totalScale,
    height: imageNaturalHeight.value * totalScale
  };
}

function getImagePosition(scaledDimensions) {
  // Center the image by default, then apply offset
  const centerX = (frameWidth.value - scaledDimensions.width) / 2;
  const centerY = (frameHeight.value - scaledDimensions.height) / 2;

  return {
    x: centerX + offsetX.value,
    y: centerY + offsetY.value
  };
}

function constrainOffset() {
  const scaledDimensions = getScaledImageDimensions();

  // Calculate maximum allowed offset to keep image covering the frame
  const maxOffsetX = Math.max(0, (scaledDimensions.width - frameWidth.value) / 2);
  const maxOffsetY = Math.max(0, (scaledDimensions.height - frameHeight.value) / 2);

  // Constrain offsets
  offsetX.value = Math.max(-maxOffsetX, Math.min(maxOffsetX, offsetX.value));
  offsetY.value = Math.max(-maxOffsetY, Math.min(maxOffsetY, offsetY.value));
}

// ========================
// Frame Size Calculation
// ========================
function calculateFrameSize() {
  if (!cropperContainerRef.value) return;

  const container = cropperContainerRef.value;
  const availableWidth = container.clientWidth - 32; // Account for padding
  const availableHeight = container.clientHeight - 32;

  // Calculate size based on available space while maintaining aspect ratio
  let width = availableWidth;
  let height = width / ASPECT_RATIO;

  // If height exceeds available space, scale based on height
  if (height > availableHeight) {
    height = availableHeight;
    width = height * ASPECT_RATIO;
  }

  // Apply min/max constraints
  const minHeight = MIN_FRAME_WIDTH / ASPECT_RATIO;
  const maxHeight = MAX_FRAME_WIDTH / ASPECT_RATIO;

  width = Math.max(MIN_FRAME_WIDTH, Math.min(MAX_FRAME_WIDTH, width));
  height = Math.max(minHeight, Math.min(maxHeight, height));

  frameWidth.value = width;
  frameHeight.value = height;
}

// ========================
// Event Handlers
// ========================
function onImageLoad() {
  if (!imageRef.value) return;

  const img = imageRef.value;
  if (!img.naturalWidth || !img.naturalHeight) return;

  imageNaturalWidth.value = img.naturalWidth;
  imageNaturalHeight.value = img.naturalHeight;

  // Reset zoom and offset when image loads
  resetZoom();
}

function zoomIn() {
  if (zoomLevel.value < MAX_ZOOM) {
    zoomLevel.value = Math.min(MAX_ZOOM, zoomLevel.value + ZOOM_STEP);
    constrainOffset();
  }
}

function zoomOut() {
  if (zoomLevel.value > MIN_ZOOM) {
    zoomLevel.value = Math.max(MIN_ZOOM, zoomLevel.value - ZOOM_STEP);
    constrainOffset();
  }
}

function resetZoom() {
  zoomLevel.value = 1;
  offsetX.value = 0;
  offsetY.value = 0;
}

// ========================
// Drag Functionality
// ========================
function startDrag(event) {
  event.preventDefault();
  isDragging.value = true;

  const clientX = event.type.includes('touch') ? event.touches[0].clientX : event.clientX;
  const clientY = event.type.includes('touch') ? event.touches[0].clientY : event.clientY;

  dragStartX.value = clientX;
  dragStartY.value = clientY;
  dragInitialOffsetX.value = offsetX.value;
  dragInitialOffsetY.value = offsetY.value;

  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
  document.addEventListener('touchmove', onDrag);
  document.addEventListener('touchend', stopDrag);
}

function onDrag(event) {
  if (!isDragging.value) return;

  const clientX = event.type.includes('touch') ? event.touches[0].clientX : event.clientX;
  const clientY = event.type.includes('touch') ? event.touches[0].clientY : event.clientY;

  const deltaX = clientX - dragStartX.value;
  const deltaY = clientY - dragStartY.value;

  offsetX.value = dragInitialOffsetX.value + deltaX;
  offsetY.value = dragInitialOffsetY.value + deltaY;

  constrainOffset();
}

function stopDrag() {
  isDragging.value = false;

  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
  document.removeEventListener('touchmove', onDrag);
  document.removeEventListener('touchend', stopDrag);
}

// ========================
// Crop Functionality
// ========================
async function applyCrop() {
  if (!imageRef.value || !imageNaturalWidth.value || !imageNaturalHeight.value) return;

  isProcessing.value = true;

  try {
    const cropData = calculateCropArea();
    const croppedFile = await createCroppedImage(cropData);

    emit('cropped', croppedFile);
    emit('close');
  } catch (error) {
    console.error('Crop error:', error);
  } finally {
    isProcessing.value = false;
  }
}

function calculateCropArea() {
  const scaledDimensions = getScaledImageDimensions();
  const position = getImagePosition(scaledDimensions);
  const totalScale = getInitialScale() * zoomLevel.value;

  // Calculate what part of the original image is visible in the frame
  const sourceX = Math.max(0, -position.x / totalScale);
  const sourceY = Math.max(0, -position.y / totalScale);

  const sourceWidth = Math.min(
    frameWidth.value / totalScale,
    imageNaturalWidth.value - sourceX
  );

  const sourceHeight = Math.min(
    frameHeight.value / totalScale,
    imageNaturalHeight.value - sourceY
  );

  return {
    x: sourceX,
    y: sourceY,
    width: sourceWidth,
    height: sourceHeight
  };
}

async function createCroppedImage(cropData) {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const outputHeight = Math.round(OUTPUT_WIDTH / ASPECT_RATIO);

      canvas.width = OUTPUT_WIDTH;
      canvas.height = outputHeight;

      const ctx = canvas.getContext('2d');

      // Draw the cropped portion of the image
      ctx.drawImage(
        imageRef.value,
        cropData.x, cropData.y, cropData.width, cropData.height,
        0, 0, OUTPUT_WIDTH, outputHeight
      );

      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File([blob], props.imageFile.name, {
            type: props.imageFile.type || 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(croppedFile);
        } else {
          reject(new Error('Failed to create blob'));
        }
      }, props.imageFile.type || 'image/jpeg', 0.95);
    } catch (error) {
      reject(error);
    }
  });
}

// ========================
// Modal Control
// ========================
function handleClose() {
  emit('close');
}

// ========================
// Lifecycle & Watchers
// ========================
function initializeModal() {
  if (!props.imageFile) return;

  // Create object URL for the image
  imageSrc.value = URL.createObjectURL(props.imageFile);

  // Reset state
  resetZoom();

  // Calculate frame size
  nextTick(() => {
    calculateFrameSize();

    // Setup resize observer
    if (cropperContainerRef.value && !resizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        calculateFrameSize();
        constrainOffset();
      });
      resizeObserver.observe(cropperContainerRef.value);
    }
  });
}

function cleanupModal() {
  // Disconnect resize observer
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }

  // Revoke object URL
  if (imageSrc.value) {
    URL.revokeObjectURL(imageSrc.value);
    imageSrc.value = '';
  }

  // Reset state
  imageNaturalWidth.value = 0;
  imageNaturalHeight.value = 0;
  resetZoom();
}

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    initializeModal();
  } else {
    cleanupModal();
  }
});

onUnmounted(() => {
  cleanupModal();
});
</script>

<style scoped>
img {
  user-select: none;
  -webkit-user-drag: none;
}

.border-3 {
  border-width: 3px;
}

.select-none {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
</style>
