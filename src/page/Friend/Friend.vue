<template>
  <div class="friend-page">
    <!-- 搜索栏 -->
    <div class="search-section">
      <div class="search-bar">
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索好友"
          @input="searchFriends"
        />
        <button class="search-btn">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
        </button>
      </div>
      <button class="add-friend-btn" @click="showAddFriendModal = true">
        <span>+</span> 添加好友
      </button>
    </div>

    <!-- 好友申请 -->
    <div v-if="friendRequests.length > 0" class="requests-section">
      <div class="section-header">
        <h3>好友申请</h3>
        <span class="badge">{{ friendRequests.length }}</span>
      </div>
      <div class="request-list">
        <div v-for="request in friendRequests" :key="request.id" class="request-item">
          <img 
            :src="request.avatar || '/default-avatar.png'" 
            class="request-avatar"
            alt="申请者头像"
          />
          <div class="request-info">
            <h4>{{ request.username }}</h4>
            <p v-if="request.message" class="request-message">
              {{ request.message }}
            </p>
            <p class="request-time">{{ formatTime(request.createdAt) }}</p>
          </div>
          <div class="request-actions">
            <button class="accept-btn" @click="acceptFriendRequest(request.id)">
              同意
            </button>
            <button class="reject-btn" @click="rejectFriendRequest(request.id)">
              拒绝
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 好友列表 -->
    <div class="friends-section">
      <div class="section-header">
        <h3>我的好友</h3>
        <span class="count">{{ filteredFriends.length }}人</span>
      </div>
      
      <div v-if="filteredFriends.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" width="48" height="48">
          <path fill="#ccc" d="M16.5 13c-1.2 0-3.07.34-4.5 1-1.43-.67-3.3-1-4.5-1C5.33 13 1 14.08 1 16.25V19h22v-2.75c0-2.17-4.33-3.25-6.5-3.25zM7.5 12c1.93 0 3.5-1.57 3.5-3.5S9.43 5 7.5 5 4 6.57 4 8.5 5.57 12 7.5 12zm9 0c1.93 0 3.5-1.57 3.5-3.5S18.43 5 16.5 5 13 6.57 13 8.5s1.57 3.5 3.5 3.5z"/>
        </svg>
        <p>暂无好友</p>
        <button @click="showAddFriendModal = true" class="empty-add-btn">
          去添加好友
        </button>
      </div>
      
      <div v-else class="friend-list">
        <div 
          v-for="friend in filteredFriends" 
          :key="friend.id"
          class="friend-item"
          @click="goToChat(friend.id)"
        >
          <div class="friend-avatar-wrapper">
            <img 
              :src="friend.avatar || '/default-avatar.png'" 
              class="friend-avatar"
              alt="好友头像"
            />
            <span 
              v-if="friend.isLogging" 
              class="online-status"
            ></span>
          </div>
          <div class="friend-info">
            <h4 class="friend-name">{{ friend.nickname || friend.username }}</h4>
            <p class="friend-signature">{{ friend.signature || '暂无签名' }}</p>
            <p class="friend-last-active">
              {{ friend.isLogging ? '在线' : formatLastActive(friend.lastActive) }}
            </p>
          </div>
          <div class="friend-actions">
            <button 
              class="chat-btn"
              @click.stop="goToChat(friend.id)"
            >
              发消息
            </button>
            <button 
              class="more-btn"
              @click.stop="showFriendMenu(friend)"
            >
              ⋮
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加好友模态框 -->
    <div v-if="showAddFriendModal" class="modal-overlay" @click.self="showAddFriendModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>添加好友</h3>
          <button class="close-btn" @click="showAddFriendModal = false">×</button>
        </div>
        <div class="modal-body">
          <input
            v-model="addFriendInput"
            type="text"
            placeholder="输入好友的用户名或ID"
            class="friend-input"
            @keyup.enter="searchAddFriend"
          />
          <div v-if="searchResults.length > 0" class="search-results">
            <div 
              v-for="user in searchResults"
              :key="user.id"
              class="search-result-item"
            >
              <img :src="user.avatar" class="result-avatar" alt="用户头像" />
              <div class="result-info">
                <h4>{{ user.username }}</h4>
                <p>{{ user.signature || '暂无签名' }}</p>
              </div>
              <button 
                class="add-btn"
                :disabled="user.isFriend || user.requestSent"
                @click="sendFriendRequest(user.id)"
              >
                {{ getAddButtonText(user) }}
              </button>
            </div>
          </div>
          <div v-else-if="addFriendInput && !searching" class="no-results">
            未找到相关用户
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="showAddFriendModal = false">
            取消
          </button>
        </div>
      </div>
    </div>

    <!-- 好友操作菜单 -->
    <div v-if="selectedFriend" class="menu-overlay" @click.self="selectedFriend = null">
      <div class="menu-content">
        <div class="menu-item" @click="viewFriendProfile(selectedFriend.id)">
          查看资料
        </div>
        <div class="menu-item" @click="setFriendRemark(selectedFriend.id)">
          设置备注
        </div>
        <div class="menu-item danger" @click="removeFriend(selectedFriend.id)">
          删除好友
        </div>
        <div class="menu-item cancel" @click="selectedFriend = null">
          取消
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { addFriend, getFriendRequests, getFriendList, acceptFriendRequest as acceptFriendRequestApi, rejectFriendRequest as rejectFriendRequestApi, type FriendRequestItem, type FriendListItem } from '@/Api/Friend/Friend'
import { normalizeAvatarPath } from '@/utils/avatar'

