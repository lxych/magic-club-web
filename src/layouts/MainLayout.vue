<template>
  <el-container class="main-layout">
    <!-- 侧边栏 -->
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon size="32"><MagicStick /></el-icon>
        <span class="logo-text">Magic Club</span>
      </div>
      <el-menu
        :default-active="$route.path"
        router
        class="sidebar-menu"
        background-color="#1a1a2e"
        text-color="#b8b9c0"
        active-text-color="#fff"
      >
        <el-menu-item
          v-for="item in menuItems"
          :key="item.path"
          :index="item.path"
          v-show="!item.hidden"
        >
          <el-icon>
            <component :is="item.icon" />
          </el-icon>
          <span>{{ item.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container class="main-container">
      <!-- 顶部导航 -->
      <el-header class="header">
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" :src="userStore.userInfo?.avatar" />
              <span class="username">{{ userStore.userInfo?.realName || userStore.userInfo?.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon> 个人中心
                </el-dropdown-item>
                <el-dropdown-item command="logout">
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 页面内容 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  Home,
  ChatDotRound,
  Folder,
  Trophy,
  UserFilled,
  ArrowDown,
  User,
  SwitchButton,
  MagicStick,
  Document,
  Checked
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const menuItems = computed(() => {
  const routes = router.getRoutes().find(r => r.name === 'Layout')?.children || []
  return routes
    .filter(r => !r.meta?.hidden && !(r.meta?.adminOnly && userStore.userInfo?.role !== 'ADMIN'))
    .map(r => ({
      path: `/${r.path}`,
      title: r.meta?.title as string,
      icon: r.meta?.icon as string,
      hidden: r.meta?.hidden
    }))
})

const handleCommand = (command: string) => {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'logout') {
    userStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped lang="scss">
.main-layout {
  height: 100vh;
  
  .sidebar {
    background: #1a1a2e;
    
    .logo {
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: #fff;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      
      .logo-text {
        font-size: 18px;
        font-weight: 600;
        letter-spacing: 1px;
      }
    }
    
    .sidebar-menu {
      border-right: none;
      
      :deep(.el-menu-item) {
        height: 50px;
        line-height: 50px;
        
        &:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        
        &.is-active {
          background: #667eea;
        }
      }
    }
  }
  
  .main-container {
    background: #f5f7fa;
    
    .header {
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      
      .header-right {
        .user-info {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background 0.2s;
          
          &:hover {
            background: #f5f7fa;
          }
          
          .username {
            font-size: 14px;
            color: #333;
          }
        }
      }
    }
    
    .main-content {
      padding: 20px;
      overflow-y: auto;
    }
  }
}
</style>
