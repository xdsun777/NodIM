// 全局样式
import './assets/base.css';
import '@/assets/iconfont/iconfont.css'
import '@fontsource/noto-sans-sc';

import IconFont from './components/common/IconFont.vue';



// src/main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import { pluginManager } from '@/core/plugin';
import { router } from '@/router';
import { eventBus } from '@/core/event';

import App from '@/App.vue';
import { useSystemInfoStore } from '@/stores/systemInfo';


// 导入插件（关键：确保插件被注册）
import '@/plugins/message';
import '@/plugins/contact';
import '@/plugins/test';

// 创建Vue实例
const app = createApp(App);



app.component('IconFont',IconFont)//.component('font-awesome-icon',FontAwesomeIcon)

// 安装Pinia（状态管理） Vue Router
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate)


app.use(pinia).use(router);

// 将Vue实例关联到插件管理器
pluginManager.setApp(app);

// 安装所有已注册的插件
pluginManager.getPlugins().forEach((plugin) => {
  pluginManager.install(plugin.meta.name);
});

// 全局挂载事件总线（可选）
app.config.globalProperties.$eventBus = eventBus;
app.config.globalProperties.$systemInfo = useSystemInfoStore();

// 优雅挂载：通过类选择器获取挂载点（替代硬编码 ID）
const mountPoint = document.querySelector('.app-mount-point');
if (mountPoint) {
  app.mount(mountPoint);
} else {
  console.error(
    '未找到应用挂载点，请检查 index.html 中的 .app-mount-point 容器',
  );
}

// 暴露实例
export { app, pinia, router };


