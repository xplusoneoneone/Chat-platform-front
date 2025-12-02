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
  isLike?: boolean // 用户是否点赞了该帖子
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

// 点赞帖子接口
export interface LikePostParams {
  userId: string | number
  postId: string | number
}

export interface LikePostResponse {
  [key: string]: any
}

export async function likePost(params: LikePostParams): Promise<LikePostResponse> {
  const config = {
    method: 'post',
    url: `/api/post/${params.postId}/like?userId=${params.userId}`,
    headers: {}
  }
  
  try {
    const response = await axios(config)
    return response.data
  } catch (error) {
    console.error('点赞失败:', error)
    throw error
  }
}

// 取消点赞接口
export interface UnlikePostParams {
  userId: string | number
  postId: string | number
}

export interface UnlikePostResponse {
  [key: string]: any
}

export async function unlikePost(params: UnlikePostParams): Promise<UnlikePostResponse> {
  const config = {
    method: 'post',
    url: `/api/post/${params.postId}/unlike?userId=${params.userId}`,
    headers: {}
  }
  
  try {
    const response = await axios(config)
    return response.data
  } catch (error) {
    console.error('取消点赞失败:', error)
    throw error
  }
}

// 评论帖子接口
export interface CommentPostParams {
  postId: string | number
  userId: string | number
  content: string
}

export interface CommentPostResponse {
  [key: string]: any
}

export async function commentPost(params: CommentPostParams): Promise<CommentPostResponse> {
  const config = {
    method: 'post',
    url: `/api/post/comment?postId=${params.postId}&userId=${params.userId}&content=${encodeURIComponent(params.content)}`,
    headers: {}
  }
  
  try {
    const response = await axios(config)
    return response.data
  } catch (error) {
    console.error('评论失败:', error)
    throw error
  }
}

// 获取评论列表接口
export interface GetCommentsParams {
  postId: string | number
}

export interface CommentItem {
  id: number
  postId: number
  userId: number
  user?: {
    username: string
    avatar?: string
  }
  content: string
  createTime: string
  [key: string]: any
}

export interface GetCommentsResponse {
  code?: number
  message?: string
  data?: CommentItem[]
  list?: CommentItem[]
  [key: string]: any
}

export async function getComments(params: GetCommentsParams): Promise<GetCommentsResponse> {
  const config = {
    method: 'get',
    url: `/api/post/${params.postId}/comments`,
    headers: {}
  }
  
  try {
    const response = await axios(config)
    return response.data
  } catch (error) {
    console.error('获取评论列表失败:', error)
    throw error
  }
}

