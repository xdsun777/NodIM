<template>
  <div class="p2p-chat">
    <!-- 身份管理（未启动时） -->
    <div v-if="!myPeerId" class="identity-panel">
      <h2>🔐 身份配置</h2>
      <div class="identity-form">
        <input
          v-model="keyInput"
          placeholder="粘贴密钥 (Base64) 或留空生成新身份"
          class="key-input"
        />
        <div class="identity-actions">
          <button @click="startWithKey" :disabled="!keyInput.trim()">
            使用已有密钥启动
          </button>
          <button @click="generateNew">生成新身份</button>
        </div>
      </div>
      <p class="hint">密钥会保存在浏览器 localStorage 中</p>
    </div>

    <!-- 主界面（已启动） -->
    <div>
      <!-- 左侧边栏 -->
      <aside class="sidebar">
        <div class="my-id">
          <strong>我的 ID</strong>
          <code>{{ myPeerId }}</code>
        </div>

        <div class="peer-section">
          <h3>🟢 在线节点 ({{ connectedPeers.length }})</h3>
          <ul>
            <li
              v-for="peer in connectedPeers"
              :key="peer"
              :class="{ active: selectedPeer === peer }"
              @click="selectPeer(peer)"
            >
              {{ peer }}
            </li>
          </ul>
        </div>

        <div class="peer-section">
          <h3>🔍 发现节点 ({{ discoveredPeers.length }})</h3>
          <ul>
            <li v-for="p in discoveredPeers" :key="p.peer">
              {{ p.peer }} <span class="addr">{{ p.addr }}</span>
            </li>
          </ul>
        </div>

        <button @click="refreshPeers" class="refresh-btn">刷新列表</button>
        <button @click="shutdown" class="shutdown-btn">断开连接</button>
      </aside>

      <!-- 右侧主区域 -->
      <section class="content">
        <!-- 标签切换 -->
        <nav class="tabs">
          <button
            :class="{ active: activeTab === 'broadcast' }"
            @click="activeTab = 'broadcast'"
          >
            📣 广播
          </button>
          <button
            :class="{ active: activeTab === 'private' }"
            @click="activeTab = 'private'"
          >
            💬 私聊
          </button>
          <button
            :class="{ active: activeTab === 'files' }"
            @click="activeTab = 'files'"
          >
            📁 文件传输
          </button>
        </nav>

        <!-- 广播面板 -->
        <div v-show="activeTab === 'broadcast'" class="tab-panel">
          <div class="message-list">
            <div
              v-for="(msg, idx) in broadcastMessages"
              :key="idx"
              class="message-item"
            >
              <span class="from">[{{ msg.from }}]</span> {{ msg.text }}
            </div>
            <div v-if="broadcastMessages.length === 0" class="empty-hint">
              暂无广播消息
            </div>
          </div>
          <div class="input-area">
            <input
              v-model="broadcastText"
              placeholder="输入广播内容..."
              @keyup.enter="sendBroadcast"
            />
            <button @click="sendBroadcast">发送</button>
          </div>
        </div>

        <!-- 私聊面板 -->
        <div v-show="activeTab === 'private'" class="tab-panel">
          <div v-if="!selectedPeer" class="empty-hint">
            请从左侧在线节点选择一个私聊对象
          </div>
          <template v-else>
            <div class="private-header">
              与 <strong>{{ selectedPeer }}</strong> 的对话
            </div>
            <div class="message-list">
              <div
                v-for="(msg, idx) in privateMessages"
                :key="idx"
                :class="[
                  'message-item',
                  msg.from === myPeerId ? 'self' : 'other',
                ]"
              >
                <span class="from">{{ msg.from === myPeerId ? '我' : msg.from }}</span>
                <p>{{ msg.text }}</p>
              </div>
              <div v-if="privateMessages.length === 0" class="empty-hint">
                暂无私聊消息
              </div>
            </div>
            <div class="input-area">
              <input
                v-model="privateText"
                placeholder="输入私聊消息..."
                @keyup.enter="sendPrivateText"
              />
              <button @click="sendPrivateText">发送文本</button>
            </div>
            <div class="file-send-area">
              <input
                type="file"
                ref="fileInput"
                @change="handleFileSelect"
              />
              <button @click="sendSelectedFile" :disabled="!selectedFile">
                发送文件
              </button>
            </div>
          </template>
        </div>

        <!-- 文件传输记录面板 -->
        <div v-show="activeTab === 'files'" class="tab-panel">
          <div v-if="fileTransfers.length === 0" class="empty-hint">
            暂无文件传输记录
          </div>
          <div v-for="transfer in fileTransfers" :key="transfer.id" class="transfer-item">
            <div class="transfer-info">
              <span class="file-name">{{ transfer.fileName }}</span>
              <span class="peer">对方: {{ transfer.peer }}</span>
              <span class="progress-text">{{ transfer.progress }}%</span>
            </div>
            <progress :value="transfer.progress" max="100" class="progress-bar" />
            <span v-if="transfer.status === 'done'" class="done-badge">✅ 完成</span>
            <span v-else-if="transfer.status === 'transferring'" class="transferring-badge">⏳ 传输中</span>
            <span v-else class="pending-badge">⏸️ 等待中</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import {
  generateIdentity,
  startWithIdentity,
  broadcastMessage,
  sendPrivate,
  getConnectedPeers,
  getDiscoveredPeers,
  onPeerConnected,
  onPeerDisconnected,
  onPeerDiscovered,
  onBroadcastReceived,
  onPrivateMessageReceived,
  onFileRequest,
  onFileTransferStarted,
  onFileTransferProgress,
  onFileReceived,
  type DiscoveredPeer,
} from '@/p2p'

