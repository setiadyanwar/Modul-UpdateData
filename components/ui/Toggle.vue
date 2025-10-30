<template>
  <label class="flex items-center cursor-pointer" :class="containerClass">
    <!-- Toggle switch -->
    <div class="relative">
      <input
        :checked="modelValue"
        @change="$emit('update:modelValue', $event.target.checked)"
        type="checkbox"
        class="sr-only peer"
        :disabled="disabled"
      />
      <div
        class="w-11 h-6 bg-grey-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-grey-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-grey-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-grey-600 peer-checked:bg-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"
        :class="{
          'opacity-50 cursor-not-allowed': disabled,
        }"
      ></div>
    </div>

    <!-- Label text -->
    <span
      v-if="label"
      class="text-sm font-medium text-text-main"
      :class="[labelClass, { 'opacity-50': disabled }]"
      style="margin-left: 14px"
    >
      {{ label }}
    </span>
  </label>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    default: "",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  containerClass: {
    type: String,
    default: "",
  },
  labelClass: {
    type: String,
    default: "",
  },
});

defineEmits(["update:modelValue"]);
</script>
