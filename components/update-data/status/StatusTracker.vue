<template>
  <div class="mt-6">
    <div class="relative">
      <!-- Garis progress horizontal (desktop) -->
      <div
        class="progress-background absolute h-0.5 bg-grey-200 dark:bg-grey-700 progress-line-base steps-desktop"
        :style="{
          top: '1.5rem',
          left: '2rem',
          right: '2rem',
        }"
      ></div>
      <div
        class="progress-line absolute h-0.5 transition-all duration-300 progress-line-base steps-desktop"
        :data-status="currentStepStatus"
        :style="{
          top: '1.5rem',
          left: '2rem',
          width: progressWidth,
          backgroundColor: progressLineColor,
          transform: 'translateX(0)',
        }"
      ></div>

      <!-- Garis progress vertikal (mobile) -->
      <div
        class="progress-vertical-mobile steps-mobile"
        :style="{
          left: '1.25rem',
          top: '2.5rem',
          height: mobileProgressHeight,
          backgroundColor: progressLineColor,
        }"
      ></div>

      <!-- Steps Container -->
      <div class="steps-container relative">
        <div class="flex justify-between min-w-max px-7 steps-desktop">
          <div
            v-for="(step, index) in steps"
            :key="index"
            class="flex flex-col items-center relative flex-shrink-0 step-item"
            :style="{ minWidth: '120px' }"
          >
            <div
              :class="[
                'w-12 h-12 rounded-full flex items-center justify-center border-2 mb-2 flex-shrink-0 step-circle',
                getCircleClasses(index),
              ]"
            >
              <i
                v-if="isActive(index) || isCompleted(index)"
                :class="[step.icon, 'text-xl step-icon']"
              />
              <span v-else class="text-lg font-semibold step-number">{{
                index + 1
              }}</span>
            </div>
            <span
              :class="[
                'text-sm font-medium text-center px-1 step-label',
                getTextClasses(index),
              ]"
            >
              {{ step.label }}
            </span>
          </div>
        </div>

        <!-- Mobile Vertical Steps -->
        <div class="steps-mobile lg:hidden">
          <div class="space-y-4">
            <div
              v-for="(step, index) in steps"
              :key="index"
              class="flex items-center gap-4 step-item-mobile"
            >
              <div
                :class="[
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0 step-circle-mobile',
                  getCircleClasses(index),
                ]"
                :style="{ position: 'relative', zIndex: 3 }"
              >
                <i
                  v-if="isActive(index) || isCompleted(index)"
                  :class="[step.icon, 'text-lg step-icon']"
                />
                <span v-else class="text-base font-semibold step-number">{{
                  index + 1
                }}</span>
              </div>
              <span
                :class="[
                  'text-sm font-medium step-label-mobile',
                  getTextClasses(index),
                ]"
              >
                {{ step.label }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  steps: {
    type: Array,
    default: () => [
      {
        label: "Submitted",
        icon: "pi pi-check",
        status: "completed",
      },
      {
        label: "Waiting Approval",
        icon: "pi pi-calendar",
        status: "completed",
      },
      {
        label: "Needs Revision",
        icon: "pi pi-exclamation-triangle",
        status: "current",
      },
      {
        label: "Approved",
        icon: "pi pi-check",
        status: "pending",
      },
    ],
  },
});

// Menentukan step mana yang aktif
const isActive = (index) => {
  const currentIndex = props.steps.findIndex(
    (step) => step.status === "current"
  );
  return index <= currentIndex;
};

// Menentukan apakah step adalah "Needs Revision" atau "Rejected"
const isNeedsRevision = (index) => {
  const step = props.steps[index];
  return (
    (step.label === "Needs Revision" ||
      step.label === "Need Revision" ||
      step.label === "Rejected") &&
    step.status === "current"
  );
};

// Menentukan apakah step adalah "Rejected"
const isRejected = (index) => {
  const step = props.steps[index];
  return (
    (step.label === "Rejected" || step.label === "Need Revision") &&
    step.status === "current"
  );
};

// Menentukan apakah step completed
const isCompleted = (index) => {
  const step = props.steps[index];
  return step.status === "completed";
};

