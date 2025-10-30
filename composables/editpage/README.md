# Edit Page Composables

Struktur composables yang telah direorganisasi untuk halaman edit update data.

## Struktur Folder

```
composables/editpage/
├── categories/           # Composables untuk setiap kategori data
│   ├── useEducation.js      # Logika untuk education
│   ├── usePayroll.js        # Logika untuk payroll account
│   ├── useEmergencyContact.js # Logika untuk emergency contact
│   └── useFamily.js         # Logika untuk family data
├── helpers/             # Helper functions dan utilities
│   ├── useTabHelpers.js     # Helper untuk tab management
│   └── useFormatters.js     # Helper untuk formatting data
├── modals/              # Modal management
│   └── useModalManagement.js # Logika untuk semua modal
├── validation/          # Validasi form
│   └── useFormValidation.js # Validasi untuk setiap kategori
├── documents/           # Document management
│   └── useDocumentManagement.js # Upload, preview, delete dokumen
├── api/                 # API operations
│   └── useEditPageApi.js    # Semua operasi API
└── useEditPageComposed.js   # Main composable yang menggabungkan semua
```

## Main Composable

`useEditPageComposed.js` adalah composable utama yang menggabungkan semua functionality:

- Menggunakan semua composables kategori
- Mengatur state management utama
- Menangani event handlers
- Menyediakan computed properties
- Mengelola lifecycle page

## Category Composables

### useEducation.js
- `enrichEducationDataWithLabels()` - Enrich data dengan label dari master data
- `mapAttachmentsToEducationRecords()` - Map attachments ke records
- `validateEducationAttachments()` - Validasi attachments

### usePayroll.js
- `mapPayrollApiToFormFields()` - Mapping API data ke form
- `mapPayrollFormToAPI()` - Mapping form data ke API
- `getPayrollRequiredDocuments()` - Daftar dokumen required

### useEmergencyContact.js
- `mapEmergencyContactApiToFormFields()` - Mapping API data
- `validateEmergencyContact()` - Validasi emergency contact

### useFamily.js
- `mapFamilyApiToFormFields()` - Mapping API data
- `validateFamily()` - Validasi family data

## Helper Composables

### useTabHelpers.js
- `getTabIcon()` - Icon untuk setiap tab
- `getRequestTypeFromTab()` - Convert tab ke request type
- `tabConfigs` - Konfigurasi lengkap semua tab

### useFormatters.js
- `formatDate()` - Format tanggal
- `formatPhoneNumber()` - Format nomor telepon
- `formatFieldLabel()` - Format label field

## Feature Composables

### useModalManagement.js
- Mengelola semua modal (change history, submit revision, etc)
- Event handlers untuk open/close modal

### useFormValidation.js
- Validasi untuk setiap kategori form
- `validateAllTabs()` - Validasi semua tab sekaligus

### useDocumentManagement.js
- Upload, preview, delete dokumen
- Type selector dan konfigurasi dokumen
- Document count management

### useEditPageApi.js
- Semua operasi API (load, save, submit)
- Error handling dan loading states

## Usage

```vue
<script setup>
import { useEditPageComposed } from '~/composables/editpage/useEditPageComposed'

const editPage = useEditPageComposed()

// Access all functionality through editPage object
const {
  // State
  requestDetail,
  formData,
  activeTab,

  // Features
  education,
  payroll,
  documentManagement,
  modalManagement,

  // Handlers
  handleTabChange,
  handleSubmitDirect,
  handleSaveAsDraft
} = editPage
</script>
```

## Benefits

1. **Organized by feature** - Setiap kategori data memiliki composable terpisah
2. **Reusable** - Composables dapat digunakan di komponen lain
3. **Maintainable** - Code lebih mudah di-maintain dan debug
4. **Type safe** - Lebih mudah untuk menambahkan TypeScript di masa depan
5. **Testable** - Setiap composable dapat ditest secara terpisah
6. **Clear separation** - Logic terpisah dari UI components