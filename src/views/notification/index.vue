<template>
  <div class="notification-page">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <span class="title">🔔 消息中心</span>
          <div>
            <el-button size="small" @click="handleClearRead">清空已读</el-button>
          </div>
        </div>
      </template>

      <el-empty v-if="!loading && notifications.length === 0" description="暂无消息" />

      <div v-else v-loading="loading" class="notification-list">
        <div
          v-for="item in notifications"
          :key="item.id"
          class="notification-item"
          :class="{ 'is-unread': Number(item.isRead) === 0, 'is-recalled': Number(item.isRecalled) === 1 }"
          @click="handleClick(item)"
        >
          <div class="item-left">
            <span class="unread-dot" v-if="Number(item.isRead) === 0"></span>
            <el-avatar :size="40" :icon="getIconByType(item.type)" />
          </div>
          <div class="item-center">
            <div class="item-header">
              <span class="item-title">
                <span v-if="item.type === 'ANNOUNCEMENT'" class="announce-prefix">📢</span>
                {{ item.title }}
              </span>
              <el-tag :type="getTagType(item.type)" size="small" class="item-type-tag">
                {{ getTypeLabel(item.type) }}
              </el-tag>
            </div>
            <div class="item-content" :class="{ 'recalled-content': Number(item.isRecalled) === 1 }">
              {{ item.content }}
            </div>
            <!-- 附件列表（公告专用） -->
            <div
              v-if="item.type === 'ANNOUNCEMENT' && Number(item.isRecalled) !== 1 && parseAttachments(item.attachments).length > 0"
              class="attachments-row"
              @click.stop
            >
              <div
                v-for="(att, idx) in parseAttachments(item.attachments)"
                :key="idx"
                class="attachment-item"
              >
                <template v-if="isImageType(att.type)">
                  <el-image
                    :src="att.url"
                    :preview-src-list="getImagePreviewList(item.attachments)"
                    :initial-index="idx"
                    fit="cover"
                    class="attachment-thumb"
                  />
                </template>
                <template v-else>
                  <a :href="att.url" class="attachment-link" :title="att.name" :download="att.name">
                    <el-icon><Link /></el-icon>
                    <span class="attachment-name">{{ att.name }}</span>
                  </a>
                </template>
              </div>
            </div>
          </div>
          <div class="item-right">
            <span class="item-time">{{ formatTime(item.createTime) }}</span>
            <!-- 撤回按钮 -->
            <el-button
              v-if="canRecall(item)"
              type="warning"
              size="small"
              text
              @click.stop="handleRecall(item)"
            >
              撤回
            </el-button>
          </div>
        </div>
      </div>

      <div v-if="total > 0" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="fetchList"
        />
      </div>
    </el-card>

    <!-- 消息详情弹窗 -->
    <el-dialog v-model="detailVisible" :title="detailItem?.title" width="500px" append-to-body>
      <template v-if="detailItem">
        <div style="margin-bottom:16px">
          <el-tag :type="getTagType(detailItem.type)" size="small">{{ getTypeLabel(detailItem.type) }}</el-tag>
          <span style="margin-left:12px;color:#999">{{ formatTime(detailItem.createTime) }}</span>
        </div>
        <div
          style="line-height:1.8;white-space:pre-wrap"
          :style="Number(detailItem.isRecalled) === 1 ? { color: '#999', fontStyle: 'italic' } : {}"
        >
          {{ detailItem.content }}
        </div>
        <!-- 详情中的附件 -->
        <div
          v-if="detailItem.type === 'ANNOUNCEMENT' && Number(detailItem.isRecalled) !== 1 && parseAttachments(detailItem.attachments).length > 0"
          style="margin-top:16px"
        >
          <div style="font-weight:600;margin-bottom:8px">附件：</div>
          <div v-for="(att, idx) in parseAttachments(detailItem.attachments)" :key="idx" style="margin-bottom:8px">
            <template v-if="isImageType(att.type)">
              <el-image :src="att.url" :preview-src-list="[att.url]" fit="contain" style="max-height:300px;border-radius:8px" />
            </template>
            <template v-else>
              <a :href="att.url" :download="att.name" style="display:inline-flex;align-items:center;gap:4px;color:#667eea">
                <el-icon><Link /></el-icon> {{ att.name }}
              </a>
            </template>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Link } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'

interface NotificationItem {
  id: number
  userId: number
  senderId: number
  title: string
  content: string
  type: string
  relatedId: number
  isRead: number
  isRecalled: number
  attachments: string | null
  canRecallUntil: string
  createTime: string
}

interface AttachmentItem {
  name: string
  url: string
  type: string
}

const userStore = useUserStore()

const loading = ref(false)
const notifications = ref<NotificationItem[]>([])
const unreadCount = ref(0)
const detailVisible = ref(false)
const detailItem = ref<NotificationItem | null>(null)
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

