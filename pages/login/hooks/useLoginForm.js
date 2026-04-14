import { ref, computed } from 'vue';
import { useRouter } from '#app';
import { useAuthenticationCore } from '~/composables/useAuthenticationCore';
import { useToast } from '~/composables/useToast';

export function useLoginForm() {
  const router = useRouter();
  const { login: authLogin, isLoading: authLoading } = useAuthenticationCore();
  const { success: toastSuccess, error: toastError } = useToast();

  const email = ref('');
  const password = ref('');
  const errors = ref({ email: '', password: '' });
  const loginError = ref('');
  const showPassword = ref(false);

  const isLoggingIn = computed(() => authLoading.value);

  const isFormValid = computed(() => {
    const emailVal = email.value?.trim() || '';
    const passwordVal = password.value?.trim() || '';
    return emailVal.length > 0 && passwordVal.length > 0;
  });

  const validateForm = () => {
    errors.value = { email: '', password: '' };
    let isValid = true;

    if (!email.value) {
      errors.value.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      errors.value.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!password.value) {
      errors.value.password = 'Password is required';
      isValid = false;
    } else if (password.value.length < 6) {
      errors.value.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    loginError.value = '';

    if (!validateForm()) {
      return;
    }

    try {
      const result = await authLogin(email.value, password.value);

      if (result.success) {
        toastSuccess('Login successful! Redirecting...');
        setTimeout(() => {
          router.push('/update-data');
        }, 500);
      } else {
        loginError.value = result.message || 'Login failed. Please check your credentials.';
        toastError(loginError.value);
      }
    } catch (error) {
      loginError.value = error.message || 'An error occurred during login. Please try again.';
      toastError(loginError.value);
    }
  };

  return {
    email,
    password,
    errors,
    loginError,
    showPassword,
    isLoggingIn,
    isFormValid,
    handleLogin
  };
}
