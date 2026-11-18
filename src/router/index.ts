import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/auth.vue'),
      meta: { public: true }
    },
    {
      path: '/register',
      name: 'Register',
      redirect: '/login',
      meta: { public: true }
    },
    {
      path: '/',
      name: 'Layout',
      component: () => import('@/layouts/MainLayout.vue'),
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/dashboard/index.vue'),
          meta: { title: '首页', icon: 'Home' }
        },
        {
          path: 'forum',
          name: 'Forum',
          component: () => import('@/views/forum/index.vue'),
          meta: { title: '论坛', icon: 'ChatDotRound' }
        },
        {
          path: 'forum/post/:id',
          name: 'PostDetail',
          component: () => import('@/views/forum/detail.vue'),
          meta: { title: '帖子详情', hidden: true }
        },
        {
          path: 'resource',
          name: 'Resource',
          component: () => import('@/views/resource/index.vue'),
          meta: { title: '资源中心', icon: 'Folder' }
        },
        {
          path: 'memorial',
          name: 'Memorial',
          component: () => import('@/views/memorial/index.vue'),
          meta: { title: '纪念墙', icon: 'Trophy' }
        },
        {
          path: 'notifications',
          name: 'Notifications',
          component: () => import('@/views/notification/index.vue'),
          meta: { title: '消息中心', icon: 'Bell', hidden: true }
        },
        {
          path: 'profile',
          name: 'Profile',
          component: () => import('@/views/user/profile.vue'),
          meta: { title: '个人中心', icon: 'User', hidden: true }
        },
        {
          path: 'alumni',
          name: 'Alumni',
          component: () => import('@/views/user/alumni.vue'),
          meta: { title: '花名册', icon: 'UserFilled', requiredPermission: 'user:viewAll' }
        },
        {
          path: 'user/:id',
          name: 'UserDetail',
          component: () => import('@/views/user/detail.vue'),
          meta: { title: '用户详情', hidden: true }
        },
        {
          path: 'admin-guide',
          name: 'AdminGuide',
          component: () => import('@/views/admin/guide.vue'),
          meta: { 
            title: '管理员手册', 
            icon: 'Document',
            requiredPermission: 'system:config'
          }
        },
        {
          path: 'admin-resource-audit',
          name: 'ResourceAudit',
          component: () => import('@/views/admin/resource-audit.vue'),
          meta: {
            title: '资源审批',
            icon: 'Checked',
            requiredPermission: 'resource:audit'
          }
        },
        {
          path: 'admin-announce',
          name: 'AdminAnnounce',
          component: () => import('@/views/admin/announce.vue'),
          meta: {
            title: '发送公告',
            icon: 'Message',
            requiredPermission: 'announcement:send'
          }
        },
        {
          path: 'admin-operation-log',
          name: 'OperationLog',
          component: () => import('@/views/admin/operation-log.vue'),
          meta: {
            title: '操作日志',
            icon: 'List',
            requiredPermission: 'log:view'
          }
        },
        {
          path: 'admin-role-manage',
          name: 'RoleManage',
          component: () => import('@/views/admin/role-manage.vue'),
          meta: {
            title: '权限管理',
            icon: 'Lock',
            requiredPermission: 'role:manage'
          }
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/error/404.vue')
    }
  ]
})

// 路由守卫
// 说明：页面可见性完全由「权限码」决定，不再把角色写死成 ADMIN 判断。
// 这样管理员在权限管理页给某个成员单独授权后，对方刷新页面即可看到对应菜单。
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()

  if (!to.meta.public && !userStore.isLoggedIn) {
    next('/login')
    return
  }

  if (to.path === '/login' && userStore.isLoggedIn) {
    next('/')
    return
  }

  // 权限以服务端为准：首次进入必拉；之后超过 30 秒再拉一次，
  // 这样管理员授权后，对方换个页面（或切回标签页）就能看到新菜单，无需重新登录
  const PERM_TTL = 30 * 1000
  if (
    userStore.isLoggedIn &&
    (!userStore.permsLoaded || Date.now() - userStore.permsLoadedAt > PERM_TTL)
  ) {
    await userStore.fetchUserInfo()
  }

  const requiredPerm = to.meta.requiredPermission as string | undefined
  if (requiredPerm && !userStore.permissions.includes(requiredPerm)) {
    next('/dashboard')
    return
  }

  next()
})

export default router
