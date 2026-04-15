<template>
  <div class="memorial-page">
    <!-- 年份选择 -->
    <div class="year-section">
      <div class="year-header">
        <span class="year-label">选择年份</span>
        <el-button v-if="isAdmin" type="primary" size="small" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon> 添加事件
        </el-button>
      </div>
      <div class="year-selector">
        <el-select
          v-model="selectedYears"
          multiple
          collapse-tags
          placeholder="请选择年份"
          style="width: 300px"
        >
          <el-option
            v-for="year in allYears"
            :key="year"
            :label="year + ' 年'"
            :value="year"
          />
        </el-select>
        <el-button 
          v-if="!selectedYears.length" 
          type="primary" 
          plain 
          size="small"
          @click="selectCurrentYear"
        >
          选择今年
        </el-button>
      </div>
    </div>

    <!-- 历史事件内容 -->
    <div v-loading="loading" class="memorial-content">
      <template v-for="year in selectedYears.filter(Boolean)" :key="year">
        <div v-if="memorialsByYear[year]?.length" class="year-group">
          <h2 class="year-title">{{ year }} 年</h2>
          <el-timeline>
            <el-timeline-item
              v-for="item in memorialsByYear[year]"
              :key="item.id"
              :timestamp="formatDate(item.eventDate)"
              placement="top"
            >
              <el-card class="memorial-card" shadow="hover">
                <div class="memorial-header">
                  <h3 class="memorial-title">{{ item.title }}</h3>
                  <el-button 
                    v-if="isAdmin" 
                    type="danger" 
                    link 
                    size="small"
                    @click="handleDelete(item)"
                  >
                    <el-icon><Delete /></el-icon> 删除
                  </el-button>
                </div>
                <div class="memorial-content-text">{{ item.content }}</div>
                <div v-if="item.imageUrls" class="memorial-images">
                  <el-image
                    v-for="(url, index) in parseImages(item.imageUrls)"
                    :key="index"
                    :src="url"
                    :preview-src-list="parseImages(item.imageUrls)"
                    fit="cover"
                    class="memorial-image"
                  />
                </div>
                <div class="memorial-footer">
                  <span class="memorial-author">记录者：{{ item.createByName || '未知' }}</span>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>
      </template>
      <el-empty v-if="!selectedYears.length" description="请选择年份查看历史事件" />
      <el-empty v-else-if="!hasMemorials" description="暂无历史事件记录" />
    </div>

    <!-- 添加事件对话框 -->
    <el-dialog v-model="showAddDialog" title="添加历史事件" width="600px">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="事件标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入事件标题" />
        </el-form-item>
        <el-form-item label="事件日期" prop="eventDate">
          <el-date-picker
            v-model="formData.eventDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="年份" prop="year">
          <el-input-number v-model="formData.year" :min="2000" :max="2100" />
          <span class="form-tip">（可选，默认从日期提取）</span>
        </el-form-item>
        <el-form-item label="事件内容" prop="content">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="4"
            placeholder="请输入事件详细介绍"
          />
        </el-form-item>
        <el-form-item label="附件上传">
          <el-upload
            v-model:file-list="fileList"
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            multiple
            drag
            accept=".jpg,.jpeg,.png,.gif,.doc,.docx,.pdf,.xls,.xlsx"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              拖拽文件到此处或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持图片(JPG/PNG/GIF)、Word、PDF、Excel 文件
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="已上传文件" v-if="uploadedUrls.length">
          <div class="uploaded-files">
            <el-tag 
              v-for="(url, index) in uploadedUrls" 
              :key="index"
              closable
              @close="removeUploadedFile(index)"
              class="file-tag"
            >
              {{ getFileName(url) }}
            </el-tag>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleAdd">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMemorialsByYears, getYears, createMemorial, deleteMemorial, uploadMemorialFiles } from '@/api/memorial'
import { useUserStore } from '@/stores/user'
import type { Memorial } from '@/api/memorial'
import { Plus, Delete, UploadFilled } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const userStore = useUserStore()

const loading = ref(false)
const allYears = ref<number[]>([])
const selectedYears = ref<number[]>([])
const memorialsByYear = ref<Record<number, Memorial[]>>({})
const isAdmin = computed(() => userStore.userInfo?.role === 'ADMIN')
const isInitialized = ref(false) // 标记是否初始化完成

const showAddDialog = ref(false)
const submitting = ref(false)
const formRef = ref()
const fileList = ref<any[]>([])
const uploadedUrls = ref<string[]>([])

const formData = ref({
  title: '',
  content: '',
  eventDate: '',
  year: new Date().getFullYear()
})

const rules = {
  title: [{ required: true, message: '请输入事件标题', trigger: 'blur' }],
  eventDate: [{ required: true, message: '请选择事件日期', trigger: 'change' }],
  content: [{ required: true, message: '请输入事件内容', trigger: 'blur' }]
}

const hasMemorials = computed(() => {
  return Object.values(memorialsByYear.value).some(list => list.length > 0)
})

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD')
}

const parseImages = (urls: string) => {
  return urls ? urls.split(',').map(u => u.trim()).filter(Boolean) : []
}

