<!-- src/plugins/message/pages/SessionList.vue -->
<template>
  <div class="h-full bg-gray-50 dark:bg-gray-900">
    <!-- 顶部标题 -->
    <div
      class="py-3 px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
    >
      <h1 class="text-lg font-bold">消息</h1>
    </div>

    <!-- 会话列表 -->
    <div class="overflow-auto h-[calc(100vh-10rem)]">
      <div v-if="loading" class="py-8 text-center text-gray-500">加载中...</div>

      <!-- 关键修复：添加空值保护（?.） -->
      <div
        v-else-if="messageStore.sessionList?.length === 0"
        class="py-8 text-center text-gray-500"
      >
        暂无会话
      </div>

      <div v-else>
        <!-- 关键修复：使用 messageStore.sessionList 而非直接 sessionList -->
        <div
          v-for="session in messageStore.sessionList"
          :key="session.id"
          class="p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer"
          @click="goToChat(session.id)"
        >
          <div class="flex items-center">
            <!-- 头像 -->
            <img
              :src="session.avatar"
              alt="avatar"
              class="w-12 h-12 rounded-full mr-3"
            />

            <!-- 会话信息 -->
            <div class="flex-1">
              <div class="flex justify-between items-center">
                <h3 class="font-medium">{{ session.title }}</h3>
                <span class="text-xs text-gray-500">{{ session.time }}</span>
              </div>
              <p class="text-sm text-gray-500 truncate">
                {{ session.lastMsg }}
              </p>
            </div>

            <!-- 未读角标 -->
            <div
              v-if="session.unread"
              class="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
            >
              {{ session.unread }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useMessageStore } from '../stores/message';

const router = useRouter();
// 关键修复：将 store 实例暴露到模板（模板可直接访问 messageStore）
const messageStore = useMessageStore();
const loading = ref(true);

// 初始化会话列表
onMounted(async () => {
  try {
    await messageStore.initSessionList();
  } catch (error) {
    console.error('初始化会话列表失败：', error);
  } finally {
    loading.value = false;
  }
});

// 跳转到聊天页
const goToChat = (sessionId: string) => {
  router.push(`/message/chat/${sessionId}`);
};
</script>
