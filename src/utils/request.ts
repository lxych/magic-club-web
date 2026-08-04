import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { useUserStore } from '@/stores/user'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json'
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 统一处理被踢下线
const handleForceLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  const userStore = useUserStore()
  userStore.token = ''
  userStore.userInfo = null
  ElMessage.error('账号已在其他设备登录或被管理员强制下线')
  router.replace('/login')
}

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const { data } = response
    
    // 业务 401：被踢下线
    if (data.code === 401 || data.code === '401') {
      handleForceLogout()
      return Promise.reject(new Error(data.message || '登录已过期'))
    }

    if (data.code === 200 || data.code === '200') {
      return data.data
    }
    
    ElMessage.error(data.message || '请求失败')
    return Promise.reject(new Error(data.message))
  },
  (error) => {
    const { response } = error
    
    // HTTP 401
    if (response?.status === 401) {
      handleForceLogout()
    } else {
      ElMessage.error(response?.data?.message || '网络错误，请稍后重试')
    }
    
    return Promise.reject(error)
  }
)

export default request
