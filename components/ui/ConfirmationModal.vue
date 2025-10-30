<template>
  <!-- Modal Backdrop -->
  <Teleport to="body">
    <div
      v-if="isVisible || isOpen"
      class="fixed inset-0 z-[9999] overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >

      <!-- Background overlay -->
      <div
        class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        @click="$emit('close')"
      ></div>

      <!-- Modal panel -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div
          class="relative transform overflow-hidden rounded-md bg-white dark:bg-grey-800 text-left shadow-xl transition-all w-full max-w-md"
        >
          <!-- Close button -->
          <button
            type="button"
            @click="$emit('close')"
            class="absolute top-4 right-4 text-grey-400 hover:text-grey-600 dark:hover:text-grey-300 text-xl z-10"
          >
            <i class="pi pi-times"></i>
          </button>

          <!-- Modal content -->
          <div class="px-6 py-8 text-center">
            <!-- Icon -->
            <div
              :class="iconContainerClass"
              class="mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-6"
            >
              <i :class="iconClass" class="text-2xl"></i>
            </div>

            <!-- Title -->
            <h3
              class="text-lg font-semibold text-grey-900 dark:text-white mb-2"
            >
              {{ title }}
            </h3>

            <!-- Message -->
            <p class="text-sm text-grey-500 dark:text-grey-400 mb-6">
              {{ message }}
            </p>

            <!-- Privacy Consent for Submit Revision -->
            <div v-if="variant === 'submit-revision'" class="mb-6">
              <!-- Expandable Consent Content -->
              <div class="space-y-2">
                <!-- Scrollable consent content - only shown when expanded -->
                <div
                  v-if="showConsentDetail"
                  class="max-h-64 overflow-y-auto border border-grey-200 dark:border-grey-600 rounded-md p-3 space-y-2 text-left"
                >
                  <div class="flex items-start space-x-2">
                    <span class="text-xs font-medium text-text-main">1.</span>
                    <div class="flex-1">
                      <h5 class="text-xs font-medium text-text-main mb-1">
                        Penggunaan Data
                      </h5>
                      <p class="text-xs text-text-secondary">
                        Data pribadi Anda digunakan untuk keperluan
                        administrasi, pengelolaan sumber daya manusia, dan
                        pemenuhan kewajiban hukum
                      </p>
                    </div>
                  </div>

                  <div class="flex items-start space-x-2">
                    <span class="text-xs font-medium text-text-main">2.</span>
                    <div class="flex-1">
                      <h5 class="font-medium text-text-main mb-1">
                        Data Collection
                      </h5>
                      <p class="text-text-secondary">
                        We collect personal data including but not limited to:
                        name, contact information, employment details,
                        identification documents, and other relevant information
                        necessary for employment purposes.
                      </p>
                    </div>
                  </div>

                  <div class="flex items-start space-x-2">
                    <span class="text-xs font-medium text-text-main">3.</span>
                    <div class="flex-1">
                      <h5 class="font-medium text-text-main mb-1">
                        Purpose of Processing
                      </h5>
                      <p class="text-text-secondary mb-2">
                        Your personal data will be processed for the following
                        purposes:
                      </p>
                      <ul
                        class="list-disc list-inside text-text-secondary ml-4 space-y-1"
                      >
                        <li>Employment administration and management</li>
                        <li>Human resource management and development</li>
                        <li>
                          Compliance with legal and regulatory requirements
                        </li>
                        <li>Communication and correspondence</li>
                        <li>Security and access control</li>
                      </ul>
                    </div>
                  </div>

                  <div class="flex items-start space-x-2">
                    <span class="text-xs font-medium text-text-main">4.</span>
                    <div class="flex-1">
                      <h5 class="font-medium text-text-main mb-1">
                        Data Sharing
                      </h5>
                      <p class="text-text-secondary">
                        Your data may be shared with authorized personnel,
                        third-party service providers, and regulatory
                        authorities as required by law or for legitimate
                        business purposes.
                      </p>
                    </div>
                  </div>

                  <div class="flex items-start space-x-2">
                    <span class="text-xs font-medium text-text-main">5.</span>
                    <div class="flex-1">
                      <h5 class="font-medium text-text-main mb-1">
                        Data Security
                      </h5>
                      <p class="text-text-secondary">
                        We implement appropriate technical and organizational
                        measures to protect your personal data against
                        unauthorized access, alteration, disclosure, or
                        destruction.
                      </p>
                    </div>
                  </div>

                  <div class="flex items-start space-x-2">
                    <span class="text-xs font-medium text-text-main">6.</span>
                    <div class="flex-1">
                      <h5 class="font-medium text-text-main mb-1">
                        Data Retention
                      </h5>
                      <p class="text-text-secondary">
                        Your personal data will be retained for as long as
                        necessary to fulfill the purposes outlined above, or as
                        required by applicable laws and regulations.
                      </p>
                    </div>
                  </div>

                  <div class="flex items-start space-x-2">
                    <span class="text-xs font-medium text-text-main">7.</span>
                    <div class="flex-1">
                      <h5 class="font-medium text-text-main mb-1">
                        Your Rights
                      </h5>
                      <p class="text-text-secondary">
                        You have the right to access, correct, update, or delete
                        your personal data, subject to legal and contractual
                        obligations. You may also withdraw your consent at any
                        time.
                      </p>
                    </div>
                  </div>

                  <div class="flex items-start space-x-2">
                    <span class="text-xs font-medium text-text-main">8.</span>
                    <div class="flex-1">
                      <h5 class="font-medium text-text-main mb-1">
                        Contact Information
                      </h5>
                      <p class="text-text-secondary">
                        For any questions regarding this privacy policy or your
                        personal data, please contact our Data Protection
                        Officer at privacy@company.com
                      </p>
                    </div>
                  </div>

                  <div
                    class="bg-blue-50 dark:bg-blue-900/20 rounded-md p-3 mt-4"
                  >
                    <p class="text-xs text-text-secondary">
                      <strong>Note:</strong> By checking the consent box, you
                      confirm that you have read, understood, and agree to the
                      terms outlined in this privacy policy.
                    </p>
                  </div>
                </div>

                <!-- Fixed checkbox section -->
                <label
                  class="flex items-start text-left text-sm text-grey-600 dark:text-grey-400"
                >
                  <Checkbox
                    :model-value="consentGiven"
                    @update:model-value="consentGiven = $event"
                    variant="modal"
                  />
                  <span class="ml-2">
                    I consent to the transmission and processing of personal
                    data in accordance with the privacy policy.
                    <button
                      type="button"
                      class="text-blue-600 dark:text-blue-400 hover:underline font-medium ml-1"
                      @click="showConsentDetail = !showConsentDetail"
                    >
                      {{
                        showConsentDetail
                          ? "hide full content"
                          : "view full content"
                      }}
                    </button>
                  </span>
                </label>
              </div>
            </div>

            <!-- Action buttons -->
            <div v-if="variant === 'submit-revision'" class="flex gap-3">
              <!-- Cancel button -->
              <button
                type="button"
                @click="$emit('close')"
                class="flex-1 inline-flex items-center justify-center px-4 py-3 border border-grey-300 dark:border-grey-600 text-sm font-medium rounded-md text-grey-700 dark:text-grey-300 bg-white dark:bg-grey-700 hover:bg-grey-50 dark:hover:bg-grey-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                cancel
              </button>

              <!-- Submit Revision button -->
              <button
                type="button"
                @click="$emit('submit-revision')"
                :disabled="!consentGiven"
                :class="[
                  'flex-1 inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
                  consentGiven
                    ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                    : 'bg-grey-400 cursor-not-allowed',
                ]"
              >
                Submit Revision
              </button>
            </div>

            <!-- Default action buttons -->
            <div v-else class="flex gap-3">
              <!-- Save as Draft button -->
              <button
                type="button"
                @click="$emit('save-draft')"
                class="flex-1 inline-flex items-center justify-center px-4 py-3 border border-grey-300 dark:border-grey-600 text-sm font-medium rounded-md text-grey-700 dark:text-grey-300 bg-white dark:bg-grey-700 hover:bg-grey-50 dark:hover:bg-grey-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                <i class="pi pi-save mr-2"></i>
                {{ saveButtonText }}
              </button>

              <!-- Continue button -->
              <button
                type="button"
                @click="$emit('continue')"
                class="flex-1 inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                {{ continueButtonText }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false,
  },
  isOpen: {
    type: Boolean,
    default: false,
  },
  variant: {
    type: String,
    default: "default", // 'default', 'submit-revision'
    validator: (value) => ["default", "submit-revision"].includes(value),
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  saveButtonText: {
    type: String,
    default: "Save as Draft",
  },
  continueButtonText: {
    type: String,
    default: "Continue",
  },
});

const emit = defineEmits([
  "close",
  "save-draft",
  "continue",
  "submit-revision",
  "view-privacy",
]);

const consentGiven = ref(false);
const showConsentDetail = ref(false);

// Computed properties for dynamic styling based on variant
const iconContainerClass = computed(() => {
  switch (props.variant) {
    case "submit-revision":
      return "bg-blue-100 dark:bg-blue-900/20";
    default:
      return "bg-red-100 dark:bg-red-900/20";
  }
});

const iconClass = computed(() => {
  switch (props.variant) {
    case "submit-revision":
      return "pi pi-send text-blue-600 dark:text-blue-400";
    default:
      return "pi pi-trash text-red-600 dark:text-red-400";
  }
});
</script>
