// 备用写法（同时声明两个模块）
import type { SystemInfoStore } from '@/stores/systemInfo';

declare module 'vue' {
  interface ComponentCustomProperties {
    $systemInfo: SystemInfoStore;
  }
}
