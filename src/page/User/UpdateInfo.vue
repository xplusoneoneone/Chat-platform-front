<!--
 * @Author: 徐佳德 1404577549@qq.com
 * @Date: 2025-12-02 16:16:24
 * @LastEditors: 徐佳德 1404577549@qq.com
 * @LastEditTime: 2025-12-02 19:22:22
 * @FilePath: \chat\src\page\User\UpdateInfo.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div class="update-info-page">
    <div class="header">
      <button @click="goBack" class="back-btn">‹ 返回</button>
      <h2 class="title">编辑资料</h2>
      <button @click="handleSave" :disabled="loading" class="save-btn">
        {{ loading ? '保存中...' : '保存' }}
      </button>
    </div>

    <div class="content">
        <!-- 头像编辑 -->
        <div class="form-section">
          <label class="section-label">头像</label>
          <div class="avatar-edit">
            <div 
              class="avatar-preview" 
              @click="triggerAvatarInput"
            >
              <img 
                v-if="avatar" 
                :src="avatar" 
                alt="头像" 
                class="avatar-img"
              />
              <span v-else>{{ formData.username?.charAt(0) || 'U' }}</span>
              <div class="avatar-overlay">
                <div class="edit-icon">📷</div>
              </div>
            </div>
            <input
              ref="avatarInputRef"
              type="file"
              accept="image/*"
              @change="handleAvatarSelect"
              style="display: none"
            />
          </div>
        </div>
      
      <!-- 姓名和性别编辑 -->
      <div class="form-section">
        <div class="form-row">
          <div class="form-item">
            <label class="section-label">姓名</label>
            <input
              v-model="formData.username"
              type="text"
              placeholder="请输入姓名"
              class="form-input"
              maxlength="20"
            />
          </div>
          <div class="form-item">
            <label class="section-label">性别</label>
            <select
              v-model="formData.sex"
              class="form-select"
            >
              <option value="男">男</option>
              <option value="女">女</option>
              <option value="其他">其他</option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- 签名编辑 -->
      <div class="form-section">
        <label class="section-label">签名</label>
        <textarea
          v-model="formData.signature"
          placeholder="请输入个人签名"
          class="form-textarea"
          maxlength="50"
          rows="3"
        ></textarea>
        <div class="char-count">{{ formData.signature?.length || 0 }}/50</div>
      </div>
    </div>
    
    <div v-if="message" :class="['message', messageType]">
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getUserInfo, updateUserInfo, type UserInfo } from '@/Api/User/User'

const router = useRouter()
const avatarInputRef = ref<HTMLInputElement | null>(null)
const loading = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

// 头像单独管理
const avatar = ref('')
const avatarPath = ref('') // 保存时使用的绝对路径

const formData = reactive({
  username: '',
  signature: '',
  sex: 'male'
})

