# 页面路由

本项目使用 Vue Router 4 的 HTML5 History 模式，三个工作台分区共用外框，以单个路由出口及 KeepAlive 缓存切换。共享 token 约定及错误回退见[访问凭据与鉴权](authentication.md)，环境路径见[环境与部署](deployment.md)。

## 页面与地址

路由集中在 [`src/router.js`](../../src/router.js)，页面前缀使用 Vite 的 `BASE_URL`。

| 页面 | 路由 | 开发地址 | 构建部署地址 |
| --- | --- | --- | --- |
| 数据中心 | `/data-center` | `/dev/knowledge-accumulation/registry/data-center` | `/knowledge-accumulation/registry/data-center` |
| 审核广场 | `/review-square` | `/dev/knowledge-accumulation/registry/review-square` | `/knowledge-accumulation/registry/review-square` |
| 人员管理 | `/personnel` | `/dev/knowledge-accumulation/registry/personnel` | `/knowledge-accumulation/registry/personnel` |

基础入口、未知地址及原 `/login` 地址统一跳转数据中心；`/workspace` 保留查询与锚点并跳转数据中心。已移除登录页和登录守卫，不会重定向到登录表单。进入后由根组件检查共享 token 是否存在，业务权限和有效性由后端接口判断。

## 组件与进入过程

[`App.vue`](../../src/App.vue) 在路由就绪前挂载分子背景和透明加载层。存在共享 token 时挂载工作台，准备中的页面隐藏且不可交互；首屏数据、图标及渲染就绪后淡入。缺少 token、401 或 403 时改为显示返回知识沉淀入口的页面，具体文案与返回路径由[鉴权专题](authentication.md#缺少凭据失效与无权限)维护。

[`WorkspaceLayout.vue`](../../src/layouts/WorkspaceLayout.vue) 承载品牌、路由导航、账户名称、审核记录和返回入口。子路由各自对应一个页面组件，通过 `RouterView` 插槽、`KeepAlive`（最多 3 个实例）和 `Transition` 组合切换，以路由名称作为缓存键。页面首次访问时创建，离开后停用并移出活动 DOM，返回时复用原实例；刷新或离开应用清除缓存。工作台及业务页面通过异步路由导入；首次模块加载或路由初始化失败提供重新加载入口。

## 刷新与部署

History 深层页面需要服务器回退到 HTML。Vite 源码服务使用 `/dev/knowledge-accumulation/registry/`，构建预览和 Nginx 使用 `/knowledge-accumulation/registry/`，模块、图片、PDF.js 和 WebSocket 跟随页面基础路径。开发 API 以 `/dev/knowledge-accumulation/registry/api/` 请求，Vite 代理仅移除 `/dev`；构建部署的 API 原样转发。认证均使用共享 token，没有开发账号或钉钉登录模式。

共享存储只在同源内可见，域名开发入口应与统一入口使用相同协议、主机和端口。网关路由与运行方式见[环境与部署](deployment.md)。

## 页面缓存与生命周期

数据中心、审核广场及人员管理使用 [`useWorkspacePage()`](../../src/composables/useWorkspacePage.js) 管理激活状态及滚动位置。路由切换立即将离开页设为非活动，业务读取根据此状态停止，关闭预览及人员权限弹窗；停用页面不会销毁组件，也不会取消已发出的审核决定、文件等级更新或组织架构刷新。返回后保留筛选、选中项、页面内草稿与已加载数据，恢复页面及嵌套滚动容器位置。真正卸载时按原逻辑释放请求、事件、图像及阅读器资源。

导航按数据中心、审核广场、人员管理顺序决定滑动方向；向后项进入时由右侧滑入，向前项进入时由左侧滑入，浏览器前进／后退使用同样规则。动画期间离开页不可交互，完成后仅当前页面留在活动 DOM；减少动画偏好下直接切换。

KeepAlive 仅缓存组件实例；“首次成功加载后复用、手动刷新才查询”的请求规则继续由业务 composable 执行，失败及中断不当作成功缓存。缓存不写入持久存储，数据更新与凭据变化的处理见对应功能专题。

## 验证

使用独立无头 Chrome 和正式 FastAPI 路由的隔离依赖验证三个工作台的直接访问与首屏准备、页面实例缓存及停用后离开活动 DOM、筛选／审核草稿／嵌套滚动位置恢复，以及切换时无额外业务 GET。正常动画下验证方向、浏览器后退及快速连续切换；减少动画及 390px 窄屏均保持可用。切走页面期间，入库审核、文件等级调整和组织架构刷新仍能完成并在返回后回显；人员权限弹窗在离开时关闭。未操作真实业务数据。
