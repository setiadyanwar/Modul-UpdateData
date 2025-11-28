<template>
  <teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[80] p-4"
      @click="handleClose"
    >
      <div
        class="bg-white dark:bg-grey-800 rounded-xl shadow-2xl max-w-5xl w-full h-full max-h-[85vh] overflow-hidden flex flex-col"
        @click.stop
      >
        <!-- Modal Header -->
        <div class="flex items-center justify-between p-2 md:p-3 border-b border-grey-200 dark:border-grey-700">
        <div>
          <h2 class="text-xl font-bold text-grey-900 dark:text-grey-100">
            Professional Photo Upload
          </h2>
          <p class="text-sm text-grey-500 dark:text-grey-400 mt-1">
            Upload and adjust your corporate headshot for best results.
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

      <!-- Cropper + Guidance Container -->
      <div class="flex-1 w-full min-h-0 overflow-y-auto">
        <div class="flex flex-col xl:flex-row gap-3 p-3 md:p-4 bg-grey-50 dark:bg-grey-900 overflow-visible xl:items-start">
        <!-- Cropper Container -->
        <section class="flex-1 flex flex-col gap-3 min-h-0 order-1 xl:order-1 xl:max-h-[calc(85vh-220px)] xl:overflow-y-auto xl:pr-3">
          <div class="flex-1 rounded-2xl border border-grey-100 dark:border-grey-800 bg-white dark:bg-grey-800 p-2 md:p-3 shadow-sm flex flex-col gap-3">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p class="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wide">Crop Your Photo</p>
                <p class="text-xs text-grey-500 dark:text-grey-400 mt-1">4:6 Ratio (2:3) · Professional Format</p>
              </div>
              <div class="hidden sm:flex items-center gap-2 text-xs text-grey-400">
                <i class="pi pi-arrows-alt text-base text-primary-400"></i>
                Drag to reposition
              </div>
            </div>

            <div
              ref="cropperContainerRef"
              class="flex-1 min-h-[220px] sm:min-h-[240px] lg:min-h-[260px] overflow-hidden flex items-start lg:items-center justify-center rounded-2xl bg-gradient-to-b from-grey-50 to-white dark:from-grey-900 dark:to-grey-800 p-2 md:p-3"
            >
              <!-- Fixed 4x6 Frame Container -->
              <div
                ref="containerRef"
                class="relative bg-white dark:bg-grey-800 rounded-xl shadow-xl mx-auto select-none border-3 border-primary-500 overflow-hidden"
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
                  @error="onImageError"
                  @mousedown="startDrag"
                  @touchstart="startDrag"
                  draggable="false"
                />

                <!-- Fixed Crop Border overlay with grid and text -->
                <div class="absolute inset-0 pointer-events-none">
                  <!-- Grid Lines -->
                  <div class="absolute inset-0">
                    <div class="absolute top-1/3 left-0 right-0 border-t border-white opacity-40"></div>
                    <div class="absolute top-2/3 left-0 right-0 border-t border-white opacity-40"></div>
                    <div class="absolute left-1/3 top-0 bottom-0 border-l border-white opacity-40"></div>
                    <div class="absolute left-2/3 top-0 bottom-0 border-l border-white opacity-40"></div>
                  </div>
                  <div class="absolute inset-0 flex flex-col items-center justify-center text-center text-xs font-semibold gap-1" :class="imageSrc ? 'text-white' : 'text-primary-600 dark:text-primary-300'">
                    <i class="pi pi-crop text-base"></i>
                    <span>4:6 Ratio (2:3)</span>
                    <span :class="['text-[11px] font-medium', imageSrc ? 'text-white' : 'text-grey-500 dark:text-grey-300']">Professional Format</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="w-full flex justify-center">
              <div class="w-full">
                <input
                  ref="reuploadInputRef"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleReuploadSelected"
                />
                <UiButton
                  type="button"
                  variant="primary"
                  color="secondary"
                  size="small"
                  class="mt-1"
                  :fullWidth="true"
                  :disabled="isProcessing"
                  @click="triggerReupload"
                >
                  Reupload Photo
                </UiButton>
              </div>
            </div>
          </div>

        </section>

        <!-- Guidance Panel -->
        <aside class="w-full xl:w-[320px] flex flex-col gap-3 shrink-0 order-2 xl:self-start">
          <div class="bg-white dark:bg-grey-800 rounded-2xl border border-grey-100 dark:border-grey-700 shadow-sm p-2.5 order-2 xl:order-1">
            <p class="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wide">Photo Guidelines</p>
            <h3 class="text-lg font-bold text-grey-900 dark:text-grey-100 mt-1">Best Practice Checklist</h3>
            <p class="text-sm text-grey-500 dark:text-grey-400 mt-2">
              Follow these tips to keep every profile photo polished and consistent.
            </p>

            <ul class="mt-3 space-y-2">
              <li
                v-for="guide in photoGuidelines"
                :key="guide.title"
                class="flex items-start gap-3"
              >
                <span class="mt-1 inline-flex w-6 h-6 rounded-full bg-emerald-500 text-white items-center justify-center flex-shrink-0">
                  <i class="pi pi-check text-xs"></i>
                </span>
                <div>
                  <p class="text-sm font-semibold text-grey-900 dark:text-grey-50">{{ guide.title }}</p>
                  <p class="text-xs text-grey-500 dark:text-grey-300 mt-0.5">{{ guide.description }}</p>
                </div>
              </li>
            </ul>
          </div>

          <div class="bg-white dark:bg-grey-800 rounded-2xl border border-grey-100 dark:border-grey-700 shadow-sm p-2.5 order-1 xl:order-2">
            <div class="flex items-center justify-between mb-0">
              <div>
                <p class="text-sm font-semibold text-grey-900 dark:text-grey-50">Photo Examples</p>
              </div>
              <span class="text-xs text-grey-400">Do &amp; Don't</span>
            </div>  
            <img
              src="/images/guide-photo.png"
              alt="Professional vs casual photo examples"
              class="w-full max-h-40 rounded-2xl border border-grey-100 dark:border-grey-700 shadow bg-grey-50 dark:bg-grey-900 object-contain"
            />
            <p class="text-xs text-grey-500 dark:text-grey-400 mt-2 leading-snug">
              Choose a professional sample (plain backdrop, even lighting) and avoid selfies or casual photos.
            </p>
          </div>
        </aside>
      </div>
      </div>

      <!-- Modal Footer -->
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-2 md:p-3 border-t border-grey-200 dark:border-grey-700 bg-white dark:bg-grey-800">
        <div class="flex flex-col md:flex-row gap-2 w-full order-2 md:order-1">
          <div class="flex items-center justify-between md:justify-start gap-2 flex-1 md:flex-none md:mr-auto">
            <button
              @click="zoomOut"
              :disabled="isZoomOutDisabled"
              class="flex-1 md:flex-none p-2 rounded-lg bg-white dark:bg-grey-800 border border-grey-200 dark:border-grey-700 hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom Out"
              aria-label="Zoom out"
            >
              <i class="pi pi-minus text-sm"></i>
            </button>

            <div class="flex-1 md:flex-none text-center">
              <span class="text-xs text-grey-600 dark:text-grey-400 font-medium">
                {{ zoomPercentage }}%
              </span>
            </div>

            <button
              @click="zoomIn"
              :disabled="isZoomInDisabled"
              class="flex-1 md:flex-none p-2 rounded-lg bg-white dark:bg-grey-800 border border-grey-200 dark:border-grey-700 hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom In"
              aria-label="Zoom in"
            >
              <i class="pi pi-plus text-sm"></i>
            </button>

            <div class="flex items-center gap-2 flex-1 md:flex-none min-w-[120px]">
              <i class="pi pi-refresh text-sm text-grey-500 dark:text-grey-400"></i>
              <input
                type="range"
                v-model.number="rotationAngle"
                min="0"
                max="360"
                step="1"
                class="flex-1 h-2 bg-grey-200 dark:bg-grey-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                @input="onRotationChange"
                title="Rotate Image"
                aria-label="Rotate image"
              />
              <span class="text-xs text-grey-600 dark:text-grey-400 font-medium w-10 text-right">
                {{ Math.round(rotationAngle) }}°
              </span>
            </div>

            <button
              @click="resetZoom"
              class="flex-1 md:flex-none px-3 py-2 rounded-lg bg-white dark:bg-grey-800 border border-grey-200 dark:border-grey-700 hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors text-sm flex items-center justify-center gap-2"
              title="Reset Zoom"
              aria-label="Reset zoom and position"
            >
              <i class="pi pi-refresh text-sm"></i>
              <span>Reset</span>
            </button>
          </div>
        </div>

        <div class="flex justify-end order-1 md:order-2">
          <button
            @click="applyCrop"
            :disabled="isProcessing"
            class="px-6 py-2.5 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md w-full md:w-auto justify-center whitespace-nowrap"
          >
            <i v-if="isProcessing" class="pi pi-spin pi-spinner"></i>
            <i v-else class="pi pi-check"></i>
            {{ isProcessing ? 'Processing...' : 'Apply Crop' }}
          </button>
        </div>
      </div>
    </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue';
