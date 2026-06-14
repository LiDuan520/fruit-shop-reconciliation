import { createRouter, createWebHistory } from 'vue-router'

import AdminLayout from '@/layouts/AdminLayout.vue'
import Dashboard from '@/pages/admin/Dashboard.vue'
import PlaceholderPage from '@/pages/PlaceholderPage.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: AdminLayout,
      children: [
        { path: '', name: 'dashboard', component: Dashboard },
        {
          path: 'customers',
          name: 'customers',
          component: PlaceholderPage,
          meta: { title: '客户管理', description: '维护饭店客户、联系人、地址和结算周期。' },
        },
        {
          path: 'products',
          name: 'products',
          component: PlaceholderPage,
          meta: { title: '商品管理', description: '维护商品分类、单位、上下架和排序。' },
        },
        {
          path: 'prices',
          name: 'prices',
          component: PlaceholderPage,
          meta: { title: '今日价', description: '按送达日期维护商品单价，并支持复制昨日价格。' },
        },
        {
          path: 'orders',
          name: 'orders',
          component: PlaceholderPage,
          meta: { title: '订单中心', description: '查看订单、改单审批、变更日志和最终发货。' },
        },
        {
          path: 'picking',
          name: 'picking',
          component: PlaceholderPage,
          meta: { title: '汇总拣货', description: '按客户或商品汇总当天订单，并导出 Excel。' },
        },
        {
          path: 'delivery',
          name: 'delivery',
          component: PlaceholderPage,
          meta: { title: '配送签收', description: '配送员上传签收照片并填写签收人。' },
        },
        {
          path: 'statements',
          name: 'statements',
          component: PlaceholderPage,
          meta: { title: '周结对账', description: '生成对账单、记录收款和欠款余额。' },
        },
      ],
    },
  ],
})

