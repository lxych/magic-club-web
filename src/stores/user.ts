import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, getUserInfo } from '@/api/user'
import type { UserInfo } from '@/api/user'

/**
 * 角色默认权限（仅在后端没有返回 permissions 时兜底使用）
 * 真正的权限判断以服务端 RolePermissions.getUserPermissions 为准
 */
const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: [
    'forum:create', 'forum:delete', 'forum:top', 'forum:essence',
    'resource:upload', 'resource:audit', 'resource:delete',
    'announcement:send', 'announcement:recall',
    'user:manage', 'user:viewAll',
    'system:config', 'log:view', 'role:manage'
  ],
  MODERATOR: [
    // 成员基础能力
    'forum:create', 'resource:upload',
    // 论坛管理
    'forum:delete', 'forum:top', 'forum:essence',
    // 资源审核与清理
    'resource:audit', 'resource:delete',
    // 公告
    'announcement:send', 'announcement:recall',
    // 花名册
    'user:viewAll'
  ],
  MEMBER: ['forum:create', 'resource:upload'],
  ALUMNI: []
}

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(null)
  const permissions = ref<string[]>([])
  /** 本次会话是否已经从服务端拉过权限，用于路由守卫只拉一次 */
  const permsLoaded = ref(false)
  /** 上次拉取权限的时间戳，用于按 TTL 刷新 */
  const permsLoadedAt = ref(0)

  // Getters
  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => userInfo.value?.role === 'ADMIN')
  const isModerator = computed(() => userInfo.value?.role === 'MODERATOR')

  const hasPermission = (code: string): boolean => permissions.value.includes(code)

  const setToken = (newToken: string) => {
    token.value = newToken
    // iOS Safari 隐私模式 / 存储满时 setItem 会抛异常，
    // 不能让存储失败打断登录流程（否则表现为"登录了但不跳转"）
    try {
      localStorage.setItem('token', newToken)
    } catch (e) {
      console.warn('token 写入本地存储失败', e)
    }
  }

  /** 统一写入权限：以服务端返回为准，返回空数组也如实写入 */
  const applyPermissions = (list: unknown, role?: string) => {
    if (Array.isArray(list)) {
      permissions.value = list as string[]
    } else {
      permissions.value = ROLE_PERMISSIONS[role || ''] || []
    }
    try {
      localStorage.setItem('permissions', JSON.stringify(permissions.value))
    } catch (e) {
      console.warn('权限写入本地存储失败', e)
    }
    permsLoaded.value = true
    permsLoadedAt.value = Date.now()
  }

  const clearToken = () => {
    token.value = ''
    userInfo.value = null
    permissions.value = []
    permsLoaded.value = false
    localStorage.removeItem('token')
    localStorage.removeItem('permissions')
  }

  const login = async (username: string, password: string) => {
    const res = await loginApi(username, password)
    setToken(res.token)
    userInfo.value = res.userInfo
    applyPermissions(res.permissions, res.userInfo?.role)
    return res
  }

  /**
   * 拉取当前用户信息与最新权限
   * 注意：权限以服务端为准，管理员改完权限后前端刷新即可生效，无需重新登录
   */
  const fetchUserInfo = async () => {
    if (!token.value) {
      permsLoaded.value = true
      return null
    }
    try {
      const res: any = await getUserInfo()
      const userInfoData = res?.userInfo || res
      if (userInfoData) {
        userInfo.value = userInfoData
      }
      applyPermissions(res?.permissions, userInfoData?.role)
      return userInfo.value
    } catch {
      // 失败也要标记，避免路由守卫反复请求
      permsLoaded.value = true
      return null
    }
  }

  const loadPermissionsFromStorage = () => {
    try {
      const stored = localStorage.getItem('permissions')
      if (stored) {
        permissions.value = JSON.parse(stored)
      }
    } catch {
      // ignore
    }
  }

  const logout = () => {
    clearToken()
  }

  // 初始化时先从本地缓存恢复，保证首屏不闪；真实数据由 fetchUserInfo 覆盖
  loadPermissionsFromStorage()

  return {
    token,
    userInfo,
    permissions,
    permsLoaded,
    permsLoadedAt,
    isLoggedIn,
    isAdmin,
    isModerator,
    hasPermission,
    login,
    logout,
    fetchUserInfo,
    setToken,
    clearToken,
    loadPermissionsFromStorage
  }
})
