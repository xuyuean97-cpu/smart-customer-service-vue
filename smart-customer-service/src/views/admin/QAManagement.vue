<template>
  <div class="qa-management-page">
    <!-- 统计信息 -->
    <el-row :gutter="24" class="stats-row">
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover" class="stat-card">
          <el-statistic title="QA总数量" :value="stats.total_count">
            <template #prefix>
              <el-icon><Files /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover" class="stat-card">
          <el-statistic title="专家库数量" :value="stats.expert_count">
            <template #prefix>
              <el-icon><UserFilled /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover" class="stat-card">
          <el-statistic title="Redis数量" :value="stats.redis_count">
            <template #prefix>
              <el-icon><Cpu /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="24">
      <!-- 左侧：添加QA -->
      <el-col :xs="24" :lg="12">
        <!-- 添加单个QA -->
        <el-card shadow="hover" class="form-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">添加QA对</span>
            </div>
          </template>
          
          <el-form :model="qaForm" :rules="qaRules" ref="qaFormRef" label-width="80px">
            <el-form-item label="问题" prop="question">
              <el-input
                v-model="qaForm.question"
                type="textarea"
                :rows="3"
                placeholder="请输入问题内容"
              />
            </el-form-item>
            <el-form-item label="答案" prop="answer">
              <el-input
                v-model="qaForm.answer"
                type="textarea"
                :rows="3"
                placeholder="请输入答案内容"
              />
            </el-form-item>
            <el-form-item label="专家ID">
              <el-input v-model="qaForm.expert_id" placeholder="例如: expert_001" />
            </el-form-item>
            <el-form-item label="标签">
              <el-select
                v-model="qaForm.tags"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="输入标签后按回车添加"
                style="width: 100%"
              >
                <el-option v-for="tag in commonTags" :key="tag" :label="tag" :value="tag" />
              </el-select>
            </el-form-item>
            <el-form-item label="服务">
              <el-select
                v-model="qaForm.services"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="选择或输入服务类型"
                style="width: 100%"
              >
                <el-option v-for="service in commonServices" :key="service" :label="service" :value="service" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="addQA" :loading="addLoading">添加QA对</el-button>
              <el-button @click="resetQAForm">清空表单</el-button>
            </el-form-item>
          </el-form>
          
          <el-alert
            v-if="addResult.show"
            :title="addResult.message"
            :type="addResult.type"
            show-icon
            closable
            @close="addResult.show = false"
            style="margin-top: 16px"
          />
        </el-card>

        <!-- 批量添加QA -->
        <el-card shadow="hover" class="form-card" style="margin-top: 24px">
          <template #header>
            <div class="card-header">
              <span class="card-title">批量添加QA对</span>
            </div>
          </template>
          
          <el-form label-width="80px">
            <el-form-item label="批量QA">
              <el-input
                v-model="batchQA"
                type="textarea"
                :rows="8"
                placeholder='JSON格式，例如：[{"question":"问题1","answer":"答案1","tags":["标签1"]}]'
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="addBatchQA" :loading="batchLoading">批量添加</el-button>
              <el-button @click="fillSampleBatch">填充示例</el-button>
            </el-form-item>
          </el-form>
          
          <el-alert
            v-if="batchResult.show"
            :title="batchResult.message"
            :type="batchResult.type"
            show-icon
            closable
            @close="batchResult.show = false"
            style="margin-top: 16px"
          />
        </el-card>
      </el-col>

      <!-- 右侧：QA列表 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="list-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">所有QA列表</span>
              <div class="header-actions">
                <el-button type="primary" size="small" @click="getAllQA" :loading="listLoading">
                  刷新列表
                </el-button>
                <el-button size="small" @click="exportQA" :disabled="qaList.length === 0">
                  导出JSON
                </el-button>
              </div>
            </div>
          </template>

          <el-scrollbar max-height="600px">
            <div v-loading="listLoading" class="qa-list">
              <el-empty v-if="qaList.length === 0" description="暂无QA数据" />
              
              <div v-for="qa in qaList" :key="qa.id" class="qa-item">
                <el-popconfirm
                  title="确定要删除这个QA对吗？"
                  confirm-button-text="确定"
                  cancel-button-text="取消"
                  @confirm="deleteQA(qa)"
                >
                  <template #reference>
                    <el-button class="delete-btn" type="danger" size="small" circle :icon="Delete" />
                  </template>
                </el-popconfirm>
                
                <div class="qa-question">
                  <strong>问题:</strong> {{ qa.question }}
                </div>
                <div class="qa-answer">
                  <strong>答案:</strong> {{ qa.answer }}
                </div>
                <div class="qa-meta">
                  <span><strong>专家ID:</strong> {{ qa.extra_fields?.expert_id || '无' }}</span>
                  <span><strong>应用ID:</strong> {{ qa.extra_fields?.application_id || '无' }}</span>
                </div>
                <div class="qa-meta">
                  <span><strong>记忆ID:</strong> {{ qa.id }}</span>
                </div>
                <div class="qa-tags" v-if="qa.tags && qa.tags.length > 0">
                  <el-tag v-for="tag in qa.tags" :key="tag" size="small" type="primary">
                    {{ tag }}
                  </el-tag>
                </div>
                <div class="qa-services" v-if="qa.services && qa.services.length > 0">
                  <span><strong>服务:</strong> {{ qa.services.join(', ') }}</span>
                </div>
              </div>
            </div>
          </el-scrollbar>
        </el-card>

        <!-- 系统信息 -->
        <el-card shadow="hover" class="system-card" style="margin-top: 24px">
          <template #header>
            <div class="card-header">
              <span class="card-title">系统信息</span>
            </div>
          </template>
          
          <div class="system-actions">
            <el-button @click="getSystemInfo" :loading="systemLoading">获取系统信息</el-button>
            <el-button type="success" @click="pingSystem" :loading="pingLoading">健康检查</el-button>
          </div>
          
          <el-alert
            v-if="systemResult.show"
            :title="systemResult.title"
            :description="systemResult.description"
            :type="systemResult.type"
            show-icon
            style="margin-top: 16px"
          />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Files, UserFilled, Cpu, Delete } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'