import UiButton from '~/components/ui/Button.vue';

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

const emit = defineEmits(['close', 'cropped', 'reupload']);

// ========================
// Constants
// ========================
const ASPECT_RATIO = 2 / 3; // 4x6 ratio (width:height = 2:3)
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;
const OUTPUT_WIDTH = 800; // Fixed output width
const MIN_FRAME_WIDTH = 170;
const MAX_FRAME_WIDTH = 210;
const MOBILE_MIN_FRAME_WIDTH = 130;
const MOBILE_MAX_WIDTH_RATIO = 0.9;
const MOBILE_MIN_WIDTH_RATIO = 0.65;
const MOBILE_BREAKPOINT = 768;
const MOBILE_MAX_HEIGHT_RATIO = 0.55;

// ========================
// Refs
// ========================
const imageRef = ref(null);
const containerRef = ref(null);
const cropperContainerRef = ref(null);
const reuploadInputRef = ref(null);
const isBodyScrollLocked = ref(false);

// ========================
// State
// ========================
const imageSrc = ref('');
const imageNaturalWidth = ref(0);
const imageNaturalHeight = ref(0);
const zoomLevel = ref(1);
const offsetX = ref(0);
const offsetY = ref(0);
const rotationAngle = ref(0);
const frameWidth = ref(320);
const frameHeight = ref(480);
const isProcessing = ref(false);
const photoGuidelines = [
  {
    title: 'Professional Appearance',
    description: 'Wear business attire or uniform, keep hair neat, and use a neutral backdrop.'
  },
  {
    title: 'Face Visibility',
    description: 'Look directly at the camera, keep the face unobstructed, and avoid sunglasses or masks.'
  },
  {
    title: 'High Resolution',
    description: 'Use at least 600x900 px so the photo stays sharp across ID badges and systems.'
  }
];

