<template>
  <div ref="root" class="flex items-center justify-between gap-3 mb-6 flex-nowrap">
    <h1 class="text-2xl font-bold text-text-main min-w-0 truncate">{{ title }}</h1>

    <!-- Desktop actions -->
    <div class="hidden lg:flex items-center gap-3 ml-3">
      <UiButton
        variant="underline"
        size="small"
        @click="$emit('download')"
        class="text-primary"
      >
        <i class="pi pi-download mr-2"></i>
        Download Data
      </UiButton>

      <UiButton
        v-if="!editMode"
        variant="secondary"
        size="small"
        :disabled="!canEditCompletely || !hasDataToEdit"
        :title="
          !hasDataToEdit
            ? 'No data available to edit'
            : hasDraftForCurrentCategory
              ? `Cannot edit because there is an existing draft request for ${currentCategoryDisplayName}. Please continue the draft or submit it first.`
              : activeTab === 'employment-information'
                ? 'Tab cannot be edited because it is locked by company policy.'
                : canEditCompletely
                  ? 'Edit this section'
                  : 'Tab cannot be edited because there is a pending approval/rejected request, draft, or tab is locked.'
        "
        @click="$emit('edit')"
      >
        <i :class="activeTab === 'employment-information' || activeTab === 'medical-record' ? 'pi pi-lock mr-2' : 'pi pi-pencil mr-2'"></i>
        Edit
      </UiButton>

      <UiButton
        v-if="editMode && canEditCompletely"
        variant="outline"
        size="small"
        @click="$emit('cancel')"
      >
        <i class="pi pi-times mr-2"></i>
        Cancel
      </UiButton>

      <UiButton
        v-if="editMode && canEditCompletely && !isInInsertMode"
        variant="secondary"
        size="small"
        :disabled="!hasCurrentTabChanged || !isCurrentTabFormValid || isSavingDraft"
        @click="$emit('save-draft')"
        :title="isSavingDraft ? 'Saving draft...' :
                !isCurrentTabFormValid ? 'Please fix validation errors before saving' :
                !hasCurrentTabChanged ? 'No changes to save as draft' :
                'Save current changes as draft'"
      >
        <i :class="isSavingDraft ? 'pi pi-spin pi-spinner mr-2' : 'pi pi-save mr-2'"></i>
        {{ isSavingDraft ? 'Saving...' : 'Save as Draft' }}
      </UiButton>

      <UiButton
        v-if="editMode && canEditCompletely"
        variant="primary"
        size="small"
        :disabled="!hasCurrentTabChanged || !isCurrentTabFormValid || isSubmittingUpdate"
        @click="$emit('submit')"
        :title="isSubmittingUpdate ? 'Submitting...' :
                !isCurrentTabFormValid ? 'Please fix validation errors before submitting' :
                !hasCurrentTabChanged ? 'No changes to submit' :
                'Submit changes for approval'"
      >
        <i :class="isSubmittingUpdate ? 'pi pi-spin pi-spinner mr-2' : 'pi pi-check mr-2'"></i>
        {{ isSubmittingUpdate ? 'Submitting...' : 'Update' }}
      </UiButton>
    </div>

    <!-- Mobile actions dropdown -->
    <div class="lg:hidden relative ml-3 flex-shrink-0">
      <UiButton variant="secondary" size="small" @click="toggleMenu" aria-label="More actions">
        <i class="pi pi-ellipsis-v"></i>
      </UiButton>
      <transition name="fade">
        <div
          v-if="isMenuOpen"
          class="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black/5 z-50"
        >
          <div class="py-1">
            <!-- When in edit mode: prioritize Update, then Save as Draft, Cancel, then Download -->
            <template v-if="editMode">
              <button
                class="w-full text-left px-4 py-2 text-sm rounded-md flex items-center disabled:opacity-50"
                :class="(!hasCurrentTabChanged || !isCurrentTabFormValid || isSubmittingUpdate || !canEditCompletely)
                  ? 'hover:bg-gray-50'
                  : 'bg-primary/10 text-primary hover:bg-primary/15'
                "
                :disabled="!hasCurrentTabChanged || !isCurrentTabFormValid || isSubmittingUpdate || !canEditCompletely"
                :title="isSubmittingUpdate ? 'Submitting...' :
                        !isCurrentTabFormValid ? 'Please fix validation errors before submitting' :
                        !hasCurrentTabChanged ? 'No changes to submit' :
                        'Submit changes for approval'"
                @click="emitAndClose('submit')"
              >
                <i :class="isSubmittingUpdate ? 'pi pi-spin pi-spinner mr-2' : 'pi pi-check mr-2'"></i>
                Update
              </button>

              <button
                v-if="!isInInsertMode"
                class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-md flex items-center disabled:opacity-50"
                :disabled="!hasCurrentTabChanged || !isCurrentTabFormValid || isSavingDraft || !canEditCompletely"
                :title="isSavingDraft ? 'Saving draft...' :
                        !isCurrentTabFormValid ? 'Please fix validation errors before saving' :
                        !hasCurrentTabChanged ? 'No changes to save as draft' :
                        'Save current changes as draft'"
                @click="emitAndClose('save-draft')"
              >
                <i :class="isSavingDraft ? 'pi pi-spin pi-spinner mr-2' : 'pi pi-save mr-2'"></i>
                {{ isSavingDraft ? 'Saving...' : 'Save as Draft' }}
              </button>

              <button
                class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-md flex items-center"
                @click="emitAndClose('cancel')"
              >
                <i class="pi pi-times mr-2"></i>
                Cancel
              </button>

              <div class="my-1 border-t border-gray-100"></div>
            </template>

            <!-- When not in edit mode: show Edit first -->
            <template v-if="!editMode">
              <button
                class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-md flex items-center disabled:opacity-50"
                :disabled="!canEditCompletely || !hasDataToEdit"
                :title="
                  !hasDataToEdit
                    ? 'No data available to edit'
                    : hasDraftForCurrentCategory
                      ? `Cannot edit because there is an existing draft request for ${currentCategoryDisplayName}. Please continue the draft or submit it first.`
                      : activeTab === 'employment-information'
                        ? 'Tab cannot be edited because it is locked by company policy.'
                        : canEditCompletely
                          ? 'Edit this section'
                          : 'Tab cannot be edited because there is a pending approval/rejected request, draft, or tab is locked.'
                "
                @click="emitAndClose('edit')"
              >
                <i :class="activeTab === 'employment-information' ? 'pi pi-lock mr-2' : 'pi pi-pencil mr-2'"></i>
                Edit
              </button>

              <div class="my-1 border-t border-gray-100"></div>
            </template>

            <!-- Download always available -->
            <button
              class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-md flex items-center"
              @click="emitAndClose('download')"
            >
              <i class="pi pi-download mr-2"></i>
              Download Data
            </button>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  title: { type: String, default: 'Update Personal Data' },
  editMode: { type: Boolean, required: true },
  canEditCompletely: { type: Boolean, required: true },
  hasDataToEdit: { type: Boolean, required: true },
  hasDraftForCurrentCategory: { type: [Boolean, Object], default: false },
  currentCategoryDisplayName: { type: String, default: '' },
  activeTab: { type: String, required: true },
  hasCurrentTabChanged: { type: Boolean, required: true },
  isCurrentTabFormValid: { type: Boolean, required: true },
  isSavingDraft: { type: Boolean, required: true },
  isSubmittingUpdate: { type: Boolean, required: true },
  isInInsertMode: { type: Boolean, default: false },
})

const emit = defineEmits(['download', 'edit', 'cancel', 'save-draft', 'submit'])

const isMenuOpen = ref(false)

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function emitAndClose(eventName) {
  isMenuOpen.value = false
  requestAnimationFrame(() => emit(eventName))
}

const root = ref(null)

function handleOutsideClick(event) {
  const el = root.value
  if (el && el.contains && !el.contains(event.target)) {
    isMenuOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('click', handleOutsideClick)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', handleOutsideClick)
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>