// Menentukan class untuk circle berdasarkan status
const getCircleClasses = (index) => {
  const step = props.steps[index];

  if (isRejected(index)) {
    // Rejected - border warning, background warning
    return "border-warning-500 bg-warning-500 text-white dark:bg-warning-500 dark:border-warning-500";
  } else if (isNeedsRevision(index) && isActive(index)) {
    // Needs Revision yang aktif - border warning, background warning solid
    return "border-warning-500 bg-warning-500 text-white dark:bg-warning-500 dark:border-warning-500";
  } else if (isCompleted(index)) {
    // Step completed - background primary
    return "border-primary-600 bg-primary-600 text-white dark:bg-primary-500 dark:border-primary-500";
  } else if (isActive(index)) {
    // Step aktif lainnya - background primary
    return "border-primary-600 bg-primary-600 text-white dark:bg-primary-500 dark:border-primary-500";
  } else {
    // Step tidak aktif - background abu-abu dengan border abu-abu
    return "border-grey-300 bg-grey-100 dark:bg-grey-700 dark:border-grey-600 text-grey-500 dark:text-grey-400";
  }
};

// Menentukan class untuk text berdasarkan status
const getTextClasses = (index) => {
  if (isRejected(index)) {
    return "text-warning-700 dark:text-warning-300 font-semibold";
  } else if (isNeedsRevision(index) && isActive(index)) {
    return "text-warning-700 dark:text-warning-300 font-semibold";
  } else if (isCompleted(index)) {
    return "text-primary-700 dark:text-primary-300";
  } else if (isActive(index)) {
    return "text-primary-700 dark:text-primary-300";
  } else {
    return "text-grey-700 dark:text-grey-200";
  }
};

// Helper function untuk menghitung progress
const calculateProgress = (currentIndex, totalSteps, isMobile = false) => {
  // Debug sederhana

  // Jika tidak ada step current, progress 0%
  if (currentIndex === -1) return isMobile ? "0px" : "0%";

  // Jika current step adalah step pertama, progress 0%
  if (currentIndex === 0) return isMobile ? "0px" : "0%";

  // Menghitung progress berdasarkan posisi step current
  const totalGaps = totalSteps - 1;
  const completedSteps = currentIndex;
  let progressPercentage = (completedSteps / totalGaps) * 100;

  // Penyesuaian khusus untuk setiap status berdasarkan label
  const currentStep = props.steps[currentIndex];


  if (
    currentStep &&
    (currentStep.label === "Needs Revision" ||
      currentStep.label === "Need Revision" ||
      currentStep.label === "Rejected")
  ) {
    // Untuk Needs Revision, progress line harus tepat di tengah circle
    const value = isMobile ? "53%" : "55%";
    return value;
  }

  // Penyesuaian khusus untuk setiap status
  switch (currentIndex) {
    case 1: // Submitted -> Waiting Approval
      return "33%";
    case 2: // Waiting Approval -> Next Step
      return "55%";
    case 3: // Approved (step terakhir) - penyesuaian untuk mobile
      if (isMobile) {
        return "75%";
      } else {
        return "100%";
      }
    default:
      // Untuk step lainnya, gunakan perhitungan proporsional
      if (currentIndex === totalSteps - 1) {
        if (isMobile) {
          return "75%";
        } else {
          return "100%";
        }
      }
      const value = `${Math.min(progressPercentage, 90)}%`;
      return value;
  }
};

// Menghitung width progress bar dengan perbaikan
const progressWidth = computed(() => {
  const currentIndex = props.steps.findIndex(
    (step) => step.status === "current"
  );
  const totalSteps = props.steps.length;
  return calculateProgress(currentIndex, totalSteps, false);
});

// Menentukan status step current
const currentStepStatus = computed(() => {
  const currentStep = props.steps.find((step) => step.status === "current");
  return currentStep
    ? currentStep.label.toLowerCase().replace(/\s+/g, "-")
    : "";
});

// Menentukan warna progress line berdasarkan status current
const progressLineColor = computed(() => {
  // Gunakan warna dari CSS variables
  return "var(--color-primary-500)";
});

// Menghitung height progress line untuk mobile
const mobileProgressHeight = computed(() => {
  const currentIndex = props.steps.findIndex(
    (step) => step.status === "current"
  );
  const totalSteps = props.steps.length;
  return calculateProgress(currentIndex, totalSteps, true);
});
</script>

