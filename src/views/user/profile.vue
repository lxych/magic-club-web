<template>
  <div class="profile-page">
    <el-row :gutter="20">
      <!-- 左侧：基本信息 -->
      <el-col :span="8">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>基本信息</span>
              <el-button type="primary" link @click="isEditing = !isEditing">
                {{ isEditing ? '取消' : '编辑' }}
              </el-button>
            </div>
          </template>
          
          <div class="profile-avatar">
            <el-avatar :size="100" :src="userStore.userInfo?.avatar" />
            <el-button v-if="isEditing" type="primary" link @click="showAvatarDialog = true">
              更换头像
            </el-button>
          </div>
          
          <el-form v-if="isEditing" :model="formData" label-width="80px">
            <el-form-item label="用户名">
              <el-input v-model="formData.username" disabled />
            </el-form-item>
            <el-form-item label="真实姓名">
              <el-input v-model="formData.realName" />
            </el-form-item>
            <el-form-item label="昵称">
              <el-input v-model="formData.nickname" placeholder="设置后将以昵称显示" />
            </el-form-item>
            <el-form-item label="性别">
              <el-select v-model="formData.gender">
                <el-option label="未知" :value="0" />
                <el-option label="男" :value="1" />
                <el-option label="女" :value="2" />
              </el-select>
            </el-form-item>
            <el-form-item label="学号">
              <el-input v-model="formData.studentNo" />
            </el-form-item>
            <el-form-item label="入学年份">
              <el-input-number v-model="formData.enrollmentYear" :min="2000" :max="2100" />
            </el-form-item>
            <el-form-item label="电话">
              <el-input v-model="formData.phone" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="formData.email" />
            </el-form-item>
            <el-form-item label="微信">
              <el-input v-model="formData.wechat" />
            </el-form-item>
            <el-form-item label="部门">
              <el-input v-model="formData.department" />
            </el-form-item>
            <el-form-item label="专业">
              <el-input v-model="formData.major" />
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="formData.remark" type="textarea" :rows="3" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
            </el-form-item>
          </el-form>
          
          <div v-else class="profile-info">
            <div class="info-item">
              <span class="label">用户名</span>
              <span class="value">{{ userStore.userInfo?.username }}</span>
            </div>
            <div class="info-item">
              <span class="label">真实姓名</span>
              <span class="value">{{ userStore.userInfo?.realName }}</span>
            </div>
            <div class="info-item">
              <span class="label">昵称</span>
              <span class="value">{{ userStore.userInfo?.nickname || '未设置' }}</span>
            </div>
            <div class="info-item">
              <span class="label">性别</span>
              <span class="value">{{ genderDisplay }}</span>
            </div>
            <div class="info-item">
              <span class="label">学号</span>
              <span class="value">{{ userStore.userInfo?.studentNo }}</span>
            </div>
            <div class="info-item">
              <span class="label">入学年份</span>
              <span class="value">{{ userStore.userInfo?.enrollmentYear }}</span>
            </div>
            <div class="info-item">
              <span class="label">电话</span>
              <span class="value">{{ userStore.userInfo?.phone }}</span>
            </div>
            <div class="info-item">
              <span class="label">邮箱</span>
              <span class="value">{{ userStore.userInfo?.email }}</span>
            </div>
            <div class="info-item">
              <span class="label">部门</span>
              <span class="value">{{ userStore.userInfo?.department }}</span>
            </div>
            <div class="info-item">
              <span class="label">专业</span>
              <span class="value">{{ userStore.userInfo?.major }}</span>
            </div>
            <div class="info-item">
              <span class="label">角色</span>
              <el-tag :type="userStore.userInfo?.role === 'ADMIN' ? 'danger' : 'primary'">
                {{ userStore.userInfo?.roleName }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：修改密码 -->
      <el-col :span="16">
        <el-card shadow="never" title="修改密码">
          <template #header>
            <span>修改密码</span>
          </template>
          
          <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="100px">
            <el-form-item label="原密码" prop="oldPassword">
              <el-input v-model="pwdForm.oldPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input v-model="pwdForm.newPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input v-model="pwdForm.confirmPassword" type="password" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="changingPwd" @click="handleChangePassword">
                修改密码
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <!-- 头像上传对话框 -->
    <el-dialog v-model="showAvatarDialog" title="更换头像" width="400px">
      <div class="avatar-upload-area">
        <img v-if="avatarPreview" :src="avatarPreview" class="avatar-preview-img" />
        <el-upload
          :show-file-list="false"
          :before-upload="handleAvatarUpload"
          accept="image/*"
          :http-request="() => {}"
          drag
        >
          <el-icon class="el-icon--upload"><Plus /></el-icon>
          <div class="el-upload__text">拖拽或点击上传头像</div>
        </el-upload>
      </div>
      <template #footer>
        <el-button @click="showAvatarDialog = false">取消</el-button>
        <el-button type="primary" :loading="uploadingAvatar" :disabled="!avatarUrl" @click="handleUpdateAvatar">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'
import { updateUserInfo, changePassword, uploadAvatar } from '@/api/user'
import type { UserInfo } from '@/api/user'

const userStore = useUserStore()

// 性别映射
const genderMap: Record<number, string> = { 0: '未知', 1: '男', 2: '女' }
const genderDisplay = computed(() => {
  const g = userStore.userInfo?.gender
  return genderMap[Number(g)] ?? '未知'
})

const isEditing = ref(false)
const saving = ref(false)
const showAvatarDialog = ref(false)
const avatarUrl = ref('')
const avatarPreview = ref('')
const uploadingAvatar = ref(false)

const formData = reactive<Partial<UserInfo>>({})

const pwdFormRef = ref()
const changingPwd = ref(false)
const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPassword = (_rule: any, value: string, callback: Function) => {
  if (value !== pwdForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const pwdRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

// 同步用户信息到表单
watch(() => userStore.userInfo, (info) => {
  if (info) {
    Object.assign(formData, {
      username: info.username,
      realName: info.realName,
      nickname: info.nickname || '',
      gender: Number(info.gender),
      studentNo: info.studentNo,
      enrollmentYear: info.enrollmentYear,
      phone: info.phone,
      email: info.email,
      wechat: info.wechat,
      department: info.department,
      major: info.major,
      remark: info.remark
    })
  }
}, { immediate: true })

const handleSave = async () => {
  saving.value = true
  try {
    // 确保 gender 为数字
    const saveData = { ...formData, gender: Number(formData.gender) }
    await updateUserInfo(saveData)
    await userStore.fetchUserInfo()
    ElMessage.success('保存成功')
    isEditing.value = false
  } finally {
    saving.value = false
  }
}

const handleAvatarUpload = async (file: File) => {
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res: any = await request.post('/resource/forum-upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    avatarUrl.value = res.fileUrl
    avatarPreview.value = res.fileUrl
    ElMessage.success('上传成功')
  } catch {
    ElMessage.error('上传失败')
  }
  return false
}

const handleChangePassword = async () => {
  const valid = await pwdFormRef.value?.validate()
  if (!valid) return
  
  changingPwd.value = true
  try {
    await changePassword(pwdForm.oldPassword, pwdForm.newPassword)
    ElMessage.success('密码修改成功')
    pwdForm.oldPassword = ''
    pwdForm.newPassword = ''
    pwdForm.confirmPassword = ''
  } finally {
    changingPwd.value = false
  }
}

const handleUpdateAvatar = async () => {
  if (!avatarUrl.value) {
    ElMessage.warning('请先上传图片')
    return
  }
  
  uploadingAvatar.value = true
  try {
    await uploadAvatar(avatarUrl.value)
    await userStore.fetchUserInfo()
    ElMessage.success('头像更新成功')
    showAvatarDialog.value = false
    avatarUrl.value = ''
    avatarPreview.value = ''
  } finally {
    uploadingAvatar.value = false
  }
}
</script>

<style scoped lang="scss">
.profile-page {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .profile-avatar {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    margin-bottom: 28px;
    padding: 24px 0;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
    border-radius: 12px;
    
    :deep(.el-avatar) {
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.25);
      border: 3px solid #fff;
    }
  }
  
  .profile-info {
    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 0;
      border-bottom: 1px solid var(--mc-border-light);
      transition: background 0.2s;
      
      &:last-child {
        border-bottom: none;
      }
      
      &:hover {
        background: rgba(102, 126, 234, 0.02);
        margin: 0 -16px;
        padding: 14px 16px;
        border-radius: 6px;
      }
      
      .label {
        color: var(--mc-text-secondary);
        font-size: 14px;
        font-weight: 500;
      }
      
      .value {
        color: var(--mc-text-primary);
        font-size: 14px;
      }
    }
  }

  .avatar-upload-area {
    text-align: center;

    .avatar-preview-img {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      margin-bottom: 16px;
      border: 3px solid var(--mc-primary);
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.25);
    }
  }
}

@media (max-width: 768px) {
  .profile-page .el-row {
    display: flex;
    flex-direction: column;
    
    .el-col {
      max-width: 100% !important;
      flex: 0 0 100% !important;
      margin-bottom: 16px;
    }
  }
}
</style>