const router = useRouter()
const route = useRoute()

// 好友申请类型
interface FriendRequest {
  id: string | number
  username: string
  avatar?: string
  message?: string
  createdAt: string
  userId?: string | number
  receiverId?: string | number
  requesterId?: string | number
  status?: string
  signature?: string
  sex?: string
}

// 好友类型
interface Friend {
  id: string
  username: string
  nickname?: string
  avatar?: string
  signature?: string
  lastActive?: string
  remark?: string
  isLogging?: boolean
}

// 搜索到的用户类型
interface SearchUser {
  id: string
  username: string
  avatar?: string
  signature?: string
  isFriend: boolean
  requestSent: boolean
}

// 状态
const searchKeyword = ref('')
const friendRequests = ref<FriendRequest[]>([])

const friends = ref<Friend[]>([])

const showAddFriendModal = ref(false)
const addFriendInput = ref('')
const searchResults = ref<SearchUser[]>([])
const searching = ref(false)
const selectedFriend = ref<Friend | null>(null)

// 计算属性
const filteredFriends = computed(() => {
  if (!searchKeyword.value) return friends.value
  
  const keyword = searchKeyword.value.toLowerCase()
  return friends.value.filter(friend => 
    friend.username.toLowerCase().includes(keyword) ||
    (friend.nickname?.toLowerCase().includes(keyword)) ||
    (friend.signature?.toLowerCase().includes(keyword)) ||
    (friend.remark?.toLowerCase().includes(keyword))
  )
})

// 搜索好友
const searchFriends = () => {
  // 这里可以添加防抖
  console.log('搜索关键词:', searchKeyword.value)
}

// 搜索添加好友
const searchAddFriend = async () => {
  if (!addFriendInput.value.trim()) return
  
  searching.value = true
  try {
    // 这里调用搜索用户的API
    // const response = await searchUsers(addFriendInput.value)
    // searchResults.value = response.data
    
    // 模拟数据
    searchResults.value = [
      {
        id: '4',
        username: addFriendInput.value,
        signature: '新用户',
        isFriend: false,
        requestSent: false
      }
    ]
  } catch (error) {
    console.error('搜索用户失败:', error)
    searchResults.value = []
  } finally {
    searching.value = false
  }
}

// 获取添加按钮文本
const getAddButtonText = (user: SearchUser): string => {
  if (user.isFriend) return '已是好友'
  if (user.requestSent) return '已发送'
  return '添加'
}

// 发送好友申请
const sendFriendRequest = async (friendId: string) => {
  try {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      alert('请先登录')
      return
    }
    
    const response = await addFriend({
      userId: userId,
      friendId: friendId
    })
    
    // 更新状态
    const user = searchResults.value.find(u => u.id === friendId)
    if (user) {
      user.requestSent = true
    }
    
    alert(response.message || '好友申请已发送')
  } catch (error: any) {
    console.error('发送好友申请失败:', error)
    const errorMessage = error.response?.data?.message || '发送失败，请重试'
    alert(errorMessage)
  }
}

// 同意好友申请
const acceptFriendRequest = async (requestId: string | number) => {
  try {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      alert('请先登录')
      return
    }

    const request = friendRequests.value.find(r => r.id === requestId)
    const requesterId = request?.requesterId || request?.userId

    const resp = await acceptFriendRequestApi({
      receiverId: userId,
      requestId: requestId,
      requesterId
    })

    // 更新本地数据
    if (request) {
      friends.value.push({
        id: String(requesterId),
        username: request.username,
        nickname: request.username,
        avatar: request.avatar,
        signature: request.signature || '',
        isLogging: true,
        lastActive: new Date().toISOString(),
        remark: request.signature
      })
    }

    friendRequests.value = friendRequests.value.filter(r => r.id !== requestId)
    alert(resp?.message || '已添加为好友')
  } catch (error: any) {
    console.error('同意好友申请失败:', error)
    alert(error?.response?.data?.message || '操作失败，请重试')
  }
}

