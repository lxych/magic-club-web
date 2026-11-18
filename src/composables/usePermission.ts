import { computed } from 'vue'
import { useUserStore } from '@/stores/user'

/**
 * 权限检测 composable
 */
export function usePermission() {
  const userStore = useUserStore()

  const permissions = computed(() => userStore.permissions)

  /**
   * 检查当前用户是否拥有指定权限
   */
  const hasPermission = (code: string): boolean => {
    return permissions.value.includes(code)
  }

  /**
   * 检查当前用户是否拥有任一权限（OR 逻辑）
   */
  const hasAnyPermission = (...codes: string[]): boolean => {
    return codes.some(code => permissions.value.includes(code))
  }

  /**
   * 检查当前用户是否拥有全部权限（AND 逻辑）
   */
  const hasAllPermissions = (...codes: string[]): boolean => {
    return codes.every(code => permissions.value.includes(code))
  }

  /**
   * 是否为管理员
   */
  const isAdmin = computed(() => userStore.userInfo?.role === 'ADMIN')

  /**
   * 是否为版主及以上（版主或管理员）
   */
  const isModeratorOrAbove = computed(() => {
    const role = userStore.userInfo?.role
    return role === 'ADMIN' || role === 'MODERATOR'
  })

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isModeratorOrAbove
  }
}
