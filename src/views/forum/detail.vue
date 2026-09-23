<template>
  <div v-if="post" class="post-detail">
    <!-- 帖子内容 -->
    <el-card shadow="never">
      <div class="post-header">
        <h1 class="post-title">{{ post.title }}</h1>
        <div class="post-meta">
          <span class="author">
            <router-link :to="`/user/${post.userId}`" class="avatar-link">
              <el-avatar :size="32" :src="post.authorAvatar" />
            </router-link>
            {{ post.authorName }}
          </span>
          <el-tag size="small">{{ post.categoryName || post.category }}</el-tag>
          <span class="time">{{ formatTime(post.createTime) }}</span>
          <span class="stats">
            <el-icon><View /></el-icon> {{ post.viewCount }}
            <el-icon><Star /></el-icon> {{ post.likeCount }}
          </span>
        </div>
      </div>
      
      <div class="post-content" v-html="renderMarkdown(post.content)" />
      
      <div class="post-actions">
        <el-button :type="liked ? 'primary' : ''" @click="handleLike">
          <el-icon><Star /></el-icon> {{ liked ? '已点赞' : '点赞' }}
        </el-button>
        <!-- 管理员操作 -->
        <template v-if="isAdmin">
          <el-button 
            :type="post.isTop == 1 ? 'warning' : ''" 
            @click="handleToggleTop"
          >
            <el-icon><Top /></el-icon> {{ post.isTop == 1 ? '取消置顶' : '置顶' }}
          </el-button>
          <el-button 
            :type="post.isEssence == 1 ? 'success' : ''" 
            @click="handleToggleEssence"
          >
            <el-icon><Medal /></el-icon> {{ post.isEssence == 1 ? '取消精华' : '精华' }}
          </el-button>
        </template>
        <el-button v-if="canDelete" type="danger" plain @click="handleDelete">
          <el-icon><Delete /></el-icon> 删除
        </el-button>
      </div>
    </el-card>

    <!-- 评论区 -->
    <el-card class="reply-section" shadow="never" title="评论区">
      <template #header>
        <div class="reply-header">
          <span>评论 ({{ totalReplies }})</span>
        </div>
      </template>
      
      <!-- 顶部评论输入框（默认） -->
      <div v-if="!replyingTo" class="reply-input-box">
        <div class="reply-toolbar">
          <el-popover placement="top" :width="320" trigger="click">
            <template #reference>
              <el-button size="small" text>😀 表情</el-button>
            </template>
            <div class="emoji-grid">
              <span v-for="e in emojis" :key="e" class="emoji-item" @click="replyContent += e">{{ e }}</span>
            </div>
          </el-popover>
        </div>
        <el-input
          v-model="replyContent"
          type="textarea"
          :rows="3"
          placeholder="写下你的评论..."
        />
        <div class="reply-actions">
          <el-button type="primary" :loading="replying" @click="handleReply">
            发表评论
          </el-button>
        </div>
      </div>
      
      <!-- 回复列表 -->
      <div v-if="rootReplies.length" class="reply-list">
        <div v-for="reply in rootReplies" :key="reply.id" class="reply-item">
          <div class="reply-main">
            <div class="reply-author">
              <router-link :to="`/user/${reply.userId}`" class="avatar-link">
                <el-avatar :size="36" :src="reply.authorAvatar" />
              </router-link>
              <div class="reply-info">
                <span class="reply-name">{{ reply.authorName }}</span>
                <span class="reply-time">{{ formatTime(reply.createTime) }}</span>
              </div>
            </div>
            <div class="reply-content">{{ reply.content }}</div>
            <div class="reply-actions-bar">
              <el-button link type="primary" @click="startReply(reply)">回复</el-button>
              <el-button 
                v-if="canDeleteReply(reply)" 
                link 
                type="danger" 
                @click="handleDeleteReply(reply)"
              >
                删除
              </el-button>
            </div>
          </div>
          
          <!-- 跟随的回复输入框 -->
          <div v-if="isReplyingToThis(reply)" class="inline-reply-input">
            <el-input
              v-model="replyContent"
              type="textarea"
              :rows="2"
              :placeholder="`回复 ${replyingTo?.authorName}:`"
              autofocus
            />
            <div class="reply-actions">
              <el-button @click="cancelReply">取消</el-button>
              <el-button type="primary" :loading="replying" @click="handleReply">
                回复
              </el-button>
            </div>
          </div>
          
          <!-- 二级回复 -->
          <div v-if="getChildReplies(reply.id).length" class="child-replies">
            <div 
              v-for="child in getChildReplies(reply.id)" 
              :key="child.id" 
              class="child-reply-item"
            >
              <div class="reply-author">
                <router-link :to="`/user/${child.userId}`" class="avatar-link">
                  <el-avatar :size="28" :src="child.authorAvatar" />
                </router-link>
                <div class="reply-info">
                  <span class="reply-name">{{ child.authorName }}</span>
                  <span class="reply-time">{{ formatTime(child.createTime) }}</span>
                </div>
              </div>
              <div class="reply-content">
                <span v-if="child.targetUserName" class="reply-to">回复 {{ child.targetUserName }}:</span>
                {{ child.content }}
              </div>
              <div class="child-reply-actions">
                <el-button link type="primary" size="small" @click="startReply(child)">回复</el-button>
                <el-button 
                  v-if="canDeleteReply(child)" 
                  link 
                  type="danger" 
                  size="small" 
                  @click="handleDeleteReply(child)"
                >
                  删除
                </el-button>
              </div>
              
              <!-- 二级评论的跟随回复输入框 -->
              <div v-if="replyingTo?.id === child.id" class="inline-reply-input child-inline-reply">
                <div class="reply-toolbar">
                  <el-popover placement="top" :width="320" trigger="click">
                    <template #reference>
                      <el-button size="small" text>😀</el-button>
                    </template>
                    <div class="emoji-grid">
                      <span v-for="e in emojis" :key="e" class="emoji-item" @click="replyContent += e">{{ e }}</span>
                    </div>
                  </el-popover>
                </div>
                <el-input
                  v-model="replyContent"
                  type="textarea"
                  :rows="2"
                  :placeholder="`回复 ${replyingTo?.authorName}:`"
                  autofocus
                />
                <div class="reply-actions">
                  <el-button size="small" @click="cancelReply">取消</el-button>
                  <el-button size="small" type="primary" :loading="replying" @click="handleReply">
                    回复
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无评论，来抢沙发吧" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPostDetail, likePost, deletePost, createReply, deleteReply, toggleTop, toggleEssence } from '@/api/forum'
import { useUserStore } from '@/stores/user'
import type { Post, PostReply } from '@/api/forum'
import dayjs from 'dayjs'
import { View, Star, Delete, Top, Medal } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const postId = computed(() => String(route.params.id))
const post = ref<Post | null>(null)
const allReplies = ref<PostReply[]>([])
const liked = ref(false)
const replyContent = ref('')
const replying = ref(false)
const replyingTo = ref<PostReply | null>(null)

