<template>
  <div class="space-y-6">
    <!-- Form Content -->
    <div class="bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700 p-6">
      <div class="space-y-6">
        <!-- Basic Health Information -->
        <div class="space-y-4">
          <div class="h-5 bg-grey-200 dark:bg-grey-700 rounded w-48 animate-pulse"></div>

          <!-- Row 1: Blood Type, Height, Weight -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="space-y-2">
              <div class="h-4 bg-grey-200 dark:bg-grey-700 rounded w-20 animate-pulse"></div>
              <div class="h-10 bg-grey-200 dark:bg-grey-700 rounded animate-pulse"></div>
            </div>
            <div class="space-y-2">
              <div class="h-4 bg-grey-200 dark:bg-grey-700 rounded w-24 animate-pulse"></div>
              <div class="h-10 bg-grey-200 dark:bg-grey-700 rounded animate-pulse"></div>
            </div>
            <div class="space-y-2">
              <div class="h-4 bg-grey-200 dark:bg-grey-700 rounded w-20 animate-pulse"></div>
              <div class="h-10 bg-grey-200 dark:bg-grey-700 rounded animate-pulse"></div>
            </div>
          </div>

          <!-- Row 2: Head Size, Health Status -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <div class="h-4 bg-grey-200 dark:bg-grey-700 rounded w-24 animate-pulse"></div>
              <div class="h-10 bg-grey-200 dark:bg-grey-700 rounded animate-pulse"></div>
            </div>
            <div class="space-y-2">
              <div class="h-4 bg-grey-200 dark:bg-grey-700 rounded w-28 animate-pulse"></div>
              <div class="h-10 bg-grey-200 dark:bg-grey-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        <!-- Medical History -->
        <div class="space-y-4">
          <div class="h-5 bg-grey-200 dark:bg-grey-700 rounded w-32 animate-pulse"></div>

          <!-- Row 1: Last MCU Date, Has Disability -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <div class="h-4 bg-grey-200 dark:bg-grey-700 rounded w-40 animate-pulse"></div>
              <div class="h-10 bg-grey-200 dark:bg-grey-700 rounded animate-pulse"></div>
            </div>
            <div class="space-y-2">
              <div class="h-4 bg-grey-200 dark:bg-grey-700 rounded w-24 animate-pulse"></div>
              <div class="h-10 bg-grey-200 dark:bg-grey-700 rounded animate-pulse"></div>
            </div>
          </div>

          <!-- Row 2: Health Concerns -->
          <div class="space-y-2">
            <div class="h-4 bg-grey-200 dark:bg-grey-700 rounded w-28 animate-pulse"></div>
            <div class="h-20 bg-grey-200 dark:bg-grey-700 rounded animate-pulse"></div>
          </div>

          <!-- Row 3: Medical Treatment Record -->
          <div class="space-y-2">
            <div class="h-4 bg-grey-200 dark:bg-grey-700 rounded w-40 animate-pulse"></div>
            <div class="h-20 bg-grey-200 dark:bg-grey-700 rounded animate-pulse"></div>
          </div>
        </div>

        <!-- Vaccination History -->
        <div class="space-y-4">
          <div class="h-5 bg-grey-200 dark:bg-grey-700 rounded w-36 animate-pulse"></div>

          <!-- Vaccination Records -->
          <div class="space-y-2">
            <div class="h-4 bg-grey-200 dark:bg-grey-700 rounded w-32 animate-pulse"></div>
            <div class="h-20 bg-grey-200 dark:bg-grey-700 rounded animate-pulse"></div>
          </div>
        </div>

        <!-- Special Conditions -->
        <div class="space-y-4">
          <div class="h-5 bg-grey-200 dark:bg-grey-700 rounded w-40 animate-pulse"></div>

          <!-- Special Medical Conditions -->
          <div class="space-y-2">
            <div class="h-4 bg-grey-200 dark:bg-grey-700 rounded w-44 animate-pulse"></div>
            <div class="h-20 bg-grey-200 dark:bg-grey-700 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-end gap-3">
      <div class="h-10 bg-grey-200 dark:bg-grey-700 rounded w-20 animate-pulse"></div>
      <div class="h-10 bg-grey-200 dark:bg-grey-700 rounded w-20 animate-pulse"></div>
    </div>
  </div>
</template>

<script setup>
// MedicalRecordSkeleton component untuk loading state
</script>
