<template>
  <n-card class="placeholder">
    <div class="placeholder-copy">
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
    </div>
    <n-empty description="页面骨架已预留，下一步接入表格、表单和接口。" />
  </n-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const title = computed(() => (route.meta.title as string | undefined) ?? '功能页面')
const description = computed(() => (route.meta.description as string | undefined) ?? '待开发')
</script>

<style scoped>
.placeholder {
  min-height: 420px;
}

.placeholder-copy {
  margin-bottom: 40px;
}

.placeholder-copy h2 {
  color: #17201d;
  font-size: 22px;
  margin: 0 0 8px;
}

.placeholder-copy p {
  color: #6d7a74;
  font-size: 15px;
  margin: 0;
}
</style>

