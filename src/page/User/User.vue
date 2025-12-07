<template>
  <div class="user-page">
    <!-- 头部信息 -->
    <div class="user-header" @click="goToUpdateInfo">
      <div class="avatar-container">
        <img 
          v-if="userInfo?.avatar"
          class="avatar" 
          :src="userInfo.avatar"
          alt="用户头像"
        >
        <div v-else class="avatar-placeholder">
          {{ userInfo?.username?.charAt(0)?.toUpperCase() || 'U' }}
        </div>
      </div>
      <div class="user-info">
        <div class="user-name">{{ userInfo?.username || '用户名' }}</div>
        <div class="user-signature">{{ userInfo?.signature || '这个人很懒，什么都没有留下' }}</div>
        
      </div>
      <div class="arrow-icon">›</div>
    </div>

    <!-- 个人信息列表 -->
    <div class="info-list">
      <div class="info-item" @click="editNickname">
        <span class="label">昵称</span>
        <div class="value">{{ userInfo?.nickname || userInfo?.username || '未设置' }}</div>
        <div class="arrow">›</div>
      </div>
      
      <div class="info-item" @click="editSignature">
        <span class="label">个性签名</span>
        <div class="value">{{ userInfo?.signature || '未设置' }}</div>
        <div class="arrow">›</div>
      </div>
      
        <div class="info-item" @click="editGender">
          <span class="label">性别</span>
          <div class="value">{{ getGenderText(userInfo?.gender) }}</div>
          <div class="arrow">›</div>
        </div>
      
      <div class="info-item" @click="editLocation">
        <span class="label">地区</span>
        <div class="value">{{ userInfo?.location || '未设置' }}</div>
        <div class="arrow">›</div>
      </div>
    </div>

    <!-- 设置选项 -->
    <div class="settings-list">
      <h3 class="section-title">账号设置</h3>
      <div class="setting-item" @click="changePassword">
        <span class="label">修改密码</span>
        <div class="arrow">›</div>
      </div>
      
      <div class="setting-item" @click="privacySettings">
        <span class="label">隐私设置</span>
        <div class="arrow">›</div>
      </div>
      
      <div class="setting-item" @click="notificationSettings">
        <span class="label">通知设置</span>
        <div class="arrow">›</div>
      </div>
      
      <div class="setting-item" @click="themeSettings">
        <span class="label">主题</span>
        <div class="value">{{ getThemeText() }}</div>
        <div class="arrow">›</div>
      </div>
    </div>

    <!-- 退出登录 -->
    <div class="logout-section">
      <button class="logout-btn" @click="logout">
        退出登录
      </button>
    </div>

    <!-- 加载和错误状态 -->
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <!-- 编辑弹窗 -->
    <Transition name="fade">
      <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">{{ editModalTitle }}</h3>
            <button class="modal-close" @click="closeEditModal">×</button>
          </div>
          <div class="modal-body">
            <!-- 文本输入类型 -->
            <template v-if="editModalType === 'text'">
              <input
                v-if="editModalField === 'nickname'"
                v-model="editModalValue"
                type="text"
                placeholder="请输入昵称"
                class="modal-input"
                maxlength="20"
                ref="editInputRef"
              />
              <textarea
                v-else-if="editModalField === 'signature'"
                v-model="editModalValue"
                placeholder="请输入个性签名"
                class="modal-textarea"
                maxlength="50"
                rows="3"
                ref="editInputRef"
              />
              <input
                v-else
                v-model="editModalValue"
                type="text"
                :placeholder="`请输入${editModalTitle}`"
                class="modal-input"
                ref="editInputRef"
              />
              <div v-if="editModalField === 'signature'" class="char-count">
                {{ editModalValue.length }}/50
              </div>
            </template>
            
            <!-- 选择器类型 -->
            <template v-else-if="editModalType === 'select'">
              <div class="select-options">
                <div
                  v-for="(option, index) in editModalOptions"
                  :key="index"
                  class="select-option"
                  :class="{ active: editModalValue === option.value }"
                  @click="selectOption(option.value)"
                >
                  <span>{{ option.label }}</span>
                  <span v-if="editModalValue === option.value" class="check-icon">✓</span>
                </div>
              </div>
            </template>
          </div>
          <div class="modal-footer">
            <button class="modal-btn cancel-btn" @click="closeEditModal">取消</button>
            <button class="modal-btn confirm-btn" @click="confirmEdit">确定</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { getUserInfo, updateUserInfo, type UserInfo } from '@/Api/User/User'
import { normalizeAvatarPath } from '@/utils/avatar'

const router = useRouter()

// 用户信息
interface ExtendedUserInfo extends UserInfo {
  postCount?: number
  followingCount?: number
  followerCount?: number
  nickname?: string
  gender?: string
  location?: string
}

const userInfo = ref<ExtendedUserInfo | null>(null)
const loading = ref(false)
const error = ref('')
const theme = ref(localStorage.getItem('theme') || 'light')

