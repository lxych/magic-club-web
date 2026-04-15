import request from '@/utils/request'

export interface Post {
  id: string
  title: string
  content: string
  userId: string
  authorName: string
  authorAvatar: string
  category: string
  categoryName: string
  viewCount: number
  likeCount: number
  replyCount: number
  isTop: number
  isEssence: number
  status: number
  createTime: string
  updateTime: string
}

export interface PostReply {
  id: string
  postId: string
  userId: string
  parentId: string | null
  targetUserId: string | null  // 被回复用户ID
  targetUserName: string       // 被回复用户昵称
  authorName: string
  authorAvatar: string
  content: string
  likeCount: number
  createTime: string
  // 子回复列表
  children?: PostReply[]
}

export interface PostQuery {
  pageNum?: number
  pageSize?: number
  category?: string
  keyword?: string
}

// 获取帖子列表
export const getPostList = (params: PostQuery) => {
  return request.get('/forum/posts', { params })
}

// 获取帖子详情
export const getPostDetail = (id: string | number) => {
  return request.get<{ post: Post; replies: PostReply[] }>(`/forum/post/${id}`)
}

// 创建帖子
export const createPost = (data: Partial<Post>) => {
  return request.post('/forum/post', data)
}

// 更新帖子
export const updatePost = (id: string | number, data: Partial<Post>) => {
  return request.put(`/forum/post/${id}`, data)
}

// 删除帖子
export const deletePost = (id: string | number) => {
  return request.delete(`/forum/post/${id}`)
}

// 点赞/取消点赞帖子
export const likePost = (id: string | number, isLike: boolean = true) => {
  return request.post(`/forum/post/${id}/like`, null, { params: { isLike } })
}

// 置顶/取消置顶
export const toggleTop = (id: string | number, isTop: boolean) => {
  return request.post(`/forum/post/${id}/top?isTop=${isTop}`)
}

// 设置精华/取消精华
export const toggleEssence = (id: string | number, isEssence: boolean) => {
  return request.post(`/forum/post/${id}/essence?isEssence=${isEssence}`)
}

// 获取用户帖子列表
export const getUserPosts = (userId: string | number, params: { pageNum?: number; pageSize?: number }) => {
  return request.get(`/forum/user/${userId}/posts`, { params })
}

// 创建回复
export const createReply = (
  postId: string | number, 
  content: string, 
  parentId?: string | number,
  targetUserId?: string | number
) => {
  return request.post(`/forum/post/${postId}/reply`, { content, parentId, targetUserId })
}

// 删除回复
export const deleteReply = (id: string | number) => {
  return request.delete(`/forum/reply/${id}`)
}

// 获取回复列表
export const getReplies = (postId: string | number) => {
  return request.get<PostReply[]>(`/forum/post/${postId}/replies`)
}
