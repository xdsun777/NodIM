import type { App } from 'vue';
import { 
  generateIdentity,
  startWithIdentity,
  onPeerConnected, 
  onPeerDisconnected, 
  onPeerDiscovered,
  onBroadcastReceived, 
  onPrivateMessageReceived,
  onFileRequest,
  onFileTransferStarted,
  onFileTransferProgress,
  onFileChunk,
  onFileReceived,
  type DiscoveredPeer,
  type FileChunkPayload,
  type FileReceivedPayload
} from '@/p2p/index';
import { useMessageStore } from '@/plugins/message/stores/index';
import { fileStorageDB } from '@/utils/fileStorageDB';

// 文件类型映射
const MIME_TYPES: Record<string, string> = {
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
  'webm': 'video/webm',
  'zip': 'application/zip',
  'rar': 'application/x-rar-compressed',
  '7z': 'application/x-7z-compressed',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'ppt': 'application/vnd.ms-powerpoint',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
};

/**
 * 根据文件名获取消息类型
 */
function getMessageType(fileName: string): 'text' | 'file' | 'image' | 'video' | 'audio' | 'system' {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  const mimeType = MIME_TYPES[extension] || '';
  
  if (mimeType.startsWith('image/')) {
    return 'image';
  } else if (mimeType.startsWith('video/')) {
    return 'video';
  } else if (mimeType.startsWith('audio/')) {
    return 'audio';
  } else if (mimeType.startsWith('text/')) {
    return 'text';
  } else {
    return 'file';
  }
}

/**
 * 根据文件名获取 MIME 类型
 */
function getMimeType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  return MIME_TYPES[extension] || 'application/octet-stream';
}

/**
 * 将 Uint8Array 转换为 Base64 字符串（分块处理避免调用栈溢出）
 */
function uint8ArrayToBase64(data: Uint8Array): string {
  const chunkSize = 8192; // 每块处理 8KB
  let result = '';
  
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.subarray(i, Math.min(i + chunkSize, data.length));
    result += btoa(String.fromCharCode(...chunk));
  }
  
  return result;
}


let isInitialized = false;
let isP2PStarted = false;
const unlisteners: (() => void)[] = [];

// 文件传输映射：fileName -> { peer, transferId }
const fileTransferMap = new Map<string, { peer: string; transferId: number }>();

/**
 * 全局 P2P 事件监听服务
 * 在应用启动时初始化，后台持续监听所有 P2P 事件
 */
