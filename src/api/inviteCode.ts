import request from '@/utils/request'

// 获取当前邀请码（管理员）
export const getInviteCode = () => {
  return request.get<string>('/user/invite-code')
}

// 设置新邀请码（管理员）
export const setInviteCode = (code: string) => {
  return request.post('/user/invite-code', null, {
    params: { code }
  })
}

// 作废当前邀请码（管理员）
export const invalidateInviteCode = (reason: string) => {
  return request.delete('/user/invite-code', {
    params: { reason }
  })
}

// 强制下线用户（管理员）
export const forceLogoutUser = (id: string) => {
  return request.post(`/user/${id}/force-logout`)
}

// 获取禁言状态（管理员）
export const getGlobalMuteStatus = () => {
  return request.get<boolean>('/user/global-mute')
}

// 设置禁言状态（管理员）
export const setGlobalMuteStatus = (mute: boolean) => {
  return request.post('/user/global-mute', null, {
    params: { mute }
  })
}
