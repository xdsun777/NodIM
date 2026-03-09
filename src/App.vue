<!-- src/App.vue -->
<template>
  <!-- 语义化根容器：无 ID，仅用类名控制布局 -->
  <div class="app-root h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
    <!-- 路由出口：语义化命名 + 布局类 -->
    <main class="app-content h-full">
      <router-view class="h-full" />
    </main>
    
    <!-- 全局 TabBar：语义化命名 -->
    <footer class="app-tabbar">
      <CommonTabBar />
    </footer>
  </div>
</template>

<script setup lang="ts">
import CommonTabBar from '@/components/common/TabBar.vue';
</script>

<!-- 作用域样式：仅作用于当前组件，避免全局污染 -->
<style scoped>
/* 根容器：全屏布局 */
.app-root {
  display: flex;
  flex-direction: column;
}

/* 内容区域：占满剩余高度 */
.app-content {
  flex: 1;
}

/* TabBar 容器：固定底部 */
.app-tabbar {
  flex-shrink: 0;
}
</style>