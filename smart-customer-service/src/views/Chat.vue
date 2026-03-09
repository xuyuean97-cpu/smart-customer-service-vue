<template>
  <el-container class="chat-wrapper">
    <!-- 顶部状态栏 -->
    <el-header class="chat-header" height="60px">
      <div class="header-content">
        <h1 class="header-title">智能客服助手</h1>
        <div class="header-right">
          <!-- 连接状态 -->
          <el-tag
            :type="isConnected ? 'success' : 'danger'"
            effect="light"
            size="small"
            round
          >
            <span class="status-dot" :class="{ connected: isConnected }"></span>
            {{ isConnected ? '已连接' : '连接断开' }}
          </el-tag>

          <!-- 用户下拉菜单 -->
          <el-button
            type="primary"
            text
            size="small"
            :icon="Clock"
            @click="openHistoryDrawer"
          >
            历史对话
          </el-button>

          <el-dropdown trigger="click" @command="handleCommand">
            <div class="user-trigger">
              <el-avatar :size="32" class="user-avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <span class="user-id-text">{{ currentUserId }}</span>
              <el-icon class="arrow-icon"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><Setting /></el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>
                  <span style="color: var(--el-color-danger)">退出登录</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>

    <!-- 聊天主体 -->
    <el-container class="chat-body">
      <el-main class="chat-main">
        <el-scrollbar ref="scrollbarRef" class="message-scrollbar">
          <div class="messages-inner" ref="messagesInner">
            <!-- 欢迎屏幕 -->
            <div v-if="messages.length === 0" class="welcome-screen">
              <div class="welcome-icon">
                <el-icon :size="48" color="var(--el-color-primary)"><ChatDotRound /></el-icon>
              </div>
              <h2 class="welcome-title">您好！我是智能客服</h2>
              <p class="welcome-desc">
                我可以帮您查询订单、办理业务、解答疑问等。请问有什么可以帮您？
              </p>
              <div class="quick-questions">
                <el-card
                  v-for="q in quickQs"
                  :key="q.text"
                  shadow="hover"
                  class="quick-card"
                  @click="sendQuickQuestion(q.text)"
                >
                  <div class="quick-card-icon">{{ q.icon }}</div>
                  <div class="quick-card-text">{{ q.text }}</div>
                </el-card>
              </div>
            </div>

            <!-- 消息列表 -->
            <div
              v-for="(msg, index) in messages"
              :key="index"
              class="message-row"
              :class="msg.sender"
            >
              <el-avatar
                :size="36"
                class="msg-avatar"
                :class="msg.sender"
              >
                <el-icon v-if="msg.sender === 'user'"><User /></el-icon>
                <el-icon v-else><Service /></el-icon>
              </el-avatar>

              <div class="msg-body">
                <!-- 普通文本 -->
                <div v-if="msg.type === 'text'" class="bubble" :class="msg.sender">
                  {{ msg.content }}
                </div>

                <!-- 图片 -->
                <div v-if="msg.type === 'image'" class="bubble image-bubble">
                  <el-image
                    :src="msg.content"
                    fit="cover"
                    :preview-src-list="[msg.content]"
                    class="msg-image"
                  />
                </div>

                <!-- 富文本(带图) -->
                <div v-if="msg.type === 'rich_content'" class="bubble assistant rich-bubble">
                  <p>{{ msg.content.text }}</p>
                  <div class="rich-images">
                    <el-image
                      v-for="(img, i) in msg.content.images"
                      :key="i"
                      :src="img.data"
                      :alt="img.alt_text"
                      fit="cover"
                      class="rich-img"
                      :preview-src-list="msg.content.images.map((x: any) => x.data)"
                      :initial-index="i"
                    />
                  </div>
                </div>

                <!-- 订单列表 -->
                <div v-if="msg.type === 'order_list'" class="bubble assistant order-bubble">
                  <div class="order-list-title">{{ msg.content.title }}</div>
                  <div class="order-cards">
                    <div
                      v-for="(order, i) in msg.content.orders"
                      :key="i"
                      class="order-card"
                    >
                      <div class="order-card-header">
                        <span class="order-number">{{ order.order_number }}</span>
                        <el-tag
                          :type="getOrderStatusType(order.order_status)"
                          size="small"
                          effect="light"
                        >
                          {{ order.order_status }}
                        </el-tag>
                      </div>
                      <div class="order-card-body">
                        <div class="order-info-row">
                          <span class="order-info-label">商品</span>
                          <span class="order-info-value">{{ order.product_name || '--' }}</span>
                        </div>
                        <div class="order-info-row" v-if="order.order_amount">
                          <span class="order-info-label">金额</span>
                          <span class="order-info-value order-amount">{{ order.order_amount }}</span>
                        </div>
                        <div class="order-info-row" v-if="order.order_time">
                          <span class="order-info-label">下单时间</span>
                          <span class="order-info-value">{{ formatTime(order.order_time) }}</span>
                        </div>
                        <div class="order-info-row" v-if="order.shipping_status">
                          <span class="order-info-label">物流状态</span>
                          <span class="order-info-value">{{ order.shipping_status }}</span>
                        </div>
                        <div class="order-info-row" v-if="order.tracking_number">
                          <span class="order-info-label">物流单号</span>
                          <span class="order-info-value">{{ order.tracking_number }}</span>
                        </div>
                        <div class="order-info-row" v-if="order.receiver_name">
                          <span class="order-info-label">收件人</span>
                          <span class="order-info-value">{{ order.receiver_name }}</span>
                        </div>
                        <div class="order-info-row" v-if="order.receiver_address">
                          <span class="order-info-label">收件地址</span>
                          <span class="order-info-value">{{ order.receiver_address }}</span>
                        </div>
                      </div>
                      <div class="order-card-footer" v-if="order.remark">
                        <span class="order-remark">{{ order.remark }}</span>
                      </div>
                    </div>
                  </div>
                  <div v-if="msg.content.action_hint" class="order-action-hint">
                    {{ msg.content.action_hint }}
                  </div>
                </div>

                <!-- 动态表单 -->
                <div v-if="msg.type === 'form'" class="bubble assistant form-bubble">
                  <h4 class="form-title">{{ msg.content.title }}</h4>
                  <p v-if="msg.content.description" class="form-desc">{{ msg.content.description }}</p>
                  <el-form label-position="top" size="default">
                    <el-form-item
                      v-for="field in msg.content.fields"
                      :key="field.name"
                      :label="field.label + (field.required ? ' *' : '')"
                    >
                      <el-input
                        v-if="field.type === 'text'"
                        :placeholder="field.placeholder"
                      />
                      <el-input
                        v-else-if="field.type === 'textarea'"
                        type="textarea"
                        :rows="3"
                        :placeholder="field.placeholder"
                      />
                      <el-select
                        v-else-if="field.type === 'select'"
                        placeholder="请选择"
                        style="width: 100%"
                      >
                        <el-option
                          v-for="opt in field.options"
                          :key="opt.value"
                          :label="opt.label"
                          :value="opt.value"
                        />
                      </el-select>
                      <el-input
                        v-else
                        :type="field.type"
                        :placeholder="field.placeholder"
                      />
                    </el-form-item>
                    <el-form-item>
                      <div class="form-buttons">
                        <el-button
                          v-for="btn in msg.content.buttons"
                          :key="btn.label"
                          :type="btn.type === 'primary' ? 'primary' : 'default'"
                          @click="handleFormAction(btn.action, msg.content.form_id)"
                        >
                          {{ btn.label }}
                        </el-button>
                      </div>
                    </el-form-item>
                  </el-form>
                </div>

                <!-- 转人工通知 -->
                <div v-if="msg.type === 'transfer'" class="transfer-wrap">
                  <el-alert
                    :title="msg.content"
                    type="info"
                    show-icon
                    :closable="false"
                  >
                    <template #title>
                      <span class="transfer-text">{{ msg.content }}</span>
                    </template>
                  </el-alert>
                </div>

                <!-- 错误消息 -->
                <div v-if="msg.type === 'error'" class="bubble assistant error-bubble">
                  {{ msg.content }}
                </div>
              </div>
            </div>

            <!-- 思考中动画 -->
            <div v-if="isTyping" class="message-row assistant">
              <el-avatar :size="36" class="msg-avatar assistant">
                <el-icon><Service /></el-icon>
              </el-avatar>
              <div class="msg-body">
                <div class="bubble assistant typing-bubble">
                  <div class="typing-indicator">
                    <span class="typing-label">正在思考</span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 行内建议 -->
            <div v-if="suggestions.length > 0" class="suggestions-area">
              <el-tag
                v-for="s in suggestions"
                :key="s"
                class="suggestion-tag"
                effect="plain"
                round
                @click="sendQuickQuestion(s)"
              >
                {{ s }}
              </el-tag>
            </div>
          </div>
        </el-scrollbar>
      </el-main>

      <!-- 推荐区域 -->
      <div class="recommendations-area">
        <div class="rec-section">
          <div class="rec-label">
            <el-icon><Opportunity /></el-icon>
            <span>猜你想问</span>
          </div>
          <div class="rec-chips">
            <template v-if="recLoading">
              <div class="rec-loading-dots">
                <span class="rec-dot"></span>
                <span class="rec-dot"></span>
                <span class="rec-dot"></span>
              </div>
            </template>
            <template v-else-if="recQuestions.length > 0">
              <el-tag
                v-for="q in recQuestions"
                :key="q"
                class="rec-tag"
                effect="plain"
                round
                @click="sendQuickQuestion(q)"
              >
                {{ q }}
              </el-tag>
            </template>
            <span v-else class="rec-placeholder">暂无推荐问题</span>
          </div>
        </div>
        <div class="rec-section">
          <div class="rec-label">
            <el-icon><Aim /></el-icon>
            <span>推荐业务</span>
          </div>
          <div class="rec-chips">
            <template v-if="recLoading">
              <div class="rec-loading-dots">
                <span class="rec-dot"></span>
                <span class="rec-dot"></span>
                <span class="rec-dot"></span>
              </div>
            </template>
            <template v-else-if="recBusiness.length > 0">
              <el-tag
                v-for="b in recBusiness"
                :key="b"
                class="rec-tag business"
                effect="plain"
                round
                @click="sendQuickQuestion(b)"
              >
                {{ b }}
              </el-tag>
            </template>
            <span v-else class="rec-placeholder">暂无推荐业务</span>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-area">
        <div class="input-row">
          <!-- 图片预览 -->
          <div v-if="selectedImage" class="preview-float">
            <el-image :src="selectedImage" fit="cover" class="preview-thumb" />
            <el-button
              class="preview-close"
              :icon="Close"
              circle
              size="small"
              type="danger"
              @click="removeImage"
            />
          </div>

          <div class="input-wrap">
            <el-input
              ref="messageInputRef"
              v-model="userInput"
              type="textarea"
              :autosize="{ minRows: 1, maxRows: 4 }"
              placeholder="请输入您的问题..."
              resize="none"
              :disabled="inputDisabled"
              @keydown.enter.exact.prevent="sendMessage"
              class="chat-input"
            />
            <div class="input-tools">
              <el-upload
                :show-file-list="false"
                :before-upload="handleImageSelect"
                accept="image/*"
                class="upload-trigger"
              >
                <el-button :icon="Camera" circle size="small" text :disabled="inputDisabled" />
              </el-upload>
            </div>
          </div>

          <el-button
            type="primary"
            :icon="Promotion"
            :disabled="!canSend"
            class="send-btn"
            @click="sendMessage"
          >
            发送
          </el-button>
        </div>
      </div>
    </el-container>
  </el-container>

  <!-- 历史对话抽屉 -->
  <el-drawer
    v-model="historyVisible"
    size="460px"
    :with-header="false"
    class="history-drawer"
  >
    <div class="history-chat-container">
      <!-- 顶部标题栏 -->
      <div class="history-chat-header">
        <div class="history-chat-title">
          <el-icon class="history-chat-icon"><ChatDotRound /></el-icon>
          <span>聊天记录</span>
        </div>
        <div class="history-chat-actions">
          <el-input
            v-model="historyKeyword"
            placeholder="搜索..."
            clearable
            :prefix-icon="Search"
            class="history-chat-search"
            size="small"
          />
          <el-button
            :icon="Refresh"
            circle
            size="small"
            :loading="historyLoading"
            @click="fetchConversationHistory"
            class="history-chat-refresh"
          />
        </div>
      </div>

      <!-- 日期筛选 -->
      <div class="history-date-filter">
        <el-date-picker
          v-model="historyDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          unlink-panels
          size="small"
          class="history-date-picker-full"
        />
      </div>

      <!-- 聊天记录区域 -->
      <div class="history-chat-messages" v-loading="historyLoading" element-loading-text="加载中...">
        <template v-if="filteredHistoryItems.length > 0">
          <div class="history-chat-list">
            <template v-for="(item, index) in filteredHistoryItems" :key="getHistoryKey(item, index)">
              <!-- 时间分割线 -->
              <div class="chat-time-divider">
                <span>{{ formatHistoryDate(item.created_at || item.updated_at || '') }}</span>
              </div>
              
              <!-- 用户消息（右侧） -->
              <div class="chat-message chat-message-user">
                <div class="chat-bubble chat-bubble-user">
                  <div class="chat-bubble-content">{{ item.query || '（无问题内容）' }}</div>
                </div>
                <div class="chat-avatar chat-avatar-user">
                  <el-icon><User /></el-icon>
                </div>
              </div>
              
              <!-- 客服回复（左侧） -->
              <div class="chat-message chat-message-bot">
                <div class="chat-avatar chat-avatar-bot">
                  <el-icon><Service /></el-icon>
                </div>
                <div class="chat-bubble chat-bubble-bot" @click="toggleHistoryExpanded(item, index)">
                  <div 
                    class="chat-bubble-content"
                    :class="{ expanded: isHistoryExpanded(item, index) }"
                  >
                    {{ item.response || item.expert_corrected_response || '（暂无回复）' }}
                  </div>
                  <div v-if="!isHistoryExpanded(item, index) && (item.response?.length > 100 || item.expert_corrected_response?.length > 100)" class="chat-expand-tip">
                    点击展开全部
                  </div>
                </div>
              </div>
            </template>
          </div>
        </template>
        
        <!-- 空状态 -->
        <div v-else class="history-chat-empty">
          <div class="history-chat-empty-icon">
            <el-icon :size="56"><ChatDotRound /></el-icon>
          </div>
          <div class="history-chat-empty-text">
            {{ historyKeyword ? '没有找到相关聊天记录' : '暂无聊天记录' }}
          </div>
          <div class="history-chat-empty-hint">
            {{ historyKeyword ? '试试其他关键词' : '开始对话后，记录会显示在这里' }}
          </div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import type { UploadRawFile } from 'element-plus'
