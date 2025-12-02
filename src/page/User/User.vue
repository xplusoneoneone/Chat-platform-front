<template>
  <div class="user-page">
    <div class="user-header" @click="goToUpdateInfo">
      <div class="avatar-container">
        <img 
          class="avatar" 
          :src="userInfo?.avatar"
        >
          <span v-if="!userInfo?.avatar">{{ userInfo?.username?.charAt(0) || 'U' }}</span>
        </img>
      </div>
      <div class="user-info">
        <div class="user-name">{{ userInfo?.username || '用户名' }}</div>
        <div class="user-signature">{{ userInfo?.signature || '这个人很懒，什么都没有留下' }}</div>
      </div>
      <div class="arrow-icon">›</div>
    </div>
    
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getUserInfo, type UserInfo } from '@/Api/User/User'

const router = useRouter()

const userInfo = ref<UserInfo | null>(null)
const loading = ref(false)
const error = ref('')

// 从 localStorage 获取用户信息
const getUserInfoFromStorage = (): UserInfo | null => {
  try {
    const stored = localStorage.getItem('userInfo')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('读取用户信息失败:', e)
  }
  return null
}

// 保存用户信息到 localStorage
const saveUserInfoToStorage = (info: UserInfo) => {
  try {
    localStorage.setItem('userInfo', JSON.stringify(info))
  } catch (e) {
    console.error('保存用户信息失败:', e)
  }
}

// 加载用户信息
const loadUserInfo = async () => {
  // 先检查 localStorage
  const storedInfo = getUserInfoFromStorage()
  if (storedInfo) {
    userInfo.value = storedInfo
    console.log('从缓存加载用户信息:', storedInfo)
    return
  }
  
  // 如果没有缓存，调用接口
  loading.value = true
  error.value = ''
  
  try {
    // 从 localStorage 获取 userId
    const userId = localStorage.getItem('userId')
    const response = await getUserInfo(userId || undefined)
    
    // 根据实际返回的数据结构调整
    let info: UserInfo = {}
    if (response.data) {
      info = response.data
    } else if (response.user) {
      info = response.user
    } else {
      info = response
    }
    
    // 处理头像路径，转换为显示格式 /public/image/文件名
    if (info.avatar) {
      // 去掉 /user/ 前缀（如果存在）
      let normalizedPath = info.avatar.replace(/^\/?user\//, '')
      
      // 如果路径是 image\文件名 或 image/文件名，转换为 /public/image/文件名
      if (normalizedPath.startsWith('image\\') || normalizedPath.startsWith('image/')) {
        const fileName = normalizedPath.replace(/^image[\\\/]/, '')
        info.avatar = `/public/image/${fileName}`
      } else if (!normalizedPath.startsWith('/public/image/') && !normalizedPath.startsWith('http')) {
        // 其他情况，尝试提取文件名
        const fileName = normalizedPath.split(/[\\\/]/).pop() || normalizedPath
        info.avatar = `/public/image/${fileName}`
      } else {
        info.avatar = normalizedPath
      }
    }
    
    userInfo.value = info
    // 保存到 localStorage（保存原始路径，不转换）
    saveUserInfoToStorage(info)
    console.log('获取用户信息成功:', info)
  } catch (err: any) {
    error.value = err.response?.data?.message || '获取用户信息失败'
    console.error('获取用户信息失败:', err)
  } finally {
    loading.value = false
  }
}

const goToUpdateInfo = () => {
  router.push('/user/update-info')
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.user-page {
  min-height: 100vh;
  min-height: 100dvh;
  padding-bottom: 70px;
  background: #f5f5f5;
}

.user-header {
  background: white;
  padding: 24px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.user-header:active {
  background-color: #f8f8f8;
}

.arrow-icon {
  font-size: 24px;
  color: #999;
  flex-shrink: 0;
}

.avatar-container {
  flex-shrink: 0;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32px;
  font-weight: 600;
  overflow: hidden;
}

.avatar span {
  position: relative;
  z-index: 1;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-name {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.user-signature {
  font-size: 14px;
  color: #999;
  line-height: 1.5;
}

.loading, .error {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 14px;
}

.error {
  color: #f56c6c;
}
</style>
