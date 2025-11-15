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
          <!-- Warning Header -->
          <div class="warning-header">
            <div class="warning-icon-wrapper">
              <i class="pi pi-exclamation-triangle"></i>
            </div>
            <div class="warning-content">
              <h2 class="warning-title">Access Restricted</h2>
              <p class="warning-description">
                Remote module. Please access via the main ESS Sigma app.
              </p>
            </div>
          </div>

          <!-- Steps Section -->
          <div class="steps-section">
            <h3 class="steps-title">
              <i class="pi pi-info-circle"></i>
              How to Access
            </h3>
            <div class="steps-list">
              <div 
                v-for="(step, index) in accessSteps" 
                :key="index"
                class="step-item"
              >
                <div class="step-number">{{ index + 1 }}</div>
                <div class="step-text">{{ step }}</div>
              </div>
            </div>
          </div>

          <!-- Action Button -->
          <div class="action-section">
            <a
              :href="mainAppUrl"
              class="action-button"
            >
              <i class="pi pi-external-link"></i>
              <span>Go to Main Application</span>
            </a>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import envConfig from '~/config/environment';

// App info
const appVersion = ref(envConfig.APP.VERSION || '1.0.0');

// Access steps
const accessSteps = [
  'Login to the main ESS Sigma application',
  'Navigate to the Update Data menu',
  'The application will load automatically in the iframe'
];

// Main app URL - Always redirect to ESS Portal
const mainAppUrl = computed(() => {
  return envConfig.IS_PRODUCTION
    ? envConfig.FRONTEND_URLS.PRODUCTION.ESS_HOST
    : envConfig.FRONTEND_URLS.DEVELOPMENT.ESS_HOST;
});

// Set page title
useHead({
  title: 'Access Restricted - Update Data ESS Sigma',
  meta: [
    { name: 'description', content: 'This is a remote application module that must be accessed through the main ESS Sigma application.' }
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

.dark .login-container {
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

.dark .main-card {
  background: #1e293b;
  border-color: #334155;
}

.warning-header {
  background: #f59e0b; /* Solid warning color */
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.dark .warning-header {
  background: #78350f; /* Solid dark warning color */
}

.warning-icon-wrapper {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.warning-icon-wrapper i {
  font-size: 1.5rem;
  color: white;
}

.warning-content {
  flex: 1;
}

.warning-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.5rem;
}

.warning-description {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.6;
}

.warning-description strong {
  font-weight: 700;
}

.steps-section {
  padding: 2rem;
}

.steps-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dark .steps-title {
  color: #f1f5f9;
}

.steps-title i {
  color: #3b82f6;
  font-size: 1.25rem;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 12px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.dark .step-item {
  background: #334155;
}

.step-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.step-number {
  width: 36px;
  height: 36px;
  background: #2563eb; /* Solid primary */
  color: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.step-text {
  flex: 1;
  padding-top: 0.375rem;
  color: #475569;
  font-size: 0.875rem;
  line-height: 1.6;
}

.dark .step-text {
  color: #cbd5e1;
}

.action-section {
  padding: 0 2rem 2rem;
}

.action-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: #2563eb; /* Solid primary */
  color: white;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  text-decoration: none;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
  transition: all 0.3s;
  border: none;
  cursor: pointer;
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(59, 130, 246, 0.5);
}

.action-button:active {
  transform: translateY(0);
}

.action-button i {
  font-size: 1.125rem;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
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

/* Responsive */
@media (max-width: 968px) {
  .login-wrapper {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .branding-section {
    text-align: center;
    padding: 1rem 0;
  }

  .logo-icon {
    margin: 0 auto 1.5rem;
  }

  .brand-title {
    font-size: 2.5rem;
  }
}

@media (max-width: 640px) {
  .login-container {
    padding: 1rem;
  }

  .brand-title {
    font-size: 2rem;
  }

  .main-card {
    border-radius: 16px;
  }

  .steps-section,
  .action-section {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}
</style>