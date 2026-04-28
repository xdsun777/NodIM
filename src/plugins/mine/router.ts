// src/plugins/mine/router.ts
import type { PluginRouter } from '@/core/plugin/type';


export const mineRouter: PluginRouter = {
  prefix: '/mine',
  routes: [
    {
      path: '/', // plugin-mine-root
      name: 'mine-index',
      component: () => import('./pages/indexPage.vue'),
    },
  ]
};