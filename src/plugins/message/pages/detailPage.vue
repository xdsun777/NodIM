<template>
  <Transition name="chat">
    <div v-show="show" class="chat-page pt-safe">
      <div class="flex items-center p-4 border-b border-border bg-bg-primary">
        <button @click="back" class="p-2 hover:bg-bg-second rounded-lg transition-colors mr-2">
          <IconFont name="a-fanhuiqitaye" class="w-5 h-5 text-text-primary" />
        </button>
        <div class="flex items-center" style="justify-content:start;gap:0px">
          <div
            class="w-10 h-10 rounded-full bg-bg-second flex items-center justify-center flex-shrink-0 mr-3 overflow-hidden">
            <img :src="sessionAvatar" class="w-full h-full rounded-full object-cover" />
          </div>
          <div>
            <h3 class="font-semibold text-text-primary">
              {{ currentSession?.title }}
            </h3>
            <p class="text-xs text-text-primary">
              <span v-if="currentSession?.id === 'broadcast'">广播频道</span>
              <span v-else>{{ isOnline ? '在线' : '离线' }}</span>
            </p>
          </div>
        </div>
        <button class="ml-auto p-2 hover:bg-bg-second rounded-lg transition-colors">
          <IconFont name="more" class="w-5 h-5 text-text-primary" />
        </button>
      </div>
      <div ref="messageListRef" class="flex-1 overflow-y-auto p-4 space-y-4 bg-bg-primary" @scroll="handleScroll">
        <!-- 加载更多提示 -->
        <div v-if="isLoading" class="text-center text-xs text-text-primary py-2">
          <IconFont name="loading" class="w-4 h-4 inline-block animate-spin" />
          <span class="ml-1">加载历史消息...</span>
        </div>

        <!-- 时间戳 -->
        <div v-if="messageList.length > 0" class="text-center text-xs text-text-primary">
          {{ formatDate(messageList[0]?.timestamp) }}
        </div>

        <div v-for="(msg, index) in messageList" :key="msg.id" class="flex" :class="{
          'justify-start items-start space-x-2': !isMe(msg),
          'justify-end items-start space-x-2': isMe(msg)
        }">
          <!-- 对方消息 -->
          <template v-if="!isMe(msg)">
            <div
              class="w-8 h-8 rounded-full bg-bg-second flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer"
              @click="handleAvatarClick(msg)" 
              @contextmenu.prevent="handleAvatarLongPress(msg)"
              @touchstart.prevent="startAvatarLongPress(msg)"
              @touchend="endAvatarLongPress"
              @touchcancel="endAvatarLongPress">
              <img :src="getSenderAvatar(msg)" class="w-full h-full rounded-full object-cover" />
            </div>
            <div class="max-w-xs">
              <!-- 文字消息 -->
              <div v-if="msg.type === 'text'"
                class="bg-bg-primary-second text-text-primary p-3 rounded-lg word-break-all">
                <p>{{ msg.content }}</p>
              </div>
              <!-- 文件消息 -->
              <div v-else-if="msg.type === 'file'"
                class="bg-bg-primary p-3 rounded-lg cursor-pointer hover:bg-bg-second transition-colors"
                @click="downloadFile(msg.fileName || '', msg.transferId)">
                <div class="flex items-center gap-2">
                  <IconFont name="wenjian" class="w-5 h-5 text-text-primary" />
                  <span class="text-text-primary truncate max-w-[150px]">{{ msg.fileName }}</span>
                  <span class="text-text-primary text-xs">{{ formatFileSize(msg.fileSize) }}</span>
                </div>
                <p class="text-xs text-text-secondary mt-1">点击下载</p>
              </div>
              <!-- 图片消息 -->
              <div v-else-if="msg.type === 'image'" class="bg-bg-primary p-1 rounded-lg cursor-pointer"
                @click="previewFile(msg.fileName || '', msg.transferId)">
                <img :src="msg.content" class="max-w-[200px] rounded-lg" />
              </div>
              <!-- 视频消息 -->
              <div v-else-if="msg.type === 'video'" class="relative cursor-pointer"
                @click="previewFile(msg.fileName || '', msg.transferId)">
                <video 
                  :src="msg.content" 
                  class="w-full h-48 object-cover rounded-lg"
                  poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 150'%3E%3Crect fill='%231a1a2e' width='200' height='150'/%3E%3Ctext fill='%23fff' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3E视频文件%3C/text%3E%3C/svg%3E"
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
              <!-- 音频消息 -->
              <div v-else-if="msg.type === 'audio'" class="bg-bg-primary p-3 rounded-lg">
                <audio 
                  :src="msg.content" 
                  controls 
                  class="w-full"
                  preload="metadata"
                />
                <div class="mt-2 text-xs text-text-secondary">
                  <p class="truncate">{{ msg.fileName }}</p>
                  <p>{{ formatFileSize(msg.fileSize) }}</p>
                </div>
              </div>
              <!-- 其他消息类型 -->
              <div v-else class="bg-bg-primary text-text-primary p-3 rounded-lg">
                <span class="text-sm">无法显示的消息类型</span>
              </div>
            </div>
          </template>

          <!-- 自己消息 -->
          <template v-else>
            <div class="max-w-xs">
              <!-- 文字消息 -->
              <div v-if="msg.type === 'text'" class="bg-primary text-white p-3 rounded-lg word-break-all">
                <p>{{ msg.content }}</p>
              </div>
              <!-- 文件消息 -->
              <div v-else-if="msg.type === 'file'"
                class="bg-primary p-3 rounded-lg cursor-pointer hover:bg-primary/80 transition-colors"
                @click="downloadFile(msg.fileName || '', msg.transferId)">
                <div class="flex items-center gap-2">
                  <IconFont name="wenjian" class="w-5 h-5 text-white" />
                  <span class="text-white truncate max-w-[150px]">{{ msg.fileName }}</span>
                  <span class="text-white/70 text-xs">{{ formatFileSize(msg.fileSize) }}</span>
                </div>
                <p class="text-xs text-white/50 mt-1">点击下载</p>
              </div>
              <!-- 图片消息 -->
              <div v-else-if="msg.type === 'image'" class="bg-primary p-1 rounded-lg cursor-pointer"
                @click="previewFile(msg.fileName || '', msg.transferId)">
                <img :src="msg.content" class="max-w-[200px] rounded-lg" />
              </div>
              <!-- 视频消息 -->
              <div v-else-if="msg.type === 'video'" class="relative cursor-pointer"
                @click="previewFile(msg.fileName || '', msg.transferId)">
                <video 
                  :src="msg.content" 
                  class="w-full h-48 object-cover rounded-lg"
                  poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 150'%3E%3Crect fill='%231a1a2e' width='200' height='150'/%3E%3Ctext fill='%23fff' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3E视频文件%3C/text%3E%3C/svg%3E"
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
              <!-- 音频消息 -->
              <div v-else-if="msg.type === 'audio'" class="bg-primary p-3 rounded-lg">
                <audio 
                  :src="msg.content" 
                  controls 
                  class="w-full"
                  preload="metadata"
                />
                <div class="mt-2 text-xs text-white/70">
                  <p class="truncate">{{ msg.fileName }}</p>
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
                <IconFont v-if="msg.status === 'delivered'" name="dingdan" class="w-3 h-3 text-text-primary" />
                <IconFont v-else-if="msg.status === 'sent'" name="duigou" class="w-3 h-3 text-text-primary" />
                <IconFont v-else-if="msg.status === 'read'" name="duigou" class="w-3 h-3 text-primary" />
                <IconFont v-else-if="msg.status === 'sending'" name="loading"
                  class="w-3 h-3 text-text-primary animate-spin" />
                <IconFont v-else-if="msg.status === 'failed'" name="cuowu" class="w-3 h-3 text-error" />
              </div>
            </div>
            <div
              class="w-8 h-8 rounded-full bg-bg-second flex items-center justify-center flex-shrink-0 overflow-hidden">
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

      <!-- 添加联系人弹窗 -->
      <Teleport to="body">
        <Transition name="modal">
          <div v-if="showContactModal" class="contact-modal-overlay" @click.self="closeModal">
            <div class="contact-modal-content">
              <h3 class="text-lg font-semibold text-text-primary mb-4 text-center">添加联系人</h3>
              <div class="flex flex-col items-center mb-4">
                <div class="w-16 h-16 rounded-full bg-bg-second flex items-center justify-center overflow-hidden mb-3">
                  <img :src="avatar(selectedPeerId)" class="w-full h-full rounded-full object-cover" />
                </div>
                <p class="text-sm text-text-primary break-all text-center">{{ selectedPeerId }}</p>
              </div>
              <div class="mb-4">
                <label class="block text-sm text-text-primary mb-2">设置用户名</label>
                <input v-model="userNameInput" type="text"
                  class="w-full bg-bg-primary text-text-primary rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="输入用户名" @keyup.enter="addContact" />
              </div>
              <div class="flex gap-3">
                <button @click="closeModal"
                  class="flex-1 py-2 rounded-lg bg-bg-second text-text-primary hover:bg-bg-third transition-colors">
                  取消
                </button>
                <button @click="addContact"
                  class="flex-1 py-2 rounded-lg bg-primary text-white hover:bg-primary/80 transition-colors">
                  添加
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
      <!-- 文件预览弹窗 -->
      <Teleport to="body">
        <Transition name="modal">
          <div v-if="showPreview" class="fixed inset-0 bg-black/80 flex items-center justify-center z-[100000]"
            @click.self="closePreview">
            <div class="bg-bg-primary rounded-xl max-w-[90vw] max-h-[90vh] overflow-hidden">
              <div class="flex items-center justify-between p-4 border-b border-border">
                <span class="text-text-primary font-medium">{{ previewFileName }}</span>
                <button @click="closePreview" class="p-2 hover:bg-bg-second rounded-lg">
                  <IconFont name="guanbi" class="w-5 h-5 text-text-primary" />
                </button>
              </div>
              <div class="p-4 max-h-[70vh] overflow-auto">
                <!-- 图片预览 -->
                <div v-if="previewType === 'image'" class="flex justify-center">
                  <img :src="previewUrl" class="max-w-full max-h-[60vh] object-contain" />
                </div>
                <!-- 视频预览 -->
                <div v-else-if="previewType === 'video'" class="flex justify-center">
                  <video :src="previewUrl" controls class="max-w-full max-h-[60vh] object-contain" />
                </div>
                <!-- 音频预览 -->
                <div v-else-if="previewType === 'audio'" class="w-full">
                  <audio :src="previewUrl" controls class="w-full" />
                </div>
                <!-- 文本预览 -->
                <div v-else-if="previewType === 'text'" class="w-full">
                  <pre class="text-text-primary whitespace-pre-wrap break-all">{{ previewTextContent }}</pre>
                </div>
                <!-- 其他类型 -->
                <div v-else class="flex flex-col items-center justify-center py-8">
                  <IconFont name="wenjian" class="w-16 h-16 text-text-secondary mb-4" />
                  <p class="text-text-secondary">无法预览此文件类型</p>
                  <button @click="downloadFile(previewFileName, previewTransferId || undefined)"
                    class="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors">
                    下载文件
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
      <!-- [/MODULE] 5c6_聊天消息区域 -->

      <!-- [MODULE] 7d8_输入区域 -->
      <div class="p-4 border-t border-border bg-bg-primary flex items-end">
        <button class="text-primary mr-3 mb-2">
          <IconFont name="a-biaoqing" class="w-6 h-6" />
        </button>
        <div class="flex-1 relative">
          <textarea v-model="content" @keydown.enter.exact.prevent="send"
            class="w-full bg-bg-primary-second text-text-primary rounded-full py-2 px-4 focus:outline-none resize-none"
            placeholder="输入..." rows="1" @focus="handleInputFocus" @blur="handleInputBlur" @input="autoResize"
            ref="inputRef"></textarea>
        </div>
        <input ref="fileInputRef" type="file" class="hidden bg-bg-primary text-text-primary" @change="handleFileSelect"
          accept="image/*,video/*,audio/*,text/*,.pdf,.zip,.rar,.7z,.doc,.docx,.xls,.xlsx,.ppt,.pptx" />
        <button class="text-primary mx-3 mb-2" @click="triggerFileSelect">
          <IconFont name="jiahao" class="w-6 h-6" />
        </button>
        <button @click="send" class="text-primary mb-2">
          <IconFont name="yuyinshuru" class="w-6 h-6" />
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
import { chatDB } from '@/utils/preprocessing';
import type { User } from '@/utils/preprocessing';
import { fileStorageDB } from '@/utils/fileStorageDB';

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
const showContactModal = ref(false);
const selectedPeerId = ref('');
const userNameInput = ref('');
const inputRef = ref<HTMLTextAreaElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

