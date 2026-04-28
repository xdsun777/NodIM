<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-bg-primary">
    <!-- 图标/插图区域 -->
    <div class="mb-6">
      <IconFont name="logo" class="w-32 h-32 opacity-30"></IconFont>
    </div>
    
    
    <!-- 错误信息 -->
    <div class="text-text-second text-lg mb-20">页面丢失了</div>
    
    <button
      @click="goBack"
      class="px-6 py-3 bg-primary text-text-primary text-base font-medium rounded-xl hover:opacity-90 transition-opacity"
    >
      返回首页
    </button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();
const goBack = () => router.push('/message');
</script>
