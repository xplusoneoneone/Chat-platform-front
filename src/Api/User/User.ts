/*
 * @Author: 徐佳德 1404577549@qq.com
 * @Date: 2025-12-02 16:08:00
 * @LastEditors: 徐佳德 1404577549@qq.com
 * @LastEditTime: 2025-12-02 16:15:45
 * @FilePath: \chat\src\Api\User\User.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import axios from 'axios'

// 用户信息接口
export interface UserInfo {
  id?: string | number
  username?: string
  avatar?: string
  signature?: string
  [key: string]: any
}

export interface GetUserInfoResponse {
  // 根据实际返回的数据结构定义
  [key: string]: any
}

export async function getUserInfo(userId?: string | number): Promise<GetUserInfoResponse> {
  let url = '/api/user/'
  if (userId !== undefined) {
    url += `${userId}`
  }
  
  const config = {
    method: 'get',
    url: url,
    headers: {}
  }
  
  try {
    const response = await axios(config)
    return response.data
  } catch (error) {
    console.error('获取用户信息失败:', error)
    throw error
  }
}

// 更新用户信息接口
export interface UpdateUserInfoParams {
  username?: string
  signature?: string
  sex?: string
  avatar?: string
}

export interface UpdateUserInfoResponse {
  // 根据实际返回的数据结构定义
  [key: string]: any
}

export async function updateUserInfo(params: UpdateUserInfoParams): Promise<UpdateUserInfoResponse> {
  // 获取 userId
  const userId = localStorage.getItem('userId')
  
  const data = JSON.stringify({
    userId: userId ? Number(userId) : 0,
    username: params.username || '',
    avatar: params.avatar || '',
    signature: params.signature || '',
    sex: params.sex || ''
  })
  
  const config = {
    method: 'post',
    url: '/api/user/update-info',
    headers: {
      'Content-Type': 'application/json'
    },
    data: data
  }
  
  try {
    const response = await axios(config)
    return response.data
  } catch (error) {
    console.error('更新用户信息失败:', error)
    throw error
  }
}

