<template>
  <div class="p-4 space-y-4">
    <h2 class="text-2xl font-bold">Dynamic Form Debug</h2>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div>
        <label class="block text-sm font-medium mb-1">Change Request ID</label>
        <input v-model="inputId" type="text" class="w-full border rounded px-3 py-2" placeholder="e.g. 1013 or REQ-..." />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Category</label>
        <select v-model="selectedTab" class="w-full border rounded px-3 py-2">
          <option v-for="t in tabs" :key="t.id" :value="t.id">{{ t.label }}</option>
        </select>
      </div>
      <div class="flex items-end"><button class="px-4 py-2 bg-primary text-white rounded" @click="load">Load</button></div>
    </div>

    <div v-if="error" class="text-sm text-red-600">{{ error }}</div>

    <div v-if="detail" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="space-y-3">
        <h3 class="font-semibold">Form Preview ({{ selectedTab }})</h3>
        <component
          v-if="currentFormComponent"
          :is="currentFormComponent"
          :model-value="formModel"
          :edit-mode="true"
          :disabled="false"
          :form-config="{ status: detail.status, isDraft: detail.status==='draft'||detail.status==='1' }"
          @update:model-value="v => (formModel = v)"
        />
        <div v-else class="text-sm text-grey-500">No component for tab.</div>
      </div>

      <div class="space-y-3">
        <h3 class="font-semibold">Data Inspector</h3>
        <details open>
          <summary class="cursor-pointer font-medium">detail (normalized)</summary>
          <pre class="text-xs bg-grey-50 p-2 rounded overflow-auto">{{ detail }}</pre>
        </details>
        <details open>
          <summary class="cursor-pointer font-medium">old_data</summary>
          <pre class="text-xs bg-grey-50 p-2 rounded overflow-auto">{{ detail?.old_data }}</pre>
        </details>
        <details open>
          <summary class="cursor-pointer font-medium">new_data.data</summary>
          <pre class="text-xs bg-grey-50 p-2 rounded overflow-auto">{{ detail?.new_data?.data }}</pre>
        </details>
        <details>
          <summary class="cursor-pointer font-medium">formModel (after mapping)</summary>
          <pre class="text-xs bg-grey-50 p-2 rounded overflow-auto">{{ formModel }}</pre>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, computed } from 'vue'
import { useRoute } from 'nuxt/app'
import { useApi } from '~/composables/useApi'

// Forms
import BasicInformationForm from "~/components/form/BasicInformationForm.vue";
import AddressForm from "~/components/form/AddressForm.vue";
import EmergencyContactForm from "~/components/form/EmergencyContactForm.vue";
import EmploymentInfoForm from "~/components/form/EmploymentInfoForm.vue";
import FamilyForm from "~/components/form/FamilyForm.vue";
import EducationForm from "~/components/form/EducationForm.vue";
import PayrollAccountForm from "~/components/form/PayrollAccountForm.vue";
import SocialSecurityForm from "~/components/form/SocialSecurityForm.vue";
import MedicalRecordForm from "~/components/form/MedicalRecordForm.vue";

const tabs = [
  { id: 'basic-information', label: 'Basic Information', component: BasicInformationForm },
  { id: 'address', label: 'Address', component: AddressForm },
  { id: 'emergency-contact', label: 'Emergency Contact', component: EmergencyContactForm },
  { id: 'employment-information', label: 'Employment Info', component: EmploymentInfoForm },
  { id: 'family', label: 'Family', component: FamilyForm },
  { id: 'education', label: 'Education', component: EducationForm },
  { id: 'payroll-account', label: 'Payroll Account', component: PayrollAccountForm },
  { id: 'social-security', label: 'Benefit', component: SocialSecurityForm },
  { id: 'medical-record', label: 'Medical Record', component: MedicalRecordForm },
]

const componentMap = Object.fromEntries(tabs.map(t => [t.id, t.component]))

const route = useRoute()
const { apiGet } = useApi()

const inputId = ref(route.query.id || '')
const selectedTab = ref(route.query.category || 'address')
const loading = ref(false)
const error = ref('')
const detail = shallowRef(null)
let formModel = ref({})

const currentFormComponent = computed(() => componentMap[selectedTab.value] || null)

const mapApiToFormFields = (apiData, category) => {
  if (!apiData) return {}
  switch (category) {
    case 'address':
      const pick = (...vals) => {
        for (const v of vals) {
          if (v !== undefined && v !== null && v !== '') return String(v)
        }
        return ''
      }
      return {
        official_address_detail: pick(apiData.official_address_detail, apiData.detail_ktp),
        official_address_province: pick(apiData.official_address_province, apiData.province_ktp_id, apiData.province_ktp),
        official_address_city: pick(apiData.official_address_city, apiData.city_ktp_id, apiData.city_ktp),
        official_address_postal_code: pick(apiData.official_address_postal_code, apiData.postal_code_ktp),
        official_address_subdistrict: pick(apiData.official_address_subdistrict, apiData.sub_distric_ktp),
        official_address_administrative_village: pick(apiData.official_address_administrative_village, apiData.administrative_village_ktp),
        official_address_rt: pick(apiData.official_address_rt, apiData.rt_ktp),
        official_address_rw: pick(apiData.official_address_rw, apiData.rw_ktp),
        official_address_street: pick(apiData.official_address_street, apiData.street_name_ktp),
        official_address_house_number: pick(apiData.official_address_house_number, apiData.house_number_ktp),
        domicile_address_detail: pick(apiData.domicile_address_detail, apiData.detail_domicile),
        domicile_address_province: pick(apiData.domicile_address_province, apiData.province_domicile_id, apiData.province_domicile),
        domicile_address_city: pick(apiData.domicile_address_city, apiData.city_domicile_id, apiData.city_domicile),
        domicile_address_postal_code: pick(apiData.domicile_address_postal_code, apiData.postal_code_domicile),
        domicile_address_subdistrict: pick(apiData.domicile_address_subdistrict, apiData.sub_distric_domicile),
        domicile_address_administrative_village: pick(apiData.domicile_address_administrative_village, apiData.administrative_village_domicile),
        domicile_address_rt: pick(apiData.domicile_address_rt, apiData.rt_domicile),
        domicile_address_rw: pick(apiData.domicile_address_rw, apiData.rw_domicile),
        domicile_address_street: pick(apiData.domicile_address_street, apiData.street_name_domicile),
        domicile_address_house_number: pick(apiData.domicile_address_house_number, apiData.house_number_domicile)
      }
    default:
      return apiData
  }
}