// 弹窗相关状态
const showEditModal = ref(false)
const editModalType = ref<'text' | 'select'>('text')
const editModalTitle = ref('')
const editModalField = ref('')
const editModalValue = ref('')
const editModalOptions = ref<Array<{ label: string; value: string }>>([])
const editInputRef = ref<HTMLInputElement | HTMLTextAreaElement | null>(null)

// 从localStorage获取用户信息
const getUserInfoFromStorage = (): ExtendedUserInfo | null => {
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

// 保存用户信息到localStorage
const saveUserInfoToStorage = (info: ExtendedUserInfo) => {
  try {
    localStorage.setItem('userInfo', JSON.stringify(info))
  } catch (e) {
    console.error('保存用户信息失败:', e)
  }
}

// 加载用户信息
const loadUserInfo = async () => {
  // 先检查缓存
  const storedInfo = getUserInfoFromStorage()
  if (storedInfo) {
    userInfo.value = storedInfo
    console.log('从缓存加载用户信息:', storedInfo)
    // 如果缓存有数据，也请求最新数据
    await fetchLatestUserInfo()
    return
  }
  
  // 如果没有缓存，直接请求
  await fetchLatestUserInfo()
}

// 获取最新用户信息
const fetchLatestUserInfo = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const userId = localStorage.getItem('userId')
    const response = await getUserInfo(userId || undefined)
    
    let info: ExtendedUserInfo = {}
    if (response.data) {
      info = response.data
    } else if (response.user) {
      info = response.user
    } else {
      info = response as ExtendedUserInfo
    }
    
    // 处理头像路径
    if (info.avatar) {
      info.avatar = normalizeAvatarPath(info.avatar)
    }
    
    // 确保有默认值
    info = {
      ...info,
      postCount: info.postCount || 0,
      followingCount: info.followingCount || 0,
      followerCount: info.followerCount || 0,
      nickname: info.nickname || info.username,
      gender: info.gender || info.sex || 'secret',
      location: info.location || ''
    }
    
    userInfo.value = info
    saveUserInfoToStorage(info)
    console.log('获取用户信息成功:', info)
  } catch (err: any) {
    error.value = err.response?.data?.message || '获取用户信息失败'
    console.error('获取用户信息失败:', err)
  } finally {
    loading.value = false
  }
}


// 获取性别文本
const getGenderText = (gender?: string): string => {
  switch (gender) {
    case '男': return '男'
    case '女': return '女'
    case '保密': return '保密'
    default: return '未设置'
  }
}

// 获取主题文本
const getThemeText = (): string => {
  switch (theme.value) {
    case 'light': return '浅色'
    case 'dark': return '深色'
    case 'auto': return '跟随系统'
    default: return '浅色'
  }
}

// 编辑相关函数
const goToUpdateInfo = () => {
  router.push('/user/update-info')
}

// 打开编辑弹窗
const openEditModal = (type: 'text' | 'select', field: string, title: string, options?: Array<{ label: string; value: string }>) => {
  editModalType.value = type
  editModalField.value = field
  editModalTitle.value = title
  editModalOptions.value = options || []
  
  // 设置当前值
  if (type === 'text') {
    editModalValue.value = userInfo.value?.[field as keyof ExtendedUserInfo] as string || ''
  } else if (type === 'select' && options) {
    const currentValue = userInfo.value?.[field as keyof ExtendedUserInfo] as string || ''
    editModalValue.value = currentValue
  }
  
  showEditModal.value = true
  
  // 聚焦输入框
  nextTick(() => {
    if (editInputRef.value) {
      editInputRef.value.focus()
      if (editInputRef.value instanceof HTMLInputElement || editInputRef.value instanceof HTMLTextAreaElement) {
        editInputRef.value.select()
      }
    }
  })
}

// 关闭编辑弹窗
const closeEditModal = () => {
  showEditModal.value = false
  editModalValue.value = ''
}

// 选择选项（用于选择器类型）
const selectOption = (value: string) => {
  editModalValue.value = value
}

// 确认编辑
const confirmEdit = () => {
  if (editModalType.value === 'text') {
    const value = editModalValue.value.trim()
    if (editModalField.value === 'nickname' && !value) {
      return
    }
    updateUserField(editModalField.value, value)
  } else if (editModalType.value === 'select') {
    updateUserField(editModalField.value, editModalValue.value)
  }
  closeEditModal()
}

const editNickname = () => {
  openEditModal('text', 'nickname', '编辑昵称')
}

const editSignature = () => {
  openEditModal('text', 'signature', '编辑个性签名')
}

const editGender = () => {
  openEditModal('select', 'gender', '选择性别', [
    { label: '男', value: '男' },
    { label: '女', value: '女' },
    { label: '保密', value: '保密' }
  ])
}

const editLocation = () => {
  openEditModal('text', 'location', '编辑地区')
}