// 文件预览相关状态
const showPreview = ref(false);
const previewUrl = ref('');
const previewType = ref<'image' | 'video' | 'audio' | 'text' | 'other'>('other');
const previewFileName = ref('');
const previewTransferId = ref<number | null>(null);

/**
 * 根据文件扩展名获取 MIME 类型
 */
const getMimeType = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'bmp': 'image/bmp',
    'svg': 'image/svg+xml',
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'xml': 'application/xml',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
    'webm': 'video/webm'
  };
  return mimeTypes[extension] || 'application/octet-stream';
};

/**
 * 根据文件名确定预览类型
 */
const getPreviewType = (fileName: string): 'image' | 'video' | 'audio' | 'text' | 'other' => {
  const mimeType = getMimeType(fileName);
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('text/')) return 'text';
  return 'other';
};

// 文本预览内容
const previewTextContent = ref('');

/**
 * 预览文件
 */
const previewFile = async (fileName: string, transferId?: number) => {
  try {
    if (!transferId) {
      // 如果没有 transferId，尝试从 content 中提取
      const match = fileName.match(/file:\/\/(\d+)/);
      transferId = match ? parseInt(match[1]) : Date.now();
    }

    previewFileName.value = fileName;
    previewTransferId.value = transferId;
    previewType.value = getPreviewType(fileName);

    // 获取二进制数据
    const binaryData = await fileStorageDB.getAllChunks(transferId);
    const mimeType = getMimeType(fileName);

    // 根据文件类型处理预览
    if (previewType.value === 'text') {
      // 文本文件直接转换为字符串
      previewTextContent.value = new TextDecoder().decode(binaryData);
      previewUrl.value = '';
    } else {
      // 其他类型创建 blob URL
      const blob = new Blob([binaryData], { type: mimeType });
      previewUrl.value = URL.createObjectURL(blob);
      previewTextContent.value = '';
    }

    showPreview.value = true;

    console.log('File previewed:', fileName);
  } catch (error) {
    console.error('Preview failed:', error);
    alert('预览失败: ' + (error instanceof Error ? error.message : String(error)));
  }
};

