import { defineStore } from 'pinia';
import { chatDB, type Chat as DbSession, type Message as DbMessage, generateId, getChatId } from '@/utils/preprocessing';
import { useAppConfigStore } from '@/stores/appConfig';
import { broadcastMessage, sendPrivate, sendFileBinary } from '@/p2p/index';
import { fileStorageDB } from '@/utils/fileStorageDB';

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

/**
 * 获取文件的 MIME 类型
 */
function getMimeType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'ogg': 'video/ogg',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'txt': 'text/plain',
    'json': 'application/json',
    'pdf': 'application/pdf',
  };
  return mimeTypes[extension] || 'application/octet-stream';
}

export interface MessageItem {
  id: string;
  content: string;
  from: string;
  timestamp: number;
  type: 'text' | 'file' | 'image' | 'video' | 'audio' | 'system';
  fileName?: string;
  fileSize?: number;
  transferId?: number;
  status: 'pending' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export interface SessionItem {
  id: string;
  title: string;
  avatar?: string;
  lastMsg: string;
  time: string;
  unread?: number;
}

export const useMessageStore = defineStore('message', {
  state: () => ({
    sessionList: [] as SessionItem[],
    currentSessionId: '' as string,
    messageList: [] as MessageItem[],
    totalUnread: 0 as number,
    hasMoreMessages: true as boolean,
    currentPage: 0 as number,
    onlinePeers: new Set<string>(),
  }),
  getters: {
    currentSession: (state) => {
      return state.sessionList.find((item) => item.id === state.currentSessionId) || null;
    },
    isPeerOnline: (state) => (peerId: string) => {
      return state.onlinePeers.has(peerId);
    },
  },
  actions: {
    async initSessionList() {
      if (this.sessionList.length > 0) return;

      try {
        const dbChats = await chatDB.getAllChats();
        
        if (!dbChats || dbChats.length === 0) {
          await this.initBroadcastChannel();
          return;
        }

        this.sessionList = dbChats.map((chat) => ({
          id: chat.id,
          title: chat.name || chat.peerId.slice(0, 8),
          avatar: chat.avatar,
          lastMsg: chat.lastMessage || '暂无消息',
          time: chat.lastMessageTime ? this.formatTime(chat.lastMessageTime) : '',
          unread: chat.unreadCount,
        }));

        this.sessionList.sort((a, b) => {
          if (a.id === 'broadcast') return -1;
          if (b.id === 'broadcast') return 1;
          return 0;
        });

        this.totalUnread = this.sessionList.reduce((sum, item) => sum + (item.unread || 0), 0);
      } catch (error) {
        console.error('Failed to load sessions:', error);
      }
    },

    async initBroadcastChannel() {
      const broadcastChat: DbSession = {
        id: 'broadcast',
        peerId: 'broadcast',
        type: 'broadcast',
        name: '广播频道',
        unreadCount: 0,
        lastMessage: '欢迎加入 NodIM！',
        lastMessageTime: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await chatDB.putChat(broadcastChat);

      this.sessionList = [{
        id: 'broadcast',
        title: '广播频道',
        avatar: '',
        lastMsg: '欢迎加入 NodIM！',
        time: '刚刚',
        unread: 0,
      }];

      this.totalUnread = 0;
    },

    async initMessageList(sessionId: string) {
      if (!sessionId) return;

      this.currentSessionId = sessionId;
      this.messageList = [];
      this.hasMoreMessages = true;
      this.currentPage = 0;

      try {
        const appConfig = useAppConfigStore();
        const myPeerId = appConfig.peerID;

        // 获取会话未读消息数
        const session = this.sessionList.find((item) => item.id === sessionId);
        const unreadCount = session?.unread || 0;
        const totalMessageCount = await chatDB.getMessageCount(sessionId);

        let dbMessages: DbMessage[];

        if (unreadCount === 0) {
          // 没有未读消息：只加载最后10条消息
          dbMessages = await chatDB.getLatestMessages(sessionId, 10);
          this.hasMoreMessages = totalMessageCount > 10;
          this.currentPage = 1;
        } else {
          // 有未读消息：加载全部未读消息 + 5条历史消息
          const loadCount = unreadCount + 5;
          dbMessages = await chatDB.getLatestMessages(sessionId, loadCount);
          this.hasMoreMessages = totalMessageCount > loadCount;
          this.currentPage = 1;
        }

        if (dbMessages && dbMessages.length > 0) {
          this.messageList = dbMessages.map((msg) => ({
            id: msg.id,
            content: msg.content,
            from: msg.from,
            timestamp: msg.timestamp,
            type: msg.type,
            fileName: msg.fileName,
            fileSize: msg.fileSize,
            transferId: msg.transferId,
            status: msg.status,
          }));
          
          // 重新生成文件预览 URL（处理刷新页面后 Blob URL 失效的问题）
          await this.regenerateFilePreviewUrls();
        }

        // 更新未读计数
        if (session) session.unread = 0;
        this.updateTotalUnread();

      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    },

    /**
     * 重新生成文件预览 URL（处理刷新页面后 Blob URL 失效的问题）
     */
    async regenerateFilePreviewUrls() {
      console.log('[Store] Regenerating file preview URLs...');
      
      for (let i = 0; i < this.messageList.length; i++) {
        const msg = this.messageList[i];
        
        // 只处理图片、视频、音频消息，且 transferId 存在，且 content 不是有效的 Blob URL
        if ((msg.type === 'image' || msg.type === 'video' || msg.type === 'audio') && msg.transferId) {
          if (msg.content.startsWith('blob:')) {
            try {
              // 从 fileStorageDB 获取文件数据
              const binaryData = await fileStorageDB.getAllChunks(msg.transferId);
              const mimeType = getMimeType(msg.fileName || '');
              const blob = new Blob([binaryData], { type: mimeType });
              const blobUrl = URL.createObjectURL(blob);
              console.log("新的blob:",blobUrl);
              
              // 更新消息的 content 为新的 Blob URL
              this.messageList[i] = {
                ...msg,
                content: blobUrl
              };
              
              console.log('[Store] Regenerated URL for:', msg.fileName);
            } catch (error) {
              console.error('[Store] Failed to regenerate URL:', error);
            }
          }
        }
      }
    },

    async loadHistoryMessages(sessionId: string) {
      if (!sessionId || !this.hasMoreMessages) return;

      try {
        const pageSize = 20;
        const offset = this.currentPage * pageSize;
        const dbMessages = await chatDB.getMessagesByChat(sessionId, offset, pageSize);
        
        if (!dbMessages || dbMessages.length === 0) {
          this.hasMoreMessages = false;
          return;
        }

        const appConfig = useAppConfigStore();
        const myPeerId = appConfig.peerID;

        const newMessages = dbMessages.map((msg) => ({
          id: msg.id,
          content: msg.content,
          from: msg.from,
          timestamp: msg.timestamp,
          type: msg.type,
          fileName: msg.fileName,
          fileSize: msg.fileSize,
          transferId: msg.transferId,
          status: msg.status,
        }));

        // 追加到列表前面（历史消息）
        this.messageList = [...newMessages, ...this.messageList];
        this.currentPage++;
        this.hasMoreMessages = dbMessages.length >= pageSize;

      } catch (error) {
        console.error('Failed to load history messages:', error);
      }
    },

    async sendMessage(content: string) {
      if (!content.trim() || !this.currentSessionId) {
        console.log('[Message] sendMessage skipped - content empty or no session:', { content, currentSessionId: this.currentSessionId });
        return;
      }

      const appConfig = useAppConfigStore();
      const myPeerId = appConfig.peerID;
      const toPeerId = this.currentSessionId === 'broadcast' ? 'broadcast' : this.currentSessionId;

      console.log('[Message] Sending message:', { content, currentSessionId: this.currentSessionId, myPeerId, isBroadcast: this.currentSessionId === 'broadcast' });

      const newMsg: MessageItem = {
        id: generateId(),
        content,
        from: myPeerId,
        timestamp: Date.now(),
        type: 'text',
        status: 'sending',
      };

      this.messageList.push(newMsg);

      const dbMsg: DbMessage = {
        id: newMsg.id,
        chatId: this.currentSessionId,
        from: myPeerId,
        to: toPeerId,
        type: 'text',
        content,
        status: 'sending',
        timestamp: Date.now(),
        isSelf: true,
      };

      try {
        await chatDB.putMessage(dbMsg);
        console.log('[Message] Message saved to database');

        // 通过 P2P 发送消息
        if (this.currentSessionId === 'broadcast') {
          console.log('[Message] Calling broadcastMessage...');
          await broadcastMessage(content);
          console.log('[Message] broadcastMessage completed');
        } else {
          console.log('[Message] Calling sendPrivate...');
          await sendPrivate(toPeerId, content);
          console.log('[Message] sendPrivate completed');
        }

        newMsg.status = 'sent';
        await chatDB.updateMessageStatus(newMsg.id, 'sent');
        console.log('[Message] Message status updated to sent');

        this.updateSessionLastMsg(content, newMsg.timestamp.toString());

        setTimeout(async () => {
          newMsg.status = 'delivered';
          await chatDB.updateMessageStatus(newMsg.id, 'delivered');
        }, 1000);
      } catch (error) {
        console.error('[Message] Failed to send message:', error);
        newMsg.status = 'failed';
      }
    },

    async sendFileMessage(fileName: string, data: number[], fileSize: number) {
      if (!fileName || !data || data.length === 0 || !this.currentSessionId) {
        console.log('[Message] sendFileMessage skipped - missing parameters');
        return;
      }

      const appConfig = useAppConfigStore();
      const myPeerId = appConfig.peerID;
      const toPeerId = this.currentSessionId === 'broadcast' ? 'broadcast' : this.currentSessionId;

      // 根据文件名确定消息类型
      const extension = fileName.split('.').pop()?.toLowerCase() || '';
      const mimeType = this.getMimeType(extension);
      let messageType: MessageItem['type'] = 'file';
      
      if (mimeType.startsWith('image/')) {
        messageType = 'image';
      } else if (mimeType.startsWith('video/')) {
        messageType = 'video';
      } else if (mimeType.startsWith('audio/')) {
        messageType = 'audio';
      } else if (mimeType.startsWith('text/')) {
        messageType = 'text';
      }

      console.log('[Message] Sending file:', { fileName, fileSize, messageType, currentSessionId: this.currentSessionId });

      // 生成 transferId
      const transferId = Date.now();
      
      // 创建预览 URL
      let contentUrl = '';
      
      if (messageType === 'image' || messageType === 'video' || messageType === 'audio') {
        const blob = new Blob([new Uint8Array(data)], { type: mimeType });
        contentUrl = URL.createObjectURL(blob);
      } else if (messageType === 'text') {
        contentUrl = new TextDecoder().decode(new Uint8Array(data));
      } else {
        contentUrl = `file://${transferId}`;
      }

      const newMsg: MessageItem = {
        id: generateId(),
        content: contentUrl,
        from: myPeerId,
        timestamp: Date.now(),
        type: messageType,
        fileName,
        fileSize,
        transferId,
        status: 'sending',
      };

      this.messageList.push(newMsg);

      const dbMsg: DbMessage = {
        id: newMsg.id,
        chatId: this.currentSessionId,
        from: myPeerId,
        to: toPeerId,
        type: messageType,
        content: contentUrl,
        fileName,
        fileSize,
        transferId,
        status: 'sending',
        timestamp: Date.now(),
        isSelf: true,
      };

      try {
        // 保存文件到 fileStorageDB（用于发送端预览和下载）
        // 与接收端保持一致：使用 256KB 分块
        const chunkSize = 256 * 1024;
        const totalChunks = Math.ceil(fileSize / chunkSize);
        
        // 创建传输记录
        await fileStorageDB.createTransfer(
          toPeerId,
          transferId,
          fileName,
          fileSize,
          totalChunks
        );
        
        // 分块保存文件数据（直接保存 Uint8Array，避免不必要的 Base64 编码）
        const uint8Data = new Uint8Array(data);
        for (let i = 0; i < totalChunks; i++) {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, fileSize);
          const chunk = uint8Data.subarray(start, end);
          await fileStorageDB.saveChunkBinary(transferId, i, chunk);
        }
        
        // 标记传输完成
        await fileStorageDB.completeTransfer(toPeerId, transferId);
        
        console.log('[Message] File saved to storage');
        
        await chatDB.putMessage(dbMsg);
        console.log('[Message] File message saved to database');

        // 通过 P2P 发送文件（使用二进制分块传输）
        if (this.currentSessionId !== 'broadcast') {
          await sendFileBinary(toPeerId, fileName, data);
        } else {
          // 广播暂不支持文件传输
          console.log('[Message] Broadcast file transfer not supported');
        }

        newMsg.status = 'sent';
        await chatDB.updateMessageStatus(newMsg.id, 'sent');
        console.log('[Message] File message status updated to sent');

        this.updateSessionLastMsg(`[文件] ${fileName}`, newMsg.timestamp.toString());

        setTimeout(async () => {
          newMsg.status = 'delivered';
          await chatDB.updateMessageStatus(newMsg.id, 'delivered');
        }, 1000);
      } catch (error) {
        console.error('[Message] Failed to send file:', error);
        newMsg.status = 'failed';
      }
    },

    /**
     * 根据文件扩展名获取 MIME 类型
     */
    getMimeType(extension: string): string {
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
      return mimeTypes[extension] || 'application/octet-stream';
    },

    async handleBroadcastMessage(from: string, message: string) {
      const appConfig = useAppConfigStore();
      const myPeerId = appConfig.peerID;

      // 忽略自己发送的消息
      if (from === myPeerId) return;

      const chatId = 'broadcast';

      // 检查是否已存在该会话
      let session = this.sessionList.find((item) => item.id === chatId);
      if (!session) {
        await this.initBroadcastChannel();
        session = this.sessionList.find((item) => item.id === chatId);
      }

      // 创建消息对象
      const newMsg: MessageItem = {
        id: generateId(),
        content: message,
        from,
        timestamp: Date.now(),
        type: 'text',
        status: 'delivered',
      };

      // 如果当前正在查看广播频道，直接添加到消息列表
      if (this.currentSessionId === chatId) {
        this.messageList.push(newMsg);
      } else {
        // 否则增加未读计数
        if (session) session.unread = (session.unread || 0) + 1;
        this.totalUnread++;
      }

      // 保存到数据库
      const dbMsg: DbMessage = {
        id: newMsg.id,
        chatId,
        from,
        to: 'broadcast',
        type: 'text',
        content: message,
        status: 'delivered',
        timestamp: Date.now(),
        isSelf: false,
      };

      await chatDB.putMessage(dbMsg).catch(console.error);

      // 更新会话最后消息
      if (session) {
        session.lastMsg = message.length > 50 ? message.slice(0, 50) + '...' : message;
        session.time = this.formatTime(Date.now());
      }

      chatDB.getChat(chatId).then((chat) => {
        if (chat) {
          chat.lastMessage = message;
          chat.lastMessageTime = Date.now();
          chat.updatedAt = Date.now();
          chat.unreadCount = (chat.unreadCount || 0) + 1;
          chatDB.putChat(chat).catch(console.error);
        }
      }).catch(console.error);
    },

    async handlePrivateMessage(from: string, text: string) {
      const appConfig = useAppConfigStore();
      const myPeerId = appConfig.peerID;

      // 忽略自己发送的消息
      if (from === myPeerId) return;

      const chatId = getChatId(from, 'private');

      // 检查是否已存在该会话，不存在则创建
      let session = this.sessionList.find((item) => item.id === chatId);
      if (!session) {
        await this.addOrUpdateSession(from);
        session = this.sessionList.find((item) => item.id === chatId);
      }

      // 尝试解析消息内容，判断是否是文件消息
      let messageType: MessageItem['type'] = 'text';
      let messageContent = text;
      let fileName: string | undefined;
      let fileSize: number | undefined;
      let transferId: number | undefined;

      try {
        const parsed = JSON.parse(text);
        if (parsed.type && ['image', 'video', 'audio', 'textfile', 'file'].includes(parsed.type)) {
          messageType = parsed.type === 'textfile' ? 'text' : parsed.type;
          messageContent = parsed.url || parsed.content || `file://${parsed.transferId}`;
          fileName = parsed.fileName;
          fileSize = parsed.fileSize;
          transferId = parsed.transferId;
        }
      } catch {
        // 不是JSON格式，视为普通文本消息
      }

      // 创建消息对象
      const newMsg: MessageItem = {
        id: generateId(),
        content: messageContent,
        from,
        timestamp: Date.now(),
        type: messageType,
        fileName,
        fileSize,
        transferId,
        status: 'delivered',
      };

      // 如果当前正在查看该会话，直接添加到消息列表
      if (this.currentSessionId === chatId) {
        this.messageList.push(newMsg);
      } else {
        // 否则增加未读计数
        if (session) session.unread = (session.unread || 0) + 1;
        this.totalUnread++;
      }

      // 保存到数据库
      const dbMsg: DbMessage = {
        id: newMsg.id,
        chatId,
        from,
        to: myPeerId,
        type: messageType,
        content: messageContent,
        fileName,
        fileSize,
        transferId,
        status: 'delivered',
        timestamp: Date.now(),
        isSelf: false,
      };

      await chatDB.putMessage(dbMsg).catch(console.error);

      // 更新会话最后消息
      const lastMsgPreview = fileName ? `[文件] ${fileName}` : (messageContent.length > 50 ? messageContent.slice(0, 50) + '...' : messageContent);
      if (session) {
        session.lastMsg = lastMsgPreview;
        session.time = this.formatTime(Date.now());
      }

      chatDB.getChat(chatId).then((chat) => {
        if (chat) {
          chat.lastMessage = lastMsgPreview;
          chat.lastMessageTime = Date.now();
          chat.updatedAt = Date.now();
          chat.unreadCount = (chat.unreadCount || 0) + 1;
          chatDB.putChat(chat).catch(console.error);
        }
      }).catch(console.error);
    },

    async addOrUpdateSession(peerId: string, peerName?: string) {
      const chatId = getChatId(peerId, 'private');
      const existing = this.sessionList.find((item) => item.id === chatId);

      if (existing) {
        // 更新现有会话
        if (peerName) existing.title = peerName;
      } else {
        // 创建新会话
        const newSession: SessionItem = {
          id: chatId,
          title: peerName || peerId.slice(0, 8),
          avatar: '',
          lastMsg: '开始对话',
          time: this.formatTime(Date.now()),
          unread: 0,
        };

        // 广播频道保持在首位，其他会话插入到第二位之后
        const broadcastIndex = this.sessionList.findIndex((item) => item.id === 'broadcast');
        if (broadcastIndex !== -1) {
          this.sessionList.splice(broadcastIndex + 1, 0, newSession);
        } else {
          this.sessionList.unshift(newSession);
        }

        const dbChat: DbSession = {
          id: chatId,
          peerId,
          type: 'private',
          name: peerName,
          unreadCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        await chatDB.putChat(dbChat).catch(console.error);
      }
    },

    updateSessionLastMsg(content: string, time: string) {
      const session = this.sessionList.find((item) => item.id === this.currentSessionId);
      if (session) {
        session.lastMsg = content.length > 50 ? content.slice(0, 50) + '...' : content;
        session.time = time;
      }

      chatDB.getChat(this.currentSessionId).then((chat) => {
        if (chat) {
          chat.lastMessage = content;
          chat.lastMessageTime = Date.now();
          chat.updatedAt = Date.now();
          chatDB.putChat(chat).catch(console.error);
        }
      }).catch(console.error);
    },

    updateTotalUnread() {
      this.totalUnread = this.sessionList.reduce((sum, item) => sum + (item.unread || 0), 0);
    },

    async markAsRead(sessionId: string) {
      // 更新状态管理中的未读计数
      const session = this.sessionList.find((item) => item.id === sessionId);
      if (session) {
        this.totalUnread -= session.unread || 0;
        session.unread = 0;
      }

      // 更新数据库中的未读计数
      try {
        const chat = await chatDB.getChat(sessionId);
        if (chat) {
          chat.unreadCount = 0;
          chat.updatedAt = Date.now();
          await chatDB.putChat(chat);
        }
      } catch (error) {
        console.error('Failed to mark messages as read:', error);
      }
    },

    formatTime(timestamp: number): string {
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
    },

    async deleteSession(sessionId: string) {
      // 广播频道不允许删除
      if (sessionId === 'broadcast') return;

      try {
        // 从状态中移除会话
        const index = this.sessionList.findIndex((item) => item.id === sessionId);
        if (index !== -1) {
          const deletedSession = this.sessionList[index];
          // 减少总未读计数
          this.totalUnread -= deletedSession.unread || 0;
          this.sessionList.splice(index, 1);
        }

        // 如果当前会话被删除，重置当前会话ID
        if (this.currentSessionId === sessionId) {
          this.currentSessionId = '';
          this.messageList = [];
        }

        // 从数据库中删除会话及相关消息
        await chatDB.deleteChat(sessionId);
        console.log('Session deleted:', sessionId);
      } catch (error) {
        console.error('Failed to delete session:', error);
        throw error;
      }
    },

    setPeerOnline(peerId: string) {
      this.onlinePeers.add(peerId);
    },

    setPeerOffline(peerId: string) {
      this.onlinePeers.delete(peerId);
    },

    clearOnlinePeers() {
      this.onlinePeers.clear();
    },
  },
});