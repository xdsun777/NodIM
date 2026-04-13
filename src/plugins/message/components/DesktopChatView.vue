<template>
  <!-- 直接复用你的 ChatPage 内容 -->
  <ChatPage v-if="currentSessionId" />
  <div class="flex items-center justify-center h-full text-gray-400" v-else>
    请选择一个会话
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import ChatPage from '../pages/ChatPage.vue'

// 监听会话ID（从全局状态/路由参数取）
const route = useRoute()
const currentSessionId = route.query.sessionId
</script>