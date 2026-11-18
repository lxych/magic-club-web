<template>
  <div class="admin-guide">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>管理员手册</span>
          <el-tag type="danger">机密</el-tag>
        </div>
      </template>

      <el-collapse v-model="activeNames">
        <!-- 邀请码 -->
        <el-collapse-item name="invite">
          <template #title>
            <el-icon><Key /></el-icon>
            <span class="collapse-title">注册邀请码</span>
          </template>
          <div class="content-section">
            <el-alert
              title="重要提示"
              description="邀请码是控制新用户注册的唯一凭证，请妥善保管，不要随意泄露给非管理人员。"
              type="warning"
              :closable="false"
              show-icon
            />
            <div class="invite-code-box">
              <div class="code-label">当前邀请码：</div>
              <div class="code-value">
                <el-tag size="large" type="danger" effect="dark">{{ currentInviteCode || '暂无有效邀请码' }}</el-tag>
                <el-button 
                  v-if="currentInviteCode"
                  type="primary" 
                  link 
                  @click="copyInviteCode"
                >
                  <el-icon><CopyDocument /></el-icon> 复制
                </el-button>
              </div>
            </div>
            
            <!-- 邀请码管理操作 -->
            <div class="invite-actions">
              <el-button type="primary" @click="showSetCodeDialog = true">
                <el-icon><Edit /></el-icon> 设置新邀请码
              </el-button>
              <el-button type="danger" @click="handleInvalidateCode" :disabled="!currentInviteCode">
                <el-icon><CircleClose /></el-icon> 作废邀请码
              </el-button>
            </div>
            <div class="usage-guide">
              <h4>使用说明：</h4>
              <ol>
                <li>新用户在注册时必须输入正确的邀请码</li>
                <li>邀请码验证通过后，用户自动获得 MEMBER 权限</li>
                <li>没有邀请码的用户无法完成注册</li>
                <li><strong>作废邀请码</strong>：作废旧邀请码，作废后需设置新邀请码才能注册</li>
                <li><strong>设置新邀请码</strong>：设置新邀请码，旧邀请码自动作废</li>
                <li>已注册用户的权限不受影响</li>
              </ol>
            </div>
          </div>
        </el-collapse-item>

        <!-- 权限管理 -->
        <el-collapse-item name="permission">
          <template #title>
            <el-icon><UserFilled /></el-icon>
            <span class="collapse-title">权限管理</span>
          </template>
          <div class="content-section">
            <div class="table-wrap">
      <el-table :data="roleList" style="width: 100%">
              <el-table-column prop="role" label="角色" width="120" />
              <el-table-column prop="name" label="名称" width="120" />
              <el-table-column prop="permissions" label="权限说明" />
            </el-table>
      </div>
            <div class="usage-guide" style="margin-top: 20px;">
              <h4>权限说明：</h4>
              <ol>
                <li><strong>ADMIN（管理员）：</strong>系统最高权限，可执行所有操作</li>
                <li><strong>MEMBER（成员）：</strong>普通成员权限，可发帖、评论、下载资源</li>
                <li><strong>ALUMNI（校友）：</strong>毕业成员权限，仅可查看，不可发帖</li>
                <li>用户注册后默认获得 MEMBER 角色</li>
                <li>标记为毕业后自动变为 ALUMNI 角色</li>
                <li>管理员角色不可通过界面修改，需数据库操作</li>
              </ol>
            </div>
          </div>
        </el-collapse-item>

        <!-- 功能管理 -->
        <el-collapse-item name="features">
          <template #title>
            <el-icon><Tools /></el-icon>
            <span class="collapse-title">管理员专属功能</span>
          </template>
          <div class="content-section">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="论坛管理">
                <div class="feature-desc">
                  <p><strong>置顶帖子：</strong>将重要帖子置顶显示，每个板块最多显示3个置顶帖</p>
                  <p><strong>设置精华：</strong>标记优质帖子为精华，方便成员查看</p>
                  <p><strong>删除帖子：</strong>可删除任意帖子（包括他人发布的违规内容）</p>
                  <p><strong>删除评论：</strong>可删除任意评论（包括他人发布的违规内容）</p>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="资源管理">
                <div class="feature-desc">
                  <p><strong>上传资源：</strong>管理员可直接上传文件资源</p>
                  <p><strong>资源审批：</strong>在"资源审批"页面审核成员上传的资源，通过/拒绝后成员可见</p>
                  <p><strong>资源分类：</strong>建议按类型分类管理，方便成员查找</p>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="用户管理">
                <div class="feature-desc">
                  <p><strong>查看花名册：</strong>在"花名册"菜单中查看所有成员信息，包括姓名、学号、部门、专业等</p>
                  <p><strong>注销用户账号：</strong>在花名册中可注销违规用户账号，注销后该账号将无法登录</p>
                  <p><strong>标记毕业：</strong>将毕业成员标记为校友，自动获得 ALUMNI 权限</p>
                  <p><strong>取消毕业：</strong>误标记时可取消毕业状态，恢复为 MEMBER</p>
                  <p><strong>强制下线：</strong>对违规用户强制下线，同时作废当前邀请码</p>
                  <p class="text-danger">注意：强制下线后该用户无法登录，注销后账号永久禁用；需设置新邀请码才能注册新账号</p>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="邀请码管理">
                <div class="feature-desc">
                  <p><strong>查看邀请码：</strong>查看当前有效的注册邀请码</p>
                  <p><strong>设置新邀请码：</strong>更换邀请码，旧邀请码自动作废</p>
                  <p><strong>作废邀请码：</strong>手动作废邀请码，作废后无法注册新用户</p>
                  <p class="text-danger">注意：邀请码作废不影响已注册用户</p>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="全员禁言">
                <div class="feature-desc">
                  <p><strong>开启禁言：</strong>所有普通成员无法发帖和评论，仅管理员可操作</p>
                  <p><strong>关闭禁言：</strong>恢复正常发帖和评论功能</p>
                  <p class="text-warning">适用场景：系统维护、处理违规事件、重要公告期间</p>
                </div>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-collapse-item>

        <!-- 全员禁言 -->
        <el-collapse-item name="mute">
          <template #title>
            <el-icon><Mute /></el-icon>
            <span class="collapse-title">全员禁言</span>
          </template>
          <div class="content-section">
            <el-alert
              title="功能说明"
              description="开启全员禁言后，所有普通成员将无法发帖和评论，仅管理员可正常操作。常用于系统维护或处理违规事件。"
              type="info"
              :closable="false"
              show-icon
            />
            <div class="mute-status-box">
              <div class="status-label">当前状态：</div>
              <div class="status-value">
                <el-tag size="large" :type="isGlobalMute ? 'danger' : 'success'" effect="dark">
                  {{ isGlobalMute ? '已开启全员禁言' : '未开启禁言' }}
                </el-tag>
              </div>
            </div>
            <div class="mute-actions">
              <el-button 
                :type="isGlobalMute ? 'success' : 'danger'"
                size="large"
                @click="toggleGlobalMute"
              >
                <el-icon><Mute /></el-icon>
                {{ isGlobalMute ? '关闭全员禁言' : '开启全员禁言' }}
              </el-button>
            </div>
            <div class="usage-guide" style="margin-top: 20px;">
              <h4>使用说明：</h4>
              <ol>
                <li><strong>开启禁言：</strong>所有 MEMBER 和 ALUMNI 角色无法发帖和评论</li>
                <li><strong>管理员不受影响：</strong>ADMIN 角色仍可正常发帖和评论</li>
                <li><strong>适用场景：</strong>系统维护、处理违规事件、发布重要公告期间</li>
                <li><strong>谨慎使用：</strong>长期开启禁言会影响成员活跃度，建议短期使用</li>
              </ol>
            </div>
          </div>
        </el-collapse-item>

        <!-- 系统维护 -->
        <el-collapse-item name="maintenance">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span class="collapse-title">系统维护</span>
          </template>
          <div class="content-section">
            <el-alert
              title="注意事项"
              description="以下操作需要服务器访问权限，建议由技术人员执行。"
              type="info"
              :closable="false"
              show-icon
            />
            <ul class="maintenance-list">
              <li><strong>定期备份数据库：</strong>建议每天自动备份，保留最近7天的备份</li>
              <li><strong>清理临时文件：</strong>定期清理上传目录中的临时文件和过期资源</li>
              <li><strong>监控日志：</strong>查看系统日志，及时发现异常登录或操作</li>
              <li><strong>更新依赖：</strong>定期更新系统依赖，修复已知安全漏洞</li>
              <li><strong>邀请码轮换：</strong>建议定期更换邀请码，提高安全性</li>
              <li><strong>成员清理：</strong>定期清理长期未登录的僵尸账号</li>
            </ul>
            <el-divider />
            <div class="usage-guide">
              <h4>快速操作指南：</h4>
              <ol>
                <li><strong>处理违规用户：</strong>花名册 → 找到用户 → 强制下线或注销</li>
                <li><strong>审核资源：</strong>资源审批页面 → 审核通过/拒绝</li>
                <li><strong>更换邀请码：</strong>邀请码管理 → 设置新邀请码</li>
                <li><strong>维护期间：</strong>开启全员禁言 → 执行维护 → 关闭禁言</li>
                <li><strong>紧急处理：</strong>作废邀请码 → 开启禁言 → 排查问题</li>
              </ol>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <!-- 设置邀请码对话框 -->
    <el-dialog v-model="showSetCodeDialog" title="设置新邀请码" width="400px">
      <el-form>
        <el-form-item label="新邀请码">
          <el-input 
            v-model="newInviteCode" 
            placeholder="请输入新邀请码"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSetCodeDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSetCode">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Key, UserFilled, Tools, Setting, CopyDocument, Edit, CircleClose, Mute } from '@element-plus/icons-vue'
