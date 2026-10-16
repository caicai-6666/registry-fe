# 页面路由

本项目使用 Vue Router 4 的 HTML5 History 模式，参照 `contract-service-fe` 通过独立路由组织页面。环境路径与开发映射见[环境与部署](deployment.md)，会话契约见[登录与后端鉴权](authentication.md)。

## 页面与地址

路由定义集中在 [`src/router.js`](../../src/router.js)，环境前缀来自 Vite 的 `BASE_URL`，不在页面组件中拼接。

| 页面 | 路由 | 开发域名地址 | 生产域名地址 |
| --- | --- | --- | --- |
| 登录 | `/login` | `https://pheno.szkl.com/dev/registry/login` | `https://pheno.szkl.com/registry/login` |
| 数据中心 | `/data-center` | `https://pheno.szkl.com/dev/registry/data-center` | `https://pheno.szkl.com/registry/data-center` |
| 审核广场 | `/review-square` | `https://pheno.szkl.com/dev/registry/review-square` | `https://pheno.szkl.com/registry/review-square` |
| 人员管理 | `/personnel` | `https://pheno.szkl.com/dev/registry/personnel` | `https://pheno.szkl.com/registry/personnel` |

基础入口 `/` 和未知页面地址跳转到数据中心，由登录守卫决定是否先进入登录页。本机开发使用相同的 `/dev/registry/` 前缀与 `23080` 端口。

旧 `/workspace` 地址会跳转到数据中心，并保留查询参数与锚点；它用于兼容已有书签。审核广场已完成[三栏布局和类型导航](../features/review-square.md)，人员管理当前保留空白内容区域。

## 组件职责

[`App.vue`](../../src/App.vue) 保留全局分子背景和路由出口，切换页面时不重复创建背景 Worker。同时保留登录页直至目标工作台首屏就绪，准备中的工作台保持挂载、隐藏且不可交互。登录表单与请求状态由 [`LoginView.vue`](../../src/views/LoginView.vue) 管理。

[`WorkspaceLayout.vue`](../../src/layouts/WorkspaceLayout.vue) 承载注册中心外框、品牌、路由导航、账户名称、审核记录与退出入口；内部使用嵌套路由的三个命名视图组成连续滑动轨道，数据中心由 [`WorkspaceView.vue`](../../src/views/WorkspaceView.vue) 呈现。三个页面在切换时保持挂载，当前路由决定轨道位置与可交互页面。数据中心采用左右布局，左侧展示平台及条件筛选，右侧为文件列表；布局及交互见[注册中心导航与数据中心](../features/workspace.md)。

## 登录守卫

进入三个受保护的页面路由时检查本地会话。没有凭据则跳转登录页，保存原路由的路径、查询参数与锚点；认证成功后使用 `replace` 返回该地址。返回目标必须是本应用的受保护页面，否则进入数据中心。路由切换先用于后台挂载目标页面，视觉进入等待首屏加载、图标解码和渲染就绪；具体等待及失败策略见[登录流程](authentication.md#登录流程)。已有会话访问登录页时进入数据中心。

退出清除会话并用 `replace` 返回登录页；浏览器返回或再次直达注册中心都会重新执行守卫。受保护接口返回 `401` 时进入带失效提示的登录页，重新认证后恢复原目标。守卫只判断是否存在本地凭据，后端仍负责验证免登码是否有效。

## 刷新与部署

History 模式的深层地址需要服务器回退到页面 HTML。Vite 开发服务与生产 Nginx 均已支持这一行为：`/login`、`/data-center`、`/review-square`、`/personnel` 可直接访问和刷新。开发映射服务器去掉 `/dev` 后，现有适配会恢复前缀，浏览器路由与资源地址继续保留 `/dev/registry/`。

API 与缺失静态资源按各自规则处理，不回退到页面。生产网关保留 `/registry/` 转发给前端容器，具体配置见[环境与部署](deployment.md)。

验证使用 `npm test`、`npm run build` 及部署专题中的隔离容器检查，覆盖守卫、登录返回目标、开发映射与生产深层路径回退；浏览器检查登录、刷新、审核记录和退出后返回。

[查看注册中心实测截图](../assets/screenshots/registry-center-desktop.jpg)，账户为隔离测试身份。
