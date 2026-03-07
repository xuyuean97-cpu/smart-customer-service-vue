<template>
  <div class="auth-page">
    <!-- 背景装饰 -->
    <div class="bg-orbs">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
    </div>

    <div class="auth-layout">
      <!-- 左侧品牌区域 (仅桌面端显示) -->
      <div class="brand-panel">
        <div class="brand-content">
          <div class="brand-logo">
            <el-icon :size="40"><Service /></el-icon>
          </div>
          <h2 class="brand-title">智能客服助手</h2>
          <p class="brand-desc">
            融合AI技术，为您提供7x24小时智能服务体验。
            查询航班、办理业务、解答疑问，一切尽在指尖。
          </p>
          <div class="brand-features">
            <div class="feature-item">
              <el-icon :size="18"><ChatDotRound /></el-icon>
              <span>智能对话，精准应答</span>
            </div>
            <div class="feature-item">
              <el-icon :size="18"><Timer /></el-icon>
              <span>全天候在线，秒级响应</span>
            </div>
            <div class="feature-item">
              <el-icon :size="18"><Lock /></el-icon>
              <span>数据加密，安全可靠</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧表单区域 -->
      <div class="form-panel">
        <div class="form-card">
          <!-- 移动端 Logo -->
          <div class="mobile-logo">
            <div class="mobile-logo-icon">
              <el-icon :size="28"><Service /></el-icon>
            </div>
            <span>智能客服</span>
          </div>

          <!-- 标题 + 标签页切换 -->
          <div class="form-header">
            <h1 class="form-title">{{ isLogin ? '欢迎回来' : '创建账号' }}</h1>
            <p class="form-subtitle">
              {{ isLogin ? '登录以继续使用智能客服服务' : '注册账号，开启智能助手之旅' }}
            </p>
          </div>

          <!-- 登录方式切换 (仅登录模式) -->
          <el-segmented
            v-if="isLogin"
            v-model="loginType"
            :options="loginTypeOptions"
            class="login-type-switch"
            block
          />

          <!-- 表单 -->
          <el-form
            ref="formRef"
            :model="form"
            :rules="formRules"
            label-position="top"
            class="auth-form"
            @submit.prevent="handleSubmit"
            hide-required-asterisk
          >
            <!-- 手机号 -->
            <el-form-item label="手机号" prop="phone">
              <el-input
                v-model="form.phone"
                placeholder="请输入手机号"
                size="large"
                maxlength="11"
                :prefix-icon="Iphone"
                clearable
              />
            </el-form-item>

            <!-- 密码 (密码登录 / 注册模式) -->
            <el-form-item
              v-if="!isLogin || loginType === 'password'"
              label="密码"
              prop="password"
            >
              <el-input
                v-model="form.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                show-password
                :prefix-icon="Lock"
              />
            </el-form-item>

            <!-- 确认密码 (仅注册模式) -->
            <el-form-item
              v-if="!isLogin"
              label="确认密码"
              prop="confirmPassword"
            >
              <el-input
                v-model="form.confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                size="large"
                show-password
                :prefix-icon="Lock"
              />
            </el-form-item>

            <!-- 验证码 (验证码登录 / 注册模式) -->
            <el-form-item
              v-if="!isLogin || loginType === 'code'"
              label="验证码"
              prop="code"
            >
              <div class="code-input-row">
                <el-input
                  v-model="form.code"
                  placeholder="请输入6位验证码"
                  size="large"
                  maxlength="6"
                  :prefix-icon="Message"
                  class="code-input"
                />
                <el-button
                  size="large"
                  :disabled="countdown > 0 || !form.phone"
                  :loading="sendingCode"
                  class="code-btn"
                  @click="sendCode"
                >
                  {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
                </el-button>
              </div>
            </el-form-item>

            <!-- 协议勾选 (注册模式) -->
            <el-form-item v-if="!isLogin" prop="agreement">
              <el-checkbox v-model="form.agreement" class="agreement-check">
                <span class="agreement-text">
                  我已阅读并同意
                  <a href="javascript:void(0)" class="link" @click.stop>《用户协议》</a>
                  和
                  <a href="javascript:void(0)" class="link" @click.stop>《隐私政策》</a>
                </span>
              </el-checkbox>
            </el-form-item>

            <!-- 提交按钮 -->
            <el-form-item class="submit-row">
              <el-button
                type="primary"
                size="large"
                :loading="loading"
                class="submit-btn"
                @click="handleSubmit"
                native-type="submit"
              >
                {{ loading ? '处理中...' : (isLogin ? '立即登录' : '注册') }}
              </el-button>
            </el-form-item>
          </el-form>

          <!-- 底部切换 -->
          <div class="form-footer">
            <span class="footer-text">
              {{ isLogin ? '还没有账号？' : '已有账号？' }}
            </span>
            <el-button type="primary" text @click="toggleMode" class="toggle-btn">
              {{ isLogin ? '立即注册' : '去登录' }}
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  Service,
  ChatDotRound,
  Timer,
  Lock,
  Iphone,
  Message,
} from '@element-plus/icons-vue'

