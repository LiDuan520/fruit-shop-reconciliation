<template>
  <div class="dashboard">
    <section class="metrics-grid">
      <n-card v-for="item in metrics" :key="item.label" size="small">
        <div class="metric">
          <div class="metric-icon" :class="item.tone">
            <n-icon :component="item.icon" />
          </div>
          <div>
            <div class="metric-label">{{ item.label }}</div>
            <div class="metric-value">{{ item.value }}</div>
          </div>
        </div>
      </n-card>
    </section>

    <section class="main-grid">
      <n-card title="今日待办" class="panel">
        <n-timeline>
          <n-timeline-item
            v-for="task in tasks"
            :key="task.title"
            :type="task.type"
            :title="task.title"
            :content="task.content"
            :time="task.time"
          />
        </n-timeline>
      </n-card>

      <n-card title="配送进度" class="panel">
        <div class="delivery-list">
          <div v-for="row in deliveries" :key="row.customer" class="delivery-row">
            <div>
              <strong>{{ row.customer }}</strong>
              <span>{{ row.address }}</span>
            </div>
            <n-tag :type="row.type" round>{{ row.status }}</n-tag>
          </div>
        </div>
      </n-card>
    </section>

    <section class="main-grid">
      <n-card title="快捷入口" class="panel">
        <div class="quick-actions">
          <n-button v-for="action in actions" :key="action.label" secondary>
            <template #icon>
              <n-icon :component="action.icon" />
            </template>
            {{ action.label }}
          </n-button>
        </div>
      </n-card>

      <n-card title="系统状态" class="panel">
        <div class="status-list">
          <div class="status-row">
            <span>API 服务</span>
            <n-tag :type="apiOk ? 'success' : 'warning'" round>
              {{ apiOk ? '正常' : '待连接' }}
            </n-tag>
          </div>
          <div class="status-row">
            <span>当前版本</span>
            <strong>V0 骨架</strong>
          </div>
        </div>
      </n-card>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  ClipboardCheck,
  ClipboardList,
  Coins,
  PackageCheck,
  ReceiptText,
  Truck,
} from 'lucide-vue-next'
import { onMounted, ref } from 'vue'

import { apiClient } from '@/api/client'

const apiOk = ref(false)

const metrics = [
  { label: '今日订单', value: '18', icon: ClipboardList, tone: 'green' },
  { label: '待处理改单', value: '3', icon: ClipboardCheck, tone: 'amber' },
  { label: '待配送', value: '7', icon: Truck, tone: 'blue' },
  { label: '本周应收', value: '¥12,860', icon: Coins, tone: 'slate' },
]

const tasks = [
  { title: '维护今日价', content: '还有 4 个常用商品未维护价格', time: '07:20', type: 'warning' },
  { title: '处理改单', content: '老街小馆新增土豆 10 斤', time: '08:05', type: 'info' },
  { title: '确认缺货', content: '香菜库存不足，需要录入实际发货', time: '08:30', type: 'error' },
  { title: '生成拣货单', content: '上午配送批次可导出', time: '09:00', type: 'success' },
] as const

const deliveries = [
  { customer: '老街小馆', address: '建设路 18 号', status: '备货中', type: 'warning' },
  { customer: '川味饭庄', address: '人民路 66 号', status: '待配送', type: 'info' },
  { customer: '晨光食堂', address: '园区三号门', status: '已签收', type: 'success' },
] as const

const actions = [
  { label: '新建订单', icon: ClipboardList },
  { label: '导出拣货单', icon: PackageCheck },
  { label: '上传签收', icon: Truck },
  { label: '生成对账单', icon: ReceiptText },
]

onMounted(async () => {
  try {
    await apiClient.get('/health')
    apiOk.value = true
  } catch {
    apiOk.value = false
  }
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.metrics-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.metric {
  align-items: center;
  display: flex;
  gap: 14px;
}

.metric-icon {
  align-items: center;
  border-radius: 8px;
  display: flex;
  font-size: 22px;
  height: 46px;
  justify-content: center;
  width: 46px;
}

.metric-icon.green {
  background: #e6f5ee;
  color: #1f8a70;
}

.metric-icon.amber {
  background: #fff4dc;
  color: #b7791f;
}

.metric-icon.blue {
  background: #e8f2ff;
  color: #2b6cb0;
}

.metric-icon.slate {
  background: #edf1f2;
  color: #42535a;
}

.metric-label {
  color: #6d7a74;
  font-size: 13px;
}

.metric-value {
  color: #17201d;
  font-size: 26px;
  font-weight: 750;
  line-height: 1.1;
  margin-top: 4px;
}

.main-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: 1.3fr 1fr;
}

.panel {
  min-height: 230px;
}

.delivery-list,
.status-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.delivery-row,
.status-row {
  align-items: center;
  background: #f8faf9;
  border: 1px solid #e4ebe7;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  padding: 12px;
}

.delivery-row div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.delivery-row span,
.status-row span {
  color: #6d7a74;
  font-size: 13px;
}

.quick-actions {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (max-width: 1060px) {
  .metrics-grid,
  .main-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .metrics-grid,
  .main-grid,
  .quick-actions {
    grid-template-columns: 1fr;
  }
}
</style>
