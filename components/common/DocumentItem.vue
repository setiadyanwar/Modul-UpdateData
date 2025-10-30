<template>
  <div class="bg-grey-50 dark:bg-grey-700 rounded-lg p-3 border border-grey-200 dark:border-grey-600 transition-colors">
    <!-- Record info badge for education - positioned above everything -->
             <div v-if="recordInfo" class="mb-3">
               <div class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700 shadow-sm">
                 <i class="pi pi-graduation-cap mr-2 text-sm"></i>
                 <span class="font-semibold">{{ recordInfo.displayText }}</span>
               </div>
             </div>

    <div class="flex items-center space-x-3">
      <!-- File Type Icon -->
      <div class="flex-shrink-0">
        <component :is="getFileIcon(attachment.name)" class="w-8 h-8" />
      </div>
      
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium text-grey-900 dark:text-grey-100 truncate" :title="attachment.name">
          {{ attachment.name }}
        </p>
        <p class="text-xs text-grey-500 dark:text-grey-400 truncate">
          {{ attachment.file_size_display || formatFileSize(attachment.file_size || 0) }}
          <span v-if="attachment.document_type" class="ml-2">
            • Type {{ attachment.document_type }}
          </span>
        </p>
        <p v-if="attachment.uploaded_date" class="text-xs text-grey-400 dark:text-grey-500">
          {{ attachment.uploaded_date }}
        </p>
      </div>
    </div>
    
    <!-- Action buttons -->
    <div class="flex gap-3 mt-3 pt-3 border-t border-grey-200 dark:border-grey-600">
      <button
        @click.stop="$emit('view', attachment)"
        class="text-blue-600 hover:text-blue-700 text-xs underline transition-colors flex items-center"
        :title="`View ${attachment.name}`"
      >
        <i class="pi pi-eye mr-1"></i>
        View
      </button>
      
      <button
        v-if="canDelete"
        @click.stop="$emit('delete', attachment)"
        class="text-red-600 hover:text-red-700 text-xs underline transition-colors flex items-center"
        :title="`Delete ${attachment.name}`"
      >
        <i class="pi pi-trash mr-1"></i>
        Delete
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, h } from 'vue'
import { formatFileSize } from "~/composables/useTextFormatting.js";

// File icon components using custom SVG
const ImageIcon = () => h('div', {
  class: 'w-8 h-8 flex items-center justify-center'
}, [
  h('svg', {
    width: '14',
    height: '19',
    viewBox: '0 0 14 19',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg'
  }, [
    h('g', { 'clip-path': 'url(#clip0_594_26920)' }, [
      h('g', { 'clip-path': 'url(#clip1_594_26920)' }, [
        h('path', {
          d: 'M2.25 0.25C1.00898 0.25 0 1.25898 0 2.5V16C0 17.241 1.00898 18.25 2.25 18.25H11.25C12.491 18.25 13.5 17.241 13.5 16V5.875H9C8.37773 5.875 7.875 5.37227 7.875 4.75V0.25H2.25ZM9 0.25V4.75H13.5L9 0.25ZM2.25 9.25C2.25 8.95163 2.36853 8.66548 2.5795 8.4545C2.79048 8.24353 3.07663 8.125 3.375 8.125C3.67337 8.125 3.95952 8.24353 4.1705 8.4545C4.38147 8.66548 4.5 8.95163 4.5 9.25C4.5 9.54837 4.38147 9.83452 4.1705 10.0455C3.95952 10.2565 3.67337 10.375 3.375 10.375C3.07663 10.375 2.79048 10.2565 2.5795 10.0455C2.36853 9.83452 2.25 9.54837 2.25 9.25ZM7.59375 10.375C7.78008 10.375 7.95234 10.4664 8.05781 10.6176L11.1516 15.1176C11.2711 15.2898 11.2816 15.5148 11.1867 15.6977C11.0918 15.8805 10.8984 16 10.6875 16H7.59375H6.1875H4.5H2.8125C2.60859 16 2.42227 15.891 2.32383 15.7152C2.22539 15.5395 2.22539 15.3215 2.33086 15.1492L4.01836 12.3367C4.12031 12.168 4.30312 12.0625 4.5 12.0625C4.69688 12.0625 4.87969 12.1645 4.98164 12.3367L5.43164 13.0891L7.12969 10.6211C7.23516 10.4699 7.40742 10.3785 7.59375 10.3785V10.375Z',
          fill: '#3B82F6'
        })
      ])
    ]),
    h('defs', {}, [
      h('clipPath', { id: 'clip0_594_26920' }, [
        h('rect', {
          width: '13.5',
          height: '18',
          fill: 'white',
          transform: 'translate(0 0.25)'
        })
      ]),
      h('clipPath', { id: 'clip1_594_26920' }, [
        h('path', {
          d: 'M0 0.25H13.5V18.25H0V0.25Z',
          fill: 'white'
        })
      ])
    ])
  ])
])

