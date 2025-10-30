<template>
  <div class="space-y-6">
    <!-- Existing Emergency Contacts Skeleton -->
    <div class="bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700 p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="h-5 bg-gray-200 dark:bg-grey-700 rounded w-48 animate-pulse"></div>
        <div class="flex gap-2">
          <div class="h-8 bg-gray-200 dark:bg-grey-700 rounded w-16 animate-pulse"></div>
          <div class="h-8 bg-gray-200 dark:bg-grey-700 rounded w-16 animate-pulse"></div>
        </div>
      </div>

      <!-- Form Fields Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Name -->
        <div class="space-y-2">
          <div class="h-4 bg-gray-200 dark:bg-grey-700 rounded w-16 animate-pulse"></div>
          <div class="h-10 bg-gray-200 dark:bg-grey-700 rounded animate-pulse"></div>
        </div>

        <!-- Phone Number -->
        <div class="space-y-2">
          <div class="h-4 bg-gray-200 dark:bg-grey-700 rounded w-24 animate-pulse"></div>
          <div class="h-10 bg-gray-200 dark:bg-grey-700 rounded animate-pulse"></div>
        </div>

        <!-- Address -->
        <div class="space-y-2">
          <div class="h-4 bg-gray-200 dark:bg-grey-700 rounded w-20 animate-pulse"></div>
          <div class="h-10 bg-gray-200 dark:bg-grey-700 rounded animate-pulse"></div>
        </div>

        <!-- Relationship -->
        <div class="space-y-2">
          <div class="h-4 bg-gray-200 dark:bg-grey-700 rounded w-28 animate-pulse"></div>
          <div class="h-10 bg-gray-200 dark:bg-grey-700 rounded animate-pulse"></div>
        </div>

        <!-- Active Status Toggle -->
        <div class="space-y-2">
          <div class="h-4 bg-gray-200 dark:bg-grey-700 rounded w-24 animate-pulse"></div>
          <div class="flex items-center space-x-3">
            <div class="h-6 w-11 bg-gray-200 dark:bg-grey-700 rounded-full animate-pulse"></div>
            <div class="h-4 bg-gray-200 dark:bg-grey-700 rounded w-16 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add New Emergency Contact Section Skeleton -->
    <div class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-md">
      <div class="flex items-center gap-2 mb-2">
        <div class="w-5 h-5 bg-blue-200 dark:bg-blue-700 rounded animate-pulse"></div>
        <div class="h-5 bg-blue-200 dark:bg-blue-700 rounded w-48 animate-pulse"></div>
      </div>
      <div class="h-4 bg-blue-200 dark:bg-blue-700 rounded w-64 animate-pulse"></div>
    </div>

    <!-- New Emergency Contact Form Skeleton -->
    <div class="bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700 p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="h-5 bg-gray-200 dark:bg-grey-700 rounded w-40 animate-pulse"></div>
        <div class="h-8 bg-red-200 dark:bg-red-700 rounded w-20 animate-pulse"></div>
      </div>

      <!-- Form Fields Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Name -->
        <div class="space-y-2">
          <div class="h-4 bg-gray-200 dark:bg-grey-700 rounded w-16 animate-pulse"></div>
          <div class="h-10 bg-gray-200 dark:bg-grey-700 rounded animate-pulse"></div>
        </div>

        <!-- Phone Number -->
        <div class="space-y-2">
          <div class="h-4 bg-gray-200 dark:bg-grey-700 rounded w-24 animate-pulse"></div>
          <div class="h-10 bg-gray-200 dark:bg-grey-700 rounded animate-pulse"></div>
        </div>

        <!-- Address -->
        <div class="space-y-2">
          <div class="h-4 bg-gray-200 dark:bg-grey-700 rounded w-20 animate-pulse"></div>
          <div class="h-10 bg-gray-200 dark:bg-grey-700 rounded animate-pulse"></div>
        </div>

        <!-- Relationship -->
        <div class="space-y-2">
          <div class="h-4 bg-gray-200 dark:bg-grey-700 rounded w-28 animate-pulse"></div>
          <div class="h-10 bg-gray-200 dark:bg-grey-700 rounded animate-pulse"></div>
        </div>

        <!-- Active Status Toggle -->
        <div class="space-y-2">
          <div class="h-4 bg-gray-200 dark:bg-grey-700 rounded w-24 animate-pulse"></div>
          <div class="flex items-center space-x-3">
            <div class="h-6 w-11 bg-gray-200 dark:bg-grey-700 rounded-full animate-pulse"></div>
            <div class="h-4 bg-gray-200 dark:bg-grey-700 rounded w-16 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons Skeleton -->
    <div class="space-y-4 pt-4 border-t border-grey-200 dark:border-grey-700">
      <div class="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
        <div class="h-10 bg-blue-200 dark:bg-blue-700 rounded w-32 animate-pulse"></div>
        <div class="h-10 bg-gray-200 dark:bg-grey-700 rounded w-24 animate-pulse"></div>
      </div>
      <div class="h-10 bg-green-200 dark:bg-green-700 rounded w-full animate-pulse"></div>
    </div>
  </div>
</template>

<script setup>
// EmergencyContactSkeleton component untuk loading state
</script>