// -------------------- 身份管理 --------------------
const keyInput = ref(localStorage.getItem('p2p-key') || '')
const myPeerId = ref<string | null>(null)

const startWithKey = async () => {
  try {
    const peerId = await startWithIdentity(keyInput.value.trim())
    myPeerId.value = peerId
    localStorage.setItem('p2p-key', keyInput.value.trim())
  } catch (e) {
    alert('启动失败: ' + e)
  }
}

const generateNew = async () => {
  try {
    const [peerId,key ] = await generateIdentity()
    console.log("key,peerId",key,peerId);
    
    keyInput.value = key
    localStorage.setItem('p2p-key', key)
    myPeerId.value = peerId
    // 自动使用新密钥启动
    await startWithIdentity(key)
  } catch (e) {
    alert('生成身份失败: ' + e)
  }
}

const shutdown = () => {
  myPeerId.value = null
  localStorage.removeItem('p2p-key')
  location.reload()
}

// -------------------- 节点列表 --------------------
const connectedPeers = ref<string[]>([])
const discoveredPeers = ref<DiscoveredPeer[]>([])
const selectedPeer = ref<string | null>(null)

const refreshPeers = async () => {
  try {
    const [conn, disc] = await Promise.all([
      getConnectedPeers(),
      getDiscoveredPeers(),
    ])
    connectedPeers.value = conn
    discoveredPeers.value = disc
  } catch (e) {
    console.error(e)
  }
}

const selectPeer = (peerId: string) => {
  selectedPeer.value = peerId
  activeTab.value = 'private'
}

// -------------------- 消息列表 --------------------
type ChatMsg = { from: string; text: string }
const broadcastMessages = reactive<ChatMsg[]>([])
const privateMessages = reactive<ChatMsg[]>([])

const broadcastText = ref('')
const privateText = ref('')
const activeTab = ref<'broadcast' | 'private' | 'files'>('broadcast')

