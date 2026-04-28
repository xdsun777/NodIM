<template>
  <Transition name="chat">
    <div v-show="show" class="chat-page">
      <div class="flex items-center p-4 border-b border-border bg-bg-primary">
        <button @click="back" class="p-2 hover:bg-bg-second rounded-lg transition-colors mr-2">
          <IconFont name="a-fanhuiqitaye" class="w-5 h-5 text-text-primary" />
        </button>
        <div class="flex items-center" style="justify-content:start;gap:0px">
          <div class="w-10 h-10 rounded-full bg-bg-second flex items-center justify-center flex-shrink-0 mr-3 overflow-hidden">
            <img :src="sessionAvatar" class="w-full h-full rounded-full object-cover" />
          </div>
          <div>
            <h3 class="font-semibold text-text-primary">
              {{ currentSession?.title }}
            </h3>
            <p class="text-xs text-text-primary">
              <span v-if="currentSession?.id === 'broadcast'">广播频道</span>
              <span v-else>在线</span>
            </p>
          </div>
        </div>
        <button class="ml-auto p-2 hover:bg-bg-second rounded-lg transition-colors">
          <IconFont name="more" class="w-5 h-5 text-text-primary" />
        </button>
      </div>
      <!-- [/MODULE] 3b4_聊天头部 -->

      <!-- [MODULE] 5c6_聊天消息区域 -->
      <div 
        ref="messageListRef" 
        class="flex-1 overflow-y-auto p-4 space-y-4 bg-bg-primary"
        @scroll="handleScroll"
      >
        <!-- 加载更多提示 -->
        <div v-if="isLoading" class="text-center text-xs text-text-primary py-2">
          <IconFont name="loading" class="w-4 h-4 inline-block animate-spin" />
          <span class="ml-1">加载历史消息...</span>
        </div>
        
        <!-- 时间戳 -->
        <div v-if="messageList.length > 0" class="text-center text-xs text-text-primary">
          {{ formatDate(messageList[0]?.timestamp) }}
        </div>

        <div
          v-for="(msg, index) in messageList"
          :key="msg.id"
          class="flex"
          :class="{ 
            'justify-start items-start space-x-2': !isMe(msg),
            'justify-end items-start space-x-2': isMe(msg)
          }"
        >
          <!-- 对方消息 -->
          <template v-if="!isMe(msg)">
            <div class="w-8 h-8 rounded-full bg-bg-second flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img :src="getSenderAvatar(msg)" class="w-full h-full rounded-full object-cover" />
            </div>
            <div class="max-w-xs">
              <!-- 文字消息 -->
              <div v-if="msg.type === 'text'" class="bg-bg-second text-text-primary p-3 rounded-lg">
                <p>{{ msg.content }}</p>
              </div>
              <!-- 文件消息 -->
              <div v-else-if="msg.type === 'file'" class="bg-bg-second p-3 rounded-lg">
                <div class="flex items-center gap-2">
                  <IconFont name="wenjian" class="w-5 h-5 text-text-primary" />
                  <span class="text-text-primary">{{ msg.fileName }}</span>
                  <span class="text-text-primary text-xs">{{ formatFileSize(msg.fileSize) }}</span>
                </div>
              </div>
              <!-- 图片消息 -->
              <div v-else-if="msg.type === 'image'" class="bg-bg-second p-1 rounded-lg">
                <img :src="msg.content" class="max-w-[200px] rounded-lg" />
              </div>
              <!-- 视频消息 -->
              <div v-else-if="msg.type === 'video'" class="relative">
                <img
                  :src="msg.content"
                  class="w-full h-48 object-cover rounded-lg"
                />
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="bg-black bg-opacity-50 rounded-full p-3">
                    <IconFont name="play" class="w-6 h-6 text-white" />
                  </div>
                </div>
                <div class="absolute bottom-2 left-2 text-white text-xs">
                  <p>{{ msg.fileName }}</p>
                  <p>{{ formatFileSize(msg.fileSize) }}</p>
                </div>
              </div>
              <!-- 其他消息类型 -->
              <div v-else class="bg-bg-second text-text-primary p-3 rounded-lg">
                <span class="text-sm">无法显示的消息类型</span>
              </div>
            </div>
          </template>

          <!-- 自己消息 -->
          <template v-else>
            <div class="max-w-xs">
              <!-- 文字消息 -->
              <div v-if="msg.type === 'text'" class="bg-primary text-white p-3 rounded-lg">
                <p>{{ msg.content }}</p>
              </div>
              <!-- 文件消息 -->
              <div v-else-if="msg.type === 'file'" class="bg-primary p-3 rounded-lg">
                <div class="flex items-center gap-2">
                  <IconFont name="wenjian" class="w-5 h-5 text-white" />
                  <span class="text-white">{{ msg.fileName }}</span>
                  <span class="text-white/70 text-xs">{{ formatFileSize(msg.fileSize) }}</span>
                </div>
              </div>
              <!-- 图片消息 -->
              <div v-else-if="msg.type === 'image'" class="bg-primary p-1 rounded-lg">
                <img :src="msg.content" class="max-w-[200px] rounded-lg" />
              </div>
              <!-- 视频消息 -->
              <div v-else-if="msg.type === 'video'" class="relative">
                <img
                  :src="msg.content"
                  class="w-full h-48 object-cover rounded-lg"
                />
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="bg-black bg-opacity-50 rounded-full p-3">
                    <IconFont name="play" class="w-6 h-6 text-white" />
                  </div>
                </div>
                <div class="absolute bottom-2 left-2 text-white text-xs">
                  <p>{{ msg.fileName }}</p>
                  <p>{{ formatFileSize(msg.fileSize) }}</p>
                </div>
              </div>
              <!-- 其他消息类型 -->
              <div v-else class="bg-primary text-white p-3 rounded-lg">
                <span class="text-sm text-white/70">无法显示的消息类型</span>
              </div>
              <!-- 消息状态 -->
              <div class="flex items-center gap-1 mt-1 justify-end">
                <span class="text-text-primary text-xs">{{ formatTime(msg.timestamp) }}</span>
                <IconFont 
                  v-if="msg.status === 'delivered'" 
                  name="dingdan" 
                  class="w-3 h-3 text-text-primary"
                />
                <IconFont 
                  v-else-if="msg.status === 'sent'" 
                  name="duigou" 
                  class="w-3 h-3 text-text-primary"
                />
                <IconFont 
                  v-else-if="msg.status === 'read'" 
                  name="duigou" 
                  class="w-3 h-3 text-primary"
                />
                <IconFont 
                  v-else-if="msg.status === 'sending'" 
                  name="loading" 
                  class="w-3 h-3 text-text-primary animate-spin"
                />
                <IconFont 
                  v-else-if="msg.status === 'failed'" 
                  name="cuowu" 
                  class="w-3 h-3 text-error"
                />
              </div>
            </div>
            <div class="w-8 h-8 rounded-full bg-bg-second flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img :src="getSenderAvatar(msg)" class="w-full h-full rounded-full object-cover" />
            </div>
          </template>
        </div>

        <div v-if="messageList.length === 0" class="flex flex-col items-center justify-center h-full text-text-primary">
          <IconFont name="duihuakuang" class="w-16 h-16 mb-4 opacity-30" />
          <p>暂无消息</p>
          <p class="text-sm mt-2">开始对话吧</p>
        </div>
      </div>
      <!-- [/MODULE] 5c6_聊天消息区域 -->

      <!-- [MODULE] 7d8_输入区域 -->
      <div class="p-4 border-t border-border bg-bg-primary flex items-center">
        <button class="text-text-primary mr-3">
          <IconFont name="smile" class="w-6 h-6" />
        </button>
        <div class="flex-1 relative">
          <input
            v-model="content"
            @keyup.enter="send"
            class="w-full bg-bg-second text-text-primary rounded-full py-2 px-4 focus:outline-none"
            placeholder="输入..."
            type="text"
            @focus="handleInputFocus"
            @blur="handleInputBlur"
          />
        </div>
        <button class="text-text-primary mx-3">
          <IconFont name="add" class="w-6 h-6" />
        </button>
        <button @click="send" class="text-text-primary">
          <IconFont name="mic" class="w-6 h-6" />
        </button>
      </div>
      <!-- [/MODULE] 7d8_输入区域 -->
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useMessageStore } from '../stores/index';
import { useAppConfigStore } from '@/stores/appConfig';
import { avatar } from '@/utils/tools';

