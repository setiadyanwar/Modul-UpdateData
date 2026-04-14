<template>
  <div class="login-form-section">
    <div class="form-header">
      <h2 class="form-title">Login</h2>
      <p class="form-subtitle">Enter your credentials to access</p>
    </div>

    <form @submit.prevent="handleLogin" class="login-form">
      <div class="form-group">
        <label for="email" class="form-label">
          <i class="pi pi-envelope"></i>
          Email
        </label>
        <InputText
          id="email"
          v-model="email"
          type="email"
          placeholder="Enter your email"
          class="form-input"
          :class="{ 'p-invalid': errors.email }"
          :disabled="isLoggingIn"
          required
        />
        <small v-if="errors.email" class="error-message">{{ errors.email }}</small>
      </div>

      <div class="form-group">
        <label for="password" class="form-label">
          <i class="pi pi-lock"></i>
          Password
        </label>
        <div class="password-input-wrapper">
          <InputText
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Enter your password"
            class="form-input"
            :class="{ 'p-invalid': errors.password }"
            :disabled="isLoggingIn"
            required
          />
          <button
            type="button"
            @click="showPassword = !showPassword"
            class="password-toggle"
            :disabled="isLoggingIn"
          >
            <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
          </button>
        </div>
        <small v-if="errors.password" class="error-message">{{ errors.password }}</small>
      </div>

      <div v-if="loginError" class="error-alert">
        <i class="pi pi-exclamation-circle"></i>
        <span>{{ loginError }}</span>
      </div>

      <UiButton
        type="submit"
        variant="primary"
        size="default"
        :fullWidth="true"
        :disabled="isLoggingIn || !isFormValid"
        class="login-button"
      >
        <i :class="isLoggingIn ? 'pi pi-spin pi-spinner' : 'pi pi-sign-in'"></i>
        <span>{{ isLoggingIn ? 'Logging in...' : 'Login' }}</span>
      </UiButton>
    </form>
  </div>
</template>

<script setup>
import UiButton from '~/components/ui/Button.vue';
import { useLoginForm } from '../hooks/useLoginForm';

const {
  email,
  password,
  errors,
  loginError,
  showPassword,
  isLoggingIn,
  isFormValid,
  handleLogin
} = useLoginForm();
</script>

<style scoped>
/* Login Form Section */
.login-form-section {
  padding: 2rem;
}

.form-header {
  margin-bottom: 2rem;
  text-align: center;
}

.form-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

:deep(.dark) .form-title {
  color: #f1f5f9;
}

.form-subtitle {
  font-size: 0.875rem;
  color: #64748b;
}

:deep(.dark) .form-subtitle {
  color: #94a3b8;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group:has(.form-input:disabled) .form-label {
  opacity: 0.65;
  color: #94a3b8;
}

:deep(.dark) .form-group:has(.form-input:disabled) .form-label {
  color: #64748b;
}

.form-group:has(.form-input:disabled) .form-label i {
  opacity: 0.6;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
}

:deep(.dark) .form-label {
  color: #f1f5f9;
}

.form-label i {
  font-size: 0.875rem;
  color: #64748b;
}

:deep(.dark) .form-label i {
  color: #94a3b8;
}

.form-input {
  width: 100%;
}

.form-input:disabled {
  background-color: #f1f5f9 !important;
  color: #94a3b8 !important;
  cursor: not-allowed;
  opacity: 0.7;
}

:deep(.dark) .form-input:disabled {
  background-color: #334155 !important;
  color: #64748b !important;
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-wrapper .form-input {
  padding-right: 3rem;
}

.password-toggle {
  position: absolute;
  right: 0.75rem;
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

:deep(.dark) .password-toggle {
  color: #94a3b8;
}

.password-toggle:hover:not(:disabled) {
  color: #2563eb;
}

:deep(.dark) .password-toggle:hover:not(:disabled) {
  color: #60a5fa;
}

.password-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.password-toggle i {
  font-size: 1rem;
}

.error-message {
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.error-alert {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 0.875rem;
}
</style>
