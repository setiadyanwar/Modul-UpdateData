<template>
  <div class="space-y-2" :style="{ '--editor-height': height }">
    <label class="block text-sm font-medium text-grey-700 dark:text-grey-300 mb-2">
      {{ label }} <span v-if="required" class="text-red-500">*</span>
    </label>
    <ClientOnly>
      <QuillEditor
        ref="qe"
        v-model:content="editorContent"
        contentType="html"
        :toolbar="showToolbar ? toolbarConfig : []"
        :readOnly="disabled"
        theme="snow"
        @ready="handleReady"
        class="bg-white dark:bg-grey-700 border border-grey-300 dark:border-grey-600 rounded-lg"
      >
        <template v-if="showToolbar" #toolbar>
          <div id="consent-toolbar" class="flex flex-wrap items-center gap-1 p-2 border-b border-grey-200 dark:border-grey-600">
            <div class="ql-formats flex items-center gap-1">
              <button class="ql-bold toolbar-btn" type="button" aria-label="Bold">
                <i class="pi pi-bold"></i>
              </button>
              <button class="ql-italic toolbar-btn" type="button" aria-label="Italic">
                <i class="pi pi-italic"></i>
              </button>
              <button class="ql-underline toolbar-btn" type="button" aria-label="Underline">
                <i class="pi pi-underline"></i>
              </button>
              <button class="ql-strike toolbar-btn" type="button" aria-label="Strike">
                <i class="pi pi-strikethrough"></i>
              </button>
            </div>

            <div class="ql-formats flex items-center gap-1">
              <select class="ql-header toolbar-select" aria-label="Heading">
                <option value="false">Normal</option>
                <option value="1">H1</option>
                <option value="2">H2</option>
                <option value="3">H3</option>
              </select>
            </div>

            <div class="ql-formats flex items-center gap-1">
              <button class="ql-list toolbar-btn" value="ordered" type="button" aria-label="Ordered List">
                <i class="pi pi-list-ol"></i>
              </button>
              <button class="ql-list toolbar-btn" value="bullet" type="button" aria-label="Bullet List">
                <i class="pi pi-list"></i>
              </button>
            </div>

            <div class="ql-formats flex items-center gap-1">
              <select class="ql-align toolbar-select" aria-label="Align">
                <option selected></option>
                <option value="center"></option>
                <option value="right"></option>
                <option value="justify"></option>
              </select>
            </div>

            <div class="ql-formats flex items-center gap-1 ml-auto">
              <button class="ql-clean toolbar-btn" type="button" aria-label="Clear Formatting">
                <i class="pi pi-eraser"></i>
              </button>
            </div>
          </div>
        </template>
      </QuillEditor>
    </ClientOnly>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: 'Content'
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  height: {
    type: String,
    default: '480px'
  },
  showToolbar: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue'])

// Custom toolbar container config
const toolbarConfig = { container: '#consent-toolbar' }

const qe = ref(null)

// Clean HTML content from API
const cleanHtmlContent = (html) => {
  if (!html) return ''

  // Remove data-start and data-end attributes that may interfere with Quill
  return html
    .replace(/\s*data-start="[^"]*"/g, '')
    .replace(/\s*data-end="[^"]*"/g, '')
    .trim()
}

// Use computed property for two-way binding
const editorContent = computed({
  get() {
    const cleaned = cleanHtmlContent(props.modelValue || '')
    return cleaned
  },
  set(value) {
    emit('update:modelValue', value)
  }
})

const handleReady = () => {

  // Force set the content when editor is ready
  if (qe.value && editorContent.value) {
    const quill = qe.value.getQuill?.()
    if (quill && editorContent.value) {
      // Use setTimeout to ensure editor is fully initialized
      setTimeout(() => {
        quill.clipboard.dangerouslyPasteHTML(editorContent.value)
      }, 100)
    }
  }
}
</script>

<script>
export default {
  components: { QuillEditor }
}
</script>

<style scoped>
/* Rich text editor placeholder */
/* Quill base overrides for dark mode consistency */
:deep(.ql-container.ql-snow), :deep(.ql-toolbar.ql-snow) {
  border-color: #cbd5e1;
}
.dark :deep(.ql-container.ql-snow), .dark :deep(.ql-toolbar.ql-snow) {
  border-color: #4b5563;
}
.dark :deep(.ql-container) {
  background-color: #374151;
  color: #e5e7eb;
}

/* Editor height control */
:deep(.ql-container) {
  min-height: var(--editor-height);
}
:deep(.ql-container .ql-editor) {
  height: var(--editor-height);
  max-height: var(--editor-height);
  overflow-y: auto;
}
</style>
