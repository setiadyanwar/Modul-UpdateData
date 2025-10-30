<template>
  <Teleport to="body">
    <Transition name="page-loading">
      <PageLoading
        v-if="isLoading"
        :loading-text="loadingText"
      />
    </Transition>
  </Teleport>
</template>

<script setup>
const { isLoading, loadingText } = useGlobalSimplePageLoading()
</script>

<style scoped>
.page-loading-enter-active,
.page-loading-leave-active {
  transition: opacity 0.3s ease-in-out;
}

.page-loading-enter-from,
.page-loading-leave-to {
  opacity: 0;
}

.page-loading-enter-to,
.page-loading-leave-from {
  opacity: 1;
}
</style>