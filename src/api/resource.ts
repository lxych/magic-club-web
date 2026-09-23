import request from '@/utils/request'

export interface ResourceFile {
  id: number
  name: string
  originalName: string
  description: string
  fileType: string
  fileSize: number
  fileSizeFormatted: string
  filePath: string
  fileUrl: string
  mimeType: string
  userId: number
  uploaderName: string
  downloadCount: number
  category: string
  categoryName: string
  isPublic: number
  status: number
  allowDownload: number
  createTime: string
  updateTime: string
}

export interface ResourceQuery {
  pageNum?: number
  pageSize?: number
  category?: string
  fileType?: string
  keyword?: string
}

// 上传文件
export const uploadFile = (file: File, description?: string, category?: string, fileName?: string) => {
  const formData = new FormData()
  formData.append('file', file)
  if (description) formData.append('description', description)
  if (category) formData.append('category', category)
  if (fileName) formData.append('fileName', fileName)
  return request.post('/resource/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// 删除文件
export const deleteFile = (id: number) => {
  return request.delete(`/resource/${id}`)
}

// 获取资源列表
export const getResourceList = (params: ResourceQuery) => {
  return request.get('/resource/list', { params })
}

// 获取资源详情
export const getResourceDetail = (id: number) => {
  return request.get(`/resource/${id}`)
}

// 下载文件
export const downloadFile = (id: number) => {
  window.open(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/resource/${id}/download`)
}

// 获取我的资源列表
export const getMyResources = (params: { pageNum?: number; pageSize?: number }) => {
  return request.get('/resource/my', { params })
}

// 审核资源
export const auditResource = (id: number, status: number) => {
  return request.post(`/resource/${id}/audit`, null, { params: { status } })
}

// 获取待审批资源列表
export const getPendingResources = (params: { pageNum?: number; pageSize?: number }) => {
  return request.get('/resource/pending', { params })
}

// 获取 STS Token（OSS 直传用）
export const getOssStsToken = () => {
  return request.get('/oss/sts-token')
}

// OSS 直传完成回调 → 创建资源记录
export const completeOssUpload = (params: {
  fileName: string
  ossUrl: string
  fileSize: number
  description?: string
  category?: string
}) => {
  return request.post('/resource/oss/complete', null, { params })
}