// Drag state
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const dragInitialOffsetX = ref(0);
const dragInitialOffsetY = ref(0);
const originalBodyOverflow = ref('');

let resizeObserver = null;

function loadImageFromFile(file) {
  if (!file) {
    // Reset image state if no file
    if (imageSrc.value) {
      URL.revokeObjectURL(imageSrc.value);
    }
    imageSrc.value = '';
    imageNaturalWidth.value = 0;
    imageNaturalHeight.value = 0;
    return;
  }
  
  // Revoke previous URL if exists
  if (imageSrc.value) {
    URL.revokeObjectURL(imageSrc.value);
  }
  
  try {
    imageSrc.value = URL.createObjectURL(file);
    // Don't reset zoom here - wait for image to load first
  } catch (error) {
    console.error('Error creating object URL:', error);
    imageSrc.value = '';
    imageNaturalWidth.value = 0;
    imageNaturalHeight.value = 0;
  }
}

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
    display: 'block',
    transform: `rotate(${rotationAngle.value}deg)`,
    transformOrigin: 'center center'
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
  if (!imageNaturalWidth.value || !imageNaturalHeight.value || !frameWidth.value || !frameHeight.value) return 1;

  // Calculate scale based on original image dimensions
  // This ensures the image covers the frame (scale up small images, scale down large images)
  const scaleX = frameWidth.value / imageNaturalWidth.value;
  const scaleY = frameHeight.value / imageNaturalHeight.value;
  const baseScale = Math.max(scaleX, scaleY);

  // Account for rotation - the maximum bounding box occurs at 45 degrees
  // We need to ensure the rotated image still covers the frame
  const maxBoundingBox = getRotatedBoundingBox(
    imageNaturalWidth.value,
    imageNaturalHeight.value,
    45
  );

  // Calculate scale needed for the rotated bounding box
  const scaleXRotated = frameWidth.value / maxBoundingBox.width;
  const scaleYRotated = frameHeight.value / maxBoundingBox.height;
  const rotatedScale = Math.max(scaleXRotated, scaleYRotated);

  // Use the maximum scale to ensure image always covers frame
  // This will scale up small images to fill the frame
  const finalScale = Math.max(baseScale, rotatedScale);
  
  // Ensure minimum scale of 1 (don't shrink if image is already smaller than frame in one dimension)
  // But if image is smaller than frame, we definitely need to scale up
  return finalScale;
}

