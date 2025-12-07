<!--
 * @Author: 徐佳德 1404577549@qq.com
 * @Date: 2025-11-30 16:28:32
 * @LastEditors: 徐佳德 1404577549@qq.com
 * @LastEditTime: 2025-12-03 12:05:55
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
            <div class="user-info" @click="goToUserDetail(post.userId || post.user?.id)">
              <img class="avatar" :src="getDisplayAvatarPath(post.user?.avatar)" alt="头像" />
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
              <img :src="convertImagePath(image)" :alt="`图片 ${index + 1}`" />
            </div>
          </div>
          
          <!-- 点赞和评论操作栏 -->
          <div class="post-actions">
            <button 
              class="action-btn like-btn" 
              @click="toggleLike(post)"
            >
              <img 
                :src="getLikeIcon(typeof post.id === 'string' ? Number(post.id) : post.id)" 
                alt="点赞" 
                class="action-icon"
              />
            </button>
            <button 
              class="action-btn comment-btn" 
              @click="toggleComment(typeof post.id === 'string' ? Number(post.id) : post.id)"
            >
              <img 
                src="/src/static/icon/评论.png" 
                alt="评论" 
                class="action-icon"
              />
            </button>
          </div>
          
          <!-- 评论区域 -->
          <Transition name="slide-down">
            <div v-if="expandedComments.has(typeof post.id === 'string' ? Number(post.id) : post.id)" class="comment-section">
              <!-- 评论输入框 -->
              <div class="comment-input-wrapper">
              <input
                :value="commentInputs[typeof post.id === 'string' ? Number(post.id) : post.id] || ''"
                @input="(e) => { const id = typeof post.id === 'string' ? Number(post.id) : post.id; commentInputs[id] = (e.target as HTMLInputElement).value }"
                type="text"
                placeholder="写评论..."
                class="comment-input"
                @keyup.enter="submitComment(typeof post.id === 'string' ? Number(post.id) : post.id)"
              />
              <button 
                class="comment-submit-btn"
                @click="submitComment(typeof post.id === 'string' ? Number(post.id) : post.id)"
              >
                  发送
                </button>
              </div>
              
              <!-- 评论列表 -->
              <div class="comment-list">
                <div
                  v-for="comment in getCommentList(typeof post.id === 'string' ? Number(post.id) : post.id)"
                  :key="comment.id"
                  class="comment-item"
                >
                  <div class="comment-user">{{ comment.user?.username || '用户' }}</div>
                  <div class="comment-content">{{ comment.content }}</div>
                  <div class="comment-time">{{ formatTime(comment.createTime) }}</div>
                </div>
                <div v-if="getCommentList(typeof post.id === 'string' ? Number(post.id) : post.id).length === 0" class="no-comments">
                  暂无评论
                </div>
              </div>
            </div>
          </Transition>
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
import { useRouter } from 'vue-router'
import { getPostList, likePost, unlikePost, commentPost, getComments as fetchComments, type PostItem, type CommentItem } from '@/Api/Post/Post'
import { normalizeAvatarPath } from '@/utils/avatar'

const router = useRouter()

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

// 点赞状态管理
const likedPosts = ref<Set<number>>(new Set())

// 评论展开状态
const expandedComments = ref<Set<number>>(new Set())

// 评论输入框内容
const commentInputs = ref<Record<number, string>>({})

// 评论数据
const comments = ref<Record<number, CommentItem[]>>({})

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
    
    // 根据 isLike 字段初始化点赞状态
    newPosts.forEach(post => {
      const postId = typeof post.id === 'string' ? Number(post.id) : post.id
      if (post.isLike) {
        likedPosts.value.add(postId)
      } else {
        likedPosts.value.delete(postId)
      }
    })
    
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

// 转换图片路径（将本地绝对路径转换为服务器URL）
const convertImagePath = (img: string | undefined): string => {
  if (!img) return ''
  
  const imgStr = String(img)
  
  // 如果已经是完整URL，直接返回
  if (imgStr.startsWith('http://') || imgStr.startsWith('https://')) {
    return imgStr
  }
  
  // 如果是本地绝对路径（包含盘符或反斜杠），转换为服务器URL
  if (imgStr.includes('\\') || imgStr.includes('项目') || imgStr.includes(':')) {
    // 提取文件名
    const fileName = imgStr.split(/[/\\]/).pop() || ''
    if (fileName) {
      return `image/${fileName}`
    }
  }
  
  return imgStr
}

// 获取显示用的头像路径
const getDisplayAvatarPath = (avatar: string | undefined): string => {
  return normalizeAvatarPath(avatar)
}

// 跳转到用户详情页
const goToUserDetail = (userId: string | number | undefined) => {
  if (!userId) return
  router.push(`/user/detail/${userId}`)
}