// 更新用户字段（调用后端接口）
const updateUserField = async (field: string, value: string) => {
  if (!userInfo.value) return

  try {
    if (field === 'theme') {
      updateTheme(value)
      return
    }

    const current = userInfo.value
    const userId = current.id || localStorage.getItem('userId')
    if (!userId) {
      alert('请先登录')
      return
    }

    const payload = {
      userId,
      username: current.username || '',
      signature: current.signature || '',
      sex: current.gender || current.sex || 'secret',
      avatar: current.avatar || '',
      location: current.location || ''
    }

    // 覆盖要修改的字段
    switch (field) {
      case 'nickname':
      case 'username':
        payload.username = value
        break
      case 'signature':
        payload.signature = value
        break
      case 'gender':
      case 'sex':
        payload.sex = value
        break
      case 'location':
        payload.location = value
        break
      default:
        break
    }

    const resp = await updateUserInfo(payload)

    // 同步前端状态（优先接口返回数据）
    const updated = {
      ...current,
      username: resp.data?.username ?? payload.username,
      signature: resp.data?.signature ?? payload.signature,
      gender: resp.data?.gender ?? resp.data?.sex ?? payload.sex,
      sex: resp.data?.sex ?? payload.sex,
      location: resp.data?.location ?? payload.location
    }

    userInfo.value = updated
    saveUserInfoToStorage(updated)
    console.log(`更新${field}成功`, resp)
  } catch (error: any) {
    console.error('更新失败:', error)
    alert(error?.response?.data?.message || '更新失败，请重试')
  }
}

// 设置相关函数
const changePassword = () => {
  router.push('/change-password')
}

const privacySettings = () => {
  router.push('/privacy-settings')
}

const notificationSettings = () => {
  router.push('/notification-settings')
}

const themeSettings = () => {
  const currentTheme = theme.value
  openEditModal('select', 'theme', '选择主题', [
    { label: '浅色', value: 'light' },
    { label: '深色', value: 'dark' },
    { label: '跟随系统', value: 'auto' }
  ])
  editModalValue.value = currentTheme
}

// 更新主题
const updateTheme = (themeValue: string) => {
  theme.value = themeValue
  localStorage.setItem('theme', themeValue)
  applyTheme(themeValue)
}

// 应用主题
const applyTheme = (themeValue: string) => {
  if (themeValue === 'dark') {
    document.documentElement.classList.add('dark-theme')
  } else {
    document.documentElement.classList.remove('dark-theme')
  }
}

// 退出登录
const logout = () => {
  // 使用自定义确认弹窗
  if (window.confirm('确定要退出登录吗？')) {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('userInfo')
    router.push('/login')
  }
}

onMounted(() => {
  loadUserInfo()
  applyTheme(theme.value)
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

.avatar-container {
  flex-shrink: 0;
  position: relative;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  background-color: #e0e0e0;
}

.avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32px;
  font-weight: 600;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  max-height: 42px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.user-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.stat-label {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.arrow-icon {
  font-size: 24px;
  color: #999;
  flex-shrink: 0;
  margin-left: auto;
}

/* 信息列表 */
.info-list {
  background: white;
  margin: 12px 0;
  padding: 0 20px;
}

.info-item {
  display: flex;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.info-item:active {
  background-color: #f8f8f8;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  width: 80px;
  font-size: 16px;
  color: #333;
  flex-shrink: 0;
}

.info-item .value {
  flex: 1;
  font-size: 16px;
  color: #666;
  text-align: right;
  padding-right: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info-item .arrow {
  color: #999;
  font-size: 20px;
}

/* 设置列表 */
.settings-list {
  background: white;
  margin: 12px 0;
  padding: 0 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #999;
  padding: 20px 0 12px 0;
  margin: 0;
}

.setting-item {
  display: flex;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.setting-item:active {
  background-color: #f8f8f8;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item .label {
  flex: 1;
  font-size: 16px;
  color: #333;
}

.setting-item .value {
  font-size: 14px;
  color: #999;
  margin-right: 8px;
}

.setting-item .arrow {
  color: #999;
  font-size: 20px;
}

/* 退出登录按钮 */
.logout-section {
  margin: 20px;
}

.logout-btn {
  width: 100%;
  padding: 16px;
  background: white;
  border: 1px solid #ff4d4f;
  border-radius: 8px;
  color: #ff4d4f;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:active {
  background-color: #fff2f0;
}

/* 加载和错误状态 */
.loading, .error {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 14px;
}

.error {
  color: #ff4d4f;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.modal-close:hover {
  background-color: #f5f5f5;
  color: #666;
}

.modal-body {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.modal-input,
.modal-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.modal-input:focus,
.modal-textarea:focus {
  border-color: #667eea;
}

.modal-textarea {
  resize: none;
  min-height: 80px;
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.select-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.select-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 16px;
  color: #333;
}

.select-option:hover {
  background-color: #f8f9fa;
}

.select-option.active {
  border-color: #667eea;
  background-color: #f0f4ff;
  color: #667eea;
}

.check-icon {
  color: #667eea;
  font-weight: 600;
  font-size: 18px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

.modal-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #666;
}

.cancel-btn:active {
  background-color: #e8e8e8;
}

.confirm-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.confirm-btn:active {
  opacity: 0.9;
}

/* 弹窗动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>