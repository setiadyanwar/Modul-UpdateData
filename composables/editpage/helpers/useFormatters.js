export function useFormatters() {

  const formatDate = (dateString) => {
    if (!dateString) return ''

    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString

      return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date)
    } catch (error) {
      console.error('Error formatting date:', error)
      return dateString
    }
  }

  const formatTime = (timeString) => {
    if (!timeString) return ''

    try {
      const date = new Date(timeString)
      if (isNaN(date.getTime())) return timeString

      return new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(date)
    } catch (error) {
      console.error('Error formatting time:', error)
      return timeString
    }
  }

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return ''

    try {
      const date = new Date(dateTimeString)
      if (isNaN(date.getTime())) return dateTimeString

      return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(date)
    } catch (error) {
      console.error('Error formatting datetime:', error)
      return dateTimeString
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatCurrency = (amount, currency = 'IDR') => {
    if (!amount && amount !== 0) return ''

    try {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount)
    } catch (error) {
      console.error('Error formatting currency:', error)
      return amount.toString()
    }
  }

  const formatNumber = (number) => {
    if (!number && number !== 0) return ''

    try {
      return new Intl.NumberFormat('id-ID').format(number)
    } catch (error) {
      console.error('Error formatting number:', error)
      return number.toString()
    }
  }

  const formatPhoneNumber = (phone) => {
    if (!phone) return ''

    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '')

    // Format Indonesian phone numbers
    if (cleaned.startsWith('62')) {
      // International format
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 9)} ${cleaned.slice(9)}`
    } else if (cleaned.startsWith('0')) {
      // Local format
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8)}`
    }

    return phone
  }

  const formatNIK = (nik) => {
    if (!nik) return ''

    const cleaned = nik.replace(/\D/g, '')
    if (cleaned.length === 16) {
      return `${cleaned.slice(0, 6)}.${cleaned.slice(6, 12)}.${cleaned.slice(12)}`
    }

    return nik
  }

  const formatFieldLabel = (field) => {
    if (!field) return ''

    const labels = {
      'name': 'Nama',
      'nik': 'NIK',
      'business_email': 'Email Bisnis',
      'birth_date': 'Tanggal Lahir',
      'gender': 'Jenis Kelamin',
      'marital_status': 'Status Pernikahan',
      'official_address_detail': 'Alamat KTP',
      'official_address_province': 'Provinsi KTP',
      'official_address_city': 'Kota KTP',
      'domicile_address_detail': 'Alamat Domisili',
      'domicile_address_province': 'Provinsi Domisili',
      'domicile_address_city': 'Kota Domisili',
      'bank_name': 'Nama Bank',
      'bank_account_number': 'Nomor Rekening',
      'bank_account_holder_name': 'Nama Pemegang Rekening',
      'npwp': 'NPWP',
      'bpjs_kesehatan': 'BPJS Kesehatan',
      'bpjs_ketenagakerjaan': 'BPJS Ketenagakerjaan',
      'edu_level_id': 'Tingkat Pendidikan',
      'edu_institution_id': 'Institusi Pendidikan',
      'edu_major_id': 'Jurusan',
      'graduation_year': 'Tahun Lulus',
      'emergency_name': 'Nama Kontak Darurat',
      'emergency_phone': 'Telepon Kontak Darurat',
      'emergency_relationship': 'Hubungan Kontak Darurat',
      'family_name': 'Nama Keluarga',
      'family_relationship': 'Hubungan Keluarga',
      'family_birth_date': 'Tanggal Lahir Keluarga'
    }

    return labels[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return {
    formatDate,
    formatTime,
    formatDateTime,
    formatFileSize,
    formatCurrency,
    formatNumber,
    formatPhoneNumber,
    formatNIK,
    formatFieldLabel
  }
}