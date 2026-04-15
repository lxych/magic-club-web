import request from '@/utils/request'

export interface Memorial {
  id: string
  title: string
  content: string
  eventDate: string
  year: number
  imageUrls: string
  createBy: string
  createByName: string
  displayOrder: number
  createTime: string
  updateTime: string
}

// 获取历史事件列表（按年份）
export const getMemorialsByYear = (year: number) => {
  return request.get<Memorial[]>(`/memorial/year/${year}`)
}

// 获取所有年份
export const getYears = () => {
  return request.get<number[]>('/memorial/years')
}

// 获取按年份分组的历史事件数据
export const getMemorialsTimeline = () => {
  return request.get<Record<number, Memorial[]>>('/memorial/timeline')
}

// 按多个年份查询
export const getMemorialsByYears = (years: number[]) => {
  return request.get<Record<number, Memorial[]>>('/memorial/timeline/batch', {
    params: { years: years.join(',') }
  })
}

// 创建历史事件
export const createMemorial = (data: Partial<Memorial>) => {
  return request.post('/memorial', data)
}

// 更新历史事件
export const updateMemorial = (id: string, data: Partial<Memorial>) => {
  return request.put(`/memorial/${id}`, data)
}

// 删除历史事件（仅管理员）
export const deleteMemorial = (id: string) => {
  return request.delete(`/memorial/${id}`)
}

// 上传纪念墙文件
export const uploadMemorialFiles = (files: File[]) => {
  const formData = new FormData()
  files.forEach(file => formData.append('files', file))
  return request.post<string[]>('/memorial/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
