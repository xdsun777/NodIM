// src/plugins/message/index.ts
import type { App } from 'vue';
import type { AppPlugin } from '@/core/plugin/type';
import { pluginManager } from '@/core/plugin';
import { routerManager } from '@/core/router';
import { eventBus } from '@/core/event';
import { mineRouter } from './router';

// 插件核心定义
export const minePlugin: AppPlugin = {
  meta: {
    name: 'mine',
    title: '我的',
    icon: 'wode',
    order: 3,
    headerData: {
      leftIcon: '',
      title: '',
      rightIcon: '',
      search:null
    }
  },
  router: mineRouter,
  hooks: {
    // 插件安装核心逻辑
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    install(app: App) {
      try {
        // 1. 注册插件路由
        routerManager.registerPluginRouter('mine', mineRouter);
        
        // 2. 监听全局事件（示例：监听新消息事件）
        eventBus.on(
          'theme:change',
          (newTheme: 'light' | 'dark' | 'auto') => {
            console.log('主题切换为：', newTheme);
          },
        );

        // 3. 全局注册插件通用组件（可选）
        // app.component('MessageBubble', () => import('./components/MessageBubble.vue'));
        // app.component('MessageInput', () => import('./components/MessageInput.vue'));

      } catch (error) {
        console.error('❌ mine插件安装失败：', error);
        throw error; // 抛出错误，让插件管理器感知
      }
    },
    // 插件激活时执行
    activate() {
      eventBus.emit('mine:activate');
    },
    // 插件失活时执行
    deactivate() {
      eventBus.emit('mine:deactivate');
    },
  },
  // 依赖：无（如需依赖其他插件，添加到这里）
  dependencies: [],
};

// 注册到插件管理器（确保在main.ts执行前注册）
pluginManager.register(minePlugin);
