<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="24" class="stats-row">
      <el-col :xs="24" :sm="12" :lg="6" v-for="stat in statsCards" :key="stat.title">
        <el-card shadow="hover" class="stat-card" :class="stat.colorClass">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-title">{{ stat.title }}</div>
            </div>
            <div class="stat-icon">
              <el-icon :size="48"><component :is="stat.icon" /></el-icon>
            </div>
          </div>
          <div class="stat-footer">
            <span :class="stat.trend > 0 ? 'trend-up' : 'trend-down'">
              <el-icon><component :is="stat.trend > 0 ? 'Top' : 'Bottom'" /></el-icon>
              {{ Math.abs(stat.trend) }}%
            </span>
            <span class="trend-label">较昨日</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="24" class="chart-row">
      <el-col :xs="24" :lg="16">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">对话趋势</span>
              <el-radio-group v-model="chartPeriod" size="small">
                <el-radio-button value="week">近7天</el-radio-button>
                <el-radio-button value="month">近30天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-placeholder">
            <div class="chart-bars">
              <div 
                v-for="(item, index) in chartData" 
                :key="index" 
                class="chart-bar-wrapper"
              >
                <div 
                  class="chart-bar" 
                  :style="{ height: item.height + '%' }"
                ></div>
                <span class="chart-label">{{ item.label }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :lg="8">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">审核状态分布</span>
            </div>
          </template>
          <div class="pie-stats">
            <div class="pie-item">
              <div class="pie-circle approved">
                <span class="pie-value">{{ reviewStats.approved }}</span>
              </div>
              <span class="pie-label">已审核通过</span>
            </div>
            <div class="pie-item">
              <div class="pie-circle pending">
                <span class="pie-value">{{ reviewStats.pending }}</span>
              </div>
              <span class="pie-label">待审核</span>
            </div>
            <div class="pie-item">
              <div class="pie-circle rejected">
                <span class="pie-value">{{ reviewStats.rejected }}</span>
              </div>
              <span class="pie-label">已拒绝</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近活动 & 系统状态 -->
    <el-row :gutter="24" class="activity-row">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="activity-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">最近对话</span>
              <el-button text type="primary" @click="$router.push('/admin/conversations')">
                查看全部
              </el-button>
            </div>
          </template>
          <el-table :data="recentConversations" style="width: 100%" max-height="300">
            <el-table-column prop="user_id" label="用户ID" width="120" show-overflow-tooltip />
            <el-table-column prop="query" label="问题" show-overflow-tooltip />
            <el-table-column prop="created_at" label="时间" width="160">
              <template #default="{ row }">
                {{ formatTime(row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.expert_verified ? 'success' : 'warning'" size="small">
                  {{ row.expert_verified ? '已审核' : '待审核' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="activity-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">系统状态</span>
              <el-button text type="primary" @click="checkHealth">
                刷新状态
              </el-button>
            </div>
          </template>
          <div class="health-list">
            <div class="health-item" v-for="item in healthStatus" :key="item.name">
              <div class="health-info">
                <el-icon :size="20" :color="item.status === 'healthy' ? '#10b981' : '#ef4444'">
                  <component :is="item.icon" />
                </el-icon>
                <span class="health-name">{{ item.name }}</span>
              </div>
              <el-tag :type="item.status === 'healthy' ? 'success' : 'danger'" size="small">
                {{ item.status === 'healthy' ? '正常' : '异常' }}
              </el-tag>
            </div>
          </div>
          
          <el-divider />
          
          <div class="server-config">
            <div class="config-title">API服务器配置</div>
            <el-form :inline="true" size="small">
              <el-form-item label="地址">
                <el-input v-model="serverConfig.host" style="width: 150px" />
              </el-form-item>
              <el-form-item label="端口">
                <el-input v-model="serverConfig.port" style="width: 80px" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="saveServerConfig">保存</el-button>
              </el-form-item>
            </el-form>
            <div class="current-api">
              当前API: <code>http://{{ serverConfig.host }}:{{ serverConfig.port }}</code>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  ChatDotRound,
  User,
  Checked,
  QuestionFilled,
  Top,
  Bottom,
  Connection,
  Cpu,
  Files,
} from '@element-plus/icons-vue'
interface Conversation {
  memory_id: string
  user_id: string
  run_id?: string
  agent_id?: string
  application_id?: string
  query: string
  response: string
  created_at: string
  updated_at?: string
  expert_verified?: boolean
  quality_score?: number
  retrieval_source?: string
  retrieval_score?: number
  retrieval_content?: string
  retrieval_images?: string
  retrieval_query_list?: string[]
}
// Stats cards data
const statsCards = ref([
  { title: '今日对话', value: '1,234', icon: ChatDotRound, colorClass: 'primary', trend: 12.5 },
  { title: '活跃用户', value: '856', icon: User, colorClass: 'success', trend: 8.3 },
  { title: '待审核', value: '45', icon: Checked, colorClass: 'warning', trend: -5.2 },
  { title: 'QA知识库', value: '2,456', icon: QuestionFilled, colorClass: 'info', trend: 3.1 },
])

// Chart data
const chartPeriod = ref('week')
const chartData = ref([
  { label: '周一', height: 60 },
  { label: '周二', height: 80 },
  { label: '周三', height: 45 },
  { label: '周四', height: 90 },
  { label: '周五', height: 70 },
  { label: '周六', height: 55 },
  { label: '周日', height: 40 },
])

// Review stats
const reviewStats = reactive({
  approved: 1856,
  pending: 45,
  rejected: 23,
})

// Recent conversations
const recentConversations = ref<Conversation[]>([])

// Health status
const healthStatus = ref([])

// Server config
const serverConfig = reactive({
  host: localStorage.getItem('admin_server_host') || 'localhost',
  port: localStorage.getItem('admin_server_port') || '8081',
})

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const checkHealth = async () => {
  try {
    const response = await fetch(`http://${serverConfig.host}:${serverConfig.port}/text2qa/ping`)
    const data = await response.json()
    
    if (data.success) {
      healthStatus.value = [
        { name: '记忆模块', status: data.data.expert_memory_alive ? 'healthy' : 'error', icon: Connection },
        { name: '知识库', status: data.data.rag_alive ? 'healthy' : 'error', icon: Cpu },
        { name: 'Redis', status: data.data.redis_alive ? 'healthy' : 'error', icon: Files },
      ]
      ElMessage.success('系统状态检查完成')
    }
  } catch (error) {
    ElMessage.error('无法连接到服务器')
    healthStatus.value = healthStatus.value.map(item => ({ ...item, status: 'error' }))
  }
}
const getrecentConversations = async () => {
    const params = new URLSearchParams()
    params.append('start_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // 最近7天
    params.append('end_date', new Date().toISOString().split('T')[0].split('T')[0])
  try {
    const response = await fetch(`http://${serverConfig.host}:${serverConfig.port}/memory/v1/conversations/history?${params}`)
    const data = await response.json()
    
    if (data.ret_code === '000000') {
      recentConversations.value = data.data.conversations
    }

  } catch (error) {
    ElMessage.error('无法获取最近对话数据')
  }
}
const saveServerConfig = () => {
  localStorage.setItem('admin_server_host', serverConfig.host)
  localStorage.setItem('admin_server_port', serverConfig.port)
  ElMessage.success('服务器配置已保存')
}

onMounted(() => {
  checkHealth()
  // Load saved server config
  const savedHost = localStorage.getItem('admin_server_host')
  const savedPort = localStorage.getItem('admin_server_port')
  if (savedHost) serverConfig.host = savedHost
  if (savedPort) serverConfig.port = savedPort
  getrecentConversations()
})
</script>

<style scoped>
.dashboard {
  min-height: 100%;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 12px;
  overflow: hidden;
  border: none;
  margin-bottom: 16px;
}

.stat-card.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-card.success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.stat-card.warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.stat-card.info {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.stat-card :deep(.el-card__body) {
  padding: 20px;
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-title {
  font-size: 14px;
  opacity: 0.9;
  margin-top: 4px;
}

.stat-icon {
  opacity: 0.3;
}

.stat-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: white;
}

.trend-up {
  color: #a7f3d0;
  display: flex;
  align-items: center;
  gap: 2px;
}

.trend-down {
  color: #fecaca;
  display: flex;
  align-items: center;
  gap: 2px;
}

.trend-label {
  opacity: 0.7;
}

.chart-row {
  margin-bottom: 24px;
}

.chart-card {
  border-radius: 12px;
  border: none;
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-placeholder {
  height: 280px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 20px;
}

.chart-bars {
  display: flex;
  gap: 24px;
  align-items: flex-end;
  height: 100%;
  width: 100%;
  justify-content: space-around;
}

.chart-bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.chart-bar {
  width: 40px;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  border-radius: 6px 6px 0 0;
  transition: height 0.3s ease;
  min-height: 10px;
}

.chart-label {
  font-size: 12px;
  color: #909399;
}

.pie-stats {
  display: flex;
  justify-content: space-around;
  padding: 20px 0;
}

.pie-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.pie-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pie-circle.approved {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%);
  border: 3px solid #10b981;
}

.pie-circle.pending {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%);
  border: 3px solid #f59e0b;
}

.pie-circle.rejected {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%);
  border: 3px solid #ef4444;
}

.pie-value {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}

.pie-label {
  font-size: 13px;
  color: #909399;
}

.activity-row {
  margin-bottom: 24px;
}

.activity-card {
  border-radius: 12px;
  border: none;
  margin-bottom: 16px;
}

.health-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.health-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.health-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.health-name {
  font-size: 14px;
  color: #303133;
}

.server-config {
  padding-top: 8px;
}

.config-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.current-api {
  font-size: 13px;
  color: #909399;
  margin-top: 8px;
}

.current-api code {
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
  color: #667eea;
}
</style>
