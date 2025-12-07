<template>
  <div class="chat-page">
    <!-- 聊天列表头部 -->
    <div class="chat-list-header">
      <h2 class="page-title">聊天</h2>
    </div>

    <!-- 聊天列表 -->
    <div class="chat-list" v-if="chatList.length > 0">
      <div 
        v-for="chat in chatList" 
        :key="chat.friendId"
        class="chat-item"
        @click="goToChatDetail(chat.friendId)"
      >
        <div class="chat-avatar-wrapper">
          <img 
            :src="chat.avatar || '/default-avatar.png'" 
            class="chat-avatar"
            alt="好友头像"
          />
          <span 
            v-if="chat.isLogging" 
            class="online-status"
          ></span>
        </div>
        <div class="chat-info">
          <div class="chat-header-row">
            <h4 class="chat-name">{{ chat.nickname || chat.username }}</h4>
            <span class="chat-time">{{ formatChatTime(chat.lastMessageTime) }}</span>
          </div>
          <div class="chat-preview">
            <p class="chat-message">{{ chat.lastMessage || '暂无消息' }}</p>
            <span v-if="chat.unreadCount > 0" class="unread-badge">{{ chat.unreadCount }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <svg viewBox="0 0 24 24" width="64" height="64">
        <path fill="#ccc" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
      </svg>
      <p>暂无聊天记录</p>
      <p class="empty-hint">去好友列表找个人聊天吧</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { normalizeAvatarPath } from '@/utils/avatar'

const router = useRouter()
const route = useRoute()

// 聊天项类型
interface ChatItem {
  friendId: string
  username: string
  nickname?: string
  avatar?: string
  lastMessage?: string
  lastMessageTime: number
  unreadCount: number
  isLogging?: boolean
}

const chatList = ref<ChatItem[]>([])

// 模拟聊天数据（每个好友的最后一条消息）
const mockChatData: Record<string, { lastMessage: string; lastMessageTime: number; unreadCount: number }> = {
  '1': {
    lastMessage: 'OK',
    lastMessageTime: Date.now() - 1800000,
    unreadCount: 0
  },
  '2': {
    lastMessage: '明天再说',
    lastMessageTime: Date.now() - 7200000,
    unreadCount: 2
  },
  '3': {
    lastMessage: '666',
    lastMessageTime: Date.now() - 86400000,
    unreadCount: 0
  }
}

// 加载聊天列表
const loadChatList = () => {
  try {
    // 从 localStorage 获取好友列表
    const friendsStr = localStorage.getItem('friends')
    if (friendsStr) {
      const friends = JSON.parse(friendsStr)
      
      // 为每个好友创建聊天项
      chatList.value = friends.map((friend: any) => {
        const chatData = mockChatData[friend.id] || {
          lastMessage: '开始聊天吧',
          lastMessageTime: Date.now(),
          unreadCount: 0
        }
        
        return {
          friendId: friend.id,
          username: friend.username,
          nickname: friend.nickname || friend.username,
          avatar: friend.avatar ? normalizeAvatarPath(friend.avatar) : undefined,
          lastMessage: chatData.lastMessage,
          lastMessageTime: chatData.lastMessageTime,
          unreadCount: chatData.unreadCount,
          isLogging: friend.isLogging || false
        }
      })
      
      // 按最后消息时间排序（最新的在前）
      chatList.value.sort((a, b) => b.lastMessageTime - a.lastMessageTime)
    } else {
      // 如果没有好友列表，使用模拟数据
      chatList.value = [
        {
          friendId: '1',
          username: 'zhangsan',
          nickname: 'hyh',
          avatar: 'public/image/hyh.jpg',
          lastMessage: '666',
          lastMessageTime: Date.now() - 1800000,
          unreadCount: 0,
          isLogging: true
        },
        {
          friendId: '2',
          username: 'lisi',
          nickname: 'czx',
          avatar: 'public/image/czx.jpg',
          lastMessage: 'OK',
          lastMessageTime: Date.now() - 7200000,
          unreadCount: 2,
          isLogging: false
        },
        {
          friendId: '3',
          username: 'wangwu',
          nickname: 'wyf',
          avatar: 'public/image/Kris.jpg',
          lastMessage: '明天再说',
          lastMessageTime: Date.now() - 86400000,
          unreadCount: 0,
          isLogging: true
        }
      ]
    }
  } catch (error) {
    console.error('加载聊天列表失败:', error)
    chatList.value = []
  }
}

// 格式化聊天时间
const formatChatTime = (timestamp: number): string => {
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
    return '昨天'
  }
  
  // 本周
  if (diff < 604800000) {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    return '星期' + weekdays[date.getDay()]
  }
  
  // 更早
  return (date.getMonth() + 1) + '/' + date.getDate()
}

// 跳转到聊天详情
const goToChatDetail = (friendId: string) => {
  router.push(`/chat/${friendId}`)
}

// 监听路由变化，当从聊天详情返回时刷新列表
watch(() => route.path, (newPath) => {
  if (newPath === '/chat') {
    loadChatList()
  }
})

onMounted(() => {
  loadChatList()
})
</script>

<style scoped>
.chat-page {
  min-height: 100vh;
  min-height: 100dvh;
  padding-bottom: 70px;
  background: #f5f5f5;
}

/* 头部 */
.chat-list-header {
  background: white;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

/* 聊天列表 */
.chat-list {
  background: white;
  margin-top: 12px;
}

.chat-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.chat-item:active {
  background-color: #f8f8f8;
}

.chat-item:last-child {
  border-bottom: none;
}

.chat-avatar-wrapper {
  position: relative;
  margin-right: 12px;
  flex-shrink: 0;
}

.chat-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.online-status {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #52c41a;
  border: 2px solid white;
  border-radius: 50%;
}

.chat-info {
  flex: 1;
  min-width: 0;
}

.chat-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.chat-name {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.chat-time {
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
  margin-left: 8px;
}

.chat-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.chat-message {
  margin: 0;
  font-size: 14px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.unread-badge {
  background: #ff4d4f;
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  flex-shrink: 0;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-state p {
  margin: 16px 0 0 0;
  color: #999;
  font-size: 16px;
}

.empty-hint {
  margin-top: 8px !important;
  font-size: 14px !important;
  color: #ccc !important;
}
</style>
