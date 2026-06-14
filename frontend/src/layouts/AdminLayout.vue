<template>
  <n-layout class="app-shell" has-sider>
    <n-layout-sider
      bordered
      collapse-mode="width"
      :collapsed-width="72"
      :width="240"
      :native-scrollbar="false"
      class="sidebar"
    >
      <div class="brand">
        <div class="brand-mark">蔬</div>
        <div class="brand-copy">
          <strong>蔬果店</strong>
          <span>订单配送对账</span>
        </div>
      </div>

      <n-menu :value="activeKey" :options="menuOptions" @update:value="handleMenu" />
    </n-layout-sider>

    <n-layout>
      <n-layout-header bordered class="topbar">
        <div>
          <div class="page-kicker">MVP 工作台</div>
          <h1>{{ pageTitle }}</h1>
        </div>
        <div class="topbar-actions">
          <n-button secondary>
            <template #icon>
              <n-icon><RefreshCw /></n-icon>
            </template>
            刷新
          </n-button>
          <n-button type="primary">
            <template #icon>
              <n-icon><Plus /></n-icon>
            </template>
            新建订单
          </n-button>
        </div>
      </n-layout-header>

      <n-layout-content class="content">
        <router-view />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import {
  ClipboardList,
  Coins,
  Home,
  Package,
  Plus,
  RefreshCw,
  Route,
  Scale,
  Truck,
  Users,
} from 'lucide-vue-next'
import type { MenuOption } from 'naive-ui'
import { NIcon } from 'naive-ui'
import type { Component } from 'vue'
import { computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const renderIcon = (icon: Component) => () => h(NIcon, null, { default: () => h(icon) })

const menuOptions: MenuOption[] = [
  { label: '今日看板', key: '/', icon: renderIcon(Home) },
  { label: '客户管理', key: '/customers', icon: renderIcon(Users) },
  { label: '商品管理', key: '/products', icon: renderIcon(Package) },
  { label: '今日价', key: '/prices', icon: renderIcon(Coins) },
  { label: '订单中心', key: '/orders', icon: renderIcon(ClipboardList) },
  { label: '汇总拣货', key: '/picking', icon: renderIcon(Scale) },
  { label: '配送签收', key: '/delivery', icon: renderIcon(Truck) },
  { label: '周结对账', key: '/statements', icon: renderIcon(Route) },
]

const activeKey = computed(() => route.path)
const pageTitle = computed(() => (route.meta.title as string | undefined) ?? '今日看板')

function handleMenu(key: string) {
  router.push(key)
}
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
}

.sidebar {
  background: #fbfcfb;
}

.brand {
  align-items: center;
  display: flex;
  gap: 12px;
  height: 72px;
  padding: 0 18px;
}

.brand-mark {
  align-items: center;
  background: #1f8a70;
  border-radius: 8px;
  color: #fff;
  display: flex;
  font-size: 20px;
  font-weight: 800;
  height: 38px;
  justify-content: center;
  width: 38px;
}

.brand-copy {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.brand-copy strong {
  color: #17201d;
  font-size: 16px;
}

.brand-copy span {
  color: #708078;
  font-size: 12px;
  margin-top: 4px;
}

.topbar {
  align-items: center;
  background: #fff;
  display: flex;
  justify-content: space-between;
  min-height: 76px;
  padding: 0 28px;
}

.page-kicker {
  color: #6f7b75;
  font-size: 13px;
  margin-bottom: 4px;
}

.topbar h1 {
  color: #17201d;
  font-size: 22px;
  line-height: 1.2;
  margin: 0;
}

.topbar-actions {
  display: flex;
  gap: 10px;
}

.content {
  background: #f3f6f4;
  min-height: calc(100vh - 76px);
  padding: 24px;
}

@media (max-width: 760px) {
  .app-shell {
    display: block;
  }

  .topbar {
    align-items: flex-start;
    flex-direction: column;
    gap: 14px;
    padding: 18px;
  }

  .topbar-actions {
    width: 100%;
  }

  .topbar-actions :deep(.n-button) {
    flex: 1;
  }

  .content {
    padding: 16px;
  }
}
</style>
