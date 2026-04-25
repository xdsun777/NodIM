# NodIM P2P 通信集成指南

## 总体架构

本项目使用 Tauri + libp2p 实现跨平台的 P2P 通信。前端通过 Tauri Command 调用 Rust 后端的 P2P 功能。

## 核心功能

### 1. 身份管理

#### 生成新身份
```typescript
// 生成新的密钥和 PeerId
const [peerId, keyBase64] = await invoke<[string, string]>('generate_identity');

// 保存到本地存储（重要：用于身份恢复）
localStorage.setItem('p2p_peer_id', peerId);
localStorage.setItem('p2p_key', keyBase64);
```

#### 使用保存的身份启动 P2P
```typescript
// 从本地恢复身份
const savedKey = localStorage.getItem('p2p_key');

// 启动 P2P 网络
const peerIdStr = await invoke<string>('start_with_identity', {
  keyBase64: savedKey
});

console.log('本节点 PeerId:', peerIdStr);
```

### 2. 事件监听

Rust 后端会通过 Tauri 事件发送各种 P2P 事件。前端需要监听这些事件：

```typescript
import { listen } from '@tauri-apps/api/event';

// 监听对等节点已连接
listen('p2p:peer-connected', (event) => {
  console.log('节点已连接:', event.payload);
  // 更新 UI：显示连接列表
});

// 监听对等节点已断开连接
listen('p2p:peer-disconnected', (event) => {
  console.log('节点已断开连接:', event.payload);
});

// 监听对等节点被发现
listen('p2p:peer-discovered', (event) => {
  const { peer, addr } = event.payload;
  console.log(`发现节点 ${peer} 在 ${addr}`);
  // 自动连接或显示在列表中
});

// 监听接收到的广播消息
listen('p2p:broadcast-received', (event) => {
  const { from, message } = event.payload;
  console.log(`来自 ${from} 的广播: ${message}`);
  // 更新聊天界面
});

// 监听接收到的私聊消息
listen('p2p:private-message-received', (event) => {
  const { from, text } = event.payload;
  console.log(`来自 ${from} 的私聊: ${text}`);
  // 更新私聊界面
});

// 监听文件传输请求
listen('p2p:file-request', (event) => {
  const { peer, transferId, fileName, fileSize } = event.payload;
  console.log(`${peer} 想发送文件 ${fileName} (${fileSize} 字节)`);
  // 弹出接受/拒绝对话框
});

// 监听文件传输开始
listen('p2p:file-transfer-started', (event) => {
  const { peer, transferId, fileName } = event.payload;
  console.log(`开始接收文件 ${fileName} 来自 ${peer}`);
});

// 监听文件传输进度
listen('p2p:file-transfer-progress', (event) => {
  const { peer, transferId, received, total, progress } = event.payload;
  console.log(`文件传输进度: ${progress}% (${received}/${total})`);
  // 更新进度条
});

// 监听文件接收完成
listen('p2p:file-received', (event) => {
  const { peer, fileName, savedPath } = event.payload;
  console.log(`文件接收完成: ${fileName} -> ${savedPath}`);
  // 通知用户，提供下载链接
});

// 监听文件发送完成
listen('p2p:file-sent', (event) => {
  const { peer, transferId } = event.payload;
  console.log(`文件发送完成 transferId: ${transferId}`);
});
```

### 3. 广播消息

发送广播消息到所有连接的节点：

```typescript
async function broadcastMessage(message: string) {
  try {
    await invoke('broadcast_message', {
      message
    });
    console.log('广播消息已发送');
  } catch (error) {
    console.error('广播失败:', error);
  }
}
```

### 4. 私聊消息

发送私聊消息到特定的节点：

```typescript
async function sendPrivateMessage(peerId: string, message: string) {
  try {
    await invoke('send_private', {
      peerId,
      message
    });
    console.log(`私聊已发送给 ${peerId}`);
  } catch (error) {
    console.error('发送失败:', error);
  }
}
```

### 5. 文件传输