interface QAItem {
  id: string
  question: string
  answer: string
  tags?: string[]
  services?: string[]
  images?: string[]
  extra_fields?: {
    expert_id?: string
    application_id?: string
  }
}

const qaFormRef = ref<FormInstance>()
const qaForm = reactive({
  question: '',
  answer: '',
  expert_id: '',
  tags: [] as string[],
  services: [] as string[],
})

const qaRules: FormRules = {
  question: [{ required: true, message: '请输入问题', trigger: 'blur' }],
  answer: [{ required: true, message: '请输入答案', trigger: 'blur' }],
}

const commonTags = ['订单查询', '退款', '物流', '商品', '售后', '支付', '优惠券', '账户']
const commonServices = ['客户服务', '订单服务', '物流服务', '售后服务', '支付服务']

const stats = reactive({
  total_count: 0,
  expert_count: 0,
  redis_count: 0,
})

const qaList = ref<QAItem[]>([])
const batchQA = ref('')

const addLoading = ref(false)
const batchLoading = ref(false)
const listLoading = ref(false)
const systemLoading = ref(false)
const pingLoading = ref(false)

const addResult = reactive({ show: false, message: '', type: 'success' as 'success' | 'error' })
const batchResult = reactive({ show: false, message: '', type: 'success' as 'success' | 'error' })
const systemResult = reactive({ show: false, title: '', description: '', type: 'success' as 'success' | 'error' })

const getApiBaseUrl = () => {
  const host = localStorage.getItem('admin_server_host') || '192.168.0.105'
  const port = localStorage.getItem('admin_server_port') || '8081'
  return `http://${host}:${port}`
}

const addQA = async () => {
  const valid = await qaFormRef.value?.validate().catch(() => false)
  if (!valid) return
  
  addLoading.value = true
  
  try {
    const response = await fetch(`${getApiBaseUrl()}/text2qa/qa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: qaForm.question,
        answer: qaForm.answer,
        tags: qaForm.tags,
        images: [],
        services: qaForm.services,
        extra_fields: {
          expert_id: qaForm.expert_id || '',
          application_id: '主智能客服'
        }
      })
    })
    
    const result = await response.json()
    
    if (result.success) {
      addResult.show = true
      addResult.type = 'success'
      addResult.message = `添加成功！专家记忆ID: ${result.data.expert_memory_id}`
      resetQAForm()
      getAllQA()
    } else {
      addResult.show = true
      addResult.type = 'error'
      addResult.message = `添加失败: ${result.message}`
    }
  } catch (error) {
    addResult.show = true
    addResult.type = 'error'
    addResult.message = '网络错误，请检查服务器连接'
  } finally {
    addLoading.value = false
  }
}

const resetQAForm = () => {
  qaFormRef.value?.resetFields()
  qaForm.question = ''
  qaForm.answer = ''
  qaForm.expert_id = ''
  qaForm.tags = []
  qaForm.services = []
}

const addBatchQA = async () => {
  if (!batchQA.value.trim()) {
    ElMessage.warning('请输入批量QA数据')
    return
  }
  
  batchLoading.value = true
  
  try {
    const qaList = JSON.parse(batchQA.value)
    
    const response = await fetch(`${getApiBaseUrl()}/text2qa/qa/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qa_pairs: qaList })
    })
    
    const result = await response.json()
    
    if (result.success) {
      batchResult.show = true
      batchResult.type = 'success'
      batchResult.message = `批量添加完成！成功: ${result.data.success_count}, 失败: ${result.data.failed_count}`
      getAllQA()
    } else {
      batchResult.show = true
      batchResult.type = 'error'
      batchResult.message = `批量添加失败: ${result.message}`
    }
  } catch (error) {
    batchResult.show = true
    batchResult.type = 'error'
    batchResult.message = '数据格式错误或网络请求失败'
  } finally {
    batchLoading.value = false
  }
}

