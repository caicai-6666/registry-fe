# 运行与部署配置

本项目不区分认证模式：不配置开发账号或钉钉应用，所有运行方式均读取同源共享 token。开发访问仍保留 `/dev` 前缀；构建预览与容器部署不带该前缀。这是访问路径差异，不是登录模式。

## 地址约定

| 用途 | 地址 |
| --- | --- |
| 注册中心页面 | `/knowledge-accumulation/registry/` |
| 业务 API | `/knowledge-accumulation/registry/api/` |
| 返回统一入口 | `/knowledge-accumulation/` |
| 域名入口 | `https://talent.szkl.com/knowledge-accumulation/registry/` |
| 本机 Vite 入口 | `http://127.0.0.1:16080/dev/knowledge-accumulation/registry/` |
| 开发域名入口 | `https://talent.szkl.com/dev/knowledge-accumulation/registry/` |
| 开发浏览器 API | `/dev/knowledge-accumulation/registry/api/` |
| 开发返回统一入口 | `/dev/knowledge-accumulation/` |
| 构建预览入口 | `http://127.0.0.1:4173/knowledge-accumulation/registry/` |

页面、模块、图片、PDF.js 和热更新跟随各自的页面前缀。开发网关和 Vite 均保留 `/dev/knowledge-accumulation/registry/api/`，由后端直接启动入口提供相同前缀。构建预览、Nginx 和部署网关原样代理不带 `/dev` 的 API。Authorization 均原样传递。

统一入口需在同源 `localStorage.access_token` 保存原始 token。不同路径共享存储，不同协议、主机或端口不共享；联合访问应通过同一域名网关。详细约定见[共享凭据与鉴权](authentication.md)。

## Vite 服务与预览

先按[后端运行说明](../../../registry-be/description/capability/application/runtime.md)启动后端，再执行：

```bash
npm ci
test -f .env.local || cp .env.example .env.local
npm run dev
```

[`vite.config.js`](../../vite.config.js) 固定端口 `16080`，默认仅监听本机，端口占用时启动失败。Vite 服务与预览共用域名白名单 `talent.szkl.com` 和后端代理目标，不开放任意 Host。依赖缓存目录为项目根目录的 `cache/vite`：使用非隐藏路径便于网关转发，同时避免 npm 安装依赖时清理 `node_modules` 内的额外目录。该目录不参与 Git 跟踪或 Docker 构建上下文；迁移或依赖更新后应确保 Vite 已重启，浏览器重新加载页面取得新的依赖 URL。

构建和预览：

```bash
npm run build
npm run preview
```

代理目标读取通用 `.env`、`.env.local` 或进程中的 `REGISTRY_BACKEND_URL`，不读取模式专属的 `REGISTRY_` 配置文件。默认目标为 `http://127.0.0.1:16000`；地址必须是 HTTP(S) 根地址，不含凭据、路径或查询参数。修改后重启对应服务。构建产物只包含同源 API 路径，不包含后端根地址或登录配置。

构建预览请求生产 API 前缀，不能直接连接仅提供 `/dev` 前缀的 IDE 后端。联调预览时，应将 `REGISTRY_BACKEND_URL` 指向提供生产前缀的后端；例如统一部署后端已在默认端口运行时，执行 `REGISTRY_BACKEND_URL=http://127.0.0.1:23000 npm run preview`。静态页面预览成功不代表 API 已联通。

### 开发资源压缩与预热

[`config/developmentCompression.js`](../../config/developmentCompression.js) 使用仅在 Node 侧运行的开发依赖 `compression`，在 Vite 发送静态文本时协商 gzip 或 Brotli，让资源进入 FRP 前就减少体积。gzip 使用等级 6，Brotli 使用中间件默认等级 4，压缩阈值为 1 KiB。不支持压缩的客户端继续接收原始资源；此插件不修改生产构建和 preview 的压缩行为。

压缩只作用于开发页面前缀下成功的 GET 文本响应，包括 HTML、JS、CSS、JSON/source map 与 SVG；API、鉴权路径、`no-store`、`no-transform`、SSE、Range、HEAD 和二进制资源不压缩，HMR WebSocket 保持原路径。沿用 Vite 的 ETag、304 与分层缓存，响应使用 `Vary: Accept-Encoding` 区分编码。外层网关应保留相关响应头，不要重复压缩已经编码的响应；API 和鉴权原件的缓存边界不变。