// Prefer-defined merge: overlay only when value is not null/undefined/empty string
const mergePreferDefined = (base, overlay, allowEmptyKeys = []) => {
  const out = { ...base }
  Object.keys(overlay || {}).forEach(k => {
    const v = overlay[k]
    const isEmpty = v === '' || v === null || v === undefined
    if (!isEmpty || allowEmptyKeys.includes(k)) out[k] = v
  })
  return out
}

const normalizeStatus = (st) => {
  const s = st?.status || st
  if (s === '1' || s === 1 || s === 'draft') return 'draft'
  if (s === '2' || s === 2) return 'waiting_approval'
  if (s === '3' || s === 3) return 'rejected'
  if (s === '4' || s === 4) return 'approved'
  return s || 'draft'
}

const load = async () => {
  error.value = ''
  detail.value = null
  formModel.value = {}
  if (!inputId.value) { error.value = 'Please input change request ID'; return }
  loading.value = true
  try {
    const res = await apiGet(`/api/proxy/employee/change-request/${inputId.value}`)
    if (!res?.data) { throw new Error('No data') }

    const apiReq = res.data.data || res.data
    const normalized = {
      request_id: apiReq.code || apiReq.id_change_req || apiReq.id,
      code: apiReq.code,
      status: normalizeStatus(apiReq.status),
      request_type: apiReq.request_type,
      old_data: apiReq.old_data || {},
      new_data: apiReq.new_data || {},
    }
    detail.value = normalized

    // Build model for selected tab using stable resolver order
    let resolved = {}

    if (selectedTab.value === 'address') {
      let employeeBase = {}
      try {
        const emp = await apiGet('/employee/address')
        if (emp?.success && emp.data) employeeBase = emp.data
      } catch (e) {}
      const oldMapped = normalized.old_data
      const newMapped = normalized.new_data?.data || {}
      // Use shared resolver util logic (copied mapping here)
      const baseForm = mapApiToFormFields(employeeBase, 'address')
      const oldForm = mapApiToFormFields(oldMapped, 'address')
      const newForm = mapApiToFormFields(newMapped, 'address')
      resolved = mergePreferDefined(baseForm, oldForm)
      resolved = mergePreferDefined(resolved, newForm)
    } else if (selectedTab.value === 'payroll-account') {
      const emp = await apiGet('/employee/payroll-account').catch(() => null)
      const employeeBase = emp?.data || {}
      const oldMapped = normalized.old_data || {}
      const newMapped = normalized.new_data?.data || {}
      const { mapPayroll, resolvePayroll } = await import('~/utils/dataResolver')
      resolved = resolvePayroll(employeeBase, oldMapped, newMapped)
    } else if (selectedTab.value === 'social-security') {
      const emp = await apiGet('/employee/social-securities').catch(() => null)
      const employeeBase = emp?.data || {}
      const oldMapped = normalized.old_data || {}
      const newMapped = normalized.new_data?.data || {}
      const { resolveSocial } = await import('~/utils/dataResolver')
      resolved = resolveSocial(employeeBase, oldMapped, newMapped)
    } else if (selectedTab.value === 'medical-record') {
      const emp = await apiGet('/employee/medical-record').catch(() => null)
      const employeeBase = emp?.data || {}
      const oldMapped = normalized.old_data || {}
      const newMapped = normalized.new_data?.data || {}
      const { resolveMedical } = await import('~/utils/dataResolver')
      resolved = resolveMedical(employeeBase, oldMapped, newMapped)
    } else if (selectedTab.value === 'emergency-contact') {
      const emp = await apiGet('/employee/emergency-contact').catch(() => null)
      const employeeBase = emp?.data?.emergency_contacts || []
      const oldMapped = normalized.old_data || []
      const newMapped = normalized.new_data?.data || []
      const { resolveEmergency } = await import('~/utils/dataResolver')
      resolved = resolveEmergency(employeeBase, oldMapped, newMapped)
    } else if (selectedTab.value === 'education') {
      const emp = await apiGet('/employee/education').catch(() => null)
      const employeeBase = emp?.data?.education_history || []
      const oldMapped = normalized.old_data || []
      const newMapped = normalized.new_data?.data || []
      const { resolveEducation } = await import('~/utils/dataResolver')
      resolved = resolveEducation(employeeBase, oldMapped, newMapped)
    } else {
      resolved = normalized.new_data?.data || {}
    }
    formModel.value = resolved
  } catch (e) {
    error.value = e?.message || 'Failed to load'
  } finally {
    loading.value = false
  }
}

definePageMeta({ layout: 'update-data' })
</script>