const previewImage = (images: string[], index: number) => {
  // 转换图片路径用于预览
  previewImages.value = images.map(img => convertImagePath(img))
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

// 获取点赞图标
const getLikeIcon = (postId: number): string => {
  return likedPosts.value.has(postId) 
    ? '/src/static/icon/已点赞.png' 
    : '/src/static/icon/点赞.png'
}

// 切换点赞状态
const toggleLike = async (post: PostItem) => {
  const postId = typeof post.id === 'string' ? Number(post.id) : post.id
  const userId = localStorage.getItem('userId')
  
  if (!userId) {
    console.error('用户未登录')
    return
  }
  
  const isLiked = likedPosts.value.has(postId)
  
  try {
    if (isLiked) {
      // 取消点赞
      await unlikePost({
        userId: userId,
        postId: postId
      })
      likedPosts.value.delete(postId)
    } else {
      // 点赞
      await likePost({
        userId: userId,
        postId: postId
      })
      likedPosts.value.add(postId)
    }
  } catch (error) {
    console.error('点赞操作失败:', error)
    // 如果失败，恢复状态
    if (isLiked) {
      likedPosts.value.add(postId)
    } else {
      likedPosts.value.delete(postId)
    }
  }
}

// 切换评论展开/收起
const toggleComment = async (postId: number | string) => {
  const id = typeof postId === 'string' ? Number(postId) : postId
  if (expandedComments.value.has(id)) {
    expandedComments.value.delete(id)
  } else {
    expandedComments.value.add(id)
    // 如果还没有加载评论，调用接口获取评论列表
    if (!comments.value[id] || comments.value[id].length === 0) {
      try {
        const response = await fetchComments({ postId: id })
        let commentList: CommentItem[] = []
        
        // 根据实际返回的数据结构调整
        if (response.data && Array.isArray(response.data)) {
          commentList = response.data
        } else if (response.list && Array.isArray(response.list)) {
          commentList = response.list
        } else if (Array.isArray(response)) {
          commentList = response
        }
        
        comments.value[id] = commentList
      } catch (error) {
        console.error('获取评论列表失败:', error)
        comments.value[id] = []
      }
    }
  }
}

// 获取评论列表（用于显示）
const getCommentList = (postId: number | string): CommentItem[] => {
  const id = typeof postId === 'string' ? Number(postId) : postId
  return comments.value[id] || []
}

// 提交评论
const submitComment = async (postId: number | string) => {
  const id = typeof postId === 'string' ? Number(postId) : postId
  const content = commentInputs.value[id]?.trim()
  if (!content) return
  
  const userId = localStorage.getItem('userId')
  if (!userId) {
    console.error('用户未登录')
    return
  }
  
  try {
    // 调用后端接口提交评论
    const response = await commentPost({
      postId: id,
      userId: userId,
      content: content
    })
    
    // 如果后端返回了评论数据，添加到评论列表
    if (response.data) {
      const newComment: CommentItem = {
        id: response.data.id || Date.now(),
        postId: id,
        userId: Number(userId),
        user: response.data.user || {
          username: '我' // 临时，应该从用户信息获取
        },
        content: response.data.content || content,
        createTime: response.data.createTime || new Date().toISOString()
      }
      
      if (!comments.value[id]) {
        comments.value[id] = []
      }
      comments.value[id].push(newComment)
    } else {
      // 如果后端没有返回数据，使用临时数据
      const newComment: CommentItem = {
        id: Date.now(),
        postId: id,
        userId: Number(userId),
        user: {
          username: '我'
        },
        content,
        createTime: new Date().toISOString()
      }
      
      if (!comments.value[id]) {
        comments.value[id] = []
      }
      comments.value[id].push(newComment)
    }
    
    // 提交评论后，重新获取评论列表以确保数据同步
    try {
      const commentResponse = await fetchComments({ postId: id })
      let commentList: CommentItem[] = []
      
      if (commentResponse.data && Array.isArray(commentResponse.data)) {
        commentList = commentResponse.data
      } else if (commentResponse.list && Array.isArray(commentResponse.list)) {
        commentList = commentResponse.list
      } else if (Array.isArray(commentResponse)) {
        commentList = commentResponse
      }
      
      comments.value[id] = commentList
    } catch (error) {
      console.error('刷新评论列表失败:', error)
    }
    
    // 清空输入框
    commentInputs.value[id] = ''
  } catch (error) {
    console.error('评论失败:', error)
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
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.user-info:active {
  opacity: 0.7;
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

.post-actions {
  display: flex;
  gap: 24px;
  padding: 12px 0;
  border-top: 1px solid #f0f0f0;
  margin-top: 12px;
}

.action-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.action-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.action-btn:active {
  opacity: 0.7;
}

.comment-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.comment-input-wrapper {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.comment-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
  background: #f8f9fa;
  box-sizing: border-box;
  font-family: inherit;
}

.comment-input:focus {
  border-color: #667eea;
  background: white;
}

.comment-submit-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.comment-submit-btn:active {
  opacity: 0.8;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-item {
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-user {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.comment-content {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 4px;
}

.comment-time {
  font-size: 12px;
  color: #999;
}

.no-comments {
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 20px 0;
}

/* 展开动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  max-height: 1000px;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 0;
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

