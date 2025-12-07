<!--
 * @Author: 徐佳德 1404577549@qq.com
 * @Date: 2025-12-02 20:00:00
 * @LastEditors: 徐佳德 1404577549@qq.com
 * @LastEditTime: 2025-12-03 12:07:50
 * @FilePath: \chat\src\page\User\UserDetail.vue
 * @Description: 用户详情页面
-->
<template>
  <div class="user-detail-page">
    <div class="header">
      <button @click="goBack" class="back-btn">‹ 返回</button>
      <h2 class="title">用户信息</h2>
      <div class="header-placeholder"></div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="userInfo" class="content">
      <!-- 用户头像 -->
      <div class="avatar-section">
        <div class="avatar-container">
          <img 
            v-if="getDisplayAvatarPath(userInfo.avatar)"
            :src="getDisplayAvatarPath(userInfo.avatar)"
            alt="用户头像"
            class="avatar-img"
          />
          <div v-else class="avatar-placeholder">
            {{ userInfo.username?.charAt(0)?.toUpperCase() || 'U' }}
          </div>
        </div>
      </div>

      <!-- 用户信息 -->
      <div class="info-section">
        <div class="info-item">
          <span class="info-label">姓名</span>
          <span class="info-value">{{ userInfo.username || '未设置' }}</span>
        </div>
        
        <div class="info-item">
          <span class="info-label">性别</span>
          <span class="info-value">{{ userInfo.sex || '未设置' }}</span>
        </div>
        
        <div class="info-item">
          <span class="info-label">签名</span>
          <span class="info-value">{{ userInfo.signature || '这个人很懒，什么都没有留下' }}</span>
        </div>
        
        <div class="info-item">
          <span class="info-label">地区</span>
          <span class="info-value">{{ userInfo.location || userInfo.region || '未设置' }}</span>
        </div>
      </div>

      <!-- 添加好友按钮 -->
      <div v-if="!isCurrentUser && !isFriend" class="action-section">
        <button 
          @click="handleAddFriend" 
          :disabled="addingFriend"
          class="add-friend-btn"
        >
          {{ addingFriend ? '添加中...' : '+ 添加好友' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getUserInfo, type UserInfo } from '@/Api/User/User'
import { checkFriend, addFriend, type CheckFriendResponse } from '@/Api/Friend/Friend'
import { normalizeAvatarPath } from '@/utils/avatar'

const router = useRouter()
const route = useRoute()

// 用户信息
interface ExtendedUserInfo extends UserInfo {
  sex?: string
  location?: string
  region?: string
  [key: string]: any
}

const userInfo = ref<ExtendedUserInfo | null>(null)
const loading = ref(false)
const error = ref('')
const addingFriend = ref(false)

// 当前登录用户ID
const currentUserId = computed(() => {
  return localStorage.getItem('userId')
})

// 查看的用户ID
const targetUserId = computed(() => {
  return route.params.userId as string
})

// 是否为当前用户
const isCurrentUser = computed(() => {
  return currentUserId.value === targetUserId.value
})

// 是否为好友
const isFriend = ref(false)
const checkingFriend = ref(false)

// 获取显示用的头像路径
const getDisplayAvatarPath = (avatar: string | undefined): string => {
  return normalizeAvatarPath(avatar)
}

// 加载用户信息
const loadUserInfo = async () => {
  if (!targetUserId.value) {
    error.value = '用户ID不存在'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await getUserInfo(targetUserId.value)
    
    // 处理返回的数据结构
    let userData: ExtendedUserInfo
    if (response.data) {
      userData = response.data
    } else if (response.user) {
      userData = response.user
    } else {
      userData = response as ExtendedUserInfo
    }
    
    userInfo.value = userData
    
    // 检查是否为好友（调用接口）
    await checkIsFriend()
  } catch (err: any) {
    console.error('加载用户信息失败:', err)
    error.value = err.message || '加载用户信息失败'
  } finally {
    loading.value = false
  }
}

// 检查是否为好友
const checkIsFriend = async () => {
  // 如果是当前用户，不需要检查
  if (isCurrentUser.value) {
    isFriend.value = false
    return
  }

  const currentUserId = localStorage.getItem('userId')
  if (!currentUserId || !targetUserId.value) {
    isFriend.value = false
    return
  }

  checkingFriend.value = true
  try {
    const response: CheckFriendResponse = await checkFriend({
      userId: currentUserId,
      friendId: targetUserId.value
    })
    
    // 处理返回的数据结构
    if (response.data?.isFriend !== undefined) {
      isFriend.value = response.data.isFriend
    } else if (response.isFriend !== undefined) {
      isFriend.value = response.isFriend
    } else {
      // 默认不是好友
      isFriend.value = false
    }
  } catch (err: any) {
    console.error('检查好友关系失败:', err)
    // 检查失败时，默认不是好友
    isFriend.value = false
  } finally {
    checkingFriend.value = false
  }
}

// 添加好友
const handleAddFriend = async () => {
  if (!targetUserId.value) {
    return
  }

  const currentUserId = localStorage.getItem('userId')
  if (!currentUserId) {
    alert('请先登录')
    return
  }

  addingFriend.value = true

  try {
    const response = await addFriend({
      userId: currentUserId,
      friendId: targetUserId.value
    })
    
    // 显示成功提示
    alert(response.message || '好友申请已发送')
  } catch (err: any) {
    console.error('添加好友失败:', err)
    const errorMessage = err.response?.data?.message || err.message || '添加好友失败，请重试'
    alert(errorMessage)
  } finally {
    addingFriend.value = false
  }
}

// 返回
const goBack = () => {
  router.back()
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.user-detail-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 80px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #333;
  cursor: pointer;
  padding: 4px 8px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.header-placeholder {
  width: 60px;
}

.loading,
.error {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.error {
  color: #f44336;
}

.content {
  padding: 20px 16px;
}

.avatar-section {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.avatar-container {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  font-size: 48px;
  color: #999;
  font-weight: 600;
}

.info-section {
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 16px;
  color: #666;
  font-weight: 500;
}

.info-value {
  font-size: 16px;
  color: #333;
  text-align: right;
  flex: 1;
  margin-left: 20px;
  word-break: break-word;
}

.action-section {
  padding: 0 16px;
}

.add-friend-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.3s;
}

.add-friend-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.add-friend-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .avatar-container {
    width: 100px;
    height: 100px;
  }

  .avatar-placeholder {
    font-size: 40px;
  }

  .info-item {
    padding: 12px 0;
  }

  .info-label,
  .info-value {
    font-size: 15px;
  }
}
</style>

