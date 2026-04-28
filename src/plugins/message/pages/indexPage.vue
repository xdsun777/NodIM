<template>
  <div class="h-full bg-bg-primary overflow-y-auto relative">
    <!-- 长按菜单 -->
    <Teleport to="body">
      <Transition name="fade">
        <div 
          v-if="showLongPressMenu" 
          class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          @click="closeLongPressMenu"
        >
          <div 
            class="bg-bg-primary rounded-xl shadow-xl p-2 min-w-[160px]"
            @click.stop
          >
            <button 
              @click="longPressDeleteSession"
              class="w-full flex items-center gap-3 px-4 py-3 text-error hover:bg-bg-second rounded-lg transition-colors"
            >
              <IconFont name="delete" class="w-5 h-5" />
              <span>删除会话</span>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <div
      v-for="session in sessionList"
      :key="session.id"
      class="relative overflow-hidden"
    >
      <!-- 滑动背景（删除按钮） -->
      <div 
        class="absolute right-0 top-0 bottom-0 w-24 flex items-center justify-center bg-error"
      >
        <button 
          @click="deleteSession(session.id)"
          class="flex flex-col items-center gap-1 text-white"
        >
          <IconFont name="delete" class="w-6 h-6" />
          <span class="text-xs">删除</span>
        </button>
      </div>

      <!-- 会话项（可滑动、可长按） -->
      <div
        class="flex items-center gap-4 px-4 py-4 cursor-pointer transition-colors bg-bg-primary relative"
        :class="{
          'bg-bg-second': currentSessionId === session.id,
          'hover:bg-bg-second': currentSessionId !== session.id,
        }"
        :style="{ transform: `translateX(${getSlideOffset(session.id)}px)` }"
        @touchstart="handleTouchStart($event, session.id)"
        @touchmove="handleTouchMove($event, session.id)"
        @touchend="handleTouchEnd(session.id)"
        @click="openChat(session.id)"
        @mousedown="handleMouseDown(session.id)"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
      >
        <div class="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img
            :src="getAvatar(session)"
            :alt="session.title"
            class="w-full h-full object-cover"
          />
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-1">
            <span class="text-text-primary font-medium truncate">{{ session.title }}</span>
            <span class="text-text-second text-xs flex-shrink-0 ml-2">{{ session.time }}</span>
          </div>
          <div class="text-text-second text-sm truncate">
            {{ session.lastMsg }}
          </div>
        </div>

        <div
          v-if="session.unread && session.unread > 0"
          class="bg-primary text-white text-xs px-2 py-1 rounded-full min-w-[24px] text-center flex-shrink-0"
        >
          {{ session.unread > 99 ? '99+' : session.unread }}
        </div>
      </div>
    </div>

    <div v-if="sessionList.length === 0" class="flex flex-col items-center justify-center h-full text-text-second">
      <IconFont name="duihuakuang" class="w-16 h-16 mb-4 opacity-30" />
      <p>暂无会话</p>
      <p class="text-sm mt-2">等待其他节点连接...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useMessageStore } from '../stores/index';
import { avatar } from '@/utils/tools';

const msgStore = useMessageStore();
const router = useRouter();

const { sessionList, currentSessionId } = storeToRefs(msgStore);

// 滑动状态
const slideOffsets = ref<Record<string, number>>({});
const touchStartX = ref<Record<string, number>>({});
const isDragging = ref<Record<string, boolean>>({});

// 长按状态
const longPressTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const longPressSessionId = ref<string | null>(null);
const showLongPressMenu = ref(false);

/**
 * 根据会话类型生成头像
 */
function getAvatar(session: typeof sessionList.value[0]): string {
  if (session.avatar) {
    return session.avatar;
  }
  if (session.id === 'broadcast') {
    return avatar('广播');
  }
  return avatar(session.id);
}

/**
 * 获取滑动偏移量
 */
function getSlideOffset(sessionId: string): number {
  return slideOffsets.value[sessionId] || 0;
}

/**
 * 鼠标按下（开始长按计时）
 */
function handleMouseDown(sessionId: string) {
  if (sessionId === 'broadcast') return;
  
  longPressSessionId.value = sessionId;
  longPressTimer.value = setTimeout(() => {
    handleLongPress(sessionId);
  }, 500); // 500ms 触发长按
}

/**
 * 鼠标松开（取消长按计时）
 */
function handleMouseUp() {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value);
    longPressTimer.value = null;
  }
}

/**
 * 处理长按事件
 */
function handleLongPress(sessionId: string) {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value);
    longPressTimer.value = null;
  }
  
  // 阻止点击事件
  event?.stopPropagation();
  
  // 显示上下文菜单
  showLongPressMenu.value = true;
}

/**
 * 关闭长按菜单
 */
function closeLongPressMenu() {
  showLongPressMenu.value = false;
  longPressSessionId.value = null;
}

/**
 * 长按删除会话
 */
async function longPressDeleteSession() {
  if (!longPressSessionId.value) return;
  
  await deleteSession(longPressSessionId.value);
  closeLongPressMenu();
}

/**
 * 触摸开始（广播频道禁止滑动）
 */
function handleTouchStart(event: TouchEvent, sessionId: string) {
  if (sessionId === 'broadcast') return;
  touchStartX.value[sessionId] = event.touches[0].clientX;
  isDragging.value[sessionId] = true;
}

/**
 * 触摸移动（广播频道禁止滑动）
 */
function handleTouchMove(event: TouchEvent, sessionId: string) {
  if (sessionId === 'broadcast') return;
  if (!isDragging.value[sessionId]) return;
  
  const currentX = event.touches[0].clientX;
  const diff = touchStartX.value[sessionId] - currentX;
  
  const offset = Math.max(-96, Math.min(0, -diff));
  slideOffsets.value[sessionId] = offset;
}

/**
 * 触摸结束（广播频道禁止滑动）
 */
function handleTouchEnd(sessionId: string) {
  if (sessionId === 'broadcast') return;
  isDragging.value[sessionId] = false;
  
  const offset = slideOffsets.value[sessionId] || 0;
  
  if (offset < -48) {
    slideOffsets.value[sessionId] = -96;
  } else {
    slideOffsets.value[sessionId] = 0;
  }
}

/**
 * 打开聊天页面
 */
const openChat = (id: string) => {
  // 点击时重置滑动状态
  slideOffsets.value[id] = 0;
  
  router.push({
    name: 'global-chat',
    params: { id },
  });
};

/**
 * 删除会话
 */
async function deleteSession(sessionId: string) {
  // 广播频道不允许删除
  if (sessionId === 'broadcast') {
    slideOffsets.value[sessionId] = 0;
    return;
  }
  
  try {
    await msgStore.deleteSession(sessionId);
    // 删除后重置滑动状态
    delete slideOffsets.value[sessionId];
    delete touchStartX.value[sessionId];
    delete isDragging.value[sessionId];
    console.log('Session deleted:', sessionId);
  } catch (error) {
    console.error('Failed to delete session:', error);
  }
}

onMounted(() => {
  msgStore.initSessionList();
});
</script>

<style scoped>
.relative {
  touch-action: pan-y;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
</style>