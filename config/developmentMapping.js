function restoreDevelopmentPrefix(request) {
  if (/^\/registry(?:\/|\?|$)/.test(request.url || '')) request.url = `/dev${request.url}`
}

export function developmentMapping() {
  return {
    name: 'registry-development-mapping',
    apply: 'serve',
    configureServer(server) {
      // 映射服务器去掉 /dev；Vite 仍按公开路径处理资源与热更新。
      server.middlewares.use((request, _response, next) => {
        restoreDevelopmentPrefix(request)
        next()
      })
      const httpServer = server.httpServer
      httpServer?.prependListener('upgrade', restoreDevelopmentPrefix)
      httpServer?.once('close', () => httpServer.removeListener('upgrade', restoreDevelopmentPrefix))
    },
  }
}
