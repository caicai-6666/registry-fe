import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router.js'

const app = createApp(App)
app.use(router)
// 先挂载背景及加载层，路由与首屏数据在其上准备。
app.mount('#app')
