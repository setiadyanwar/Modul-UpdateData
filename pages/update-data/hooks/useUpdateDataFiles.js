import { ref } from 'vue';

export const useUpdateDataFiles = (state, { uploadAttachment, showError }) => {
  const {
    basicInfoUploadedFiles,
    basicInfoProfessionalPhoto,
    basicInfoAttachmentsChanged,
    addressUploadedFiles,
    payrollAccountUploadedFiles,
    socialSecurityUploadedFiles,
    familyUploadedFiles
  } = state;

  const handlePhotoUpload = (photoData, employeeData) => {
    employeeData.value = {
      ...employeeData.value,
      professional_photo: photoData.dataUrl,
    };
  };

  const handleBasicInfoFilesChanged = (files) => {
    basicInfoUploadedFiles.value = files || [];
    basicInfoAttachmentsChanged.value = true;
  };

  const handleAddressFilesChanged = (files) => {
    addressUploadedFiles.value = files || [];
  };

  const handlePayrollAccountFilesChanged = (files) => {
    payrollAccountUploadedFiles.value = files || [];
  };

  const handleSocialSecurityFilesChanged = (files) => {
    socialSecurityUploadedFiles.value = files || [];
  };

  const handleFamilyFilesChanged = (files) => {
    familyUploadedFiles.value = files || [];
  };

  const handleProfessionalPhotoChanged = (file) => {
    basicInfoProfessionalPhoto.value = file || null;
    basicInfoAttachmentsChanged.value = true;
  };

  const clearBasicInfoFiles = (basicInfoSectionRef) => {
    basicInfoUploadedFiles.value = [];
    basicInfoProfessionalPhoto.value = null;
    basicInfoAttachmentsChanged.value = false;
    if (basicInfoSectionRef?.value) {
      basicInfoSectionRef.value.clearFiles?.();
    }
  };

  const uploadAttachmentsForSubmit = async (requestId, currentTab) => {
    const uploadPromises = [];

    // Basic Information
    if (currentTab === 'basic-information') {
      if (basicInfoUploadedFiles.value.length > 0) {
        for (const fileData of basicInfoUploadedFiles.value) {
          uploadPromises.push(
            uploadAttachment(requestId, fileData.file, ['3']).catch(error => {
              showError(`Failed to upload KTP document: ${error.message}`);
              return null;
            })
          );
        }
      }

      if (basicInfoProfessionalPhoto.value) {
        uploadPromises.push(
          uploadAttachment(requestId, basicInfoProfessionalPhoto.value, ['1']).catch(error => {
            showError(`Failed to upload professional photo: ${error.message}`);
            return null;
          })
        );
      }
    }

    // Address
    if (currentTab === 'address' && addressUploadedFiles.value?.length > 0) {
      for (const fileData of addressUploadedFiles.value) {
        uploadPromises.push(
          uploadAttachment(requestId, fileData.file, ['3']).catch(error => {
            showError(`Failed to upload Address KTP document: ${error.message}`);
            return null;
          })
        );
      }
    }

    // Payroll Account
    if (currentTab === 'payroll-account' && payrollAccountUploadedFiles.value?.length > 0) {
      for (const fileData of payrollAccountUploadedFiles.value) {
        uploadPromises.push(
          uploadAttachment(requestId, fileData.file, [fileData.documentType]).catch(error => {
            showError(`Failed to upload document: ${error.message}`);
            return null;
          })
        );
      }
    }

    // Social Security
    if (currentTab === 'social-security' && socialSecurityUploadedFiles.value?.length > 0) {
      for (const fileData of socialSecurityUploadedFiles.value) {
        uploadPromises.push(
          uploadAttachment(requestId, fileData.file, [fileData.documentType]).catch(error => {
            showError(`Failed to upload document: ${error.message}`);
            return null;
          })
        );
      }
    }

    // Family
    if (currentTab === 'family' && familyUploadedFiles.value?.length > 0) {
      for (const fileData of familyUploadedFiles.value) {
        const docTypeCode = fileData.documentType || '2';
        uploadPromises.push(
          uploadAttachment(requestId, fileData.file, [docTypeCode]).catch(error => {
            showError(`Failed to upload KK document: ${error.message}`);
            return null;
          })
        );
      }
    }

    if (uploadPromises.length > 0) {
      await Promise.allSettled(uploadPromises);
    }
  };

  return {
    handlePhotoUpload,
    handleBasicInfoFilesChanged,
    handleAddressFilesChanged,
    handlePayrollAccountFilesChanged,
    handleSocialSecurityFilesChanged,
    handleFamilyFilesChanged,
    handleProfessionalPhotoChanged,
    clearBasicInfoFiles,
    uploadAttachmentsForSubmit
  };
};
