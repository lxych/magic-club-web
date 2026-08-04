<template>
  <div class="resource-page">
    <!-- 搜索和操作栏 -->
    <div class="resource-header">
      <div class="search-area">
        <el-input
          v-model="query.keyword"
          placeholder="搜索资源"
          clearable
          style="width: 250px"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="query.category" placeholder="全部分类" clearable @change="handleSearch">
          <el-option label="教程" value="TUTORIAL" />
          <el-option label="剧本" value="SCRIPT" />
          <el-option label="道具资料" value="PROP" />
          <el-option label="演出视频" value="PERFORMANCE" />
          <el-option label="其他" value="OTHER" />
        </el-select>
        <el-select v-model="query.fileType" placeholder="全部类型" clearable @change="handleSearch">
          <el-option label="视频" value="VIDEO" />
          <el-option label="文档" value="DOCUMENT" />
          <el-option label="图片" value="IMAGE" />
          <el-option label="其他" value="OTHER" />
        </el-select>
      </div>
      <el-button v-if="userStore.isLoggedIn" type="primary" @click="showUploadDialog = true">
        <el-icon><Upload /></el-icon> 上传资源
      </el-button>
    </div>

    <!-- 资源列表 -->
    <el-card v-loading="loading" shadow="never">
      <el-table :data="resources" style="width: 100%">
        <el-table-column label="文件名" min-width="250">
          <template #default="{ row }">
            <div class="file-name">
              <el-icon size="20" :color="getFileIconColor(row.fileType)">
                <Document v-if="row.fileType === 'DOCUMENT'" />
                <VideoCamera v-else-if="row.fileType === 'VIDEO'" />
                <Picture v-else-if="row.fileType === 'IMAGE'" />
                <Files v-else />
              </el-icon>
              <div class="file-info">
                <span class="name">{{ row.name }}</span>
                <span class="desc">{{ row.description || '暂无描述' }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getFileTypeTag(row.fileType)">
              {{ row.fileType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="大小" width="100">
          <template #default="{ row }">
            {{ row.fileSizeFormatted || formatFileSize(row.fileSize) }}
          </template>
        </el-table-column>
        <el-table-column label="上传者" width="120">
          <template #default="{ row }">
            {{ row.uploaderName }}
          </template>
        </el-table-column>
        <el-table-column label="上传时间" width="150">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="下载" width="80" align="center">
          <template #default="{ row }">
            {{ row.downloadCount }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openPreview(row)">
              <el-icon><View /></el-icon>
            </el-button>
            <el-button v-if="row.allowDownload !== 0" type="primary" link @click="handleDownload(row)">
              <el-icon><Download /></el-icon>
            </el-button>
            <el-button 
              v-if="row.userId === userStore.userInfo?.id" 
              type="danger" 
              link 
              @click="handleDelete(row.id)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
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

    <!-- 上传对话框 -->
    <el-dialog v-model="showUploadDialog" title="上传资源" width="500px">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="80px">
        <el-form-item label="文件" prop="file">
          <el-upload
            ref="uploadRef"
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="1"
          >
            <el-button type="primary">选择文件</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="formData.category" placeholder="选择分类">
            <el-option label="教程" value="TUTORIAL" />
            <el-option label="剧本" value="SCRIPT" />
            <el-option label="道具资料" value="PROP" />
            <el-option label="演出视频" value="PERFORMANCE" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入文件描述"
          />
        </el-form-item>
        <el-form-item label="可下载">
          <el-switch v-model="formData.allowDownload" active-text="是" inactive-text="否" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="handleUpload">上传</el-button>
      </template>
    </el-dialog>

    <!-- 预览弹窗 -->
    <el-dialog v-model="previewVisible" :title="previewFile?.originalName" width="70%" top="5vh" append-to-body>
      <template v-if="previewFile">
        <div style="margin-bottom:12px;color:#666">
          上传者：{{ previewFile.uploaderName }}　｜　{{ previewFile.description || '无描述' }}
        </div>
        <div v-if="previewFile.fileType==='IMAGE'" style="text-align:center">
          <img :src="'/api/resource/'+previewFile.id+'/preview'" style="max-width:100%;max-height:70vh" />
        </div>
        <div v-else-if="previewFile.fileType==='VIDEO'" style="text-align:center">
          <video :src="'/api/resource/'+previewFile.id+'/preview'" controls style="max-width:100%;max-height:70vh"></video>
        </div>
        <div v-else style="text-align:center;padding:40px;color:#999">
          <p>📄 {{ previewFile.originalName }}</p>
          <p>浏览器原生预览（支持PDF/文本/代码等）</p>
          <iframe :src="'/api/resource/'+previewFile.id+'/preview'" style="width:100%;height:60vh;border:1px solid #eee;margin-top:12px" />
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getResourceList, uploadFile, deleteFile, downloadFile } from '@/api/resource'
import { useUserStore } from '@/stores/user'
import type { ResourceFile } from '@/api/resource'
import dayjs from 'dayjs'
import { Search, Upload, Document, VideoCamera, Picture, Files, Download, Delete, View } from '@element-plus/icons-vue'

const userStore = useUserStore()
const isAdmin = computed(() => userStore.userInfo?.role === 'ADMIN')

const loading = ref(false)
const resources = ref<ResourceFile[]>([])
const total = ref(0)

const query = reactive({
  pageNum: 1,
  pageSize: 10,
  category: '',
  fileType: '',
  keyword: ''
})

const showUploadDialog = ref(false)
const uploading = ref(false)
const uploadRef = ref()
const formRef = ref()

const previewVisible = ref(false)
const previewFile = ref<ResourceFile | null>(null)

const openPreview = (row: ResourceFile) => {
  previewFile.value = row
  previewVisible.value = true
}

const formData = reactive({
  file: null as File | null,
  category: '',
  description: '',
  allowDownload: true
})

const rules = {
  category: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

const formatTime = (time: string) => dayjs(time).format('YYYY-MM-DD')

const formatFileSize = (size: number) => {
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
  return (size / (1024 * 1024)).toFixed(1) + ' MB'
}

const getFileIconColor = (type: string) => {
  const colors: Record<string, string> = {
    VIDEO: '#f56c6c',
    DOCUMENT: '#409eff',
    IMAGE: '#67c23a',
    OTHER: '#909399'
  }
  return colors[type] || '#909399'
}

const getFileTypeTag = (type: string) => {
  const types: Record<string, string> = {
    VIDEO: 'danger',
    DOCUMENT: 'primary',
    IMAGE: 'success',
    OTHER: 'info'
  }
  return types[type] || 'info'
}

const fetchResources = async () => {
  loading.value = true
  try {
    const res = await getResourceList(query)
    resources.value = res.records || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  query.pageNum = 1
  fetchResources()
}

const handleSizeChange = (val: number) => {
  query.pageSize = val
  fetchResources()
}

const handleCurrentChange = (val: number) => {
  query.pageNum = val
  fetchResources()
}

const handleFileChange = (file: any) => {
  formData.file = file.raw
}

const handleUpload = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return
  
  if (!formData.file) {
    ElMessage.warning('请选择文件')
    return
  }
  
  uploading.value = true
  try {
    await uploadFile(formData.file, formData.description, formData.category, formData.allowDownload ? 1 : 0)
    ElMessage.success('上传成功')
    showUploadDialog.value = false
    formData.file = null
    formData.description = ''
    formData.category = ''
    formData.allowDownload = true
    fetchResources()
  } finally {
    uploading.value = false
  }
}

const handleDownload = (row: ResourceFile) => {
  if (Number(row.allowDownload) === 0) {
    ElMessage.warning('该资源不允许下载')
    return
  }
  downloadFile(row.id)
}

const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定删除该资源吗？', '提示', { type: 'warning' })
    await deleteFile(id)
    ElMessage.success('删除成功')
    fetchResources()
  } catch {
    // 用户取消
  }
}

onMounted(fetchResources)
</script>

<style scoped lang="scss">
.resource-page {
  .resource-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    .search-area {
      display: flex;
      gap: 12px;
    }
  }
  
  .file-name {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .file-info {
      display: flex;
      flex-direction: column;
      
      .name {
        font-size: 14px;
        color: #333;
      }
      
      .desc {
        font-size: 12px;
        color: #999;
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
