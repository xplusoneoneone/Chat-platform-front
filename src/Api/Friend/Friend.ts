/*
 * @Author: 徐佳德 1404577549@qq.com
 * @Date: 2025-12-02 20:30:00
 * @LastEditors: 徐佳德 1404577549@qq.com
 * @LastEditTime: 2025-12-03 17:03:13
 * @FilePath: \chat\src\Api\Friend\Friend.ts
 * @Description: 好友相关接口
 */
import axios from 'axios'

// 检查是否为好友接口参数
export interface CheckFriendParams {
  userId: string | number
  friendId: string | number
}

// 检查是否为好友接口响应
export interface CheckFriendResponse {
  code?: number
  message?: string
  data?: {
    isFriend?: boolean
    [key: string]: any
  }
  isFriend?: boolean
  [key: string]: any
}

// 检查是否为好友
export async function checkFriend(params: CheckFriendParams): Promise<CheckFriendResponse> {
  const { userId, friendId } = params
  
  const config = {
    method: 'get',
    url: `/api/friend/check?userId=${userId}&friendId=${friendId}`,
    headers: {}
  }
  
  try {
    const response = await axios(config)
    return response.data
  } catch (error) {
    console.error('检查好友关系失败:', error)
    throw error
  }
}

// 申请添加好友接口参数
export interface AddFriendParams {
  userId: string | number
  friendId: string | number
}

// 申请添加好友接口响应
export interface AddFriendResponse {
  code?: number
  message?: string
  data?: any
  [key: string]: any
}

// 申请添加好友
export async function addFriend(params: AddFriendParams): Promise<AddFriendResponse> {
  const { userId, friendId } = params
  
  const config = {
    method: 'post',
    url: `/api/friend/add?userId=${userId}&friendId=${friendId}`,
    headers: {}
  }
  
  try {
    const response = await axios(config)
    return response.data
  } catch (error) {
    console.error('申请添加好友失败:', error)
    throw error
  }
}

// 获取待处理好友申请接口参数
export interface GetFriendRequestsParams {
  receiverId: string | number
}

// 好友申请项
export interface FriendRequestItem {
  id: string | number
  userId?: string | number
  receiverId?: string | number
  requesterId?: string | number
  username?: string
  avatar?: string
  message?: string
  createdAt?: string
  createTime?: string
  updateTime?: string
  status?: string
  requester?: {
    id?: string | number
    username?: string
    avatar?: string
    signature?: string
    sex?: string
    [key: string]: any
  }
  [key: string]: any
}

// 处理好友申请接口参数
export interface HandleFriendRequestParams {
  receiverId: string | number
  requestId: string | number
  requesterId?: string | number
}

// 处理好友申请接口响应
export interface HandleFriendRequestResponse {
  code?: number
  message?: string
  data?: any
  [key: string]: any
}

// 同意好友申请
export async function acceptFriendRequest(params: HandleFriendRequestParams): Promise<HandleFriendRequestResponse> {
  const { receiverId, requestId } = params
  
  if (!requestId) {
    throw new Error('requestId is required')
  }
  
  const config = {
    method: 'post',
    url: `/api/friend/request/${requestId}/accept?receiverId=${receiverId}`,
    headers: {}
  }
  
  try {
    const response = await axios(config)
    return response.data
  } catch (error) {
    console.error('同意好友申请失败:', error)
    throw error
  }
}

// 拒绝好友申请
export async function rejectFriendRequest(params: HandleFriendRequestParams): Promise<HandleFriendRequestResponse> {
  const { receiverId, requestId } = params
  
  if (!requestId) {
    throw new Error('requestId is required')
  }
  
  const config = {
    method: 'post',
    url: `/api/friend/request/${requestId}/reject?receiverId=${receiverId}`,
    headers: {}
  }
  
  try {
    const response = await axios(config)
    return response.data
  } catch (error) {
    console.error('拒绝好友申请失败:', error)
    throw error
  }
}

// 获取待处理好友申请接口响应
export interface GetFriendRequestsResponse {
  code?: number
  message?: string
  data?: FriendRequestItem[] | {
    content?: FriendRequestItem[]
    [key: string]: any
  }
  [key: string]: any
}

// 获取待处理好友申请
export async function getFriendRequests(params: GetFriendRequestsParams): Promise<GetFriendRequestsResponse> {
  const { receiverId } = params
  
  const config = {
    method: 'get',
    url: `/api/friend/requests?receiverId=${receiverId}`,
    headers: {}
  }
  
  try {
    const response = await axios(config)
    return response.data
  } catch (error) {
    console.error('获取好友申请失败:', error)
    throw error
  }
}

// 获取好友列表接口参数
export interface GetFriendListParams {
  userId: string | number
}

// 好友列表项
export interface FriendListItem {
  id: string | number
  userId?: string | number
  username?: string
  nickname?: string
  avatar?: string
  signature?: string
  isOnline?: boolean
  lastActive?: string
  remark?: string
  [key: string]: any
}

// 获取好友列表接口响应
export interface GetFriendListResponse {
  code?: number
  message?: string
  data?: FriendListItem[] | {
    content?: FriendListItem[]
    [key: string]: any
  }
  [key: string]: any
}

// 获取好友列表
export async function getFriendList(params: GetFriendListParams): Promise<GetFriendListResponse> {
  const { userId } = params
  
  const config = {
    method: 'get',
    url: `/api/friend/list?userId=${userId}`,
    headers: {}
  }
  
  try {
    const response = await axios(config)
    return response.data
  } catch (error) {
    console.error('获取好友列表失败:', error)
    throw error
  }
}