// 拒绝好友申请
const rejectFriendRequest = async (requestId: string | number) => {
  try {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      alert('请先登录')
      return
    }

    const request = friendRequests.value.find(r => r.id === requestId)
    const requesterId = request?.requesterId || request?.userId

    const resp = await rejectFriendRequestApi({
      receiverId: userId,
      requestId: requestId,
      requesterId
    })

    friendRequests.value = friendRequests.value.filter(r => r.id !== requestId)
    alert(resp?.message || '已拒绝')
  } catch (error: any) {
    console.error('拒绝好友申请失败:', error)
    alert(error?.response?.data?.message || '操作失败，请重试')
  }
}

// 跳转到聊天
const goToChat = (friendId: string) => {
  // 保存好友列表到 localStorage，供聊天页面使用
  try {
    localStorage.setItem('friends', JSON.stringify(friends.value))
  } catch (error) {
    console.error('保存好友列表失败:', error)
  }
  // 先跳转到聊天列表，然后自动进入该好友的聊天详情
  router.push(`/chat/${friendId}`)
}

// 显示好友菜单
const showFriendMenu = (friend: Friend) => {
  selectedFriend.value = friend
}

// 查看好友资料
const viewFriendProfile = (friendId: string) => {
  router.push(`/user/${friendId}`)
  selectedFriend.value = null
}

// 设置好友备注
const setFriendRemark = (friendId: string) => {
  const friend = friends.value.find(f => f.id === friendId)
  if (friend) {
    const remark = prompt('请输入备注名:', friend.remark || friend.nickname)
    if (remark !== null) {
      friend.remark = remark
      // 这里调用API保存备注
    }
  }
  selectedFriend.value = null
}

// 删除好友
const removeFriend = (friendId: string) => {
  if (confirm('确定要删除这位好友吗？')) {
    // 这里调用删除好友的API
    friends.value = friends.value.filter(f => f.id !== friendId)
    selectedFriend.value = null
  }
}

// 格式化时间
const formatTime = (timeString: string) => {
  const time = new Date(timeString)
  const now = new Date()
  const diff = now.getTime() - time.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  
  return time.toLocaleDateString()
}

// 格式化最后活跃时间
const formatLastActive = (timeString?: string) => {
  if (!timeString) return '未知'
  
  const time = new Date(timeString)
  const now = new Date()
  const diff = now.getTime() - time.getTime()
  
  if (diff < 86400000) {
    return time.getHours().toString().padStart(2, '0') + ':' + 
           time.getMinutes().toString().padStart(2, '0')
  }
  
  return `${Math.floor(diff / 86400000)}天前`
}

// 加载好友数据
const loadFriendsData = async () => {
  try {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      console.warn('未找到用户ID')
      return
    }
    
    // 获取待处理的好友申请
    try {
      const requestsResponse = await getFriendRequests({ receiverId: userId })
      console.log('好友申请接口响应:', requestsResponse)
      
      // 处理好友申请数据
      let requestsData: FriendRequestItem[] = []
      if (requestsResponse.data) {
        if (Array.isArray(requestsResponse.data)) {
          requestsData = requestsResponse.data
        } else if (requestsResponse.data.content && Array.isArray(requestsResponse.data.content)) {
          requestsData = requestsResponse.data.content
        }
      }
      
      // 转换为 FriendRequest 格式
      friendRequests.value = requestsData.map((item: FriendRequestItem) => {
        const requester = item.requester || {}
        return {
          id: item.id || item.requesterId || item.userId || '',
          username: requester.username || item.username || '未知用户',
          avatar: normalizeAvatarPath(requester.avatar || item.avatar),
          message: item.message,
          createdAt: item.createTime || item.createdAt || new Date().toISOString(),
          userId: item.requesterId || item.userId,
          receiverId: item.receiverId,
          requesterId: item.requesterId,
          status: item.status,
          signature: requester.signature,
          sex: requester.sex
        }
      })
      
      console.log('好友申请数据加载完成:', friendRequests.value)
    } catch (error: any) {
      console.error('获取好友申请失败:', error)
      // 如果获取失败，清空列表
      friendRequests.value = []
    }
    
    // 获取好友列表
    const friendsResponse = await getFriendList({ userId })
    
    // 处理好友列表数据
    let friendsData: FriendListItem[] = []
    if (friendsResponse.data) {
      if (Array.isArray(friendsResponse.data)) {
        friendsData = friendsResponse.data
      } else if (friendsResponse.data.content && Array.isArray(friendsResponse.data.content)) {
        friendsData = friendsResponse.data.content
      }
    }
    
    // 转换为 Friend 格式
    friends.value = friendsData.map((item: FriendListItem) => ({
      id: String(item.id || item.userId || ''),
      username: item.username || '未知用户',
      nickname: item.nickname || item.username,
      avatar: normalizeAvatarPath(item.avatar),
      signature: item.signature || '',
      isLogging: item.isLogging || false,
      lastActive: item.lastActive || new Date().toISOString(),
      remark: item.remark
    }))
    
    console.log('好友列表数据加载完成:', friends.value)
  } catch (error) {
    console.error('加载好友数据失败:', error)
  }
}

