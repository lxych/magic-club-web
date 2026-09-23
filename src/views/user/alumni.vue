<template>
  <div class="alumni-page">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">🎓 花名册</span>
          <span class="count">共 {{ total }} 人</span>
        </div>
      </template>

      <!-- 搜索栏 -->
      <div class="filter-bar">
        <el-input
          v-model="query.keyword"
          placeholder="搜索姓名/学号/用户名"
          clearable
          style="max-width: 280px"
          @keyup.enter="fetchMembers"
        >
          <template #prefix>
            <span style="color:var(--el-color-primary)">🔍</span>
          </template>
        </el-input>
        <el-button type="primary" @click="fetchMembers">搜索</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </div>

      <!-- 名片网格 -->
      <div v-loading="loading" class="card-grid" element-loading-text="加载中...">
        <div
          v-for="member in memberList"
          :key="member.id"
          class="member-card"
          :class="{ graduated: member.isGraduated == 1 }"
          @click="selected = selected?.id === member.id ? null : member"
        >
          <!-- 卡片顶部色条 -->
          <div class="card-accent" :class="member.isGraduated == 1 ? 'gradient-gold' : 'gradient-primary'"></div>

          <!-- 头像区 -->
          <div class="card-avatar">
            <el-avatar :size="60" :src="member.avatar">
              {{ (member.realName || member.username)?.[0]?.toUpperCase() }}
            </el-avatar>
            <el-tag
              :type="member.isGraduated == 1 ? 'success' : ''"
              size="small"
              class="status-tag"
            >
              {{ member.isGraduated == 1 ? '🎓 已毕业' : '📖 在读' }}
            </el-tag>
          </div>

          <!-- 姓名 -->
          <div class="card-name">{{ member.realName || member.username }}</div>
          <div class="card-username">@{{ member.username }}</div>

          <!-- 信息条 -->
          <div class="card-info">
            <div v-if="member.department" class="info-row">
              <span class="info-icon">🏢</span>
              <span>{{ member.department }}</span>
            </div>
            <div v-if="member.major" class="info-row">
              <span class="info-icon">📚</span>
              <span>{{ member.major }}</span>
            </div>
            <div class="info-row">
              <span class="info-icon">🎫</span>
              <span>{{ member.studentNo || '未填写' }}</span>
            </div>
            <div class="info-row">
              <span class="info-icon">📅</span>
              <span>
                {{ member.enrollmentYear || '?' }} 级
                <template v-if="member.graduationYear">
                  → {{ member.graduationYear }} 毕业
                </template>
              </span>
            </div>
          </div>

          <!-- 选中时展开操作按钮 -->
          <transition name="el-zoom-in-top">
            <div v-if="selected?.id === member.id && isAdmin" class="card-actions">
              <el-button
                v-if="member.isGraduated != 1"
                size="small"
                type="primary"
                plain
                @click.stop="handleMarkGraduated(member)"
              >
                设为毕业
              </el-button>
              <el-button
                v-else
                size="small"
                type="success"
                plain
                @click.stop="handleCancelGraduated(member)"
              >
                取消毕业
              </el-button>
              <el-button
                v-if="member.role !== 'ADMIN'"
                size="small"
                type="danger"
                plain
                @click.stop="handleForceLogout(member)"
              >
                强制下线
              </el-button>
              <el-button
                v-if="member.role !== 'ADMIN'"
                size="small"
                type="warning"
                plain
                @click.stop="handleCancelUser(member)"
              >
                注销
              </el-button>
            </div>
          </transition>
        </div>

        <el-empty v-if="!loading && memberList.length === 0" description="暂无成员" />
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="query.pageNum"
          v-model:page-size="query.pageSize"
          :page-sizes="[8, 12, 20]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 设为毕业对话框 -->
    <el-dialog v-model="showDialog" title="设为毕业成员" width="400px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="姓名">
          <el-input v-model="form.realName" disabled />
        </el-form-item>
        <el-form-item label="毕业年份" prop="graduationYear">
          <el-date-picker
            v-model="form.graduationYear"
            type="year"
            placeholder="选择年份"
            value-format="YYYY"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserList, markAsGraduated, cancelGraduated, cancelUser } from '@/api/user'
import { forceLogoutUser } from '@/api/inviteCode'
import { useUserStore } from '@/stores/user'
import type { UserInfo } from '@/api/user'

const userStore = useUserStore()
const isAdmin = computed(() => userStore.userInfo?.role === 'ADMIN')

const loading = ref(false)
const memberList = ref<UserInfo[]>([])
const total = ref(0)
const selected = ref<UserInfo | null>(null)

const query = reactive({
  pageNum: 1,
  pageSize: 12,
  keyword: ''
})

// 对话框
const showDialog = ref(false)
const submitting = ref(false)
const formRef = ref()
const form = reactive({
  id: '',
  realName: '',
  graduationYear: ''
})
const rules = {
  graduationYear: [{ required: true, message: '请选择毕业年份', trigger: 'change' }]
}

