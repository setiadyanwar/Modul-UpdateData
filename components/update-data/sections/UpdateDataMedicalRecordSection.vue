<template>
  <div>
    <div v-if="isLoading">
      <MedicalRecordSkeleton />
    </div>
    <div v-else>
      <div class="w-full">
        <div class="bg-white dark:bg-grey-800 rounded-md shadow-sm border border-grey-200 dark:border-grey-700 p-6">
          <div class="flex items-center mb-6">
            <div class="w-10 h-10 bg-pink-100 dark:bg-pink-900 rounded-md flex items-center justify-center mr-3">
              <i class="pi pi-heart text-pink-600 dark:text-pink-400 text-lg"></i>
            </div>
            <h4 class="text-xl font-bold text-text-main">Medical Record</h4>
          </div>
          
          <!-- Basic Health Information -->
          <div class="space-y-6">
            <!-- Row 1: Health Status & Blood Type -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Health Status"
                type="select"
                :model-value="getHealthStatusText(modelValue.health_status_id)"
                :options="normalizedHealthStatusOptions"
                placeholder="Select health status"
                :disabled="true"
                :validation-message="errors.health_status_id"
              />
              <FormField
                label="Blood Type"
                type="select"
                :model-value="getBloodTypeText(modelValue.blood_type_id)"
                :options="normalizedBloodTypeOptions"
                placeholder="Select blood type"
                :disabled="true"
                :validation-message="errors.blood_type_id"
              />
            </div>

            <!-- Row 2: Physical Measurements -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                label="Height (cm)"
                type="number"
                :model-value="modelValue.height"
                placeholder="Enter height in cm"
                :disabled="true"
                min="100"
                max="250"
                inputmode="numeric"
                pattern="[0-9]*"
                :validation-message="errors.height"
              />
              <FormField
                label="Weight (kg)"
                type="number"
                :model-value="modelValue.weight"
                placeholder="Enter weight in kg"
                :disabled="true"
                min="30"
                max="200"
                inputmode="numeric"
                pattern="[0-9]*"
                :validation-message="errors.weight"
              />
              <FormField
                label="Head Size (cm)"
                type="number"
                :model-value="modelValue.head_size"
                placeholder="Enter head size (0-100 cm)"
                :disabled="true"
                min="0"
                max="100"
                inputmode="numeric"
                pattern="[0-9]*"
                :validation-message="errors.head_size"
              />
            </div>

            <!-- Row 3: Medical Check-up & Disability -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Last MCU Date"
                type="date"
                :model-value="modelValue.last_mcu_date"
                placeholder="Select last MCU date"
                :disabled="true"
                :allow-future="false"
                :max-date="today"
                :validation-message="errors.last_mcu_date"
              />
              <div class="flex items-center pt-6">
                <FormField label="Has Disability" type="checkbox" :model-value="modelValue.has_disability_id" :disabled="true" />
              </div>
            </div>

            <!-- Row 4: Health Concerns -->
            <div>
              <FormField label="Health Concern" type="textarea" :model-value="modelValue.health_concern" placeholder="Enter any health concerns or conditions" :disabled="true" :rows="3" />
            </div>

            <!-- Row 5: Medical Treatment Record -->
            <div>
              <FormField label="Medical Treatment Record" type="textarea" :model-value="modelValue.medical_treatment_record" placeholder="Enter medical treatment history" :disabled="true" :rows="3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import MedicalRecordSkeleton from '~/components/form/MedicalRecordSkeleton.vue';
import FormField from '~/components/form/FormField.vue';
import { reactive, watch, computed } from 'vue'
const props = defineProps({
  modelValue: { type: Object, required: true },
  editMode: { type: Boolean, required: true },
  isLoading: { type: Boolean, required: true },
  bloodTypeOptions: { type: Array, required: true },
  healthStatusOptions: { type: Array, required: true },
});
const emit = defineEmits(['update:modelValue']);
// Normalize options to ensure they have .value and .code
// For ID-based fields, value should be the code (ID), label should be the text
const normalizedHealthStatusOptions = computed(() => {

  if (!Array.isArray(props.healthStatusOptions) || props.healthStatusOptions.length === 0) {
    return []
  }

  const normalized = props.healthStatusOptions.map(o => {
    const option = {
      // value is the text used for display in dropdown
      value: o.label ?? o.value ?? o.name ?? 'Unknown',
      // code is the ID used for submission to server (ModernSelect will emit this)
      code: String(o.code ?? o.id ?? ''),
      // label is the human-readable text used for display
      label: o.label ?? o.value ?? o.name ?? 'Unknown'
    }
    return option
  })

  return normalized
})