const router = useRouter()

// ---- 模式状态 ----
const isLogin = ref(true)
const loginType = ref('password')
const loginTypeOptions = [
  { label: '密码登录', value: 'password' },
  { label: '验证码登录', value: 'code' },
]

const loading = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

// ---- 表单 ----
const formRef = ref<FormInstance>()
const form = reactive({
  phone: '',
  password: '',
  confirmPassword: '',
  code: '',
  agreement: false,
})

// 切换登录/注册时重置
const toggleMode = () => {
  isLogin.value = !isLogin.value
  formRef.value?.resetFields()
}

// 切换登录方式时清空验证
watch(loginType, () => {
  formRef.value?.clearValidate()
})

// ---- 表单校验 ----
const phoneValidator = (_rule: any, value: string, callback: any) => {
  if (!value) return callback(new Error('请输入手机号'))
  if (!/^1[3-9]\d{9}$/.test(value)) return callback(new Error('手机号格式不正确'))
  callback()
}

const confirmPwdValidator = (_rule: any, value: string, callback: any) => {
  if (!value) return callback(new Error('请再次输入密码'))
  if (value !== form.password) return callback(new Error('两次输入的密码不一致'))
  callback()
}

const formRules = computed<FormRules>(() => {
  const rules: FormRules = {
    phone: [{ validator: phoneValidator, trigger: 'blur' }],
  }

  if (!isLogin.value || loginType.value === 'password') {
    rules.password = [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, message: '密码不少于6位', trigger: 'blur' },
    ]
  }

  if (!isLogin.value) {
    rules.confirmPassword = [{ validator: confirmPwdValidator, trigger: 'blur' }]
    rules.code = [
      { required: true, message: '请输入验证码', trigger: 'blur' },
      { len: 6, message: '验证码为6位', trigger: 'blur' },
    ]
    rules.agreement = [
      {
        validator: (_rule: any, value: boolean, callback: any) => {
          if (!value) return callback(new Error('请勾选用户协议'))
          callback()
        },
        trigger: 'change',
      },
    ]
  }

  if (isLogin.value && loginType.value === 'code') {
    rules.code = [
      { required: true, message: '请输入验证码', trigger: 'blur' },
      { len: 6, message: '验证码为6位', trigger: 'blur' },
    ]
  }

  return rules
})

// ---- 发送验证码 ----
const sendCode = async () => {
  if (!form.phone) return ElMessage.warning('请先输入手机号')
  if (!/^1[3-9]\d{9}$/.test(form.phone)) return ElMessage.warning('手机号格式不正确')

  sendingCode.value = true
  try {
    const res = await fetch('http://localhost:8081/api/auth/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: form.phone }),
    })
    const data = await res.json()
    if (res.ok) {
      ElMessage.success('验证码已发送，请注意查收')
      startCountdown()
    } else {
      ElMessage.error(data.detail || data.message || '验证码发送失败')
    }
  } catch {
    ElMessage.error('网络异常，无法连接服务器')
  } finally {
    sendingCode.value = false
  }
}

const startCountdown = () => {
  countdown.value = 60
  if (countdownTimer) clearInterval(countdownTimer)
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0 && countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}

// ---- 提交登录/注册 ----
const handleSubmit = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  const url = isLogin.value
    ? 'http://localhost:8081/api/auth/login'
    : 'http://localhost:8081/api/auth/register'

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: form.phone,
        login_type: isLogin.value ? loginType.value : 'password',
        password: form.password || undefined,
        code: form.code || undefined,
      }),
    })

    const data = await res.json()

    if (res.ok) {
      if (isLogin.value) {
        localStorage.setItem('access_token', data.access_token)
        localStorage.setItem('user_id', data.user_id || 'user_' + form.phone)
        ElMessage.success('登录成功')
        router.push('/chat')
      } else {
        ElMessage.success('注册成功，请登录')
        isLogin.value = true
        formRef.value?.resetFields()
      }
    } else {
      ElMessage.error(data.detail || '操作失败，请检查输入')
    }
  } catch {
    ElMessage.error('无法连接至服务器，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* === 页面容器 === */
.auth-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 20px;
}

/* === 背景装饰球 === */
.bg-orbs {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.orb {
  position: absolute;
  border-radius: 50%;
  opacity: 0.12;
  animation: float 20s ease-in-out infinite;
}

.orb-1 {
  width: 400px;
  height: 400px;
  background: #fff;
  top: -10%;
  left: -8%;
  animation-delay: 0s;
}

.orb-2 {
  width: 300px;
  height: 300px;
  background: #c7d2fe;
  bottom: -5%;
  right: -5%;
  animation-delay: -7s;
}

.orb-3 {
  width: 200px;
  height: 200px;
  background: #a5b4fc;
  top: 50%;
  left: 50%;
  animation-delay: -14s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(30px, -30px) scale(1.05); }
  50% { transform: translate(-20px, 20px) scale(0.95); }
  75% { transform: translate(15px, 10px) scale(1.02); }
}

/* === 主布局 === */
.auth-layout {
  display: flex;
  width: 100%;
  max-width: 960px;
  min-height: 580px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow:
    0 25px 60px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 1;
}

/* === 左侧品牌面板 === */
.brand-panel {
  flex: 0 0 380px;
  background: linear-gradient(160deg, rgba(99, 102, 241, 0.95) 0%, rgba(79, 70, 229, 0.98) 100%);
  backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
  position: relative;
}

.brand-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(165, 180, 252, 0.12) 0%, transparent 50%);
  pointer-events: none;
}