function getRotatedBoundingBox(width, height, angleDeg) {
  const angleRad = (angleDeg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(angleRad));
  const sin = Math.abs(Math.sin(angleRad));
  
  return {
    width: width * cos + height * sin,
    height: width * sin + height * cos
  };
}

function getScaledImageDimensions() {
  const baseScale = getInitialScale();
  const totalScale = baseScale * zoomLevel.value;
  
  // Return original image dimensions scaled (rotation is applied via CSS transform)
  // The bounding box is used for positioning, but the actual image size stays proportional
  return {
    width: imageNaturalWidth.value * totalScale,
    height: imageNaturalHeight.value * totalScale
  };
}

function getImagePosition(scaledDimensions) {
  // Position image so its center (transform origin) is at frame center
  // Since transformOrigin is 'center center', we position the image's center at frame center
  const centerX = (frameWidth.value - scaledDimensions.width) / 2;
  const centerY = (frameHeight.value - scaledDimensions.height) / 2;

  return {
    x: centerX + offsetX.value,
    y: centerY + offsetY.value
  };
}

function constrainOffset() {
  const scaledDimensions = getScaledImageDimensions();
  
  // Calculate bounding box of the scaled rotated image
  const boundingBox = getRotatedBoundingBox(
    scaledDimensions.width,
    scaledDimensions.height,
    rotationAngle.value
  );

  // Calculate maximum allowed offset to keep rotated image covering the frame
  // The offset is relative to the image center, so we need to account for how much
  // the rotated bounding box extends beyond the frame
  const maxOffsetX = Math.max(0, (boundingBox.width - frameWidth.value) / 2);
  const maxOffsetY = Math.max(0, (boundingBox.height - frameHeight.value) / 2);

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
  const availableWidth = Math.max(0, container.clientWidth - 32); // padding
  const availableHeight = Math.max(0, container.clientHeight - 32);
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : MAX_FRAME_WIDTH;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : MAX_FRAME_WIDTH / ASPECT_RATIO;
  const isMobile = viewportWidth < MOBILE_BREAKPOINT;

  // Calculate size based on available space while maintaining aspect ratio
  // Frame size should be consistent regardless of image presence
  let width = availableWidth || MIN_FRAME_WIDTH;
  let height = width / ASPECT_RATIO;

  // If height exceeds available space, scale based on height
  if (availableHeight > 0 && height > availableHeight) {
    height = availableHeight;
    width = height * ASPECT_RATIO;
  }

  let maxWidthLimit = MAX_FRAME_WIDTH;
  let minWidthLimit = MIN_FRAME_WIDTH;

  if (isMobile) {
    maxWidthLimit = Math.min(
      MAX_FRAME_WIDTH,
      Math.max(MOBILE_MIN_FRAME_WIDTH, viewportWidth * MOBILE_MAX_WIDTH_RATIO)
    );

    minWidthLimit = Math.max(
      MOBILE_MIN_FRAME_WIDTH,
      Math.min(maxWidthLimit, viewportWidth * MOBILE_MIN_WIDTH_RATIO)
    );
  }

  width = Math.max(minWidthLimit, Math.min(maxWidthLimit, width));
  height = width / ASPECT_RATIO;

  if (isMobile) {
    const maxMobileHeight = viewportHeight * MOBILE_MAX_HEIGHT_RATIO;
    if (maxMobileHeight > 0 && height > maxMobileHeight) {
      height = maxMobileHeight;
      width = height * ASPECT_RATIO;
    }
  }

  if (availableHeight > 0 && height > availableHeight) {
    height = availableHeight;
    width = height * ASPECT_RATIO;
  }

  // Always update frame size based on container dimensions only
  // This ensures consistent frame size whether image is present or not
  if (width > 0 && height > 0 && availableWidth > 0) {
    frameWidth.value = width;
    frameHeight.value = height;
  }
}

