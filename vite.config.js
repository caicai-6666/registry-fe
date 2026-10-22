import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'
import { iconAssetCache } from './config/iconAssetCache.js'

export default defineConfig(({ command, isPreview }) => {
  const servingSource = command === 'serve' && !isPreview
  const env = loadEnv('', process.cwd(), 'REGISTRY_')
  const target = env.REGISTRY_BACKEND_URL || 'http://127.0.0.1:23000'
  const backendUrl = new URL(target)
  if (!['http:', 'https:'].includes(backendUrl.protocol) || backendUrl.username || backendUrl.password ||
      backendUrl.pathname !== '/' || backendUrl.search || backendUrl.hash) {
    throw new Error('REGISTRY_BACKEND_URL 必须为不含凭据、路径和查询参数的 HTTP/HTTPS 根地址')
  }
  const proxy = {
    '/knowledge-accumulation/registry/api': { target, changeOrigin: true },
  }
  const sourceProxy = {
    '/dev/knowledge-accumulation/registry/api': {
      target, changeOrigin: true,
      rewrite: path => path.replace(/^\/dev(?=\/knowledge-accumulation\/registry\/api)/, ''),
    },
  }
  return {
    base: servingSource ? '/dev/knowledge-accumulation/registry/' : '/knowledge-accumulation/registry/',
    plugins: [vue(), iconAssetCache()],
    // 沿用参考项目的非隐藏缓存目录，便于映射服务器转发依赖资源。
    cacheDir: 'node_modules/vite-cache',
    // 图片独立输出带内容哈希的文件，供浏览器跨页面、跨刷新复用缓存。
    build: { assetsInlineLimit: filePath => /\.(?:webp|png|jpe?g|gif|svg|ico|avif)$/i.test(filePath) ? false : undefined },
    server: {
      host: '127.0.0.1',
      port: 23080,
      strictPort: true,
      allowedHosts: ['pheno.szkl.com'],
      proxy: sourceProxy,
    },
    preview: { host: '127.0.0.1', allowedHosts: ['pheno.szkl.com'], proxy },
  }
})
