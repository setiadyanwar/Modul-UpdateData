<template>
  <div class="login-container">
    
    <!-- Main Content -->
    <div class="login-wrapper">
      <!-- Left Side - Branding -->
      <div class="branding-section">
        <div class="logo-container">
          <div class="logo-icon">
            <i class="pi pi-shield"></i>
          </div>
          <h1 class="brand-title">Update Data</h1>
          <p class="brand-subtitle">ESS Sigma Remote Module</p>
          <div class="badge-tag">
            <i class="pi pi-link"></i>
            <span>Microfrontend Application</span>
          </div>
        </div>
        
        <div class="version-info">
          <p class="version-text">Version {{ appVersion }}</p>
          <p class="suite-text">Part of ESS Sigma Application Suite</p>
        </div>
      </div>

      <!-- Right Side - Content Card -->
      <div class="content-section">
        <div class="main-card">
          <!-- Login Mode Toggle -->
          <div class="login-mode-toggle">
            <button
              :class="['mode-button', { active: loginMode === 'standalone' }]"
              @click="loginMode = 'standalone'"
            >
              <i class="pi pi-sign-in"></i>
              <span>Standalone Login</span>
            </button>
            <button
              :class="['mode-button', { active: loginMode === 'portal' }]"
              @click="loginMode = 'portal'"
            >
              <i class="pi pi-external-link"></i>
              <span>Via Portal</span>
            </button>
          </div>

          <!-- Ticket Processing State -->
          <div v-if="isTicketProcessing" class="processing-section">
            <div class="processing-loader">
              <i class="pi pi-spin pi-spinner"></i>
            </div>
            <h2 class="processing-title">Verifying Ticket</h2>
            <p class="processing-subtitle">Please wait while we authenticate your session...</p>
          </div>

          <!-- Ticket Error State -->
          <div v-else-if="ticketError" class="error-portal-section">
            <div class="error-icon-wrapper">
              <i class="pi pi-times-circle"></i>
            </div>
            <h2 class="error-title">Authentication Failed</h2>
            <p class="error-subtitle">{{ ticketError }}</p>
            <UiButton 
              variant="primary" 
              class="retry-button"
              @click="clearTicketError"
            >
              Back to Login
            </UiButton>
          </div>

          <template v-else>
            <!-- Standalone Login Form -->
            <StandaloneLoginForm v-if="loginMode === 'standalone'" />

            <!-- Portal Access Section -->
            <PortalAccessSection v-if="loginMode === 'portal'" />
          </template>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import StandaloneLoginForm from './components/StandaloneLoginForm.vue';
import PortalAccessSection from './components/PortalAccessSection.vue';
import UiButton from '~/components/ui/Button.vue';
import { useTicketLogin } from './hooks/useTicketLogin';

import envConfig from '~/config/environment';

const router = useRouter();
const { isTicketProcessing, ticketError } = useTicketLogin();

const clearTicketError = () => {
  if (process.client) {
    sessionStorage.removeItem('ticket_login_failed');
    sessionStorage.removeItem('ticket_processing');
    window.location.reload(); // Refresh to clear query params too if needed, or just reset state
  }
};

// App info
const appVersion = ref(envConfig.APP?.VERSION || '1.0.0');

// Login mode: 'standalone' or 'portal'
const loginMode = ref('standalone');

// Check if user is already authenticated
onMounted(() => {
  if (process.client) {
    const token = localStorage.getItem('access_token') || localStorage.getItem('auth._token.local');
    if (token) {
      // User is already logged in, redirect to update-data
      router.push('/update-data');
    }
  }
});

// Set page title
useHead({
  title: 'Login - Update Data ESS Sigma',
  meta: [
    { name: 'description', content: 'Login to Update Data ESS Sigma application.' }
  ]
});
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: #2563eb; /* Primary solid background */
  position: relative;
  overflow: hidden;
}

:deep(.dark) .login-container {
  background: #1e40af; /* Darker primary for dark mode */
}

.login-wrapper {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 3rem;
  max-width: 1200px;
  width: 100%;
  z-index: 1;
  position: relative;
}

.branding-section {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: white;
  padding: 2rem 0;
}

.logo-container {
  animation: slideInLeft 0.6s ease-out;
}

.logo-icon {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.logo-icon i {
  font-size: 3rem;
  color: white;
}

.brand-title {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  line-height: 1.2;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.brand-subtitle {
  font-size: 1.25rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
  opacity: 0.95;
}

.badge-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.badge-tag i {
  font-size: 0.75rem;
}

.version-info {
  animation: fadeInUp 0.8s ease-out;
}

.version-text {
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  opacity: 0.9;
}

.suite-text {
  font-size: 0.75rem;
  opacity: 0.7;
}

.content-section {
  animation: slideInRight 0.6s ease-out;
}

.main-card {
  background: white;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

:deep(.dark) .main-card {
  background: #1e293b;
  border-color: #334155;
}

/* Login Mode Toggle */
.login-mode-toggle {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

:deep(.dark) .login-mode-toggle {
  background: #1e293b;
  border-bottom-color: #334155;
}

.mode-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: transparent;
  border: 2px solid transparent;
  border-radius: 8px;
  color: #64748b;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

:deep(.dark) .mode-button {
  color: #94a3b8;
}

.mode-button:hover {
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
}

:deep(.dark) .mode-button:hover {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.mode-button.active {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

:deep(.dark) .mode-button.active {
  background: #3b82f6;
  border-color: #3b82f6;
}

.mode-button i {
  font-size: 1rem;
}

/* Processing & Error Sections */
.processing-section,
.error-portal-section {
  padding: 4rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1.5rem;
}

.processing-loader {
  font-size: 4rem;
  color: #2563eb;
}

.error-icon-wrapper {
  font-size: 4rem;
  color: #ef4444;
}

.processing-title,
.error-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.dark .processing-title,
.dark .error-title {
  color: #f1f5f9;
}

.processing-subtitle,
.error-subtitle {
  font-size: 1rem;
  color: #64748b;
  max-width: 300px;
  line-height: 1.6;
}

.dark .processing-subtitle,
.dark .error-subtitle {
  color: #94a3b8;
}

.retry-button {
  margin-top: 1rem;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
