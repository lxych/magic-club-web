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
          <span>毕业成员</span>
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
    margin-bottom: 20px;
    
    .welcome-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .welcome-text {
        h2 {
          margin: 0 0 8px;
          font-size: 24px;
          color: #1a1a2e;
        }
        
        p {
          margin: 0;
          color: #666;
        }
      }
      
      .welcome-stats {
        display: flex;
        gap: 40px;
        
        .stat-item {
          text-align: center;
          
          .stat-value {
            font-size: 32px;
            font-weight: 600;
            color: #667eea;
          }
          
          .stat-label {
            font-size: 14px;
            color: #666;
            margin-top: 4px;
          }
        }
      }
    }
  }
  
  .quick-actions {
    margin-bottom: 20px;
    
    .action-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      cursor: pointer;
      transition: all 0.3s;
      
      &:hover {
        transform: translateY(-4px);
      }
      
      .el-icon {
        color: #667eea;
        margin-bottom: 12px;
      }
      
      span {
        font-size: 14px;
        color: #333;
      }
    }
  }
  
  .latest-section {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .post-list {
      .post-item {
        padding: 12px 0;
        border-bottom: 1px solid #f0f0f0;
        cursor: pointer;
        transition: background 0.2s;
        
        &:hover {
          background: #f5f7fa;
        }
        
        &:last-child {
          border-bottom: none;
        }
        
        .post-title {
          font-size: 14px;
          color: #333;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .post-meta {
          font-size: 12px;
          color: #999;
          display: flex;
          gap: 16px;
          align-items: center;
        }
      }
    }
    
    .resource-list {
      .resource-item {
        padding: 12px 0;
        border-bottom: 1px solid #f0f0f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        &:last-child {
          border-bottom: none;
        }
        
        .resource-info {
          display: flex;
          align-items: center;
          gap: 8px;
          
          .resource-name {
            font-size: 14px;
            color: #333;
          }
        }
        
        .resource-meta {
          font-size: 12px;
          color: #999;
          display: flex;
          gap: 16px;
        }
      }
    }
  }
}
</style>