import {
  User,
  ArrowDown,
  Setting,
  SwitchButton,
  ChatDotRound,
  Service,
  Opportunity,
  Aim,
  Close,
  Camera,
  Promotion,
  Clock,
  Search,
  Refresh,
} from '@element-plus/icons-vue'
import type { ScrollbarInstance } from 'element-plus'

// ============ 全局变量 ============
const router = useRouter()

let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
const currentThreadId = generateThreadId()
const currentUserId = ref(getUserId())
let selectedImage = ref<string | null>(null)
const isConnected = ref(false)
const token = getToken()
let currentStreamingIndex: number | null = null // 当前正在接收的消息索引
let lastUserQuery = ''  // 最后一次用户输入的问题
let lastUserImage: string | null = null // 最后一次用户上传的图片

const isTyping = ref(false)
const inputDisabled = ref(false)
const recLoading = ref(false)
const userInput = ref('')
const suggestions = ref<string[]>([])

interface ChatMessage {
  sender: 'user' | 'assistant'
  type: 'text' | 'image' | 'rich_content' | 'order_list' | 'form' | 'transfer' | 'error'
  content: any
}

const messages = ref<ChatMessage[]>([])
const recQuestions = ref<string[]>([])
const recBusiness = ref<string[]>([])

interface ConversationHistoryItem {
  [key: string]: any
}