const fillSampleBatch = () => {
  batchQA.value = JSON.stringify([
    {
      question: "如何查询订单状态？",
      answer: "您可以通过以下方式查询订单：1. 登录账户查看\"我的订单\" 2. 联系在线客服 3. 拨打客服热线",
      tags: ["订单", "查询"],
      images: [],
      services: ["客户服务"],
      extra_fields: { expert_id: "expert_001" }
    },
    {
      question: "退款多久能到账？",
      answer: "退款到账时间：1. 原路退回通常1-7个工作日 2. 银行卡退款3-15个工作日 3. 余额退款即时到账",
      tags: ["退款", "时间"],
      images: [],
      services: ["售后服务"],
      extra_fields: { expert_id: "expert_002" }
    }
  ], null, 2)
}

const getAllQA = async () => {
  listLoading.value = true
  
  try {
    const response = await fetch(`${getApiBaseUrl()}/text2qa/qa`)
    const result = await response.json()
    
    if (result.success) {
      qaList.value = result.data || []
      ElMessage.success(`获取成功，共 ${qaList.value.length} 条QA`)
    } else {
      ElMessage.error(`获取失败: ${result.message}`)
    }
  } catch (error) {
    ElMessage.error('网络错误，请检查服务器连接')
  } finally {
    listLoading.value = false
  }
}

const deleteQA = async (qa: QAItem) => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/text2qa/qa`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: qa.id,
        query: qa.question
      })
    })
    
    const result = await response.json()
    
    if (result.success) {
      ElMessage.success('删除成功')
      getAllQA()
    } else {
      ElMessage.error(`删除失败: ${result.message}`)
    }
  } catch (error) {
    ElMessage.error('网络错误，请稍后重试')
  }
}

const exportQA = () => {
  if (qaList.value.length === 0) {
    ElMessage.warning('没有数据可导出')
    return
  }
  
  const dataStr = JSON.stringify(qaList.value, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `qa_export_${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

const getSystemInfo = async () => {
  systemLoading.value = true
  
  try {
    const response = await fetch(`${getApiBaseUrl()}/text2qa/count`)
    const result = await response.json()
    
    if (result.success) {
      stats.total_count = result.data.total_count
      stats.expert_count = result.data.expert_count
      stats.redis_count = result.data.redis_count
      
      systemResult.show = true
      systemResult.type = 'success'
      systemResult.title = '系统统计信息'
      systemResult.description = `总QA数量: ${result.data.total_count}, 专家库: ${result.data.expert_count}, Redis: ${result.data.redis_count}`
    } else {
      systemResult.show = true
      systemResult.type = 'error'
      systemResult.title = '获取失败'
      systemResult.description = result.message
    }
  } catch (error) {
    systemResult.show = true
    systemResult.type = 'error'
    systemResult.title = '网络错误'
    systemResult.description = '请检查服务器连接'
  } finally {
    systemLoading.value = false
  }
}

const pingSystem = async () => {
  pingLoading.value = true
  
  try {
    const response = await fetch(`${getApiBaseUrl()}/text2qa/ping`)
    const result = await response.json()
    
    if (result.success) {
      const health = result.data
      systemResult.show = true
      systemResult.type = health.overall_health ? 'success' : 'error'
      systemResult.title = '健康检查结果'
      systemResult.description = `整体健康: ${health.overall_health ? '正常' : '异常'}, 专家库: ${health.expert_memory_alive ? '正常' : '异常'}, Redis: ${health.redis_alive ? '正常' : '异常'}`
    } else {
      systemResult.show = true
      systemResult.type = 'error'
      systemResult.title = '检查失败'
      systemResult.description = result.message
    }
  } catch (error) {
    systemResult.show = true
    systemResult.type = 'error'
    systemResult.title = '网络错误'
    systemResult.description = '无法连接到服务器'
  } finally {
    pingLoading.value = false
  }
}

onMounted(() => {
  getAllQA()
  getSystemInfo()
})
</script>

<style scoped>
.qa-management-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-row {
  margin-bottom: 0;
}

.stat-card {
  border-radius: 12px;
  border: none;
  margin-bottom: 16px;
}

.stat-card :deep(.el-statistic__head) {
  font-size: 14px;
  color: #64748b;
}

.stat-card :deep(.el-statistic__content) {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-card :deep(.el-statistic__number) {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}

.form-card,
.list-card,
.system-card {
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

.header-actions {
  display: flex;
  gap: 8px;
}

.qa-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px;
}

.qa-item {
  position: relative;
  background: #fafafa;
  padding: 16px;
  border-radius: 10px;
  border: 1px solid #ebeef5;
  transition: all 0.3s;
}

.qa-item:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.delete-btn {
  position: absolute;
  top: 12px;
  right: 12px;
}

.qa-question {
  font-size: 14px;
  color: #667eea;
  margin-bottom: 8px;
  padding-right: 40px;
}

.qa-answer {
  font-size: 14px;
  color: #303133;
  margin-bottom: 12px;
  line-height: 1.6;
}

.qa-meta {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
  display: flex;
  gap: 16px;
}

.qa-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.qa-services {
  font-size: 12px;
  color: #64748b;
  margin-top: 8px;
}

.system-actions {
  display: flex;
  gap: 12px;
}
</style>