Vite 的 `server.warmup.clientFiles` 提前准备业务入口、公共外框与默认数据中心页面的转换结果，减少服务器启动后的转换等待，不预请求业务数据。三个工作台仍提前加载代码，保持首次切换无需额外下载页面 JS/CSS 的设计；PDF 和媒体渲染器仍按需加载，详见[页面路由](routing.md#组件与进入过程)。压缩减少传输字节，但不会消除开发源码模块的请求往返。

比较优化效果时，应使用相同缓存与接口响应条件，分别记录脚本/样式请求数、实际传输字节和首屏可用时间。验证覆盖编码解压、ETag/304、HMR、首次页面切换、缓存恢复、深层路径、PDF 及鉴权失败；本机结果不能代替 FRP、公网网关及钉钉实机验收。

## 容器部署

[`Dockerfile`](../../Dockerfile) 使用 Node 24 构建，将产物复制到 `/usr/share/nginx/html/knowledge-accumulation/registry`。Nginx 为该目录提供静态资源及 History 路由回退，并将 API 原样转发给后端。

统一部署由同级 [`knowledge-accumulation-deploy`](../../../knowledge-accumulation-deploy/readme.md#注册中心前端) 的 `registry-frontend` 服务管理，构建上下文直接指向本项目。在统一部署目录中，后端已运行时可仅更新前端：

```bash
docker compose config --quiet
docker compose build registry-frontend
docker compose up -d --no-deps --wait registry-frontend
```

也可使用本项目 Compose 独立管理前端。先启动统一部署的后端及数据库，再在本项目根目录执行：

```bash
test -f .env || cp .env.example .env
docker compose config --quiet
docker compose up -d --build --wait
docker compose ps
```

两种方式选择其一，默认均占用宿主机 `23080`，不能同时启动。本项目 Compose 仅管理前端，不创建或迁移后端数据。前端加入已有网络，后端需可解析为 `backend`。统一部署保留 Compose 项目名 `registry`，所以默认网络仍为 `registry_registry`。下表为本项目配置；统一部署的前端端口由其 `REGISTRY_FRONTEND_PORT` 配置。

| 配置 | 默认值 | 用途 |
| --- | --- | --- |
| `REGISTRY_BACKEND_URL` | `http://127.0.0.1:16000` | Vite 与预览的代理目标 |
| `FRONTEND_PORT` | `23080` | 宿主机 HTTP 端口，绑定 127.0.0.1 |
| `REGISTRY_NETWORK` | `registry_registry` | 已有 Docker 网络 |
| `BACKEND_UPSTREAM` | `backend:8000` | Nginx 后端主机与端口，不含协议或路径 |

示例见 [`.env.example`](../../.env.example)。容器内 127.0.0.1 指向自身，不能代替后端服务名。Nginx 启动时仅替换 `BACKEND_UPSTREAM`，保留自身变量；更改上游或后端容器 IP 后重新创建前端容器，无需因此重建静态资源。Vite 开发使用 `16080`，容器默认仍使用 `23080`；二者使用不同环境的 API 前缀。

## 更新顺序与回退

发布前先确认后端已提供以下契约：用户列表包含必填 `employment_status`（`employed`／`resigned`），组织刷新结果包含 `skipped_users`，以及入库申请的 `POST /ingestion-review/{review_id}/recommendations` 接口。旧版后端缺少员工状态会使全员目录校验失败；应先完成兼容后端的发布，再更新前端。接口定义见[人员 API](../../../registry-be/description/api/user.md)和[入库审核 API](../../../registry-be/description/api/ingestion-review.md#重新推荐并保存通行证)。

1. 记录当前前端提交与正在运行的镜像 ID，给旧镜像保留独立回退标签；备份正在使用的宿主机网关配置。确认当前使用统一部署还是独立 Compose，避免重复启动。
2. 更新生产网关的注册中心配置片段；如维护开发映射，也同步开发片段。确认每一层 `proxy_read_timeout` 为 660 秒，先执行宿主机 `nginx -t`，通过后再 reload。只更新镜像不会自动更新宿主机网关。
3. 拉取目标版本，在所选部署目录执行配置校验、构建及前端更新。统一部署使用上文的 `registry-frontend` 命令；更新独立部署时使用 `docker compose build frontend` 和 `docker compose up -d --no-deps --wait frontend`。这一步只更新前端，不负责后端升级或数据库迁移。
4. 从统一入口进入同源页面，核对三页切换、在职／离职显示、审核人姓名、PDF／媒体资源及重新生成建议的等待、完成和失败提示。检查生产请求不带 `/dev`，并确认网关未提前返回 504。

需要回退时，在原部署方式中将前端服务重新指向保留的旧镜像标签，使用 `--no-build --no-deps` 重建该前端服务，并再次验收页面。按需恢复网关备份并先校验后 reload；不执行删除数据卷的操作。保留 660 秒代理期限兼容旧前端，回退前端不要求同步缩短超时。

## 域名网关与映射

在现有 HTTPS server 中使用 [`deploy/gateway.conf`](../../deploy/gateway.conf)，并将 [`deploy/gateway-map.conf`](../../deploy/gateway-map.conf) 放入 http 上下文。部署规则把 `/knowledge-accumulation/registry/` 原样转发到 `127.0.0.1:23080`，同时覆盖页面、API、资源与 WebSocket。开发映射使用 [`deploy/development-gateway.conf`](../../deploy/development-gateway.conf)，先转发至服务器 FRP 端口 `26080`，再映射到本机 Vite `16080`，全程保留完整 `/dev/knowledge-accumulation/registry/`。FRP 隧道由外部配置提供；若网关与 Vite 同机运行，应将开发片段的上游改为 `127.0.0.1:16080`。

注册中心子路径必须优先于对应的知识沉淀统一入口，防止请求落入其他页面的 HTML 回退。开发映射服务器和 Vite 的 API 代理均保留 `/dev`，后端直接启动入口提供同一开发前缀；部署网关使用不带 `/dev` 的路径。本仓库更新配置片段，不自动修改或重载远端网关。

## 缓存与失败边界

- 生产容器为 HTML、JS、CSS、JSON、XML 和 SVG 静态文本开启 gzip，阈值 1 KiB、等级 6，按 `Accept-Encoding` 协商并返回 `Vary: Accept-Encoding`。经网关转发的静态请求同样可压缩，网关透传编码响应；API 路径显式关闭此层 gzip，图片、PDF、音视频等二进制不重复压缩。不支持 gzip 的客户端仍收到原文；生产未配置 Brotli。更新后需重建并重新创建前端容器才生效。
- JSON 和原件 API 禁止共享缓存，普通浏览器请求期限为 15 秒；组织架构刷新同步执行，浏览器请求期限为 330 秒；通行证建议重新生成可能持续数分钟，该请求等待期限为 600 秒。容器 Nginx、生产及开发网关示例的读取超时统一为 660 秒，部署时需同步应用每一层代理配置；超时不代表后端已经取消或未保存，应刷新申请列表核实。头像按后端 Cache-Control 和 Vary 使用浏览器私有缓存。
- 生产 Nginx 的 `assets/` 版本化 JS、CSS、图片等使用一年 immutable 缓存；压缩不改变缓存期限。构建预览仅为版本化图片显式设置相同长期缓存；Vite 源码服务保留校验和热更新。
- HTML 保持重新验证，缺失资源返回 404，不回退成 HTML 或错误地使用长期缓存。
- History 深层页面回退到 `/knowledge-accumulation/registry/index.html`，API 不使用页面回退。
- `/healthz` 只检查前端 Nginx，不证明后端、数据库或消息服务可用。
- 首屏准备时分子背景和加载动画先显示；缺少凭据及 401/403 提供返回统一入口，网络或服务异常由业务区域显示错误及重试。

## Git 追踪范围

仓库通过 [`.gitignore`](../../.gitignore) 的允许列表保留以下内容：

- 部署所需的 `src/` 源码与 WebP 图标、`config/` 构建配置、`scripts/` 资源生成脚本、`deploy/` 网关配置，以及根目录的依赖清单、锁文件、HTML、Vite、Docker、Compose 和 Nginx 配置。
- 根目录 README、协作规范、`description/` Markdown 文档及预览截图，以及 Git／Docker 忽略规则和不含真实凭据的 `.env.example`。

本地环境文件、依赖、构建产物、测试、编辑器配置、原始上传素材与临时文件不参与提交。运行图标使用 WebP，原始 PNG 不作为部署输入；文档截图可保留 PNG、JPG 或 WebP。新增构建输入或文件类型时，必须同步检查允许列表，避免检出后缺少依赖。

Git 通过文件保留目录层级，不追踪空目录；当前所需目录均有实际文件，不添加空占位。`public/pdfjs/` 由构建前脚本自动创建，`dist/` 由 Vite 生成，均无需提交。忽略规则不会自动取消既有追踪，清理时使用 `git rm --cached` 保留本地文件。

## 验证

```bash
npm test
npm run build
```

部署验收应覆盖开发页面前缀、脚本、API 的 `/dev` 原样转发及 Bearer 原样转发、共享凭据、热更新和业务功能。构建预览另检查深层页面、API、静态资源与 PDF.js 路径。测试目录按项目约定不提交；当前可运行测试与已完成验证见根目录 [README](../../README.md#构建预览与验证)，上述验收项不代表 `npm test` 已全部覆盖。

部署后检查 TLS、深层页面刷新、Worker、同源凭据、接口响应类型及网关错误；不能只凭 HTTP 200 或健康检查判定业务可用。容器和远端映射需在实际部署后验收，本地验证不代表云端配置已生效。

2026-11-09 发布准备核验：17 项本地自动测试、生产构建及 Dockerfile 完整镜像构建通过。隔离容器验证三个工作台深层地址、静态资源及缓存、PDF.js、缺失资源 404、API JSON、生产／开发网关路径及 POST／Bearer 原样转发；三层 Nginx 配置均为 660 秒。上游使用测试服务，不代表真实后端或远端网关已升级。