import { getInviteCode, setInviteCode, invalidateInviteCode, getGlobalMuteStatus, setGlobalMuteStatus } from '@/api/inviteCode'

const activeNames = ref(['invite'])
const currentInviteCode = ref('')
const showSetCodeDialog = ref(false)
const newInviteCode = ref('')
const isGlobalMute = ref(false)

const roleList = [
  {
    role: 'ADMIN',
    name: '管理员',
    permissions: '拥有所有权限：论坛管理、资源管理、成员管理、系统设置等'
  },
  {
    role: 'MEMBER',
    name: '成员',
    permissions: '普通权限：发帖、评论、查看资源、修改个人信息等'
  },
  {
    role: 'ALUMNI',
    name: '校友',
    permissions: '毕业成员权限：查看论坛、查看纪念墙等（不可发帖）'
  }
]

// 获取当前邀请码
const fetchInviteCode = async () => {
  try {
    const res = await getInviteCode()
    currentInviteCode.value = res
  } catch (error: any) {
    ElMessage.error(error.message || '获取邀请码失败')
  }
}

const copyInviteCode = () => {
  navigator.clipboard.writeText(currentInviteCode.value)
  ElMessage.success('邀请码已复制到剪贴板')
}

// 设置新邀请码
const handleSetCode = async () => {
  if (!newInviteCode.value.trim()) {
    ElMessage.warning('请输入新邀请码')
    return
  }
  try {
    await setInviteCode(newInviteCode.value)
    ElMessage.success('邀请码设置成功')
    showSetCodeDialog.value = false
    newInviteCode.value = ''
    fetchInviteCode()
  } catch (error: any) {
    ElMessage.error(error.message || '设置邀请码失败')
  }
}

