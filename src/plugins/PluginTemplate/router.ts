// src/plugins/message/router.ts
import type { PluginRouter } from '@/core/plugin/type';


export const messageRouter: PluginRouter = {
  prefix: '/template',
  routes: [
    {
      path: '/', // test plugin-test-root
      name: 'template-index',
      component: () => import('./pages/indexPage.vue'),
    },
  ]
};