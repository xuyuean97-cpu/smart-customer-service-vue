<template>
  <el-container class="profile-wrapper">
    <!-- 顶部导航 -->
    <el-header class="profile-header" height="60px">
      <div class="header-inner">
        <el-button text :icon="ArrowLeft" @click="$router.push('/chat')" class="back-btn">
          返回聊天
        </el-button>
        <h1 class="header-title">个人中心</h1>
        <div class="header-placeholder"></div>
      </div>
    </el-header>

    <!-- 主要内容 -->
    <el-main class="profile-main">
      <el-scrollbar>
        <div class="profile-content">

          <!-- 用户资料卡片 -->
          <el-card shadow="never" class="section-card user-card">
            <div class="user-banner">
              <div class="user-info-row">
                <el-avatar :size="72" class="profile-avatar">
                  <el-icon :size="32"><User /></el-icon>
                </el-avatar>
                <div class="user-meta">
                  <h2 class="user-name">{{ userPhone || '用户' }}</h2>
                  <el-tag type="success" size="small" effect="dark" round>
                    <el-icon class="tag-icon"><CircleCheck /></el-icon>
                    已认证
                  </el-tag>
                </div>
              </div>
            </div>

            <el-divider />

            <el-descriptions :column="responsiveColumns" border>
              <el-descriptions-item label="手机号">
                <div class="desc-value">
                  <el-icon><Phone /></el-icon>
                  <span>{{ maskedPhone }}</span>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="用户 ID">
                <div class="desc-value">
                  <el-icon><Ticket /></el-icon>
                  <span>{{ visibleUserId }}</span>
                  <el-button text size="small" @click="copyUserId" class="copy-btn">
                    <el-icon><CopyDocument /></el-icon>
                  </el-button>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="注册时间">
                <div class="desc-value">
                  <el-icon><Calendar /></el-icon>
                  <span>{{ registerDate }}</span>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="登录状态">
                <el-tag type="success" size="small" effect="light" round>已登录</el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <!-- 功能操作区 -->
          <div class="cards-grid">

            <!-- 安全设置 - 修改密码 -->
            <el-card shadow="never" class="section-card">
              <template #header>
                <div class="card-header">
                  <div class="card-header-left">
                    <el-icon :size="20" class="section-icon"><Lock /></el-icon>
                    <span>安全设置</span>
                  </div>
                  <el-tag size="small" effect="plain" round type="warning">建议定期修改</el-tag>
                </div>
              </template>

              <el-form
                ref="pwdFormRef"
                :model="pwdForm"
                :rules="pwdRules"
                label-position="top"
                @submit.prevent="handleUpdatePassword"
              >
                <el-form-item label="当前密码" prop="oldPassword">
                  <el-input
                    v-model="pwdForm.oldPassword"
                    type="password"
                    placeholder="请输入当前密码"
                    show-password
                    :prefix-icon="Lock"
                  />
                </el-form-item>
                <el-form-item label="新密码" prop="newPassword">
                  <el-input
                    v-model="pwdForm.newPassword"
                    type="password"
                    placeholder="请输入新密码 (至少6位)"
                    show-password
                    :prefix-icon="Key"
                  />
                  <!-- 密码强度指示器 -->
                  <div class="pwd-strength" v-if="pwdForm.newPassword">
                    <div class="strength-bars">
                      <div
                        v-for="i in 4"
                        :key="i"
                        class="strength-bar"
                        :class="{ active: passwordStrength >= i }"
                        :style="{ background: i <= passwordStrength ? strengthColor : undefined }"
                      ></div>
                    </div>
                    <span class="strength-label" :style="{ color: strengthColor }">
                      {{ strengthText }}
                    </span>
                  </div>
                </el-form-item>
                <el-form-item label="确认新密码" prop="confirmPassword">
                  <el-input
                    v-model="pwdForm.confirmPassword"
                    type="password"
                    placeholder="请再次输入新密码"
                    show-password
                    :prefix-icon="Key"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button
                    type="primary"
                    :loading="pwdLoading"
                    @click="handleUpdatePassword"
                    class="submit-btn"
                  >
                    {{ pwdLoading ? '提交中...' : '保存新密码' }}
                  </el-button>
                </el-form-item>
              </el-form>
            </el-card>

            <!-- 偏好设置 -->
            <el-card shadow="never" class="section-card">
              <template #header>
                <div class="card-header">
                  <div class="card-header-left">
                    <el-icon :size="20" class="section-icon"><Setting /></el-icon>
                    <span>偏好设置</span>
                  </div>
                </div>
              </template>

              <div class="pref-list">
                <div class="pref-item">
                  <div class="pref-label">
                    <el-icon><Bell /></el-icon>
                    <span>消息通知</span>
                  </div>
                  <el-switch v-model="prefs.notification" active-color="#6366f1" />
                </div>
                <el-divider class="pref-divider" />

                <div class="pref-item">
                  <div class="pref-label">
                    <el-icon><ChatDotSquare /></el-icon>
                    <span>消息提示音</span>
                  </div>
                  <el-switch v-model="prefs.sound" active-color="#6366f1" />
                </div>
                <el-divider class="pref-divider" />

                <div class="pref-item">
                  <div class="pref-label">
                    <el-icon><Reading /></el-icon>
                    <span>字体大小</span>
                  </div>
                  <el-select v-model="prefs.fontSize" size="small" style="width: 100px">
                    <el-option label="小" value="small" />
                    <el-option label="中" value="medium" />
                    <el-option label="大" value="large" />
                  </el-select>
                </div>
                <el-divider class="pref-divider" />

                <div class="pref-item">
                  <div class="pref-label">
                    <el-icon><ChatLineRound /></el-icon>
                    <span>自动翻译</span>
                  </div>
                  <el-switch v-model="prefs.autoTranslate" active-color="#6366f1" />
                </div>
              </div>
            </el-card>
          </div>

          <!-- 快捷操作 -->
          <el-card shadow="never" class="section-card">
            <template #header>
              <div class="card-header">
                <div class="card-header-left">
                  <el-icon :size="20" class="section-icon"><Menu /></el-icon>
                  <span>快捷操作</span>
                </div>
              </div>
            </template>

            <div class="shortcuts-grid">
              <div class="shortcut-item" @click="handleShortcut('history')">
                <div class="shortcut-icon" style="background: #eef2ff; color: #6366f1;">
                  <el-icon :size="22"><Clock /></el-icon>
                </div>
                <span class="shortcut-text">对话历史</span>
              </div>
              <div class="shortcut-item" @click="handleShortcut('feedback')">
                <div class="shortcut-icon" style="background: #fef3c7; color: #f59e0b;">
                  <el-icon :size="22"><ChatLineSquare /></el-icon>
                </div>
                <span class="shortcut-text">意见反馈</span>
              </div>
              <div class="shortcut-item" @click="handleShortcut('help')">
                <div class="shortcut-icon" style="background: #d1fae5; color: #10b981;">
                  <el-icon :size="22"><QuestionFilled /></el-icon>
                </div>
                <span class="shortcut-text">帮助中心</span>
              </div>
              <div class="shortcut-item" @click="handleShortcut('about')">
                <div class="shortcut-icon" style="background: #fce7f3; color: #ec4899;">
                  <el-icon :size="22"><InfoFilled /></el-icon>
                </div>
                <span class="shortcut-text">关于我们</span>
              </div>
            </div>
          </el-card>

          <!-- 退出登录 -->
          <div class="logout-section">
            <el-button
              type="danger"
              plain
              size="large"
              :icon="SwitchButton"
              class="logout-btn"
              @click="handleLogout"
            >
              退出登录
            </el-button>
          </div>

        </div>
      </el-scrollbar>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  ArrowLeft,
  User,
  CircleCheck,
  Phone,
  Ticket,
  CopyDocument,
  Calendar,
  Lock,
  Key,
  Setting,
  Bell,
  ChatDotSquare,
  Reading,
  ChatLineRound, // 替换 Translate 为 ChatLineRound
  Menu,
  Clock,
  ChatLineSquare,
  QuestionFilled,
  InfoFilled,
  SwitchButton,
} from '@element-plus/icons-vue'

