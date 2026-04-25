# P2P 文件传输实现检查清单

## ✅ 已完成的工作

### 后端 (Rust) - src-tauri/src/

- [x] **commands.rs**
  - [x] 处理 `FileChunkReceived` 事件，Base64 编码数据
  - [x] 处理 `FileReceived` 事件，包含完整文件数据
  - [x] 通过 Tauri events 发送二进制数据到前端
  - [x] 修正参数命名 (keyBase64 → key_base64)
  - [x] 导入 base64::engine::Engine trait

- [x] **lib.rs**
  - [x] P2pState 结构体各字段定义完整
  - [x] 所有 command handlers 已注册

### 前端 (TypeScript) - src/p2p/

- [x] **index.ts**
  - [x] FileChunkPayload 类型定义
  - [x] FileReceivedPayload 类型定义（已更新为包含 dataBase64）
  - [x] onFileChunk() 事件监听函数
  - [x] getConnectedPeers(), getDiscoveredPeers(), getMyPeerId() 等辅助函数
  - [x] 所有 P2P 命令调用函数

### 存储层 - src/utils/

- [x] **fileStorageDB.ts** (新建)
  - [x] IndexedDB 初始化和管理
  - [x] saveChunk() - 保存文件块到数据库
  - [x] getAllChunks() - 组装完整文件
  - [x] exportAsBlob() - 导出为可下载的 Blob
  - [x] createTransfer() - 创建传输记录
  - [x] completeTransfer() - 标记传输完成
  - [x] deleteTransfer() - 清理数据
  - [x] Base64 解码逻辑

### Vue 组件 - src/plugins/test/pages/

- [x] **LayoutView.vue** (已更新)
  - [x] 导入 onFileChunk 和 FileChunkPayload
  - [x] 导入 fileStorageDB 服务
  - [x] 监听 onFileChunk 事件并保存到 IndexedDB
  - [x] 监听 onFileReceived 事件
  - [x] downloadFile() 函数实现
  - [x] 文件传输 UI（下载按钮、错误状态等）
  - [x] 文件传输状态管理

### 文档

- [x] **P2P集成指南.md** - 基础 API 指南
- [x] **P2P文件传输完整指南.md** - 详细架构和实现细节

## 🔄 工作流程

### 文件接收流程

```
1. 后端接收文件块 (FileChunkReceived)
   ↓
2. Base64 编码数据块
   ↓
3. Tauri emit "p2p:file-chunk" 事件
   ↓
4. 前端监听到事件
   ↓
5. fileStorageDB.saveChunk() 保存到 IndexedDB
   ↓
6. 重复直到 isLast = true
   ↓
7. fileStorageDB.completeTransfer() 标记完成
```

### 文件下载流程

```
1. 用户点击下载按钮
   ↓
2. downloadFile(transfer)
   ↓
3. fileStorageDB.exportAsBlob(transferId)
   ↓
4. 从 IndexedDB 读取所有块
   ↓
5. 合并成完整 Uint8Array
   ↓
6. 创建 Blob 对象
   ↓
7. 触发浏览器下载
```

## 🧪 测试场景

### 基本文件传输
- [ ] 两个节点之间建立连接
- [ ] 发送小文件（< 1MB）
- [ ] 验证文件在 IndexedDB 中正确存储
- [ ] 下载文件并验证内容完整性

### 大文件传输
- [ ] 发送大文件（> 100MB）
- [ ] 验证分块接收和处理
- [ ] 监控内存使用情况
- [ ] 验证下载速度

### 错误恢复
- [ ] 网络中断后重新连接
- [ ] 块接收失败后重新发送
- [ ] IndexedDB 写入失败处理
- [ ] 清理失败/未完成的传输

### 并发传输
- [ ] 多个文件同时传输
- [ ] 多个对等节点同时发送
- [ ] IndexedDB 事务处理

## 📋 已知限制和待改进

### 当前实现
- ✓ 支持单向文件接收（接收文件块流）
- ✓ 支持完整文件接收
- ✓ IndexedDB 存储管理
- ✓ Base64 编码传输

### 可选改进
- [ ] 文件哈希校验（完整性验证）
- [ ] 传输中断后续传（断点续传）
- [ ] 端到端加密
- [ ] 压缩传输
- [ ] P2P 流式下载（不存储整个文件）
- [ ] SQLite 替代 IndexedDB（更高效的二进制存储）

## 🚀 部署检查清单

### 编译验证
```bash
# 后端编译检查
cd src-tauri && cargo build --release

# 前端类型检查
pnpm typecheck
```

### 运行时检查
- [ ] 应用启动无错误
- [ ] P2P 网络初始化成功
- [ ] 能正确发现节点
- [ ] 文件传输事件正确触发
- [ ] IndexedDB 正确初始化
- [ ] 下载功能可用

### 浏览器兼容性
- [ ] Chrome/Chromium 86+ (IndexedDB 完全支持)
- [ ] Firefox 85+ 
- [ ] Safari 14+
- [ ] Edge 86+

## 📱 移动端特殊考虑

### Android Tauri
- [ ] IndexedDB 在移动版 Webview 中工作
- [ ] 文件下载到应用沙盒
- [ ] 权限管理（文件系统访问）

### iOS Tauri
- [ ] WKWebView IndexedDB 支持
- [ ] Safari 限制处理

## 💾 存储空间管理

```typescript
// 监控存储使用
if (navigator.storage?.estimate) {
  const est = await navigator.storage.estimate()
  console.log(`已使用: ${est.usage / 1024 / 1024}MB`)
  console.log(`配额: ${est.quota / 1024 / 1024}MB`)
}

// 推荐配置
const MAX_STORAGE = 500 * 1024 * 1024  // 500MB
const CLEANUP_THRESHOLD = 0.9  // 90% 时清理

// 定期清理过期数据
```

## 🔍 调试指令

```typescript
// 查看所有活跃传输
const active = await fileStorageDB.getActiveTransfers()
console.table(active)

// 查看特定传输的块
const chunks = await fileStorageDB.getAllChunks(transferId)
console.log(`Total size: ${chunks.length} bytes`)

// 清空所有数据
await fileStorageDB.clear()
```

## 📞 常见问题

**Q: 文件块丢失了怎么办？**
A: 当前实现不支持重传。需要实现：
- 块完整性验证（CRC/SHA256）
- 缺失块请求机制

**Q: 很大文件会导致内存溢出？**
A: IndexedDB 会自动管理，但需要：
- 监控浏览器配额
- 实现定期清理
- 考虑流式处理

**Q: 如何验证文件完整性？**
A: 实现文件哈希：
- 后端计算原文件 SHA256
- 前端验证下载文件的哈希

**Q: 支持暂停/续传吗？**
A: 当前不支持，需要：
- 保存传输断点
- 实现块请求协议
- 完善错误恢复

## 📊 性能指标参考

| 指标 | 目标 | 备注 |
|------|------|------|
| 单块接收延迟 | < 100ms | 取决于网络 |
| 块处理速度 | > 1MB/s | 本地 IndexedDB |
| 内存占用 | < 50MB | 不包括块数据 |
| 索引库空间 | 可配置 | 通常 100MB-1GB |
| UI 响应延迟 | < 16ms | 60fps |

## 链接

- [P2P 集成指南](./P2P集成指南.md)
- [P2P 文件传输完整指南](./P2P文件传输完整指南.md)
- [后端代码](../src-tauri/src/commands.rs)
- [前端 API](../src/p2p/index.ts)
- [存储服务](../src/utils/fileStorageDB.ts)
