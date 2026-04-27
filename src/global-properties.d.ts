// 备用写法（同时声明两个模块）
import type { AppConfigStore } from '@/stores/appConfig';

declare module 'vue' {
  interface ComponentCustomProperties {
    $appConfig: AppConfigStore;
  }
}
