<template>
  <div class="im-container">
    <h1>NodIM 局域网 P2P 聊天</h1>

    <!-- 本地节点信息 -->
    <div class="card">
      <h3>本地节点 ID</h3>
      <p class="peer-id">{{ localPeerId }}</p>
    </div>

    <!-- 在线节点列表 -->
    <div class="card">
      <h3>已发现节点 ({{ peers.length }})</h3>
      <div class="peer-list">
        <!-- 修复1：peer_id -->
        <div v-for="peer in peers" :key="peer.peer_id" class="peer-item">
          {{ peer.peer_id }}
        </div>
        <div v-if="peers.length === 0">暂无发现节点</div>
      </div>
    </div>

    <!-- 广播聊天 -->
    <div class="card">
      <h3>群聊广播</h3>
      <div class="message-box" ref="broadcastBox">
        <div v-for="(msg, idx) in broadcastMessages" :key="idx" class="message">
          <span class="sender">[{{ msg.sender }}]</span>
          <span class="content">{{ msg.content }}</span>
        </div>
      </div>
      <div class="input-row">
        <input
          v-model="broadcastInput"
          @keyup.enter="sendBroadcast"
          placeholder="输入群聊消息..."
        />
        <button @click="sendBroadcast">发送</button>
      </div>
    </div>

    <!-- 私聊 -->
    <div class="card">
      <h3>点对点私聊</h3>
      <div class="message-box" ref="privateBox">
        <div v-for="(msg, idx) in privateMessages" :key="idx" class="message private">
          <span class="sender">[{{ msg.sender }}]</span>
          <span class="content">{{ msg.content }}</span>
        </div>
      </div>
      <div class="input-row">
        <select v-model="targetPeerId">
          <option value="">选择目标节点</option>
          <!-- 修复2：peer_id -->
          <option v-for="peer in peers" :key="peer.peer_id" :value="peer.peer_id">
            {{ peer.peer_id }}
          </option>
        </select>
        <input
          v-model="privateInput"
          @keyup.enter="sendPrivate"
          placeholder="输入私聊消息..."
        />
        <button @click="sendPrivate">发送</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

// ============== 修复3：字段名改为 peer_id（匹配后端） ==============
interface PeerInfo {
  peer_id: string;
}

interface ChatMessage {
  sender: string;
  content: string;
}

// ============== 响应式数据 ==============
const localPeerId = ref<string>('加载中...');
const peers = ref<PeerInfo[]>([]);

const broadcastMessages = ref<ChatMessage[]>([]);
const privateMessages = ref<ChatMessage[]>([]);
const broadcastInput = ref('');
const privateInput = ref('');
const targetPeerId = ref('');

const broadcastBox = ref<HTMLElement | null>(null);
const privateBox = ref<HTMLElement | null>(null);

const scrollToBottom = (el: HTMLElement | null) => {
  if (el) nextTick(() => el.scrollTop = el.scrollHeight);
};

// ============== Tauri 命令调用 ==============
const getLocalPeerId = async () => {
  try {
    const id = await invoke<string>('get_local_peer_id');
    localPeerId.value = id;
  } catch (err) {
    console.error('获取本地ID失败:', err);
  }
};

const getPeers = async () => {
  try {
    const list = await invoke<PeerInfo[]>('get_discovered_peers');
    peers.value = list;
  } catch (err) {
    console.error('获取节点失败:', err);
  }
};

const sendBroadcast = async () => {
  if (!broadcastInput.value.trim()) return;
  try {
    await invoke('send_broadcast', { msg: broadcastInput.value });
    // 自己发送的消息本地渲染（libp2p自己不会收到自己的广播消息）
    broadcastMessages.value.push({
      sender: '我',
      content: broadcastInput.value
    });
    broadcastInput.value = '';
    scrollToBottom(broadcastBox.value);
  } catch (err) {
    console.error('发送广播失败:', err);
  }
};

const sendPrivate = async () => {
  if (!targetPeerId.value || !privateInput.value.trim()) return;
  try {
    await invoke('send_private_msg', {
      peerId: targetPeerId.value,
      msg: privateInput.value
    });
    privateMessages.value.push({
      sender: '我',
      content: privateInput.value
    });
    privateInput.value = '';
    scrollToBottom(privateBox.value);
  } catch (err) {
    console.error('发送私聊失败:', err);
  }
};

// ============== 监听后端事件 ==============
let unlistenPeer: (() => void) | null = null;
let unlistenBroadcast: (() => void) | null = null;
let unlistenPrivate: (() => void) | null = null;

const listenEvents = async () => {
  // 节点发现
  unlistenPeer = await listen('peer:discovered', () => {
    getPeers();
  });

  // 广播消息
  unlistenBroadcast = await listen<[string, string]>('message:broadcast', (event) => {
    const [sender, content] = event.payload;
    broadcastMessages.value.push({ sender, content });
    scrollToBottom(broadcastBox.value);
  });

  // 私聊消息
  unlistenPrivate = await listen<[string, string]>('message:private', (event) => {
    const [sender, content] = event.payload;
    privateMessages.value.push({ sender, content });
    scrollToBottom(privateBox.value);
  });
};

onMounted(async () => {
  await getLocalPeerId();
  await getPeers();
  await listenEvents();
});

onUnmounted(() => {
  unlistenPeer?.();
  unlistenBroadcast?.();
  unlistenPrivate?.();
});
</script>

<style scoped>
/* 样式不变，直接保留 */
.im-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}
.card {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.peer-id {
  font-family: monospace;
  font-size: 14px;
  color: #2c3e50;
  word-break: break-all;
}
.peer-list {
  max-height: 120px;
  overflow-y: auto;
}
.peer-item {
  padding: 4px 0;
  font-family: monospace;
  font-size: 13px;
}
.message-box {
  height: 200px;
  overflow-y: auto;
  background: white;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 10px;
}
.message {
  margin: 6px 0;
  line-height: 1.4;
}
.message.private {
  color: #27ae60;
}
.sender {
  font-weight: bold;
  margin-right: 6px;
  color: #3498db;
}
.input-row {
  display: flex;
  gap: 8px;
}
input, select {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
button {
  padding: 8px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:hover {
  background: #2980b9;
}
</style>