const PdfIcon = () => h('div', {
  class: 'w-8 h-8 flex items-center justify-center'
}, [
  h('svg', {
    width: '18',
    height: '18',
    viewBox: '0 0 18 18',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg'
  }, [
    h('g', { 'clip-path': 'url(#clip0_40001075_26890)' }, [
      h('g', { 'clip-path': 'url(#clip1_40001075_26890)' }, [
        h('path', {
          d: 'M0 2.25C0 1.00898 1.00898 0 2.25 0H7.875V4.5C7.875 5.12227 8.37773 5.625 9 5.625H13.5V10.6875H6.1875C4.94648 10.6875 3.9375 11.6965 3.9375 12.9375V18H2.25C1.00898 18 0 16.991 0 15.75V2.25ZM13.5 4.5H9V0L13.5 4.5ZM6.1875 12.375H7.3125C8.39883 12.375 9.28125 13.2574 9.28125 14.3438C9.28125 15.4301 8.39883 16.3125 7.3125 16.3125H6.75V17.4375C6.75 17.7469 6.49687 18 6.1875 18C5.87813 18 5.625 17.7469 5.625 17.4375V15.75V12.9375C5.625 12.6281 5.87813 12.375 6.1875 12.375ZM7.3125 15.1875C7.78008 15.1875 8.15625 14.8113 8.15625 14.3438C8.15625 13.8762 7.78008 13.5 7.3125 13.5H6.75V15.1875H7.3125ZM10.6875 12.375H11.8125C12.7441 12.375 13.5 13.1309 13.5 14.0625V16.3125C13.5 17.2441 12.7441 18 11.8125 18H10.6875C10.3781 18 10.125 17.7469 10.125 17.4375V12.9375C10.125 12.6281 10.3781 12.375 10.6875 12.375ZM11.8125 16.875C12.1219 16.875 12.375 16.6219 12.375 16.3125V14.0625C12.375 13.7531 12.1219 13.5 11.8125 13.5H11.25V16.875H11.8125ZM14.625 12.9375C14.625 12.6281 14.8781 12.375 15.1875 12.375H16.875C17.1844 12.375 17.4375 12.6281 17.4375 12.9375C17.4375 13.2469 17.1844 13.5 16.875 13.5H15.75V14.625H16.875C17.1844 14.625 17.4375 14.8781 17.4375 15.1875C17.4375 15.4969 17.1844 15.75 16.875 15.75H15.75V17.4375C15.75 17.7469 15.4969 18 15.1875 18C14.8781 18 14.625 17.7469 14.625 17.4375V15.1875V12.9375Z',
          fill: '#EF4444'
        })
      ])
    ]),
    h('defs', {}, [
      h('clipPath', { id: 'clip0_40001075_26890' }, [
        h('rect', {
          width: '18',
          height: '18',
          fill: 'white'
        })
      ]),
      h('clipPath', { id: 'clip1_40001075_26890' }, [
        h('path', {
          d: 'M0 0H18V18H0V0Z',
          fill: 'white'
        })
      ])
    ])
  ])
])

const DocumentIcon = () => h('div', {
  class: 'w-8 h-8 bg-gray-500 rounded flex items-center justify-center'
}, [
  h('svg', {
    class: 'w-5 h-5 text-white',
    fill: 'currentColor',
    viewBox: '0 0 20 20'
  }, [
    h('path', {
      'fill-rule': 'evenodd',
      d: 'M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z',
      'clip-rule': 'evenodd'
    })
  ])
])

const ExcelIcon = () => h('div', {
  class: 'w-8 h-8 bg-green-500 rounded flex items-center justify-center'
}, [
  h('svg', {
    class: 'w-5 h-5 text-white',
    fill: 'currentColor',
    viewBox: '0 0 20 20'
  }, [
    h('path', {
      'fill-rule': 'evenodd',
      d: 'M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z',
      'clip-rule': 'evenodd'
    })
  ])
])

const ArchiveIcon = () => h('div', {
  class: 'w-8 h-8 bg-yellow-500 rounded flex items-center justify-center'
}, [
  h('svg', {
    class: 'w-5 h-5 text-white',
    fill: 'currentColor',
    viewBox: '0 0 20 20'
  }, [
    h('path', {
      d: 'M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4V5h12v10z'
    }),
    h('path', {
      d: 'M6 7h8v2H6V7zm0 4h8v2H6v-2z'
    })
  ])
])

const props = defineProps({
  attachment: { type: Object, required: true },
  canDelete: { type: Boolean, default: false },
  recordInfo: { type: Object, default: null }
})

defineEmits(['view', 'delete'])

const getFileIcon = (filename) => {
  if (!filename) {
    return DocumentIcon
  }
  
  const extension = filename.toLowerCase().split('.').pop()
  
  switch (extension) {
    case 'pdf':
      return PdfIcon
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'webp':
    case 'svg':
      return ImageIcon
    case 'doc':
    case 'docx':
    case 'txt':
    case 'rtf':
      return DocumentIcon
    case 'xls':
    case 'xlsx':
    case 'csv':
      return ImageIcon
    case 'ppt':
    case 'pptx':
      return DocumentIcon
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return ArchiveIcon
    default:
      return DocumentIcon
  }
}
</script>
