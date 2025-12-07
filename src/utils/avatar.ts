/**
 * 标准化头像路径
 * 将 image\hyh.jpg 或 image/hyh.jpg 转换为 /public/image/hyh.jpg
 */
export function normalizeAvatarPath(avatarPath: string | undefined | null): string {
  if (!avatarPath) return ''
  
  // 如果已经是完整URL（http/https/blob），直接返回
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://') || avatarPath.startsWith('blob:')) {
    return avatarPath
  }
  
  // 移除 /user/ 前缀（如果存在）
  let normalizedPath = avatarPath.replace(/^\/?user\//, '')
  
  // 如果路径是 image\文件名 或 image/文件名，转换为 /public/image/文件名
  if (normalizedPath.startsWith('image\\') || normalizedPath.startsWith('image/')) {
    const fileName = normalizedPath.replace(/^image[\\\/]/, '')
    return `/public/image/${fileName}`
  }
  
  // 如果已经是 /public/image/ 格式，直接返回
  if (normalizedPath.startsWith('/public/image/')) {
    return normalizedPath
  }
  
  // 如果路径包含反斜杠或斜杠，提取文件名
  if (normalizedPath.includes('\\') || normalizedPath.includes('/')) {
    const fileName = normalizedPath.split(/[\\\/]/).pop() || normalizedPath
    return `/public/image/${fileName}`
  }
  
  // 其他情况，直接作为文件名处理
  return `/public/image/${normalizedPath}`
}

