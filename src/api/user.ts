import request from '@/utils/request'

export interface UserInfo {
  id: number
  username: string
  realName: string
  gender: number
  genderName: string
  studentNo: string
  enrollmentYear: number
  graduationYear: number
  phone: string
  email: string
  wechat: string
  department: string
  major: string
  avatar: string
  remark: string
  role: string
  roleName: string
  status: number
  statusName: string
  isGraduated: number
  createTime: string
  updateTime: string
}

export interface UserQuery {
  pageNum?: number
  pageSize?: number
  keyword?: string
}

export interface PageResult<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

// 登录
export const login = (username: string, password: string) => {
  return request.post('/user/login', { username, password })
}

// 注册
export const register = (data: Partial<UserInfo> & { password: string }) => {
  return request.post('/user/register', data)
}

// 获取当前用户信息
export const getUserInfo = () => {
  return request.get<UserInfo>('/user/info')
}

// 更新用户信息
export const updateUserInfo = (data: Partial<UserInfo>) => {
  return request.put('/user/update', data)
}

// 修改密码
export const changePassword = (oldPassword: string, newPassword: string) => {
  const formData = new URLSearchParams()
  formData.append('oldPassword', oldPassword)
  formData.append('newPassword', newPassword)
  return request.post('/user/change-password', formData.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })
}

// 获取用户列表
export const getUserList = (params: UserQuery) => {
  return request.get<PageResult<UserInfo>>('/user/list', { params })
}

// 获取毕业成员列表
export const getGraduatedUsers = (params: { pageNum?: number; pageSize?: number }) => {
  return request.get<PageResult<UserInfo>>('/user/graduated', { params })
}

// 上传头像
export const uploadAvatar = (avatarUrl: string) => {
  const formData = new URLSearchParams()
  formData.append('avatarUrl', avatarUrl)
  return request.post('/user/upload-avatar', formData.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })
}

// 标记用户为毕业
export const markAsGraduated = (id: string, graduationYear: number) => {
  return request.post(`/user/${id}/graduate`, null, {
    params: { graduationYear }
  })
}

// 更新毕业成员信息
export const updateGraduatedInfo = (id: string, graduationYear: number) => {
  return request.put(`/user/${id}/graduate`, null, {
    params: { graduationYear }
  })
}

// 取消毕业标记
export const cancelGraduated = (id: string) => {
  return request.delete(`/user/${id}/graduate`)
}