const router = useRouter()

// ------ 用户数据 ------
const userPhone = ref(localStorage.getItem('user_id') || '')
const visibleUserId = ref('')
const registerDate = ref('')

const maskedPhone = computed(() => {
  const p = userPhone.value
  if (p.length >= 7) {
    return p.slice(0, 3) + '****' + p.slice(-4)
  }
  return p || '--'
})

// ------ 响应式列数 ------
const responsiveColumns = ref(2)

const updateColumns = () => {
  responsiveColumns.value = window.innerWidth < 640 ? 1 : 2
}

onMounted(() => {
  updateColumns()
  window.addEventListener('resize', updateColumns)

  // 生成稳定的 userId 和注册日期
  const storedUid = localStorage.getItem('profile_uid')
  if (storedUid) {
    visibleUserId.value = storedUid
  } else {
    const uid = 'UID-' + Math.random().toString(36).substring(2, 10).toUpperCase()
    localStorage.setItem('profile_uid', uid)
    visibleUserId.value = uid
  }

  const storedDate = localStorage.getItem('profile_reg_date')
  if (storedDate) {
    registerDate.value = storedDate
  } else {
    const d = new Date()
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    localStorage.setItem('profile_reg_date', dateStr)
    registerDate.value = dateStr
  }
})

// ------ 复制 ID ------
const copyUserId = async () => {
  try {
    await navigator.clipboard.writeText(visibleUserId.value)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.warning('复制失败，请手动复制')
  }
}

