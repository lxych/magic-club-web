import request from '@/utils/request'

export interface OperationLog {
  id: string
  userId: string
  username: string
  action: string
  target: string
  targetId: string
  detail: string
  ip: string
  createTime: string
}

export interface OperationLogQuery {
  pageNum?: number
  pageSize?: number
  action?: string
  username?: string
  startDate?: string
  endDate?: string
}

export interface PageResult<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

// 操作类型映射
export const ACTION_LABELS: Record<string, string> = {
  GRADUATE: '设为毕业',
  CANCEL_GRADUATE: '取消毕业',
  FORCE_LOGOUT: '强制下线',
  CANCEL_USER: '注销用户',
  AUDIT_APPROVE: '审批通过',
  AUDIT_REJECT: '审批驳回',
  SEND_ANNOUNCEMENT: '发送公告',
  RECALL_ANNOUNCEMENT: '撤回公告',
  CREATE_RESOURCE: '上传资源',
  DELETE_RESOURCE: '删除资源',
  MUTE_USER: '全员禁言',
  UNMUTE_USER: '解除禁言',
  ROLE_CHANGE: '角色变更'
}

export const ACTION_COLORS: Record<string, string> = {
  GRADUATE: 'warning',
  CANCEL_GRADUATE: 'info',
  FORCE_LOGOUT: 'danger',
  CANCEL_USER: 'danger',
  AUDIT_APPROVE: 'success',
  AUDIT_REJECT: 'danger',
  SEND_ANNOUNCEMENT: 'primary',
  RECALL_ANNOUNCEMENT: 'warning',
  CREATE_RESOURCE: 'success',
  DELETE_RESOURCE: 'danger',
  MUTE_USER: 'warning',
  UNMUTE_USER: 'info',
  ROLE_CHANGE: 'primary'
}

// 获取操作日志列表
export const getOperationLogs = (params: OperationLogQuery) => {
  return request.get<PageResult<OperationLog>>('/admin/logs', { params })
}