const sendBroadcast = async () => {
  if (!broadcastText.value.trim()) return
  try {
    await broadcastMessage(broadcastText.value)
    broadcastMessages.push({ from: myPeerId.value!, text: broadcastText.value })
    broadcastText.value = ''
  } catch (e) {
    console.error(e)
  }
}

const sendPrivateText = async () => {
  if (!selectedPeer.value || !privateText.value.trim()) return
  try {
    await sendPrivate(selectedPeer.value, privateText.value)
    privateMessages.push({ from: myPeerId.value!, text: privateText.value })
    privateText.value = ''
  } catch (e) {
    console.error(e)
  }
}

// -------------------- 文件传输 --------------------
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)

const handleFileSelect = () => {
  if (fileInput.value?.files?.length) {
    selectedFile.value = fileInput.value.files[0]
  } else {
    selectedFile.value = null
  }
}

const sendSelectedFile = async () => {
  if (!selectedPeer.value || !selectedFile.value) return
  try {
    const arrayBuffer = await selectedFile.value.arrayBuffer()
    const data = Array.from(new Uint8Array(arrayBuffer))
    // 调用二进制发送
    await invokeBinarySend(selectedPeer.value, selectedFile.value.name, data)
    selectedFile.value = null
    if (fileInput.value) fileInput.value.value = ''
  } catch (e) {
    alert('文件发送失败: ' + e)
  }
}

// 备用：如果 p2p 模块未导出 sendFileBinary，直接封装 invoke
const invokeBinarySend = async (peerId: string, name: string, data: number[]) => {
  const { invoke } = await import('@tauri-apps/api/core')
  await invoke('send_file_binary', { peerId, name, data })
}

// 文件传输状态
interface FileTransferState {
  id: string // 用 peer + transferId 拼接
  peer: string
  transferId: number
  fileName: string
  progress: number
  status: 'pending' | 'transferring' | 'done'
}
const fileTransfers = reactive<FileTransferState[]>([])

const findOrCreateTransfer = (peer: string, transferId: number, fileName: string) => {
  const id = `${peer}-${transferId}`
  let transfer = fileTransfers.find(t => t.id === id)
  if (!transfer) {
    transfer = {
      id,
      peer,
      transferId,
      fileName,
      progress: 0,
      status: 'pending',
    }
    fileTransfers.push(transfer)
  }
  return transfer
}

// -------------------- 事件监听 --------------------
const unlisteners: Function[] = []

onMounted(async () => {
  await refreshPeers()

  // 连接与发现
  unlisteners.push(await onPeerConnected((peerId) => {
    if (!connectedPeers.value.includes(peerId)) connectedPeers.value.push(peerId)
  }))
  unlisteners.push(await onPeerDisconnected((peerId) => {
    connectedPeers.value = connectedPeers.value.filter(p => p !== peerId)
    if (selectedPeer.value === peerId) selectedPeer.value = null
  }))
  unlisteners.push(await onPeerDiscovered((peer) => {
    const exists = discoveredPeers.value.some(p => p.peer === peer.peer)
    if (!exists) discoveredPeers.value.push(peer)
  }))

  // 消息接收
  unlisteners.push(await onBroadcastReceived((from, message) => {
    broadcastMessages.push({ from, text: message })
  }))
  unlisteners.push(await onPrivateMessageReceived((from, text) => {
    // 只记录与当前选中对方的对话（简化）
    if (from === selectedPeer.value || from === myPeerId.value) {
      privateMessages.push({ from, text })
    } else {
      // 可选：其他私聊消息也记录下来以便切换查看，此处略
    }
  }))

  // 文件传输事件
  unlisteners.push(await onFileRequest((payload) => {
    // 当收到文件请求时，后端会自动开始传输，这里仅记录状态
    findOrCreateTransfer(payload.peer, payload.transferId, payload.fileName)
  }))
  unlisteners.push(await onFileTransferStarted((payload) => {
    const transfer = findOrCreateTransfer(payload.peer, payload.transferId, payload.fileName)
    transfer.status = 'transferring'
  }))
  unlisteners.push(await onFileTransferProgress((payload) => {
    const transfer = fileTransfers.find(t => t.transferId === payload.transferId && t.peer === payload.peer)
    if (transfer) {
      transfer.progress = payload.progress
      if (transfer.progress >= 100) transfer.status = 'done'
    }
  }))
  unlisteners.push(await onFileReceived((payload) => {
    // 文件接收完成，标记最后一个匹配的传输为完成
    const transfer = fileTransfers.find(
      t => t.fileName === payload.fileName && t.peer === payload.peer && t.status !== 'done'
    )
    if (transfer) {
      transfer.progress = 100
      transfer.status = 'done'
    }
    // 弹出保存路径提示
    alert(`文件 "${payload.fileName}" 已接收并保存在:\n${payload.savedPath}`)
  }))
})