const normalizedBloodTypeOptions = computed(() => {

  if (!Array.isArray(props.bloodTypeOptions) || props.bloodTypeOptions.length === 0) {
    return []
  }

  const normalized = props.bloodTypeOptions.map(o => {
    const option = {
      // value is the text used for display in dropdown
      value: o.label ?? o.value ?? o.name ?? 'Unknown',
      // code is the ID used for submission to server (ModernSelect will emit this)
      code: String(o.code ?? o.id ?? ''),
      // label is the human-readable text used for display
      label: o.label ?? o.value ?? o.name ?? 'Unknown'
    }
    return option
  })

  return normalized
})

function updateField(key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}

// Helper functions to map between ID and text for display
const getHealthStatusText = (id) => {
  if (!id) return '';
  const option = normalizedHealthStatusOptions.value.find(o => o.code === String(id));
  return option ? option.label : '';
};

const getBloodTypeText = (id) => {
  if (!id) return '';
  const option = normalizedBloodTypeOptions.value.find(o => o.code === String(id));
  return option ? option.label : '';
};

// Validation state
const errors = reactive({
  blood_type_id: '',
  health_status_id: '',
  height: '',
  weight: '',
  head_size: '',
  last_mcu_date: ''
})

const today = computed(() => {
  const d = new Date()
  d.setHours(0,0,0,0)
  return d
})

const validateSelect = (value, options, fieldKey, label) => {
  errors[fieldKey] = ''
  if (!value) return
  const exists = Array.isArray(options) && options.some(o => String(o.value) === String(value) || String(o.code) === String(value))
  if (!exists) errors[fieldKey] = `Invalid ${label}`
}

const validateRange = (value, min, max, fieldKey, label, unit) => {
  errors[fieldKey] = ''
  if (value === '' || value === null || value === undefined) return
  const n = parseInt(value)
  if (Number.isNaN(n)) return
  if (n < min || n > max) errors[fieldKey] = `${label} must be between ${min} and ${max}${unit ? ' ' + unit : ''}`
}

const parseToDate = (val) => {
  if (!val) return null
  if (val instanceof Date) return val
  if (typeof val === 'string') {
    // try dd-mm-yy or dd-mm-yyyy
    const parts = val.split(/[-/]/)
    if (parts.length === 3) {
      let [dd, mm, yy] = parts
      const day = parseInt(dd, 10)
      const month = parseInt(mm, 10) - 1
      let year = parseInt(yy, 10)
      if (yy.length === 2) {
        year = 2000 + year
      }
      const d = new Date(year, month, day)
      if (!isNaN(d.getTime())) return d
    }
    // fallback
    const d2 = new Date(val)
    if (!isNaN(d2.getTime())) return d2
  }
  return null
}

const validateDatePastOrToday = (value, fieldKey, label) => {
  errors[fieldKey] = ''
  if (!value) return
  const d = parseToDate(value)
  if (!d) {
    errors[fieldKey] = `Invalid ${label}`
    return
  }
  const now = new Date()
  d.setHours(0,0,0,0)
  now.setHours(0,0,0,0)
  if (d > now) errors[fieldKey] = `${label} cannot be in the future`
}

// Watchers to validate on change
watch(() => props.modelValue.health_status_id, v => validateSelect(v, normalizedHealthStatusOptions.value, 'health_status_id', 'health status'))
watch(() => props.modelValue.blood_type_id, v => validateSelect(v, normalizedBloodTypeOptions.value, 'blood_type_id', 'blood type'))
watch(() => props.modelValue.height, v => validateRange(v, 100, 250, 'height', 'Height', 'cm'))
watch(() => props.modelValue.weight, v => validateRange(v, 30, 200, 'weight', 'Weight', 'kg'))
watch(() => props.modelValue.head_size, v => validateRange(v, 0, 100, 'head_size', 'Head size', 'cm'))
watch(() => props.modelValue.last_mcu_date, v => validateDatePastOrToday(v, 'last_mcu_date', 'Last MCU date'))

// Initial validation
validateSelect(props.modelValue.health_status_id, normalizedHealthStatusOptions.value, 'health_status_id', 'health status')
validateSelect(props.modelValue.blood_type_id, normalizedBloodTypeOptions.value, 'blood_type_id', 'blood type')
validateRange(props.modelValue.height, 100, 250, 'height', 'Height', 'cm')
validateRange(props.modelValue.weight, 30, 200, 'weight', 'Weight', 'kg')
validateRange(props.modelValue.head_size, 0, 100, 'head_size', 'Head size', 'cm')
validateDatePastOrToday(props.modelValue.last_mcu_date, 'last_mcu_date', 'Last MCU date')
</script>