<style scoped>
/* Memastikan circle tetap bulat */
.w-12 {
  width: 3rem !important;
  height: 3rem !important;
  min-width: 3rem !important;
  min-height: 3rem !important;
}

.rounded-full {
  border-radius: 9999px !important;
}

/* Progress line dengan z-index tinggi dan spesifik */
.progress-background {
  z-index: 1 !important;
  pointer-events: none !important;
}

.progress-line {
  z-index: 2 !important;
  pointer-events: none !important;
  /* Tambahan untuk mencegah overflow */
  max-width: calc(100% - 4rem) !important;
  box-sizing: border-box !important;
}

.steps-container {
  z-index: 10 !important;
  position: relative !important;
}

/* Memastikan progress line tidak hilang */
.progress-background,
.progress-line {
  position: absolute !important;
  height: 0.125rem !important;
}

.progress-background {
  background-color: #e5e7eb !important;
  /* Pastikan background line tidak overflow */
  max-width: calc(100% - 4rem) !important;
}

.dark .progress-background {
  background-color: #4b5563 !important;
}

.progress-line {
  transition: width 0.3s ease, background-color 0.3s ease !important;
  border-radius: 0.0625rem !important;
  transform-origin: left center !important;
}

/* Memastikan circle berada di atas progress line */
.w-12 {
  z-index: 3 !important;
  position: relative !important;
}

/* Step item styling */
.step-item {
  position: relative !important;
  z-index: 3 !important;
}

.step-circle {
  position: relative !important;
  z-index: 3 !important;
}

.step-icon {
  position: relative !important;
  z-index: 4 !important;
}

.step-label {
  position: relative !important;
  z-index: 3 !important;
}

.step-number {
  position: relative !important;
  z-index: 4 !important;
  font-weight: 600 !important;
}

/* Memastikan warna yang benar untuk completed steps */
.step-circle.border-primary-600.bg-primary-600 {
  background-color: var(--color-primary-600) !important;
  border-color: var(--color-primary-600) !important;
  color: white !important;
}

.dark .step-circle.border-primary-600.bg-primary-600 {
  background-color: var(--color-primary-500) !important;
  border-color: var(--color-primary-500) !important;
  color: white !important;
}

/* Memastikan warna yang benar untuk warning steps */
.step-circle.border-warning-500.bg-warning-500 {
  background-color: var(--color-warning-500) !important;
  border-color: var(--color-warning-500) !important;
  color: white !important;
}

.dark .step-circle.border-warning-500.bg-warning-500 {
  background-color: var(--color-warning-500) !important;
  border-color: var(--color-warning-500) !important;
  color: white !important;
}

/* Memastikan warna yang benar untuk pending steps */
.step-circle.border-grey-300.bg-grey-100 {
  background-color: var(--color-grey-100) !important;
  border-color: var(--color-grey-300) !important;
  color: var(--color-grey-500) !important;
}

.dark .step-circle.border-grey-300.bg-grey-100 {
  background-color: var(--color-grey-700) !important;
  border-color: var(--color-grey-600) !important;
  color: var(--color-grey-400) !important;
}

/* Memastikan warna text yang benar */
.step-label.text-primary-700 {
  color: var(--color-primary-700) !important;
}

.dark .step-label.text-primary-700 {
  color: var(--color-primary-300) !important;
}

.step-label.text-grey-600 {
  color: var(--color-grey-600) !important;
}

.dark .step-label.text-grey-600 {
  color: var(--color-grey-400) !important;
}

/* Memastikan warna text warning yang kontras */
.step-label.text-warning-700 {
  color: var(--color-warning-700) !important;
  font-weight: 600 !important;
}

.dark .step-label.text-warning-700 {
  color: var(--color-warning-300) !important;
  font-weight: 600 !important;
}

/* Styling untuk angka step */
.step-number {
  color: var(--color-grey-400) !important;
}

.dark .step-number {
  color: var(--color-grey-500) !important;
}

/* Mobile steps styling */
.step-item-mobile {
  position: relative !important;
}

.step-circle-mobile {
  position: relative !important;
  z-index: 3 !important;
}

.step-label-mobile {
  position: relative !important;
  z-index: 3 !important;
}

