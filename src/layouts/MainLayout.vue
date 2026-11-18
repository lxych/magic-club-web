<template>
  <el-container class="main-layout">
    <!-- 移动端遮罩 -->
    <div v-if="mobileMenuOpen" class="mobile-overlay" @click="mobileMenuOpen = false" />
    
    <!-- 侧边栏 -->
    <el-aside width="220px" class="sidebar" :class="{ 'sidebar-open': mobileMenuOpen }">
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
        @select="mobileMenuOpen = false"
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
        <div class="header-left">
          <span class="header-brand" @click="mobileMenuOpen = !mobileMenuOpen">🎩</span>
        </div>
        <div class="header-right">
          <!-- 消息中心铃铛 -->
          <el-badge v-if="unreadCount > 0" is-dot class="notification-bell">
            <el-button type="primary" link @click="router.push('/notifications')" class="bell-btn">
              <el-icon :size="20"><Bell /></el-icon>
            </el-button>
          </el-badge>
          <el-button v-else type="primary" link @click="router.push('/notifications')" class="bell-btn">
            <el-icon :size="20"><Bell /></el-icon>
          </el-button>
          <el-button type="primary" link @click="toggleDark()" class="bell-btn" :title="isDark ? '切换浅色模式' : '切换暗色模式'">
            <el-icon :size="20"><component :is="isDark ? Sunny : Moon" /></el-icon>
          </el-button>
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <router-link v-if="userStore.userInfo?.id" :to="`/user/${userStore.userInfo.id}`" class="avatar-link">
                <el-avatar :size="32" :src="userStore.userInfo?.avatar" />
              </router-link>
              <el-avatar v-else :size="32" />
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
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useDark, useToggle } from '@vueuse/core'
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
  Checked,
  Bell,
  Message,
  Moon,
  Sunny,
  List,
  Lock
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const mobileMenuOpen = ref(false)

// 移动端展开菜单时锁定页面滚动，避免背景跟着滑动
watch(mobileMenuOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})
onUnmounted(() => {
  document.body.style.overflow = ''
})

// 权限：直接从 localStorage 同步读取（在 computed 执行前就有值）
const localPerms = ref<string[]>((() => {
  try {
    const stored = localStorage.getItem('permissions')
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
})())

// 暗色模式
const isDark = useDark()
const toggleDark = useToggle(isDark)

// 未读消息数
const unreadCount = ref(0)

const fetchUnreadCount = async () => {
  const token = localStorage.getItem('token')
  if (!token) return
  try {
    const res = await fetch('/api/notification/unread-count', {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    unreadCount.value = data.data || 0
  } catch {
    // ignore
  }
}

// 路由变化时刷新未读数
import { watch } from 'vue'
watch(() => route.path, () => {
  fetchUnreadCount()
})

// 初始加载时获取未读数，且每30秒轮询一次
import { onMounted, onUnmounted } from 'vue'
onMounted(() => {
  fetchUnreadCount()
  const timer = setInterval(fetchUnreadCount, 30000)
  onUnmounted(() => {
    clearInterval(timer)
  })
})

// 权限实时性：切回标签页时刷新一次权限。
// 管理员在后台给某人授权后，对方切回页面即可看到新菜单，不必重新登录。
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    userStore.fetchUserInfo()
  }
}
onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange)
})
onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

