<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

onMounted(() => {
  // 如果已登录，获取最新用户信息
  if (userStore.isLoggedIn) {
    userStore.fetchUserInfo()
  }
})
</script>

<template>
  <div class="app-container">
    <!-- 页面内容 -->
    <router-view />

    <!-- 全局底部 -->
    <footer class="footer">
      <div class="footer-content">
        <span>© 2026 Magic Club 魔术社团管理系统</span>
        <span class="divider">|</span>
        <a href="https://beian.miit.gov.cn/" target="_blank">
          津ICP备2026004879号
        </a>
      </div>
    </footer>
  </div>
</template>

<style>
/* 基础字体 */
body {
  font-family: var(--mc-font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--mc-text-primary);
}

/* 整体布局 */
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 让页面内容撑满 */
.app-container > *:first-child {
  flex: 1;
}

/* Footer 样式 */
.footer {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-top: 1px solid var(--mc-border-light);
  text-align: center;
  padding: 20px 0;
  font-size: 13px;
  color: var(--mc-text-muted);
  backdrop-filter: blur(10px);
}

/* 内容横排 */
.footer-content {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

/* 分隔符 */
.footer .divider {
  color: var(--mc-border);
}

/* 链接样式 */
.footer a {
  color: var(--mc-text-muted);
  text-decoration: none;
  transition: color var(--mc-transition-fast);
}

.footer a:hover {
  color: var(--mc-primary);
  text-decoration: underline;
}
</style>