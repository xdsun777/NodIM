// 全局样式
import '@/style.css';

// src/main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from '@/App.vue';

import { router } from '@/router';
import { pluginManager } from '@/core/plugin';
import { eventBus } from '@/core/event';

// 导入消息插件（关键：确保插件被注册）
import '@/plugins/message';

// 创建Vue实例
const app = createApp(App);

// 安装Pinia（状态管理） Vue Router
const pinia = createPinia();
app.use(pinia).use(router);

// 将Vue实例关联到插件管理器
pluginManager.setApp(app);

// 安装所有已注册的插件
pluginManager.getPlugins().forEach((plugin) => {
  pluginManager.install(plugin.meta.name);
});

// 全局挂载事件总线（可选）
app.config.globalProperties.$eventBus = eventBus;

// 优雅挂载：通过类选择器获取挂载点（替代硬编码 ID）
const mountPoint = document.querySelector('.app-mount-point');
if (mountPoint) {
  app.mount(mountPoint);
} else {
  console.error(
    '未找到应用挂载点，请检查 index.html 中的 .app-mount-point 容器',
  );
}

// 暴露实例（可选）
export { app, pinia, router };