/* Memastikan warna text warning mobile yang kontras */
.step-label-mobile.text-warning-700 {
  color: var(--color-warning-700) !important;
  font-weight: 600 !important;
}

.dark .step-label-mobile.text-warning-700 {
  color: var(--color-warning-300) !important;
  font-weight: 600 !important;
}

/* Memastikan warna yang benar untuk mobile steps */
.step-circle-mobile.border-primary-600.bg-primary-600 {
  background-color: var(--color-primary-600) !important;
  border-color: var(--color-primary-600) !important;
  color: white !important;
}

.dark .step-circle-mobile.border-primary-600.bg-primary-600 {
  background-color: var(--color-primary-500) !important;
  border-color: var(--color-primary-500) !important;
  color: white !important;
}

.step-circle-mobile.border-grey-300.bg-grey-100 {
  background-color: var(--color-grey-100) !important;
  border-color: var(--color-grey-300) !important;
  color: var(--color-grey-500) !important;
}

.dark .step-circle-mobile.border-grey-300.bg-grey-100 {
  background-color: var(--color-grey-700) !important;
  border-color: var(--color-grey-600) !important;
  color: var(--color-grey-400) !important;
}

.step-circle-mobile.border-warning-500.bg-warning-500 {
  background-color: var(--color-warning-500) !important;
  border-color: var(--color-warning-500) !important;
  color: white !important;
}

.dark .step-circle-mobile.border-warning-500.bg-warning-500 {
  background-color: var(--color-warning-500) !important;
  border-color: var(--color-warning-500) !important;
  color: white !important;
}

/* Responsive progress line positioning dengan perbaikan overflow */
@media (min-width: 640px) {
  .progress-background.progress-line-base {
    left: 5.5rem !important;
    right: 5.5rem !important;
    max-width: calc(100% - 11rem) !important;
  }

  .progress-line.progress-line-base {
    left: 5.5rem !important;
    max-width: calc(100% - 11rem) !important;
  }
}

/* Mobile layout - vertical steps */
@media (max-width: 1023px) {
  /* Hide desktop steps on mobile */
  .steps-desktop {
    display: none !important;
  }

  /* Show mobile steps */
  .steps-mobile {
    display: block !important;
  }

  /* Hide progress line on mobile */
  .progress-background,
  .progress-line {
    display: none !important;
  }

  /* Show vertical progress line on mobile */
  .progress-vertical-mobile {
    display: block !important;
  }
}

/* Desktop layout - horizontal steps */
@media (min-width: 1024px) {
  /* Show desktop steps on desktop */
  .steps-desktop {
    display: flex !important;
  }

  /* Hide mobile steps on desktop */
  .steps-mobile {
    display: none !important;
  }

  /* Show progress line on desktop */
  .progress-background,
  .progress-line {
    display: block !important;
  }

  /* Hide vertical progress line on desktop */
  .progress-vertical-mobile {
    display: none !important;
  }
}

/* Scroll styling */
.steps-container {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.steps-container::-webkit-scrollbar {
  height: 4px;
}

.steps-container::-webkit-scrollbar-track {
  background: transparent;
}

.steps-container::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 2px;
}

.steps-container::-webkit-scrollbar-thumb:hover {
  background-color: #94a3b8;
}

/* Dark mode scroll styling */
.dark .steps-container {
  scrollbar-color: #475569 transparent;
}

.dark .steps-container::-webkit-scrollbar-thumb {
  background-color: #475569;
}

.dark .steps-container::-webkit-scrollbar-thumb:hover {
  background-color: #64748b;
}

/* Progress line vertikal untuk mobile */
.progress-vertical-mobile {
  position: absolute;
  width: 3px;
  background-color: var(--color-primary-500);
  z-index: 1;
  left: 1.25rem;
  top: 2.5rem;
  border-radius: 2px;
  display: none;
  transition: height 0.3s ease;
}

.dark .progress-vertical-mobile {
  background-color: var(--color-primary-500);
}

@media (max-width: 1023px) {
  .progress-vertical-mobile {
    display: block !important;
  }
  .steps-desktop {
    display: none !important;
  }
}
@media (min-width: 1024px) {
  .progress-vertical-mobile {
    display: none !important;
  }
}
</style>
