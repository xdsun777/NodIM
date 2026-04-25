# NodIM P2P 文件传输完整指南

## 架构概述

这个实现使用了三层架构来处理 P2P 文件传输：

```
后端 (Rust/Tauri)
    ↓ (base64编码)
前端 (TypeScript)
    ↓ (解码)
IndexedDB 存储
    ↓
用户下载
```

## 1. 后端实现 (Rust)

### 文件块数据流处理

后端会接收来自 nodp2p 的文件块数据，通过 Tauri events 发送到前端：

```rust
// src-tauri/src/commands.rs

// FileChunkReceived 事件处理
nodp2p::AppEvent::FileChunkReceived {
    peer,
    transfer_id,
    offset,       // 偏移量
    data,         // 二进制数据
    is_last,      // 是否最后一块
} => {
    // 编码为 Base64
    let data_base64 = base64::engine::general_purpose::STANDARD.encode(&data);
    
    // 通过 Tauri event 发送
    app_handle.emit("p2p:file-chunk", {
        peer,
        transferId,
        chunkIndex,
        dataBase64,
        chunkSize,
        isLast
    });
}
```

### 完整文件接收处理

当文件完整接收时：

```rust
nodp2p::AppEvent::FileReceived {
    peer,
    file_name,
    data,  // 完整的二进制数据
} => {
    let data_base64 = base64::engine::general_purpose::STANDARD.encode(&data);
    app_handle.emit("p2p:file-received", {
        peer,
        fileName,
        dataBase64,  // 整个文件的 Base64 编码
        fileSize
    });
}
```

## 2. 前端事件监听 (TypeScript)

### 事件类型

```typescript
// src/p2p/index.ts

export interface FileChunkPayload {
  peer: string
  transferId: number
  chunkIndex: number
  dataBase64: string    // Base64 编码的数据块
  chunkSize: number
  isLast: boolean
}

export interface FileReceivedPayload {
  peer: string
  fileName: string
  dataBase64: string    // 整个文件的 Base64 编码
  fileSize: number
}
```

### 事件监听

```typescript
// 监听文件块流
await onFileChunk(async (payload: FileChunkPayload) => {
  // 解码 Base64 → 二进制数据
  // 保存到 IndexedDB
})

// 监听文件完整接收
await onFileReceived((payload: FileReceivedPayload) => {
  // 处理完整文件
})
```

## 3. IndexedDB 存储

### 初始化

```typescript
import { fileStorageDB } from '@/utils/fileStorageDB'

// 自动初始化（首次使用时）
await fileStorageDB.init()
```

### 保存文件块

```typescript
// Base64 字符串 → 二进制数据 → 存储
await fileStorageDB.saveChunk(
  transferId: number,
  chunkIndex: number,
  dataBase64: string
)
```

### 获取完整文件

```typescript
// 从所有块组装完整文件
const fullFileData = await fileStorageDB.getAllChunks(transferId)

// 导出为 Blob（用于下载）
const blob = await fileStorageDB.exportAsBlob(transferId, 'application/octet-stream')
```

### 管理传输

```typescript
// 创建传输记录
await fileStorageDB.createTransfer(
  peer: string,
  transferId: number,
  fileName: string,
  totalSize: number,
  totalChunks: number
)

// 更新进度
await fileStorageDB.updateTransferProgress(peer, transferId, receivedChunks)

// 标记完成
await fileStorageDB.completeTransfer(peer, transferId)

// 删除传输及其数据
await fileStorageDB.deleteTransfer(peer, transferId)
```

## 4. Vue 组件集成

### 完整的事件流示例

```typescript
// LayoutView.vue 中的实现流程

onMounted(async () => {
  // 1. 监听文件块
  await onFileChunk(async (payload) => {
    // 自动保存到 IndexedDB
    await fileStorageDB.saveChunk(
      payload.transferId,
      payload.chunkIndex,
      payload.dataBase64
    )
    
    if (payload.isLast) {
      // 标记完成
      await fileStorageDB.completeTransfer(payload.peer, payload.transferId)
      // 更新 UI 状态为完成
    }
  })
  
  // 2. 监听完整文件
  await onFileReceived((payload) => {
    alert(`文件已接收: ${payload.fileName}`)
  })
})

// 用户下载文件
async function downloadFile(transfer: FileTransferState) {
  const blob = await fileStorageDB.exportAsBlob(transfer.transferId)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = transfer.fileName
  a.click()
  URL.revokeObjectURL(url)
}
```

### UI 显示

