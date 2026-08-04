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
/* 全局重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 基础字体 */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
  'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #333;
}

/* 整体布局（关键） */
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
  background: #f9fafc;
  border-top: 1px solid #eee;
  text-align: center;
  padding: 16px 0;
  font-size: 12px;
  color: #999;
}

/* 内容横排 */
.footer-content {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

/* 分隔符 */
.footer .divider {
  color: #ccc;
}

/* 链接样式 */
.footer a {
  color: #999;
  text-decoration: none;
}

.footer a:hover {
  color: #667eea;
}
</style>