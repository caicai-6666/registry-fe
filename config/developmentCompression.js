import compression from 'compression'

export function developmentCompression() {
  const compress = compression({
    threshold: 1024,
    level: 6,
    filter(_request, response) {
      const type = String(response.getHeader('Content-Type') || '')
      const cacheControl = String(response.getHeader('Cache-Control') || '')
      return response.statusCode === 200 && !/\bno-store\b/i.test(cacheControl) &&
        /^(?:text\/(?:html|css|javascript)|application\/(?:javascript|json)|image\/svg\+xml)(?:;|$)/i.test(type)
    },
  })
  return {
    name: 'registry-development-compression',
    apply: 'serve',
    configureServer(server) {
      const prefix = server.config.base
      server.middlewares.use((request, response, next) => {
        const path = request.url?.split('?')[0] || ''
        // 静态文本在进入 FRP 前压缩；API、鉴权与流式响应不经过压缩中间件。
        if (request.method !== 'GET' || request.headers.range || !path.startsWith(prefix) ||
            /^(?:api|__auth)(?:\/|$)/.test(path.slice(prefix.length))) return next()
        compress(request, response, next)
      })
    },
  }
}
