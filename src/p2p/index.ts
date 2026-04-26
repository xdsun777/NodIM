import { invoke } from '@tauri-apps/api/core'
import { listen, UnlistenFn } from '@tauri-apps/api/event'

// ==============================
// 数据类型定义
// ==============================

/** 发现的对等节点信息 */
export interface DiscoveredPeer {
  peer: string
  addr: string
}

/** 文件请求信息 */
export interface FileRequestPayload {
  peer: string
  transferId: number
  fileName: string
  fileSize: number
}

/** 文件传输开始 */
export interface FileTransferStartedPayload {
  peer: string
  transferId: number
  fileName: string
}

/** 文件传输进度 */
export interface FileTransferProgressPayload {
  peer: string
  transferId: number
  received: number
  total: number
  progress: number // 0-100
}

/** 文件接收完成 */
export interface FileReceivedPayload {
  peer: string
  fileName: string
  dataBase64: string // 完整文件的 Base64 编码
  fileSize: number // 文件大小（字节）
}

/** 文件发送完成 */
export interface FileSentPayload {
  peer: string
  transferId: number
}

/** 文件块数据流（二进制数据 Base64 编码后传输） */
export interface FileChunkPayload {
  peer: string
  transferId: number
  chunkIndex: number
  dataBase64: string // Base64 编码的二进制数据
  chunkSize: number // 原始二进制数据的字节数
  isLast: boolean // 是否是最后一块
}

// ==============================
// 命令调用函数
// ==============================

/**
 * 生成身份密钥对，返回 [密钥Base64字符串, PeerId字符串]
 */
export async function generateIdentity(): Promise<[string, string]> {
  return await invoke<[string, string]>('generate_identity')
}

/**
 * 使用 Base64 编码的密钥启动 P2P 网络
 * @param keyBase64 密钥的 Base64 字符串
 * @returns 当前节点的 PeerId
 */
export async function startWithIdentity(keyBase64: string): Promise<string> {
  return await invoke<string>('start_with_identity', {
    keyBase64,
  })
}

/**
 * 向所有已连接的对等节点广播消息
 * @param message 要广播的文本
 */
export async function broadcastMessage(message: string): Promise<void> {
  await invoke('broadcast_message', { message })
}

/**
 * 发送私聊消息
 * @param peerId 目标节点的 PeerId
 * @param message 消息文本
 */
export async function sendPrivate(peerId: string, message: string): Promise<void> {
  await invoke('send_private', { peerId, message })
}

/**
 * 发送文件（通过文件路径）
 * @param peerId 目标节点的 PeerId
 * @param path 本地文件路径
 */
export async function sendFile(peerId: string, path: string): Promise<void> {
  await invoke('send_file', { peerId, path })
}

/**
 * 发送二进制数据（作为文件发送给对等节点）
 * 支持大文件分块传输
 * @param peerId 目标节点的 PeerId
 * @param fileName 告知对方的文件名
 * @param data 二进制数据，可以传入 Uint8Array 或 number[]
 */
export async function sendFileBinary(
  peerId: string,
  fileName: string,
  data: Uint8Array | number[]
): Promise<void> {
  const dataArray = data instanceof Uint8Array ? data : new Uint8Array(data)
  const fileSize = dataArray.length
  const transferId = Date.now() // 使用时间戳作为transferId

  await sendFileRequest(peerId, transferId, fileName, fileSize)

  const chunkSize = 256 * 1024 // 256KB per chunk
  for (let offset = 0; offset < dataArray.length; offset += chunkSize) {
    const end = Math.min(offset + chunkSize, dataArray.length)
    const chunk = dataArray.slice(offset, end)
    const isLast = end === dataArray.length
    await sendFileChunk(peerId, transferId, offset, Array.from(chunk), isLast)
  }
}

/**
 * 获取已连接的对等节点 PeerId 列表
 */
export async function getConnectedPeers(): Promise<string[]> {
  return await invoke<string[]>('get_connected_peers')
}

/**
 * 获取通过 mDNS 发现的对等节点信息列表
 */
export async function getDiscoveredPeers(): Promise<DiscoveredPeer[]> {
  const raw = await invoke<[string, string][]>('get_discovered_peers')
  return raw.map(([peer, addr]) => ({ peer, addr }))
}

/**
 * 获取所有已连接的节点列表
 */
export async function getPeers(): Promise<void> {
  await invoke('get_peers')
}

