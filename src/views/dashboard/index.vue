<template>
  <div class="dashboard">
    <!-- 欢迎区 -->
    <el-card class="welcome-card" shadow="never">
      <div class="welcome-content">
        <div class="welcome-text">
          <h2>欢迎回来，{{ userStore.userInfo?.realName || userStore.userInfo?.username }}！</h2>
          <p>Magic Club 魔术社团管理系统</p>
        </div>
        <div class="welcome-stats">
          <div class="stat-item">
            <div class="stat-value">{{ stats.postCount }}</div>
            <div class="stat-label">帖子总数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.resourceCount }}</div>
            <div class="stat-label">资源总数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.memberCount }}</div>
            <div class="stat-label">社团成员</div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 快捷入口 -->
    <el-row :gutter="20" class="quick-actions">
      <el-col :span="6">
        <el-card class="action-card" shadow="hover" @click="$router.push('/forum')">
          <el-icon size="32"><ChatDotRound /></el-icon>
          <span>进入论坛</span>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="action-card" shadow="hover" @click="$router.push('/resource')">
          <el-icon size="32"><Folder /></el-icon>
          <span>资源中心</span>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="action-card" shadow="hover" @click="$router.push('/memorial')">
          <el-icon size="32"><Trophy /></el-icon>
          <span>纪念墙</span>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="action-card" shadow="hover" @click="$router.push('/alumni')">
          <el-icon size="32"><UserFilled /></el-icon>
          <span>花名册</span>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最新动态 -->
    <el-row :gutter="20" class="latest-section">
      <el-col :span="12">
        <el-card title="最新帖子">
          <template #header>
            <div class="card-header">
              <span>最新帖子</span>
              <el-link type="primary" @click="$router.push('/forum')">查看更多</el-link>
            </div>
          </template>
          <div v-if="latestPosts.length" class="post-list">
            <div
              v-for="post in latestPosts"
              :key="post.id"
              class="post-item"
              @click="$router.push(`/forum/post/${post.id}`)"
            >
              <div class="post-title">
                <el-tag v-if="post.isTop == 1" type="danger" size="small">置顶</el-tag>
                <el-tag v-if="post.isEssence == 1" type="warning" size="small">精华</el-tag>
                {{ post.title }}
              </div>
              <div class="post-meta">
                <span>{{ post.authorName }}</span>
                <span>{{ formatTime(post.createTime) }}</span>
                <span><el-icon><View /></el-icon> {{ post.viewCount }}</span>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无帖子" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card title="最新资源">
          <template #header>
            <div class="card-header">
              <span>最新资源</span>
              <el-link type="primary" @click="$router.push('/resource')">查看更多</el-link>
            </div>
          </template>
          <div v-if="latestResources.length" class="resource-list">
            <div
              v-for="resource in latestResources"
              :key="resource.id"
              class="resource-item"
            >
              <div class="resource-info">
                <el-icon size="20"><Document /></el-icon>
                <span class="resource-name">{{ resource.name }}</span>
              </div>
              <div class="resource-meta">
                <span>{{ resource.uploaderName }}</span>
                <span>{{ resource.fileSizeFormatted }}</span>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无资源" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { getPostList } from '@/api/forum'
import { getResourceList } from '@/api/resource'
import { getUserList } from '@/api/user'
import type { Post } from '@/api/forum'
import type { ResourceFile } from '@/api/resource'
import dayjs from 'dayjs'
import { ChatDotRound, Folder, Trophy, UserFilled, View, Document } from '@element-plus/icons-vue'

const userStore = useUserStore()

const stats = ref({
  postCount: 0,
  resourceCount: 0,
  memberCount: 0
})

const latestPosts = ref<Post[]>([])
const latestResources = ref<ResourceFile[]>([])

const formatTime = (time: string) => dayjs(time).format('MM-DD')

