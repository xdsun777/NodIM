import { h, resolveComponent } from 'vue'; // 需引入 h 函数
import type { Router, RouteRecordRaw } from 'vue-router';
import type { PluginRouter } from '../plugin/type';

export class RouterManager {
  private router: Router | null = null;
  private registeredPluginRoutes = new Set<string>();
  private defaultParentName: string = 'basic-layout'; // 指定父路由名称


  setRouter(router: Router) {
    this.router = router;
    return this;
  }
  // 可选：允许配置父路由名称
  setDefaultParentName(name: string) {
    this.defaultParentName = name;
    return this;
  }
  setPluginRouterName(pluginName: string) {
    return `plugin-${pluginName}-root`
  }



  // 修改：支持嵌套结构的路由注册
  preRegisterPluginRouter(pluginName: string, pluginRouter: PluginRouter) {
    if (!this.router) {
      console.error('[RouterManager] Router 未初始化');
      return;
    }
    if (this.registeredPluginRoutes.has(pluginName)) {
      console.warn(`[RouterManager] 插件 ${pluginName} 的路由已注册，跳过`);
      return;
    }
    const pluginRouterRootName = this.setPluginRouterName(pluginName);


    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { routes, prefix = `/${pluginName}`, parentName } = pluginRouter;
    const targetParentName = parentName || this.defaultParentName;

    // 验证父路由是否存在
    const parentRoute = this.router.getRoutes().find(r => r.name === targetParentName);
    if (!parentRoute) {
      console.error(`[RouterManager] 父路由 "${targetParentName}" 不存在，插件 ${pluginName} 路由注册失败`);
      return;
    }


    // 1. 核心修改：创建一个插件根节点，将插件所有路由存入 children
    const pluginRootRoute: RouteRecordRaw = {
      path: pluginName,
      name: pluginRouterRootName,
      // 默认尝试加载插件目录下的 Layout.vue 作为嵌套容器
      // 如果不存在，则使用一个简单的 router-view 占位
      component: () =>
        import(`@/plugins/${pluginName}/pages/LayoutView.vue`).catch(() => ({
          name: 'PluginRootPlaceholder',
          render: () => h(resolveComponent('router-view'))
        })),
      children: routes, // 保持原始的嵌套树状结构
    };

    // 2. 只需要 addRoute 一次，Vue Router 会自动递归处理 children
    this.router.addRoute(targetParentName, pluginRootRoute);

    this.registeredPluginRoutes.add(pluginName);
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