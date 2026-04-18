// src/stores/systemInfo.ts
import { defineStore } from 'pinia';
import { platform, arch, version } from '@tauri-apps/plugin-os';

// 安全获取系统信息，失败时返回默认值 "test"
function safePlatform(): string {
  try {
    return platform() || 'test';
  } catch {
    return 'test';
  }
}

function safeArch(): string {
  try {
    return arch() || 'test';
  } catch {
    return 'test';
  }
}

function safeVersion(): string {
  try {
    return version() || 'test';
  } catch {
    return 'test';
  }
}

// ==================== Pinia Store ====================
export const useSystemInfoStore = defineStore('systemInfo', {
  state: () => ({
    platform: safePlatform(),
    arch: safeArch(),
    version: safeVersion(),
  }),
  getters: {
    isMobile(): boolean {
      return this.platform === 'android' || this.platform === 'ios';
    },
    isDesktop(): boolean {
      return (
        this.platform === 'windows' ||
        this.platform === 'macos' ||
        this.platform === 'linux'
      );
    },
  },
});

// ==================== 全局挂载工具 ====================
import type { App } from 'vue';

export function setupSystemInfo(app: App) {
  const store = useSystemInfoStore();
  app.config.globalProperties.$systemInfo = store;
}

export type SystemInfoStore = ReturnType<typeof useSystemInfoStore>;