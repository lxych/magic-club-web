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
                <span class="name">{{ row.originalName }}</span>
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
            <router-link v-if="row.userId" :to="`/user/${row.userId}`" class="uploader-link">
              {{ row.uploaderName }}
            </router-link>
            <span v-else>{{ row.uploaderName }}</span>
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
              v-if="canDelete(row)" 
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
    <el-dialog v-model="showUploadDialog" title="上传资源" width="500px" :close-on-click-modal="!ossUploading">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="80px">
        <el-form-item label="文件" prop="file">
          <el-upload
            ref="uploadRef"
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="1"
            :disabled="ossUploading"
          >
            <el-button type="primary" :disabled="ossUploading">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持图片、视频、文档等多种格式，单文件最大500MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="文件名" prop="fileName">
          <el-input v-model="formData.fileName" placeholder="自定义文件名（不含后缀）" :disabled="ossUploading" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="formData.category" placeholder="选择分类" :disabled="ossUploading">
            <el-option label="社团内部演出" value="INTERNAL_SHOW" />
            <el-option label="社团内部教学" value="INTERNAL_TEACH" />
            <el-option label="外部演出" value="EXTERNAL_SHOW" />
            <el-option label="外部教学" value="EXTERNAL_TEACH" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入文件描述"
            :disabled="ossUploading"
          />
        </el-form-item>

        <!-- OSS 直传进度条 -->
        <el-form-item v-if="ossUploading" label="进度">
          <div class="oss-progress-area">
            <el-progress
              :percentage="Math.round(ossProgress.percent)"
              :stroke-width="16"
              :status="ossProgress.percent >= 100 ? 'success' : undefined"
            />
            <div class="oss-progress-text">{{ ossStatusText }}</div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUploadDialog = false" :disabled="ossUploading">取消</el-button>
        <el-button type="primary" :loading="uploading || ossUploading" @click="handleUpload" :disabled="ossUploading && ossProgress.percent < 100">
          {{ ossUploading ? '上传中...' : '上传' }}
        </el-button>
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
          <video :src="'/api/resource/'+previewFile.id+'/preview'" controls controlslist="nodownload" style="max-width:100%;max-height:70vh"></video>
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
import { getResourceList, uploadFile, deleteFile, downloadFile, getOssStsToken, completeOssUpload } from '@/api/resource'
import { getStsToken, uploadToOss, OSS_DIRECT_UPLOAD_THRESHOLD } from '@/utils/oss-upload'
import type { UploadProgress } from '@/utils/oss-upload'
import { useUserStore } from '@/stores/user'
import type { ResourceFile } from '@/api/resource'
import dayjs from 'dayjs'
import { Search, Upload, Document, VideoCamera, Picture, Files, Download, Delete, View } from '@element-plus/icons-vue'

const userStore = useUserStore()
// 删除权限：本人可删自己的文件，其他人需要 resource:delete
const canDelete = (row: any) =>
  row.userId === userStore.userInfo?.id || userStore.hasPermission('resource:delete')

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

// OSS 直传进度状态
const ossUploading = ref(false)
const ossProgress = ref<UploadProgress>({ uploaded: 0, total: 0, percent: 0 })
const ossStatusText = ref('')

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
  fileName: '',

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
  // 预填文件名（去掉后缀）
  if (!formData.fileName && file.name) {
    formData.fileName = file.name.replace(/\.[^/.]+$/, '')
  }
}

const handleUpload = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return
  
  if (!formData.file) {
    ElMessage.warning('请选择文件')
    return
  }

  const file = formData.file

  // ======== 大文件走 OSS 直传 ========
  if (file.size > OSS_DIRECT_UPLOAD_THRESHOLD) {
    await doOssDirectUpload(file)
    return
  }

  // ======== 小文件走原有上传逻辑 ========
  uploading.value = true
  try {
    await uploadFile(file, formData.description, formData.category, formData.fileName)
    ElMessage.success('上传成功')
    resetUploadDialog()
    fetchResources()
  } finally {
    uploading.value = false
  }
}

/** OSS 直传（大文件） */
const doOssDirectUpload = async (file: File) => {
  ossUploading.value = true
  ossProgress.value = { uploaded: 0, total: file.size, percent: 0 }
  ossStatusText.value = '正在获取上传凭证...'

  try {
    // 1. 获取 STS Token
    const sts: any = await getOssStsToken()
    ossStatusText.value = '正在上传...'

    // 2. 直传 OSS
    const ossUrl = await uploadToOss(file, sts, (progress: UploadProgress) => {
      ossProgress.value = progress
      const pct = progress.percent.toFixed(0)
      const uploadedMB = (progress.uploaded / 1024 / 1024).toFixed(1)
      const totalMB = (progress.total / 1024 / 1024).toFixed(1)
      ossStatusText.value = `正在上传 ${uploadedMB}MB / ${totalMB}MB (${pct}%)`
    })

    ossStatusText.value = '正在保存记录...'

    // 3. 回调后端创建记录
    await completeOssUpload({
      fileName: file.name,
      ossUrl,
      fileSize: file.size,
      description: formData.description,
      category: formData.category
    })

    ElMessage.success('上传成功')
    resetUploadDialog()
    fetchResources()
  } catch (err: any) {
    ElMessage.error(err.message || '上传失败，请重试')
  } finally {
    ossUploading.value = false
    ossStatusText.value = ''
  }
}

const resetUploadDialog = () => {
  showUploadDialog.value = false
  formData.file = null
  formData.description = ''
  formData.fileName = ''
  formData.category = ''
  ossProgress.value = { uploaded: 0, total: 0, percent: 0 }
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
  
  :deep(.el-table) {
    border-radius: 10px;
    overflow: hidden;
  }
  
  .file-name {
    display: flex;
    align-items: center;
    gap: 14px;
    
    :deep(.el-icon) {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    }
    
    .file-info {
      display: flex;
      flex-direction: column;
      
      .name {
        font-size: 14px;
        color: var(--mc-text-primary);
        font-weight: 500;
      }
      
      .desc {
        font-size: 12px;
        color: var(--mc-text-muted);
        margin-top: 2px;
      }
    }
  }
  
  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 24px;
    padding-top: 16px;
  }

  .uploader-link {
    color: var(--mc-primary);
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s;
    
    &:hover {
      color: var(--mc-primary-dark);
      text-decoration: underline;
    }
  }

  /* OSS 直传进度 */
  .oss-progress-area {
    width: 100%;
    .oss-progress-text {
      margin-top: 6px;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
  }
}

/* 移动端适配：上传按钮和搜索栏不溢出 */
@media (max-width: 768px) {
  .resource-page {
    .resource-header {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;

      .search-area {
        flex-wrap: wrap;
        gap: 8px;

        :deep(.el-input) {
          flex: 1;
          min-width: 150px;
        }

        :deep(.el-select) {
          flex: 1;
          min-width: 120px;
        }
      }

      :deep(.el-button) {
        width: 100%;
      }
    }

    :deep(.el-table) {
      font-size: 13px;

      .el-table__body-wrapper {
        overflow-x: auto;
      }
    }
  }
}
</style>
