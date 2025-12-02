import axios from 'axios'

// 登录接口
export interface LoginParams {
  username: string
  password: string
}

export interface LoginResponse {
  // 根据实际返回的数据结构定义
  [key: string]: any
}

export async function login(params: LoginParams): Promise<LoginResponse> {
  const data = JSON.stringify({
    username: params.username,
    password: params.password
  })

  const config = {
    method: 'post',
    url: '/api/user/login',
    headers: {
      'Content-Type': 'application/json'
    },
    data: data
  }

  try {
    const response = await axios(config)
    return response.data
  } catch (error) {
    console.error('登录失败:', error)
    throw error
  }
}

// 注册接口
export interface RegisterParams {
  username: string
  password: string
}

export interface RegisterResponse {
  // 根据实际返回的数据结构定义
  [key: string]: any
}

export async function register(params: RegisterParams): Promise<RegisterResponse> {
  const data = JSON.stringify({
    username: params.username,
    password: params.password
  })

  const config = {
    method: 'post',
    url: '/api/user/register',
    headers: {
      'Content-Type': 'application/json'
    },
    data: data
  }

  try {
    const response = await axios(config)
    return response.data
  } catch (error) {
    console.error('注册失败:', error)
    throw error
  }
}