const route = useRoute();
const router = useRouter();
const store = useMessageStore();
const appConfig = useAppConfigStore();

const { messageList, currentSession, hasMoreMessages } = storeToRefs(store);
const show = ref(false);
const content = ref('');
const messageListRef = ref<HTMLElement | null>(null);
const isLoading = ref(false);
const isLoadingHistory = ref(false);

/**
 * 根据会话类型生成头像
 */
const sessionAvatar = computed(() => {
  if (!currentSession.value) return avatar('default');
  if (currentSession.value.avatar) return currentSession.value.avatar;
  if (currentSession.value.id === 'broadcast') {
    return avatar('广播');
  }
  return avatar(currentSession.value.id);
});

/**
 * 获取消息发送者的头像
 * - 广播频道：其他人用 peerID 生成，自己用 appConfig.avatarUrl
 * - 私聊：对方从用户数据取，自己用 appConfig.avatarUrl
 */
const isMe = (msg: typeof messageList.value[0]) => {
  return msg.from === appConfig.peerID;
};

const getSenderAvatar = (msg: typeof messageList.value[0]) => {
  const isBroadcast = currentSession.value?.id === 'broadcast';
  
  // 判断是否是自己发送的消息
  if (isMe(msg)) {
    return appConfig.avatarUrl || avatar('me');
  }
  
  // 广播频道：使用发送者的 peerID 生成头像
  if (isBroadcast) {
    return avatar(msg.from);
  }
  
  // 私聊：从用户数据中获取对方头像（暂时使用 peerID 生成）
  return avatar(msg.from);
};