const fetchData = async () => {
  try {
    const [postRes, resourceRes, userRes] = await Promise.all([
      getPostList({ pageNum: 1, pageSize: 5 }),
      getResourceList({ pageNum: 1, pageSize: 5 }),
      getUserList({ pageNum: 1, pageSize: 1 })
    ])
    // 取最新5条（API已按时间倒序返回）
    latestPosts.value = (postRes.records || []).slice(0, 5)
    latestResources.value = (resourceRes.records || []).slice(0, 5)
    stats.value.postCount = postRes.total || 0
    stats.value.resourceCount = resourceRes.total || 0
    stats.value.memberCount = userRes.total || 0
  } catch {
    // 静默处理
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.dashboard {
  .welcome-card {
    margin-bottom: 24px;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
    border: 1px solid rgba(102, 126, 234, 0.15) !important;
    
    :deep(.el-card__body) {
      padding: 28px 32px !important;
    }
    
    .welcome-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .welcome-text {
        h2 {
          margin: 0 0 8px;
          font-size: 26px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        p {
          margin: 0;
          color: var(--mc-text-secondary);
          font-size: 14px;
        }
      }
      
      .welcome-stats {
        display: flex;
        gap: 48px;
        
        .stat-item {
          text-align: center;
          padding: 16px 24px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          
          &:hover {
            transform: translateY(-4px);
            box-shadow: 0 6px 16px rgba(102, 126, 234, 0.15);
          }
          
          .stat-value {
            font-size: 32px;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          .stat-label {
            font-size: 13px;
            color: var(--mc-text-secondary);
            margin-top: 6px;
            font-weight: 500;
          }
        }
      }
    }
  }
  
  .quick-actions {
    margin-bottom: 24px;
    
    :deep(.el-col) {
      animation: fadeInUp 0.5s ease forwards;
      opacity: 0;
      
      &:nth-child(1) { animation-delay: 0.1s; }
      &:nth-child(2) { animation-delay: 0.2s; }
      &:nth-child(3) { animation-delay: 0.3s; }
      &:nth-child(4) { animation-delay: 0.4s; }
    }
    
    .action-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 24px;
      cursor: pointer;
      transition: all 0.3s ease;
      background: linear-gradient(135deg, #fff 0%, #f8fafc 100%);
      border: 1px solid var(--mc-border-light);
      
      &:hover {
        transform: translateY(-6px);
        box-shadow: 0 12px 24px rgba(102, 126, 234, 0.15);
        border-color: rgba(102, 126, 234, 0.3);
      }
      
      :deep(.el-icon) {
        width: 56px;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 16px;
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
        color: var(--mc-primary);
        margin-bottom: 16px;
        transition: all 0.3s ease;
      }
      
      &:hover :deep(.el-icon) {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
        transform: scale(1.1);
      }
      
      span {
        font-size: 15px;
        color: var(--mc-text-primary);
        font-weight: 500;
      }
    }
  }
  
  .latest-section {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
      
      :deep(.el-link) {
        font-weight: 500;
      }
    }
    
    .post-list {
      .post-item {
        padding: 14px 12px;
        border-bottom: 1px solid var(--mc-border-light);
        cursor: pointer;
        transition: all 0.2s ease;
        border-radius: 8px;
        margin: 0 -12px;
        
        &:hover {
          background: rgba(102, 126, 234, 0.04);
          transform: translateX(4px);
        }
        
        &:last-child {
          border-bottom: none;
        }
        
        .post-title {
          font-size: 14px;
          color: var(--mc-text-primary);
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }
        
        .post-meta {
          font-size: 12px;
          color: var(--mc-text-muted);
          display: flex;
          gap: 16px;
          align-items: center;
        }
      }
    }
    
    .resource-list {
      .resource-item {
        padding: 14px 12px;
        border-bottom: 1px solid var(--mc-border-light);
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: all 0.2s ease;
        border-radius: 8px;
        margin: 0 -12px;
        
        &:hover {
          background: rgba(102, 126, 234, 0.04);
        }
        
        &:last-child {
          border-bottom: none;
        }
        
        .resource-info {
          display: flex;
          align-items: center;
          gap: 12px;
          
          :deep(.el-icon) {
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
            color: var(--mc-primary);
          }
          
          .resource-name {
            font-size: 14px;
            color: var(--mc-text-primary);
            font-weight: 500;
          }
        }
        
        .resource-meta {
          font-size: 12px;
          color: var(--mc-text-muted);
          display: flex;
          gap: 16px;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .stats-row {
    .el-col {
      margin-bottom: 12px;
    }
  }
  
  .welcome-content {
    flex-direction: column;
    gap: 24px;
    
    .welcome-stats {
      gap: 16px;
      width: 100%;
      justify-content: center;
    }
  }
  
  .latest-section {
    .el-col {
      max-width: 100%;
      flex: 0 0 100%;
      margin-bottom: 16px;
    }
  }
}
</style>