```vue
<div v-for="transfer in fileTransfers" class="transfer-item">
  <span>{{ transfer.fileName }}</span>
  <progress :value="transfer.progress" max="100" />
  
  <button 
    v-if="transfer.status === 'done'"
    @click="downloadFile(transfer)"
  >
    💾 下载
  </button>
  <span v-else>{{ transfer.status }}</span>
</div>
```

## 5. 数据流详解

### 场景 1: 接收文件块流

```
后端 (P2P 事件)
  ↓
FileChunkReceived { data: Vec<u8> }
  ↓ (base64编码)
Tauri Event: { dataBase64: String }
  ↓
前端 TypeScript
  ↓
onFileChunk 监听器
  ↓ (执行回调)
fileStorageDB.saveChunk()
  ↓ (解码 Base64)
Uint8Array
  ↓
IndexedDB 存储
```

### 场景 2: 接收完整文件

```
后端 (P2P 事件)
  ↓
FileReceived { data: Vec<u8> }
  ↓ (base64编码)
Tauri Event: { dataBase64: String }
  ↓
前端 TypeScript
  ↓
onFileReceived 监听器
  ↓ (可选：存储到 IndexedDB)
用户点击下载
  ↓
fileStorageDB.exportAsBlob()
  ↓
浏览器下载
```

## 6. Base64 编码/解码

### JavaScript 中的解码过程

```typescript
// FileStorageDB 中的自动解码
function base64ToUint8Array(base64String: string): Uint8Array {
  const binaryString = atob(base64String)  // Base64 → 二进制字符串
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}
```

## 7. 性能优化建议

### 大文件处理

```typescript
// 对于大文件，使用分块处理而不是一次加载全部
async function downloadLargeFile(transferId: number) {
  const transfer = await fileStorageDB.getTransfer(peer, transferId)
  const blob = await fileStorageDB.exportAsBlob(transferId)
  
  // 使用 Blob 流处理（如需要）
  const stream = blob.stream()
  // 或直接下载
  const url = URL.createObjectURL(blob)
  // ...
}
```

### 内存管理

```typescript
// 完成后清理已下载的文件
async function deleteCompletedTransfer(peer: string, transferId: number) {
  await fileStorageDB.deleteTransfer(peer, transferId)
}
```

### 数据库空间管理

```typescript
// 获取所有进行中的传输
const activeTransfers = await fileStorageDB.getActiveTransfers()

// 定期清理过期数据
async function cleanupOldTransfers() {
  const transfers = await fileStorageDB.getActiveTransfers()
  // 检查 createdAt 时间戳
  // 删除超过 7 天的传输
}
```

## 8. 错误处理

### 后端错误

```typescript
try {
  await fileStorageDB.saveChunk(payload.transferId, payload.chunkIndex, payload.dataBase64)
} catch (error) {
  console.error('Failed to save chunk:', error)
  transfer.status = 'error'
  // 可选：重新请求该块
}
```

### 索引数据库配额

```typescript
// 检查储存空间
if (navigator.storage && navigator.storage.estimate) {
  const estimate = await navigator.storage.estimate()
  const percentUsed = (estimate.usage / estimate.quota) * 100
  console.log(`Storage used: ${percentUsed.toFixed(1)}%`)
  
  if (percentUsed > 90) {
    // 警告用户或清理旧数据
  }
}
```

## 9. 安全建议

1. **验证文件完整性**：使用文件哈希校验
2. **限制文件大小**：设置上限防止滥用
3. **加密敏感文件**：在存储前加密
4. **清理临时数据**：定期清理 IndexedDB

## 10. 调试技巧

### 检查 IndexedDB 内容

```typescript
// 在浏览器控制台中
const request = indexedDB.open('NodIM-FileStorage')
request.onsuccess = (e) => {
  const db = e.target.result
  const store = db.transaction('file-chunks').objectStore('file-chunks')
  store.getAll().onsuccess = (e) => console.log(e.target.result)
}
```

### 查看事件流

```typescript
// 在前端添加日志
await onFileChunk((payload) => {
  console.log('File chunk received:', {
    peer: payload.peer,
    transferId: payload.transferId,
    chunkIndex: payload.chunkIndex,
    size: payload.chunkSize,
    isLast: payload.isLast,
  })
})
```

## 相关文件

- 后端: [commands.rs](../src-tauri/src/commands.rs)
- 前端 API: [src/p2p/index.ts](../src/p2p/index.ts)
- 存储服务: [src/utils/fileStorageDB.ts](../src/utils/fileStorageDB.ts)
- Vue 组件: [src/plugins/test/pages/LayoutView.vue](../src/plugins/test/pages/LayoutView.vue)
