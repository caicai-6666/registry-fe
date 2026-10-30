# 知识沉淀注册中心前端文档导航

> 本页是本项目 `description/` 目录的统一入口，只链接当前真实存在的文档。项目定位、布局要求与实现边界以[项目开发原则](project.md)为准。

---

## 从哪里开始

| 当前目标 | 建议阅读 |
| --- | --- |
| 了解项目用途、整体风格与注册中心实现范围 | [项目开发原则](project.md) |
| 了解数据中心左右布局与导航 | [注册中心导航与数据中心](features/workspace.md) |
| 了解文件筛选、提示、分月排序及鉴权原件 | [正式文件目录与原件接入](features/catalog.md) |
| 设计审核广场、入库申请与审核表单 | [审核广场三栏布局](features/review-square.md) |
| 了解人员模型、多部门筛选、头像及权限更新 | [人员管理](features/personnel.md) |
| 查看入库、删除审核历史与文件等级变更记录 | [我的审核记录](features/review-history.md) |
| 了解文件类型分发、预览弹窗与 PDF 阅读器 | [文件展示器与预览弹窗](features/file-preview.md) |
| 了解可复用的平台模型与查询鉴权边界 | [平台模型与查询接入](features/platforms.md) |
| 了解已实现的背景、外框与动画边界 | [页面骨架与背景](#页面骨架与背景) |
| 了解页面地址、嵌套路由与错误回退 | [页面路由](platform/routing.md) |
| 了解上游共享凭据、首屏等待和 Bearer 鉴权 | [共享凭据与后端鉴权](platform/authentication.md) |
| 配置本地后端、域名、图标缓存与生产部署 | [环境与部署](platform/deployment.md) |
| 开展代码开发、修改或重构 | [`AGENTS.md`](../AGENTS.md) |
| 新建、修改或审查文档 | [文档撰写风格手册](documentation.md) |
| 了解注册中心后端职责与业务背景 | [后端项目说明](../../registry-be/description/project.md) |
| 查找后端现有接口 | [后端 API 参考](../../registry-be/description/api/readme.md) |
| 确认当前身份接口 | [人员身份 API](../../registry-be/description/api/auth.md) |
| 查找整体布局的参考实现 | [参考项目文档导航](../../contract-service-fe/description/readme.md) |

跨项目链接基于当前本地仓库相对位置；单独检出本仓库时，需另行取得对应后端或参考项目。

---

## 当前文档

```text
description/
├── project.md          项目定位、整体布局要求、开发边界与质量原则
├── readme.md           文档导航、当前技术基础与运行说明
├── documentation.md    文档命名、结构、表达与维护规范
├── platform/
│   ├── authentication.md  同域共享凭据、账户资料与请求鉴权
│   ├── deployment.md      本地代理、Docker 与域名网关
│   └── routing.md         页面地址、共享外框与错误回退
├── features/
│   ├── personnel.md       人员模型、多部门筛选、头像与权限更新
│   ├── workspace.md       数据中心左右布局与导航
│   ├── platforms.md       平台模型、列表校验与查询接入边界
│   ├── file-preview.md    通用预览弹窗、类型分发与 PDF 阅读器
│   ├── review-square.md   入库／删除审核、类型导航与文件等级调整
│   ├── review-history.md  审核历史弹窗与文件等级变更记录
│   └── catalog.md         正式目录、组合筛选、分月排序与原件接口
└── assets/screenshots/ 实际页面预览截图
```

顶层只保留上述三份文档。后续登录、路由、部署等跨业务能力归入 `platform/`，面向用户的业务功能归入 `features/`。在对应能力形成明确设计或实现前，不预建空目录和占位链接。

仓库功能总览与快速入口见根目录 [README](../README.md)。README 已嵌入数据中心、审核广场和人员管理的桌面截图，均为此前隔离测试数据的联调记录，不作为最新代码的验收结果。

---

## 当前技术基础与运行

当前采用 Vue 3、Vue Router 4、Vite、JavaScript ES Modules 和 Vue 单文件组件。依赖和可用脚本以 [`package.json`](../package.json) 为准；使用 History 页面路由，尚未引入状态管理库；共享凭据与 JSON 请求入口位于 `src/services/registryApi.js`。

在项目根目录执行以下命令安装锁定依赖并启动开发服务：

```bash
npm ci
npm run dev
```

本机 Vite 入口为 `http://127.0.0.1:16080/dev/knowledge-accumulation/registry/`，开发域名入口为 `https://talent.szkl.com/dev/knowledge-accumulation/registry/`。页面从统一入口的共享存储读取 token，已接入本人入库与关联删除审核历史，入库及删除待审列表、原件及审核决定已接入，消息服务尚未接入。后端代理、域名白名单、构建预览及容器配置见[环境与部署](platform/deployment.md)。

构建与本地预览：

```bash
npm run build
npm run preview
```

构建产物输出至 `dist/`；预览命令用于检查本地构建结果。`npm test` 执行本地 `tests/*.test.js`，测试目录不随仓库提交；当前覆盖范围与验证限制见根目录 [README](../README.md#构建预览与验证)；前端容器部署见[环境与部署](platform/deployment.md)。当前未配置 Lint 脚本。

后端准备和启动见[后端运行说明](../../registry-be/description/capability/application/runtime.md)。前端联调配置见[环境与部署](platform/deployment.md)。

---

## 页面骨架与背景

页面由 [`src/App.vue`](../src/App.vue) 组合全局背景与路由出口，注册中心外框位于 [`WorkspaceLayout.vue`](../src/layouts/WorkspaceLayout.vue)，页面切换与访问规则见[页面路由](platform/routing.md)。整体样式集中在 [`src/style.css`](../src/style.css)。顶部采用品牌、三个路由导航选项及账户操作的结构；宽度不超过 `900px` 时顶部调整为两行，不超过 `640px` 时进一步缩小留白与控件。数据中心已移除对话区及可调节分隔条，左侧展示平台概览和条件筛选，右侧展示文件列表，平台列表与后端同步计划已接入，布局与交互见[注册中心导航与数据中心](features/workspace.md)。

分子背景沿用参考项目的 [`MolecularFieldBackground.vue`](../src/components/MolecularFieldBackground.vue) 与 [`molecular-field.worker.js`](../src/workers/molecular-field.worker.js)，不引入额外依赖。Worker 使用 OffscreenCanvas 绘制粒子与连接线：桌面绘制 300 个粒子，宽度不超过 `768px` 时绘制 80 个。

- 指针在注册中心外侧时影响粒子；进入注册中心范围后停止跟随，恢复背景自身缓慢运动。
- 页面隐藏或背景不在可见范围时停止动画调度；恢复可见后按审核记录弹窗是否打开决定是否继续动画。
- 系统启用减少动画时，背景保留静态画面，注册中心不播放入场过渡。
- 浏览器不支持 Worker、OffscreenCanvas 或加载失败时，保留浅色静态背景，注册中心仍可显示。
- 组件卸载时释放 Worker、观察器、事件监听和待执行的指针帧。

页面图标沿用参考项目的品牌资源。当前导航提供数据中心、审核广场与人员管理，审核广场已完成[三栏布局、类型切换及正式入库／删除审核](features/review-square.md)；右上角提供本人入库与关联删除审核历史，见[我的审核记录](features/review-history.md)。

---

## 访问与账户栏

本项目不提供登录页、开发账号或钉钉免登，直接使用同域 `localStorage.access_token`。账户资料并行读取 `/auth/me` 的 `userid`、`username`，右上角显示中央 `username`，不再读取 `name`；审核记录按后端当前身份返回，不依赖已缓存姓名。原退出按钮改为返回统一入口，缺少凭据及 401/403 也提供返回入口。共享存储、首屏等待与错误边界见[共享凭据与后端鉴权](platform/authentication.md)。

图片图标使用带内容哈希的独立构建资源，Nginx 及预览采用长期 HTTP 缓存，Vite 源码服务保留校验与热更新；配置见[环境与部署](platform/deployment.md#缓存与失败边界)。预览原件的 Blob 缓存仅在页面内有效，见[文件展示器](features/file-preview.md)。

---

## 文档职责与维护

| 文档类型 | 主要职责 |
| --- | --- |
| 项目原则 | 记录长期稳定的定位、边界、整体要求和质量标准。 |
| 平台专题 | 解释登录、路由、请求接入、运行与部署等基础能力。 |
| 功能专题 | 解释已确认业务的用途、流程、交互、接口依赖和验证方式。 |
| 精确契约 | 优先由代码、Schema、配置和后端 API 定义执行，文档说明用途与边界。 |

同一规则或流程只保留一份完整主文档，其他位置通过相对链接引用。新增、移动或重命名文档时，同步更新本导航及相关链接；实现状态发生变化时，同步检查说明，避免将规划写成已完成能力。具体命名与排版遵循[文档撰写风格手册](documentation.md)。
