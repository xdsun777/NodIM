// src/plugins/test/stores/message.ts
import { defineStore } from 'pinia';

// 定义消息类型
export interface MessageItem {
  id: string;
  content: string;
  sender: string; // 'me' | 'other'
  time: string;
}

// 定义会话类型
export interface SessionItem {
  id: string;
  title: string;
  avatar?: string;
  lastMsg: string;
  time: string;
  unread?: number;
}

export const useMessageStore = defineStore('test', {
  state: () => ({
    // 会话列表（初始化为空数组，避免 undefined）
    sessionList: [] as SessionItem[],
    // 当前选中的会话ID
    currentSessionId: '' as string,
    // 当前会话的消息列表（初始化为空数组）
    messageList: [] as MessageItem[],
    // 全局未读消息数
    totalUnread: 0 as number,
  }),
  getters: {
    // 获取当前会话（添加空值保护）
    currentSession: (state) => {
      return (
        state.sessionList.find((item) => item.id === state.currentSessionId) ||
        null
      );
    },
  },
  actions: {
    // 初始化会话列表（模拟接口请求）
    async initSessionList() {
      // 避免重复请求
      if (this.sessionList.length > 0) return;

      // 模拟异步请求
      await new Promise((resolve) => setTimeout(resolve, 300));

      this.sessionList = [
        {
          id: 'session_1',
          title: '张三',
          avatar: 'https://picsum.photos/200/200?random=1',
          lastMsg: '最近忙吗？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？',
          time: '10:20',
          unread: 2,
        },
        {
          id: 'session_2',
          title: '李四',
          avatar: 'https://picsum.photos/200/200?random=2',
          lastMsg: '周末一起吃饭？',
          time: '09:15',
          unread: 0,
        },
        {
          id: 'session_3',
          title: '王五',
          avatar: 'https://picsum.photos/200/200?random=3',
          lastMsg: '项目文档发你了',
          time: '昨天',
          unread: 1,
        },
      ];

      // 计算总未读
      this.totalUnread = this.sessionList.reduce(
        (sum, item) => sum + (item.unread || 0),
        0,
      );
    },

    // 初始化指定会话的消息列表
    async initMessageList(sessionId: string) {
      if (!sessionId) return; // 空值保护

      this.currentSessionId = sessionId;

      // 模拟异步请求
      await new Promise((resolve) => setTimeout(resolve, 300));

      this.messageList = [
        { id: 'msg_1', content: '你好！', sender: 'other', time: '10:00' },
        { id: 'msg_2', content: '你好呀 😊', sender: 'me', time: '10:01' },
        {
          id: 'msg_3',
          content: '最近项目进展怎么样？',
          sender: 'other',
          time: '10:05',
        },
        {
          id: 'msg_4',
          content: '还挺顺利的，下周应该能上线',
          sender: 'me',
          time: '10:06',
        },
      ];

      // 清空当前会话未读
      const session = this.sessionList.find((item) => item.id === sessionId);
      if (session) session.unread = 0;
      this.totalUnread = this.sessionList.reduce(
        (sum, item) => sum + (item.unread || 0),
        0,
      );
    },

    // 发送消息
    sendMessage(content: string) {
      if (!content.trim()) return;

      const newMsg: MessageItem = {
        id: `msg_${Date.now()}`,
        content,
        sender: 'me',
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      this.messageList.push(newMsg);

      // 更新当前会话最后一条消息
      const session = this.sessionList.find(
        (item) => item.id === this.currentSessionId,
      );
      if (session) {
        session.lastMsg = content;
        session.time = newMsg.time;
      }

      // 模拟对方回复（500ms 后）
      setTimeout(() => {
        const replyMsg: MessageItem = {
          id: `msg_${Date.now() + 1}`,
          content: '收到！我稍后看看',
          sender: 'other',
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        this.messageList.push(replyMsg);

        // 更新会话最后一条消息
        if (session) {
          session.lastMsg = replyMsg.content;
          session.time = replyMsg.time;
        }
      }, 500);
    },
  },
});
