<template>
  <div class="expert-review-page">
    <!-- 搜索筛选区 -->
    <el-card shadow="hover" class="filter-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">审核条件筛选</span>
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
            <el-form-item label="审核状态">
              <el-select v-model="filters.expert_verified" placeholder="选择状态" style="width: 100%">
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
        </el-row>
        
        <div class="filter-actions">
          <el-button type="primary" :loading="loading" @click="searchConversations">
            <el-icon><Search /></el-icon>
            查询待审核
          </el-button>
          <el-button @click="resetFilters">
            <el-icon><RefreshLeft /></el-icon>
            重置
          </el-button>
        </div>
      </el-form>
    </el-card>

    <!-- 批量操作栏 -->
    <el-card shadow="hover" class="batch-card" v-if="conversations.length > 0">
      <div class="batch-actions">
        <div class="batch-left">
          <el-checkbox
            v-model="selectAll"
            :indeterminate="isIndeterminate"
            @change="handleSelectAll"
          >
            全选
          </el-checkbox>
          <el-tag type="primary" size="small" class="selected-count">
            已选择 {{ selectedIds.size }} 条
          </el-tag>
        </div>
        <div class="batch-right">
          <span class="batch-label">批量评分:</span>
          <el-input-number
            v-model="batchScore"
            :min="0"
            :max="1"
            :step="0.1"
            :precision="1"
            size="small"
            style="width: 100px"
          />
          <el-button
            type="success"
            size="small"
            :disabled="selectedIds.size === 0"
            @click="batchApprove"
          >
            批量通过
          </el-button>
          <el-button
            type="danger"
            size="small"
            :disabled="selectedIds.size === 0"
            @click="batchReject"
          >
            批量拒绝
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 审核列表 -->
    <el-card shadow="hover" class="result-card" v-if="hasSearched">
      <template #header>
        <div class="card-header">
          <span class="card-title">审核列表</span>
          <el-tag type="info" size="small">共 {{ conversations.length }} 条记录</el-tag>
        </div>
      </template>

      <div v-loading="loading" class="review-list">
        <el-empty v-if="conversations.length === 0" description="没有找到符合条件的记录" />
        
        <div
          v-for="conv in paginatedData"
          :key="conv.memory_id"
          class="review-item"
          :class="{ selected: selectedIds.has(conv.memory_id), approved: conv.expert_verified }"
        >
          <div class="item-checkbox">
            <el-checkbox
              :model-value="selectedIds.has(conv.memory_id)"
              :disabled="conv.expert_verified"
              @change="toggleSelect(conv.memory_id)"
            />
          </div>
          
          <div class="item-content">
            <!-- 基本信息 -->
            <div class="item-meta">
              <el-descriptions :column="4" size="small" border>
                <el-descriptions-item label="记忆ID">{{ conv.memory_id }}</el-descriptions-item>
                <el-descriptions-item label="用户ID">{{ conv.user_id }}</el-descriptions-item>
                <el-descriptions-item label="会话ID">{{ conv.run_id || conv.thread_id || 'N/A' }}</el-descriptions-item>
                <el-descriptions-item label="时间">{{ formatDateTime(conv.created_at) }}</el-descriptions-item>
              </el-descriptions>
            </div>
            
            <!-- 对话内容 -->
            <div class="conversation-content">
              <div class="query-box">
                <div class="box-label">用户询问</div>
                <div class="box-content">{{ conv.query }}</div>
              </div>
              <div class="response-box">
                <div class="box-label">系统回复</div>
                <div class="box-content">{{ conv.response }}</div>
              </div>
              
              <!-- 检索信息 -->
              <div class="retrieval-box" v-if="conv.retrieval_content || conv.retrieval_source">
                <div class="box-label">知识库检索</div>
                <div class="retrieval-info">
                  <div v-if="conv.retrieval_source" class="retrieval-item">
                    <span class="retrieval-label">来源:</span>
                    <span>{{ conv.retrieval_source }}</span>
                    <el-tag v-if="conv.retrieval_score" type="success" size="small" style="margin-left: 8px">
                      匹配分数: {{ conv.retrieval_score?.toFixed(3) }}
                    </el-tag>
                  </div>
                  <div v-if="conv.retrieval_content" class="retrieval-content-box">
                    {{ conv.retrieval_content }}
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 审核状态/操作 -->
            <div class="item-actions">
              <template v-if="conv.expert_verified">
                <div class="approved-info">
                  <el-tag type="success" size="large">已审核通过</el-tag>
                  <div class="approved-details">
                    <span>评分: {{ conv.quality_score }}</span>
                    <span v-if="conv.review_notes">备注: {{ conv.review_notes }}</span>
                  </div>
                </div>
              </template>
              <template v-else>
                <div class="review-controls">
                  <div class="control-row">
                    <span class="control-label">质量评分:</span>
                    <el-input-number
                      v-model="reviewData[conv.memory_id].score"
                      :min="0"
                      :max="1"
                      :step="0.1"
                      :precision="1"
                      size="small"
                    />
                  </div>
                  <div class="control-row">
                    <span class="control-label">回复纠正:</span>
                    <el-input
                      v-model="reviewData[conv.memory_id].correction"
                      type="textarea"
                      :rows="2"
                      placeholder="如需修正回复内容，请在此输入..."
                      size="small"
                    />
                  </div>
                  <div class="control-row">
                    <span class="control-label">审核备注:</span>
                    <el-input
                      v-model="reviewData[conv.memory_id].notes"
                      placeholder="审核备注（可选）"
                      size="small"
                    />
                  </div>
                  <div class="action-buttons">
                    <el-button type="success" @click="approveConversation(conv)">
                      通过
                    </el-button>
                    <el-button type="danger" @click="rejectConversation(conv)">
                      拒绝
                    </el-button>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="conversations.length > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="conversations.length"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 空状态 -->
    <el-card shadow="hover" class="empty-card" v-else>
      <el-empty description="请设置筛选条件后查询待审核的对话">
        <el-button type="primary" @click="searchPending">查询待审核</el-button>
      </el-empty>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, RefreshLeft } from '@element-plus/icons-vue'

