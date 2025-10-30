<template>
  <aside class="w-full lg:w-96 flex-shrink-0">
    <div class="bg-card rounded-md shadow-sm border border-grey-200 dark:border-grey-700 p-6 sticky top-8">
      <div class="flex items-start justify-between mb-4">
        <div>
          <h3 class="font-bold text-lg text-text-main">Guide to Adding an Application</h3>
          <p class="text-grey-500 text-sm">This guide is for adding apps</p>
        </div>
        <i class="pi pi-info-circle text-grey-400 text-xl"></i>
      </div>

      <div class="space-y-3">
        <div v-for="step in guideSteps" :key="step.num">
          <div 
            @click="toggleStep(step.num)"
            :class="[
              'border border-grey-200 dark:border-grey-700 rounded-md p-3 flex items-center gap-4 cursor-pointer transition-colors',
              activeStep === step.num
                ? 'bg-primary-50 dark:bg-primary-100'
                : 'hover:bg-grey-50 dark:hover:bg-card'
            ]"
          >
            <div 
              :class="[
                'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors',
                activeStep === step.num
                  ? 'bg-primary text-white'
                  : 'bg-primary-50 dark:bg-card text-primary dark:text-grey-400'
              ]"
            >
              {{ step.num }}
            </div>
            <p class="font-semibold text-text-main text-sm flex-1">{{ step.title }}</p>
            <i 
              :class="[
                'pi pi-chevron-down text-grey-400 transition-transform duration-300',
                activeStep === step.num && 'rotate-180'
              ]"
            ></i>
          </div>

          <div v-if="activeStep === step.num" class="p-4 border-l border-r border-b border-grey-200 dark:border-grey-700 rounded-b-lg bg-grey-50 dark:bg-[#232425] transition-colors">
            <slot :name="`step-${step.num}`">
              <p class="text-sm text-grey-500">Details for step {{ step.num }} will appear here.</p>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue';

const activeStep = ref(null); // State untuk melacak item yang aktif

const toggleStep = (stepNum) => {
  // Jika item yang diklik sudah aktif, tutup. Jika tidak, buka.
  activeStep.value = activeStep.value === stepNum ? null : stepNum;
};

const guideSteps = [
  { num: 1, title: "Upload the application logo" },
  { num: 2, title: "Enter the name of the application you want to add" },
  { num: 3, title: "Select an existing group or create a new one" },
  { num: 4, title: "Enter a new category or select an existing one" },
  { num: 5, title: "Enter the URL of the application you want to add" },
  { num: 6, title: "Please provide a description of the application to be added" },
];
</script>
