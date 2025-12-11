<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
    <div
      class="rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col lg:flex-row modal-container overflow-hidden bg-white dark:bg-grey-800"
      style="min-height: 600px; width: 1200px; max-width: calc(100vw - 2rem)">
      <!-- Left Section: Download Data Personal -->
      <div
        class="w-full lg:w-96 bg-white dark:bg-grey-800 p-4 lg:p-6 flex flex-col min-w-0 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-grey-700 rounded-t-2xl lg:rounded-t-none lg:rounded-l-2xl min-h-0">
        <!-- Header -->
        <div class="flex-shrink-0 mb-4">
          <div class="flex items-center justify-between lg:block">
            <h2 class="text-lg lg:text-xl font-bold text-gray-900 dark:text-grey-100">
              Download Data Personal
            </h2>
            <button @click="$emit('close')"
              class="lg:hidden text-gray-400 dark:text-grey-500 hover:text-gray-600 dark:hover:text-grey-300 transition-colors flex-shrink-0">
              <i class="pi pi-times text-xl"></i>
            </button>
          </div>
          <p class="text-gray-500 dark:text-grey-400 text-sm">
            Select the data information you want to include
          </p>
        </div>

        <!-- Data Type List -->
        <div class="flex-1 space-y-2 overflow-y-auto min-h-0 max-h-90 lg:max-h-none lg:overflow-y-auto">
          <label v-for="(item, index) in dataTypes" :key="index" :class="[
            'flex items-center space-x-3 lg:space-x-4 p-2 rounded-md cursor-pointer',
            item.disabled
              ? 'bg-gray-50 dark:bg-grey-900 cursor-not-allowed opacity-75'
              : 'hover:bg-gray-100 dark:hover:bg-grey-700',
          ]" @click="!item.disabled && handleItemClick(index, $event)">
            <Checkbox :model-value="item.selected" :disabled="item.disabled"
              @update:model-value="!item.disabled && toggleSelection(index)" 
              @click.stop
              size="16" class="mt-0.5" />
            <div class="flex items-center space-x-2 min-w-0">
              <div :class="[
                'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                item.disabled
                  ? 'bg-gray-200 dark:bg-grey-700'
                  : 'bg-secondary-100 dark:bg-grey-700',
              ]">
                <i :class="[
                  'pi text-xs',
                  item.disabled
                    ? 'text-gray-400 dark:text-grey-500'
                    : 'text-secondary-600 dark:text-secondary-400',
                  item.icon,
                ]"></i>
              </div>
              <div class="min-w-0 flex-1">
                <h3 :class="[
                  'text-sm font-medium truncate',
                  item.disabled
                    ? 'text-gray-500 dark:text-grey-400'
                    : 'text-gray-900 dark:text-grey-100',
                ]">
                  {{ item.title }}
                  <span v-if="item.disabled" class="text-xs text-gray-400 dark:text-grey-500 ml-1">(Required)</span>
                </h3>
                <p :class="[
                  'text-xs line-clamp-1',
                  item.disabled
                    ? 'text-gray-400 dark:text-grey-500'
                    : 'text-gray-500 dark:text-grey-400',
                ]">
                  {{ item.description }}
                </p>
              </div>
            </div>
          </label>
        </div>

        <!-- Selection Status -->
        <div class="mt-4 mb-4 flex-shrink-0">
          <p class="text-sm text-gray-600 dark:text-grey-300">
            {{ selectedCount }} of {{ dataTypes.length }} data types selected
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex space-x-2 lg:space-x-3 flex-shrink-0">
          <Button @click="selectAll" variant="secondary" size="small" class="flex-1 text-xs lg:text-sm !text-primary">
            Select All
          </Button>
          <Button @click="clearAll" variant="secondary" size="small" class="flex-1 text-xs lg:text-sm">
            Clear All
          </Button>
        </div>
      </div>

      <!-- Right Section: PDF Preview -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden min-h-0 lg:w-[calc(100%-24rem)]">
        <!-- Container 1: PDF Preview Header -->
        <div
          class="bg-white dark:bg-grey-800 p-4 border-b border-gray-200 dark:border-grey-700 rounded-tr-2xl lg:rounded-tr-2xl">
          <div class="flex items-center justify-between">
            <div class="flex flex-col items-start">
              <h2 class="text-lg lg:text-xl font-bold text-gray-900 dark:text-grey-100">
                PDF Preview
              </h2>
              <p class="text-sm text-gray-500 dark:text-grey-400">
                Live preview of your selected data
              </p>
            </div>
            <button @click="$emit('close')"
              class="hidden lg:block text-gray-400 dark:text-grey-500 hover:text-gray-600 dark:hover:text-grey-300 transition-colors flex-shrink-0">
              <i class="pi pi-times"></i>
            </button>
          </div>
        </div>

        <!-- Container 2: PDF Content -->
        <div
          class="flex-1 bg-grey-50 dark:bg-grey-900 p-4 lg:p-6 border-b border-gray-200 dark:border-grey-700 flex flex-col min-h-0 overflow-hidden">
          <div class="flex-1 overflow-y-auto min-h-0">
            <!-- Loading State -->
            <div v-if="isLoading" class="space-y-6 animate-pulse">
              <div class="h-6 w-1/3 bg-gray-200 dark:bg-grey-700 rounded"></div>
              <div class="h-4 w-1/2 bg-gray-200 dark:bg-grey-700 rounded"></div>
              <div class="grid grid-cols-2 gap-4">
                <div class="h-24 bg-gray-200 dark:bg-grey-700 rounded"></div>
                <div class="h-24 bg-gray-200 dark:bg-grey-700 rounded"></div>
              </div>
              <div class="h-8 w-1/4 bg-gray-200 dark:bg-grey-700 rounded"></div>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="flex items-center justify-center h-32">
              <div class="text-center">
                <i class="pi pi-exclamation-triangle text-red-500 dark:text-red-400 text-2xl mb-2"></i>
                <p class="text-red-600 dark:text-red-400 text-sm">
                  {{ error }}
                </p>
              </div>
            </div>

            <!-- Empty State (No Data) -->
            <div v-else-if="selectedCount === 0 || !hasAnyData" class="flex items-center justify-center h-64">
              <div class="text-center">
                <i class="pi pi-inbox text-gray-400 dark:text-grey-500 text-4xl mb-4"></i>
                <h3 class="text-lg font-medium text-gray-900 dark:text-grey-100 mb-2">
                  No Data Available
                </h3>
                <p class="text-sm text-gray-500 dark:text-grey-400 max-w-sm">
                  The selected data categories don't have any information to display, or no data types are currently
                  selected.
                </p>
              </div>
            </div>

            <!-- PDF Document Container -->
            <div v-else class="bg-white dark:bg-grey-800 rounded-md p-6 lg:p-8 shadow-sm min-w-0 max-w-full"
              style="border-radius: 8px">
              <!-- PDF Content -->
              <div class="space-y-6 min-w-0 overflow-hidden">
                <!-- Document Header -->
                <div
                  class="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-2 space-y-2 lg:space-y-0 min-w-0">
                  <div class="flex items-center space-x-2 min-w-0">
                    <div class="flex-shrink-0">
                      <img src="/assets/logo.svg" alt="TelkomSigma Logo" class="h-8 lg:h-10 w-auto" />
                    </div>
                  </div>
                  <div class="text-left lg:text-right min-w-0 overflow-hidden">
                    <h1 class="text-lg lg:text-xl font-bold text-gray-900 dark:text-grey-100 truncate">
                      Employee Profile
                    </h1>
                    <p class="text-xs lg:text-sm text-gray-500 dark:text-grey-400 truncate">
                      Generated: {{ currentDate }}
                    </p>
                    <p class="text-xs lg:text-sm text-gray-500 dark:text-grey-400 truncate">
                      Time: {{ currentTime }} WIB
                    </p>
                  </div>
                </div>
                <div class="border-t border-gray-300 dark:border-grey-600"></div>

                <!-- Employee Details -->
                <div class="flex flex-col lg:flex-row lg:space-x-4 mb-6 space-y-4 lg:space-y-0 min-w-0">
                  <div
                    class="w-20 h-20 lg:w-24 lg:h-24 bg-gray-200 dark:bg-grey-700 rounded-md flex items-center justify-center flex-shrink-0 mx-auto lg:mx-0">
                    <!-- Loading state -->
                    <div v-if="isLoadingPhoto" class="w-full h-full flex items-center justify-center">
                      <i class="pi pi-spin pi-spinner text-gray-400 dark:text-grey-500 text-lg"></i>
                    </div>
                    <!-- Photo display -->
                    <template v-else-if="professionalPhotoUrl">
                      <img :src="professionalPhotoUrl"
                        alt="Profile Photo" class="w-full h-full rounded-md object-cover"
                        @error="handlePhotoError" />
                    </template>
                    <!-- Placeholder -->
                    <template v-else>
                      <i class="pi pi-user text-gray-400 dark:text-grey-500 text-xl lg:text-2xl"></i>
                    </template>
                  </div>
                  <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 min-w-0 overflow-hidden">
                    <div class="space-y-2 min-w-0">
                      <div class="flex justify-between min-w-0">
                        <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Employee Name:</span>
                        <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2 min-w-0">{{
                          previewData['basic-information']?.name ||
                          previewData['basic-information']?.employee_name ||
                          previewData['basic-information']?.full_name ||
                          "N/A"
                        }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span
                          class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Divisi:</span>
                        <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                          previewData.employment_info?.divisi ||
                          previewData.employment_info?.division ||
                          previewData.employment_info?.department ||
                          "N/A"
                        }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">ID Number (KTP):</span>
                        <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                          previewData['basic-information']?.no_ktp ||
                          previewData.employment_info?.nik ||
                          "N/A"
                        }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">NIK
                          Telkom:</span>
                        <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                          previewData.employment_info?.nik_telkom ||
                          "N/A"
                        }}</span>
                      </div>
                    </div>
                    <div class="space-y-2">
                      <div class="flex justify-between">
                        <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Business Email</span>
                        <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                          previewData.employment_info?.business_email ||
                          previewData['basic-information']?.business_email ||
                          previewData['basic-information']?.email ||
                          "N/A"
                        }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span
                          class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Religion:</span>
                        <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                          previewData['basic-information']?.religion || "N/A"
                        }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Place of
                          Birth:</span>
                        <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                          previewData['basic-information']?.birth_place ||
                          previewData['basic-information']?.place_of_birth ||
                          "N/A"
                        }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Status:</span>
                        <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                          previewData.employment_info?.status ||
                          "Active"
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Dynamic Sections based on selected data types -->
                <div v-if="selectedCount > 0">
                  <div v-for="(selectedType, index) in selectedDataTypes" :key="selectedType.title" class="mb-6">
                    <div class="flex items-center space-x-2 mb-3">
                      <div class="w-6 h-6 bg-secondary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <i class="pi text-secondary-600 text-xs" :class="selectedType.icon"></i>
                      </div>
                      <h3 class="font-semibold text-gray-900 dark:text-grey-100 truncate">
                        {{ selectedType.title }}
                      </h3>
                    </div>

                    <!-- Employment Information Section -->
                    <div v-if="selectedType.title === 'Employment Information'"
                      class="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                      <div class="space-y-2">
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Position:</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData.employment_info?.position || "N/A"
                          }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Directorate:</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData.employment_info?.directorate || "N/A"
                          }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Business Unit:</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData.employment_info?.business_unit || "N/A"
                          }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Grade:</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData.employment_info?.grade || "N/A"
                          }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Grade Date:</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData.employment_info?.grade_date || "N/A"
                          }}</span>
                        </div>
                      </div>
                      <div class="space-y-2">
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Level:</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData.employment_info?.level || "N/A"
                          }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Level Date:</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData.employment_info?.level_date || "N/A"
                          }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Direct Superior:</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData.employment_info?.supervisor || "N/A"
                          }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Band Position:</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData.employment_info?.band_position || "N/A"
                          }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Band Position Date:</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData.employment_info?.band_position_date || "N/A"
                          }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Address Section -->
                    <div v-if="selectedType.title === 'Address'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <!-- Official Address (KTP) Column -->
                      <div class="space-y-2">
                        <h4 class="text-sm font-semibold text-gray-800 dark:text-grey-200 mb-3 border-b border-gray-200 dark:border-grey-600 pb-1">
                          Official Address (KTP)
                        </h4>
                        <div class="space-y-2">
                      <div class="flex justify-between items-start">
                            <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Address:</span>
                            <span class="text-sm text-gray-900 dark:text-grey-100 ml-2 whitespace-pre-line break-words text-left max-w-xs"
                          style="white-space: pre-line; word-break: break-word;">{{
                                previewData.address?.detail_ktp || 'N/A'
                          }}</span>
                      </div>
                      <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Province:</span>
                        <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                              previewData.address?.province_ktp || "N/A"
                        }}</span>
                      </div>
                      <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">City:</span>
                        <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                              previewData.address?.city_ktp || "N/A"
                        }}</span>
                      </div>
                      <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Sub District:</span>
                        <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                              previewData.address?.sub_distric_ktp || "N/A"
                        }}</span>
                      </div>
                      <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Administrative Village:</span>
                        <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                              previewData.address?.administrative_village_ktp || "N/A"
                        }}</span>
                      </div>
                      <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">RT:</span>
                        <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                              previewData.address?.rt_ktp || "N/A"
                        }}</span>
                      </div>
                      <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">RW:</span>
                        <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                              previewData.address?.rw_ktp || "N/A"
                        }}</span>
                      </div>
                      <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Street Name:</span>
                        <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                              previewData.address?.street_name_ktp || "N/A"
                        }}</span>
                      </div>
                      <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">House Number:</span>
                        <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                              previewData.address?.house_number_ktp || "N/A"
                        }}</span>
                      </div>
                      <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Postal Code:</span>
                        <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                              previewData.address?.postal_code_ktp || "N/A"
                        }}</span>
                      </div>
                      </div>
                      </div>

                      <!-- Domicile Address Column -->
                      <div class="space-y-2">
                        <h4 class="text-sm font-semibold text-gray-800 dark:text-grey-200 mb-3 border-b border-gray-200 dark:border-grey-600 pb-1">
                          Domicile Address
                        </h4>
                        <div class="space-y-2">
                          <div class="flex justify-between items-start">
                            <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Address:</span>
                            <span class="text-sm text-gray-900 dark:text-grey-100 ml-2 whitespace-pre-line break-words text-left max-w-xs"
                              style="white-space: pre-line; word-break: break-word;">{{
                                previewData.address?.detail_domicile || 'N/A'
                        }}</span>
                      </div>
                      <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Province:</span>
                        <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                              previewData.address?.province_domicile || "N/A"
                        }}</span>
                      </div>
                      <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">City:</span>
                        <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                              previewData.address?.city_domicile || "N/A"
                        }}</span>
                      </div>
                      <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Sub District:</span>
                        <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                              previewData.address?.sub_distric_domicile || "N/A"
                        }}</span>
                      </div>
                      <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">RT:</span>
                        <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                              previewData.address?.rt_domicile || "N/A"
                        }}</span>
                      </div>
                      <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">RW:</span>
                        <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                              previewData.address?.rw_domicile || "N/A"
                        }}</span>
                      </div>
                      <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Street Name:</span>
                        <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                              previewData.address?.street_name_domicile || "N/A"
                        }}</span>
                      </div>
                      <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Postal Code:</span>
                        <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                              previewData.address?.postal_code_domicile || "N/A"
                        }}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Basic Information Section -->
                    <div v-if="selectedType.title === 'Basic Information'"
                      class="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                      <div class="space-y-2">
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">NIK:</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData['basic-information']?.nik || "N/A"
                          }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Birth Date:</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData['basic-information']?.birth_date || "N/A"
                          }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Gender:</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData['basic-information']?.gender || "N/A"
                          }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Marital Status:</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData['basic-information']?.marital_status || "N/A"
                          }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Nationality:</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData['basic-information']?.nationality || "N/A"
                          }}</span>
                        </div>
                      </div>
                      <div class="space-y-2">
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Passport Number:</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData['basic-information']?.passport_number || "N/A"
                          }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Clothing Size:</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData['basic-information']?.clothing_size || "N/A"
                          }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Main Phone:</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData['basic-information']?.main_phone_number || "N/A"
                          }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Secondary Phone:</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData['basic-information']?.secondary_phone_number || "N/A"
                          }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Private Email:</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData['basic-information']?.private_email || "N/A"
                          }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Family Section -->
                    <div v-if="selectedType.title === 'Family'" class="space-y-2">
                      <div v-if="previewData.family?.family_members && previewData.family.family_members.length > 0">
                        <div v-for="(member, idx) in previewData.family.family_members" :key="idx" class="mb-4 p-3 border border-gray-200 dark:border-grey-600 rounded-md">
                          <h5 class="text-sm font-semibold text-gray-800 dark:text-grey-200 mb-2">{{ member.name || "N/A" }}</h5>
                          <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <div class="space-y-2">
                          <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Name:</span>
                            <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{ member.name || "N/A" }}</span>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Relationship:</span>
                            <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                              member.relation || "N/A"
                            }}</span>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Birth Date:</span>
                            <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                              member.birth_date || "N/A"
                            }}</span>
                          </div>
                              <div class="flex justify-between items-start">
                                <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Address:</span>
                                <span class="text-sm text-gray-900 dark:text-grey-100 ml-2 text-right max-w-xs break-words" style="word-break: break-word;">{{
                                  member.address || "N/A"
                                }}</span>
                              </div>
                            </div>
                            <div class="space-y-2">
                          <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Occupation:</span>
                            <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                              getOccupationLabel(member.occupation)
                            }}</span>
                          </div>
                          <div class="flex justify-between">
                                <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Marital Status:</span>
                            <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                              member.marital_status || member.martial_status || "N/A"
                            }}</span>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Birth Place:</span>
                            <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                              member.birth_place || "N/A"
                            }}</span>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Gender:</span>
                            <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                              member.gender || "N/A"
                            }}</span>
                          </div>
                          <div class="flex justify-between">
                                <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Telkomedika Number:</span>
                            <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                              member.no_telkomedika || "N/A"
                            }}</span>
                          </div>
                        </div>
                      </div>
                        </div>
                      </div>
                      <div v-else>
                        <div class="text-center py-4">
                          <span class="text-sm text-gray-500 dark:text-grey-400">No family members found</span>
                        </div>
                      </div>
                    </div>

                    <!-- Emergency Contact Section -->
                    <div v-if="selectedType.title === 'Emergency Contact'" class="space-y-2">
                      <div v-if="previewData.emergency_contact?.emergency_contacts && previewData.emergency_contact.emergency_contacts.length > 0">
                        <div v-for="(contact, idx) in previewData.emergency_contact.emergency_contacts" :key="idx" class="mb-4 p-3 border border-gray-200 dark:border-grey-600 rounded-md">
                          <h5 class="text-sm font-semibold text-gray-800 dark:text-grey-200 mb-2">{{ contact.emgc_name || "N/A" }}</h5>
                          <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <div class="space-y-2">
                          <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Name:</span>
                            <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                              contact.emgc_name || "N/A"
                            }}</span>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Relationship:</span>
                            <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                              contact.emgc_relationship || "N/A"
                            }}</span>
                          </div>
                            </div>
                            <div class="space-y-2">
                          <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Phone Number:</span>
                            <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                              contact.emgc_number || "N/A"
                            }}</span>
                          </div>
                          <div class="flex justify-between items-start">
                            <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Address:</span>
                            <span class="text-sm text-gray-900 dark:text-grey-100 ml-2 text-right max-w-xs break-words" style="word-break: break-word;">{{
                              contact.emgc_address || "N/A"
                            }}</span>
                          </div>
                      </div>
                        </div>
                        </div>
                        </div>
                      <div v-else>
                        <div class="text-center py-4">
                          <span class="text-sm text-gray-500 dark:text-grey-400">No emergency contacts found</span>
                        </div>
                      </div>
                    </div>

                    <!-- Education Section -->
                    <div v-if="selectedType.title === 'Education'" class="space-y-2">
                      <div v-if="previewData.education?.education_history && previewData.education.education_history.length > 0">
                        <div v-for="(edu, idx) in previewData.education.education_history" :key="idx" class="mb-4 p-3 border border-gray-200 dark:border-grey-600 rounded-md">
                          <h5 class="text-sm font-semibold text-gray-800 dark:text-grey-200 mb-2">{{ edu.edu_level || "N/A" }} | {{ edu.edu_institution || "N/A" }}</h5>
                          <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <div class="space-y-2">
                          <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Institution:</span>
                            <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                              edu.edu_institution || "N/A"
                            }}</span>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Level:</span>
                            <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{ edu.edu_level || "N/A" }}</span>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Major:</span>
                            <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{ edu.edu_major || "N/A" }}</span>
                          </div>
                            </div>
                            <div class="space-y-2">
                          <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Start Date:</span>
                            <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                              edu.edu_start_date || "N/A"
                            }}</span>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">End Date:</span>
                            <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                              edu.edu_end_date || "N/A"
                            }}</span>
                          </div>
                          <div class="flex justify-between items-center">
                                <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Status:</span>
                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2" :class="{
                              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': translateEducationStatus(edu.status) === 'Active' || translateEducationStatus(edu.status) === 'Completed' || translateEducationStatus(edu.status) === 'Graduated',
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': translateEducationStatus(edu.status) === 'Ongoing',
                              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': translateEducationStatus(edu.status) === 'Inactive',
                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200': !['Active', 'Completed', 'Graduated', 'Ongoing', 'Inactive'].includes(translateEducationStatus(edu.status))
                            }">{{
                                  translateEducationStatus(edu.status)
                            }}</span>
                          </div>
                          </div>
                          </div>
                        </div>
                      </div>
                      <div v-else>
                        <div class="text-center py-4">
                          <span class="text-sm text-gray-500 dark:text-grey-400">No education records found</span>
                        </div>
                      </div>
                    </div>

                    <!-- Payroll Account Section -->
                    <div v-if="selectedType.title === 'Payroll Account Information'" class="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                      <div class="space-y-2">
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Bank Name:</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData.payroll_account?.bank || "N/A"
                          }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Account Number:</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData.payroll_account?.number_rekening || "N/A"
                          }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Tax Number (NPWP):</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData.payroll_account?.npwp || "N/A"
                          }}</span>
                        </div>
                      </div>
                      <div class="space-y-2">
                      <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Account Holder:</span>
                        <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData.payroll_account?.holder_name || "N/A"
                        }}</span>
                      </div>
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Tax Status:</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData.payroll_account?.tax_status || "N/A"
                          }}</span>
                        </div>
                        </div>
                    </div>

                    <!-- Benefit Section -->
                    <div v-if="selectedType.title === 'Benefit'" class="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                      <div class="space-y-2">
                      <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">BPJS TK Number:</span>
                        <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                          previewData.social_security?.no_bpjs_tk || "N/A"
                        }}</span>
                      </div>
                      <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">BPJS Health Number:</span>
                        <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData.social_security?.no_bpjs || "N/A"
                        }}</span>
                      </div>
                      </div>
                      <div class="space-y-2">
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Telkomedika Card:</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData.social_security?.no_telkomedika || "N/A"
                          }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">BPJS TK Effective Date:</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData.social_security?.bpjs_tk_effective_date || "N/A"
                          }}</span>
                        </div>
                        </div>
                    </div>

                    <!-- Medical Record Section -->
                    <div v-if="selectedType.title === 'Medical Record'" class="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                      <div class="space-y-2">
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Blood Type:</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData.medical_record?.blood_type || "N/A"
                          }}</span>
                        </div>
                      <div class="flex justify-between">
                        <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Height:</span>
                        <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                          previewData.medical_record?.height || "N/A"
                          }} cm</span>
                      </div>
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Weight:</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData.medical_record?.weight || "N/A"
                          }} kg</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Health Concern:</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData.medical_record?.health_concern || "N/A"
                          }}</span>
                        </div>
                        </div>
                      <div class="space-y-2">
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Last MCU Date:</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData.medical_record?.last_mcu_date || "N/A"
                          }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Has Disability:</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData.medical_record?.has_disability || "N/A"
                          }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Head Size:</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData.medical_record?.head_size || "N/A"
                          }} cm</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Health Status:</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData.medical_record?.health_status || "N/A"
                          }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-sm font-medium text-gray-600 dark:text-grey-300 flex-shrink-0">Medical Treatment Record:</span>
                          <span class="text-sm text-gray-900 dark:text-grey-100 truncate ml-2">{{
                            previewData.medical_record?.medical_treatment_record || "N/A"
                          }}</span>
                        </div>
                        </div>
                    </div>

                    <!-- Divider between sections -->
                    <div v-if="index < selectedDataTypes.length - 1"
                      class="border-t border-gray-300 dark:border-grey-600 my-4"></div>
                  </div>
                </div>

                <!-- Document Footer -->
                <div
                  class="flex flex-col lg:flex-row lg:justify-between lg:items-center pt-4 border-t border-gray-200 dark:border-grey-600 space-y-2 lg:space-y-0">
                  <p class="text-xs text-gray-500 dark:text-grey-400 truncate text-center lg:text-left">
                    This document is auto-generated from the ESS system
                  </p>
                  <div class="text-center lg:text-right min-w-0">
                    <p class="text-xs text-gray-500 dark:text-grey-400">
                      Page 1 of 1
                    </p>
                    <p class="text-xs text-gray-500 dark:text-grey-400 truncate">
                      Printed: {{ currentDate }} {{ currentTime }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Container 3: Download/Cancel Buttons -->
        <div class="bg-white dark:bg-grey-800 p-2 lg:p-4 flex-shrink-0 rounded-br-2xl">
          <div class="flex flex-col-reverse lg:flex-row lg:justify-end space-y-2 lg:space-y-0 lg:space-x-3">
            <Button @click="$emit('close')" variant="secondary" size="default" class="w-full lg:w-auto">
              Cancel
            </Button>
            <Button @click="downloadPDF" :disabled="isDownloading" variant="primary" size="default"
              class="flex items-center justify-center space-x-2 w-full lg:w-auto">
              <i v-if="isDownloading" class="pi pi-spin pi-spinner"></i>
              <i v-else class="pi pi-download"></i>
              <span>{{
                isDownloading ? "Downloading..." : "Download PDF"
                }}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRBAC } from "~/composables/useRBAC";