/**
 * 关闭预览
 */
const closePreview = () => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = '';
  }
  showPreview.value = false;
  previewFileName.value = '';
  previewTransferId.value = null;
  previewType.value = 'other';
};

/**
 * 下载文件
 */
const downloadFile = async (fileName: string, transferId?: number) => {
  try {
    if (!transferId) {
      const match = fileName.match(/file:\/\/(\d+)/);
      transferId = match ? parseInt(match[1]) : Date.now();
    }

    const mimeType = getMimeType(fileName);
    const binaryData = await fileStorageDB.getAllChunks(transferId);

    if ('showSaveFilePicker' in window) {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [{
          description: 'File',
          accept: { [mimeType]: ['.' + fileName.split('.').pop()] }
        }]
      });

      const writable = await handle.createWritable();
      await writable.write(binaryData);
      await writable.close();
      console.log('File saved:', fileName);
      alert('文件已保存到指定位置');
    } else {
      // 传统下载方式
      const blob = new Blob([binaryData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      console.log('File downloaded:', fileName);
    }
  } catch (error) {
    console.error('Download failed:', error);
    alert('下载失败: ' + (error instanceof Error ? error.message : String(error)));
  }
};

/**
 * 根据会话类型生成头像
 */
const sessionAvatar = computed(() => {
  if (!currentSession.value) return avatar('default');
  if (currentSession.value.avatar) return currentSession.value.avatar;
  if (currentSession.value.id === 'broadcast') {
    return avatar('广播');
  }
  // 私聊：使用对方的 peerID 生成头像
  return avatar(currentSession.value.id);
});

