<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">API Debug Test</h1>

    <div class="mb-4">
      <h2 class="font-bold">Token Status:</h2>
      <pre class="bg-gray-100 p-2 rounded">{{ tokenInfo }}</pre>
    </div>

    <div class="mb-4">
      <button @click="testAPI" class="bg-blue-500 text-white px-4 py-2 rounded">
        Test API Call
      </button>
    </div>

    <div v-if="result" class="mb-4">
      <h2 class="font-bold">API Result:</h2>
      <pre class="bg-gray-100 p-2 rounded max-h-96 overflow-auto">{{ result }}</pre>
    </div>

    <div v-if="error" class="mb-4">
      <h2 class="font-bold text-red-600">API Error:</h2>
      <pre class="bg-red-50 p-2 rounded max-h-96 overflow-auto">{{ error }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useApi } from '~/composables/useApi';

const { apiGet } = useApi();
const result = ref(null);
const error = ref(null);

const tokenInfo = computed(() => {
  const token = localStorage.getItem('access_token');
  const expiry = localStorage.getItem('token_expiry');

  return {
    hasToken: !!token,
    tokenLength: token?.length || 0,
    tokenPreview: token ? `${token.substring(0, 50)}...` : 'NO TOKEN',
    expiryTime: expiry ? new Date(parseInt(expiry)).toLocaleString() : 'N/A',
    isExpired: expiry ? Date.now() > parseInt(expiry) : true
  };
});

const testAPI = async () => {
  console.log('[TEST] Starting API test...');
  console.log('[TEST] Token info:', tokenInfo.value);

  result.value = null;
  error.value = null;

  try {
    console.log('[TEST] Calling /employee/change-request...');
    const response = await apiGet('/employee/change-request?page=1&limit=5');
    console.log('[TEST] Response:', response);
    result.value = response;
  } catch (err) {
    console.error('[TEST] Error:', err);
    error.value = {
      message: err.message,
      status: err.status,
      statusText: err.statusText,
      data: err.data
    };
  }
};

onMounted(() => {
  console.log('[TEST] Page mounted');
  console.log('[TEST] Token info:', tokenInfo.value);
});
</script>