import { useAuth } from "~/composables/useAuth";
import Button from "~/components/ui/Button.vue";
import Checkbox from "~/components/ui/Checkbox.vue";

const props = defineProps({
  dataTypes: {
    type: Array,
    required: true,
  },
  selectedDataTypes: {
    type: Array,
    required: true,
  },
  previewData: {
    type: Object,
    required: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  isDownloading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: null,
  },
});

const emit = defineEmits([
  "close",
  "download",
  "toggle-selection",
  "select-all",
  "clear-all",
]);

// RBAC check
const { canExportPDF } = useRBAC();

// Check permission on mount and close modal if no access
onMounted(() => {
  if (!canExportPDF.value) {
    emit('close');
  }
});

const selectedCount = computed(() => {
  return props.selectedDataTypes.length;
});

const hasAnyData = computed(() => {
  if (!props.previewData) return false;

  // Check if any selected data types have actual data
  const dataKeys = Object.keys(props.previewData);
  return dataKeys.some(key => {
    const data = props.previewData[key];
    if (!data) return false;

    // For arrays, check if not empty
    if (Array.isArray(data)) {
      return data.length > 0;
    }

    // For objects, check if has meaningful data (not just empty strings/nulls)
    if (typeof data === 'object') {
      return Object.values(data).some(value => {
        if (typeof value === 'object' && value !== null) {
          return Object.values(value).some(subValue => subValue && subValue !== '');
        }
        return value && value !== '';
      });
    }

    return true;
  });
});