// ------ 修改密码 ------
const pwdFormRef = ref<FormInstance>()
const pwdLoading = ref(false)

const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const pwdRules = reactive<FormRules>({
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: any) => {
        if (value !== pwdForm.newPassword) {
          callback(new Error('两次密码输入不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
})

// 密码强度计算
const passwordStrength = computed(() => {
  const pwd = pwdForm.newPassword
  if (!pwd) return 0
  let score = 0
  if (pwd.length >= 6) score++
  if (pwd.length >= 10) score++
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd) && /[^a-zA-Z0-9]/.test(pwd)) score++
  return score
})

const strengthText = computed(() => {
  const labels = ['', '弱', '一般', '强', '很强']
  return labels[passwordStrength.value] || ''
})

const strengthColor = computed(() => {
  const colors = ['', '#ef4444', '#f59e0b', '#10b981', '#6366f1']
  return colors[passwordStrength.value] || ''
})

const handleUpdatePassword = async () => {
  if (!pwdFormRef.value) return
  const valid = await pwdFormRef.value.validate().catch(() => false)
  if (!valid) return

  pwdLoading.value = true
  try {
    const res = await fetch('http://localhost:8081/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: JSON.stringify({
        old_password: pwdForm.oldPassword,
        new_password: pwdForm.newPassword,
      }),
    })

    const data = await res.json()
    if (res.ok) {
      ElMessage.success('密码修改成功！请牢记您的新密码')
      pwdForm.oldPassword = ''
      pwdForm.newPassword = ''
      pwdForm.confirmPassword = ''
      pwdFormRef.value?.resetFields()
    } else {
      ElMessage.error(data.detail || '修改失败，请检查原密码是否正确')
    }
  } catch {
    ElMessage.error('服务器连接异常，请稍后重试')
  } finally {
    pwdLoading.value = false
  }
}

// ------ 偏好设置 ------
const prefs = reactive({
  notification: true,
  sound: true,
  fontSize: 'medium',
  autoTranslate: false,
})

// ------ 快捷操作 ------
const handleShortcut = (type: string) => {
  const messages: Record<string, string> = {
    history: '对话历史功能即将上线，敬请期待',
    feedback: '感谢您的关注，意见反馈功能即将上线',
    help: '帮助中心正在建设中',
    about: '智能客服助手 v1.0 - 为您提供优质的智能服务体验',
  }
  ElMessage.info(messages[type] || '功能开发中')
}