/**
 * 发送文件请求
 * @param peerId 目标节点的 PeerId
 * @param transferId 传输ID
 * @param fileName 文件名
 * @param fileSize 文件大小
 */
export async function sendFileRequest(
  peerId: string,
  transferId: number,
  fileName: string,
  fileSize: number
): Promise<void> {
  await invoke('send_file_request', {
    peerId,
    transferId,
    fileName,
    fileSize,
  })
}

/**
 * 发送文件块
 * @param peerId 目标节点的 PeerId
 * @param transferId 传输ID
 * @param offset 偏移
 * @param data 数据块
 * @param isLast 是否最后一块
 */
export async function sendFileChunk(
  peerId: string,
  transferId: number,
  offset: number,
  data: number[],
  isLast: boolean
): Promise<void> {
  await invoke('send_file_chunk', {
    peerId,
    transferId,
    offset,
    data,
    isLast,
  })
}

// ==============================
// 事件监听器（返回取消监听的函数）
// ==============================

/** 当有新的对等节点连接时触发 */
export function onPeerConnected(callback: (peerId: string) => void): Promise<UnlistenFn> {
  return listen<string>('p2p:peer-connected', (event) => {
    callback(event.payload)
  })
}

/** 当对等节点断开连接时触发 */
export function onPeerDisconnected(callback: (peerId: string) => void): Promise<UnlistenFn> {
  return listen<string>('p2p:peer-disconnected', (event) => {
    callback(event.payload)
  })
}

/** 当通过 mDNS 发现新的对等节点时触发 */
export function onPeerDiscovered(callback: (peer: DiscoveredPeer) => void): Promise<UnlistenFn> {
  return listen<{ peer: string; addr: string }>('p2p:peer-discovered', (event) => {
    callback(event.payload)
  })
}

/** 当收到广播消息时触发 */
export function onBroadcastReceived(
  callback: (from: string, message: string) => void
): Promise<UnlistenFn> {
  return listen<{ from: string; message: string }>('p2p:broadcast-received', (event) => {
    callback(event.payload.from, event.payload.message)
  })
}

/** 当收到私聊消息时触发 */
export function onPrivateMessageReceived(
  callback: (from: string, text: string) => void
): Promise<UnlistenFn> {
  return listen<{ from: string; text: string }>('p2p:private-message-received', (event) => {
    callback(event.payload.from, event.payload.text)
  })
}

/** 当收到文件传输请求时触发 */
export function onFileRequest(
  callback: (payload: FileRequestPayload) => void
): Promise<UnlistenFn> {
  return listen<FileRequestPayload>('p2p:file-request', (event) => {
    callback(event.payload)
  })
}

/** 当文件传输实际开始时触发 */
export function onFileTransferStarted(
  callback: (payload: FileTransferStartedPayload) => void
): Promise<UnlistenFn> {
  return listen<FileTransferStartedPayload>('p2p:file-transfer-started', (event) => {
    callback(event.payload)
  })
}

/** 当文件传输进度更新时触发 */
export function onFileTransferProgress(
  callback: (payload: FileTransferProgressPayload) => void
): Promise<UnlistenFn> {
  return listen<FileTransferProgressPayload>('p2p:file-transfer-progress', (event) => {
    callback(event.payload)
  })
}

/** 当文件接收完成时触发 */
export function onFileReceived(
  callback: (payload: FileReceivedPayload) => void
): Promise<UnlistenFn> {
  return listen<FileReceivedPayload>('p2p:file-received', (event) => {
    callback(event.payload)
  })
}

/** 当文件发送完成时触发 */
export function onFileSent(
  callback: (payload: FileSentPayload) => void
): Promise<UnlistenFn> {
  return listen<FileSentPayload>('p2p:file-sent', (event) => {
    callback(event.payload)
  })
}

/**
 * 当接收到文件块数据流时触发
 * 数据使用 Base64 编码传输，需要前端解码后保存到 IndexedDB
 * @param callback 接收文件块数据的回调函数
 */
export function onFileChunk(
  callback: (payload: FileChunkPayload) => void
): Promise<UnlistenFn> {
  return listen<FileChunkPayload>('p2p:file-chunk', (event) => {
    callback(event.payload)
  })
}

/** 当获取到节点列表时触发 */
export function onPeersList(callback: (peers: string[]) => void): Promise<UnlistenFn> {
  return listen<string[]>('p2p:peers-list', (event) => {
    callback(event.payload)
  })
}