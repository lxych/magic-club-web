<template>
  <div class="alumni-page">
    <!-- 调试信息：显示当前用户角色 -->
    <el-alert 
      v-if="userStore.userInfo" 
      :title="`当前用户: ${userStore.userInfo.username} | 角色: ${userStore.userInfo.role} | 是否管理员: ${isAdmin}`" 
      type="info" 
      :closable="false"
      style="margin-bottom: 16px"
    />
    
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>毕业成员</span>
        </div>
      </template>

      <!-- 搜索栏 -->
      <div class="filter-bar">
        <el-input
          v-model="query.keyword"
          placeholder="搜索姓名/学号/用户名"
          clearable
          style="width: 250px"
          @keyup.enter="fetchMembers"
        />
        <el-button type="primary" @click="fetchMembers">搜索</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </div>
      
      <el-table v-loading="loading" :data="memberList" style="width: 100%">
        <el-table-column label="头像" width="80">
          <template #default="{ row }">
            <el-avatar :size="40" :src="row.avatar" />
          </template>
        </el-table-column>
        <el-table-column label="姓名" prop="realName" width="100" />
        <el-table-column label="用户名" prop="username" width="120" />
        <el-table-column label="性别" width="80">
          <template #default="{ row }">
            {{ row.genderName }}
          </template>
        </el-table-column>
        <el-table-column label="学号" prop="studentNo" width="120" />
        <el-table-column label="入学年份" prop="enrollmentYear" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.isGraduated == 1" type="success">已毕业</el-tag>
            <el-tag v-else type="info">在读</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="毕业年份" prop="graduationYear" width="100">
          <template #default="{ row }">
            {{ row.graduationYear || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="部门" prop="department" />
        <el-table-column label="专业" prop="major" />
        <el-table-column v-if="isAdmin" label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="row.isGraduated != 1" 
              link 
              type="primary" 
              @click="handleMarkGraduated(row)"
            >
              设为毕业
            </el-button>
            <el-button 
              v-else 
              link 
              type="danger" 
              @click="handleCancelGraduated(row)"
            >
              取消毕业
            </el-button>
            <el-button 
              v-if="row.role !== 'ADMIN'" 
              link 
              type="danger" 
              @click="handleForceLogout(row)"
            >
              强制下线
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
import { getUserList, markAsGraduated, cancelGraduated } from '@/api/user'
import { forceLogoutUser } from '@/api/inviteCode'
import { useUserStore } from '@/stores/user'
import type { UserInfo } from '@/api/user'

const userStore = useUserStore()
// 直接使用 role 判断
const isAdmin = computed(() => userStore.userInfo?.role === 'ADMIN')

const loading = ref(false)
const memberList = ref<UserInfo[]>([])
const total = ref(0)

const query = reactive({
  pageNum: 1,
  pageSize: 10,
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
  query.pageSize = 10
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

onMounted(fetchMembers)
</script>

<style scoped lang="scss">
.alumni-page {
  .card-header {
    font-weight: 600;
  }
  
  .filter-bar {
    margin-bottom: 16px;
    display: flex;
    gap: 8px;
  }
  
  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }
}
</style>
