<!-- src/App.vue -->
<template>
  <!-- 语义化根容器：无 ID，仅用类名控制布局 -->
  <div class="flex flex-col h-screen overflow-hidden">
    <!-- 路由出口：语义化命名 + 布局类 -->
    <CommonHeader />
    <main class="flex-1 h-full">
      <router-view class="h-full" />
    </main>

    <!-- 全局 TabBar：语义化命名 -->
    <footer class="shrink-0">
      <CommonTabBar />
    </footer>
  </div>
</template>

<script setup lang="ts">
import CommonHeader from '@/components/common/HeaderComponent.vue';
import CommonTabBar from '@/components/common/TabBar.vue';


</script>

<!-- 作用域样式：仅作用于当前组件，避免全局污染 -->
<style scoped>

/* TabBar 容器：固定底部 */
.app-tabbar {
  flex-shrink: 0;
} 
</style>