const historyVisible = ref(false)
const historyLoading = ref(false)
const historyItems = ref<ConversationHistoryItem[]>([])
const historyLimit = ref(50)
const historyDateRange = ref<string[] | null>(null)
const historyKeyword = ref('')
const historyExpanded = ref<Record<string, boolean>>({})

const filteredHistoryItems = computed(() => {
  const kw = historyKeyword.value.trim().toLowerCase()
  if (!kw) return historyItems.value
  return historyItems.value.filter((x: any) => {
    const q = String(x?.query ?? '').toLowerCase()
    const r = String(x?.response ?? '').toLowerCase()
    const app = String(x?.application_id ?? '').toLowerCase()
    const agent = String(x?.agent_id ?? '').toLowerCase()
    return q.includes(kw) || r.includes(kw) || app.includes(kw) || agent.includes(kw)
  })
})

const scrollbarRef = ref<ScrollbarInstance>()
const messagesInner = ref<HTMLElement>()
const messageInputRef = ref()

const quickQs = [
  { icon: '📦', text: '订单与物流查询' },
  { icon: '✏️', text: '修改订单' },
  { icon: '🛍️', text: '商品导购与推荐' },
  { icon: '🛡️', text: '售后政策与服务' },
]

const WS_URL = 'ws://localhost:8081/api/v1/ecommerce-assistant/chat/ws'
const HISTORY_URL = 'http://localhost:8081/memory/v1/conversations/history'

