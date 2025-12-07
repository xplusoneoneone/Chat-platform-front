<template>
  <div class="chat-detail-page">
    <!-- 聊天头部 -->
    <div class="chat-header">
      <button @click="goBack" class="back-btn">‹</button>
      <div class="friend-info" @click="goToFriendDetail">
        <img 
          :src="'/public/image/hyh.jpg'" 
          class="friend-avatar"
          alt="好友头像"
        />
        <div class="friend-details">
          <h3 class="friend-name">{{ friendInfo?.nickname || friendInfo?.username || '好友' }}</h3>
          <p class="friend-status">{{ friendInfo?.isLogging ? '在线' : '离线' }}</p>
        </div>
      </div>
      <button class="more-btn" @click="showMoreMenu">⋮</button>
    </div>

    <!-- 消息列表 -->
    <div class="messages-container" ref="messagesContainerRef">
      <div 
        v-for="message in messages" 
        :key="message.id"
        :class="['message-item', { 'message-sent': message.isSent, 'message-received': !message.isSent }]"
      >
        <div class="message-avatar" v-if="!message.isSent">
          <img 
            :src="'/public/image/hyh.jpg'" 
            alt="头像"
          />
        </div>
        <div class="message-content">
          <div class="message-bubble">
            <p class="message-text">{{ message.content }}</p>
            <span class="message-time">{{ formatMessageTime(message.timestamp) }}</span>
          </div>
        </div>
        <div class="message-avatar" v-if="message.isSent">
          <img 
            :src="currentUserAvatar || '/default-avatar.png'" 
            alt="我的头像"
          />
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <button class="input-btn" @click="showEmojiPicker">😊</button>
      <input
        v-model="inputMessage"
        type="text"
        placeholder="输入消息..."
        class="message-input"
        @keyup.enter="sendMessage"
        ref="inputRef"
      />
      <button 
        class="send-btn" 
        @click="sendMessage"
        :disabled="!inputMessage.trim()"
      >
        发送
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { normalizeAvatarPath } from '@/utils/avatar'

const router = useRouter()
const route = useRoute()

// 好友信息
interface FriendInfo {
  id: string
  username: string
  nickname?: string
  avatar?: string
  signature?: string
  isLogging?: boolean
}

// 消息类型
interface Message {
  id: number
  content: string
  timestamp: number
  isSent: boolean
}

const friendId = computed(() => route.params.friendId as string)
const friendInfo = ref<FriendInfo | null>(null)
const messages = ref<Message[]>([])
const inputMessage = ref('')
const messagesContainerRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const currentUserAvatar = ref('')

// 模拟消息数据
const mockMessages: Message[] = [
  {
    id: 1,
    content: '你好！最近怎么样？',
    timestamp: Date.now() - 86400000 * 2, // 2天前
    isSent: false
  },
  {
    id: 2,
    content: '挺好的，你呢？',
    timestamp: Date.now() - 86400000 * 2 + 60000,
    isSent: true
  },
  {
    id: 3,
    content: '我也挺好的，最近在忙一个项目',
    timestamp: Date.now() - 86400000 * 2 + 120000,
    isSent: false
  },
  {
    id: 4,
    content: '听起来不错，是什么项目？',
    timestamp: Date.now() - 86400000 * 2 + 180000,
    isSent: true
  },
  {
    id: 5,
    content: '是一个聊天平台的项目，正在开发中',
    timestamp: Date.now() - 86400000 * 2 + 240000,
    isSent: false
  },
  {
    id: 6,
    content: '哇，听起来很有意思！',
    timestamp: Date.now() - 3600000, // 1小时前
    isSent: true
  },
  {
    id: 7,
    content: '是的，希望能做出一个不错的作品',
    timestamp: Date.now() - 3600000 + 60000,
    isSent: false
  },
  {
    id: 8,
    content: '加油！我相信你可以的',
    timestamp: Date.now() - 1800000, // 30分钟前
    isSent: true
  },
  {
    id: 9,
    content: '666',
    timestamp: Date.now() - 1800000 + 60000,
    isSent: false
  }
]

// 从好友列表获取好友信息
const loadFriendInfo = () => {
  try {
    // 从 localStorage 获取好友列表
    const friendsStr = localStorage.getItem('friends')
    if (friendsStr) {
      const friends: FriendInfo[] = JSON.parse(friendsStr)
      const friend = friends.find(f => f.id === friendId.value)
      if (friend) {
        friendInfo.value = {
          ...friend,
          avatar: friend.avatar ? normalizeAvatarPath(friend.avatar) : undefined
        }
        return
      }
    }
    
    // 如果找不到，使用模拟数据
    friendInfo.value = {
      id: friendId.value,
      username: '好友' + friendId.value,
      nickname: 'hyh',
      avatar: '/default-avatar.png',
      signature: '这是好友的签名',
      isLogging: false
    }
  } catch (error) {
    console.error('加载好友信息失败:', error)
    // 使用默认数据
    friendInfo.value = {
      id: friendId.value,
      username: '好友',
      nickname: '好友昵称',
      avatar: '/default-avatar.png',
      isLogging: false
    }
  }
}

