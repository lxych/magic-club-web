<template>
  <div class="auth-page">
    <div class="cards-container">
      <!-- 登录卡片 -->
      <div 
        class="card-wrapper" 
        :class="{ 'flipped': activeCard === 'login' }"
        @click="flipToLogin"
      >
        <div class="card">
          <!-- 正面 - 登录标题 -->
          <div class="card-face card-front">
            <div class="card-content">
              <el-icon size="64" class="card-icon"><User /></el-icon>
              <h2 class="card-title">登录</h2>
              <p class="card-desc">已有账号？点击登录</p>
            </div>
          </div>
          <!-- 背面 - 登录表单 -->
          <div class="card-face card-back">
            <div class="form-content">
              <h2 class="form-title">欢迎回来</h2>
              <el-form
                ref="loginFormRef"
                :model="loginForm"
                :rules="loginRules"
                size="large"
              >
                <el-form-item prop="username">
                  <el-input 
                    v-model="loginForm.username" 
                    placeholder="用户名" 
                    prefix-icon="User" 
                  />
                </el-form-item>
                <el-form-item prop="password">
                  <el-input 
                    v-model="loginForm.password" 
                    type="password" 
                    placeholder="密码" 
                    prefix-icon="Lock"
                    show-password
                  />
                </el-form-item>
                <el-form-item>
                  <el-button
                    type="primary"
                    :loading="loginLoading"
                    class="submit-btn"
                    @click="handleLogin"
                  >
                    登录
                  </el-button>
                </el-form-item>
              </el-form>
              <p class="switch-tip">
                没有账号？<span class="switch-link" @click.stop="flipToRegister">去注册</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 注册卡片 -->
      <div 
        class="card-wrapper" 
        :class="{ 'flipped': activeCard === 'register' }"
        @click="flipToRegister"
      >
        <div class="card">
          <!-- 正面 - 注册标题 -->
          <div class="card-face card-front">
            <div class="card-content">
              <el-icon size="64" class="card-icon"><Plus /></el-icon>
              <h2 class="card-title">注册</h2>
              <p class="card-desc">新用户？点击注册</p>
            </div>
          </div>
          <!-- 背面 - 注册表单 -->
          <div class="card-face card-back">
            <div class="form-content">
              <h2 class="form-title">加入我们</h2>
              <el-form
                ref="registerFormRef"
                :model="registerForm"
                :rules="registerRules"
                size="large"
              >
                <el-form-item prop="username">
                  <el-input 
                    v-model="registerForm.username" 
                    placeholder="用户名" 
                    prefix-icon="User" 
                  />
                </el-form-item>
                <el-form-item prop="password">
                  <el-input 
                    v-model="registerForm.password" 
                    type="password" 
                    placeholder="密码" 
                    prefix-icon="Lock"
                    show-password
                  />
                </el-form-item>
                <el-form-item prop="confirmPassword">
                  <el-input 
                    v-model="registerForm.confirmPassword" 
                    type="password" 
                    placeholder="确认密码" 
                    prefix-icon="Lock"
                    show-password
                  />
                </el-form-item>
                <el-form-item prop="realName">
                  <el-input 
                    v-model="registerForm.realName" 
                    placeholder="真实姓名" 
                    prefix-icon="UserFilled" 
                  />
                </el-form-item>
                <el-form-item prop="studentNo">
                  <el-input 
                    v-model="registerForm.studentNo" 
                    placeholder="学号" 
                    prefix-icon="Document" 
                  />
                </el-form-item>
                <el-form-item>
                  <el-button
                    type="primary"
                    :loading="registerLoading"
                    class="submit-btn"
                    @click="handleRegister"
                  >
                    注册
                  </el-button>
                </el-form-item>
              </el-form>
              <p class="switch-tip">
                已有账号？<span class="switch-link" @click.stop="flipToLogin">去登录</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { register as registerApi } from '@/api/user'
import { User, Lock, Plus, UserFilled, Document } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const activeCard = ref<'login' | 'register' | null>(null)

// 登录表单
const loginFormRef = ref()
const loginLoading = ref(false)
const loginForm = reactive({
  username: '',
  password: ''
})
const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

// 注册表单
const registerFormRef = ref()
const registerLoading = ref(false)
const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  realName: '',
  studentNo: ''
})

const validateConfirmPassword = (_rule: any, value: string, callback: Function) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const registerRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  studentNo: [{ required: true, message: '请输入学号', trigger: 'blur' }]
}

const flipToLogin = () => {
  activeCard.value = 'login'
}

const flipToRegister = () => {
  activeCard.value = 'register'
}

const handleLogin = async () => {
  const valid = await loginFormRef.value?.validate()
  if (!valid) return
  
  loginLoading.value = true
  try {
    await userStore.login(loginForm.username, loginForm.password)
    ElMessage.success('登录成功')
    router.push('/')
  } finally {
    loginLoading.value = false
  }
}

const handleRegister = async () => {
  const valid = await registerFormRef.value?.validate()
  if (!valid) return
  
  registerLoading.value = true
  try {
    const { confirmPassword: _, ...registerData } = registerForm
    await registerApi(registerData as any)
    ElMessage.success('注册成功')
    flipToLogin()
  } finally {
    registerLoading.value = false
  }
}
</script>

<style scoped lang="scss">
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 20px;
}

.cards-container {
  display: flex;
  gap: 40px;
  perspective: 1200px;
}

.card-wrapper {
  width: 360px;
  height: 480px;
  cursor: pointer;
  
  &.flipped {
    .card {
      transform: rotateY(180deg);
    }
  }
}

.card {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 16px;
  overflow: hidden;
}

.card-front {
  background: linear-gradient(145deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  
  .card-content {
    text-align: center;
    color: white;
    padding: 40px;
    
    .card-icon {
      margin-bottom: 24px;
      color: white;
    }
    
    .card-title {
      font-size: 32px;
      margin: 0 0 16px;
      font-weight: 600;
    }
    
    .card-desc {
      font-size: 16px;
      opacity: 0.9;
      margin: 0;
    }
  }
}

.card-back {
  background: white;
  transform: rotateY(180deg);
  
  .form-content {
    padding: 40px;
    height: 100%;
    display: flex;
    flex-direction: column;
    
    .form-title {
      text-align: center;
      margin: 0 0 24px;
      font-size: 24px;
      color: #333;
    }
    
    .el-form {
      flex: 1;
    }
    
    .submit-btn {
      width: 100%;
      padding: 12px;
      font-size: 16px;
    }
    
    .switch-tip {
      text-align: center;
      margin: 16px 0 0;
      font-size: 14px;
      color: #666;
      
      .switch-link {
        color: #667eea;
        cursor: pointer;
        font-weight: 500;
        
        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
}

/* 悬停效果 */
.card-wrapper:not(.flipped):hover {
  .card {
    transform: translateY(-10px) scale(1.02);
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.4);
  }
}

.card-wrapper.flipped:hover {
  .card {
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.4);
  }
}

/* 响应式 */
@media (max-width: 800px) {
  .cards-container {
    flex-direction: column;
    gap: 20px;
  }
  
  .card-wrapper {
    width: 320px;
    height: 440px;
  }
}
</style>
