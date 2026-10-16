import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

export function iconAssetCache() {
  return {
    name: 'registry-icon-asset-cache',
    configurePreviewServer(server) {
      const prefix = `${server.config.base}assets/`
      server.middlewares.use((request, response, next) => {
        const pathname = (request.url || '').split('?')[0]
        const filename = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : ''
        // 只缓存实际存在的版本化图片，缺失资源和页面不使用长期缓存。
        if (/^[\w.-]+-[\w-]{8,}\.(?:webp|png|jpe?g|gif|svg|ico|avif)$/i.test(filename) &&
            existsSync(resolve(server.config.root, server.config.build.outDir, 'assets', filename))) {
          response.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
        }
        next()
      })
    },
  }
}
