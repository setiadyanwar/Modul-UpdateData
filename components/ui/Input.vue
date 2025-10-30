<template>
  <div class="w-full">
    <label
      :for="label"
      class="block text-sm md:text-base font-medium text-gray-700 dark:text-grey-300 mb-1.5"
      >{{ label }}</label
    >
    <div class="mt-1 relative">
      <div
        v-if="icon"
        class="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none"
      >
        <i :class="icon" class="text-grey-400 text-base md:text-lg"></i>
      </div>
      <input
        :id="label"
        :type="inputType"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        :placeholder="placeholder"
        :disabled="disabled"
        class="block w-full px-4 md:px-4 py-3 md:py-2.5 bg-white dark:bg-grey-800 border border-gray-300 dark:border-grey-700 rounded-lg md:rounded-md shadow-sm placeholder-gray-400 dark:placeholder-grey-500 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-base md:text-sm transition-all duration-200"
        :class="[
          disabled
            ? 'bg-grey-50 dark:bg-grey-800 text-grey-500 cursor-not-allowed'
            : 'hover:border-gray-400 dark:hover:border-grey-600',
          icon ? 'pl-12 md:pl-10' : '',
        ]"
      />
      <div
        v-if="type === 'password'"
        class="absolute inset-y-0 right-0 pr-3 md:pr-4 flex items-center h-full"
      >
        <button
          type="button"
          @click.prevent="togglePasswordVisibility"
          class="text-gray-500 dark:text-grey-400 hover:text-gray-700 dark:hover:text-white p-2 rounded-md hover:bg-gray-100 dark:hover:bg-grey-700 transition-colors"
        >
          <i
            v-if="inputType === 'password'"
            class="pi pi-eye-slash text-xl md:text-lg"
          ></i>
          <i v-else class="pi pi-eye text-xl md:text-lg"></i>
        </button>
      </div>
    </div>
    <p v-if="errorMessage" class="mt-1.5 text-sm md:text-xs text-red-600 min-h-[1em]">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  modelValue: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, default: "text" },
  placeholder: { type: String, default: "" },
  errorMessage: { type: String, default: "" },
  disabled: { type: Boolean, default: false },
  icon: { type: String, default: "" },
});

defineEmits(["update:modelValue"]);

const inputType = ref(props.type);

function togglePasswordVisibility() {
  inputType.value = inputType.value === "password" ? "text" : "password";
}
</script>