// ------ 退出登录 ------
const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？退出后将返回登录页面。', '退出确认', {
    confirmButtonText: '确定退出',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    localStorage.clear()
    ElMessage.success('已退出登录')
    router.push('/')
  }).catch(() => {
    // 取消
  })
}
</script>

<style scoped>
/* === 布局 === */
.profile-wrapper {
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* === Header === */
.profile-header {
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
  z-index: 10;
  display: flex;
  align-items: center;
  padding: 0 24px;
}

.header-inner {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-btn {
  font-weight: 500;
  color: #6366f1;
}

.header-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1e293b;
}

.header-placeholder {
  width: 90px;
}

/* === 主内容 === */
.profile-main {
  padding: 0;
  overflow: hidden;
}

.profile-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 20px 40px;
}

/* === 通用卡片 === */
.section-card {
  border-radius: 16px;
  border: 1px solid #f1f5f9;
  margin-bottom: 20px;
  overflow: hidden;
}

.section-card :deep(.el-card__header) {
  padding: 16px 24px;
  background: #fafbfc;
  border-bottom: 1px solid #f1f5f9;
}

.section-card :deep(.el-card__body) {
  padding: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 1rem;
  color: #1e293b;
}

.section-icon {
  color: #6366f1;
}

/* === 用户资料卡 === */
.user-card :deep(.el-card__body) {
  padding: 0;
}

.user-banner {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  padding: 32px 24px;
}

.user-info-row {
  display: flex;
  align-items: center;
  gap: 20px;
}

.profile-avatar {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: 3px solid rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-name {
  font-size: 1.35rem;
  font-weight: 700;
  color: #fff;
}

.tag-icon {
  margin-right: 2px;
}

.user-card :deep(.el-divider) {
  margin: 0;
}

.user-card :deep(.el-descriptions) {
  margin: 20px 24px 20px;
}

.desc-value {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #334155;
}

.copy-btn {
  color: #94a3b8;
  padding: 2px;
}

.copy-btn:hover {
  color: #6366f1;
}

/* === 卡片网格 === */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

/* === 密码强度 === */
.pwd-strength {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  width: 100%;
}

.strength-bars {
  display: flex;
  gap: 4px;
  flex: 1;
  max-width: 180px;
}

.strength-bar {
  height: 4px;
  flex: 1;
  border-radius: 2px;
  background: #e2e8f0;
  transition: background 0.3s;
}

.strength-label {
  font-size: 0.78rem;
  font-weight: 600;
  min-width: 32px;
}

.submit-btn {
  width: 100%;
  border-radius: 10px;
  font-weight: 600;
}

/* === 偏好设置 === */
.pref-list {
  display: flex;
  flex-direction: column;
}

.pref-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
}

.pref-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.95rem;
  color: #334155;
}

.pref-label .el-icon {
  color: #64748b;
  font-size: 18px;
}

.pref-divider {
  margin: 12px 0;
}

/* === 快捷操作 === */
.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.shortcut-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 8px;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.25s;
}

.shortcut-item:hover {
  background: #f8fafc;
  transform: translateY(-2px);
}

.shortcut-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.shortcut-item:hover .shortcut-icon {
  transform: scale(1.08);
}

.shortcut-text {
  font-size: 0.85rem;
  color: #475569;
  font-weight: 500;
}

/* === 退出登录 === */
.logout-section {
  display: flex;
  justify-content: center;
  padding: 8px 0 20px;
}

.logout-btn {
  width: 100%;
  max-width: 300px;
  border-radius: 12px;
  font-weight: 600;
}

/* === 响应式 === */
@media (max-width: 768px) {
  .profile-content {
    padding: 16px 12px 32px;
  }

  .cards-grid {
    grid-template-columns: 1fr;
  }

  .shortcuts-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .user-info-row {
    flex-direction: column;
    text-align: center;
  }

  .user-meta {
    align-items: center;
  }

  .user-card :deep(.el-descriptions) {
    margin: 16px 16px;
  }

  .section-card :deep(.el-card__body) {
    padding: 16px;
  }
}
</style>