interface Conversation {
  memory_id: string
  user_id: string
  run_id?: string
  thread_id?: string
  agent_id?: string
  application_id?: string
  query: string
  response: string
  created_at: string
  updated_at?: string
  expert_verified?: boolean
  quality_score?: number
  review_notes?: string
  retrieval_source?: string
  retrieval_score?: number
  retrieval_content?: string
}

interface ReviewData {
  score: number
  correction: string
  notes: string
}

const loading = ref(false)
const hasSearched = ref(false)
const conversations = ref<Conversation[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const selectedIds = ref<Set<string>>(new Set())
const batchScore = ref(0.9)

const filters = reactive({
  user_id: '',
  expert_verified: false as '' | boolean,
  start_date: '',
  end_date: '',
  limit: 50,
})

const reviewData = reactive<Record<string, ReviewData>>({})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return conversations.value.slice(start, end)
})

const selectAll = computed({
  get: () => {
    const pendingItems = conversations.value.filter(c => !c.expert_verified)
    return pendingItems.length > 0 && pendingItems.every(c => selectedIds.value.has(c.memory_id))
  },
  set: () => {}
})

const isIndeterminate = computed(() => {
  const pendingItems = conversations.value.filter(c => !c.expert_verified)
  const selectedCount = pendingItems.filter(c => selectedIds.value.has(c.memory_id)).length
  return selectedCount > 0 && selectedCount < pendingItems.length
})

// Initialize review data for each conversation
watch(conversations, (newConversations) => {
  newConversations.forEach(conv => {
    if (!reviewData[conv.memory_id]) {
      reviewData[conv.memory_id] = {
        score: 0.9,
        correction: '',
        notes: ''
      }
    }
  })
}, { immediate: true })

const getApiBaseUrl = () => {
  const host = localStorage.getItem('admin_server_host') || '192.168.0.105'
  const port = localStorage.getItem('admin_server_port') || '8081'
  return `http://${host}:${port}`
}

const searchConversations = async () => {
  loading.value = true
  hasSearched.value = true
  selectedIds.value.clear()
  
  try {
    const params = new URLSearchParams()
    
    if (filters.user_id) params.append('user_id', filters.user_id)
    if (filters.expert_verified !== '') params.append('expert_verified', String(filters.expert_verified))
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    params.append('limit', String(filters.limit))
    
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

const searchPending = () => {
  filters.expert_verified = false
  searchConversations()
}

const resetFilters = () => {
  filters.user_id = ''
  filters.expert_verified = false
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

const toggleSelect = (memoryId: string) => {
  if (selectedIds.value.has(memoryId)) {
    selectedIds.value.delete(memoryId)
  } else {
    selectedIds.value.add(memoryId)
  }
  selectedIds.value = new Set(selectedIds.value)
}

const handleSelectAll = (val: boolean) => {
  if (val) {
    conversations.value.forEach(conv => {
      if (!conv.expert_verified) {
        selectedIds.value.add(conv.memory_id)
      }
    })
  } else {
    selectedIds.value.clear()
  }
  selectedIds.value = new Set(selectedIds.value)
}

const approveConversation = async (conv: Conversation) => {
  const data = reviewData[conv.memory_id]
  
  try {
    const response = await fetch(`${getApiBaseUrl()}/memory/v1/conversations/expert-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memory_id: conv.memory_id,
        query: conv.query,
        expert_approved: true,
        quality_score: data.score,
        corrected_response: data.correction || null,
        review_notes: data.notes || null,
        expert_id: 'admin'
      })
    })
    
    const result = await response.json()
    
    if (result.ret_code === '000000') {
      ElMessage.success('审核通过成功')
      searchConversations()
    } else {
      ElMessage.error(`审核失败: ${result.ret_msg}`)
    }
  } catch (error) {
    ElMessage.error('网络错误，请稍后重试')
  }
}

const rejectConversation = async (conv: Conversation) => {
  const data = reviewData[conv.memory_id]
  
  try {
    const response = await fetch(`${getApiBaseUrl()}/memory/v1/conversations/expert-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memory_id: conv.memory_id,
        query: conv.query,
        expert_approved: false,
        quality_score: 0,
        corrected_response: null,
        review_notes: data.notes || '专家拒绝通过',
        expert_id: 'admin'
      })
    })
    
    const result = await response.json()
    
    if (result.ret_code === '000000') {
      ElMessage.success('已拒绝该记录')
      searchConversations()
    } else {
      ElMessage.error(`操作失败: ${result.ret_msg}`)
    }
  } catch (error) {
    ElMessage.error('网络错误，请稍后重试')
  }
}

