<template>
  <Transition name="fade">
    <div v-if="showContent" class="add-post-page">
      <div class="header">
        <button @click="goBack" class="back-btn">取消</button>
        <h2 class="title">发布动态</h2>
        <button @click="handlePublish" :disabled="loading" class="publish-btn">
          {{ loading ? '发布中...' : '发布' }}
        </button>
      </div>
      
      <div class="content">
        <textarea
          v-model="content"
          placeholder="分享你的想法..."
          class="textarea"
          maxlength="500"
        ></textarea>
        <div class="char-count">{{ content.length }}/500</div>
      </div>
      
      <div class="image-section">
        <div class="image-grid">
          <div
            v-for="(image, index) in images"
            :key="index"
            class="image-item"
            @click="previewImage(index)"
          >
            <img :src="image.url" :alt="`图片 ${index + 1}`" />
            <button
              @click.stop="removeImage(index)"
              class="remove-btn"
            >
              ×
            </button>
          </div>
          <div
            v-if="images.length < 9"
            class="image-item add-image-btn"
            @click="triggerFileInput"
          >
            <div class="add-icon">+</div>
            <div class="add-text">添加照片</div>
          </div>
        </div>
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          multiple
          @change="handleFileSelect"
          style="display: none"
        />
      </div>
      
      <div v-if="message" :class="['message', messageType]">
        {{ message }}
      </div>

      <!-- 图片预览模态框 -->
      <Transition name="fade">
        <div v-if="previewIndex !== null" class="preview-modal" @click="closePreview">
          <div class="preview-content" @click.stop>
            <button class="close-preview-btn" @click="closePreview">×</button>
            <img v-if="previewIndex !== null && images[previewIndex]" :src="images[previewIndex]?.url" :alt="`预览图片 ${previewIndex! + 1}`" />
            <div class="preview-nav">
              <button
                v-if="previewIndex > 0"
                @click="previewPrev"
                class="nav-btn prev-btn"
              >
                ‹
              </button>
              <button
                v-if="previewIndex < images.length - 1"
                @click="previewNext"
                class="nav-btn next-btn"
              >
                ›
              </button>
            </div>
            <div class="preview-indicator">{{ previewIndex + 1 }} / {{ images.length }}</div>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { createPost } from '@/Api/Post/Post'

interface ImageItem {
  url: string
  file: File
  path: string // 文件的绝对路径
}

const router = useRouter()
const content = ref('')
const loading = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const showContent = ref(false)
const images = ref<ImageItem[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)
const previewIndex = ref<number | null>(null)

// 获取用户ID（从 localStorage 或登录信息中获取，这里暂时使用示例值）
const getUserId = (): string => {
  // TODO: 从实际的用户状态管理中获取
  const userId = localStorage.getItem('userId')
  return userId || '1' // 默认值，实际应该从登录信息中获取
}

onMounted(() => {
  // 延迟显示，等待动画完成
  setTimeout(() => {
    showContent.value = true
  }, 100)
})

const goBack = () => {
  router.back()
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  
  if (!files || files.length === 0) return
  
  // 图片存储的前缀路径
  const imageBasePath = 'image'
  
  // 限制最多9张图片
  const remainingSlots = 9 - images.value.length
  const filesToAdd = Array.from(files).slice(0, remainingSlots)
  
  filesToAdd.forEach((file) => {
    if (file.type.startsWith('image/')) {
      // 获取文件名
      const fileName = file.name
      console.log('原始文件名：', fileName)
      
      // 生成绝对路径：前缀路径 + 文件名
      const absolutePath = `${imageBasePath}\\${fileName}`
      
      const url = URL.createObjectURL(file)
      images.value.push({
        url,
        file,
        path: absolutePath
      })
    }
  })

  console.log('images：', images.value)
  
  // 清空 input，允许重复选择同一文件
  if (target) {
    target.value = ''
  }
}

const removeImage = (index: number) => {
  if (!images.value[index]) return
  // 释放 URL 对象，避免内存泄漏
  URL.revokeObjectURL(images.value[index].url)
  images.value.splice(index, 1)
  
  // 如果正在预览被删除的图片，关闭预览
  if (previewIndex.value === index) {
    previewIndex.value = null
  } else if (previewIndex.value !== null && previewIndex.value > index) {
    // 如果预览的是后面的图片，调整索引
    previewIndex.value = previewIndex.value - 1
  }
}

const previewImage = (index: number) => {
  previewIndex.value = index
}

const closePreview = () => {
  previewIndex.value = null
}

const previewPrev = () => {
  if (previewIndex.value !== null && previewIndex.value > 0) {
    previewIndex.value--
  }
}

const previewNext = () => {
  if (previewIndex.value !== null && previewIndex.value < images.value.length - 1) {
    previewIndex.value++
  }
}

const handlePublish = async () => {
  if (!content.value.trim() && images.value.length === 0) {
    message.value = '请输入内容或添加照片'
    messageType.value = 'error'
    setTimeout(() => {
      message.value = ''
    }, 2000)
    return
  }
  
  loading.value = true
  message.value = ''
  
  try {
    // 调用发布接口，传递文件和绝对路径
    const response = await createPost({
      userId: getUserId(),
      content: content.value,
      images: images.value.map((img: ImageItem) => ({
        file: img.file,
        path: img.path
      }))
    })
    
    console.log('发布成功:', response)
    message.value = '发布成功！'
    messageType.value = 'success'
    
    setTimeout(() => {
      // 清理图片 URL
      images.value.forEach(img => URL.revokeObjectURL(img.url))
      router.back()
    }, 1000)
  } catch (error: any) {
    message.value = error.response?.data?.message || '发布失败，请稍后重试'
    messageType.value = 'error'
    console.error('发布失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.add-post-page {
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

.publish-btn {
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

.publish-btn:active:not(:disabled) {
  opacity: 0.8;
}

.publish-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.content {
  flex: 1;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  min-height: 200px;
}

.image-section {
  padding: 16px;
  border-top: 1px solid #f0f0f0;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
}

.image-item.add-image-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed #d0d0d0;
  cursor: pointer;
  transition: border-color 0.2s;
}

.image-item.add-image-btn:active {
  border-color: #667eea;
  background: #f8f9ff;
}

.add-icon {
  font-size: 32px;
  color: #999;
  margin-bottom: 4px;
}

.add-text {
  font-size: 12px;
  color: #999;
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: background 0.2s;
}

.remove-btn:active {
  background: rgba(0, 0, 0, 0.8);
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

.textarea {
  flex: 1;
  width: 100%;
  border: none;
  outline: none;
  font-size: 16px;
  line-height: 1.6;
  color: #333;
  resize: none;
  font-family: inherit;
  background: transparent;
  min-height: 200px;
}

.textarea::placeholder {
  color: #999;
}

.char-count {
  text-align: right;
  color: #999;
  font-size: 14px;
  margin-top: 12px;
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

.fade-enter-active {
  transition: opacity 0.4s ease-in;
}

.fade-enter-from {
  opacity: 0;
}

.fade-enter-to {
  opacity: 1;
}

.fade-leave-active {
  transition: opacity 0.3s ease-out;
}

.fade-leave-from {
  opacity: 1;
}

.fade-leave-to {
  opacity: 0;
}
</style>