onMounted(() => {
  loadFriendsData()
})

// 监听路由变化，当进入好友页面时刷新数据
watch(
  () => route.path,
  (newPath) => {
    if (newPath === '/friend') {
      loadFriendsData()
    }
  }
)
</script>

<style scoped>
.friend-page {
  min-height: 100vh;
  min-height: 100dvh;
  padding-bottom: 70px;
  background: #f5f5f5;
}

/* 搜索栏 */
.search-section {
  background: white;
  padding: 16px 20px;
  display: flex;
  gap: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.search-bar {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-bar input {
  width: 100%;
  padding: 12px 40px 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  font-size: 14px;
  background: #f8f8f8;
  outline: none;
}

.search-bar input:focus {
  border-color: #007bff;
  background: white;
}

.search-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 4px;
}

.add-friend-btn {
  padding: 0 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  white-space: nowrap;
}

.add-friend-btn span {
  font-size: 18px;
}

/* 好友申请 */
.requests-section {
  background: white;
  margin: 12px 0;
  padding: 0 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.badge {
  background: #ff4d4f;
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.count {
  font-size: 14px;
  color: #999;
}

.request-list {
  border-top: 1px solid #f0f0f0;
}

.request-item {
  display: flex;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.request-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
}

.request-info {
  flex: 1;
}

.request-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
}

.request-message {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #666;
}

.request-time {
  margin: 0;
  font-size: 12px;
  color: #999;
}

.request-actions {
  display: flex;
  gap: 8px;
}

.accept-btn,
.reject-btn {
  padding: 6px 16px;
  border-radius: 15px;
  font-size: 14px;
  border: none;
  cursor: pointer;
}

.accept-btn {
  background: #007bff;
  color: white;
}

.reject-btn {
  background: #f0f0f0;
  color: #666;
}

/* 好友列表 */
.friends-section {
  background: white;
  margin: 12px 0;
  padding: 0 20px;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  border-top: 1px solid #f0f0f0;
}

.empty-state p {
  margin: 16px 0;
  color: #999;
}

.empty-add-btn {
  padding: 8px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

.friend-list {
  border-top: 1px solid #f0f0f0;
}

.friend-item {
  display: flex;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.friend-item:active {
  background-color: #f8f8f8;
}

.friend-avatar-wrapper {
  position: relative;
  margin-right: 12px;
}

.friend-avatar {
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

.friend-info {
  flex: 1;
}

.friend-name {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
}

.friend-signature {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.friend-last-active {
  margin: 0;
  font-size: 12px;
  color: #999;
}

.friend-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-btn {
  padding: 6px 12px;
  background: #f0f0f0;
  color: #333;
  border: none;
  border-radius: 15px;
  font-size: 12px;
  cursor: pointer;
}

.more-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 20px;
  cursor: pointer;
  padding: 0 4px;
}

/* 模态框 */
.modal-overlay,
.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
}

.modal-body {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.friend-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  margin-bottom: 16px;
  outline: none;
}

.friend-input:focus {
  border-color: #007bff;
}

.search-results {
  max-height: 300px;
  overflow-y: auto;
}

.search-result-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.search-result-item:last-child {
  border-bottom: none;
}

.result-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
}

.result-info {
  flex: 1;
}

.result-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
}

.result-info p {
  margin: 0;
  font-size: 12px;
  color: #999;
}

.add-btn {
  padding: 6px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 15px;
  font-size: 14px;
  cursor: pointer;
  min-width: 60px;
}

.add-btn:disabled {
  background: #f0f0f0;
  color: #999;
  cursor: not-allowed;
}

.no-results {
  text-align: center;
  padding: 20px;
  color: #999;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #f0f0f0;
  text-align: right;
}

.cancel-btn {
  padding: 8px 24px;
  background: #f0f0f0;
  color: #666;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

/* 菜单 */
.menu-content {
  background: white;
  border-radius: 12px;
  width: 80%;
  max-width: 300px;
  overflow: hidden;
}

.menu-item {
  padding: 16px 20px;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  color: #333;
}

.menu-item:active {
  background-color: #f8f8f8;
}

.menu-item.danger {
  color: #ff4d4f;
}

.menu-item.cancel {
  color: #999;
  border-top: 6px solid #f0f0f0;
}
</style>