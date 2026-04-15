import { h, resolveComponent } from 'vue'; // 需引入 h 函数
import type { Router, RouteRecordRaw } from 'vue-router';
import type { PluginRouter } from '../plugin/type';

export class RouterManager {
  private router: Router | null = null;
  private registeredPluginRoutes = new Set<string>();

  setRouter(router: Router) {
    this.router = router;
    return this;
  }

  // 修改：支持嵌套结构的路由注册
  preRegisterPluginRouter(pluginName: string, pluginRouter: PluginRouter) {
    if (!this.router) return;
    if (this.registeredPluginRoutes.has(pluginName)) return;

    const { routes, prefix = `/${pluginName}` } = pluginRouter;

    // 1. 核心修改：创建一个插件根节点，将插件所有路由存入 children
    const pluginRootRoute: RouteRecordRaw = {
      path: prefix,
      name: `plugin-${pluginName}-root`,
      // 默认尝试加载插件目录下的 Layout.vue 作为嵌套容器
      // 如果不存在，则使用一个简单的 router-view 占位
      component: () => 
        import(`@/plugins/${pluginName}/pages/Layout.vue`).catch(() => ({
          name: 'PluginRootPlaceholder',
          render: () => h(resolveComponent('router-view'))
        })),
      children: routes, // 保持原始的嵌套树状结构
    };

    // 2. 只需要 addRoute 一次，Vue Router 会自动递归处理 children
    this.router.addRoute(pluginRootRoute);
    
    this.registeredPluginRoutes.add(pluginName);
    console.log(`插件${pluginName}嵌套路由挂载成功`);
  }

  // 同步修改 registerPluginRouter 逻辑
  registerPluginRouter(pluginName: string, pluginRouter: PluginRouter) {
    this.preRegisterPluginRouter(pluginName, pluginRouter);
  }

  // 移除路由时仅需移除根节点
  removePluginRouter(pluginName: string) {
    if (!this.router) return;
    this.router.removeRoute(`plugin-${pluginName}-root`);
    this.registeredPluginRoutes.delete(pluginName);
  }

  initAllPluginRoutes(plugins: Array<{ name: string; router?: PluginRouter }>) {
    plugins.forEach((plugin) => {
      if (plugin.router) this.preRegisterPluginRouter(plugin.name, plugin.router);
    });
  }
}

export const routerManager = new RouterManager();