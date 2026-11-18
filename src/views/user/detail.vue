<template>
  <div class="user-detail-page">
    <!-- 加载中 -->
    <el-skeleton v-if="loading" :rows="8" animated />

    <!-- 用户信息卡片 -->
    <el-card v-if="!loading && userInfo" shadow="never" class="user-profile-card">
      <div class="user-profile">
        <el-avatar :size="80" :src="userInfo.avatar" class="user-avatar" />
        <div class="user-info-text">
          <h2 class="user-display-name">{{ userInfo.nickname || userInfo.realName || userInfo.username }}</h2>
          <div class="user-meta">
            <span v-if="userInfo.realName" class="meta-item">
              <el-icon><UserFilled /></el-icon>
              真实姓名：{{ userInfo.realName }}
            </span>
            <span v-if="userInfo.nickname && userInfo.nickname !== userInfo.realName" class="meta-item">
              <el-icon><Stamp /></el-icon>
              昵称：{{ userInfo.nickname }}
            </span>
            <el-tag v-if="userInfo.role" size="small" :type="getRoleTag(userInfo.role)">
              {{ getRoleName(userInfo.role) }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-card>

    <!-- Tab 区域 -->
    <el-card v-if="!loading" shadow="never" class="user-content-card">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 发布的帖子 -->
        <el-tab-pane label="发布的帖子" name="posts">
          <div v-loading="postsLoading">
            <div v-if="posts.length" class="post-list">
              <div
                v-for="post in posts"
                :key="post.id"
                class="post-item"
                @click="goToPost(post.id)"
              >
                <div class="post-title-row">
                  <h3 class="post-title">{{ post.title }}</h3>
                  <el-tag size="small" type="info">{{ post.categoryName || post.category }}</el-tag>
                </div>
                <p class="post-preview">{{ post.preview }}</p>
                <div class="post-meta">
                  <span class="time">{{ formatTime(post.createTime) }}</span>
                  <span class="stats">
                    <el-icon><View /></el-icon> {{ post.viewCount }}
                    <el-icon><Star /></el-icon> {{ post.likeCount }}
                    <el-icon><ChatLineRound /></el-icon> {{ post.replyCount }}
                  </span>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无发布的帖子" />

            <!-- 分页 -->
            <div v-if="postsTotal > pageSize" class="pagination-wrapper">
              <el-pagination
                v-model:current-page="postPage"
                :page-size="pageSize"
                :total="postsTotal"
                layout="prev, pager, next"
                @current-change="fetchPosts"
              />
            </div>
          </div>
        </el-tab-pane>

        <!-- 上传的资源 -->
        <el-tab-pane label="上传的资源" name="resources">
          <div v-loading="resourcesLoading">
            <div v-if="resources.length" class="resource-table">
              <div class="table-wrap">
      <el-table :data="resources" style="width: 100%" size="medium">
                <el-table-column label="文件名" min-width="200">
                  <template #default="{ row }">
                    <div class="file-name-cell">
                      <el-icon size="18">
                        <Document v-if="row.fileType === 'DOCUMENT'" />
                        <VideoCamera v-else-if="row.fileType === 'VIDEO'" />
                        <Picture v-else-if="row.fileType === 'IMAGE'" />
                        <Files v-else />
                      </el-icon>
                      <span>{{ row.originalName || row.name }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="类型" width="90">
                  <template #default="{ row }">
                    <el-tag size="small">{{ row.fileType }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="大小" width="100">
                  <template #default="{ row }">
                    {{ row.fileSizeFormatted }}
                  </template>
                </el-table-column>
                <el-table-column label="时间" width="120">
                  <template #default="{ row }">
                    {{ formatDate(row.createTime) }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="80">
                  <template #default="{ row }">
                    <el-button link type="primary" @click="previewResource(row)">
                      <el-icon><View /></el-icon> 预览
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
      </div>
            </div>
            <el-empty v-else description="暂无上传的资源" />

            <!-- 分页 -->
            <div v-if="resourcesTotal > pageSize" class="pagination-wrapper">
              <el-pagination
                v-model:current-page="resourcePage"
                :page-size="pageSize"
                :total="resourcesTotal"
                layout="prev, pager, next"
                @current-change="fetchResources"
              />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 预览弹窗 -->
    <el-dialog v-model="previewVisible" :title="previewFile?.originalName" width="70%" top="5vh" append-to-body>
      <template v-if="previewFile">
        <div style="margin-bottom:12px;color:#666">
          {{ previewFile.description || '无描述' }}
        </div>
        <div v-if="previewFile.fileType==='IMAGE'" style="text-align:center">
          <img :src="`/api/resource/${previewFile.id}/preview`" style="max-width:100%;max-height:70vh" />
        </div>
        <div v-else-if="previewFile.fileType==='VIDEO'" style="text-align:center">
          <video :src="`/api/resource/${previewFile.id}/preview`" controls style="max-width:100%;max-height:70vh"></video>
        </div>
        <div v-else style="text-align:center;padding:20px;color:#999">
          <p>📄 {{ previewFile.originalName }}</p>
          <iframe :src="`/api/resource/${previewFile.id}/preview`" style="width:100%;height:60vh;border:1px solid #eee;margin-top:12px" />
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import dayjs from 'dayjs'
import { User, UserFilled, Stamp, View, Star, ChatLineRound, Document, VideoCamera, Picture, Files } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const userId = ref(String(route.params.id))
const loading = ref(true)
const postsLoading = ref(false)
const resourcesLoading = ref(false)

const userInfo = ref<any>(null)
const activeTab = ref('posts')

// 帖子相关
const posts = ref<any[]>([])
const postsTotal = ref(0)
const postPage = ref(1)

// 资源相关
const resources = ref<any[]>([])
const resourcesTotal = ref(0)
const resourcePage = ref(1)

const pageSize = 10

// 预览
const previewVisible = ref(false)
const previewFile = ref<any>(null)

const formatTime = (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')
const formatDate = (time: string) => dayjs(time).format('YYYY-MM-DD')

const getRoleTag = (role: string) => {
  const map: Record<string, string> = { ADMIN: 'danger', MEMBER: 'success', ALUMNI: 'warning' }
  return map[role] || 'info'
}

const getRoleName = (role: string) => {
  const map: Record<string, string> = { ADMIN: '管理员', MEMBER: '成员', ALUMNI: '校友' }
  return map[role] || role
}

const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await request.get(`/user/${userId.value}/detail`, {
      params: { postPage: 1, resourcePage: 1, pageSize }
    })
    userInfo.value = res.user
    posts.value = res.posts?.records || []
    postsTotal.value = Number(res.posts?.total) || 0
    resources.value = res.resources?.records || []
    resourcesTotal.value = Number(res.resources?.total) || 0
  } catch (error: any) {
    ElMessage.error(error.message || '获取用户详情失败')
  } finally {
    loading.value = false
  }
}

const fetchPosts = async () => {
  postsLoading.value = true
  try {
    const res = await request.get(`/user/${userId.value}/detail`, {
      params: { postPage: postPage.value, pageSize }
    })
    posts.value = res.posts?.records || []
    postsTotal.value = Number(res.posts?.total) || 0
  } catch (error: any) {
    ElMessage.error(error.message || '获取帖子失败')
  } finally {
    postsLoading.value = false
  }
}

const fetchResources = async () => {
  resourcesLoading.value = true
  try {
    const res = await request.get(`/user/${userId.value}/detail`, {
      params: { resourcePage: resourcePage.value, pageSize }
    })
    resources.value = res.resources?.records || []
    resourcesTotal.value = Number(res.resources?.total) || 0
  } catch (error: any) {
    ElMessage.error(error.message || '获取资源失败')
  } finally {
    resourcesLoading.value = false
  }
}

const handleTabChange = (tab: string) => {
  if (tab === 'posts' && posts.value.length === 0) {
    fetchPosts()
  } else if (tab === 'resources' && resources.value.length === 0) {
    fetchResources()
  }
}

const goToPost = (id: number) => {
  router.push(`/forum/post/${id}`)
}

const previewResource = (row: any) => {
  previewFile.value = row
  previewVisible.value = true
}

onMounted(fetchDetail)
</script>

<style scoped lang="scss">
.user-detail-page {
  max-width: 900px;
  margin: 0 auto;

  .user-profile-card {
    margin-bottom: 20px;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
    border: 1px solid rgba(102, 126, 234, 0.15) !important;

    .user-profile {
      display: flex;
      align-items: center;
      gap: 28px;

      .user-avatar {
        flex-shrink: 0;
        box-shadow: 0 4px 16px rgba(102, 126, 234, 0.25);
        border: 3px solid #fff;
      }

      .user-info-text {
        .user-display-name {
          margin: 0 0 10px;
          font-size: 24px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .user-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 16px;
          font-size: 14px;
          color: var(--mc-text-secondary);

          .meta-item {
            display: flex;
            align-items: center;
            gap: 6px;
          }
        }
      }
    }
  }

  .user-content-card {
    :deep(.el-tabs__header) {
      margin-bottom: 20px;
    }
  }

  .post-list {
    .post-item {
      padding: 16px 18px;
      border-bottom: 1px solid var(--mc-border-light);
      cursor: pointer;
      transition: all 0.2s ease;
      border-radius: 8px;
      margin: 0 -8px;

      &:hover {
        background: rgba(102, 126, 234, 0.04);
        transform: translateX(4px);
      }

      &:last-child {
        border-bottom: none;
      }

      .post-title-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;

        .post-title {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          color: var(--mc-text-primary);
          flex: 1;
        }
      }

      .post-preview {
        margin: 0 0 12px;
        font-size: 13px;
        color: var(--mc-text-muted);
        line-height: 1.5;
      }

      .post-meta {
        display: flex;
        align-items: center;
        gap: 16px;
        font-size: 12px;
        color: var(--mc-text-muted);

        .stats {
          display: flex;
          align-items: center;
          gap: 12px;

          .el-icon {
            margin-right: 2px;
          }
        }
      }
    }
  }

  .file-name-cell {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .resource-table {
    :deep(.el-table) {
      font-size: 13px;
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 20px;
    padding-top: 12px;
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .user-detail-page {
    .user-profile-card .user-profile {
      flex-direction: column;
      text-align: center;

      .user-info-text .user-meta {
        justify-content: center;
      }
    }

    .resource-table {
      :deep(.el-table) {
        .el-table__header-wrapper,
        .el-table__body-wrapper {
          overflow-x: auto;
        }
      }
    }
  }
}
</style>