const fetchMembers = async () => {
  loading.value = true
  selected.value = null
  try {
    const res = await getUserList({
      pageNum: query.pageNum,
      pageSize: query.pageSize,
      keyword: query.keyword || undefined
    })
    memberList.value = res.records || []
    total.value = Number(res.total) || 0
  } catch (error: any) {
    ElMessage.error(error.message || '获取成员列表失败')
  } finally {
    loading.value = false
  }
}

const resetQuery = () => {
  query.pageNum = 1
  query.pageSize = 12
  query.keyword = ''
  fetchMembers()
}

const handleSizeChange = (val: number) => {
  query.pageSize = val
  fetchMembers()
}

const handleCurrentChange = (val: number) => {
  query.pageNum = val
  fetchMembers()
}

const handleMarkGraduated = (row: UserInfo) => {
  form.id = row.id
  form.realName = row.realName || row.username
  form.graduationYear = new Date().getFullYear().toString()
  showDialog.value = true
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return

  submitting.value = true
  try {
    await markAsGraduated(form.id, parseInt(form.graduationYear))
    ElMessage.success('设置成功')
    showDialog.value = false
    fetchMembers()
  } catch (error: any) {
    ElMessage.error(error.message || '设置失败')
  } finally {
    submitting.value = false
  }
}

const handleCancelGraduated = async (row: UserInfo) => {
  try {
    await ElMessageBox.confirm(
      `确定取消 "${row.realName || row.username}" 的毕业标记吗？`,
      '提示',
      { type: 'warning' }
    )
    await cancelGraduated(row.id)
    ElMessage.success('取消毕业标记成功')
    fetchMembers()
  } catch {
    // 取消
  }
}

const handleForceLogout = async (row: UserInfo) => {
  try {
    await ElMessageBox.confirm(
      `确定强制下线 "${row.realName || row.username}" 吗？\n此操作将：\n1. 禁止该用户登录\n2. 作废当前邀请码\n3. 需设置新邀请码才能注册新用户`,
      '警告',
      { type: 'warning' }
    )
    await forceLogoutUser(row.id)
    ElMessage.success('用户已被强制下线，邀请码已作废')
    fetchMembers()
  } catch {
    // 取消
  }
}

const handleCancelUser = async (row: UserInfo) => {
  try {
    await ElMessageBox.confirm(
      '确定要注销该用户吗？注销后该账号将无法登录',
      '注销确认',
      { type: 'warning' }
    )
    await cancelUser(row.id)
    ElMessage.success('用户已注销')
    fetchMembers()
  } catch {
    // 取消
  }
}

onMounted(fetchMembers)
</script>

<style scoped lang="scss">
.alumni-page {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .title {
      font-weight: 600;
      font-size: 18px;
    }
    .count {
      color: var(--el-text-color-secondary);
      font-size: 14px;
    }
  }

  .filter-bar {
    margin-bottom: 24px;
    display: flex;
    gap: 12px;
    padding: 16px;
    background: var(--mc-bg-tertiary, #f8f9fc);
    border-radius: 12px;
  }

  // 名片网格
  .card-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;

    .member-card {
      position: relative;
      background: #fff;
      border-radius: 16px;
      padding: 0 0 16px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
      }

      &.graduated {
        // 已毕业轻微透明
      }
    }

    // 顶部渐变条
    .card-accent {
      height: 4px;

      &.gradient-primary {
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      }
      &.gradient-gold {
        background: linear-gradient(90deg, #f5af19 0%, #f12711 100%);
      }
    }

    // 头像区域
    .card-avatar {
      display: flex;
      flex-direction: column;
      align-items: center;

      :deep(.el-avatar) {
        border: 3px solid #fff;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
      }

      .status-tag {
        margin-top: 8px;
      }
    }

    .card-name {
      text-align: center;
      font-size: 16px;
      font-weight: 600;
      margin-top: 8px;
      color: var(--el-text-color-primary);
    }

    .card-username {
      text-align: center;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-bottom: 12px;
    }

    // 信息条
    .card-info {
      padding: 0 16px;

      .info-row {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: var(--el-text-color-regular);
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        .info-icon {
          flex-shrink: 0;
          font-size: 13px;
        }

        span:last-child {
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }

    // 操作按钮区
    .card-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      justify-content: center;
      padding: 12px 16px 0;
      border-top: 1px solid #f0f0f0;
      margin-top: 12px;
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 24px;
    padding-top: 16px;
  }
}

// 手机端：全竖向排列
@media (max-width: 768px) {
  .alumni-page {
    .card-grid {
      grid-template-columns: 1fr;
    }

    .filter-bar {
      flex-direction: column;

      .el-input {
        max-width: 100% !important;
      }
    }
  }
}

// 平板：两列
@media (min-width: 769px) and (max-width: 1024px) {
  .alumni-page .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

// 中屏：三列
@media (min-width: 1025px) and (max-width: 1400px) {
  .alumni-page .card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
