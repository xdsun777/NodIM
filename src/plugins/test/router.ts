// src/plugins/message/router.ts
import type { PluginRouter } from '@/core/plugin/type';


export const messageRouter: PluginRouter = {
  prefix: '/test',
  routes: [
    {
      path: '', // 对应 /message (列表页)
      name: 'test-index',
      component: () => import('./pages/index.vue'),
    },
    {
      path: 'chat/:id', // 对应 /message/chat/:id (详情页)
      name: 'test-detail',
      component: () => import('./pages/detail.vue'),
    }
  ]
};