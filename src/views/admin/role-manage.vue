<template>
  <div class="permission-manage-page">
    <el-card shadow="never">
      <template #header>
        <span class="title">🔐 权限管理</span>
      </template>

      <p class="page-desc">
        管理成员的自定义权限。点击用户可独立配置其权限项，自定义权限将覆盖角色默认权限。
      </p>

      <!-- 角色默认权限定义（只读展示） -->
      <div class="role-cards">
        <el-card
          v-for="role in ROLES"
          :key="role.key"
          :class="['role-card', { active: selectedRoleTab === role.key }]"
          shadow="hover"
          @click="selectedRoleTab = role.key"
        >
          <template #header>
            <div class="role-card-header">
              <span class="role-name">{{ role.label }}</span>
              <el-tag :type="roleTagType(role.key)" size="small">{{ role.key }}</el-tag>
            </div>
          </template>
          <div class="role-permissions">
            <el-tag
              v-for="perm in role.permissions"
              :key="perm"
              size="small"
              class="perm-tag"
            >
              {{ permLabel(perm) }}
            </el-tag>
            <span v-if="role.permissions.length === 0" class="no-perm">只读（无写入权限）</span>
          </div>
        </el-card>
      </div>

      <!-- 用户权限管理 -->
      <el-divider />
      <h3 class="section-title">👤 成员权限配置</h3>

      <el-form :inline="true" class="search-form">
        <el-form-item>
          <el-input
            v-model="keyword"
            placeholder="输入用户名或姓名搜索"
            clearable
            style="width: 280px"
            @keyup.enter="searchUsers"
          >
            <template #append>
              <el-button @click="searchUsers">
                <el-icon><Search /></el-icon>
              </el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-select v-model="roleFilter" placeholder="按角色筛选" clearable style="width: 140px" @change="searchUsers">
            <el-option v-for="r in ROLES" :key="r.key" :label="r.label" :value="r.key" />
          </el-select>
        </el-form-item>
      </el-form>

      <!-- 用户表格 -->
      <el-table :data="userList" stripe v-loading="loading" class="user-table">
        <el-table-column label="头像" width="70">
          <template #default="{ row }">
            <el-avatar :size="36" :src="row.avatar" />
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" width="130" />
        <el-table-column label="姓名" width="120">
          <template #default="{ row }">
            {{ row.realName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="roleTagType(row.role)" size="small">{{ roleLabel(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="当前权限" min-width="280">
          <template #default="{ row }">
            <div class="perm-tags-cell">
              <el-tag
                v-if="row._customPermissions && row._customPermissions.length > 0"
                size="small"
                type="warning"
                effect="dark"
              >
                额外 +{{ row._customPermissions.length }}
              </el-tag>
              <template v-if="row._permissions && row._permissions.length > 0">
                <el-tag
                  v-for="perm in row._permissions.slice(0, 6)"
                  :key="perm"
                  size="small"
                  class="perm-tag-small"
                >
                  {{ permLabel(perm) }}
                </el-tag>
                <el-tag v-if="row._permissions.length > 6" size="small" type="info">
                  +{{ row._permissions.length - 6 }}
                </el-tag>
              </template>
              <span v-else class="no-perm">无权限</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openPermissionDialog(row)">
              <el-icon><EditPen /></el-icon>
              编辑权限
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="total > 0"
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[5, 10, 20]"
        layout="total, sizes, prev, pager, next"
        class="pagination"
        @change="searchUsers"
      />

      <el-empty v-if="!loading && userList.length === 0" description="未找到匹配用户，请尝试其他关键词" />
    </el-card>

    <!-- 权限编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="`编辑权限 - ${editingUser?.realName || editingUser?.username || ''}`"
      width="640px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div class="dialog-body">
        <!-- 用户信息 + 角色任命 -->
        <div class="user-info-bar">
          <el-avatar :size="40" :src="editingUser?.avatar" />
          <div class="user-meta">
            <span class="user-name">{{ editingUser?.realName || editingUser?.username }}</span>
            <el-tag :type="roleTagType(editingUser?.role || '')" size="small">
              {{ roleLabel(editingUser?.role || '') }}
            </el-tag>
          </div>
          <div class="role-assign">
            <span class="role-assign-label">任命角色</span>
            <el-select v-model="selectedRole" size="small" style="width: 132px">
              <el-option
                v-for="r in ROLES"
                :key="r.key"
                :label="r.label"
                :value="r.key"
              />
            </el-select>
          </div>
        </div>
        <p v-if="selectedRole !== editingUser?.role" class="role-change-tip">
          角色变更后将按「{{ roleLabel(selectedRole) }}」的默认权限重新计算，原角色自带的权限会自动收回，单独授予的额外权限保留。
        </p>

        <!-- 快捷操作按钮 -->
        <div class="quick-actions">
          <el-button size="small" type="primary" plain @click="setAllPermissions">
            <el-icon><CircleCheck /></el-icon>
            设为全部权限
          </el-button>
          <el-button size="small" type="warning" plain @click="setDefaultPermissions">
            <el-icon><RefreshLeft /></el-icon>
            恢复角色默认
          </el-button>
          <span class="quick-tip">
            灰显项为角色自带权限，不可在此取消；如需收回请调整该用户的角色。
          </span>
        </div>

        <!-- 权限分组 -->
        <div v-for="group in PERMISSION_GROUPS" :key="group.label" class="perm-group">
          <h4 class="perm-group-title">{{ group.label }}</h4>
          <div class="perm-items">
            <div v-for="item in group.items" :key="item.code" class="perm-item">
              <span class="perm-item-label">
                {{ item.label }}
                <el-tag
                  v-if="roleDefaultCodes.includes(item.code)"
                  size="small"
                  type="info"
                  effect="plain"
                >角色默认</el-tag>
              </span>
              <el-switch
                v-model="permSwitches[item.code]"
                size="small"
                :disabled="roleDefaultCodes.includes(item.code)"
                @change="onSwitchChange"
              />
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="savePermissions">
            确认保存
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, EditPen, CircleCheck, RefreshLeft } from '@element-plus/icons-vue'
import { getUserList, getUserPermissionDetail, updateUserPermissions, updateUserRole } from '@/api/user'

// ==================== 常量定义 ====================

// 权限分组定义
const PERMISSION_GROUPS = [
  {
    label: '论坛',
    items: [
      { code: 'forum:create', label: '发帖' },
      { code: 'forum:delete', label: '删帖' },
      { code: 'forum:top', label: '置顶' },
      { code: 'forum:essence', label: '精华' },
    ]
  },
  {
    label: '资源',
    items: [
      { code: 'resource:upload', label: '上传资源' },
      { code: 'resource:audit', label: '审批资源' },
      { code: 'resource:delete', label: '删除资源' },
    ]
  },
  {
    label: '公告',
    items: [
      { code: 'announcement:send', label: '发送公告' },
      { code: 'announcement:recall', label: '撤回公告' },
    ]
  },
  {
    label: '用户管理',
    items: [
      { code: 'user:manage', label: '成员管理（设毕业/强退/注销）' },
      { code: 'user:viewAll', label: '查看花名册' },
    ]
  },
  {
    label: '系统',
    items: [
      { code: 'system:config', label: '系统配置' },
      { code: 'log:view', label: '查看操作日志' },
      { code: 'role:manage', label: '权限管理' },
    ]
  }
]

// 所有权限码
const ALL_PERMISSION_CODES = PERMISSION_GROUPS.flatMap(g => g.items.map(i => i.code))

// 权限码 → 中文标签映射
const PERM_LABEL_MAP: Record<string, string> = {}
PERMISSION_GROUPS.forEach(g => g.items.forEach(i => { PERM_LABEL_MAP[i.code] = i.label }))

const permLabel = (code: string) => PERM_LABEL_MAP[code] || code

// 角色默认权限定义
const ROLES = [
  {
    key: 'ADMIN',
    label: '管理员',
    permissions: ALL_PERMISSION_CODES
  },
  {
    key: 'MODERATOR',
    label: '版主',
    permissions: [
      // 成员基础能力（版主本身也是成员，必须能发帖、传资源）
      'forum:create', 'resource:upload',
      // 论坛管理
      'forum:delete', 'forum:top', 'forum:essence',
      // 资源审核与清理
      'resource:audit', 'resource:delete',
      // 公告
      'announcement:send', 'announcement:recall',
      // 花名册
      'user:viewAll'
    ]
  },
  {
    key: 'MEMBER',
    label: '普通成员',
    permissions: ['forum:create', 'resource:upload']
  },
  {
    key: 'ALUMNI',
    label: '校友',
    permissions: []
  }
]

// ==================== 状态 ====================

const selectedRoleTab = ref('ADMIN')
const keyword = ref('')
const roleFilter = ref('')
const userList = ref<any[]>([])
const loading = ref(false)
const pageNum = ref(1)
const pageSize = ref(5)
const total = ref(0)

// 弹窗
const dialogVisible = ref(false)
const editingUser = ref<any>(null)
const saving = ref(false)
const permSwitches = reactive<Record<string, boolean>>({})
// 当前编辑用户角色自带的权限码（弹窗内这些开关锁定）
const roleDefaultCodes = ref<string[]>([])
// 弹窗中选定的角色（保存时若与当前不同则先调角色接口）
const selectedRole = ref('')

// ==================== 方法 ====================

const roleTagType = (role: string) => {
  const map: Record<string, string> = { ADMIN: 'danger', MODERATOR: 'warning', MEMBER: 'success', ALUMNI: 'info' }
  return map[role] || 'info'
}

const roleLabel = (role: string) => {
  const map: Record<string, string> = { ADMIN: '管理员', MODERATOR: '版主', MEMBER: '普通成员', ALUMNI: '校友' }
  return map[role] || role
}

const searchUsers = async () => {
  loading.value = true
  try {
    // 角色筛选时需要拉取大量数据做客户端过滤
    const fetchSize = roleFilter.value ? 9999 : pageSize.value
    const res: any = await getUserList({
      keyword: keyword.value.trim() || undefined,
      pageNum: roleFilter.value ? 1 : pageNum.value,
      pageSize: fetchSize
    })
    let records = (res.records || [])
    
    // 客户端按角色筛选
    if (roleFilter.value) {
      const allFiltered = records.filter((u: any) => u.role === roleFilter.value)
      total.value = allFiltered.length
      // 客户端分页
      const start = (pageNum.value - 1) * pageSize.value
      records = allFiltered.slice(start, start + pageSize.value)
    } else {
      total.value = res.total || 0
    }
    
    userList.value = records
    
    // 获取每个用户的权限明细（角色默认 + 单独授权的增量）
    for (const user of userList.value) {
      try {
        const detail: any = await getUserPermissionDetail(user.id)
        user._permissions = detail?.effectivePermissions || []
        user._customPermissions = detail?.customPermissions || []
        user._rolePermissions = detail?.rolePermissions || []
      } catch {
        // 权限获取失败，根据角色兜底
        const role = ROLES.find(r => r.key === user.role)
        user._permissions = role?.permissions || []
        user._customPermissions = []
        user._rolePermissions = role?.permissions || []
      }
    }
  } finally {
    loading.value = false
  }
}

const openPermissionDialog = async (user: any) => {
  editingUser.value = user
  selectedRole.value = user.role

  // 初始化权限开关
  ALL_PERMISSION_CODES.forEach(code => {
    permSwitches[code] = false
  })

  // 以服务端明细为准：角色默认权限锁开，增量权限可编辑
  let effective: string[] = user._permissions || []
  let roleDefaults: string[] = user._rolePermissions || []
  try {
    const detail: any = await getUserPermissionDetail(user.id)
    effective = detail?.effectivePermissions || []
    roleDefaults = detail?.rolePermissions || []
    user._customPermissions = detail?.customPermissions || []
  } catch {
    // 拉取失败时用列表页缓存兜底
  }

  roleDefaultCodes.value = roleDefaults
  // 生效权限全部置为打开（含角色默认与增量）
  effective.forEach((code: string) => {
    permSwitches[code] = true
  })
  // 角色默认权限不允许在这里取消
  roleDefaults.forEach((code: string) => {
    permSwitches[code] = true
  })

  dialogVisible.value = true
}

// 切换角色时，实时预览该角色的默认权限（锁定态跟着变）
watch(selectedRole, (role) => {
  if (!editingUser.value) return
  const defaults = ROLES.find(r => r.key === role)?.permissions || []
  roleDefaultCodes.value = defaults
  defaults.forEach(code => {
    permSwitches[code] = true
  })
})

const setAllPermissions = () => {
  ALL_PERMISSION_CODES.forEach(code => {
    permSwitches[code] = true
  })
}

/** 恢复到角色默认：关闭所有"额外授权"，仅保留角色自带的 */
const setDefaultPermissions = () => {
  if (!editingUser.value) return
  ALL_PERMISSION_CODES.forEach(code => {
    permSwitches[code] = roleDefaultCodes.value.includes(code)
  })
}

const onSwitchChange = () => {
  // 实时更新，无需额外处理
}

const savePermissions = async () => {
  if (!editingUser.value) return

  // 只提交"角色默认之外"的增量部分，交由后端取并集
  const extraPerms = ALL_PERMISSION_CODES.filter(
    code => permSwitches[code] && !roleDefaultCodes.value.includes(code)
  )
  const roleChanged = selectedRole.value && selectedRole.value !== editingUser.value.role

  saving.value = true
  try {
    // 先改角色（失败会抛错，权限就不动，避免半成功）
    if (roleChanged) {
      await updateUserRole(editingUser.value.id, selectedRole.value)
    }

    await updateUserPermissions(editingUser.value.id, extraPerms)

    const parts: string[] = []
    if (roleChanged) parts.push(`角色已改为${roleLabel(selectedRole.value)}`)
    if (extraPerms.length > 0) parts.push(`额外开放 ${extraPerms.length} 项权限`)
    ElMessage.success(parts.length > 0 ? parts.join('，') : '已恢复角色默认权限')

    // 同步更新本地数据
    editingUser.value._customPermissions = extraPerms

    // 刷新列表
    await searchUsers()

    dialogVisible.value = false
  } catch (err: any) {
    // 错误由拦截器统一提示（如"系统至少需要保留一名管理员"）
  } finally {
    saving.value = false
  }
}

// ==================== 生命周期 ====================

onMounted(() => {
  searchUsers()
})
</script>

<style scoped lang="scss">
.permission-manage-page {
  .title {
    font-size: 18px;
    font-weight: 600;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .page-desc {
    color: var(--mc-text-secondary);
    font-size: 13px;
    margin-bottom: 20px;
  }

  .section-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 16px;
  }

  .role-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
    margin-bottom: 8px;

    .role-card {
      cursor: pointer;
      border: 2px solid transparent;
      transition: all 0.3s ease;

      &:hover {
        border-color: var(--mc-primary);
      }

      &.active {
        border-color: var(--mc-primary);
        box-shadow: 0 0 12px rgba(102, 126, 234, 0.3);
      }

      .role-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .role-name {
          font-size: 15px;
          font-weight: 600;
        }
      }

      .role-permissions {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        min-height: 32px;

        .perm-tag {
          font-size: 11px;
        }

        .no-perm {
          color: var(--mc-text-placeholder);
          font-size: 13px;
          font-style: italic;
        }
      }
    }
  }

  .search-form {
    :deep(.el-form-item) {
      margin-bottom: 0;
    }
  }

  .user-table {
    margin-top: 16px;
    border-radius: 10px;
    overflow: hidden;
  }

  .perm-tags-cell {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;

    .perm-tag-small {
      font-size: 11px;
    }

    .no-perm {
      color: var(--mc-text-placeholder);
      font-size: 12px;
    }
  }

  .pagination {
    margin-top: 16px;
    justify-content: flex-end;
  }
}

// ==================== 弹窗样式 ====================
.dialog-body {
  .user-info-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--mc-bg-tertiary);
    border-radius: 10px;
    margin-bottom: 16px;

    .user-meta {
      display: flex;
      align-items: center;
      gap: 8px;

      .user-name {
        font-weight: 600;
        font-size: 15px;
      }
    }
  }

  .quick-actions {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--mc-border-light);

    .quick-tip {
      margin-left: auto;
      font-size: 12px;
      color: var(--mc-text-muted);
      line-height: 1.4;
    }
  }

  .role-assign {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 8px;

    .role-assign-label {
      font-size: 13px;
      color: var(--mc-text-secondary);
    }
  }

  .role-change-tip {
    margin: -8px 0 14px;
    padding: 8px 12px;
    border-radius: 6px;
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.25);
    font-size: 12px;
    line-height: 1.5;
    color: var(--mc-warning);
  }

  .perm-group {
    margin-bottom: 16px;

    .perm-group-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--mc-primary);
      margin-bottom: 10px;
      padding-left: 4px;
      border-left: 3px solid var(--mc-primary);
      padding: 2px 10px;
    }

    .perm-items {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 20px;

      .perm-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        background: var(--mc-bg-tertiary);
        border-radius: 8px;
        min-width: 180px;

        .perm-item-label {
          font-size: 13px;
          color: var(--mc-text-primary);
          flex: 1;
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// ==================== 公共覆盖 ====================
:deep(.el-card) {
  border: 1px solid var(--mc-border-light) !important;
}
</style>
