<template>
  <div class="register-page">
    <div class="register-box">
      <div class="register-header">
        <el-icon size="48" class="logo-icon"><MagicStick /></el-icon>
        <h1>注册账号</h1>
        <p>加入魔术社团</p>
      </div>
      
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        size="large"
      >
        <el-form-item prop="username">
          <el-input v-model="formData.username" placeholder="用户名" prefix-icon="User" />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="formData.password"
            type="password"
            placeholder="密码"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="formData.confirmPassword"
            type="password"
            placeholder="确认密码"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item prop="realName">
          <el-input v-model="formData.realName" placeholder="真实姓名" prefix-icon="UserFilled" />
        </el-form-item>
        
        <el-form-item prop="studentNo">
          <el-input v-model="formData.studentNo" placeholder="学号" prefix-icon="Document" />
        </el-form-item>
        
        <el-form-item prop="phone">
          <el-input v-model="formData.phone" placeholder="手机号" prefix-icon="Phone" />
        </el-form-item>
        
        <el-form-item prop="email">
          <el-input v-model="formData.email" placeholder="邮箱" prefix-icon="Message" />
        </el-form-item>
        
        <el-form-item prop="inviteCode">
          <el-input 
            v-model="formData.inviteCode" 
            placeholder="邀请码" 
            prefix-icon="Key"
          >
            <template #append>
              <el-tooltip content="请输入管理员提供的邀请码">
                <el-icon><QuestionFilled /></el-icon>
              </el-tooltip>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            class="register-btn"
            @click="handleRegister"
          >
            注册
          </el-button>
        </el-form-item>
        
        <div class="register-options">
          <el-link type="primary" @click="$router.push('/login')">
            已有账号？去登录
          </el-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { register } from '@/api/user'
import { MagicStick, User, Lock, UserFilled, Document, Phone, Message, Key, QuestionFilled } from '@element-plus/icons-vue'

const router = useRouter()

const formRef = ref()
const loading = ref(false)

const formData = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  realName: '',
  studentNo: '',
  phone: '',
  email: '',
  inviteCode: ''
})

const validateConfirmPassword = (_rule: any, value: string, callback: Function) => {
  if (value !== formData.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  studentNo: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  inviteCode: [{ required: true, message: '请输入邀请码', trigger: 'blur' }]
}

const handleRegister = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return
  
  loading.value = true
  try {
    const { confirmPassword: _, ...registerData } = formData
    await register(registerData as any)
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.register-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;

  .register-box {
    width: 100%;
    max-width: 420px;
    padding: 40px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);

    .register-header {
      text-align: center;
      margin-bottom: 30px;

      h1 {
        margin: 16px 0 8px;
        font-size: 24px;
        color: #333;
      }

      p {
        margin: 0;
        font-size: 14px;
        color: #666;
      }

      .logo-icon {
        color: #667eea;
      }
    }

    .el-form {
      .el-input__wrapper {
        padding: 8px 12px;
      }

      .register-btn {
        width: 100%;
        padding: 12px;
        font-size: 16px;
      }
    }

    .register-options {
      margin-top: 20px;
      text-align: center;
    }
  }
}
</style>
