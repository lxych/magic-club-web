import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, getUserInfo } from '@/api/user'
import type { UserInfo } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(null)
  
  // Getters
  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => userInfo.value?.role === 'ADMIN')
  
  // Actions
  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }
  
  const clearToken = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
  }
  
  const login = async (username: string, password: string) => {
    const res = await loginApi(username, password)
    setToken(res.token)
    userInfo.value = res.userInfo
    return res
  }
  
  const fetchUserInfo = async () => {
    if (!token.value) return null
    const res = await getUserInfo()
    userInfo.value = res
    return res
  }
  
  const logout = () => {
    clearToken()
  }
  
  return {
    token,
    userInfo,
    isLoggedIn,
    isAdmin,
    login,
    logout,
    fetchUserInfo,
    setToken,
    clearToken
  }
})
