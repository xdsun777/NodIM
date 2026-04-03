<template>
  <div class="p-4 max-w-lg mx-auto">
    <h1 class="text-2xl font-bold mb-4">P2P 聊天</h1>
    
    <!-- 节点信息 -->
    <div class="bg-gray-100 p-3 rounded mb-4">
      <p><strong>我的节点ID:</strong></p>
      <p class="text-sm break-all">{{ myPeerId || '未初始化' }}</p>
    </div>
    
    <!-- 连接面板 -->
    <div class="flex gap-2 mb-4">
      <input 
        v-model="peerAddr" 
        placeholder="输入对方地址 (例: /ip4/127.0.0.1/tcp/4001/p2p/...)"
        class="flex-1 border p-2 rounded"
      />
      <button @click="connect" class="bg-blue-500 text-white px-4 py-2 rounded">连接</button>
    </div>
    
    <!-- 消息列表 -->
    <div class="h-96 overflow-y-auto border rounded p-3 mb-4">
      <div v-for="(msg, idx) in messages" :key="idx" class="mb-2">
        <div :class="msg.isMe ? 'text-right' : 'text-left'">
          <span class="text-xs text-gray-500">{{ msg.fromName }}</span>
          <div :class="msg.isMe ? 'bg-blue-500 text-white' : 'bg-gray-300'" 
               class="inline-block px-3 py-1 rounded-lg">
            {{ msg.content }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- 文本消息输入 -->
    <div class="flex gap-2 mb-4">
      <input 
        v-model="textMessage" 
        @keyup.enter="sendText"
        placeholder="输入文本消息..."
        class="flex-1 border p-2 rounded"
      />
      <button @click="sendText" class="bg-green-500 text-white px-4 py-2 rounded">发送</button>
    </div>
    
    <!-- 音频消息输入 -->
    <div class="flex gap-2">
      <button @click="startRecording" :disabled="isRecording" 
              class="bg-red-500 text-white px-4 py-2 rounded">
        {{ isRecording ? '录音中...' : '开始录音' }}
      </button>
      <button @click="stopRecording" :disabled="!isRecording" 
              class="bg-gray-500 text-white px-4 py-2 rounded">
        停止并发送
      </button>
      <span v-if="recordingTime" class="ml-2 text-gray-600">{{ recordingTime }}s</span>
    </div>
    
    <!-- 音频播放器 -->
    <audio ref="audioPlayer" class="hidden"></audio>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

interface Message {
  fromName: string;
  content: string;
  isMe: boolean;
}

const myPeerId = ref('');
const peerAddr = ref('');
const textMessage = ref('');
const messages = ref<Message[]>([]);
const audioPlayer = ref<HTMLAudioElement>();

// 录音相关
const isRecording = ref(false);
const recordingTime = ref(0);
let mediaRecorder: MediaRecorder | null = null;
let recordingTimer: number | null = null;
let audioChunks: Blob[] = [];

// 初始化 P2P
onMounted(async () => {
  // 监听后端事件
  await listen('p2p-message', (event: any) => {
    const { from, message } = event.payload;
    messages.value.push({
      fromName: from.slice(0, 12) + '...',
      content: message.content,
      isMe: false,
    });
  });
  
  await listen('p2p-audio', (event: any) => {
    const { from, data } = event.payload;
    // Base64 解码并播放
    const audioData = Uint8Array.from(atob(data), c => c.charCodeAt(0));
    const blob = new Blob([audioData], { type: 'audio/webm' });
    const url = URL.createObjectURL(blob);
    if (audioPlayer.value) {
      audioPlayer.value.src = url;
      audioPlayer.value.play();
    }
    messages.value.push({
      fromName: from.slice(0, 12) + '...',
      content: '📢 语音消息 (点击已自动播放)',
      isMe: false,
    });
  });
  
  await listen('peer-connected', (event: any) => {
    console.log('新连接:', event.payload);
  });
  
  // 启动 P2P 节点
  try {
    const peerId = await invoke<string>('init_p2p');
    myPeerId.value = peerId;
  } catch (error) {
    console.error('初始化失败:', error);
  }
});

// 发送文本消息
async function sendText() {
  if (!textMessage.value.trim() || !peerAddr.value) return;
  
  // 从地址中提取 PeerId
  const peerIdMatch = peerAddr.value.match(/p2p\/([a-zA-Z0-9]+)/);
  if (!peerIdMatch) {
    console.error('无效的地址格式');
    return;
  }
  const targetPeerId = peerIdMatch[1];
  
  try {
    await invoke('send_text_message', {
      target: targetPeerId,
      content: textMessage.value,
    });
    messages.value.push({
      fromName: '我',
      content: textMessage.value,
      isMe: true,
    });
    textMessage.value = '';
  } catch (error) {
    console.error('发送失败:', error);
  }
}

// 连接对方节点
async function connect() {
  if (!peerAddr.value) return;
  try {
    await invoke('connect_to_peer', { addr: peerAddr.value });
    console.log('连接请求已发送');
  } catch (error) {
    console.error('连接失败:', error);
  }
}

// 录音实现
async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      // 转换为 ArrayBuffer 发送给后端
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // 发送音频消息
      const peerIdMatch = peerAddr.value.match(/p2p\/([a-zA-Z0-9]+)/);
      if (peerIdMatch) {
        await invoke('send_audio_message', {
          target: peerIdMatch[1],
          data: Array.from(uint8Array),
        });
        messages.value.push({
          fromName: '我',
          content: '📢 语音消息 (已发送)',
          isMe: true,
        });
      }
      
      // 清理
      stream.getTracks().forEach(track => track.stop());
      if (recordingTimer) clearInterval(recordingTimer);
      recordingTime.value = 0;
    };
    
    mediaRecorder.start();
    isRecording.value = true;
    
    // 计时
    recordingTimer = window.setInterval(() => {
      recordingTime.value += 1;
    }, 1000);
  } catch (error) {
    console.error('录音失败:', error);
  }
}

function stopRecording() {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop();
    isRecording.value = false;
  }
}

onUnmounted(() => {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop();
  }
});
</script>