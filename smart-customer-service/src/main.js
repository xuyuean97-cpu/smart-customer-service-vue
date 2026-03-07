import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 1. 引入 Element Plus
import ElementPlus from 'element-plus'
// 2. 引入样式
import 'element-plus/dist/index.css'
// 3. 引入图标（如果你代码里用了 <User />, <Promotion /> 等）
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)

// 4. 使用插件
app.use(ElementPlus)

// 5. 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(router)
app.mount('#app')