<template>
  <!-- 根容器：和你原代码 #app-container 完全一样 -->
  <div class="flex flex-col h-screen bg-gray-50">
    <!-- 移动端顶部 Header -->
    <header class="bg-white px-4 py-3 md:hidden">
      <h1 class="text-xl font-bold">Nodim</h1>
    </header>

    <!-- 主体三栏 flex 容器 -->
    <div class="flex flex-1">
      <!-- 左侧/底部导航 -->
      <MainNav />

      <!-- 中间栏：聊天列表（桌面永远显示，移动端路由控制显示） -->
      <div class="md:w-80 md:border-r overflow-hidden"
        :class="{ hidden: $route.path !== '/' && isMobile }">
        <router-view />
      </div>

      <!-- 右侧栏：聊天内容（桌面永远显示，移动端路由控制显示） -->
      <div class="flex-1 hidden md:flex"
        :class="{ flex: $route.path !== '/' && isMobile }">
        <router-view name="detail" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import MainNav from '@/components/MainNav.vue'

const isMobile = ref(window.innerWidth < 768)

// 监听响应式
onMounted(() => {
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 768
  })
})
</script>