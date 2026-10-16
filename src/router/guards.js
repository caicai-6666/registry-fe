export function createAuthGuard(getSession) {
  return to => {
    const session = getSession()
    if (to.meta.requiresAuth && !session) {
      return { name: 'login', query: { redirect: to.fullPath }, replace: true }
    }
    if (to.meta.guestOnly && session) return { name: 'data-center', replace: true }
  }
}

export function getLoginDestination(router, redirect) {
  // 只恢复本应用的受保护页面，避免外部跳转和登录页循环。
  if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')) {
    const target = router.resolve(redirect)
    if (target.matched.length && target.meta.requiresAuth) return target.fullPath
  }
  return { name: 'data-center' }
}
