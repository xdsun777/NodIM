// src/core/plugin/index.ts
import { App } from 'vue';
import type { AppPlugin, PluginManagerOptions, PluginMeta } from './type';

export class PluginManager {
  private app: App | null = null; // Vue实例
  private plugins: Map<string, AppPlugin> = new Map(); // 已注册插件
  private activePlugins: Set<string> = new Set(); // 激活中的插件
  private options: PluginManagerOptions;

  constructor(options: PluginManagerOptions = {}) {
    this.options = {
      autoRegister: true,
      ...options
    };
    // 初始化传入的插件
    if (this.options.plugins) {
      this.options.plugins.forEach(plugin => this.register(plugin));
    }
  }

  // 关联Vue实例
  setApp(app: App) {
    this.app = app;
    return this;
  }

  // 注册插件（仅存入管理器，未安装）
  register(plugin: AppPlugin): boolean {
    const pluginName = plugin.meta.name;
    if (this.plugins.has(pluginName)) {
      console.warn(`插件${pluginName}已存在，跳过注册`);
      return false;
    }
    // 检查依赖
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.plugins.has(dep)) {
          console.error(`插件${pluginName}依赖${dep}，但该插件未注册`);
          return false;
        }
      }
    }
    this.plugins.set(pluginName, plugin);
    console.log(`插件${pluginName}注册成功`);
    // 自动注册模式下，若已关联Vue实例则直接安装
    if (this.options.autoRegister && this.app) {
      this.install(pluginName);
    }
    return true;
  }

  // 安装插件（执行install钩子，注册路由）
  install(pluginName: string): boolean {
    if (!this.app) {
      console.error('未关联Vue实例，无法安装插件');
      return false;
    }
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      console.error(`插件${pluginName}未注册，无法安装`);
      return false;
    }
    try {
      // 执行插件install钩子
      plugin.hooks.install(this.app!);
      // 标记为激活状态
      this.activePlugins.add(pluginName);
      console.log(`插件${pluginName}安装成功`);
      return true;
    } catch (e) {
      console.error(`插件${pluginName}安装失败`, e);
      return false;
    }
  }

  // 卸载插件
  uninstall(pluginName: string): boolean {
    if (!this.app) return false;
    const plugin = this.plugins.get(pluginName);
    if (!plugin) return false;
    try {
      // 执行uninstall钩子（如有）
      plugin.hooks.uninstall?.(this.app!);
      // 移除激活状态
      this.activePlugins.delete(pluginName);
      console.log(`插件${pluginName}卸载成功`);
      return true;
    } catch (e) {
      console.error(`插件${pluginName}卸载失败`, e);
      return false;
    }
  }

  // 激活插件（执行activate钩子）
  activate(pluginName: string): boolean {
    const plugin = this.plugins.get(pluginName);
    if (!plugin || !this.activePlugins.has(pluginName)) return false;
    try {
      plugin.hooks.activate?.();
      console.log(`插件${pluginName}激活成功`);
      return true;
    } catch (e) {
      console.error(`插件${pluginName}激活失败`, e);
      return false;
    }
  }

  // 失活插件
  deactivate(pluginName: string): boolean {
    const plugin = this.plugins.get(pluginName);
    if (!plugin || !this.activePlugins.has(pluginName)) return false;
    try {
      plugin.hooks.deactivate?.();
      console.log(`插件${pluginName}失活成功`);
      return true;
    } catch (e) {
      console.error(`插件${pluginName}失活失败`, e);
      return false;
    }
  }

  // 获取所有已注册插件
  getPlugins(): AppPlugin[] {
    return Array.from(this.plugins.values());
  }

  // 获取插件元信息
  getPluginMeta(pluginName: string): PluginMeta | null {
    return this.plugins.get(pluginName)?.meta || null;
  }

  // 获取激活中的插件
  getActivePlugins(): string[] {
    return Array.from(this.activePlugins);
  }
}

// 创建全局插件管理器实例
export const pluginManager = new PluginManager();