const handleInputFocus = () => {
  nextTick(() => {
    scrollToBottom();
  });
};

const handleInputBlur = () => {};

const scrollToBottom = () => {
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
  }
};

const handleResize = () => {
  nextTick(() => {
    scrollToBottom();
  });
};

/**
 * 处理滚动事件
 */
const handleScroll = () => {
  if (!messageListRef.value) return;
  
  const { scrollTop } = messageListRef.value;
  const hasMore = hasMoreMessages.value ?? false;
  
  // 如果滚动到顶部且有更多消息，加载历史消息
  if (scrollTop < 50 && hasMore && !isLoading.value) {
    loadHistoryMessages();
  }
};

/**
 * 加载历史消息
 */
const loadHistoryMessages = async () => {
  if (isLoading.value || !hasMoreMessages.value) return;
  
  isLoading.value = true;
  isLoadingHistory.value = true;
  
  try {
    const sessionId = route.params.id as string;
    await store.loadHistoryMessages(sessionId);
  } catch (error) {
    console.error('Failed to load history messages:', error);
  } finally {
    isLoading.value = false;
    isLoadingHistory.value = false;
  }
};

const formatFileSize = (size?: number): string => {
  if (!size) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

const formatDate = (timestamp?: number): string => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? '下午' : '上午';
  const displayHours = hours % 12 || 12;
  return `${month}/${day} ${period}${displayHours}:${minutes}`;
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - timestamp;

  if (diff < 60000) {
    return '刚刚';
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  } else if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

/**
 * 获取未读消息数量
 */
const getUnreadCount = (): number => {
  const session = store.sessionList.find((item) => item.id === route.params.id);
  return session?.unread || 0;
};

watch(messageList, () => {
  nextTick(() => {
    // 加载历史消息时不自动滚动
    if (isLoadingHistory.value) return;
    
    // 如果没有未读消息，滚动到底部
    if (getUnreadCount() === 0) {
      scrollToBottom();
    }
  });
}, { deep: true });

onMounted(async () => {
  const sessionId = route.params.id as string;
  const unreadCountBefore = getUnreadCount();
  
  await store.initMessageList(sessionId);
  await store.markAsRead(sessionId);
  
  setTimeout(() => {
    show.value = true;
    nextTick(() => {
      if (unreadCountBefore === 0) {
        // 没有未读消息：滚动到底部
        scrollToBottom();
      }
      // 有未读消息：保持在顶部（显示第一条未读消息）
    });
  }, 50);
  
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

const back = () => {
  show.value = false;
  setTimeout(() => router.back(), 350);
};

const send = () => {
  store.sendMessage(content.value);
  content.value = '';
};
</script>

<style scoped>
.chat-page {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-height: 100vh;
  max-width: 480px;
  margin: 0 auto;
  background-color: var(--bg-primary);
}

.chat-enter-from {
  transform: translateX(100%);
}
.chat-enter-active {
  transition: transform 0.35s ease;
}
.chat-leave-to {
  transform: translateX(100%);
}
.chat-leave-active {
  transition: transform 0.35s ease;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin {
  animation: spin 1s linear infinite;
}
</style>