/**
 * 判断对方是否在线
 */
const isOnline = computed(() => {
  if (!currentSession.value || currentSession.value.id === 'broadcast') {
    return true; // 广播频道默认显示在线
  }
  return store.isPeerOnline(currentSession.value.id);
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

/**
 * 处理头像点击事件
 * 广播消息中点击头像跳转到私聊，私聊中点击头像打开添加联系人弹窗
 */
const handleAvatarClick = async (msg: typeof messageList.value[0]) => {
  // 如果正在长按，不执行点击
  if (avatarLongPressTimer) {
    endAvatarLongPress();
    return;
  }
  
  // 检查当前是否是广播会话
  const sessionId = route.params.id as string;
  if (sessionId === 'broadcast') {
    // 广播消息：点击头像跳转到私聊
    
    // 检查是否已存在该会话
    const existingSession = store.sessionList.find((item) => item.id === msg.from);
    
    if (!existingSession) {
      // 会话不存在，先创建
      await store.addOrUpdateSession(msg.from);
    }
    
    // 跳转到私聊（使用对方的 peerId 作为会话 ID）
    router.push({
      name: 'global-chat',
      params: { id: msg.from },
    });
  } else {
    // 私聊消息：点击头像打开添加联系人弹窗
    selectedPeerId.value = msg.from;
    userNameInput.value = msg.from.substring(0, 8);
    showContactModal.value = true;
  }
};

/**
 * 处理头像长按事件（右键菜单）
 */
const handleAvatarLongPress = (msg: typeof messageList.value[0]) => {
  selectedPeerId.value = msg.from;
  userNameInput.value = msg.from.substring(0, 8);
  showContactModal.value = true;
};

// 触摸长按计时器
let avatarLongPressTimer: ReturnType<typeof setTimeout> | null = null;
let longPressMsg: typeof messageList.value[0] | null = null;
const AVATAR_LONG_PRESS_DURATION = 500; // 长按500ms触发

/**
 * 开始触摸长按
 */
const startAvatarLongPress = (msg: typeof messageList.value[0]) => {
  longPressMsg = msg;
  avatarLongPressTimer = setTimeout(() => {
    if (longPressMsg) {
      handleAvatarLongPress(longPressMsg);
    }
  }, AVATAR_LONG_PRESS_DURATION);
};

/**
 * 结束触摸长按
 */
const endAvatarLongPress = () => {
  if (avatarLongPressTimer) {
    clearTimeout(avatarLongPressTimer);
    avatarLongPressTimer = null;
  }
  longPressMsg = null;
};

/**
 * 添加联系人
 */
const addContact = async () => {
  if (!selectedPeerId.value || !userNameInput.value.trim()) return;

  try {
    const user: User = {
      id: selectedPeerId.value,
      name: userNameInput.value.trim(),
      avatar: avatar(selectedPeerId.value),
      status: 'offline',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await chatDB.putUser(user);
    console.log('Contact added:', user);
    // alert('联系人添加成功！');
    showContactModal.value = false;
  } catch (error) {
    console.error('Failed to add contact:', error);
    alert('添加联系人失败');
  }
};

/**
 * 关闭弹窗
 */
const closeModal = () => {
  showContactModal.value = false;
  selectedPeerId.value = '';
  userNameInput.value = '';
};

const handleInputFocus = () => {
  nextTick(() => {
    scrollToBottom();
  });
};

const handleInputBlur = () => { };

/**
 * 触发文件选择对话框
 */
const triggerFileSelect = () => {
  fileInputRef.value?.click();
};

/**
 * 处理文件选择
 */
const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  try {
    // 获取文件数据
    const arrayBuffer = await file.arrayBuffer();
    const data = Array.from(new Uint8Array(arrayBuffer));

    // 发送文件消息
    await store.sendFileMessage(file.name, data, file.size);

    // 清空文件输入
    if (fileInputRef.value) {
      fileInputRef.value.value = '';
    }

    console.log('File sent:', file.name);
  } catch (error) {
    console.error('Failed to send file:', error);
    alert('发送文件失败: ' + (error instanceof Error ? error.message : String(error)));
  }
};

/**
 * 自动调整输入框高度
 */
const autoResize = () => {
  if (!inputRef.value) return;
  inputRef.value.style.height = 'auto';
  inputRef.value.style.height = Math.min(inputRef.value.scrollHeight, 120) + 'px';
};

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
    if (isLoadingHistory.value) {
      return;
    }

    // 如果没有未读消息，滚动到底部
    if (getUnreadCount() === 0) {
      scrollToBottom();
    }
  });
}, { deep: true });

/**
 * 监听路由参数变化，切换会话
 */
watch(() => route.params.id, async (newId, oldId) => {
  if (newId && newId !== oldId) {
    // 路由参数变化，重新初始化消息列表
    const unreadCountBefore = getUnreadCount();
    
    await store.initMessageList(newId);
    await store.markAsRead(newId);
    
    nextTick(() => {
      if (unreadCountBefore === 0) {
        scrollToBottom();
      }
    });
  }
});

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
  setTimeout(() => router.push('/message'), 350);
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
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

.word-break-all,
.break-all {
  word-break: break-all;
  overflow-wrap: break-word;
}

/* 添加联系人弹窗样式 */
.contact-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.contact-modal-content {
  background-color: var(--bg-primary);
  border-radius: 16px;
  padding: 24px;
  width: 320px;
  margin: 0 16px;
  position: relative;
  z-index: 100000;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

/* 弹窗过渡动画 */
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .contact-modal-content,
.modal-leave-to .contact-modal-content {
  transform: scale(0.9);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .contact-modal-content,
.modal-leave-active .contact-modal-content {
  transition: transform 0.2s ease;
}
</style>