// 作废邀请码
const handleInvalidateCode = async () => {
  try {
    await ElMessageBox.confirm(
      '作废邀请码后，新用户将无法注册，直到设置新邀请码。确定要作废吗？',
      '警告',
      { type: 'warning' }
    )
    await invalidateInviteCode('管理员手动作废')
    ElMessage.success('邀请码已作废')
    fetchInviteCode()
  } catch {
    // 取消
  }
}

// 获取禁言状态
const fetchMuteStatus = async () => {
  try {
    const res = await getGlobalMuteStatus()
    isGlobalMute.value = res
  } catch (error: any) {
    ElMessage.error(error.message || '获取禁言状态失败')
  }
}

// 切换禁言状态
const toggleGlobalMute = async () => {
  const newStatus = !isGlobalMute.value
  const action = newStatus ? '开启' : '关闭'
  try {
    await ElMessageBox.confirm(
      `确定${action}全员禁言吗？${newStatus ? '开启后所有普通成员将无法发帖和评论。' : '关闭后成员可正常发帖和评论。'}`,
      '确认操作',
      { type: newStatus ? 'warning' : 'info' }
    )
    await setGlobalMuteStatus(newStatus)
    ElMessage.success(`${action}全员禁言成功`)
    await fetchMuteStatus()
  } catch {
    // 取消
  }
}

onMounted(() => {
  fetchInviteCode()
  fetchMuteStatus()
})
</script>

<style scoped lang="scss">
.admin-guide {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
  }

  .collapse-title {
    margin-left: 8px;
    font-weight: 500;
  }

  .content-section {
    padding: 16px;

    .invite-code-box {
      margin: 20px 0;
      padding: 24px;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.06) 0%, rgba(118, 75, 162, 0.06) 100%);
      border: 1px solid rgba(102, 126, 234, 0.15);
      border-radius: 12px;
      text-align: center;

      .code-label {
        font-size: 14px;
        color: var(--mc-text-secondary);
        margin-bottom: 12px;
      }

      .code-value {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;

        .el-tag {
          font-size: 24px;
          padding: 12px 24px;
          font-family: var(--mc-font-mono, monospace);
        }
      }
    }

    .invite-actions {
      margin: 16px 0;
      display: flex;
      gap: 12px;
    }

    .usage-guide {
      margin-top: 16px;
      padding: 16px;
      background: var(--mc-bg-tertiary);
      border-radius: 10px;

      h4 {
        margin: 0 0 12px;
        color: var(--mc-text-primary);
      }

      ol {
        padding-left: 20px;
        color: var(--mc-text-secondary);
        line-height: 2;
      }
    }

    .maintenance-list {
      padding-left: 20px;
      color: var(--mc-text-secondary);
      line-height: 2;

      li {
        margin: 8px 0;
      }
    }
    
    .mute-status-box {
      margin: 16px 0;
      padding: 16px;
      background: var(--mc-bg-tertiary);
      border-radius: 10px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .mute-actions {
      margin: 16px 0;
    }
  }

  :deep(.el-collapse-item__header) {
    font-size: 16px;
    padding: 12px 16px;
    border-radius: 8px;
  }
  
  :deep(.el-collapse-item__wrap) {
    border-radius: 0 0 8px 8px;
  }
}

.feature-desc {
  p {
    margin: 8px 0;
    line-height: 1.7;
    color: var(--mc-text-primary);

    strong {
      color: var(--mc-primary);
      font-weight: 600;
    }
  }

  .text-danger {
    color: var(--mc-danger);
    font-weight: 500;
  }

  .text-warning {
    color: var(--mc-warning);
    font-weight: 500;
  }
}
</style>
