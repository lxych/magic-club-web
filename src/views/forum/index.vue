<template>
  <div class="forum-page">
    <!-- 搜索和操作栏 -->
    <div class="forum-header">
      <div class="search-area">
        <el-input
          v-model="query.keyword"
          placeholder="搜索帖子"
          clearable
          style="width: 300px"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="query.category" placeholder="全部分类" clearable @change="handleSearch">
          <el-option label="综合" value="GENERAL" />
          <el-option label="魔术技巧" value="MAGIC" />
          <el-option label="演出交流" value="SHOW" />
          <el-option label="资源分享" value="RESOURCE" />
        </el-select>
      </div>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon> 发布帖子
      </el-button>
    </div>

    <!-- 帖子列表 -->
    <el-card v-loading="loading" shadow="never">
      <div v-if="posts.length" class="post-list">
        <div
          v-for="post in posts"
          :key="post.id"
          class="post-item"
          @click="goToDetail(post.id)"
        >
          <div class="post-main">
            <div class="post-title-row">
              <el-tag v-if="post.isTop == 1" type="danger" size="small" effect="dark">置顶</el-tag>
              <el-tag v-if="post.isEssence == 1" type="warning" size="small" effect="dark">精华</el-tag>
              <h3 class="post-title">{{ post.title }}</h3>
            </div>
            <p class="post-summary">{{ post.content.slice(0, 100) }}...</p>
            <div class="post-meta">
              <span class="author">
                <el-avatar :size="20" :src="post.authorAvatar" />
                {{ post.authorName }}
              </span>
              <span class="category">{{ post.categoryName || post.category }}</span>
              <span class="time">{{ formatTime(post.createTime) }}</span>
              <span class="stats">
                <el-icon><View /></el-icon> {{ post.viewCount }}
                <el-icon><Star /></el-icon> {{ post.likeCount }}
                <el-icon><ChatLineRound /></el-icon> {{ post.replyCount }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无帖子" />
      
      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="query.pageNum"
          v-model:page-size="query.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 创建帖子对话框 -->
    <el-dialog v-model="showCreateDialog" title="发布帖子" width="600px">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="formData.category" placeholder="选择分类">
            <el-option label="综合" value="GENERAL" />
            <el-option label="魔术技巧" value="MAGIC" />
            <el-option label="演出交流" value="SHOW" />
            <el-option label="资源分享" value="RESOURCE" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="6"
            placeholder="请输入内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleCreate">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getPostList, createPost } from '@/api/forum'
import type { Post } from '@/api/forum'
import dayjs from 'dayjs'
import { Search, Plus, View, Star, ChatLineRound } from '@element-plus/icons-vue'

const router = useRouter()

const loading = ref(false)
const posts = ref<Post[]>([])
const total = ref(0)

const query = reactive({
  pageNum: 1,
  pageSize: 10,
  category: '',
  keyword: ''
})

const showCreateDialog = ref(false)
const submitting = ref(false)
const formRef = ref()

const formData = reactive({
  title: '',
  category: 'GENERAL',
  content: ''
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

const formatTime = (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')

const fetchPosts = async () => {
  loading.value = true
  try {
    const res = await getPostList(query)
    posts.value = res.records || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  query.pageNum = 1
  fetchPosts()
}

const handleSizeChange = (val: number) => {
  query.pageSize = val
  fetchPosts()
}

const handleCurrentChange = (val: number) => {
  query.pageNum = val
  fetchPosts()
}

const goToDetail = (id: string) => {
  router.push(`/forum/post/${id}`)
}

const handleCreate = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return
  
  submitting.value = true
  try {
    await createPost(formData)
    ElMessage.success('发布成功')
    showCreateDialog.value = false
    formData.title = ''
    formData.content = ''
    fetchPosts()
  } finally {
    submitting.value = false
  }
}

onMounted(fetchPosts)
</script>

<style scoped lang="scss">
.forum-page {
  .forum-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    .search-area {
      display: flex;
      gap: 12px;
    }
  }
  
  .post-list {
    .post-item {
      padding: 16px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      transition: background 0.2s;
      
      &:hover {
        background: #f5f7fa;
      }
      
      &:last-child {
        border-bottom: none;
      }
      
      .post-main {
        .post-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          
          .post-title {
            margin: 0;
            font-size: 16px;
            font-weight: 500;
            color: #333;
          }
        }
        
        .post-summary {
          margin: 0 0 12px;
          font-size: 14px;
          color: #666;
          line-height: 1.5;
        }
        
        .post-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 13px;
          color: #999;
          
          .author {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
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
  }
  
  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }
}
</style>