// 一级回复（parentId 为 null 的）
const rootReplies = computed(() => {
  return allReplies.value.filter(r => !r.parentId)
})

// 总回复数
const totalReplies = computed(() => allReplies.value.length)

// 获取某个回复的子回复
const getChildReplies = (parentId: string) => {
  return allReplies.value.filter(r => r.parentId === parentId)
}

// 获取回复目标名称
const getReplyTargetName = (parentId: string | null) => {
  if (!parentId) return ''
  // 找到被回复的评论
  const target = allReplies.value.find(r => r.id === parentId)
  return target?.authorName || ''
}

// 判断是否正在回复当前一级评论（只在直接回复一级评论时显示）
const isReplyingToThis = (reply: PostReply) => {
  if (!replyingTo.value) return false
  // 只在一级评论的 id 与被回复的 id 相同时显示
  return replyingTo.value.id === reply.id
}

const isAuthor = computed(() => {
  return post.value && userStore.userInfo && post.value.userId === userStore.userInfo.id
})

const canDelete = computed(() => {
  // 作者或管理员可以删除
  return isAuthor.value || userStore.userInfo?.role === 'ADMIN'
})

const isAdmin = computed(() => {
  return userStore.userInfo?.role === 'ADMIN'
})

const formatTime = (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')

const fetchDetail = async () => {
  try {
    const res = await getPostDetail(postId.value)
    post.value = res.post
    allReplies.value = res.replies || []
  } catch {
    ElMessage.error('帖子不存在或已删除')
    router.push('/forum')
  }
}

const handleLike = async () => {
  try {
    const newLiked = !liked.value
    await likePost(postId.value, newLiked)
    liked.value = newLiked
    if (post.value) {
      post.value.likeCount += newLiked ? 1 : -1
    }
    ElMessage.success(newLiked ? '点赞成功' : '取消点赞')
  } catch {
    // 错误已在拦截器处理
  }
}

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm('确定删除该帖子吗？', '提示', { type: 'warning' })
    await deletePost(postId.value)
    ElMessage.success('删除成功')
    router.push('/forum')
  } catch {
    // 用户取消
  }
}