.brand-content {
  position: relative;
  z-index: 1;
  color: #fff;
}

.brand-logo {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28px;
}

.brand-title {
  font-size: 1.65rem;
  font-weight: 700;
  margin-bottom: 14px;
  letter-spacing: -0.02em;
  line-height: 1.3;
}

.brand-desc {
  font-size: 0.92rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.78);
  margin-bottom: 36px;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.85);
}

.feature-item .el-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* === 右侧表单面板 === */
.form-panel {
  flex: 1;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.form-card {
  width: 100%;
  max-width: 380px;
}

/* === 移动端 Logo (桌面端隐藏) === */
.mobile-logo {
  display: none;
  align-items: center;
  gap: 10px;
  margin-bottom: 28px;
}

.mobile-logo-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.mobile-logo span {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1e293b;
}

/* === 表单头部 === */
.form-header {
  margin-bottom: 28px;
}

.form-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 6px;
  letter-spacing: -0.01em;
}

.form-subtitle {
  font-size: 0.88rem;
  color: #94a3b8;
  line-height: 1.5;
}

/* === 登录方式切换 === */
.login-type-switch {
  margin-bottom: 24px;
  width: 100%;
}

.login-type-switch :deep(.el-segmented__item) {
  padding: 8px 0;
  font-size: 0.88rem;
  font-weight: 500;
}

/* === 表单样式覆盖 === */
.auth-form :deep(.el-form-item__label) {
  font-weight: 600;
  font-size: 0.85rem;
  color: #334155;
  padding-bottom: 6px;
}

.auth-form :deep(.el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 0 0 1px #e2e8f0;
  padding: 4px 12px;
  transition: all 0.2s;
}

.auth-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c7d2fe;
}

.auth-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px #6366f1;
}

.auth-form :deep(.el-input__inner) {
  font-size: 0.95rem;
}

/* === 验证码行 === */
.code-input-row {
  display: flex;
  gap: 10px;
  width: 100%;
}

.code-input {
  flex: 1;
}

.code-btn {
  flex-shrink: 0;
  border-radius: 12px;
  font-weight: 500;
  padding: 0 18px;
  color: #6366f1;
  border-color: #c7d2fe;
  background: #eef2ff;
  white-space: nowrap;
}

.code-btn:hover:not(:disabled) {
  background: #e0e7ff;
  border-color: #a5b4fc;
}

.code-btn:disabled {
  color: #94a3b8;
  background: #f8fafc;
  border-color: #e2e8f0;
}

/* === 协议 === */
.agreement-check :deep(.el-checkbox__label) {
  font-size: 0.82rem;
  white-space: normal;
  line-height: 1.5;
}

.agreement-text {
  color: #64748b;
}

.agreement-text .link {
  color: #6366f1;
  text-decoration: none;
  font-weight: 500;
}

.agreement-text .link:hover {
  text-decoration: underline;
}

/* === 提交按钮 === */
.submit-row {
  margin-top: 8px;
  margin-bottom: 0;
}

.submit-btn {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  transition: all 0.25s;
}

.submit-btn:active {
  transform: scale(0.98);
}

/* === 底部切换 === */
.form-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
}

.footer-text {
  font-size: 0.88rem;
  color: #94a3b8;
}

.toggle-btn {
  font-weight: 600;
  font-size: 0.88rem;
  padding: 0;
}

/* === 响应式 === */
@media (max-width: 768px) {
  .auth-page {
    padding: 0;
    align-items: stretch;
  }

  .auth-layout {
    border-radius: 0;
    min-height: 100vh;
    flex-direction: column;
    box-shadow: none;
  }

  .brand-panel {
    display: none;
  }

  .mobile-logo {
    display: flex;
  }

  .form-panel {
    padding: 32px 24px;
    align-items: flex-start;
    padding-top: 60px;
  }

  .form-card {
    max-width: 100%;
  }

  .form-title {
    font-size: 1.35rem;
  }
}

@media (max-width: 480px) {
  .form-panel {
    padding: 24px 20px;
    padding-top: 48px;
  }

  .code-input-row {
    flex-direction: column;
  }

  .code-btn {
    width: 100%;
  }
}
</style>
