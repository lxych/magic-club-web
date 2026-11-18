<template>
  <div class="announce-page">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <span class="title">📢 发送公告</span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
        label-position="left"
      >
        <el-form-item label="公告标题" prop="title">
          <el-input
            v-model="form.title"
            placeholder="请输入公告标题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="公告内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="6"
            placeholder="请输入公告内容"
            maxlength="2000"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="图片">
          <el-upload
            v-model:file-list="imageList"
            list-type="picture-card"
            :auto-upload="false"
            :limit="9"
            accept="image/*"
            :on-exceed="() => ElMessage.warning('最多9张图片')"
            :on-preview="handleImagePreview"
            :on-change="onImageChange"
            :on-remove="onImageRemove"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">支持 jpg/png/gif，最多9张</div>
        </el-form-item>

        <el-form-item label="附件">
          <el-upload
            v-model:file-list="fileList"
            :auto-upload="false"
            :limit="5"
            :on-exceed="() => ElMessage.warning('最多5个附件')"
            :on-change="onFileChange"
            :on-remove="onFileRemove"
          >
            <el-button type="primary" plain size="small">
              <el-icon><Upload /></el-icon> 选择文件
            </el-button>
          </el-upload>
          <div class="upload-tip">最多5个附件</div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="submitting"
            :disabled="ossUploading"
            @click="handleSubmit"
          >
            {{ ossUploading ? '上传中...' : '发布公告' }}
          </el-button>
          <el-button @click="handleReset" :disabled="ossUploading">重置</el-button>
        </el-form-item>

        <!-- OSS 直传进度提示 -->
        <el-form-item v-if="ossUploading" label="上传进度">
          <div class="oss-progress-area">
            <el-progress
              :percentage="Math.round(ossProgress.percent)"
              :stroke-width="14"
            />
            <div class="oss-progress-text">{{ ossStatusText }}</div>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <el-dialog v-model="previewVisible" width="60%" append-to-body>
      <img :src="previewUrl" alt="预览" style="width: 100%; display: block" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Upload } from '@element-plus/icons-vue'
import type { FormInstance, FormRules, UploadFile, UploadRawFile } from 'element-plus'
import request from '@/utils/request'
import { getStsToken, uploadToOss, OSS_DIRECT_UPLOAD_THRESHOLD } from '@/utils/oss-upload'
import type { UploadProgress } from '@/utils/oss-upload'

const formRef = ref<FormInstance>()
const submitting = ref(false)

const form = ref({
  title: '',
  content: ''
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入公告标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入公告内容', trigger: 'blur' }]
}

const imageList = ref<UploadFile[]>([])
const fileList = ref<UploadFile[]>([])
const imageRawFiles = ref<File[]>([])
const fileRawFiles = ref<File[]>([])

const previewVisible = ref(false)
const previewUrl = ref('')

// OSS 直传状态
const ossUploading = ref(false)
const ossProgress = ref<UploadProgress>({ uploaded: 0, total: 0, percent: 0 })
const ossStatusText = ref('')

const handleImagePreview = (file: UploadFile) => {
  previewUrl.value = file.url || ''
  previewVisible.value = true
}

const onImageChange = (file: UploadFile) => {
  if (file.raw) imageRawFiles.value.push(file.raw)
}
const onImageRemove = (file: UploadFile) => {
  const idx = imageRawFiles.value.indexOf(file.raw as File)
  if (idx >= 0) imageRawFiles.value.splice(idx, 1)
}
const onFileChange = (file: UploadFile) => {
  if (file.raw) fileRawFiles.value.push(file.raw)
}
const onFileRemove = (file: UploadFile) => {
  const idx = fileRawFiles.value.indexOf(file.raw as File)
  if (idx >= 0) fileRawFiles.value.splice(idx, 1)
}

const handleSubmit = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const fd = new FormData()
    fd.append('title', form.value.title)
    fd.append('content', form.value.content)

    // 分离小文件和大文件
    const smallFiles: File[] = []
    const largeFiles: File[] = []

    const allFiles = [...imageRawFiles.value, ...fileRawFiles.value]
    for (const f of allFiles) {
      if (f.size > OSS_DIRECT_UPLOAD_THRESHOLD) {
        largeFiles.push(f)
      } else {
        smallFiles.push(f)
      }
    }

    // 小文件走原有的 FormData 上传
    smallFiles.forEach(f => fd.append('files', f))

    // 大文件走 OSS 直传
    if (largeFiles.length > 0) {
      ossUploading.value = true
      ossStatusText.value = '正在获取上传凭证...'

      // 获取 STS Token
      const stsRes = await request.get('/oss/sts-token')
      const sts = stsRes as any

      for (let i = 0; i < largeFiles.length; i++) {
        const f = largeFiles[i]
        ossStatusText.value = `正在上传大文件 (${i + 1}/${largeFiles.length}): ${f.name}`

        const ossUrl = await uploadToOss(f, sts, (progress: UploadProgress) => {
          ossProgress.value = progress
          const pct = progress.percent.toFixed(0)
          const uploadedMB = (progress.uploaded / 1024 / 1024).toFixed(1)
          const totalMB = (progress.total / 1024 / 1024).toFixed(1)
          ossStatusText.value = `${f.name}: ${uploadedMB}MB / ${totalMB}MB (${pct}%)`
        })

        // 将 OSS URL 作为额外的参数
        fd.append('ossUrls', ossUrl)
      }

      ossUploading.value = false
      ossStatusText.value = '大文件已上传，正在提交公告...'
    }

    await request.post('/notification/announce', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    ElMessage.success('公告已发送')
    handleReset()
  } catch {
    // error handled by interceptor
  } finally {
    submitting.value = false
    ossUploading.value = false
  }
}

const handleReset = () => {
  form.value.title = ''
  form.value.content = ''
  imageList.value = []
  fileList.value = []
  imageRawFiles.value = []
  fileRawFiles.value = []
}
</script>

<style scoped lang="scss">
.announce-page {
  .page-header .title {
    font-size: 18px;
    font-weight: 600;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .upload-tip {
    font-size: 12px;
    color: #999;
    margin-top: 4px;
  }
  .oss-progress-area {
    width: 100%;
    .oss-progress-text {
      margin-top: 4px;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
  }
}
</style>