// 置顶/取消置顶
const handleToggleTop = async () => {
  if (!isAdmin.value) {
    ElMessage.error('仅管理员可操作')
    return
  }
  try {
    const currentTop = post.value?.isTop == 1
    const newTop = !currentTop
    await toggleTop(postId.value, newTop)
    if (post.value) {
      post.value.isTop = newTop ? 1 : 0
    }
    ElMessage.success(newTop ? '置顶成功' : '取消置顶成功')
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

// 加精/取消加精
const handleToggleEssence = async () => {
  if (!isAdmin.value) {
    ElMessage.error('仅管理员可操作')
    return
  }
  try {
    const currentEssence = post.value?.isEssence == 1
    const newEssence = !currentEssence
    await toggleEssence(postId.value, newEssence)
    if (post.value) {
      post.value.isEssence = newEssence ? 1 : 0
    }
    ElMessage.success(newEssence ? '设置精华成功' : '取消精华成功')
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

const startReply = (reply: PostReply) => {
  // 先清空之前的内容，确保只有一个输入框
  replyContent.value = ''
  replyingTo.value = reply
}

const cancelReply = () => {
  replyingTo.value = null
  replyContent.value = ''
}

const handleReply = async () => {
  if (!replyContent.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }
  
  replying.value = true
  try {
    let parentId: string | undefined
    let targetUserId: string | undefined
    
    if (replyingTo.value) {
      // 如果回复的是二级评论，parentId 指向一级评论
      // targetUserId 指向被回复的用户
      parentId = replyingTo.value.parentId || replyingTo.value.id
      targetUserId = replyingTo.value.userId
    }
    
    await createReply(postId.value, replyContent.value, parentId, targetUserId)
    ElMessage.success(replyingTo.value ? '回复成功' : '评论成功')
    replyContent.value = ''
    replyingTo.value = null
    fetchDetail()
  } finally {
    replying.value = false
  }
}

// 判断是否可删除评论
const canDeleteReply = (reply: PostReply) => {
  return userStore.userInfo && (
    reply.userId === userStore.userInfo.id || 
    userStore.userInfo.role === 'ADMIN'
  )
}

// 删除评论
const handleDeleteReply = async (reply: PostReply) => {
  try {
    await ElMessageBox.confirm(
      reply.parentId ? '确定删除该回复吗？' : '确定删除该评论及其所有回复吗？',
      '提示',
      { type: 'warning' }
    )
    await deleteReply(reply.id)
    ElMessage.success('删除成功')
    fetchDetail()
  } catch {
    // 用户取消
  }
}

onMounted(fetchDetail)

const emojis = ['😀','😂','🤣','😍','😎','🤩','😭','😡','👍','👎','🙏','💪','👀','🎉','🔥','❤️','💔','✨','🌟','🎵','🎸','🎭','🎪','🃏','🔮','🪄','🐱','🐶','🌹','🍀','⭐','💯','✅','❌','👉','💬']

const renderMarkdown = (text: string) => {
  if (!text) return ''
  return text
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:8px 0" />')
    .replace(/\n/g, '<br/>')
}

watch(() => route.params.id, () => {
  fetchDetail()
})
</script>

<style scoped lang="scss">
.post-detail {
  max-width: 900px;
  margin: 0 auto;
  
  .post-header {
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 2px solid var(--mc-border-light);
    
    .post-title {
      margin: 0 0 20px;
      font-size: 26px;
      font-weight: 700;
      color: var(--mc-text-primary);
      line-height: 1.4;
    }
    
    .post-meta {
      display: flex;
      align-items: center;
      gap: 20px;
      font-size: 14px;
      color: var(--mc-text-secondary);
      flex-wrap: wrap;
      
      .author {
        display: flex;
        align-items: center;
        gap: 10px;

        .avatar-link {
          display: flex;
          align-items: center;
        }
      }
      
      .stats {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-left: auto;
        
        .el-icon {
          margin-right: 4px;
        }
      }
    }
  }
  
  .post-content {
    font-size: 15px;
    line-height: 1.9;
    color: var(--mc-text-primary);
    padding: 24px 0;
    border-bottom: 1px solid var(--mc-border-light);
    white-space: pre-wrap;
    
    :deep(img) {
      border-radius: 10px;
      box-shadow: var(--mc-shadow-md);
      margin: 12px 0;
    }
  }
  
  .post-actions {
    display: flex;
    gap: 12px;
    margin-top: 24px;
    flex-wrap: wrap;
  }
  
  .reply-section {
    margin-top: 24px;
    
    :deep(.el-card__header) {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
    }
    
    .reply-header {
      font-weight: 600;
      font-size: 16px;
    }
    
    .reply-input-box {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 28px;
      padding: 20px;
      background: var(--mc-bg-tertiary);
      border-radius: 12px;
      border: 1px solid var(--mc-border-light);
      
      :deep(.el-textarea__inner) {
        border-radius: 8px;
      }
      
      .reply-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }
    }
    
    .inline-reply-input {
      margin: 16px 0 16px 52px;
      padding: 16px;
      background: rgba(102, 126, 234, 0.04);
      border-radius: 10px;
      border: 1px solid rgba(102, 126, 234, 0.15);
      
      .reply-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 12px;
      }
    }
    
    .reply-list {
      .reply-item {
        padding: 20px 0;
        border-bottom: 1px solid var(--mc-border-light);
        
        &:last-child {
          border-bottom: none;
        }
        
        .reply-main {
          .reply-author {
            display: flex;
            align-items: center;
            gap: 14px;
            margin-bottom: 14px;
            
            .reply-info {
              display: flex;
              flex-direction: column;
              
              .reply-name {
                font-size: 15px;
                font-weight: 600;
                color: var(--mc-text-primary);
              }
              
              .reply-time {
                font-size: 12px;
                color: var(--mc-text-muted);
                margin-top: 2px;
              }
            }
          }
          
          .reply-content {
            font-size: 14px;
            color: var(--mc-text-primary);
            line-height: 1.7;
            margin-bottom: 10px;
          }
          
          .reply-actions-bar {
            margin-top: 10px;
          }
        }
        
        .child-replies {
          margin-top: 16px;
          margin-left: 52px;
          padding-left: 20px;
          border-left: 3px solid rgba(102, 126, 234, 0.2);
          
          .child-reply-item {
            padding: 14px 0;
            
            .reply-author {
              display: flex;
              align-items: center;
              gap: 10px;
              margin-bottom: 10px;
              
              .reply-info {
                display: flex;
                flex-direction: column;
                
                .reply-name {
                  font-size: 14px;
                  font-weight: 600;
                  color: var(--mc-text-primary);
                }
                
                .reply-time {
                  font-size: 11px;
                  color: var(--mc-text-muted);
                  margin-top: 2px;
                }
              }
            }
            
            .reply-content {
              font-size: 14px;
              color: var(--mc-text-primary);
              line-height: 1.6;
              
              .reply-to {
                color: var(--mc-primary);
                margin-right: 6px;
                font-weight: 500;
              }
            }
          }
        }
      }
    }
  }
}

.emoji-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  .emoji-item {
    font-size: 22px;
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    transition: all 0.2s;
    &:hover { background: rgba(102, 126, 234, 0.1); transform: scale(1.2); }
  }
}

.reply-toolbar {
  margin-bottom: 8px;
}

@media (max-width: 768px) {
  .post-detail {
    .post-header .post-title {
      font-size: 20px;
    }
    
    .post-meta {
      gap: 12px;
    }
    
    .reply-list .reply-item .child-replies {
      margin-left: 36px;
      padding-left: 12px;
    }
  }
}
</style>
