import axios from 'axios'

// 发布帖子接口
export interface ImageFile {
  file: File
  path: string // 文件的绝对路径
}

export interface CreatePostParams {
  userId: string | number
  content: string
  images?: ImageFile[]
}

export interface CreatePostResponse {
  // 根据实际返回的数据结构定义
  [key: string]: any
}

export async function createPost(params: CreatePostParams): Promise<CreatePostResponse> {
  const data = new FormData()
  
  // 构建查询参数
  let url = `/api/post/create?userId=${params.userId}&content=${encodeURIComponent(params.content)}`
  
  // 添加图片文件到 FormData，同时收集路径作为查询参数
  if (params.images && params.images.length > 0) {
    const imagePaths: string[] = []
    
    params.images.forEach((imageItem, index) => {
      // 添加文件
      data.append('images', imageItem.file)
      // 收集路径
      imagePaths.push(imageItem.path)
    })
    
    // 将路径数组作为查询参数传递
    // 方式1: 使用逗号分隔的字符串（推荐，避免双重序列化）
    url += `&imagePaths=${encodeURIComponent(imagePaths.join(','))}`
    
    
  }
  
  const config = {
    method: 'post',
    url: url,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    data: data
  }
  
  try {
    const response = await axios(config)
    return response.data
  } catch (error) {
    console.error('发布帖子失败:', error)
    throw error
  }
}

// 获取帖子列表接口
export interface GetPostListParams {
  userId?: string | number
  page?: number
  size?: number
}

export interface PostUser {
  id: string | number
  username: string
  avatar: string
}

export interface PostItem {
  id: string | number
  userId: string | number
  content: string
  images?: string[]
  createTime?: string
  user?: PostUser
  [key: string]: any
}

export interface GetPostListResponse {
  code?: number
  message?: string
  data?: {
    content: PostItem[]
    total: number
    size: number
    totalPages: number
    page: number
  }
  // 兼容旧格式
  list?: PostItem[]
  total?: number
  page?: number
  size?: number
  [key: string]: any
}

export async function getPostList(params: GetPostListParams = {}): Promise<GetPostListResponse> {
  const { userId, page = 1, size = 10 } = params
  
  let url = `/api/post/list?page=${page}&size=${size}`
  if (userId !== undefined) {
    url += `&userId=${userId}`
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
    console.error('获取帖子列表失败:', error)
    throw error
  }
}

