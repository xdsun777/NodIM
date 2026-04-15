<!-- src/components/common/HeaderComponent.vue -->
<template>
  <header class="bg-white px-4 py-3 flex justify-between items-center md:hidden">
    <h1 class="text-xl font-bold">Nodim</h1>
    <button class="text-purple-600" id="mobile-header-action">
      <i class="fas fa-expand-alt text-xl"> </i>
    </button>
  </header>
</template>

<script setup lang="ts">
// 仅负责头部UI展示，无复杂逻辑
</script>

<style scoped>
/* 局部样式，与原HTML保持一致 */
button {
  @apply cursor-pointer;
  border: none;
  background: transparent;
}
</style>
