// src/router.ts
import { createRouter, createWebHistory } from 'vue-router';

import { pluginManager } from './core/plugin';
import { routerManager } from './core/router';

const routes = [
  {
    path: '/',
    name: 'root',
    redirect: '/message', // 默认跳转到消息插件
    // component: () => import('@/components/tests/Chat.vue'),
    meta: { title: '消息' },
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@/components/common/NotFound.vue'),
    meta: { title: '页面不存在' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
  },
];

// 创建路由实例（保留 History 模式）
export const router = createRouter({
  history: createWebHistory(),
  routes,
  // 可选：禁用滚动行为，避免刷新时滚动异常
  // scrollBehavior: () => ({ top: 0 })
  // 路由切换时滚动到顶部（适配移动端）
  scrollBehavior: (to, from, savedPosition) => {
    return savedPosition || { top: 0 };
  },
});

// 关联路由管理器
routerManager.setRouter(router);

// 4. 预注册所有插件路由（解决刷新404问题）
//  提前导入所有插件的路由配置，确保刷新时路由已存在
import { messagePlugin } from '@/plugins/message';
import { contactPlugin } from '@/plugins/contact'
// import { settingsPlugin } from '@/plugins/settings'
// import { minePlugin } from '@/plugins/mine'
// 批量预注册插件路由
// const allPlugins = [messagePlugin, contactPlugin, settingsPlugin, minePlugin]
const allPlugins = [messagePlugin,contactPlugin];
allPlugins.forEach((plugin) => {
  if (plugin.router) {
    routerManager.preRegisterPluginRouter(plugin.meta.name, plugin.router);
  }
});

// 路由守卫：插件激活/失活
router.afterEach((to) => {
  const activePlugins = pluginManager.getActivePlugins();
  // 失活所有插件
  activePlugins.forEach((pluginName) => pluginManager.deactivate(pluginName));

  // 激活匹配的插件
  const pluginNames = pluginManager.getPlugins().map((p) => p.meta.name);
  for (const name of pluginNames) {
    if (to.path.startsWith(`/${name}`)) {
      pluginManager.activate(name);
      break;
    }
  }
  // 5.3 动态设置页面标题（适配移动端状态栏）
  if (to.meta.title) {
    document.title = `${to.meta.title} - 你的App名称`;
  }
});

// 6. 路由错误捕获（适配Tauri，避免崩溃）
router.onError((error) => {
  console.error('路由错误：', error);
  // 路由加载失败时跳404
  if (error.message.includes('Failed to fetch dynamically imported module')) {
    router.push('/404');
  }
});
