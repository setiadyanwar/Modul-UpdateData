import { ref, computed } from 'vue'

export const useRequestHistory = () => {
  const requests = ref([])
  const isLoading = ref(false)

  // Category mapping untuk konsistensi - camelCase tanpa dash
  const CATEGORY_MAPPING = {
    'basic-information': 'Basic Information',
    'address': 'Address', 
    'emergency_contact': 'Emergency Contact',
    'payroll_account': 'Payroll Account',
    'family': 'Family',
    'education': 'Education',
    'social_security': 'Benefit',
    'medical_record': 'Medical Record',
    'employment_info': 'Employment Information',
    'employment_information': 'Employment Information'
  }

  // Generate unique request ID
  const generateRequestId = () => {
    const timestamp = new Date()
    const year = timestamp.getFullYear()
    const month = String(timestamp.getMonth() + 1).padStart(2, '0')
    const day = String(timestamp.getDate()).padStart(2, '0')
    const hours = String(timestamp.getHours()).padStart(2, '0')
    const minutes = String(timestamp.getMinutes()).padStart(2, '0')
    const seconds = String(timestamp.getSeconds()).padStart(2, '0')
    
    // Format: REQ-YYYYMMDD-HHMMSS-XXX
    const randomSuffix = Math.random().toString(36).substr(2, 3).toUpperCase()
    return `REQ-${year}${month}${day}-${hours}${minutes}${seconds}-${randomSuffix}`
  }

  // Load requests from localStorage
  const loadRequests = () => {
    try {
      const stored = localStorage.getItem('changeRequestHistory')
      requests.value = stored ? JSON.parse(stored) : []
    } catch {
      requests.value = []
    }
  }

  // Save requests to localStorage
  const saveRequests = (requestsData) => {
    try {
      const dataString = JSON.stringify(requestsData);
      localStorage.setItem('changeRequestHistory', dataString);
      
      // Trigger storage event for other components
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'changeRequestHistory',
        newValue: dataString
      }));
      
    } catch {
      // ignore localStorage persistence failure
    }
  }

  // Format status for display
  const formatStatusDisplay = (status) => {
    const statusMap = {
      'waiting_approval': 'Waiting Approval',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'draft': 'Draft'
    }
    return statusMap[status] || status
  }

  // Normalize category name
  const normalizeCategory = (category) => {
    if (!category || typeof category !== 'string') return category;
    
    // Normalize the category string
    const normalized = category
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/-/g, '_');
      
    return CATEGORY_MAPPING[normalized] || category;
  }

  // Add new request
  const addRequest = (requestData) => {
    // Load existing requests first to ensure we have the latest data
    loadRequests();
    
    // Generate change_history from changes if not provided
    let changeHistory = requestData.change_history || [];
    if (!changeHistory.length && requestData.changes) {
      changeHistory = generateChangeHistory(requestData.changes);
    }
    
    const newRequest = {
      id: generateRequestId(),
      ...requestData,
      category: normalizeCategory(requestData.category || requestData.update),
      status: 'waiting_approval',
      statusDisplay: 'Waiting Approval',
      submittedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      change_history: changeHistory
    };
    
    // Add to beginning of existing requests (APPEND, not replace)
    const updatedRequests = [newRequest, ...requests.value];
    
    // Update reactive state
    requests.value = updatedRequests;
    
    // Save to localStorage
    saveRequests(updatedRequests);
    
    // Trigger custom event for other components
    window.dispatchEvent(new CustomEvent('requestHistoryUpdated', {
      detail: { requestId: newRequest.id, type: 'submitted' }
    }));
    
    return newRequest;
  }

  // Generate change history from changes object
  const generateChangeHistory = (changes) => {
    const history = [];
    const now = new Date().toISOString();
    
    
    // Field label mapping - updated to match actual API fields
    const fieldLabels = {
      'employee_name': 'Employee Name',
      'main_phone_number': 'Phone Number',
      'secondary_phone_number': 'Secondary Phone',
      'private_email': 'Private Email',
      'business_email': 'Business Email',
      'street_name': 'Street Address',
      'city': 'City',
      'province': 'Province',
      'postal_code': 'Postal Code',
      'level': 'Education Level',
      'major': 'Major',
      'institution': 'Institution',
      'marriage_date': 'Marriage Date',
      'children_count': 'Children Count',
      'family_document': 'Family Document',
      'photo_ktp': 'KTP Photo',
      'npwp_doc': 'NPWP Document',
      'saving_book_doc': 'Saving Book Document',
      'religion': 'Religion',
      'place_of_birth': 'Place of Birth',
      'birth_date': 'Birth Date',
      'no_ktp': 'ID Number (KTP)',
      'passport_number': 'Passport Number',
      'marital_status': 'Marital Status',
      'nationality': 'Nationality',
      'clothing_size': 'Clothing Size',
      'professional_photo': 'Professional Photo'
    };
    
    if (changes && typeof changes === 'object') {
      Object.entries(changes).forEach(([field, changeData]) => {
        
        if (changeData && typeof changeData === 'object' && 'old' in changeData && 'new' in changeData) {
          const oldValue = changeData.old || '';
          const newValue = changeData.new || '';
          
          
          // Only add to history if values are different
          if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            history.push({
              field: field,
              field_label: fieldLabels[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              old_value: oldValue,
              new_value: newValue,
              changed_at: now
            });
          }
        } else {
          // Add fallback entry for invalid structure
          history.push({
            field: field,
            field_label: fieldLabels[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            old_value: 'Data structure changed',
            new_value: 'Updated via form submission',
            changed_at: now
          });
        }
      });
    }
    
    return history;
  };

  // Add draft request
  const addDraft = (requestData) => {
    // Load existing requests first to ensure we have the latest data
    loadRequests();
    
    // Generate change_history from changes if not provided
    let changeHistory = requestData.change_history || [];
    if (!changeHistory.length && requestData.changes) {
      changeHistory = generateChangeHistory(requestData.changes);
    }
    
    const draftRequest = {
      id: generateRequestId(),
      ...requestData,
      category: normalizeCategory(requestData.category || requestData.update),
      status: 'draft',
      statusDisplay: 'Draft',
      submittedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      change_history: changeHistory
    };
    
    // Add to beginning of existing requests (APPEND, not replace)
    const updatedRequests = [draftRequest, ...requests.value];
    
    // Update reactive state
    requests.value = updatedRequests;
    
    // Save to localStorage
    saveRequests(updatedRequests);
    
    // Trigger custom event for other components
    window.dispatchEvent(new CustomEvent('requestHistoryUpdated', {
      detail: { requestId: draftRequest.id, type: 'draft' }
    }));
    
    return draftRequest;
  }

  // Update existing draft to waiting approval
  const updateDraftToWaitingApproval = (requestId, updatedData) => {
    const requestIndex = requests.value.findIndex(req => req.id === requestId)
    if (requestIndex !== -1) {
      requests.value[requestIndex] = {
        ...requests.value[requestIndex],
        ...updatedData,
        category: normalizeCategory(updatedData.category || updatedData.update || requests.value[requestIndex].category),
        status: 'waiting_approval',
        statusDisplay: 'Waiting Approval',
        lastUpdated: new Date().toISOString(),
        submittedAt: new Date().toISOString() // Update submission time
      }
      saveRequests(requests.value)
      
      // Force reload to ensure data is updated
      setTimeout(() => {
        loadRequests()
      }, 100)
      
      // Trigger custom event for other components
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('requestHistoryUpdated', {
          detail: { requestId: requestId, type: 'submitted' }
        }));
      }, 200)
      
      return requests.value[requestIndex]
    }
    return null
  }

  // Update draft data (keep as draft)
  const updateDraftData = (requestId, updatedData) => {
    const requestIndex = requests.value.findIndex(req => req.id === requestId)
    if (requestIndex !== -1) {
      requests.value[requestIndex] = {
        ...requests.value[requestIndex],
        ...updatedData,
        category: normalizeCategory(updatedData.category || updatedData.update || requests.value[requestIndex].category),
        lastUpdated: new Date().toISOString()
      }
      saveRequests(requests.value)
      
      // Force reload to ensure data is updated
      setTimeout(() => {
        loadRequests()
      }, 100)
      
      // Trigger custom event for other components
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('requestHistoryUpdated', {
          detail: { requestId: requestId, type: 'draft' }
        }));
      }, 200)
      
      return requests.value[requestIndex]
    }
    return null
  }

  // Update request status
  const updateRequestStatus = (requestId, newStatus, notes = '') => {
    const requestIndex = requests.value.findIndex(req => req.id === requestId)
    if (requestIndex !== -1) {
      requests.value[requestIndex] = {
        ...requests.value[requestIndex],
        status: newStatus,
        statusDisplay: formatStatusDisplay(newStatus),
        lastUpdated: new Date().toISOString(),
        ...(notes && { reviewNotes: notes })
      }
      saveRequests(requests.value)
    }
  }

  // Get request by ID
  const getRequestById = (requestId) => {

    const found = requests.value.find(req => {
      // Try both string and number comparison
      return req.id === requestId || req.id === String(requestId) || String(req.id) === String(requestId)
    })

    return found
  }

  // Get requests by status
  const getRequestsByStatus = (status) => {
    return requests.value.filter(req => req.status === status)
  }

  // Delete request by ID
  const deleteRequest = (requestId) => {
    const updatedRequests = requests.value.filter(req => req.id !== requestId)
    requests.value = updatedRequests
    saveRequests(updatedRequests)
  }

  // Add sample data for demo (optional - only if needed for initial demo)
  const addSampleData = () => {
    // Force add sample data for demo purposes
    // This will replace existing data to ensure we have the latest demo data
    // Read and reset demo data to ensure we have the latest data with change_history
    localStorage.getItem('changeRequestHistory')
    // Force reset demo data to ensure we have the latest data with change_history
    localStorage.removeItem('changeRequestHistory')
    
    // Always regenerate demo data to ensure change_history is included
    const now = Date.now();
      const sampleRequests = [
        // Test request 2111 - Family Change (Need Revision)
        {
          id: '2111',
          request_id: '2111',
          update: 'Family',
          category: 'Family',
          request_type: 'FMY',
          reason_update: 'Update data keluarga',
          status: 'rejected',
          status_raw: '3',
          statusDisplay: 'Need Revision',
          submittedAt: new Date(now - 86400000).toISOString(),
          lastUpdated: new Date(now - 86400000).toISOString(),
          reviewer: { name: 'HR Manager' },
          review_note: 'Data keluarga perlu diperbaiki. Mohon periksa kembali data pasangan.',
          changes: {
            family: {
              old: [
                {
                  id: 'fam-001',
                  relationship: 'spouse',
                  name: 'Anisa Putri',
                  birth_date: '1992-03-15',
                  gender: 'female',
                  occupation: 'Teacher',
                  phone: '+62 812-3456-7890'
                }
              ],
              new: [
                {
                  id: 'fam-001',
                  relationship: 'spouse',
                  name: 'Anisa Putri Sari',
                  birth_date: '1992-03-15',
                  gender: 'female',
                  occupation: 'Senior Teacher',
                  phone: '+62 812-3456-7890'
                }
              ]
            }
          },
          change_history: [
            {
              field: 'family_name',
              field_label: 'Spouse Name',
              old_value: 'Anisa Putri',
              new_value: 'Anisa Putri Sari',
              changed_at: new Date(now - 86400000).toISOString()
            }
          ],
          documents: [
            {
              id: 'doc-2111',
              name: 'marriage_certificate.pdf',
              size: '2.3 MB',
              uploaded_at: new Date(now - 86400000).toISOString(),
              type: 'application/pdf'
            }
          ],
          categories: 'Family',
          // API-specific fields for proper extraction
          old_data: {
            family: [
              {
                id: 'fam-001',
                relationship: 'spouse',
                name: 'Anisa Putri',
                birth_date: '1992-03-15',
                gender: 'female',
                occupation: 'Teacher',
                phone: '+62 812-3456-7890'
              }
            ]
          },
          new_data: {
            data: [
              {
                id: 'fam-001',
                relationship: 'spouse',
                name: 'Anisa Putri Sari',
                birth_date: '1992-03-15',
                gender: 'female',
                occupation: 'Senior Teacher',
                phone: '+62 812-3456-7890'
              }
            ]
          }
        },
        // Waiting Approval - Name Change
        {
          id: 'REQ-20250806-143020-A01',
          update: 'Basic Information',
          category: 'Basic Information',
          reason_update: 'Update nama lengkap',
          status: 'waiting_approval',
          statusDisplay: 'Waiting Approval',
          submittedAt: new Date(now - 86400000).toISOString(),
          lastUpdated: new Date(now - 86400000).toISOString(),
          reviewer: { name: 'HR Manager' },
          changes: {
            employee_name: { old: 'Sarah Wijaya', new: 'Sanusi Jaya' },
          },
          change_history: [
            {
              field: 'employee_name',
              field_label: 'Employee Name',
              old_value: 'Sarah Wijaya',
              new_value: 'Sanusi Jaya',
              changed_at: new Date(now - 86400000).toISOString()
            }
          ],
          documents: [
            {
              id: 'doc-001',
              name: 'ktp_updated.pdf',
              size: '2.5 MB',
              uploaded_at: new Date(now - 86400000).toISOString(),
              type: 'application/pdf'
            }
          ]
        },
        // Waiting Approval - Phone Number Change
        {
          id: 'REQ-20250806-143021-A02',
          update: 'Basic Information',
          category: 'Basic Information',
          reason_update: 'Update nomor telepon pribadi',
          status: 'approved',
          statusDisplay: 'approved',
          submittedAt: new Date(now - 86400000).toISOString(),
          lastUpdated: new Date(now - 86400000).toISOString(),
          reviewer: { name: 'HR Manager' },
          changes: {
            main_phone_number: { old: '+62 811-2345-6789', new: '+62 812-3456-7890' },
          },
          change_history: [
            {
              field: 'main_phone_number',
              field_label: 'Phone Number',
              old_value: '+62 811-2345-6789',
              new_value: '+62 812-3456-7890',
              changed_at: new Date(now - 86400000).toISOString()
            }
          ],
          documents: [
            {
              id: 'doc-002',
              name: 'phone_verification.pdf',
              size: '1.2 MB',
              uploaded_at: new Date(now - 86400000).toISOString(),
              type: 'application/pdf'
            }
          ]
        },
        // Waiting Approval - Address Change
        {
          id: 'REQ-20250806-143022-A03',
          update: 'Address',
          category: 'Address',
          reason_update: 'Perubahan alamat tempat tinggal',
          status: 'waiting_approval',
          statusDisplay: 'Waiting Approval',
          submittedAt: new Date(now - 86400000).toISOString(),
          lastUpdated: new Date(now - 86400000).toISOString(),
          reviewer: { name: 'HR Manager' },
          changes: {
            street_name: { old: '456 Oak Avenue', new: '123 Main Street' },
            city: { old: 'Central District', new: 'Downtown District' },
            province: { old: 'Jakarta', new: 'Jakarta' },
            postal_code: { old: '10110', new: '12345' }
          },
          change_history: [
            {
              field: 'address',
              field_label: 'Address',
              old_value: '456 Oak Avenue, Central District, Jakarta, 10110',
              new_value: '123 Main Street, Downtown District, Jakarta, 12345',
              changed_at: new Date(now - 86400000).toISOString()
            }
          ],
          documents: [
            {
              id: 'doc-003',
              name: 'address_proof.pdf',
              size: '3.1 MB',
              uploaded_at: new Date(now - 86400000).toISOString(),
              type: 'application/pdf'
            }
          ]
        },
        // Waiting Approval - Business Email Change
        {
          id: 'REQ-20250806-143023-A04',
          update: 'Employment Information',
          category: 'Employment Information',
          reason_update: 'Update email bisnis',
          status: 'waiting_approval',
          statusDisplay: 'Waiting Approval',
          submittedAt: new Date(now - 86400000).toISOString(),
          lastUpdated: new Date(now - 86400000).toISOString(),
          reviewer: { name: 'HR Manager' },
          changes: {
            business_email: { old: 'setiadyanwar.work@sigma.co.id', new: 'setiadyanwar@sigma.co.id' },
          },
          change_history: [
            {
              field: 'business_email',
              field_label: 'Business Email',
              old_value: 'setiadyanwar.work@sigma.co.id',
              new_value: 'setiadyanwar@sigma.co.id',
              changed_at: new Date(now - 86400000).toISOString()
            }
          ],
          documents: [
            {
              id: 'doc-004',
              name: 'email_approval.pdf',
              size: '0.8 MB',
              uploaded_at: new Date(now - 86400000).toISOString(),
              type: 'application/pdf'
            }
          ]
        },
        // Waiting Approval - Document Upload
        {
          id: 'REQ-20250806-143024-A05',
          update: 'Family',
          category: 'Family',
          reason_update: 'Upload dokumen kartu keluarga',
          status: 'approved',
          statusDisplay: 'Approved',
          submittedAt: new Date(now - 86400000).toISOString(),
          lastUpdated: new Date(now - 86400000).toISOString(),
          reviewer: { name: 'HR Manager' },
          changes: {
            family_document: { old: '', new: 'kartu keluarga.pdf' },
          },
          change_history: [
            {
              field: 'family_document',
              field_label: 'Family Document',
              old_value: 'No document',
              new_value: 'kartu keluarga.pdf',
              changed_at: new Date(now - 86400000).toISOString()
            }
          ],
          documents: [
            {
              id: 'doc-005',
              name: 'kartu_keluarga.pdf',
              size: '2.8 MB',
              uploaded_at: new Date(now - 86400000).toISOString(),
              type: 'application/pdf'
            }
          ]
        },
        // Waiting Approval - Professional Photo Change
        {
          id: 'REQ-20250806-143025-A06',
          update: 'Basic Information',
          category: 'Basic Information',
          reason_update: 'Update foto profesional',
          status: 'approved',
          statusDisplay: 'approved',
          submittedAt: new Date(now - 86400000).toISOString(),
          lastUpdated: new Date(now - 86400000).toISOString(),
          reviewer: { name: 'HR Manager' },
          changes: {
            professional_photo: { 
              old: 'https://static.vecteezy.com/system/resources/previews/036/459/918/non_2x/ai-generated-young_caucasian_woman_corporate_portrait_png.png', 
              new: 'https://plus.unsplash.com/premium_photo-1689539137236-b68e436248de?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' 
            },
          },
          change_history: [
            {
              field: 'professional_photo',
              field_label: 'Professional Photo',
              old_value: 'Previous photo',
              new_value: 'New professional photo',
              changed_at: new Date(now - 86400000).toISOString()
            }
          ],
          documents: [
            {
              id: 'doc-006',
              name: 'professional_photo.jpg',
              size: '1.5 MB',
              uploaded_at: new Date(now - 86400000).toISOString(),
              type: 'image/jpeg'
            }
          ]
        },
        // Draft
        {
          id: 'REQ-20250806-101500-D01',
          update: 'Education',
          category: 'Education',
          reason_update: 'Perbarui jenjang pendidikan',
          status: 'approved',
          statusDisplay: 'Approved',
          submittedAt: new Date(now - 3600000).toISOString(),
          lastUpdated: new Date(now - 1800000).toISOString(),
          reviewer: { name: 'HC Staff' },
          changes: {
            level: { old: 'S1', new: 'S2' },
            major: { old: 'Informatika', new: 'Sistem Informasi' },
          },
          change_history: [
            {
              field: 'education',
              field_label: 'Education',
              old_value: 'S1 - Informatika',
              new_value: 'S2 - Sistem Informasi',
              changed_at: new Date(now - 3600000).toISOString()
            }
          ]
        },
        // Approved
        {
          id: 'REQ-20250805-091200-A02',
          update: 'Family',
          category: 'Family',
          reason_update: 'Menambahkan data pasangan',
          status: 'approved',
          statusDisplay: 'Approved',
          submittedAt: new Date(now - 172800000).toISOString(),
          lastUpdated: new Date(now - 86400000).toISOString(),
          reviewer: { name: 'HR Manager' },
          changes: {
            spouse_name: { old: '', new: 'Anisa Putri' },
            marriage_date: { old: '', new: '2022-06-10' },
          },
          change_history: [
            {
              field: 'family',
              field_label: 'Family',
              old_value: 'Single',
              new_value: 'Married - Anisa Putri (2022-06-10)',
              changed_at: new Date(now - 172800000).toISOString()
            }
          ]
        },
        // Rejected - Address Change
        {
          id: 'REQ-20250804-143000-R01',
          update: 'Address',
          category: 'Address',
          reason_update: 'Perubahan alamat domisili',
          status: 'rejected',
          statusDisplay: 'Rejected',
          submittedAt: new Date(now - 259200000).toISOString(),
          lastUpdated: new Date(now - 172800000).toISOString(),
          reviewer: { name: 'HR Manager' },
          review_note: 'Dokumen bukti alamat tidak lengkap. Mohon upload KTP dan surat keterangan domisili yang masih berlaku.',
          changes: {
            street_name: { old: 'Jl. Sudirman No. 123', new: 'Jl. Thamrin No. 456' },
            city: { old: 'Jakarta Pusat', new: 'Jakarta Selatan' },
            postal_code: { old: '12190', new: '12120' }
          },
          change_history: [
            {
              field: 'address',
              field_label: 'Address',
              old_value: 'Jl. Sudirman No. 123, Jakarta Pusat, 12190',
              new_value: 'Jl. Thamrin No. 456, Jakarta Selatan, 12120',
              changed_at: new Date(now - 259200000).toISOString()
            }
          ],
          documents: [
            {
              id: 'doc-007',
              name: 'ktp_old.pdf',
              size: '2.1 MB',
              uploaded_at: new Date(now - 259200000).toISOString(),
              type: 'application/pdf'
            }
          ]
        },
        // Rejected - Education Change
        {
          id: 'REQ-20250803-101500-R02',
          update: 'Education',
          category: 'Education',
          reason_update: 'Update gelar pendidikan',
          status: 'approved',
          statusDisplay: 'Approved',
          submittedAt: new Date(now - 345600000).toISOString(),
          lastUpdated: new Date(now - 259200000).toISOString(),
          reviewer: { name: 'HR Manager' },
          review_note: 'Ijazah yang diupload tidak sesuai dengan perubahan yang diminta. Mohon upload ijazah yang benar dan masih berlaku.',
          changes: {
            level: { old: 'D3', new: 'S1' },
            major: { old: 'Manajemen Informatika', new: 'Sistem Informasi' },
            institution: { old: 'Politeknik Negeri Jakarta', new: 'Universitas Indonesia' }
          },
          change_history: [
            {
              field: 'education',
              field_label: 'Education',
              old_value: 'D3 - Manajemen Informatika - Politeknik Negeri Jakarta',
              new_value: 'S1 - Sistem Informasi - Universitas Indonesia',
              changed_at: new Date(now - 345600000).toISOString()
            }
          ],
          documents: [
            {
              id: 'doc-008',
              name: 'ijazah_s1.pdf',
              size: '3.2 MB',
              uploaded_at: new Date(now - 345600000).toISOString(),
              type: 'application/pdf'
            }
          ]
        },
        // Rejected - Emergency Contact Change
        {
          id: 'REQ-20250802-094500-R03',
          update: 'Emergency Contact',
          category: 'Emergency Contact',
          reason_update: 'Update kontak darurat',
          status: 'approved',
          statusDisplay: 'Approved',
          submittedAt: new Date(now - 432000000).toISOString(),
          lastUpdated: new Date(now - 345600000).toISOString(),
          reviewer: { name: 'HR Manager' },
          review_note: 'Nomor telepon yang diberikan tidak dapat dihubungi. Mohon verifikasi dan berikan nomor yang aktif.',
          changes: {
            emergency_contact_name: { old: 'Budi Santoso', new: 'Siti Rahma' },
            emergency_contact_phone: { old: '+62 812-3456-7890', new: '+62 813-4567-8901' },
            relationship: { old: 'Saudara', new: 'Pasangan' }
          },
          change_history: [
            {
              field: 'emergency_contact',
              field_label: 'Emergency Contact',
              old_value: 'Budi Santoso (+62 812-3456-7890) - Saudara',
              new_value: 'Siti Rahma (+62 813-4567-8901) - Pasangan',
              changed_at: new Date(now - 432000000).toISOString()
            }
          ]
        },
      ];

      requests.value = sampleRequests;
      saveRequests(sampleRequests);
  }

  // Computed properties
  const pendingRequests = computed(() => 
    requests.value.filter(req => req.status === 'waiting_approval')
  )

  const approvedRequests = computed(() => 
    requests.value.filter(req => req.status === 'approved')
  )

  const rejectedRequests = computed(() => 
    requests.value.filter(req => req.status === 'rejected')
  )

  const draftRequests = computed(() => 
    requests.value.filter(req => req.status === 'draft')
  )

  // Reset demo data function
  const resetDemoData = () => {
    localStorage.removeItem('changeRequestHistory')
    addSampleData()
  }

  // Listen for storage events (when other tabs update localStorage)
  const setupStorageListener = () => {
    const handleStorageChange = (event) => {
      if (event.key === 'changeRequestHistory') {
        loadRequests()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }

  // Pagination functions
  const getPaginatedRequests = (allRequests, page = 1, limit = 10) => {
    
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const result = allRequests.slice(startIndex, endIndex)
    
    
    return result
  }

  const getTotalPages = (allRequests, limit = 10) => {
    const totalPages = Math.ceil(allRequests.length / limit)
    return totalPages
  }

  const getPaginationInfo = (allRequests, page = 1, limit = 10) => {
    const totalItems = allRequests.length
    const totalPages = getTotalPages(allRequests, limit)
    const startIndex = (page - 1) * limit + 1
    const endIndex = Math.min(page * limit, totalItems)
    
    const result = {
      currentPage: page,
      totalPages,
      totalItems,
      startIndex,
      endIndex,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
    
    return result
  }

  // Test function to verify data persistence
  const testDataPersistence = () => {
    
    // Add test request
    const testRequest = {
      category: 'Test Category',
      reason: 'Test Reason',
      changes: { test: 'value' }
    };
    
    const result = addRequest(testRequest);
    
    return result;
  }

  // Create test data with waiting approval status for testing
  const createTestWaitingApprovalData = () => {
    
    // Create test request for address tab (not employment info since it's always locked)
    const testRequest = {
      id: generateRequestId(),
      update: 'address',
      category: 'address',
      status: 'waiting_approval',
      reason_update: 'Test address update',
      changes: {
        street_name: { old: 'Old Street', new: 'New Street' },
        city: { old: 'Old City', new: 'New City' }
      },
      lastUpdated: new Date().toISOString(),
      date_change: new Date().toISOString()
    };
    
    
    // Add to requests
    addRequest(testRequest);
    
    
    return testRequest;
  }

  // Check data status and debug localStorage
  const checkDataStatus = () => {
    
    // Check localStorage
    const localStorageData = localStorage.getItem('changeRequestHistory');
    if (localStorageData) {
      try {
        JSON.parse(localStorageData);
      } catch {
        // invalid JSON in localStorage
      }
    }
    
    // Check reactive state
    
    // Check if they match
    const localStorageLength = localStorageData ? JSON.parse(localStorageData).length : 0;
    const reactiveLength = requests.value.length;
    
    return localStorageLength === reactiveLength;
  }

  return {
    requests,
    isLoading,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    draftRequests,
    loadRequests,
    addRequest,
    addDraft,
    updateDraftToWaitingApproval,
    updateDraftData,
    updateRequestStatus,
    getRequestById,
    getRequestsByStatus,
    deleteRequest,
    addSampleData,
    resetDemoData,
    formatStatusDisplay,
    normalizeCategory,
    CATEGORY_MAPPING,
    setupStorageListener,
    // Pagination functions
    getPaginatedRequests,
    getTotalPages,
    getPaginationInfo,
    testDataPersistence,
    checkDataStatus,
    createTestWaitingApprovalData
  }
}


