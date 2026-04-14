<template>
  <div class="portal-section">
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
</template>

<script setup>
import { computed } from 'vue';
import envConfig from '~/config/environment';

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
</script>

<style scoped>
.warning-header {
  background: #f59e0b;
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

:deep(.dark) .warning-header {
  background: #78350f;
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

:deep(.dark) .steps-title {
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

:deep(.dark) .step-item {
  background: #334155;
}

.step-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.step-number {
  width: 36px;
  height: 36px;
  background: #2563eb;
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

:deep(.dark) .step-text {
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
  background: #2563eb;
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
</style>
