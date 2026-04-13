// ├── plugins/              # 所有业务插件
// │   ├── message/          # 消息插件
// │   │   ├── index.ts      # 插件入口
// │   │   ├── pages/        # 页面：会话列表/聊天页
// │   │   ├── components/   # 内部组件：消息气泡/输入框
// │   │   ├── stores/       # 状态管理
// │   │   └── router.ts     # 插件路由
// │   ├── contact/          # 联系人插件
// │   ├── call/             # 音视频插件
// │   ├── settings/         # 设置插件
// │   └── mine/             # 个人中心插件
// src/plugins/message/router.ts
import type { PluginRouter } from '@/core/plugin/type';

// 懒加载页面（确保路径正确）
const SessionList = () => import('@/plugins/contact/pages/SessionList.vue');
const ChatPage = () => import('@/plugins/contact/pages/ChatPage.vue');

// 插件路由配置
export const contactRouter: PluginRouter = {
  prefix: '/contact', // 路由前缀
  routes: [
    {
      path: '/', // 最终路径：/message/
      name: 'contact-session-list',
      component: SessionList,
      meta: { title: '联系人列表' },
    },
    {
      path: '/chat/:sessionId', // 最终路径：/message/chat/:sessionId
      name: 'contact-chat',
      component: ChatPage,
      meta: { title: '联系人' },
    },
  ],
};