// ============ 工具函数 ============
function generateThreadId() {
  return 'thread_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

function getUserId() {
  return localStorage.getItem('user_id') || '用户'
}

function getToken() {
  return localStorage.getItem('access_token')
}

function formatTime(timeStr: string) {
  if (!timeStr) return '--'
  try {
    const date = new Date(timeStr)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return timeStr
  }
}

function formatHistoryDate(timeStr: string) {
  if (!timeStr) return '未知时间'
  try {
    const date = new Date(timeStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return '今天 ' + date.toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return '昨天 ' + date.toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays < 7) {
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      return weekdays[date.getDay()] + ' ' + date.toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleString('zh-CN', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
  } catch {
    return timeStr
  }
}

function getOrderStatusType(status: string) {
  if (!status) return 'info'
  if (status.includes('已完成') || status.includes('已签收')) return 'success'
  if (status.includes('已取消') || status.includes('退款')) return 'danger'
  if (status.includes('待发货') || status.includes('待付款')) return 'warning'
  if (status.includes('运输中') || status.includes('已发货')) return 'primary'
  return 'info'
}

// ============ 历史对话 ============
function openHistoryDrawer() {
  historyVisible.value = true
  if (historyItems.value.length === 0) {
    fetchConversationHistory()
  }
}

async function fetchConversationHistory() {
  try {
    historyLoading.value = true

    const params = new URLSearchParams()
    if (currentUserId.value) {
      params.append('user_id', currentUserId.value)
    }
    if (historyLimit.value) {
      params.append('limit', String(historyLimit.value))
    }

    if (historyDateRange.value && historyDateRange.value.length === 2) {
      const [start, end] = historyDateRange.value
      if (start) params.append('start_date', start)
      if (end) params.append('end_date', end)
    }

    const response = await fetch(`${HISTORY_URL}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('历史对话接口请求失败')
    }

    const data = await response.json()

    // 兼容不同返回结构
    // 你提供的结构：{ ret_code, ret_msg, data: { conversations: [] } }
    const conversations =
      (data?.data && Array.isArray(data.data.conversations) ? data.data.conversations : null) ||
      (Array.isArray(data?.conversations) ? data.conversations : null) ||
      (Array.isArray(data?.items) ? data.items : null) ||
      (Array.isArray(data?.item) ? data.item : null) ||
      (Array.isArray(data) ? data : null)

    historyItems.value = conversations ?? []
  } catch (e) {
    historyItems.value = []
    ElMessage.error('获取历史对话失败，请稍后重试')
  } finally {
    historyLoading.value = false
  }
}

function getHistoryKey(item: any, index: number) {
  return String(item?.memory_id || item?.run_id || item?.id || index)
}

function toggleHistoryExpanded(item: any, index: number) {
  const key = getHistoryKey(item, index)
  historyExpanded.value[key] = !historyExpanded.value[key]
}

function isHistoryExpanded(item: any, index: number) {
  const key = getHistoryKey(item, index)
  return Boolean(historyExpanded.value[key])
}

// ============ WebSocket 初始化 ============
function initWebSocket() {
  ws = new WebSocket(WS_URL)

  ws.onopen = () => {
    isConnected.value = true
  }

  ws.onmessage = (event: MessageEvent) => {
    try {
      const response = JSON.parse(event.data)
      handleWebSocketMessage(response)
    } catch {
      // 解析消息失败
    }
  }

  ws.onerror = () => {
    isConnected.value = false
  }

  ws.onclose = () => {
    isConnected.value = false
    // 3秒后自动重连
    reconnectTimer = setTimeout(initWebSocket, 3000)
  }
}

// ============ 处理 WebSocket 消息 ============
function handleWebSocketMessage(response: { event: string; data: any }) {
  const { event, data } = response

  switch (event) {
    case 'start':
      // AI开始回复，移除typing indicator
      isTyping.value = false
      // 创建新的消息气泡用于接收流式文本
      createStreamingMessage()
      break

    case 'text':
      // 确保typing indicator已移除
      isTyping.value = false
      // 追加文本到当前消息气泡
      appendToStreamingMessage(data.content.text)
      break

    case 'rich_content':
      isTyping.value = false
      finalizeStreamingMessage()
      messages.value.push({ sender: 'assistant', type: 'rich_content', content: data.content })
      break

    case 'order_list':
      isTyping.value = false
      finalizeStreamingMessage()
      messages.value.push({ sender: 'assistant', type: 'order_list', content: data.content })
      break

    case 'form':
      isTyping.value = false
      finalizeStreamingMessage()
      messages.value.push({ sender: 'assistant', type: 'form', content: data.content })
      break

    case 'transfer_to_human':
      isTyping.value = false
      finalizeStreamingMessage()
      messages.value.push({ sender: 'assistant', type: 'transfer', content: data.content.text })
      break

    case 'end':
      isTyping.value = false
      finalizeStreamingMessage()
      // 处理建议
      if (data.content?.suggestions && data.content.suggestions.length > 0) {
        showSuggestions(data.content.suggestions)
      }
      // 获取推荐内容
      fetchRecommendations()
      enableInput()
      break

    case 'error':
      isTyping.value = false
      finalizeStreamingMessage()
      messages.value.push({
        sender: 'assistant',
        type: 'error',
        content: data.content?.error_message || '服务异常，请稍后重试',
      })
      ElMessage.error(data.content?.error_message || '服务异常，请稍后重试')
      enableInput()
      break
  }
}

// ============ 流式消息管理 ============
function createStreamingMessage() {
  // 如果已经有正在接收的消息，先结束它
  if (currentStreamingIndex !== null) {
    finalizeStreamingMessage()
  }
  messages.value.push({ sender: 'assistant', type: 'text', content: '' })
  currentStreamingIndex = messages.value.length - 1
}

function appendToStreamingMessage(text: string) {
  if (currentStreamingIndex === null) {
    createStreamingMessage()
  }
  if (currentStreamingIndex !== null) {
    messages.value[currentStreamingIndex].content += text
  }
}

function finalizeStreamingMessage() {
  currentStreamingIndex = null
}

// ============ 建议 ============
function showSuggestions(items: string[]) {
  suggestions.value = items
}

// ============ 发送消息 ============
const canSend = computed(
  () => isConnected.value && !inputDisabled.value && (userInput.value.trim() || selectedImage.value)
)

function sendMessage() {
  const message = userInput.value.trim()

  if (!message && !selectedImage.value) {
    return
  }

  if (!isConnected.value) {
    ElMessage.warning('连接已断开，请稍后重试')
    return
  }

  // 保存用户输入用于推荐
  lastUserQuery = message
  lastUserImage = selectedImage.value

  // 显示用户消息
  if (message) {
    messages.value.push({ sender: 'user', type: 'text', content: message })
  }

  // 如果有图片，显示图片预览
  if (selectedImage.value) {
    messages.value.push({ sender: 'user', type: 'image', content: selectedImage.value })
  }

  // 显示推荐加载状态
  showRecommendationLoading()

  // 显示输入中状态
  isTyping.value = true

  // 重置流式消息状态
  currentStreamingIndex = null

  // 清空建议
  suggestions.value = []

  // 构建请求数据
  const requestData: Record<string, any> = {
    thread_id: currentThreadId,
    user_id: currentUserId.value,
    query: message,
    image: selectedImage.value ? {
      filename: 'user_image.jpg',
      content_type: 'image/jpeg',
      data: selectedImage.value,
    } : undefined,
    token: token,
    metadata: {
      query_source: '网页',
      query_device: '电脑',
      Is_translate: false,
      Is_emotion: false,
    },
  }

  // 发送 WebSocket 消息
  ws?.send(JSON.stringify(requestData))

  // 清空输入
  userInput.value = ''
  selectedImage.value = null

  // 禁用输入直到收到响应
  disableInput()
}

function sendQuickQuestion(question: string) {
  userInput.value = question
  sendMessage()
}

// ============ 输入禁用/启用 ============
function disableInput() {
  inputDisabled.value = true
}

function enableInput() {
  inputDisabled.value = false
  // 聚焦输入框
  nextTick(() => {
    messageInputRef.value?.focus()
  })
}

// ============ 推荐获取 ============
function showRecommendationLoading() {
  recLoading.value = true
  recQuestions.value = []
  recBusiness.value = []
}

async function fetchRecommendations() {
  // 同时获取问题推荐和业务推荐
  await Promise.all([
    fetchQuestionRecommendations(),
    fetchBusinessRecommendations(),
  ])
  recLoading.value = false
}

async function fetchQuestionRecommendations() {
  try {
    const requestData = {
      thread_id: currentThreadId,
      user_id: currentUserId.value,
      token: token,
      query: lastUserQuery || undefined,
      image: lastUserImage
        ? { filename: 'user_image.jpg', content_type: 'image/jpeg', data: lastUserImage }
        : undefined,
      metadata: {
        query_source: '网页',
        query_device: '电脑',
        Is_translate: false,
        Is_emotion: false,
      },
    }

    const response = await fetch(
      'http://localhost:8081/api/v1/question-recommend/questions',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      }
    )

    if (response.ok) {
      const data = await response.json()
      if (data.ret_code === '000000' && data.item?.recommended_questions) {
        recQuestions.value = data.item.recommended_questions
      } else {
        recQuestions.value = []
      }
    } else {
      recQuestions.value = []
    }
  } catch {
    recQuestions.value = []
  }
}

async function fetchBusinessRecommendations() {
  try {
    const requestData = {
      thread_id: currentThreadId,
      user_id: currentUserId.value,
      token: token,
      query: lastUserQuery || undefined,
      image: lastUserImage
        ? { filename: 'user_image.jpg', content_type: 'image/jpeg', data: lastUserImage }
        : undefined,
      metadata: {
        query_source: '网页',
        query_device: '电脑',
        Is_translate: false,
        Is_emotion: false,
      },
    }

    const response = await fetch(
      'http://localhost:8081/api/v1/business-recommend/business',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      }
    )

    if (response.ok) {
      const data = await response.json()
      if (data.ret_code === '000000' && data.item?.recommended_business) {
        recBusiness.value = data.item.recommended_business
      } else {
        recBusiness.value = []
      }
    } else {
      recBusiness.value = []
    }
  } catch {
    recBusiness.value = []
  }
}

// ============ 图片处理 ============
function handleImageSelect(file: UploadRawFile) {
  const reader = new FileReader()
  reader.onload = (e) => {
    selectedImage.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
  return false // 阻止 Element Plus 默认上传行为
}

function removeImage() {
  selectedImage.value = null
}

// ============ 表单操作 ============
function handleFormAction(action: string, formId: string) {
  ElMessage.info('表单功能开发中...')
}

// ============ 用户菜单 ============
function handleCommand(command: string) {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '退出确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(() => {
        localStorage.clear()
        if (ws) ws.close()
        ElMessage.success('已退出登录')
        router.push('/')
      })
      .catch(() => {
        // 取消
      })
  }
}

// ============ 自动滚动 ============
function scrollToBottom() {
  nextTick(() => {
    if (scrollbarRef.value) {
      scrollbarRef.value.setScrollTop(messagesInner.value?.scrollHeight || 99999)
    }
  })
}

watch(messages, scrollToBottom, { deep: true })
watch(isTyping, scrollToBottom)

// ============ 生命周期 ============
onMounted(() => {
  initWebSocket()
})

onUnmounted(() => {
  if (reconnectTimer) clearTimeout(reconnectTimer)
  if (ws) ws.close()
})
</script>

<style scoped>
/* === 全局布局 === */
.chat-wrapper {
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* === 顶部 Header === */
.chat-header {
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
  z-index: 10;
  display: flex;
  align-items: center;
  padding: 0 24px;
}

.header-content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-danger);
  margin-right: 4px;
  vertical-align: middle;
}

.status-dot.connected {
  background: var(--el-color-success);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 24px;
  transition: background 0.2s;
}

.user-trigger:hover {
  background: #f1f5f9;
}

.user-avatar {
  background: var(--el-color-primary);
  color: #fff;
}

.user-id-text {
  font-size: 0.9rem;
  color: #475569;
  font-weight: 500;
}

.arrow-icon {
  font-size: 12px;
  color: #94a3b8;
}

/* === 聊天主体 === */
.chat-body {
  flex: 1;
  max-width: 1100px;
  width: 95%;
  margin: 20px auto;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
}

.chat-main {
  flex: 1;
  padding: 0;
  overflow: hidden;
}

.message-scrollbar {
  height: 100%;
}

.messages-inner {
  padding: 24px;
  min-height: 100%;
}

/* === 欢迎页 === */
.welcome-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 16px;
  text-align: center;
}

.welcome-icon {
  margin-bottom: 16px;
}

.welcome-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}

.welcome-desc {
  color: #64748b;
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 32px;
}

.quick-questions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  width: 100%;
  max-width: 860px;
}

.quick-card {
  cursor: pointer;
  border-radius: 16px;
  transition: all 0.3s;
  text-align: center;
}

.quick-card:hover {
  transform: translateY(-4px);
  border-color: var(--el-color-primary);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.15);
}

.quick-card-icon {
  font-size: 2rem;
  margin-bottom: 8px;
}

.quick-card-text {
  font-size: 0.9rem;
  color: #334155;
  font-weight: 500;
}

/* === 消息行 === */
.message-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20px;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-row.user {
  flex-direction: row-reverse;
}

.msg-avatar {
  flex-shrink: 0;
  margin: 0 12px;
}

.msg-avatar.user {
  background: var(--el-color-warning);
  color: #fff;
}

.msg-avatar.assistant {
  background: var(--el-color-primary);
  color: #fff;
}

.msg-body {
  max-width: 70%;
}

/* === 气泡 === */
.bubble {
  padding: 12px 18px;
  border-radius: 16px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.bubble.user {
  background: var(--el-color-primary);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.bubble.assistant {
  background: #f1f5f9;
  color: #1e293b;
  border-bottom-left-radius: 4px;
}

/* 图片气泡 */
.image-bubble {
  padding: 6px;
  background: #fff;
  border: 1px solid #e2e8f0;
}

.msg-image {
  max-width: 280px;
  border-radius: 10px;
}

/* 富文本气泡 */
.rich-bubble p {
  margin-bottom: 12px;
}

.rich-images {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.rich-img {
  width: 140px;
  height: 100px;
  border-radius: 8px;
}

/* === 订单列表气泡 === */
.order-bubble {
  padding: 16px;
  min-width: 360px;
  max-width: 520px;
}

.order-list-title {
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 12px;
  color: #1e293b;
}

.order-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.order-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.order-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.order-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
}

.order-number {
  font-weight: 600;
  font-size: 0.88rem;
  color: #334155;
  font-family: 'SF Mono', 'Menlo', monospace;
}

.order-card-body {
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.order-info-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 0.85rem;
  line-height: 1.5;
}

.order-info-label {
  flex-shrink: 0;
  color: #94a3b8;
  min-width: 56px;
}

.order-info-value {
  color: #334155;
  word-break: break-all;
}

.order-amount {
  font-weight: 600;
  color: #ef4444;
}

.order-card-footer {
  padding: 8px 14px;
  border-top: 1px solid #f1f5f9;
}

.order-remark {
  font-size: 0.82rem;
  color: #94a3b8;
}

.order-action-hint {
  margin-top: 10px;
  font-size: 0.85rem;
  color: #6b7280;
}

/* 错误气泡 */
.error-bubble {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

/* 表单气泡 */
.form-bubble {
  padding: 20px;
  min-width: 320px;
}

.form-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #1e293b;
}

.form-desc {
  font-size: 0.88rem;
  color: #6b7280;
  margin-bottom: 16px;
}

.form-buttons {
  display: flex;
  gap: 8px;
}

/* 转人工 */
.transfer-wrap {
  max-width: 400px;
}

.transfer-text {
  font-weight: 500;
}

/* 思考动画 */
.typing-bubble {
  padding: 14px 20px;
}

.typing-indicator {
  display: flex;
  gap: 5px;
  align-items: center;
}

.typing-label {
  font-size: 0.85rem;
  color: #64748b;
  margin-right: 4px;
}

.typing-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  background: #94a3b8;
  border-radius: 50%;
  animation: blink 1.4s infinite;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(4) {
  animation-delay: 0.4s;
}

@keyframes blink {
  0%, 100% { opacity: 0.3; transform: scale(0.85); }
  50% { opacity: 1; transform: scale(1); }
}

/* 建议区域 */
.suggestions-area {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
  margin-bottom: 12px;
  padding-left: 60px;
}

.suggestion-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.suggestion-tag:hover {
  background: var(--el-color-primary);
  color: #fff;
  border-color: var(--el-color-primary);
}

/* === 推荐区域 === */
.recommendations-area {
  padding: 12px 24px;
  border-top: 1px solid #f1f5f9;
  background: #fafbfc;
}

.rec-section {
  margin-bottom: 8px;
}

.rec-section:last-child {
  margin-bottom: 0;
}

.rec-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: #64748b;
  font-weight: 600;
  margin-bottom: 6px;
}

.rec-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  min-height: 28px;
}

.rec-tag {
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.82rem;
}

.rec-tag:hover {
  background: var(--el-color-primary);
  color: #fff;
  border-color: var(--el-color-primary);
}

.rec-tag.business {
  color: var(--el-color-warning);
  border-color: #fef3c7;
  background: #fffbeb;
}

.rec-tag.business:hover {
  background: var(--el-color-warning);
  color: #fff;
  border-color: var(--el-color-warning);
}

.rec-placeholder {
  font-size: 0.82rem;
  color: #cbd5e1;
}

.rec-loading-dots {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 4px 0;
}

.rec-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  background: #cbd5e1;
  border-radius: 50%;
  animation: recBlink 1.4s infinite;
}

.rec-dot:nth-child(2) { animation-delay: 0.2s; }
.rec-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes recBlink {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

/* === 输入区域 === */
.input-area {
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  background: #fff;
  position: relative;
}

.input-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.input-wrap {
  flex: 1;
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 4px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 4px 8px;
  transition: border-color 0.2s;
}

.input-wrap:focus-within {
  border-color: var(--el-color-primary);
}

.chat-input {
  flex: 1;
}

.chat-input :deep(.el-textarea__inner) {
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 8px;
  font-size: 0.95rem;
  line-height: 1.5;
}

.input-tools {
  display: flex;
  align-items: center;
  padding-bottom: 4px;
}

.upload-trigger :deep(.el-upload) {
  display: flex;
}

.send-btn {
  border-radius: 14px;
  padding: 10px 20px;
  height: auto;
  font-weight: 600;
}

/* 图片预览 */
.preview-float {
  position: absolute;
  bottom: 70px;
  left: 24px;
  display: flex;
  align-items: flex-start;
}

.preview-thumb {
  width: 80px;
  height: 60px;
  border-radius: 8px;
  border: 2px solid #e2e8f0;
}

.preview-close {
  position: absolute;
  top: -8px;
  right: -8px;
}

/* === 历史对话抽屉 - 聊天记录样式 === */
.history-drawer :deep(.el-drawer__body) {
  padding: 0;
}

.history-chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f0f2f5;
}

/* 顶部标题栏 */
.history-chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.history-chat-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.1rem;
  font-weight: 600;
}

.history-chat-icon {
  font-size: 22px;
}

.history-chat-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.history-chat-search {
  width: 140px;
}

.history-chat-search :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  box-shadow: none;
}

.history-chat-search :deep(.el-input__inner) {
  color: #fff;
}

.history-chat-search :deep(.el-input__inner)::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.history-chat-search :deep(.el-input__prefix) {
  color: rgba(255, 255, 255, 0.8);
}

.history-chat-refresh {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: #fff;
}

.history-chat-refresh:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 日期筛选 */
.history-date-filter {
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
}

.history-date-picker-full {
  width: 100%;
}

/* 聊天消息区域 */
.history-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.history-chat-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 时间分割线 */
.chat-time-divider {
  display: flex;
  justify-content: center;
  margin: 16px 0;
}

.chat-time-divider span {
  background: rgba(0, 0, 0, 0.1);
  color: #666;
  font-size: 0.75rem;
  padding: 4px 12px;
  border-radius: 12px;
}

/* 消息通用样式 */
.chat-message {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 4px;
}

/* 用户消息（右侧） */
.chat-message-user {
  flex-direction: row-reverse;
}

/* 客服消息（左侧） */
.chat-message-bot {
  flex-direction: row;
}

/* 头像样式 */
.chat-avatar {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 18px;
}

.chat-avatar-user {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
}

.chat-avatar-bot {
  background: linear-gradient(135deg, #11998e, #38ef7d);
  color: #fff;
}

/* 气泡样式 */
.chat-bubble {
  max-width: 75%;
  padding: 10px 14px;
  border-radius: 12px;
  position: relative;
  word-break: break-word;
}

/* 用户气泡（绿色/蓝色） */
.chat-bubble-user {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border-top-right-radius: 4px;
}

/* 客服气泡（白色） */
.chat-bubble-bot {
  background: #fff;
  color: #333;
  border-top-left-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: box-shadow 0.2s ease;
}

.chat-bubble-bot:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

/* 气泡内容 */
.chat-bubble-content {
  font-size: 0.9rem;
  line-height: 1.6;
  white-space: pre-wrap;
}

.chat-bubble-bot .chat-bubble-content {
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.chat-bubble-bot .chat-bubble-content.expanded {
  display: block;
  -webkit-line-clamp: unset;
  overflow: visible;
}

/* 展开提示 */
.chat-expand-tip {
  font-size: 0.75rem;
  color: #667eea;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e8e8e8;
  text-align: center;
}

/* 空状态 */
.history-chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px 20px;
  text-align: center;
}

.history-chat-empty-icon {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e0e5ec, #f5f7fa);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  color: #a0aec0;
}

.history-chat-empty-text {
  font-size: 1rem;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 8px;
}

.history-chat-empty-hint {
  font-size: 0.85rem;
  color: #a0aec0;
}

/* === 响应式 === */
@media (max-width: 768px) {
  .chat-body {
    width: 100%;
    margin: 0;
    border-radius: 0;
    height: calc(100vh - 60px);
  }

  .quick-questions {
    grid-template-columns: repeat(2, 1fr);
  }

  .msg-body {
    max-width: 85%;
  }

  .order-bubble {
    min-width: auto;
  }
}
</style>