#### 方式 1: 发送本地文件
```typescript
async function sendFile(peerId: string, filePath: string) {
  try {
    await invoke('send_file', {
      peerId,
      path: filePath
    });
    console.log(`文件发送中: ${filePath}`);
  } catch (error) {
    console.error('发送文件失败:', error);
  }
}
```

#### 方式 2: 发送二进制数据
```typescript
async function sendBinaryData(peerId: string, fileName: string, data: Vec<u8>) {
  try {
    await invoke('send_file_binary', {
      peerId,
      name: fileName,
      data
    });
    console.log(`二进制数据已发送: ${fileName}`);
  } catch (error) {
    console.error('发送二进制数据失败:', error);
  }
}

// 示例：发送图片
async function sendImageToFriend(peerId: string, imageBlob: Blob) {
  const arrayBuffer = await imageBlob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  await sendBinaryData(
    peerId,
    imageBlob.name || 'image.png',
    // 注意：实际传输应该分块，这里简化了
    Array.from(uint8Array)
  );
}
```

### 6. 查询节点信息

#### 获取已连接的节点
```typescript
async function getConnectedPeers() {
  const peers = await invoke<string[]>('get_connected_peers');
  console.log('已连接节点:', peers);
  return peers;
}
```

#### 获取已发现的节点
```typescript
async function getDiscoveredPeers() {
  const peers = await invoke<Array<[string, string]>>('get_discovered_peers');
  // peers: [[peerId, multiaddr], ...]
  console.log('已发现节点:', peers);
  return peers;
}
```

#### 获取本节点的 PeerId
```typescript
async function getMyPeerId() {
  const myId = await invoke<string | null>('get_peer_id');
  console.log('我的 PeerId:', myId);
  return myId;
}
```

## Vue 3 集成示例

### 创建 P2P 服务
```typescript
// services/p2pService.ts
import { invoke } from '@tauri-apps/api/command';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

export class P2PService {
  private unlisteners: UnlistenFn[] = [];

  async initialize() {
    // 从本地恢复或生成新身份
    let key = localStorage.getItem('p2p_key');
    
    if (!key) {
      const [peerId, keyBase64] = await invoke<[string, string]>('generate_identity');
      key = keyBase64;
      localStorage.setItem('p2p_peer_id', peerId);
      localStorage.setItem('p2p_key', key);
    }

    // 启动 P2P
    await invoke('start_with_identity', { keyBase64: key });
    
    // 注册事件监听
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // 监听各个事件并存储 unlisten 函数
    listen('p2p:peer-connected', this.onPeerConnected.bind(this)).then(fn => this.unlisteners.push(fn));
    listen('p2p:broadcast-received', this.onBroadcastReceived.bind(this)).then(fn => this.unlisteners.push(fn));
    listen('p2p:private-message-received', this.onPrivateMessageReceived.bind(this)).then(fn => this.unlisteners.push(fn));
    listen('p2p:file-received', this.onFileReceived.bind(this)).then(fn => this.unlisteners.push(fn));
  }

  private onPeerConnected(event: any) {
    // 发出事件或更新状态
    console.log('Peer connected:', event.payload);
  }

  private onBroadcastReceived(event: any) {
    const { from, message } = event.payload;
    console.log(`Broadcast from ${from}: ${message}`);
  }

  private onPrivateMessageReceived(event: any) {
    const { from, text } = event.payload;
    console.log(`Private message from ${from}: ${text}`);
  }

  private onFileReceived(event: any) {
    const { peer, fileName, savedPath } = event.payload;
    console.log(`File received from ${peer}: ${fileName} -> ${savedPath}`);
  }

  async broadcast(message: string) {
    return invoke('broadcast_message', { message });
  }

  async sendPrivate(peerId: string, message: string) {
    return invoke('send_private', { peerId, message });
  }

  async sendFile(peerId: string, path: string) {
    return invoke('send_file', { peerId, path });
  }

  async sendBinaryData(peerId: string, name: string, data: Uint8Array) {
    return invoke('send_file_binary', {
      peerId,
      name,
      data: Array.from(data)
    });
  }

  async getConnectedPeers() {
    return invoke<string[]>('get_connected_peers');
  }

  async getDiscoveredPeers() {
    return invoke<Array<[string, string]>>('get_discovered_peers');
  }

  async getMyPeerId() {
    return invoke<string | null>('get_peer_id');
  }

  cleanup() {
    this.unlisteners.forEach(fn => fn());
  }
}
```

