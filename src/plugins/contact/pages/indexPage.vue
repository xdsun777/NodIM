<template>
  <div class="h-full bg-bg-primary overflow-y-auto relative">
    <!-- 标签切换 -->
    <div class="bg-bg-primary px-4 border-b">
      <div class="flex space-x-6">
        <div 
          class="pb-2 border-b-2 cursor-pointer-400 transition-colors"
          :class="activeTab === 'friends' ? 'border-primary-400' : 'border-transparent'"
          @click="activeTab = 'friends'"
        >
          <span 
            class="font-medium transition-colors"
            :class="activeTab === 'friends' ? 'text-primary-400' : 'text-text-primary'"
          >
            好友列表
          </span>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="contactStore.isLoading" class="flex items-center justify-center py-10">
      <div class="text-center">
        <IconFont name="loading" class="w-8 h-8 text-text-primary
         animate-spin mx-auto" />
        <p class="text-sm text-text-primary mt-2">加载中...</p>
      </div>
    </div>

    <!-- 好友列表 -->
    <div v-else class="flex-1 bg-bg-primary px-4 py-2 overflow-y-auto">
      <div class="space-y-3">
        <!-- 在线好友分组 -->
        <div v-if="contactStore.onlineFriends.length > 0">
          <div class="text-xs text-text-primary px-1 py-2">在线 - {{ contactStore.onlineFriends.length }}</div>
          <div 
            v-for="friend in contactStore.onlineFriends" 
            :key="friend.id"
            class="flex items-center space-x-3 bg-bg-primary-second p-3 rounded-lg cursor-pointer hover:bg-bg-primary-second transition-colors"
            @click="openChat(friend.id)"
            @mousedown="startLongPress(friend)"
            @mouseup="endLongPress"
            @mouseleave="endLongPress"
            @touchstart.prevent="startLongPress(friend)"
            @touchend="endLongPress"
            @touchcancel="endLongPress"
          >
            <div class="relative">
              <img
                :src="friend.avatar"
                :alt="friend.name"
                class="w-12 h-12 rounded-full object-cover"
              />
              <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div class="flex-1">
              <div class="font-medium text-gray-800">{{ friend.name }}</div>
              <div class="text-xs text-green-500">在线</div>
            </div>
          </div>
        </div>

        <!-- 离线好友分组 -->
        <div v-if="contactStore.offlineFriends.length > 0">
          <div class="text-xs text-gray-400 px-1 py-2">离线 - {{ contactStore.offlineFriends.length }}</div>
          <div 
            v-for="friend in contactStore.offlineFriends" 
            :key="friend.id"
            class="flex items-center space-x-3 bg-bg-primary-second p-3 rounded-lg cursor-pointer text-text-primary hover:bg-bg-primary-second transition-colors"
            @click="openChat(friend.id)"
            @mousedown="startLongPress(friend)"
            @mouseup="endLongPress"
            @mouseleave="endLongPress"
            @touchstart.prevent="startLongPress(friend)"
            @touchend="endLongPress"
            @touchcancel="endLongPress"
          >
            <div class="relative">
              <img
                :src="friend.avatar"
                :alt="friend.name"
                class="w-12 h-12 rounded-full object-cover opacity-60"
              />
              <div class="absolute bottom-0 right-0 w-3 h-3 bg-gray-400 rounded-full border-2 border-white"></div>
            </div>
            <div class="flex-1">
              <div class="font-medium text-text-primary">{{ friend.name }}</div>
              <div class="text-xs text-gray-400">
                {{ friend.status === 'away' ? '离开' : `离线 ${formatLastSeen(friend.lastSeen)}` }}
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="contactStore.contacts.length === 0" class="text-center py-10">
          <IconFont name="user" class="w-16 h-16 text-gray-300 mx-auto" />
          <p class="text-gray-400 mt-3">暂无好友</p>
          <!-- <button 
            class="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
            @click="goToAddFriend"
          >
            添加好友
          </button> -->
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDeleteModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]" @click.self="closeDeleteModal">
          <div class="bg-white rounded-xl p-6 mx-4 max-w-sm w-full shadow-xl">
            <div class="text-center">
              <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconFont name="delete" class="w-8 h-8 text-red-500" />
              </div>
              <h3 class="text-lg font-semibold text-gray-800 mb-2">确认删除</h3>
              <p class="text-sm text-gray-500 mb-6">确定要删除好友 <span class="font-medium text-gray-800">{{ deletingFriend?.name }}</span> 吗？</p>
              <div class="flex space-x-3">
                <button 
                  class="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                  @click="closeDeleteModal"
                >
                  取消
                </button>
                <button 
                  class="flex-1 py-2 px-4 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                  @click="confirmDelete"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useContactStore, User } from '../stores';
import IconFont from '@/components/common/IconFont.vue';

const router = useRouter();
const contactStore = useContactStore();

// 默认激活好友列表标签
const activeTab = ref('friends');

// 删除确认弹窗状态
const showDeleteModal = ref(false);
const deletingFriend = ref<User | null>(null);

// 长按计时器
let longPressTimer: ReturnType<typeof setTimeout> | null = null;
const LONG_PRESS_DURATION = 500; // 长按500ms触发

// 初始化联系人列表
onMounted(async () => {
  await contactStore.initContacts();
});

onUnmounted(() => {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
  }
});

// 开始长按
const startLongPress = (friend: User) => {
  deletingFriend.value = friend;
  longPressTimer = setTimeout(() => {
    showDeleteModal.value = true;
  }, LONG_PRESS_DURATION);
};

// 结束长按
const endLongPress = () => {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
};

// 关闭删除弹窗
const closeDeleteModal = () => {
  showDeleteModal.value = false;
  deletingFriend.value = null;
};

// 确认删除
const confirmDelete = async () => {
  if (deletingFriend.value) {
    try {
      await contactStore.removeContact(deletingFriend.value.id);
      closeDeleteModal();
    } catch (error) {
      console.error('Failed to delete contact:', error);
    }
  }
};

// 打开私聊
const openChat = (peerId: string) => {
  // 如果正在长按，不执行点击
  if (longPressTimer) {
    endLongPress();
    return;
  }
  
  router.push({
    name: 'global-chat',
    params: { id: peerId },
  });
};

// 跳转到添加好友页面
// const goToAddFriend = () => {
//   console.log('Go to add friend');
// };

// 格式化最后上线时间
const formatLastSeen = (timestamp?: number): string => {
  if (!timestamp) return '';
  
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .bg-white,
.modal-leave-active .bg-white {
  transition: transform 0.2s ease;
}

.modal-enter-from .bg-white,
.modal-leave-to .bg-white {
  transform: scale(0.95);
}
</style>