// 加载当前用户头像
const loadCurrentUserAvatar = () => {
  try {
    const userInfoStr = localStorage.getItem('userInfo')
    if (userInfoStr) {
      const userInfo = JSON.parse(userInfoStr)
      currentUserAvatar.value = userInfo.avatar ? normalizeAvatarPath(userInfo.avatar) : '/default-avatar.png'
    } else {
      currentUserAvatar.value = '/default-avatar.png'
    }
  } catch (error) {
    currentUserAvatar.value = '/default-avatar.png'
  }
}

// 加载消息
const loadMessages = () => {
  // 使用模拟数据
  messages.value = mockMessages
  // 滚动到底部
  nextTick(() => {
    scrollToBottom()
  })
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainerRef.value) {
    messagesContainerRef.value.scrollTop = messagesContainerRef.value.scrollHeight
  }
}

// 发送消息
const sendMessage = () => {
  if (!inputMessage.value.trim()) return
  
  const newMessage: Message = {
    id: messages.value.length + 1,
    content: inputMessage.value.trim(),
    timestamp: Date.now(),
    isSent: true
  }
  
  messages.value.push(newMessage)
  inputMessage.value = ''
  
  // 滚动到底部
  nextTick(() => {
    scrollToBottom()
  })
  
  // 模拟对方回复（3秒后）
  setTimeout(() => {
    const replyMessage: Message = {
      id: messages.value.length + 1,
      content: '收到你的消息了！',
      timestamp: Date.now(),
      isSent: false
    }
    messages.value.push(replyMessage)
    nextTick(() => {
      scrollToBottom()
    })
  }, 3000)
}

// 格式化消息时间
const formatMessageTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - timestamp
  
  // 今天
  if (diff < 86400000 && date.getDate() === now.getDate()) {
    return date.getHours().toString().padStart(2, '0') + ':' + 
           date.getMinutes().toString().padStart(2, '0')
  }
  
  // 昨天
  if (diff < 172800000 && date.getDate() === now.getDate() - 1) {
    return '昨天 ' + date.getHours().toString().padStart(2, '0') + ':' + 
           date.getMinutes().toString().padStart(2, '0')
  }
  
  // 更早
  return date.getMonth() + 1 + '/' + date.getDate() + ' ' + 
         date.getHours().toString().padStart(2, '0') + ':' + 
         date.getMinutes().toString().padStart(2, '0')
}

// 返回
const goBack = () => {
  router.push('/chat')
}

// 跳转到好友详情
const goToFriendDetail = () => {
  if (friendInfo.value) {
    router.push(`/user/detail/${friendInfo.value.id}`)
  }
}

// 显示更多菜单
const showMoreMenu = () => {
  // 这里可以添加更多功能，比如清空聊天记录、查看聊天设置等
  alert('更多功能开发中...')
}

// 显示表情选择器
const showEmojiPicker = () => {
  // 这里可以添加表情选择器
  alert('表情功能开发中...')
}

// 监听路由变化
watch(() => route.params.friendId, () => {
  loadFriendInfo()
  loadMessages()
}, { immediate: true })

onMounted(() => {
  loadFriendInfo()
  loadCurrentUserAvatar()
  loadMessages()
  
  // 聚焦输入框
  nextTick(() => {
    inputRef.value?.focus()
  })
})
</script>

<style scoped>
.chat-detail-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  background: #f5f5f5;
  overflow: hidden;
}

/* 头部 */
.chat-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #333;
  cursor: pointer;
  padding: 4px 8px;
  margin-right: 8px;
}

.friend-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.friend-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.friend-details {
  flex: 1;
}

.friend-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.friend-status {
  margin: 2px 0 0 0;
  font-size: 12px;
  color: #999;
}

.more-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #666;
  cursor: pointer;
  padding: 4px 8px;
}

/* 消息列表 */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-item {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.message-item.message-sent {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.message-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
}

.message-sent .message-content {
  align-items: flex-end;
}

.message-received .message-content {
  align-items: flex-start;
}

.message-bubble {
  padding: 10px 14px;
  border-radius: 12px;
  position: relative;
  word-wrap: break-word;
  word-break: break-all;
}

.message-sent .message-bubble {
  background: #007bff;
  color: white;
  border-bottom-right-radius: 4px;
}

.message-received .message-bubble {
  background: white;
  color: #333;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message-text {
  margin: 0;
  font-size: 15px;
  line-height: 1.4;
}

.message-time {
  display: block;
  font-size: 11px;
  margin-top: 4px;
  opacity: 0.7;
}

.message-sent .message-time {
  color: rgba(255, 255, 255, 0.8);
}

.message-received .message-time {
  color: #999;
}

/* 输入区域 */
.input-area {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-top: 1px solid #e0e0e0;
  gap: 8px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
}

.input-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
  flex-shrink: 0;
}

.message-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  font-size: 15px;
  outline: none;
  background: #f8f8f8;
}

.message-input:focus {
  border-color: #007bff;
  background: white;
}

.send-btn {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  flex-shrink: 0;
}

.send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.send-btn:active:not(:disabled) {
  opacity: 0.8;
}

/* 滚动条样式 */
.messages-container::-webkit-scrollbar {
  width: 4px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 2px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: #999;
}
</style>

