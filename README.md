# 知识沉淀注册中心前端

面向知识沉淀注册中心后端的浏览器端界面，使用 Vue 3、Vue Router 4、Vite 和 JavaScript。整体风格参考 `contract-service-fe`，包含动态分子背景、半透明外框及窄屏适配。

## 当前功能

| 功能 | 当前实现 |
| --- | --- |
| 登录与账户 | 使用后端人员密钥登录，显示后端账户名称，支持标签页会话与退出。登录成功后保留加载状态，等待工作台首屏数据、图标及渲染就绪再进入。 |
| 数据中心 | 左侧为平台同步、平台选择及条件筛选，右侧为文件列表；文件按入库时间降序、按入库年月分组，右上角可刷新目录。 |
| 文件筛选 | 支持平台、入库日期、通行证前缀、文件名、摘要、申请人和审核人组合过滤。文本输入失焦后生效，提示随输入更新；重置清空全部条件。 |
| 文件预览 | 根据原件类型展示 PDF、音频或视频，内容显示后淡入摘要及通行证悬浮入口；下载资源在页面内临时缓存。 |
| 审核广场 | 入库／删除审核三栏布局，接入正式待审列表、原件预览、必填备注及通过／拒绝提交，包含二次确认、加载反馈与成功退出动画。 |
| 审核记录 | 查看本人入库及关联删除审核历史；平台优先显示名称，通行证支持多个值。 |
| 人员管理 | 已提供独立路由，内容暂未实现。 |

平台列表包含全部非自身平台及在线／离线状态，按后端下次同步计划更新。页面使用正式接口，不包含业务 mock 或固定登录密码。三个工作台页面通过路由切换并保持挂载，保留各自的页面内状态；刷新或退出后不保留筛选与未提交草稿。

## 页面预览

以下为当前代码的桌面实际渲染截图（1440 × 1000），使用隔离后端、测试身份及测试文件，不代表生产数据。

### 登录页

![知识沉淀注册中心登录页](description/assets/screenshots/current-login-desktop.webp)

### 数据中心

左侧集中筛选，右侧文件按入库时间降序、按年月分组。

![数据中心筛选及月份分组](description/assets/screenshots/current-data-center-desktop.webp)

### 审核广场

审核类型、申请列表、申请详情三栏排列，支持原件预览和审核提交。

![审核广场入库申请详情](description/assets/screenshots/current-review-square-desktop.webp)

## 本地运行

```bash
npm ci
npm run dev
```

- 本机入口：`http://127.0.0.1:23080/dev/registry/`
- 开发域名入口：`https://pheno.szkl.com/dev/registry/`
- 默认后端：`http://127.0.0.1:23000`

Vite 允许 `pheno.szkl.com` 的 Host 请求，并兼容现有映射服务器去除 `/dev` 的转发方式。需要修改后端地址时，复制 `.env.example` 为 `.env.local`，设置 `REGISTRY_BACKEND_URL`。登录密码使用对应后端配置的人员密钥，真实凭据不得提交至仓库。

## 构建、预览与验证

```bash
npm test
npm run build
npm run preview
```

构建输出至 `dist/`。`npm run build` 会先同步 PDF.js 运行时资源；当前未配置 Lint 脚本。测试覆盖鉴权、路由、开发映射、平台同步、目录筛选与分月排序、预览缓存及两种审核流程。

当前基线为 **67 项测试通过、生产构建通过**。本次使用独立无头 Chrome 完成桌面登录进入、左右布局、月份分组及审核广场截图检查，并验证输入提示、失焦应用筛选和重置。窄屏与完整动画时序尚未在本轮重新复核。

## 路由与部署

| 页面 | 应用内路径 |
| --- | --- |
| 登录 | `/login` |
| 数据中心 | `/data-center` |
| 审核广场 | `/review-square` |
| 人员管理 | `/personnel` |

开发页面前缀为 `/dev/registry/`，生产为 `/registry/`；生产入口约定为 `https://pheno.szkl.com/registry/`。未登录访问受保护页面会进入登录页，认证后恢复有效的原目标地址；旧 `/workspace` 跳转数据中心。

开发 API 经同源 `/dev/registry/api/` 代理，生产使用 `/registry/api/`。Docker 默认向宿主机 `127.0.0.1:23080` 映射 HTTP 端口，再由外层 HTTPS 网关转发。镜像、后端网络和网关要求见[环境与部署](description/platform/deployment.md)。本仓库配置完成不代表云端已部署。

图片图标输出为带内容哈希的独立资源，生产及构建预览支持一年缓存，图片内容变化后使用新 URL；开发模式保留缓存校验与热更新。文件原件的页面内临时缓存与图标 HTTP 缓存相互独立。

## 项目文档

- [项目定位与开发边界](description/project.md)
- [文档导航与运行说明](description/readme.md)
- [注册中心导航与数据中心布局](description/features/workspace.md)
- [文件目录、筛选及月份分组](description/features/catalog.md)
- [平台模型、在线状态及同步计划](description/features/platforms.md)
- [文件展示器与预览缓存](description/features/file-preview.md)
- [审核广场](description/features/review-square.md)
- [审核记录](description/features/review-history.md)
- [页面路由与登录守卫](description/platform/routing.md)
- [登录与后端鉴权](description/platform/authentication.md)
- [环境与部署](description/platform/deployment.md)
- [开发规范](AGENTS.md)

## 历史页面参考

[登录页](description/assets/screenshots/login-desktop.jpg) · [平台概览](description/assets/screenshots/platform-countdown-desktop.jpg) · [手机登录页](description/assets/screenshots/login-mobile.jpg) · [域名开发入口](description/assets/screenshots/development-domain.jpg)。这些截图来自此前隔离联调，账户及数据为测试配置，工作台截图不代表最新布局。