// 处理头像路径，转换为显示路径格式 /public/image/文件名
const getDisplayAvatarPath = (path: string): string => {
  if (!path) return ''
  
  // 如果是 blob URL 或 http URL，直接返回
  if (path.startsWith('blob:') || path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  
  // 去掉 /user/ 前缀（如果存在）
  let normalizedPath = path.replace(/^\/?user\//, '')
  
  // 如果路径是 image\文件名 或 image/文件名，转换为 /public/image/文件名
  if (normalizedPath.startsWith('image\\') || normalizedPath.startsWith('image/')) {
    const fileName = normalizedPath.replace(/^image[\\\/]/, '')
    return `/public/image/${fileName}`
  }
  
  // 如果已经是 /public/image/ 格式，直接返回
  if (normalizedPath.startsWith('/public/image/')) {
    return normalizedPath
  }
  
  // 其他情况，尝试提取文件名
  const fileName = normalizedPath.split(/[\\\/]/).pop() || normalizedPath
  return `/public/image/${fileName}`
}

// 从 localStorage 加载用户信息
const loadUserInfo = () => {
  try {
    const stored = localStorage.getItem('userInfo')
    if (stored) {
      const info = JSON.parse(stored)
      formData.username = info.username || ''
      formData.signature = info.signature || ''
      // 显示路径使用 /public/image/ 格式
      const displayPath = getDisplayAvatarPath(info.avatar || '')
      avatar.value = displayPath
      // 保存路径保持原样（image\文件名）
      avatarPath.value = info.avatar || ''
      formData.sex = info.sex || info.gender || 'male'
    }
  } catch (e) {
    console.error('加载用户信息失败:', e)
  }
}

const goBack = () => {
  router.back()
}

const triggerAvatarInput = () => {
  avatarInputRef.value?.click()
}

const handleAvatarSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  const imageBasePath = 'image'

  if (file && file.type.startsWith('image/')) {
    // 生成预览 URL（用于前端显示）
    const previewUrl = URL.createObjectURL(file)
    avatar.value = previewUrl
    
    // 生成绝对路径（用于保存到后端）
    const fileName = file.name      
    const absolutePath = `${imageBasePath}\\${fileName}`
    avatarPath.value = absolutePath
  }
  
  // 清空 input，允许重复选择同一文件
  if (target) {
    target.value = ''
  }
}

const handleSave = async () => {
  if (!formData.username.trim()) {
    message.value = '请输入姓名'
    messageType.value = 'error'
    setTimeout(() => {
      message.value = ''
    }, 2000)
    return
  }
  
  loading.value = true
  message.value = ''
  
  try {
    const response = await updateUserInfo({
      username: formData.username,
      signature: formData.signature,
      sex: formData.sex,
      avatar: avatarPath.value || avatar.value
    })
    
    // 更新 localStorage 中的用户信息
    const updatedInfo = {
      ...JSON.parse(localStorage.getItem('userInfo') || '{}'),
      username: formData.username,
      signature: formData.signature,
      sex: formData.sex,
      gender: formData.sex, // 兼容旧字段
      avatar: response.data?.avatar || avatarPath.value || avatar.value
    }
    
    // 更新头像显示（如果后端返回了新头像）
    if (response.data?.avatar) {
      const displayPath = getDisplayAvatarPath(response.data.avatar)
      avatar.value = displayPath
      // 保存路径保持原样
      avatarPath.value = response.data.avatar
    }
    localStorage.setItem('userInfo', JSON.stringify(updatedInfo))
    
    message.value = '保存成功！'
    messageType.value = 'success'
    
    setTimeout(() => {
      router.back()
    }, 1000)
  } catch (error: any) {
    message.value = error.response?.data?.message || '保存失败，请稍后重试'
    messageType.value = 'error'
    console.error('保存失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.update-info-page {
  min-height: 100vh;
  min-height: 100dvh;
  background: white;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

.back-btn {
  background: none;
  border: none;
  color: #666;
  font-size: 16px;
  padding: 8px 12px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.back-btn:active {
  opacity: 0.7;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.save-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 20px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.save-btn:active:not(:disabled) {
  opacity: 0.8;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.content {
  flex: 1;
  padding: 20px 16px;
}

.form-section {
  margin-bottom: 24px;
}

.section-label {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.avatar-edit {
  display: flex;
  justify-content: center;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 40px;
  font-weight: 600;
  position: relative;
  cursor: pointer;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-preview span {
  position: relative;
  z-index: 1;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.avatar-preview:active .avatar-overlay {
  opacity: 1;
}

.edit-icon {
  font-size: 32px;
  color: white;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
  outline: none;
  background: #f8f9fa;
  box-sizing: border-box;
  font-family: inherit;
}

.form-input:focus, .form-textarea:focus {
  border-color: #667eea;
  background: white;
}

.form-textarea {
  resize: none;
  min-height: 80px;
}

.char-count {
  text-align: right;
  color: #999;
  font-size: 12px;
  margin-top: 4px;
}

.form-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.form-item {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
  outline: none;
  background: #f8f9fa;
  box-sizing: border-box;
  font-family: inherit;
  color: #333;
  -webkit-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 12px;
  padding-right: 40px;
}

.form-select:focus {
  border-color: #667eea;
  background-color: white;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23667eea' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
}

.message {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 24px;
  text-align: center;
  font-size: 14px;
  z-index: 1000;
  max-width: 80%;
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

