import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, getUserInfo } from '@/api/user'
import type { UserInfo } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(null)
  const permissions = ref<string[]>([])

  // Getters
  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => userInfo.value?.role === 'ADMIN')
  const isModerator = computed(() => userInfo.value?.role === 'MODERATOR')

  // Actions
  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  const clearToken = () => {
    token.value = ''
    userInfo.value = null
    permissions.value = []
    localStorage.removeItem('token')
    localStorage.removeItem('permissions')
  }

  const login = async (username: string, password: string) => {
    const res = await loginApi(username, password)
    setToken(res.token)
    userInfo.value = res.userInfo
    // 保存权限列表
    if (res.permissions && res.permissions.length > 0) {
      permissions.value = res.permissions
      localStorage.setItem('permissions', JSON.stringify(res.permissions))
    } else {
      // 后端未返回权限，根据角色兜底
      autoFillPermissions(res.userInfo?.role || '')
    }
    return res
  }

  const fetchUserInfo = async () => {
    if (!token.value) return null
    try {
      const res = await getUserInfo()
      // 后端 /user/info 返回 { userInfo, permissions }
      const data = res as any
      
      // 提取 userInfo
      const userInfoData = data?.userInfo || data
      if (userInfoData) {
        userInfo.value = userInfoData
      }
      
      // 提取 permissions
      const permsData = data?.permissions
      if (permsData && Array.isArray(permsData) && permsData.length > 0) {
        permissions.value = permsData
        localStorage.setItem('permissions', JSON.stringify(permsData))
      } else {
        // 兜底：按角色填充
        autoFillPermissions(userInfoData?.role || '')
      }
      
      return userInfo.value
    } catch {
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

  // 根据角色自动填充权限（兜底）
  const ALL_PERMISSIONS = [
    'forum:create', 'forum:delete', 'forum:top', 'forum:essence',
    'resource:upload', 'resource:audit', 'resource:delete',
    'announcement:send', 'announcement:recall',
    'user:manage', 'user:viewAll',
    'system:config', 'log:view', 'role:manage'
  ]
  const MODERATOR_PERMISSIONS = [
    'forum:delete', 'forum:top', 'forum:essence',
    'resource:audit',
    'announcement:send', 'announcement:recall',
    'user:viewAll'
  ]
  const autoFillPermissions = (role: string) => {
    // 如果 localStorage 已有登录时保存的权限，直接使用
    const storedFromLogin = localStorage.getItem('permissions')
    if (storedFromLogin) {
      try {
        const parsed = JSON.parse(storedFromLogin)
        if (parsed.length > 0) {
          permissions.value = parsed
          return
        }
      } catch { /* ignore */ }
    }
    
    // 没有存储时，按角色给默认权限
    if (role === 'ADMIN') {
      permissions.value = ALL_PERMISSIONS
    } else if (role === 'MODERATOR') {
      permissions.value = MODERATOR_PERMISSIONS
    } else if (role === 'MEMBER') {
      permissions.value = ['forum:create', 'resource:upload']
    } else {
      permissions.value = []
    }
    localStorage.setItem('permissions', JSON.stringify(permissions.value))
  }

  const logout = () => {
    clearToken()
  }

  // 初始化时从 localStorage 恢复权限
  loadPermissionsFromStorage()

  return {
    token,
    userInfo,
    permissions,
    isLoggedIn,
    isAdmin,
    isModerator,
    login,
    logout,
    fetchUserInfo,
    setToken,
    clearToken,
    loadPermissionsFromStorage
  }
})