// ========================
// Event Handlers
// ========================
function onImageLoad() {
  if (!imageRef.value) return;

  const img = imageRef.value;
  if (!img.naturalWidth || !img.naturalHeight) {
    console.warn('Image loaded but has no natural dimensions');
    return;
  }

  imageNaturalWidth.value = img.naturalWidth;
  imageNaturalHeight.value = img.naturalHeight;

  // Don't recalculate frame size here - it should already be set from initializeModal
  // Frame size should be independent of image presence

  // Wait for next tick, then reset zoom and offset
  nextTick(() => {
    // Reset zoom and offset - this will use the correct scale calculation
    zoomLevel.value = 1;
    offsetX.value = 0;
    offsetY.value = 0;
    rotationAngle.value = 0;
    
    // Force recalculation to ensure image fills frame
    nextTick(() => {
      constrainOffset();
    });
  });
}

function onImageError() {
  console.error('Failed to load image');
  // Reset image state on error
  if (imageSrc.value) {
    URL.revokeObjectURL(imageSrc.value);
  }
  imageSrc.value = '';
  imageNaturalWidth.value = 0;
  imageNaturalHeight.value = 0;
  
  // Keep frame size stable - don't recalculate when image fails
  // This prevents frame from growing when image disappears
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
  rotationAngle.value = 0;
  // Force recalculation of constraints to ensure image fills frame
  nextTick(() => {
    constrainOffset();
  });
}

function onRotationChange() {
  // Reset offset to keep image centered when rotation changes
  // The scale might change with rotation, so we reset to center
  offsetX.value = 0;
  offsetY.value = 0;
  
  // Recalculate constraints after rotation
  nextTick(() => {
    constrainOffset();
  });
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
  
  // Calculate what part of the rotated image is visible in the frame
  // The frame shows a portion of the rotated/scaled image
  const visibleWidth = frameWidth.value / totalScale;
  const visibleHeight = frameHeight.value / totalScale;
  
  // Calculate the center of visible area in rotated image space
  const boundingBox = getRotatedBoundingBox(
    imageNaturalWidth.value,
    imageNaturalHeight.value,
    rotationAngle.value
  );
  
  const rotatedCenterX = boundingBox.width / 2;
  const rotatedCenterY = boundingBox.height / 2;
  
  // Account for offset (in rotated image space)
  const offsetXScaled = offsetX.value / totalScale;
  const offsetYScaled = offsetY.value / totalScale;
  
  // Calculate crop area in rotated image coordinates
  const cropX = Math.max(0, rotatedCenterX - visibleWidth / 2 - offsetXScaled);
  const cropY = Math.max(0, rotatedCenterY - visibleHeight / 2 - offsetYScaled);
  
  const cropWidth = Math.min(visibleWidth, boundingBox.width - cropX);
  const cropHeight = Math.min(visibleHeight, boundingBox.height - cropY);
  
  // Return crop area in rotated image space (will be handled in createCroppedImage)
  return {
    x: cropX,
    y: cropY,
    width: cropWidth,
    height: cropHeight,
    rotatedWidth: boundingBox.width,
    rotatedHeight: boundingBox.height
  };
}

