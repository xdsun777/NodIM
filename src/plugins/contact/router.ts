// src/plugins/contact/router.ts
import type { PluginRouter } from '@/core/plugin/type';


export const contactRouter: PluginRouter = {
  prefix: '/contact',
  routes: [
    {
      path: '/', //
      name: 'contact-index',
      component: () => import('./pages/indexPage.vue'),
    },
  ]
}