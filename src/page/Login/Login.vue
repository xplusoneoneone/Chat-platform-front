<template>
  <div class="login-container">
    <div class="login-box">
      <h2 class="title">{{ isLogin ? '登录' : '注册' }}</h2>
      
      <form @submit.prevent="handleSubmit" class="form">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="formData.username"
            type="text"
            placeholder="请输入用户名"
            required
            class="input"
          />
        </div>
        
        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            required
            class="input"
          />
        </div>
        
        <button type="submit" :disabled="loading" class="submit-btn">
          {{ loading ? '处理中...' : (isLogin ? '登录' : '注册') }}
        </button>
      </form>
      
      <div class="switch-mode">
        <span>{{ isLogin ? '还没有账号？' : '已有账号？' }}</span>
        <button @click="toggleMode" class="switch-btn">
          {{ isLogin ? '立即注册' : '立即登录' }}
        </button>
      </div>
      
      <div v-if="message" :class="['message', messageType]">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { login, register } from '@/Api/Login/User'

const router = useRouter()
const isLogin = ref(true)
const loading = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

const formData = reactive({
  username: '',
  password: ''
})

const toggleMode = () => {
  isLogin.value = !isLogin.value
  message.value = ''
  formData.username = ''
  formData.password = ''
}

const handleSubmit = async () => {
  loading.value = true
  message.value = ''
  
  try {
    if (isLogin.value) {
      // 登录
      const response = await login({
        username: formData.username,
        password: formData.password
      })
      message.value = '登录成功！'
      messageType.value = 'success'
      console.log('登录响应:', response)
      
      // 保存 userId 到 localStorage
      // 根据实际返回的数据结构调整，可能是 response.userId、response.data.userId 等
      const userId = response.userId || response.data?.userId || response.id || response.data?.id
      if (userId) {
        localStorage.setItem('userId', String(userId))
        console.log('已保存 userId:', userId)
      } else {
        console.warn('登录响应中未找到 userId，请检查接口返回数据结构')
      }
      
      // 登录成功后跳转到 Post 页面
      setTimeout(() => {
        router.push('/post')
      }, 1000)
    } else {
      // 注册
      const response = await register({
        username: formData.username,
        password: formData.password
      })
      message.value = '注册成功！请登录'
      messageType.value = 'success'
      console.log('注册响应:', response)
      
      // 注册成功后也保存 userId（如果接口返回）
      const userId = response.userId || response.data?.userId || response.id || response.data?.id
      if (userId) {
        localStorage.setItem('userId', String(userId))
        console.log('已保存 userId:', userId)
      }
      
      // 可以自动切换到登录模式
      setTimeout(() => {
        isLogin.value = true
        message.value = ''
      }, 2000)
    }
  } catch (error: any) {
    message.value = error.response?.data?.message || (isLogin.value ? '登录失败，请检查用户名和密码' : '注册失败，请稍后重试')
    messageType.value = 'error'
    console.error('操作失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 24px 20px;
  box-sizing: border-box;
}

.login-box {
  background: white;
  border-radius: 20px 20px 0 0;
  padding: 32px 24px 40px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  position: relative;
}

.title {
  text-align: center;
  margin-bottom: 32px;
  color: #333;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 1px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-group label {
  font-size: 15px;
  color: #333;
  font-weight: 600;
}

.input {
  padding: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 16px;
  transition: border-color 0.2s;
  outline: none;
  background: #f8f9fa;
  width: 100%;
  box-sizing: border-box;
  -webkit-appearance: none;
  appearance: none;
}

.input:focus {
  border-color: #667eea;
  background: white;
}

.submit-btn {
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  margin-top: 8px;
  width: 100%;
  box-sizing: border-box;
  min-height: 52px;
  touch-action: manipulation;
}

.submit-btn:active:not(:disabled) {
  opacity: 0.8;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.switch-mode {
  text-align: center;
  margin-top: 32px;
  color: #666;
  font-size: 15px;
}

.switch-btn {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  margin-left: 8px;
  padding: 4px 8px;
  text-decoration: underline;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.switch-btn:active {
  opacity: 0.7;
}

.message {
  margin-top: 20px;
  padding: 14px 16px;
  border-radius: 12px;
  text-align: center;
  font-size: 14px;
  line-height: 1.5;
}

.message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
</style>