const currentDate = computed(() => {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

const currentTime = computed(() => {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
});

// Education status translation
const translateEducationStatus = (status) => {
  if (!status) return "N/A";
  
  const statusMap = {
    "1": "Active",
    "0": "Inactive",
    "active": "Active",
    "inactive": "Inactive",
    "completed": "Completed",
    "ongoing": "Ongoing",
    "graduated": "Graduated"
  };
  
  return statusMap[status.toString().toLowerCase()] || status;
};

// Photo preview logic
const previewPhotoUrl = ref('');
const isLoadingPhoto = ref(false);

// Parse parent_id dan item_id dari professional_photo string
// Support comma-delimited (new) input while still understanding legacy hyphen format
const parsePhotoId = (photoString) => {
  if (!photoString || typeof photoString !== 'string') return null;
  const sanitized = photoString.trim();
  if (!sanitized) return null;

  let parent_id = '';
  let item_id = '';

  // Prefer comma-delimited identifiers: parent_id,item_id or parent_id,...,item_id
  if (sanitized.includes(',')) {
    const parts = sanitized
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    if (parts.length >= 2) {
      // Ambil bagian pertama sebagai parent_id, bagian terakhir sebagai item_id.
      // Contoh:
      // - 2 bagian: parent,item
      // - 3+ bagian: parent,folder,item => item = bagian terakhir
      parent_id = parts[0];
      item_id = parts[parts.length - 1];
    }
  }

  // Fallback to old format (split by last hyphen to avoid IDs containing '-')
  if ((!parent_id || !item_id) && sanitized.includes('-')) {
    const lastHyphenIndex = sanitized.lastIndexOf('-');
    if (lastHyphenIndex > 0 && lastHyphenIndex < sanitized.length - 1) {
      parent_id = sanitized.slice(0, lastHyphenIndex).trim();
      item_id = sanitized.slice(lastHyphenIndex + 1).trim();
    }
  }

  return parent_id && item_id ? { parent_id, item_id } : null;
};

// Get photo direct URL for preview
const getPhotoDirectUrl = async (photoString) => {
  const photoIds = parsePhotoId(photoString);
  if (!photoIds) return null;

  try {
    const { getValidAccessToken } = useAuth();
    const token = await getValidAccessToken();

    if (!token) return null;

    const downloadUrl = `/api/proxy/employee/attachments/parent/${photoIds.parent_id}/item/${photoIds.item_id}/download`;

    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) return null;

    // Check if this is an image
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      return null;
    }

    // Convert response to blob and create object URL
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    return objectUrl;
  } catch (error) {
    console.error('Failed to get photo direct URL:', error);
    return null;
  }
};

