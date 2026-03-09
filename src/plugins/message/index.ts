// src/plugins/message/index.ts
import type { App } from 'vue';
import type { AppPlugin } from '@/core/plugin/type';
import { pluginManager } from '@/core/plugin';
import { routerManager } from '@/core/router';
import { eventBus } from '@/core/event';
import { messageRouter } from './router';

// 插件核心定义
export const messagePlugin: AppPlugin = {
  meta: {
    name: 'message',
    title: '消息',
    icon: 'i-heroicons-chat-bubble-oval-left-20-solid',
    order: 1,
  },
  router: messageRouter,
  hooks: {
    // 插件安装核心逻辑
    install(app: App) {
      try {
        // 1. 注册插件路由
        routerManager.registerPluginRouter('message', messageRouter);

        // 2. 监听全局事件（示例：监听新消息事件）
        eventBus.on('message:new', (msg: { content: string; sessionId: string }) => {
          console.log('收到新消息：', msg);
          // 可在此处实现消息推送逻辑
        });

        // 3. 全局注册插件通用组件（可选）
        // app.component('MessageBubble', () => import('./components/MessageBubble.vue'));
        // app.component('MessageInput', () => import('./components/MessageInput.vue'));

        console.log('✅ 消息插件安装成功');
      } catch (error) {
        console.error('❌ 消息插件安装失败：', error);
        throw error; // 抛出错误，让插件管理器感知
      }
    },
    // 插件激活时执行
    activate() {
      console.log('📢 消息插件已激活');
      eventBus.emit('message:activate');
      
      // 激活时初始化会话列表
      import('./stores/message').then(({ useMessageStore }) => {
        const messageStore = useMessageStore();
        if (messageStore.sessionList.length === 0) {
          messageStore.initSessionList();
        }
      });
    },
    // 插件失活时执行
    deactivate() {
      console.log('📴 消息插件已失活');
      eventBus.emit('message:deactivate');
    },
  },
  // 依赖：无（如需依赖其他插件，添加到这里）
  dependencies: [],
};

// 注册到插件管理器（确保在main.ts执行前注册）
pluginManager.register(messagePlugin);