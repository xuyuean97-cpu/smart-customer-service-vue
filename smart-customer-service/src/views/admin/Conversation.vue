<template>
  <div class="conversations-page">
    <!-- 搜索筛选区 -->
    <el-card shadow="hover" class="filter-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">查询条件</span>
          <el-button text type="primary" @click="resetFilters">重置条件</el-button>
        </div>
      </template>
      
      <el-form :model="filters" label-width="80px" class="filter-form">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="用户ID">
              <el-input v-model="filters.user_id" placeholder="输入用户ID" clearable />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="智能体ID">
              <el-input v-model="filters.agent_id" placeholder="输入智能体ID" clearable />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="会话ID">
              <el-input v-model="filters.run_id" placeholder="输入会话ID" clearable />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="应用ID">
              <el-input v-model="filters.application_id" placeholder="输入应用ID" clearable />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="审核状态">
              <el-select v-model="filters.expert_verified" placeholder="全部状态" clearable>
                <el-option label="全部状态" value="" />
                <el-option label="待审核" :value="false" />
                <el-option label="已审核" :value="true" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="开始日期">
              <el-date-picker
                v-model="filters.start_date"
                type="date"
                placeholder="选择开始日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="结束日期">
              <el-date-picker
                v-model="filters.end_date"
                type="date"
                placeholder="选择结束日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="返回数量">
              <el-input-number v-model="filters.limit" :min="1" :max="1000" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <div class="filter-actions">
          <el-button type="primary" :loading="loading" @click="searchConversations">
            <el-icon><Search /></el-icon>
            开始查询
          </el-button>
          <el-button @click="resetFilters">
            <el-icon><RefreshLeft /></el-icon>
            重置
          </el-button>
        </div>
      </el-form>
    </el-card>

    <!-- 结果列表 -->
    <el-card shadow="hover" class="result-card" v-if="hasSearched">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="card-title">查询结果</span>
            <el-tag type="info" size="small">共 {{ conversations.length }} 条记录</el-tag>
          </div>
          <div class="header-right">
            <el-button type="success" size="small" @click="exportData" :disabled="conversations.length === 0">
              <el-icon><Download /></el-icon>
              导出数据
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="paginatedData"
        v-loading="loading"
        style="width: 100%"
        row-key="memory_id"
        @expand-change="handleExpandChange"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-content">
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="完整问题" :span="2">
                  <div class="full-text">{{ row.query }}</div>
                </el-descriptions-item>
                <el-descriptions-item label="完整回复" :span="2">
                  <div class="full-text">{{ row.response }}</div>
                </el-descriptions-item>
                <el-descriptions-item label="检索来源">
                  {{ row.retrieval_source || '无' }}
                </el-descriptions-item>
                <el-descriptions-item label="检索分数">
                  <el-tag v-if="row.retrieval_score" type="success" size="small">
                    {{ row.retrieval_score?.toFixed(3) }}
                  </el-tag>
                  <span v-else>无</span>
                </el-descriptions-item>
                <el-descriptions-item label="检索内容" :span="2" v-if="row.retrieval_content">
                  <div class="retrieval-content">{{ row.retrieval_content }}</div>
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="memory_id" label="记忆ID" width="120" show-overflow-tooltip />
        <el-table-column prop="user_id" label="用户ID" width="120" show-overflow-tooltip />
        <el-table-column prop="query" label="用户问题" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="query-cell">{{ row.query }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="response" label="系统回复" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="response-cell">{{ row.response }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="审核状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.expert_verified ? 'success' : 'warning'" size="small">
              {{ row.expert_verified ? '已审核' : '待审核' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="评分" width="80" align="center">
          <template #default="{ row }">
            <span v-if="row.quality_score !== undefined">{{ row.quality_score }}</span>
            <span v-else class="no-score">-</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="conversations.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 空状态 -->
    <el-card shadow="hover" class="empty-card" v-else>
      <el-empty description="请设置查询条件后点击'开始查询'">
        <el-button type="primary" @click="searchConversations">立即查询</el-button>
      </el-empty>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, RefreshLeft, Download } from '@element-plus/icons-vue'

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

const loading = ref(false)
const hasSearched = ref(false)
const conversations = ref<Conversation[]>([])
const currentPage = ref(1)
const pageSize = ref(20)

const filters = reactive({
  user_id: '',
  agent_id: '',
  run_id: '',
  application_id: '',
  expert_verified: '' as '' | boolean,
  start_date: '',
  end_date: '',
  limit: 50,
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return conversations.value.slice(start, end)
})

const getApiBaseUrl = () => {
  const host = localStorage.getItem('admin_server_host') || '192.168.0.105'
  const port = localStorage.getItem('admin_server_port') || '8081'
  return `http://${host}:${port}`
}

const searchConversations = async () => {
  loading.value = true
  hasSearched.value = true
  
  try {
    const params = new URLSearchParams()
    
    if (filters.user_id) params.append('user_id', filters.user_id)
    if (filters.agent_id) params.append('agent_id', filters.agent_id)
    if (filters.run_id) params.append('run_id', filters.run_id)
    if (filters.application_id) params.append('application_id', filters.application_id)
    if (filters.expert_verified !== '') params.append('expert_verified', String(filters.expert_verified))
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    if (filters.limit) params.append('limit', String(filters.limit))
    
    const response = await fetch(`${getApiBaseUrl()}/memory/v1/conversations/history?${params}`)
    const data = await response.json()
    
    if (data.ret_code === '000000') {
      conversations.value = data.data.conversations || []
      currentPage.value = 1
      ElMessage.success(`查询成功，共 ${conversations.value.length} 条记录`)
    } else {
      ElMessage.error(`查询失败: ${data.ret_msg}`)
    }
  } catch (error) {
    ElMessage.error('网络错误，请检查服务器连接')
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.user_id = ''
  filters.agent_id = ''
  filters.run_id = ''
  filters.application_id = ''
  filters.expert_verified = ''
  filters.start_date = ''
  filters.end_date = ''
  filters.limit = 50
}

const formatDateTime = (dateString: string) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString('zh-CN')
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

const handleExpandChange = (row: Conversation, expandedRows: Conversation[]) => {
  // Handle expand if needed
}

const exportData = () => {
  if (conversations.value.length === 0) {
    ElMessage.warning('没有数据可导出')
    return
  }
  
  const dataStr = JSON.stringify(conversations.value, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `conversations_export_${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

onMounted(() => {
  // Set default date range (last 30 days)
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)
  
  filters.start_date = startDate.toISOString().split('T')[0]
  filters.end_date = endDate.toISOString().split('T')[0]
})
</script>

<style scoped>
.conversations-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.filter-card,
.result-card,
.empty-card {
  border-radius: 12px;
  border: none;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.filter-form {
  padding-top: 8px;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.expand-content {
  padding: 16px 24px;
  background: #fafafa;
}

.full-text {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
  max-height: 200px;
  overflow-y: auto;
}

.retrieval-content {
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 150px;
  overflow-y: auto;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 13px;
}

.query-cell,
.response-cell {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.no-score {
  color: #c0c4cc;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}
</style>
