import { defineStore } from 'pinia';
import { chatDB, type Chat as DbSession, type Message as DbMessage, generateId, getChatId } from '@/utils/preprocessing';
import { useAppConfigStore } from '@/stores/appConfig';
import { broadcastMessage, sendPrivate } from '@/p2p/index';

export interface MessageItem {
  id: string;
  content: string;
  sender: 'me' | 'other';
  time: string;
  type: 'text' | 'file' | 'image' | 'video' | 'audio' | 'system';
  fileName?: string;
  fileSize?: number;
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
  }),
  getters: {
    currentSession: (state) => {
      return state.sessionList.find((item) => item.id === state.currentSessionId) || null;
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
            sender: msg.from === myPeerId ? 'me' : ('other' as 'me' | 'other'),
            time: this.formatTime(msg.timestamp),
            type: msg.type,
            fileName: msg.fileName,
            fileSize: msg.fileSize,
            status: msg.status,
          }));
        }

        // 更新未读计数
        if (session) session.unread = 0;
        this.updateTotalUnread();

      } catch (error) {
        console.error('Failed to load messages:', error);
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
          sender: msg.from === myPeerId ? 'me' : ('other' as 'me' | 'other'),
          time: this.formatTime(msg.timestamp),
          type: msg.type,
          fileName: msg.fileName,
          fileSize: msg.fileSize,
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
        sender: 'me',
        time: this.formatTime(Date.now()),
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

        this.updateSessionLastMsg(content, newMsg.time);

        setTimeout(async () => {
          newMsg.status = 'delivered';
          await chatDB.updateMessageStatus(newMsg.id, 'delivered');
        }, 1000);
      } catch (error) {
        console.error('[Message] Failed to send message:', error);
        newMsg.status = 'failed';
      }
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
        sender: 'other',
        time: this.formatTime(Date.now()),
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

      // 创建消息对象
      const newMsg: MessageItem = {
        id: generateId(),
        content: text,
        sender: 'other',
        time: this.formatTime(Date.now()),
        type: 'text',
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
        type: 'text',
        content: text,
        status: 'delivered',
        timestamp: Date.now(),
        isSelf: false,
      };

      await chatDB.putMessage(dbMsg).catch(console.error);

      // 更新会话最后消息
      if (session) {
        session.lastMsg = text.length > 50 ? text.slice(0, 50) + '...' : text;
        session.time = this.formatTime(Date.now());
      }

      chatDB.getChat(chatId).then((chat) => {
        if (chat) {
          chat.lastMessage = text;
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
  },
});