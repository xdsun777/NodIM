// src/core/plugin/type.ts
import type { App } from 'vue';
import type { RouteRecordRaw } from 'vue-router';

// 插件元信息
export interface PluginMeta {
  name: string; // 插件唯一标识（如message/contact）
  title: string; // 插件名称
  icon?: string; // 插件图标
  order?: number; // 插件排序
}

// 插件生命周期钩子
export interface PluginHooks {
  // 插件安装时执行（核心钩子）
  install: (app: App, options?: object) => void;
  // 可选：插件卸载时执行
  uninstall?: (app: App) => void;
  // 可选：插件激活时执行（如路由进入插件页面）
  activate?: () => void;
  // 可选：插件失活时执行
  deactivate?: () => void;
}

// 插件路由配置
export interface PluginRouter {
  routes: RouteRecordRaw[]; // 插件自有路由
  prefix?: string; // 路由前缀（如/message）
  parentName?: string;
}

// 插件完整类型
export interface AppPlugin {
  meta: PluginMeta;
  router?: PluginRouter;
  hooks: PluginHooks;
  // 可选：插件依赖的其他插件
  dependencies?: string[];
}

// 插件管理器配置
export interface PluginManagerOptions {
  autoRegister?: boolean; // 是否自动注册插件
  plugins?: AppPlugin[]; // 初始插件列表
}
