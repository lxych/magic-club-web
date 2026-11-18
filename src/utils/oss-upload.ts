/**
 * OSS 前端直传工具
 *
 * 使用 ali-oss SDK + 后端签发的 STS Token 实现分片上传。
 * 解决大文件（如视频）经过后端中转导致的超时和速度慢问题。
 *
 * 使用方式：
 *   1. 调用 getStsToken() 获取临时凭证
 *   2. 调用 uploadToOss(file, sts, onProgress) 直传 OSS
 *   3. 上传完成后调用后端的 oss/complete 接口保存记录
 */

import OSS from 'ali-oss'
import request from '@/utils/request'

/** STS 临时凭证结构（与后端 OssController 返回一致） */
export interface OssSts {
  accessKeyId: string
  accessKeySecret: string
  securityToken: string
  expiration: string
  region: string
  bucket: string
  endpoint: string
}

/** 分片大小：10MB */
const CHUNK_SIZE = 10 * 1024 * 1024

/** 最大并发分片数 */
const PARALLEL = 5

/** 分片上传进度信息 */
export interface UploadProgress {
  /** 已上传字节数 */
  uploaded: number
  /** 总大小（字节） */
  total: number
  /** 百分比 0-100 */
  percent: number
}

/**
 * 从后端获取 STS Token
 */
export async function getStsToken(): Promise<OssSts> {
  const data: any = await request.get('/oss/sts-token')
  return data as OssSts
}

/**
 * 生成 OSS 对象 Key（含日期路径 + UUID）
 * 格式：yyyy/MM/dd/{uuid}.{ext}
 */
function generateObjectKey(fileName: string): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const ext = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : ''
  const uuid = crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, '')
    : Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
  return `${y}/${m}/${d}/${uuid}${ext}`
}

/**
 * 上传文件到 OSS（分片上传，支持进度回调和断点续传）
 *
 * @param file       要上传的文件
 * @param sts        后端签发的 STS 临时凭证
 * @param onProgress 进度回调 (百分比 0-100)
 * @param retryCount 最大重试次数（默认 3）
 * @returns OSS 完整 URL（https://bucket.endpoint/objectKey）
 */
export async function uploadToOss(
  file: File,
  sts: OssSts,
  onProgress?: (progress: UploadProgress) => void,
  retryCount = 3
): Promise<string> {
  const objectKey = generateObjectKey(file.name)

  const client = new OSS({
    region: sts.region,
    bucket: sts.bucket,
    accessKeyId: sts.accessKeyId,
    accessKeySecret: sts.accessKeySecret,
    stsToken: sts.securityToken,
    secure: true,
    timeout: 120000, // 2 分钟超时
    retryMax: retryCount
  })

  let lastAttemptError: Error | null = null

  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[OSS] 重试上传 (${attempt + 1}/${retryCount}): ${file.name}`)
      }

      // 使用分片上传（multipartUpload 自动管理并发和进度）
      const result = await client.multipartUpload(objectKey, file, {
        partSize: CHUNK_SIZE,
        parallel: PARALLEL,
        progress: (pct: number, checkpoint: any) => {
          // 保存 checkpoint 到 sessionStorage 以便网络中断后恢复
          if (checkpoint) {
            try {
              sessionStorage.setItem(
                `oss_checkpoint_${file.name}_${file.size}`,
                JSON.stringify(checkpoint)
              )
            } catch {
              // sessionStorage 可能满
            }
          }
          const uploaded = Math.round((pct / 100) * file.size)
          onProgress?.({ uploaded, total: file.size, percent: Math.round(pct * 100) / 100 })
        },
        // 断点续传 — 尝试从 sessionStorage 恢复 checkpoint
        checkpoint: loadCheckpoint(file),
        // 分片上传模式
        mime: file.type || 'application/octet-stream'
      })

      // 上传成功，清理 checkpoint
      clearCheckpoint(file)

      // 构造 OSS URL
      const ossUrl = `https://${sts.bucket}.${sts.endpoint}/${result.name}`
      return ossUrl
    } catch (err: any) {
      lastAttemptError = err
      console.error(`[OSS] 上传失败 (尝试 ${attempt + 1}/${retryCount}):`, err.message || err)

      if (attempt < retryCount - 1) {
        // 等待后重试（指数退避）
        const waitMs = Math.min(2000 * Math.pow(2, attempt), 15000)
        await new Promise(resolve => setTimeout(resolve, waitMs))
      }
    }
  }

  throw new Error(
    `文件上传失败（已重试 ${retryCount} 次）: ${lastAttemptError?.message || '未知错误'}`
  )
}

/**
 * 从 sessionStorage 恢复上传断点
 */
function loadCheckpoint(file: File): any | undefined {
  try {
    const key = `oss_checkpoint_${file.name}_${file.size}`
    const raw = sessionStorage.getItem(key)
    return raw ? JSON.parse(raw) : undefined
  } catch {
    return undefined
  }
}

/**
 * 清理上传断点
 */
function clearCheckpoint(file: File): void {
  try {
    sessionStorage.removeItem(`oss_checkpoint_${file.name}_${file.size}`)
  } catch {
    // 忽略清理失败
  }
}

/** 大文件阈值：50MB，超过此值走 OSS 直传 */
export const OSS_DIRECT_UPLOAD_THRESHOLD = 50 * 1024 * 1024
