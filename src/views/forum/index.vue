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
            <p class="post-summary">{{ stripMarkdown(post.content).slice(0, 100) }}{{ stripMarkdown(post.content).length > 100 ? '...' : '' }}</p>
            <div class="post-meta">
              <span class="author">
                <router-link :to="`/user/${post.userId}`" class="avatar-link">
                  <el-avatar :size="20" :src="post.authorAvatar" />
                </router-link>
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
          :pager-count="5"
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
          <div class="editor-wrapper">
            <div v-if="uploadedImages.length" class="image-preview-row">
              <div v-for="(img, idx) in uploadedImages" :key="idx" class="image-thumb">
                <img :src="img.url" />
                <span class="image-delete" @click="removeImage(idx)">×</span>
              </div>
            </div>
            <div class="editor-toolbar">
              <el-upload
                :show-file-list="false"
                :before-upload="handleImageUpload"
                accept="image/*"
                :http-request="() => {}"
                :disabled="imageCount >= 9"
              >
                <el-button size="small" :disabled="imageCount >= 9">🖼️ 图片 ({{ imageCount }}/9)</el-button>
              </el-upload>
              <el-popover placement="bottom" :width="320" trigger="click">
                <template #reference>
                  <el-button size="small">😀 表情</el-button>
                </template>
                <div class="emoji-grid">
                  <span v-for="e in emojis" :key="e" class="emoji-item" @click="insertEmoji('content', e)">{{ e }}</span>
                </div>
              </el-popover>
            </div>
            <el-input
              v-model="formData.content"
              type="textarea"
              :rows="8"
              placeholder="请输入文字内容，图片会显示在上方"
            />
          </div>
        </el-form-item>
        <el-form-item v-if="formData.content || uploadedImages.length" label="预览">
          <div class="content-preview" v-html="previewContent" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false; uploadedImages = []; imageCount = 0">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleCreate">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getPostList, createPost } from '@/api/forum'
import request from '@/utils/request'
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
const imageCount = ref(0)
const uploadedImages = ref<{name: string, url: string}[]>([])

const previewContent = computed(() => {
  let md = formData.content || ''
  for (const img of uploadedImages.value) {
    md += '\n![' + img.name + '](' + img.url + ')'
  }
  return renderMarkdown(md)
})

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
    let fullContent = formData.content || ''
    for (const img of uploadedImages.value) {
      fullContent += '\n![' + img.name + '](' + img.url + ')'
    }
    await createPost({ ...formData, content: fullContent })
    ElMessage.success('发布成功')
    showCreateDialog.value = false
    imageCount.value = 0
    uploadedImages.value = []
    formData.title = ''
    formData.content = ''
    fetchPosts()
  } finally {
    submitting.value = false
  }
}

onMounted(fetchPosts)

const emojis = ['😀','😂','🤣','😍','😎','🤩','😭','😡','👍','👎','🙏','💪','👀','🎉','🔥','❤️','💔','✨','🌟','🎵','🎸','🎭','🎪','🃏','🔮','🪄','🐱','🐶','🌹','🍀','⭐','💯','✅','❌','👉','💬']

const insertEmoji = (field: string, emoji: string) => {
  formData.content = formData.content + emoji
}

const handleImageUpload = async (file: File) => {
  if (imageCount.value >= 9) {
    ElMessage.warning('最多上传9张图片')
    return false
  }
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res: any = await request.post('/resource/forum-upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    uploadedImages.value.push({ name: file.name, url: res.fileUrl })
    imageCount.value++
    ElMessage.success('图片已添加')
  } catch {
    ElMessage.error('图片上传失败')
  }
  return false
}

const removeImage = (idx: number) => {
  uploadedImages.value.splice(idx, 1)
  imageCount.value--
}

const renderMarkdown = (text: string) => {
  if (!text) return ''
  return text
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:8px 0" />')
    .replace(/\n/g, '<br/>')
}

const stripMarkdown = (text: string) => {
  return (text || '').replace(/!\[.*?\]\(.*?\)/g, '[图片]').replace(/[#*_~>]/g, '')
}
</script>

<style scoped lang="scss">
.forum-page {
  .forum-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 16px 20px;
    background: var(--mc-bg-primary);
    border-radius: var(--mc-radius-md);
    box-shadow: var(--mc-shadow-sm);
    
    .search-area {
      display: flex;
      gap: 12px;
    }
  }
  
  :deep(.el-card) {
    border: 1px solid var(--mc-border-light) !important;
  }
  
  .post-list {
    .post-item {
      padding: 20px;
      border-bottom: 1px solid var(--mc-border-light);
      cursor: pointer;
      transition: all 0.3s ease;
      border-radius: 10px;
      margin: 4px -8px;
      
      &:hover {
        background: rgba(102, 126, 234, 0.03);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.08);
      }
      
      &:last-child {
        border-bottom: none;
      }
      
      .post-main {
        .post-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          
          .post-title {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: var(--mc-text-primary);
            transition: color 0.2s;
          }
          
          &:hover .post-title {
            color: var(--mc-primary);
          }
        }
        
        .post-summary {
          margin: 0 0 14px;
          font-size: 14px;
          color: var(--mc-text-secondary);
          line-height: 1.6;
        }
        
        .post-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 13px;
          color: var(--mc-text-muted);
          
          .author {
            display: flex;
            align-items: center;
            gap: 6px;

            .avatar-link {
              display: flex;
              align-items: center;
            }
          }
          
          .category {
            padding: 2px 8px;
            background: rgba(102, 126, 234, 0.08);
            border-radius: 4px;
            color: var(--mc-primary);
            font-size: 12px;
          }
          
          .stats {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-left: auto;
            
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
    margin-top: 24px;
    padding-top: 16px;
  }

  .editor-toolbar {
    margin-bottom: 8px;
    display: flex;
    gap: 8px;
  }

  .editor-wrapper {
    width: 100%;
    :deep(.el-textarea__inner) {
      min-height: 200px;
      font-size: 15px;
      line-height: 1.8;
      border-radius: 10px;
    }
  }

  .image-preview-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 10px;

    .image-thumb {
      position: relative;
      width: 100px;
      height: 100px;
      border-radius: 8px;
      overflow: hidden;
      border: 2px solid var(--mc-border-light);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .image-delete {
        position: absolute;
        top: 2px;
        right: 2px;
        width: 22px;
        height: 22px;
        background: rgba(0,0,0,.6);
        color: #fff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 16px;
        line-height: 1;

        &:hover { background: var(--mc-danger); }
      }
    }
  }

  .content-preview {
    padding: 16px;
    background: var(--mc-bg-tertiary);
    border-radius: 10px;
    min-height: 40px;
    line-height: 1.8;
    word-break: break-all;
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
}
</style>
