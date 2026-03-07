<template>
  <el-container class="admin-layout">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '240px'" class="admin-aside">
      <div class="logo-section">
        <div class="logo-icon">
          <el-icon :size="28"><Setting /></el-icon>
        </div>
        <transition name="fade">
          <span v-if="!isCollapse" class="logo-text">管理后台</span>
        </transition>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        class="admin-menu"
        @select="handleMenuSelect"
      >
        <el-menu-item index="dashboard">
          <el-icon><DataBoard /></el-icon>
          <template #title>数据概览</template>
        </el-menu-item>
        
        <el-menu-item index="conversations">
          <el-icon><ChatDotRound /></el-icon>
          <template #title>对话历史</template>
        </el-menu-item>
        
        <el-menu-item index="expert-review">
          <el-icon><Checked /></el-icon>
          <template #title>专家审核</template>
        </el-menu-item>
        
        <el-menu-item index="qa-management">
          <el-icon><QuestionFilled /></el-icon>
          <template #title>QA知识库</template>
        </el-menu-item>
        
        <el-menu-item index="user-profiles">
          <el-icon><User /></el-icon>
          <template #title>用户画像</template>
        </el-menu-item>
        
        <el-sub-menu index="settings">
          <template #title>
            <el-icon><Tools /></el-icon>
            <span>系统设置</span>
          </template>
          <el-menu-item index="settings-server">服务器配置</el-menu-item>
          <el-menu-item index="settings-notification">通知设置</el-menu-item>
        </el-sub-menu>
      </el-menu>
      
      <div class="collapse-btn" @click="isCollapse = !isCollapse">
        <el-icon :size="20">
          <Fold v-if="!isCollapse" />
          <Expand v-else />
        </el-icon>
      </div>
    </el-aside>
    
    <!-- 主内容区 -->
    <el-container class="main-container">
      <!-- 顶部导航 -->
      <el-header class="admin-header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>管理后台</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <el-tooltip content="刷新" placement="bottom">
            <el-button :icon="Refresh" circle @click="handleRefresh" />
          </el-tooltip>
          
          <el-tooltip content="全屏" placement="bottom">
            <el-button :icon="FullScreen" circle @click="toggleFullscreen" />
          </el-tooltip>
          
          <el-dropdown trigger="click" @command="handleUserCommand">
            <div class="user-info">
              <el-avatar :size="32" :icon="UserFilled" />
              <span class="username">管理员</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人设置</el-dropdown-item>
                <el-dropdown-item command="back">返回用户端</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <!-- 内容区 -->
      <el-main class="admin-main">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Setting,
  DataBoard,
  ChatDotRound,
  Checked,
  QuestionFilled,
  User,
  Tools,
  Fold,
  Expand,
  Refresh,
  FullScreen,
  UserFilled,
  ArrowDown,
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const isCollapse = ref(false)

const menuTitles: Record<string, string> = {
  'dashboard': '数据概览',
  'conversations': '对话历史',
  'expert-review': '专家审核',
  'qa-management': 'QA知识库',
  'user-profiles': '用户画像',
  'settings-server': '服务器配置',
  'settings-notification': '通知设置',
}

const activeMenu = computed(() => {
  const path = route.path.split('/').pop() || 'dashboard'
  return path
})

const currentPageTitle = computed(() => {
  return menuTitles[activeMenu.value] || '数据概览'
})

const handleMenuSelect = (index: string) => {
  router.push(`/admin/${index}`)
}

const handleRefresh = () => {
  window.location.reload()
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

const handleUserCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'back':
      router.push('/chat')
      break
    case 'logout':
      localStorage.clear()
      router.push('/')
      break
  }
}
</script>

<style scoped>
.admin-layout {
  height: 100vh;
  background: #f0f2f5;
}

.admin-aside {
  background: linear-gradient(180deg, #1e1e2d 0%, #252536 100%);
  display: flex;
  flex-direction: column;
  transition: width 0.3s;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
}

.logo-section {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0 16px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: white;
  white-space: nowrap;
}

.admin-menu {
  flex: 1;
  border-right: none;
  background: transparent;
  --el-menu-bg-color: transparent;
  --el-menu-text-color: rgba(255, 255, 255, 0.7);
  --el-menu-hover-bg-color: rgba(102, 126, 234, 0.2);
  --el-menu-active-color: #667eea;
}

.admin-menu :deep(.el-menu-item),
.admin-menu :deep(.el-sub-menu__title) {
  height: 50px;
  line-height: 50px;
  margin: 4px 8px;
  border-radius: 8px;
}

.admin-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.admin-menu :deep(.el-sub-menu .el-menu-item) {
  padding-left: 52px !important;
  min-width: auto;
}

.collapse-btn {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s;
}

.collapse-btn:hover {
  color: white;
  background: rgba(255, 255, 255, 0.05);
}

.main-container {
  display: flex;
  flex-direction: column;
}

.admin-header {
  height: 64px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 8px;
  transition: background 0.3s;
}

.user-info:hover {
  background: #f5f7fa;
}

.username {
  font-size: 14px;
  color: #303133;
}

.admin-main {
  padding: 24px;
  overflow-y: auto;
  background: #f0f2f5;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