const menuItems = computed(() => {
  const routes = router.getRoutes().find(r => r.name === 'Layout')?.children || []
  return routes
    .filter(r => {
      if (r.meta?.hidden) return false
      // 页面可见性只看权限码，不看角色。
      // 角色只是权限码的默认来源，管理员仍可给单个成员额外授权。
      if (r.meta?.requiredPermission) {
        const perm = r.meta.requiredPermission as string
        return userStore.permissions.includes(perm)
      }
      return true
    })
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
/* 移动端侧边栏遮罩：点击空白处收起菜单
 * 之前模板里用了 .mobile-overlay 但没写样式，元素尺寸为 0，点了没反应 */
.mobile-overlay {
  position: fixed;
  inset: 0;
  z-index: 99; /* 必须低于 .sidebar 的 100，否则会挡住菜单本身 */
  background: rgba(0, 0, 0, 0.45);
  animation: overlay-fade-in 0.2s ease;
  /* 保证在部分浏览器上能接收点击（而不是穿透） */
  pointer-events: auto;
  -webkit-tap-highlight-color: transparent;
}

@keyframes overlay-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 桌面端不存在抽屉，遮罩不需要出现 */
@media (min-width: 769px) {
  .mobile-overlay {
    display: none;
  }
}

.main-layout {
  height: 100vh;
  
  .sidebar {
    background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
    z-index: 100;
    transition: transform 0.3s ease;
    box-shadow: 2px 0 12px rgba(0, 0, 0, 0.1);
    /* 侧边栏自身不随页面滚动，菜单区独立滚动 */
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;

    .logo {
      height: 70px;
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: #fff;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);

      .el-icon {
        color: var(--mc-accent);
        filter: drop-shadow(0 0 8px rgba(246, 211, 101, 0.4));
      }

      .logo-text {
        font-size: 20px;
        font-weight: 700;
        letter-spacing: 1px;
        background: linear-gradient(135deg, #fff 0%, #e0e0ff 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
    }

    .sidebar-menu {
      border-right: none;
      padding: 12px 8px;
      /* 菜单过长时内部滚动，不撑破布局 */
      flex: 1 1 auto;
      overflow-y: auto;
      overflow-x: hidden;
      overscroll-behavior: contain;
      scrollbar-width: none;
      -ms-overflow-style: none;

      &::-webkit-scrollbar {
        width: 0;
        height: 0;
      }
      
      :deep(.el-menu-item) {
        height: 50px;
        line-height: 50px;
        margin-bottom: 4px;
        border-radius: 10px;
        transition: all 0.3s ease;
        
        &:hover {
          background: rgba(102, 126, 234, 0.15);
          color: #fff;
        }
        
        &.is-active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          font-weight: 600;
        }
      }
    }
  }
  
  .main-container {
    background: var(--mc-bg-secondary);
    
    .header {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      border-bottom: 1px solid var(--mc-border-light);
      padding: 0 24px;
      
      .header-left {
        display: none;
        align-items: center;
        gap: 8px;
        
        .header-brand {
          font-size: 18px;
        }
      }
      
      .header-right {
        display: flex;
        align-items: center;
        gap: 12px;

        .notification-bell {
          margin-right: 4px;

          .bell-btn {
            padding: 6px;
            color: var(--mc-text-secondary);
            font-size: 20px;
            transition: all 0.2s ease;

            &:hover {
              color: var(--mc-primary);
              background: rgba(102, 126, 234, 0.1);
              border-radius: 50%;
            }
          }
        }

        .hamburger {
          display: none !important;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 20px;
          transition: all 0.3s ease;
          background: var(--mc-bg-tertiary);
          
          &:hover {
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
          }
          
          .avatar-link {
            display: flex;
            align-items: center;
          }
          
          .username {
            font-size: 14px;
            color: var(--mc-text-primary);
            font-weight: 500;
          }
        }
      }
    }
    
    .main-content {
      padding: 24px;
      overflow-y: auto;
    }
  }
}
</style>

<style>
/* 移动端布局 - 非 scoped 确保生效 */
@media (max-width: 768px) {
  .main-layout .sidebar {
    position: fixed !important;
    left: 0 !important;
    top: 0 !important;
    bottom: 0 !important;
    z-index: 100 !important;
    transform: translateX(-100%) !important;
  }
  
  .main-layout .sidebar.sidebar-open {
    transform: translateX(0) !important;
  }
  
  .main-layout .header-left {
    display: flex !important;
    align-items: center;
  }
  
  .main-layout .header-brand {
    cursor: pointer;
    font-size: 22px;
  }
  
  .main-layout .hamburger {
    display: inline-flex !important;
  }
  
  .main-layout .main-content {
    padding: 12px !important;
  }
}

/* 暗色模式全局调整 */
html.dark {
  .main-layout {
    .main-container {
      background: #141414;
      
      .header {
        background: rgba(20, 20, 20, 0.95);
        border-bottom-color: rgba(255, 255, 255, 0.06);
      }
    }
  }
}
</style>