### 在 Vue Component 中使用
```vue
<template>
  <div class="p2p-chat">
    <div class="peers">
      <h3>已连接节点 ({{ connectedPeers.length }})</h3>
      <div v-for="peer in connectedPeers" :key="peer" class="peer-item">
        {{ peer }}
      </div>
    </div>

    <div class="messages">
      <h3>广播消息</h3>
      <div v-for="msg in broadcastMessages" :key="msg.id" class="message">
        <strong>{{ msg.from }}:</strong> {{ msg.text }}
      </div>
    </div>

    <div class="input">
      <input 
        v-model="messageInput" 
        placeholder="输入广播消息"
        @keyup.enter="sendBroadcast"
      />
      <button @click="sendBroadcast">广播</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { P2PService } from '@/services/p2pService';

const p2pService = new P2PService();
const messageInput = ref('');
const connectedPeers = ref<string[]>([]);
const broadcastMessages = ref<Array<{ id: string; from: string; text: string }>>([]);

onMounted(async () => {
  await p2pService.initialize();
  
  // 定期更新节点列表
  setInterval(async () => {
    connectedPeers.value = await p2pService.getConnectedPeers();
  }, 2000);
});

onUnmounted(() => {
  p2pService.cleanup();
});

async function sendBroadcast() {
  if (!messageInput.value.trim()) return;
  
  await p2pService.broadcast(messageInput.value);
  messageInput.value = '';
}
</script>

<style scoped>
.p2p-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.peers {
  flex: 1;
  border: 1px solid #ccc;
  padding: 1rem;
  overflow-y: auto;
}

.peer-item {
  padding: 0.5rem;
  background: #f0f0f0;
  margin: 0.25rem 0;
  border-radius: 4px;
}

.messages {
  flex: 2;
  border: 1px solid #ccc;
  padding: 1rem;
  overflow-y: auto;
}

.message {
  padding: 0.5rem;
  margin: 0.25rem 0;
  background: #e3f2fd;
  border-radius: 4px;
}

.input {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #ccc;
}

input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
```

## 常见问题

### Q: 如何处理大文件传输？
A: 使用 `SendFileChunk` 命令分块发送二进制数据。计算文件大小，分成多个块发送，最后一个块设置 `is_last: true`。

### Q: 如何自动发现局域网内的其他节点？
A: libp2p 内建 mDNS 支持，会自动发现局域网内的其他节点。监听 `p2p:peer-discovered` 事件。

### Q: 如何确保消息不会丢失？
A: 当前实现是异步的，消息通过通道发送。建议在应用层实现消息确认机制。

### Q: 能否跨网络（如互联网）连接？
A: 需要配置 TCP 穿透和中继服务。当前配置仅支持局域网。

## 错误处理

所有 Tauri command 都可能返回错误。建议统一处理：

```typescript
async function safeInvoke<T>(
  command: string,
  args: Record<string, any>
): Promise<T | null> {
  try {
    return await invoke<T>(command, args);
  } catch (error) {
    console.error(`Command failed: ${command}`, error);
    return null;
  }
}
```

## 性能优化建议

1. **事件节流**：对频繁的事件（如文件传输进度）进行节流
2. **消息缓存**：在内存中保留最近的消息，避免重复处理
3. **连接池**：对多个私聊目标使用连接复用
4. **数据压缩**：大文件传输前进行压缩

## 相关文件

- [P2P 核心实现](../src-tauri/src/)
- [nodp2p 库](../../nodp2p/)
