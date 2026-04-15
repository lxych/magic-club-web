import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // 保留手动设置的 Content-Type
    if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json'
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const { data } = response
    
    // 后端统一返回格式: { code, message, data }
    // 注意：后端配置 write-numbers-as-strings，code 可能是字符串
    if (data.code === 200 || data.code === '200') {
      return data.data
    }
    
    // 业务错误
    ElMessage.error(data.message || '请求失败')
    return Promise.reject(new Error(data.message))
  },
  (error) => {
    const { response } = error
    
    if (response?.status === 401) {
      ElMessage.error('登录已过期，请重新登录')
      localStorage.removeItem('token')
      router.push('/login')
    } else {
      ElMessage.error(response?.data?.message || '网络错误，请稍后重试')
    }
    
    return Promise.reject(error)
  }
)

export default request
