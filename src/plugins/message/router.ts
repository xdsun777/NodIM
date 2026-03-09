// src/plugins/message/router.ts
import type { PluginRouter } from '@/core/plugin/type';

// 懒加载页面（确保路径正确）
const SessionList = () => import('@/plugins/message/pages/SessionList.vue');
const ChatPage = () => import('@/plugins/message/pages/ChatPage.vue');

// 插件路由配置
export const messageRouter: PluginRouter = {
  prefix: '/message', // 路由前缀
  routes: [
    {
      path: '/', // 最终路径：/message/
      name: 'message-session-list',
      component: SessionList,
      meta: { title: '消息列表' },
    },
    {
      path: '/chat/:sessionId', // 最终路径：/message/chat/:sessionId
      name: 'message-chat',
      component: ChatPage,
      meta: { title: '聊天' },
    },
  ],
};