onUnmounted(() => {
  unlisteners.forEach(fn => fn())
})
</script>

<style scoped>
.p2p-chat {
  height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: system-ui, sans-serif;
  background: #f5f5f5;
  color: #333;
}

/* 身份面板 */
.identity-panel {
  max-width: 480px;
  margin: auto;
  padding: 2rem;
  text-align: center;
}
.key-input {
  width: 100%;
  padding: 0.5rem;
  margin: 1rem 0;
}
.identity-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}
.hint {
  font-size: 0.85rem;
  color: #666;
}

/* 主布局 */
.main-layout {
  display: flex;
  height: 100%;
}

/* 侧边栏 */
.sidebar {
  width: 260px;
  background: #fff;
  border-right: 1px solid #ddd;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.my-id {
  text-align: center;
  word-break: break-all;
}
.my-id code {
  font-size: 0.8rem;
  background: #eee;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
}
.peer-section h3 {
  font-size: 0.9rem;
  margin-bottom: 0.3rem;
}
.peer-section ul {
  list-style: none;
  padding: 0;
  max-height: 200px;
  overflow-y: auto;
}
.peer-section li {
  padding: 0.3rem;
  cursor: pointer;
  border-radius: 4px;
  font-size: 0.85rem;
}
.peer-section li:hover {
  background: #f0f0f0;
}
.peer-section li.active {
  background: #e0e7ff;
  font-weight: bold;
}
.addr {
  font-size: 0.75rem;
  color: #888;
}
.refresh-btn,
.shutdown-btn {
  padding: 0.4rem;
  cursor: pointer;
}
.shutdown-btn {
  background: #fee2e2;
  border: 1px solid #fca5a5;
}
.shutdown-btn:hover {
  background: #fecaca;
}

/* 右侧内容 */
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background: #fff;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid #ddd;
  padding-bottom: 0.5rem;
  margin-bottom: 0.5rem;
}
.tabs button {
  padding: 0.4rem 1rem;
  border: none;
  background: #f3f4f6;
  cursor: pointer;
  border-radius: 4px;
}
.tabs button.active {
  background: #3b82f6;
  color: white;
}

.tab-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  min-height: 200px;
}
.message-item {
  margin-bottom: 0.3rem;
}
.message-item .from {
  font-weight: bold;
  margin-right: 0.5rem;
}
.message-item.self {
  text-align: right;
}
.message-item.other {
  text-align: left;
}
.empty-hint {
  color: #999;
  font-style: italic;
}

.input-area {
  display: flex;
  gap: 0.5rem;
}
.input-area input {
  flex: 1;
  padding: 0.5rem;
}
.file-send-area {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

/* 文件传输 */
.transfer-item {
  background: #f3f4f6;
  padding: 0.5rem;
  margin-bottom: 0.3rem;
  border-radius: 4px;
}
.transfer-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}
.progress-bar {
  width: 100%;
  height: 8px;
}
.done-badge,
.transferring-badge,
.pending-badge {
  font-size: 0.8rem;
}
</style>