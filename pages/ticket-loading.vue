<template>
  <div class="ticket-loading-container">
    <div class="loading-content">
      <div class="spinner"></div>
      <h2>Authenticating...</h2>
      <p>Please wait while we process your login</p>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false,
});

onMounted(() => {
  console.log('[Ticket Loading Page] Mounted');

  // The ticket-handler plugin will process the ticket
  // This page just shows loading UI
});
</script>

<style scoped>
.ticket-loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.loading-content {
  text-align: center;
  color: white;
}

.spinner {
  width: 60px;
  height: 60px;
  margin: 0 auto 20px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

h2 {
  font-size: 24px;
  margin-bottom: 10px;
  font-weight: 600;
}

p {
  font-size: 16px;
  opacity: 0.8;
}
</style>