// Professional photo URL computed property
const professionalPhotoUrl = computed(() => {
  return previewPhotoUrl.value;
});

// Load preview photo when previewData changes
watch(() => props.previewData?.['basic-information']?.professional_photo, async (newPhotoUrl) => {
  // Cleanup previous URL
  if (previewPhotoUrl.value && previewPhotoUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewPhotoUrl.value);
    previewPhotoUrl.value = '';
  }

  if (!newPhotoUrl || newPhotoUrl === 'null' || newPhotoUrl === 'undefined' || newPhotoUrl.trim() === '') {
    return;
  }

  // Check if it's a regular URL or parent_id-item_id format
  if (newPhotoUrl.startsWith('http')) {
    // Regular URL, use as is
    previewPhotoUrl.value = newPhotoUrl;
    return;
  }

  // Assume it's parent_id-item_id format
  const photoIds = parsePhotoId(newPhotoUrl);
  if (!photoIds) {
    return;
  }

  isLoadingPhoto.value = true;
  try {
    const url = await getPhotoDirectUrl(newPhotoUrl);
    if (url) {
      previewPhotoUrl.value = url;
    }
  } catch (error) {
    console.error('Photo preview load error:', error);
  } finally {
    isLoadingPhoto.value = false;
  }
}, { immediate: true });

// Handle photo error
const handlePhotoError = () => {
  // Image failed to load, cleanup blob URL if it exists
  if (previewPhotoUrl.value && previewPhotoUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewPhotoUrl.value);
    previewPhotoUrl.value = '';
  }
};

// Family occupation display helper: show the raw value as provided
const getOccupationLabel = (value) => {
  const str = value === null || value === undefined ? '' : String(value).trim();
  return str === '' ? 'N/A' : str;
};

const toggleSelection = (index) => {
  emit("toggle-selection", props.dataTypes[index]);
};

const handleItemClick = (index, event) => {
  // Only handle click if it's not on the checkbox itself
  if (event.target.type !== 'checkbox') {
    toggleSelection(index);
  }
};

const selectAll = () => {
  emit("select-all");
};

const clearAll = () => {
  emit("clear-all");
};

const downloadPDF = () => {
  emit("export-pdf");
};

// Watch for previewData changes to debug
watch(() => props.previewData, (newData) => {
}, { deep: true, immediate: true });
</script>

<style scoped>
/* Custom scrollbar for PDF preview */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Line clamp utility */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Custom border radius for modal */
.modal-container {
  border-radius: 16px !important;
}
</style>
