<template>
  <div class="audit-page">
    <el-card shadow="never">
      <template #header>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span class="title">📋 资源审批</span>
          <el-radio-group v-model="filterStatus" @change="onFilterChange">
            <el-radio-button :value="0">⏳ 待审批</el-radio-button>
            <el-radio-button :value="1">✅ 已通过</el-radio-button>
            <el-radio-button :value="2">❌ 已驳回</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="originalName" label="文件名" min-width="150" />
        <el-table-column label="预览" width="80">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openPreview(row)">查看</el-button>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="70">
          <template #default="{ row }">
            <el-tag size="small">{{ typeLabel(row.fileType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="大小" width="90">
          <template #default="{ row }">{{ row.fileSizeFormatted }}</template>
        </el-table-column>
        <el-table-column prop="uploaderName" label="上传者" width="90" />
        <el-table-column prop="categoryName" label="分类" width="90" />
        <el-table-column prop="description" label="描述" min-width="100" show-overflow-tooltip />
        <el-table-column label="审批人" width="90">
          <template #default="{ row }">
            <span v-if="row.auditorName" style="color:#666">{{ row.auditorName }}</span>
            <span v-else style="color:#ccc">-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="75">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="上传时间" width="150">
          <template #default="{ row }">{{ row.createTime?.slice(0,16).replace('T',' ') }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" v-if="Number(row.status) === 0" @click="openAuditDialog(row)">
              审批
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && tableData.length===0" :description="'暂无' + statusLabel(filterStatus) + '资源'" />

      <div style="margin-top:16px;text-align:right">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="fetchList"
        />
      </div>
    </el-card>

    <!-- 预览弹窗 -->
    <el-dialog v-model="previewVisible" :title="previewFile?.originalName" width="70%" top="5vh">
      <template v-if="previewFile">
        <div style="margin-bottom:12px;color:#666">
          上传者:{{ previewFile.uploaderName }} | 分类:{{ previewFile.categoryName }} | {{ previewFile.description }}
        </div>
        <!-- 图片 -->
        <div v-if="previewFile.fileType==='IMAGE'" style="text-align:center">
          <img :src="previewSrc" style="max-width:100%;max-height:70vh" />
        </div>
        <!-- 视频 -->
        <div v-else-if="previewFile.fileType==='VIDEO'" style="text-align:center">
          <video :src="previewSrc" controls controlslist="nodownload" style="max-width:100%;max-height:70vh"></video>
        </div>
        <!-- 文档 -->
        <div v-else style="text-align:center">
          <p style="color:#999;margin-bottom:12px">📄 {{ previewFile.originalName }}</p>
          <iframe :src="'/api/resource/'+previewFile.id+'/preview'" style="width:100%;height:60vh;border:1px solid #eee" />
        </div>
      </template>
    </el-dialog>

    <!-- 审批弹窗 -->
    <el-dialog v-model="auditVisible" title="资源审批" width="700px" top="3vh">
      <template v-if="auditRow">
        <!-- 预览区域 -->
        <div style="text-align:center;margin-bottom:16px;background:#f5f7fa;border-radius:8px;padding:12px">
          <img v-if="auditRow.fileType==='IMAGE'" :src="'/api/resource/'+auditRow.id+'/preview'" style="max-width:100%;max-height:300px;border-radius:4px" />
          <video v-else-if="auditRow.fileType==='VIDEO'" :src="'/api/resource/'+auditRow.id+'/preview'" controls controlslist="nodownload" style="max-width:100%;max-height:300px" />
          <div v-else style="padding:20px;color:#666">📄 {{ auditRow.originalName }}</div>
        </div>
        <!-- 信息区域 -->
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="上传者">{{ auditRow.uploaderName }}</el-descriptions-item>
          <el-descriptions-item label="文件名">{{ auditRow.originalName }}</el-descriptions-item>
          <el-descriptions-item label="大小">{{ auditRow.fileSizeFormatted }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ typeLabel(auditRow.fileType) }}</el-descriptions-item>
          <el-descriptions-item label="分类">
            <el-select v-model="auditCategory" size="small" style="width:150px">
              <el-option label="社团内部演出" value="INTERNAL_SHOW" />
              <el-option label="社团内部教学" value="INTERNAL_TEACH" />
              <el-option label="外部演出" value="EXTERNAL_SHOW" />
              <el-option label="外部教学" value="EXTERNAL_TEACH" />
            </el-select>
          </el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ auditRow.description || '无' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 驳回原因 -->
        <div style="margin-top:16px">
          <el-form-item label="驳回原因">
            <el-input
              v-model="rejectReason"
              type="textarea"
              :rows="3"
              placeholder="驳回时请填写原因（通过则无需填写）"
            />
          </el-form-item>
        </div>
      </template>
      <template #footer>
        <el-button @click="auditVisible = false">取消</el-button>
        <el-button type="danger" @click="doAudit(2)">驳回</el-button>
        <el-button type="success" @click="doAudit(1)">通过</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

interface ResourceFile {
  id: string
  originalName: string
  fileType: string
  fileSizeFormatted: string
  uploaderName: string
  auditorName: string
  categoryName: string
  description: string
  createTime: string
  status: number | string
  filePath: string
  fileUrl: string
}

const loading = ref(false)
const tableData = ref<ResourceFile[]>([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const filterStatus = ref(0)

const previewVisible = ref(false)
const previewFile = ref<ResourceFile | null>(null)
const previewSrc = computed(() =>
  previewFile.value ? `/api/resource/${previewFile.value.id}/preview` : ''
)

const openPreview = (row: ResourceFile) => {
  previewFile.value = row
  previewVisible.value = true
}
const downloadPreview = () => {
  if (!previewFile.value) return
  window.open(`/api/resource/${previewFile.value.id}/download`)
}

const typeLabel = (t: string) => {
  const m: Record<string,string> = { IMAGE:'图片', VIDEO:'视频', DOCUMENT:'文档', OTHER:'其他' }
  return m[t] || t
}
const statusLabel = (s: number | string) => ({ 0:'待审批', 1:'已通过', 2:'已驳回' }[Number(s)] || '未知')
const statusTag = (s: number | string) => {
  const m: Record<number,'warning'|'success'|'danger'|'info'> = { 0:'warning', 1:'success', 2:'danger' }
  return m[Number(s)] || 'info'
}

const fetchList = async () => {
  loading.value = true
  try {
    const res: any = await request.get(`/resource/status/${filterStatus.value}`, {
      params: { pageNum: pageNum.value, pageSize: pageSize.value }
    })
    tableData.value = res.records || []
    total.value = Number(res.total) || 0
  } finally {
    loading.value = false
  }
}

const onFilterChange = () => { pageNum.value = 1; fetchList() }

// 审批弹窗相关
const auditVisible = ref(false)
const auditRow = ref<ResourceFile | null>(null)
const auditCategory = ref('')
const rejectReason = ref('')

const openAuditDialog = (row: ResourceFile) => {
  auditRow.value = row
  auditCategory.value = row.category || 'INTERNAL_SHOW'
  rejectReason.value = ''
  auditVisible.value = true
}

const doAudit = async (status: number) => {
  if (!auditRow.value) return
  const id = auditRow.value.id

  if (status === 1) {
    // 只有"社团内部演出"允许下载，其他类型一律不允许
    if (auditCategory.value === 'INTERNAL_SHOW') {
      try {
        await ElMessageBox.confirm('是否允许用户下载该资源？', '下载权限设置', {
          confirmButtonText: '允许',
          cancelButtonText: '不允许',
          distinguishCancelAndClose: true,
          type: 'info'
        })
        await request.post(`/resource/${id}/audit`, null, { params: { status: 1, allowDownload: 1, category: auditCategory.value } })
        ElMessage.success('审核通过（允许下载）')
      } catch (action: any) {
        if (action === 'cancel') {
          await request.post(`/resource/${id}/audit`, null, { params: { status: 1, allowDownload: 0, category: auditCategory.value } })
          ElMessage.success('审核通过（不允许下载）')
        } else {
          return
        }
      }
    } else {
      // 非内部演出，自动不允许下载
      await request.post(`/resource/${id}/audit`, null, { params: { status: 1, allowDownload: 0, category: auditCategory.value } })
      ElMessage.success('审核通过（不允许下载）')
    }
  } else {
    // 驳回 - 必须填写原因
    if (!rejectReason.value || !rejectReason.value.trim()) {
      ElMessage.warning('请填写驳回原因')
      return
    }
    await request.post(`/resource/${id}/audit`, null, { params: { status: 2, reason: rejectReason.value.trim(), category: auditCategory.value } })
    ElMessage.success('已驳回')
  }
  auditVisible.value = false
  fetchList()
}

onMounted(fetchList)
</script>

<style scoped lang="scss">
.audit-page {
  .title {
    font-size: 18px;
    font-weight: 600;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  :deep(.el-card) {
    border: 1px solid var(--mc-border-light) !important;
  }

  :deep(.el-table) {
    border-radius: 10px;
    overflow: hidden;
  }
}
</style>
