<template>
  <div class="h-full flex flex-col items-center justify-center">
    <div class="text-6xl mb-4">404</div>
    <div class="text-gray-500 mb-6">页面不存在</div>
    <button 
      @click="goBack"
      class="px-4 py-2 bg-blue-500 text-white rounded-full"
    >
      返回首页
    </button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
const goBack = () => router.push('/message')
</script>