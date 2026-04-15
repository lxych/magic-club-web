<template>
  <div class="login-page">
    <div class="login-box">
      <div class="login-header">
        <el-icon size="48" class="logo-icon"><MagicStick /></el-icon>
        <h1>Magic Club</h1>
        <p>魔术社团管理系统</p>
      </div>
      
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        size="large"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="formData.username"
            placeholder="用户名"
            prefix-icon="User"
            clearable
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="formData.password"
            type="password"
            placeholder="密码"
            prefix-icon="Lock"
            show-password
            clearable
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            class="login-btn"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
        
        <div class="login-options">
          <el-link type="primary" @click="$router.push('/register')">
            注册账号
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
import { useUserStore } from '@/stores/user'
import { MagicStick, User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref()
const loading = ref(false)

const formData = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return
  
  loading.value = true
  try {
    await userStore.login(formData.username, formData.password)
    ElMessage.success('登录成功')
    router.push('/')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  
  .login-box {
    width: 400px;
    padding: 40px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    
    .login-header {
      text-align: center;
      margin-bottom: 32px;
      
      .logo-icon {
        color: #667eea;
        margin-bottom: 16px;
      }
      
      h1 {
        font-size: 28px;
        color: #1a1a2e;
        margin: 0 0 8px;
      }
      
      p {
        font-size: 14px;
        color: #666;
      }
    }
    
    .login-btn {
      width: 100%;
      height: 44px;
      font-size: 16px;
      border-radius: 8px;
    }
    
    .login-options {
      display: flex;
      justify-content: center;
      margin-top: 16px;
    }
  }
}
</style>
