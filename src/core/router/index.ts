// src/core/router/index.ts
import type { Router } from 'vue-router';
import type { PluginRouter } from '../plugin/type';

export class RouterManager {
  private router: Router | null = null;

  // 新增：缓存已注册的插件路由，避免重复注册
  private registeredPluginRoutes = new Set<string>();

  constructor(router?: Router) {
    if (router) {
      this.setRouter(router);
    }
  }

  setRouter(router: Router) {
    this.router = router;
    return this;
  }

  // 新增：预注册插件路由（同步执行，无延迟）
  preRegisterPluginRouter(pluginName: string, pluginRouter: PluginRouter) {
    if (!this.router) {
      console.error('未关联Vue Router实例，无法预注册插件路由');
      return;
    }
    if (this.registeredPluginRoutes.has(pluginName)) return;

    const { routes, prefix = `/${pluginName}` } = pluginRouter;
    const prefixedRoutes = routes.map((route) => ({
      ...route,
      path: `${prefix}${route.path}`,
      // 关键：提前加载组件（避免懒加载延迟）
      component:
        route.component ||
        (() =>
          import(
            `@/plugins/${pluginName}/pages/${route.name?.split('-')[1] || 'index'}.vue`
          )),
    }));

    prefixedRoutes.forEach((route) => {
      this.router!.addRoute(route);
    });
    this.registeredPluginRoutes.add(pluginName);
    console.log(`插件${pluginName}路由预注册成功：`, prefixedRoutes);
  }

  // 注册插件路由（自动添加前缀）
  registerPluginRouter(pluginName: string, pluginRouter: PluginRouter) {
    if (!this.router) {
      console.error('未关联Vue Router实例，无法注册插件路由');
      return;
    }
    const { routes, prefix = `/${pluginName}` } = pluginRouter;
    // 为插件路由添加统一前缀
    const prefixedRoutes = routes.map((route) => ({
      ...route,
      path: `${prefix}${route.path}`,
    }));
    // 动态添加路由
    prefixedRoutes.forEach((route) => {
      this.router!.addRoute(route);
    });
    console.log(`插件${pluginName}路由注册成功：`, prefixedRoutes);
  }

  // 移除插件路由（可选）
  removePluginRouter(pluginName: string, pluginRouter: PluginRouter) {
    if (!this.router) return;
    const { routes, prefix = `/${pluginName}` } = pluginRouter;
    routes.forEach((route) => {
      this.router!.removeRoute(`${prefix}${route.path}`);
    });
  }

  // 新增：初始化所有插件路由（页面刷新时调用）
  initAllPluginRoutes(plugins: Array<{ name: string; router?: PluginRouter }>) {
    plugins.forEach((plugin) => {
      if (plugin.router) {
        this.preRegisterPluginRouter(plugin.name, plugin.router);
      }
    });
  }
}

// 创建全局路由管理器实例
export const routerManager = new RouterManager();