export function useP2PListener() {
  const messageStore = useMessageStore();

  /**
   * 初始化 P2P 网络
   * 1. 检查是否已有身份密钥
   * 2. 如果没有，生成新的身份密钥对
   * 3. 使用密钥启动 P2P 网络
   * @returns 当前节点的 PeerId
   */
  async function initP2P(): Promise<string> {
    if (isP2PStarted) {
      const { useAppConfigStore } = await import('@/stores/appConfig');
      const appConfig = useAppConfigStore();
      return appConfig.peerID;
    }

    console.log('初始化 P2P 网络...');

    try {
      const { useAppConfigStore } = await import('@/stores/appConfig');
      const appConfig = useAppConfigStore();

      let peerId: string;

      if (appConfig.identityKey!='' && appConfig.peerID!='' && appConfig.identityKey!=null) {
        console.log('使用已有的身份密钥启动 P2P 网络');
        peerId = await startWithIdentity(appConfig.identityKey);
        console.log(`P2P started with existing identity: ${peerId}`);
      } else {
        console.log('生成新的身份密钥对...');
        const [newPeerId,keyBase64] = await generateIdentity();
        
        appConfig.peerID = newPeerId;
        appConfig.identityKey = keyBase64;
        
        peerId = newPeerId;
        console.log(`✓ 生成新的身份密钥对成功: ${peerId}`);
      }

      appConfig.status = 'online';
      isP2PStarted = true;
      
      console.log(`✓ P2P 网络初始化成功，PeerId: ${peerId}`);
      return peerId;

    } catch (error) {
      console.error('初始化 P2P 网络失败:', error);
      throw error;
    }
  }

  /**
   * 初始化所有事件监听器
   */
  async function initListeners() {
    if (isInitialized) {
      console.log('P2P listeners already initialized');
      return;
    }

    console.log('Initializing global P2P listeners...');

    try {
      // ==================== 节点连接事件 ====================
      // 新节点连接（不自动创建私聊会话，只有收到消息时才创建）
      unlisteners.push(await onPeerConnected((peerId) => {
        console.log('[P2P] Peer connected:', peerId);
        messageStore.setPeerOnline(peerId);
      }));

      // 节点断开连接
      unlisteners.push(await onPeerDisconnected((peerId) => {
        console.log('[P2P] Peer disconnected:', peerId);
        messageStore.setPeerOffline(peerId);
      }));

      // 发现新节点
      unlisteners.push(await onPeerDiscovered((peer: DiscoveredPeer) => {
        console.log('[P2P] Peer discovered:', peer.peer, peer.addr);
      }));

      // ==================== 消息事件 ====================
      // 广播消息接收
      unlisteners.push(await onBroadcastReceived(async (from, message) => {
        console.log('[P2P] Broadcast received from:', from, 'message:', message);
        try {
          await messageStore.handleBroadcastMessage(from, message);
        } catch (error) {
          console.error('[P2P] Failed to process broadcast message:', error);
        }
      }));

      // 私聊消息接收
      unlisteners.push(await onPrivateMessageReceived(async (from, text) => {
        console.log('[P2P] Private message from:', from, 'text:', text);
        try {
          await messageStore.handlePrivateMessage(from, text);
        } catch (error) {
          console.error('[P2P] Failed to process private message:', error);
        }
      }));

      // ==================== 文件传输事件 ====================
      // 文件请求
      unlisteners.push(await onFileRequest(async (payload) => {
        console.log('[P2P] File request:', payload);
        
        // 保存文件传输映射
        const mapKey = `${payload.peer}-${payload.fileName}`;
        fileTransferMap.set(mapKey, { peer: payload.peer, transferId: payload.transferId });
        console.log('[P2P] File transfer map saved:', mapKey, payload.transferId);
        
        await fileStorageDB.createTransfer(
          payload.peer,
          payload.transferId,
          payload.fileName,
          payload.fileSize,
          Math.ceil(payload.fileSize / (256 * 1024))
        ).catch(console.error);
      }));

      // 文件传输开始
      unlisteners.push(await onFileTransferStarted((payload) => {
        console.log('[P2P] File transfer started:', payload);
      }));

      // 文件传输进度
      unlisteners.push(await onFileTransferProgress((payload) => {
        console.log('[P2P] File transfer progress:', payload.peer, payload.progress + '%');
      }));

      // 文件块接收
      unlisteners.push(await onFileChunk(async (payload: FileChunkPayload) => {
        try {
          console.log('[P2P] File chunk received:', payload.transferId, payload.chunkIndex);
          
          await fileStorageDB.saveChunk(
            payload.transferId,
            payload.chunkIndex,
            payload.dataBase64
          );

          if (payload.isLast) {
            await fileStorageDB.completeTransfer(payload.peer, payload.transferId);
            console.log('[P2P] File transfer completed:', payload.transferId);
          }
        } catch (error) {
          console.error('[P2P] Failed to save file chunk:', error);
        }
      }));

      // 文件接收完成（文件已通过 onFileChunk 保存，这里只处理消息通知）
      unlisteners.push(await onFileReceived(async (payload: FileReceivedPayload) => {
        console.log('[P2P] File received:', payload.fileName, payload.fileSize);
        
        try {
          // 根据文件名确定消息类型
          const messageType = getMessageType(payload.fileName);
          const mimeType = getMimeType(payload.fileName);
          
          // 从映射中获取 transferId
          const mapKey = `${payload.peer}-${payload.fileName}`;
          const transferInfo = fileTransferMap.get(mapKey);
          const transferId = transferInfo?.transferId || Date.now();
          console.log('[P2P] File transfer ID retrieved:', transferId);
          
          // 根据消息类型处理
          if (messageType === 'image') {
            // 图片消息 - 创建预览 URL
            const binaryString = atob(payload.dataBase64);
            const binaryData = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              binaryData[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([binaryData], { type: mimeType });
            const contentUrl = URL.createObjectURL(blob);
            
            await messageStore.handlePrivateMessage(
              payload.peer, 
              JSON.stringify({
                type: 'image',
                url: contentUrl,
                fileName: payload.fileName,
                transferId
              })
            );
          } else if (messageType === 'video') {
            // 视频消息 - 创建预览 URL
            const binaryString = atob(payload.dataBase64);
            const binaryData = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              binaryData[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([binaryData], { type: mimeType });
            const contentUrl = URL.createObjectURL(blob);
            
            await messageStore.handlePrivateMessage(
              payload.peer, 
              JSON.stringify({
                type: 'video',
                url: contentUrl,
                fileName: payload.fileName,
                fileSize: payload.fileSize,
                transferId
              })
            );
          } else if (messageType === 'audio') {
            // 音频消息 - 创建预览 URL
            const binaryString = atob(payload.dataBase64);
            const binaryData = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              binaryData[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([binaryData], { type: mimeType });
            const contentUrl = URL.createObjectURL(blob);
            
            await messageStore.handlePrivateMessage(
              payload.peer, 
              JSON.stringify({
                type: 'audio',
                url: contentUrl,
                fileName: payload.fileName,
                fileSize: payload.fileSize,
                transferId
              })
            );
          } else if (messageType === 'text') {
            // 文本文件消息
            const binaryString = atob(payload.dataBase64);
            const binaryData = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              binaryData[i] = binaryString.charCodeAt(i);
            }
            const contentUrl = new TextDecoder().decode(binaryData);
            
            await messageStore.handlePrivateMessage(
              payload.peer, 
              JSON.stringify({
                type: 'textfile',
                content: contentUrl,
                fileName: payload.fileName,
                transferId
              })
            );
          } else {
            // 其他文件消息
            await messageStore.handlePrivateMessage(
              payload.peer, 
              JSON.stringify({
                type: 'file',
                transferId,
                fileName: payload.fileName,
                fileSize: payload.fileSize
              })
            );
          }
          
          console.log('[P2P] File message processed successfully');
          
        } catch (error) {
          console.error('[P2P] Failed to process received file:', error);
        }
      }));

      isInitialized = true;
      console.log('✓ All P2P listeners initialized successfully');
    } catch (error) {
      console.error('Failed to initialize P2P listeners:', error);
      throw error;
    }
  }

  /**
   * 完整初始化：先启动 P2P 网络，再注册事件监听器
   */
  async function initialize(): Promise<string> {
    const peerId = await initP2P();
    await initListeners();
    return peerId;
  }

  /**
   * 清理所有事件监听器
   */
  function cleanupListeners() {
    console.log('Cleaning up P2P listeners...');
    unlisteners.forEach((fn) => fn());
    unlisteners.length = 0;
    isInitialized = false;
  }

  return {
    initP2P,
    initListeners,
    initialize,
    cleanupListeners,
    isInitialized,
    isP2PStarted,
  };
}

/**
 * Vue 插件：在应用启动时自动初始化 P2P 监听
 */
export function installP2PListener(app: App) {
  const { initialize } = useP2PListener();
  
  app.mount('#app');
  initialize().catch(console.error);

  app.config.globalProperties.$cleanupP2PListeners = () => {
    const { cleanupListeners } = useP2PListener();
    cleanupListeners();
  };
}

export default {
  install: installP2PListener,
};