const fetchYears = async () => {
  try {
    const res = await getYears()
    // 过滤 null 和 undefined
    allYears.value = res.filter((y: number | null) => y != null).sort((a: number, b: number) => b - a)
    // 无数据时，添加当年到列表
    const currentYear = new Date().getFullYear()
    if (allYears.value.length === 0) {
      allYears.value = [currentYear]
    }
    // 默认选中当年或最近的一年
    if (selectedYears.value.length === 0) {
      if (allYears.value.includes(currentYear)) {
        selectedYears.value = [currentYear]
      } else {
        selectedYears.value = [allYears.value[0]]
      }
    }
  } catch {
    // 静默处理，使用当年作为默认值
    allYears.value = [new Date().getFullYear()]
    selectedYears.value = [new Date().getFullYear()]
  }
}

const fetchMemorials = async () => {
  // 初始化完成前不发送请求
  if (!isInitialized.value) return
  
  if (!selectedYears.value.length) {
    memorialsByYear.value = {}
    return
  }
  
  loading.value = true
  try {
    const res = await getMemorialsByYears(selectedYears.value)
    memorialsByYear.value = res || {}
  } finally {
    loading.value = false
  }
}

// 处理文件选择
const handleFileChange = (uploadFile: any) => {
  // 文件已添加到 fileList，不需要额外处理
}

// 处理文件移除
const handleFileRemove = (uploadFile: any) => {
  // 从 fileList 中移除
  const index = fileList.value.indexOf(uploadFile)
  if (index > -1) {
    fileList.value.splice(index, 1)
  }
}

// 移除已上传文件
const removeUploadedFile = (index: number) => {
  uploadedUrls.value.splice(index, 1)
}

// 获取文件名
const getFileName = (url: string) => {
  const parts = url.split('/')
  return parts[parts.length - 1] || url
}

// 上传文件
const uploadFiles = async () => {
  if (fileList.value.length === 0) return []
  
  const files = fileList.value.map((item: any) => item.raw)
  const urls = await uploadMemorialFiles(files)
  return urls
}

const selectCurrentYear = () => {
  const currentYear = new Date().getFullYear()
  // 如果当年在列表中，选中当年
  if (allYears.value.includes(currentYear)) {
    selectedYears.value = [currentYear]
  } else {
    // 否则选中最近的一年
    selectedYears.value = allYears.value.length ? [allYears.value[0]] : []
  }
}

const handleAdd = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return
  
  submitting.value = true
  try {
    // 先上传文件
    let fileUrls: string[] = []
    if (fileList.value.length > 0) {
      fileUrls = await uploadFiles()
    }
    
    const data = {
      ...formData.value,
      imageUrls: fileUrls.join(','),
      year: formData.value.year || (formData.value.eventDate ? parseInt(formData.value.eventDate.split('-')[0]) : undefined)
    }
    const created = await createMemorial(data)
    ElMessage.success('添加成功')
    showAddDialog.value = false
    resetForm()
    
    // 自动选中新添加的年份
    const newYear = created.year || data.year
    if (newYear && !selectedYears.value.includes(newYear)) {
      selectedYears.value.push(newYear)
    }
    
    // 刷新年份列表和数据
    await fetchYears()
    fetchMemorials()
  } catch (error: any) {
    ElMessage.error(error.message || '添加失败')
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  formData.value = {
    title: '',
    content: '',
    eventDate: '',
    year: new Date().getFullYear()
  }
  fileList.value = []
  uploadedUrls.value = []
}

const handleDelete = async (item: Memorial) => {
  try {
    await ElMessageBox.confirm(
      `确定删除 "${item.title}" 吗？`,
      '提示',
      { type: 'warning' }
    )
    await deleteMemorial(item.id)
    ElMessage.success('删除成功')
    fetchMemorials()
  } catch {
    // 取消
  }
}

watch(selectedYears, fetchMemorials, { deep: true })

onMounted(async () => {
  await fetchYears()
  // 标记初始化完成
  isInitialized.value = true
  // 确保有年份数据后才获取纪念事件
  if (selectedYears.value.length > 0) {
    fetchMemorials()
  }
})
</script>

<style scoped lang="scss">
.memorial-page {
  .year-section {
    margin-bottom: 24px;
    padding: 16px;
    background: #fff;
    border-radius: 8px;
    
    .year-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      
      .year-label {
        font-size: 16px;
        font-weight: 600;
        color: #333;
      }
    }
    
    .year-selector {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
  }

  .memorial-content {
    .year-group {
      margin-bottom: 32px;
      
      .year-title {
        font-size: 20px;
        font-weight: 600;
        color: #667eea;
        margin: 0 0 16px;
        padding-bottom: 8px;
        border-bottom: 2px solid #667eea;
      }
    }
    
    .memorial-card {
      .memorial-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
        
        .memorial-title {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #1a1a2e;
          flex: 1;
        }
      }
      
      .memorial-content-text {
        font-size: 14px;
        line-height: 1.6;
        color: #333;
        margin-bottom: 12px;
        white-space: pre-wrap;
      }
      
      .memorial-images {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 12px;
        
        .memorial-image {
          width: 120px;
          height: 120px;
          border-radius: 4px;
          cursor: pointer;
        }
      }
      
      .memorial-footer {
        display: flex;
        justify-content: flex-end;
        
        .memorial-author {
          font-size: 12px;
          color: #999;
        }
      }
    }
  }
  
  .form-tip {
    margin-left: 8px;
    font-size: 12px;
    color: #999;
  }
  
  .uploaded-files {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    
    .file-tag {
      margin-right: 0;
    }
  }
}
</style>
