<!--
 * @Author: 徐佳德 1404577549@qq.com
 * @Date: 2025-11-30 16:28:32
 * @LastEditors: 徐佳德 1404577549@qq.com
 * @LastEditTime: 2025-12-02 19:15:03
 * @FilePath: \chat\src\page\Post\Post.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div class="post-page">
    <div class="page-content">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else-if="posts.length === 0" class="empty">暂无动态</div>
      <div v-else class="post-list" ref="postListRef">
        <div
          v-for="post in posts"
          :key="post.id"
          class="post-item"
        >
          <div class="post-header">
            <div class="user-info">
              <img class="avatar" :src="post.user?.avatar" alt="头像"></img>
                <span v-if="!post.user?.avatar">{{ post.user?.username || post.userId }}</span>
              </img>
              <div class="user-name">{{ post.user?.username || `用户 ${post.userId}` }}</div>
            </div>
            <div class="post-time">{{ formatTime(post.createTime) }}</div>
          </div>
          <div v-if="post.content" class="post-content">{{ post.content }}</div>
          <div v-if="post.images && post.images.length > 0" class="post-images">
            <div
              v-for="(image, index) in post.images"
              :key="index"
              class="image-item"
              @click="previewImage(post.images!, index)"
            >
              <img :src="image" :alt="`图片 ${index + 1}`" />
            </div>
          </div>
        </div>
        
        <!-- 加载更多提示 -->
        <div v-if="loadingMore" class="load-more">加载中...</div>
        <div v-else-if="noMore" class="no-more">已经到底了</div>
      </div>
    </div>
    
    <!-- 图片预览模态框 -->
    <Transition name="fade">
      <div v-if="previewImages && previewIndex !== null" class="preview-modal" @click="closePreview">
        <div class="preview-content" @click.stop>
          <button class="close-preview-btn" @click="closePreview">×</button>
          <img v-if="previewImages[previewIndex]" :src="previewImages[previewIndex]" :alt="`预览图片 ${previewIndex + 1}`" />
          <div class="preview-nav">
            <button
              v-if="previewIndex > 0"
              @click="previewPrev"
              class="nav-btn prev-btn"
            >
              ‹
            </button>
            <button
              v-if="previewIndex < previewImages.length - 1"
              @click="previewNext"
              class="nav-btn next-btn"
            >
              ›
            </button>
          </div>
          <div class="preview-indicator">{{ previewIndex + 1 }} / {{ previewImages.length }}</div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { getPostList, type PostItem } from '@/Api/Post/Post'

const posts = ref<PostItem[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const error = ref('')
const previewImages = ref<string[] | null>(null)
const previewIndex = ref<number | null>(null)
const postListRef = ref<HTMLElement | null>(null)

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const noMore = ref(false)
const isLoading = ref(false)

// 获取用户ID（从 localStorage 或登录信息中获取，这里暂时使用示例值）
const getUserId = (): string | undefined => {
  // TODO: 从实际的用户状态管理中获取
  const userId = localStorage.getItem('userId')
  return userId || undefined
}

const loadPosts = async (isLoadMore = false) => {
  // 防止重复加载
  if (isLoading.value || (isLoadMore && noMore.value)) {
    return
  }
  
  if (isLoadMore) {
    loadingMore.value = true
  } else {
    loading.value = true
    error.value = ''
  }
  
  isLoading.value = true
  
  try {
    const response = await getPostList({
      userId: getUserId(),
      page: currentPage.value,
      size: pageSize.value
    })
    
    console.log(response);
    
    let newPosts: PostItem[] = []
    
    // 根据实际返回的数据结构调整
    if (response.data && response.data.content) {
      // 新格式：response.data.content
      newPosts = response.data.content
    } else if (Array.isArray(response)) {
      // 直接是数组
      newPosts = response
    } else if (response.list) {
      // 旧格式：response.list
      newPosts = response.list
    }
    
    // 处理图片路径，将本地绝对路径转换为服务器可访问的 URL
    newPosts = newPosts.map(post => ({
      ...post,
      
    }))
    console.log('newPosts：', newPosts);
    
    if (isLoadMore) {
      // 追加新数据
      posts.value = [...posts.value, ...newPosts]
    } else {
      // 首次加载，替换数据
      posts.value = newPosts
    }
    
    // 判断是否还有更多数据
    if (newPosts.length < pageSize.value) {
      noMore.value = true
    } else {
      currentPage.value++
    }
  } catch (err: any) {
    if (!isLoadMore) {
      error.value = err.response?.data?.message || '加载失败，请稍后重试'
    }
    console.error('加载帖子失败:', err)
  } finally {
    loading.value = false
    loadingMore.value = false
    isLoading.value = false
  }
}

// 滚动事件处理
const handleScroll = () => {
  if (loadingMore.value || noMore.value || isLoading.value) {
    return
  }
  
  // 获取滚动信息
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop
  const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight
  const clientHeight = window.innerHeight || document.documentElement.clientHeight
  
  // 距离底部 200px 时开始加载
  if (scrollTop + clientHeight >= scrollHeight - 200) {
    loadPosts(true)
  }
}

const formatTime = (time?: string) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return date.toLocaleDateString()
}

const previewImage = (images: string[], index: number) => {
  previewImages.value = images
  previewIndex.value = index
}

const closePreview = () => {
  previewImages.value = null
  previewIndex.value = null
}

const previewPrev = () => {
  if (previewIndex.value !== null && previewIndex.value > 0) {
    previewIndex.value--
  }
}

const previewNext = () => {
  if (previewIndex.value !== null && previewImages.value && previewIndex.value < previewImages.value.length - 1) {
    previewIndex.value++
  }
}

onMounted(() => {
  loadPosts()
  
  // 监听窗口滚动事件
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  // 移除滚动监听
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.post-page {
  min-height: 100vh;
  min-height: 100dvh;
  padding-bottom: 70px;
  background: #f5f5f5;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.page-content {
  padding: 16px;
  min-height: calc(100vh - 70px);
}

.loading, .error, .empty {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 14px;
}

.error {
  color: #f56c6c;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 20px;
}

.load-more, .no-more {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}

.no-more {
  color: #ccc;
}

.post-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
}

.avatar span {
  position: relative;
  z-index: 1;
}

.user-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.post-time {
  font-size: 12px;
  color: #999;
}

.post-content {
  font-size: 15px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 12px;
  word-break: break-word;
}

.post-images {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 12px;
}

.post-images .image-item {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
  cursor: pointer;
}

.post-images .image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
}

.preview-content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-content img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.close-preview-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: background 0.2s;
  z-index: 1;
}

.close-preview-btn:active {
  background: rgba(255, 255, 255, 0.3);
}

.preview-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
  pointer-events: none;
}

.nav-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  font-size: 32px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: background 0.2s;
  pointer-events: auto;
}

.nav-btn:active {
  background: rgba(255, 255, 255, 0.3);
}

.preview-indicator {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  font-size: 14px;
  background: rgba(0, 0, 0, 0.5);
  padding: 6px 16px;
  border-radius: 20px;
}

.fade-enter-active {
  transition: opacity 0.3s;
}

.fade-enter-from {
  opacity: 0;
}

.fade-enter-to {
  opacity: 1;
}

.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-leave-from {
  opacity: 1;
}

.fade-leave-to {
  opacity: 0;
}
</style>