const fetchList = async () => {
  loading.value = true
  try {
    const res: any = await request.get('/notification/list', {
      params: { pageNum: pageNum.value, pageSize: pageSize.value }
    })
    notifications.value = res.records || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

const fetchUnreadCount = async () => {
  try {
    const res: any = await request.get('/notification/unread-count')
    unreadCount.value = res || 0
  } catch {
    // ignore
  }
}

const handleClick = async (item: NotificationItem) => {
  detailItem.value = item
  detailVisible.value = true
  if (Number(item.isRead) === 0) {
    try {
      await request.put(`/notification/${item.id}/read`)
      item.isRead = 1
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch {
      // ignore
    }
  }
}

const handleClearRead = async () => {
  try {
    await ElMessageBox.confirm('确定清空所有已读消息？', '提示', { type: 'warning' })
    await request.delete('/notification/clear-read')
    await fetchList()
    ElMessage.success('已清空')
  } catch { /* cancel */ }
}

const handleRecall = async (item: NotificationItem) => {
  try {
    await ElMessageBox.confirm('确定要撤回这条公告吗？', '撤回公告', {
      confirmButtonText: '确定撤回',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await request.put(`/notification/${item.id}/recall`)
    ElMessage.success('公告已撤回')
    item.isRecalled = 1
    item.content = '此消息已被撤回'
    item.attachments = null
  } catch {
    // cancel or error
  }
}

/** 判断当前用户是否可以撤回此公告 */
const canRecall = (item: NotificationItem): boolean => {
  if (item.type !== 'ANNOUNCEMENT') return false
  if (Number(item.isRecalled) === 1) return false
  if (!item.canRecallUntil) return false

  const deadline = dayjs(item.canRecallUntil)
  if (deadline.isBefore(dayjs())) return false

  // 拥有 announcement:recall 权限，或发送者本人
  const currentUserId = userStore.userInfo?.id
  return userStore.hasPermission('announcement:recall') || currentUserId === item.senderId
}

/** 解析附件JSON */
const parseAttachments = (attStr: string | null): AttachmentItem[] => {
  if (!attStr) return []
  try {
    return JSON.parse(attStr)
  } catch {
    return []
  }
}

/** 判断是否为图片类型 */
const isImageType = (type: string): boolean => {
  return type && type.startsWith('image/')
}

/** 获取所有图片URL用于预览 */
const getImagePreviewList = (attStr: string | null): string[] => {
  if (!attStr) return []
  try {
    const list = JSON.parse(attStr) as AttachmentItem[]
    return list.filter(a => isImageType(a.type)).map(a => a.url)
  } catch {
    return []
  }
}

const formatTime = (time: string) => {
  if (!time) return ''
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const getIconByType = (type: string) => {
  switch (type) {
    case 'ANNOUNCEMENT': return 'Bell'
    case 'RESOURCE_APPROVED': return 'CircleCheck'
    case 'RESOURCE_REJECTED': return 'CircleClose'
    default: return 'InfoFilled'
  }
}

const getTagType = (type: string): 'success' | 'danger' | 'warning' | 'info' => {
  switch (type) {
    case 'ANNOUNCEMENT': return 'warning'
    case 'RESOURCE_APPROVED': return 'success'
    case 'RESOURCE_REJECTED': return 'danger'
    default: return 'info'
  }
}

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'ANNOUNCEMENT': return '公告'
    case 'RESOURCE_APPROVED': return '审批通过'
    case 'RESOURCE_REJECTED': return '审批驳回'
    default: return '系统通知'
  }
}

onMounted(() => {
  fetchList()
  fetchUnreadCount()
})

defineExpose({ unreadCount, fetchUnreadCount })
</script>

<style scoped lang="scss">
.notification-page {
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .title {
      font-size: 18px;
      font-weight: 600;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  :deep(.el-card) {
    border: 1px solid var(--mc-border-light) !important;
  }

  .notification-list {
    .notification-item {
      display: flex;
      align-items: flex-start;
      padding: 14px 16px;
      border-bottom: 1px solid var(--mc-border-light);
      cursor: pointer;
      transition: background 0.2s ease;

      &:hover {
        background: rgba(102, 126, 234, 0.04);
      }

      &.is-unread {
        background: rgba(102, 126, 234, 0.08);
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.12);

        &:hover {
          background: rgba(102, 126, 234, 0.1);
        }
      }

      &.is-recalled {
        opacity: 0.65;
      }

      .item-left {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-right: 14px;
        margin-top: 2px;

        .unread-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #f56c6c;
          flex-shrink: 0;
        }
      }

      .item-center {
        flex: 1;
        min-width: 0;

        .item-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;

          .item-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--mc-text-primary);

            .announce-prefix {
              margin-right: 2px;
            }
          }

          .item-type-tag {
            flex-shrink: 0;
          }
        }

        .item-content {
          font-size: 13px;
          color: var(--mc-text-muted);
          line-height: 1.5;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          &.recalled-content {
            color: #999;
            font-style: italic;
          }
        }

        .attachments-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;

          .attachment-item {
            .attachment-thumb {
              width: 48px;
              height: 48px;
              border-radius: 6px;
              border: 1px solid var(--mc-border-light);
              object-fit: cover;
            }

            .attachment-link {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              padding: 4px 10px;
              background: rgba(102, 126, 234, 0.06);
              border-radius: 6px;
              color: #667eea;
              font-size: 12px;
              text-decoration: none;
              transition: background 0.2s;

              &:hover {
                background: rgba(102, 126, 234, 0.12);
              }

              .attachment-name {
                max-width: 120px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
            }
          }
        }
      }

      .item-right {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 6px;
        margin-left: 16px;
        flex-shrink: 0;

        .item-time {
          font-size: 12px;
          color: var(--mc-text-muted);
        }
      }
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 24px;
    padding-top: 16px;
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .notification-page {
    .notification-list {
      .notification-item {
        flex-wrap: wrap;
        padding: 12px;

        .item-left {
          margin-right: 10px;
        }

        .item-right {
          width: 100%;
          flex-direction: row;
          justify-content: space-between;
          margin-left: 48px;
          margin-top: 6px;
        }
      }
    }
  }
}
</style>
