<template>
  <div class="operation-log-page">
    <el-card shadow="never">
      <template #header>
        <span class="title">📝 操作日志</span>
      </template>

      <!-- 筛选区域 -->
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="操作人">
          <el-input
            v-model="filters.username"
            placeholder="搜索用户名"
            clearable
            style="width: 160px"
            @clear="fetchList"
            @keyup.enter="fetchList"
          />
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select
            v-model="filters.action"
            placeholder="全部类型"
            clearable
            style="width: 160px"
            @change="fetchList"
          >
            <el-option
              v-for="(label, key) in ACTION_LABELS"
              :key="key"
              :label="label"
              :value="key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 240px"
            @change="onDateChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchList">
            <el-icon><Search /></el-icon> 查询
          </el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <div class="table-wrap">
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column label="时间" width="160">
          <template #default="{ row }">
            {{ row.createTime?.replace('T', ' ')?.substring(0, 19) }}
          </template>
        </el-table-column>
        <el-table-column prop="username" label="操作人" width="120" />
        <el-table-column label="操作类型" width="110">
          <template #default="{ row }">
            <el-tag :type="tagType(row.action)" size="small">
              {{ ACTION_LABELS[row.action] || row.action }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="target" label="操作对象" min-width="150" show-overflow-tooltip />
        <el-table-column label="详情" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.detail" style="color: var(--mc-text-secondary)">{{ row.detail }}</span>
            <span v-else style="color: #ccc">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP地址" width="140" />
      </el-table>
      </div>

      <el-empty v-if="!loading && tableData.length === 0" description="暂无操作日志" />

      <!-- 分页 -->
      <div style="margin-top: 16px; text-align: right">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, sizes, prev, pager, next"
          :page-sizes="[10, 20, 50, 100]"
          @current-change="fetchList"
          @size-change="fetchList"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { getOperationLogs, ACTION_LABELS, ACTION_COLORS } from '@/api/log'

const loading = ref(false)
const tableData = ref<any[]>([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

const filters = ref({
  username: '',
  action: '',
  startDate: '',
  endDate: ''
})

const dateRange = ref<[string, string] | null>(null)

const tagType = (action: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
  return (ACTION_COLORS[action] as any) || 'info'
}

const fetchList = async () => {
  loading.value = true
  try {
    const params: any = {
      pageNum: pageNum.value,
      pageSize: pageSize.value
    }
    if (filters.value.username) params.username = filters.value.username
    if (filters.value.action) params.action = filters.value.action
    if (filters.value.startDate) params.startDate = filters.value.startDate
    if (filters.value.endDate) params.endDate = filters.value.endDate

    const res: any = await getOperationLogs(params)
    tableData.value = res.records || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

const onDateChange = (val: [string, string] | null) => {
  if (val && val.length === 2) {
    filters.value.startDate = val[0]
    filters.value.endDate = val[1]
  } else {
    filters.value.startDate = ''
    filters.value.endDate = ''
  }
  fetchList()
}

const resetFilters = () => {
  filters.value = { username: '', action: '', startDate: '', endDate: '' }
  dateRange.value = null
  pageNum.value = 1
  fetchList()
}

onMounted(fetchList)
</script>

<style scoped lang="scss">
.operation-log-page {
  .title {
    font-size: 18px;
    font-weight: 600;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .filter-form {
    margin-bottom: 12px;

    :deep(.el-form-item) {
      margin-bottom: 8px;
    }
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