async function createCroppedImage(cropData) {
  return new Promise((resolve, reject) => {
    try {
      // First, create a rotated version of the image if needed
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      
      if (rotationAngle.value !== 0) {
        // Use the bounding box from cropData
        tempCanvas.width = Math.ceil(cropData.rotatedWidth);
        tempCanvas.height = Math.ceil(cropData.rotatedHeight);
        
        tempCtx.save();
        tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
        tempCtx.rotate((rotationAngle.value * Math.PI) / 180);
        tempCtx.drawImage(
          imageRef.value,
          -imageNaturalWidth.value / 2,
          -imageNaturalHeight.value / 2
        );
        tempCtx.restore();
      } else {
        tempCanvas.width = imageNaturalWidth.value;
        tempCanvas.height = imageNaturalHeight.value;
        tempCtx.drawImage(imageRef.value, 0, 0);
      }
      
      // Now crop from the rotated image
      const canvas = document.createElement('canvas');
      const outputHeight = Math.round(OUTPUT_WIDTH / ASPECT_RATIO);

      canvas.width = OUTPUT_WIDTH;
      canvas.height = outputHeight;

      const ctx = canvas.getContext('2d');

      // Draw the cropped portion, scaling to output size
      ctx.drawImage(
        tempCanvas,
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

function lockBodyScroll() {
  if (typeof document === 'undefined' || isBodyScrollLocked.value) return;
  originalBodyOverflow.value = document.body.style.overflow || '';
  document.body.style.overflow = 'hidden';
  isBodyScrollLocked.value = true;
}

function unlockBodyScroll() {
  if (typeof document === 'undefined' || !isBodyScrollLocked.value) return;
  document.body.style.overflow = originalBodyOverflow.value;
  isBodyScrollLocked.value = false;
}

function triggerReupload() {
  reuploadInputRef.value?.click();
}

function handleReuploadSelected(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    event.target.value = '';
    return;
  }
  emit('reupload', file);
  event.target.value = '';
}

// ========================
// Lifecycle & Watchers
// ========================
function initializeModal() {
  if (!props.imageFile) return;

  lockBodyScroll();

  // Calculate frame size FIRST, before loading image
  // This ensures frame size is consistent regardless of image presence
  nextTick(() => {
    if (cropperContainerRef.value) {
      calculateFrameSize();
    }
    
    // Setup resize observer
    if (cropperContainerRef.value && !resizeObserver) {
      let lastContainerWidth = 0;
      let lastContainerHeight = 0;
      
      resizeObserver = new ResizeObserver(() => {
        if (!cropperContainerRef.value) return;
        
        const container = cropperContainerRef.value;
        const currentWidth = container.clientWidth;
        const currentHeight = container.clientHeight;
        
        // Only recalculate if container size actually changed
        // This prevents unnecessary recalculations and frame size changes
        if (Math.abs(currentWidth - lastContainerWidth) > 5 || 
            Math.abs(currentHeight - lastContainerHeight) > 5) {
          lastContainerWidth = currentWidth;
          lastContainerHeight = currentHeight;
          
          calculateFrameSize();
          
          // Only constrain offset if we have a valid image
          if (imageNaturalWidth.value > 0 && imageNaturalHeight.value > 0) {
            constrainOffset();
          }
        }
      });
      resizeObserver.observe(cropperContainerRef.value);
    }
    
    // Load image AFTER frame size is calculated
    // This prevents frame size from changing when image loads
    loadImageFromFile(props.imageFile);
  });
}

function cleanupModal() {
  // Disconnect resize observer
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }

  unlockBodyScroll();

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

watch(() => props.imageFile, (newFile, oldFile) => {
  if (!props.isOpen) return;
  
  // Handle file change
  if (newFile && newFile !== oldFile) {
    loadImageFromFile(newFile);
  } else if (!newFile && oldFile) {
    // File was removed - cleanup but keep frame size stable
    if (imageSrc.value) {
      URL.revokeObjectURL(imageSrc.value);
    }
    imageSrc.value = '';
    imageNaturalWidth.value = 0;
    imageNaturalHeight.value = 0;
    // Don't recalculate frame size to prevent it from growing
  }
});

onUnmounted(() => {
  cleanupModal();
  unlockBodyScroll();
});
</script>

<style scoped>
img {
  user-select: none;
  -webkit-user-drag: none;
  max-width: none; /* allow JS-controlled dimensions to exceed container */
  max-height: none;
  display: block;
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