const batchApprove = async () => {
  if (selectedIds.value.size === 0) return
  
  await ElMessageBox.confirm(
    `确定要批量通过 ${selectedIds.value.size} 条记录吗？`,
    '批量审核确认',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  )
  
  try {
    const reviewItems = Array.from(selectedIds.value).map(memoryId => {
      const conv = conversations.value.find(c => c.memory_id === memoryId)
      return {
        memory_id: memoryId,
        query: conv?.query || '',
        expert_approved: true,
        quality_score: batchScore.value,
        corrected_response: null,
        review_notes: '批量审核通过',
        expert_id: 'admin'
      }
    })
    
    const response = await fetch(`${getApiBaseUrl()}/memory/v1/conversations/batch-expert-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review_items: reviewItems })
    })
    
    const result = await response.json()
    
    if (result.ret_code === '000000') {
      ElMessage.success(`批量审核完成！成功: ${result.data.update_success}, 失败: ${result.data.update_failed}`)
      selectedIds.value.clear()
      searchConversations()
    } else {
      ElMessage.error(`批量审核失败: ${result.ret_msg}`)
    }
  } catch (error) {
    ElMessage.error('网络错误，请稍后重试')
  }
}

const batchReject = async () => {
  if (selectedIds.value.size === 0) return
  
  await ElMessageBox.confirm(
    `确定要批量拒绝 ${selectedIds.value.size} 条记录吗？`,
    '批量拒绝确认',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  )
  
  try {
    const reviewItems = Array.from(selectedIds.value).map(memoryId => {
      const conv = conversations.value.find(c => c.memory_id === memoryId)
      return {
        memory_id: memoryId,
        query: conv?.query || '',
        expert_approved: false,
        quality_score: 0,
        corrected_response: null,
        review_notes: '批量审核拒绝',
        expert_id: 'admin'
      }
    })
    
    const response = await fetch(`${getApiBaseUrl()}/memory/v1/conversations/batch-expert-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review_items: reviewItems })
    })
    
    const result = await response.json()
    
    if (result.ret_code === '000000') {
      ElMessage.success(`批量拒绝完成！成功: ${result.data.update_success}, 失败: ${result.data.update_failed}`)
      selectedIds.value.clear()
      searchConversations()
    } else {
      ElMessage.error(`批量拒绝失败: ${result.ret_msg}`)
    }
  } catch (error) {
    ElMessage.error('网络错误，请稍后重试')
  }
}

onMounted(() => {
  // Set default date range
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)
  
  filters.start_date = startDate.toISOString().split('T')[0]
  filters.end_date = endDate.toISOString().split('T')[0]
})
</script>

<style scoped>
.expert-review-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.filter-card,
.batch-card,
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

.batch-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.batch-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.batch-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.batch-label {
  font-size: 14px;
  color: #606266;
}

.selected-count {
  font-weight: 600;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-item {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: #fafafa;
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.review-item:hover {
  border-color: #e2e8f0;
}

.review-item.selected {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  border-color: #667eea;
}

.review-item.approved {
  background: rgba(16, 185, 129, 0.05);
}

.item-checkbox {
  padding-top: 4px;
}

.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.item-meta {
  flex-shrink: 0;
}

.conversation-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.query-box,
.response-box,
.retrieval-box {
  padding: 12px 16px;
  border-radius: 8px;
  border-left: 4px solid;
}

.query-box {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(102, 126, 234, 0.03) 100%);
  border-left-color: #667eea;
}

.response-box {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.03) 100%);
  border-left-color: #10b981;
}

.retrieval-box {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0.03) 100%);
  border-left-color: #8b5cf6;
}

.box-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
}

.box-content {
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
  white-space: pre-wrap;
}

.retrieval-info {
  font-size: 13px;
}

.retrieval-item {
  margin-bottom: 8px;
}

.retrieval-label {
  font-weight: 600;
  color: #6d28d9;
  margin-right: 8px;
}

.retrieval-content-box {
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.5;
  max-height: 100px;
  overflow-y: auto;
}

.item-actions {
  flex-shrink: 0;
  min-width: 280px;
}

.approved-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.approved-details {
  font-size: 13px;
  color: #64748b;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.review-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.control-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

@media (max-width: 1200px) {
  .review-item {
    flex-direction: column;
  }
  
  .item-actions {
    min-width: auto;
  }
}
</style>
