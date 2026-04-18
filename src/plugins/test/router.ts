// src/plugins/message/router.ts
import type { PluginRouter } from '@/core/plugin/type';


export const messageRouter: PluginRouter = {
  prefix: '/test',
  routes: [
    {
      path: '/', // test plugin-test-root
      name: 'test-index',
      component: () => import('./pages/indexPage.vue'),
    },
    {
      path: 'chat/:id', // 对应 /message/chat/:id (详情页)
      name: 'test-detail',
      component: () => import('./pages/detailPage.vue'),
    }
  ]
};