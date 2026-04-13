<!-- src/plugins/message/pages/ChatPage.vue -->
<template>
  <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
    <!-- 顶部导航 -->
    <div
      class="py-3 px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center"
    >
      <button @click="goBack" class="mr-3">←</button>
      <img
        v-if="messageStore.currentSession?.avatar"
        :src="messageStore.currentSession.avatar"
        alt="avatar"
        class="w-8 h-8 rounded-full mr-2"
      />
      <h1 class="font-medium">
        {{ messageStore.currentSession?.title || '聊天' }}
      </h1>
    </div>

    <!-- 消息列表 -->
    <div class="flex-1 overflow-auto p-4" ref="messageContainer">
      <div v-if="loading" class="py-8 text-center text-gray-500">加载中...</div>

      <div v-else>
        <MessageBubble
          v-for="msg in messageStore.messageList"
          :key="msg.id"
          :msg="msg"
          :avatar="messageStore.currentSession?.avatar"
          myAvatar="https://picsum.photos/200/200?random=99"
        />
      </div>
    </div>

    <!-- 消息输入框 -->
    <MessageInput @send="handleSendMessage" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useMessageStore } from '../stores/contact';
import MessageBubble from '../components/MessageBubble.vue';
import MessageInput from '../components/MessageInput.vue';

const router = useRouter();
const route = useRoute();
// 关键修复：暴露 store 实例到模板
const messageStore = useMessageStore();

const loading = ref(true);
const messageContainer = ref<HTMLDivElement>();

// 获取当前会话ID（路由参数）
const sessionId = route.params.sessionId as string;

// 初始化消息列表
onMounted(async () => {
  try {
    // 先确保会话列表已初始化
    if (messageStore.sessionList.length === 0) {
      await messageStore.initSessionList();
    }
    await messageStore.initMessageList(sessionId);
    loading.value = false;
    scrollToBottom();
  } catch (error) {
    console.error('初始化消息列表失败：', error);
    loading.value = false;
  }
});

// 监听消息列表变化，自动滚动到底部
watch(
  () => messageStore.messageList,
  () => {
    scrollToBottom();
  },
);

// 发送消息
const handleSendMessage = (content: string) => {
  messageStore.sendMessage(content);
};

// 返回上一页
const goBack = () => {
  router.go(-1);
};

// 滚动到消息底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }
  });
};
</script>
