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
            <span v-else style="color:#ccc">—</span>
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
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <template v-if="Number(row.status) === 0">
              <el-button type="success" size="small" @click="handleAudit(row.id,1)">通过</el-button>
              <el-button type="danger" size="small" @click="handleAudit(row.id,2)">驳回</el-button>
            </template>
            <template v-else-if="Number(row.status) === 2">
              <el-button type="primary" size="small" @click="handleAudit(row.id,0)">重新待审</el-button>
            </template>
            <template v-else>
              <span style="color:#999;font-size:12px">—</span>
            </template>
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
          上传者：{{ previewFile.uploaderName }}　｜　分类：{{ previewFile.categoryName }}　｜　{{ previewFile.description }}
        </div>
        <!-- 图片 -->
        <div v-if="previewFile.fileType==='IMAGE'" style="text-align:center">
          <img :src="previewSrc" style="max-width:100%;max-height:70vh" />
        </div>
        <!-- 视频 -->
        <div v-else-if="previewFile.fileType==='VIDEO'" style="text-align:center">
          <video :src="previewSrc" controls style="max-width:100%;max-height:70vh"></video>
        </div>
        <!-- 文档 -->
        <div v-else style="text-align:center">
          <p style="color:#999;margin-bottom:12px">📄 {{ previewFile.originalName }}</p>
          <iframe :src="'/api/resource/'+previewFile.id+'/preview'" style="width:100%;height:60vh;border:1px solid #eee" />
        </div>
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
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

const onFilterChange = () => { pageNum.value = 1; fetchList() }

const handleAudit = async (id: string, status: number) => {
  const labels: Record<number,string> = { 0:'重新设为待审批', 1:'通过', 2:'驳回' }
  try {
    await ElMessageBox.confirm(`确定${labels[status]}该资源？`, '审批确认', { type: 'warning' })
    await request.post(`/resource/${id}/audit`, null, { params: { status } })
    ElMessage.success('操作成功')
    fetchList()
  } catch { /* cancel */ }
}

onMounted(fetchList)
</script>

<style scoped lang="scss">
.title { font-size: 18px; font-weight: 600; }
</style>
