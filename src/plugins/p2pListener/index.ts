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
  type FileChunkPayload
} from '@/p2p/index';
import { useMessageStore } from '@/plugins/message/stores/index';
import { fileStorageDB } from '@/utils/fileStorageDB';


let isInitialized = false;
let isP2PStarted = false;
const unlisteners: (() => void)[] = [];

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

      if (appConfig.identityKey) {
        console.log('使用已有的身份密钥启动 P2P 网络');
        peerId = await startWithIdentity(appConfig.identityKey);
        console.log(`P2P started with existing identity: ${peerId}`);
      } else {
        console.log('生成新的身份密钥对...');
        const [keyBase64, newPeerId] = await generateIdentity();
        
        appConfig.identityKey = keyBase64;
        appConfig.peerID = newPeerId;
        
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

      // 文件接收完成
      unlisteners.push(await onFileReceived((payload) => {
        console.log('[P2P] File received:', payload.fileName, payload.fileSize);
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