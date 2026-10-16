# 本地开发与生产云端部署

参照 `contract-service-fe` 区分开发与生产的公开路径：开发使用 `/dev/registry/`，生产使用 `/registry/`。开发映射服务器会去掉 `/dev` 后转发至本机前端；浏览器中的资源和 API 地址必须保留 `/dev`，确保继续通过开发映射访问。

## 地址约定

| 环境 | 前端入口 | 浏览器 API | 实际后端目标 |
| --- | --- | --- | --- |
| 本机开发直连 | `http://127.0.0.1:23080/dev/registry/` | 同源 `/dev/registry/api/` | 默认 `http://127.0.0.1:23000` |
| 域名开发映射 | `https://pheno.szkl.com/dev/registry/` | 同源 `/dev/registry/api/` | 映射至本机 `23080`，再代理至后端 `23000` |
| 本机构建预览 | `http://127.0.0.1:4173/registry/` | 同源 `/registry/api/` | 默认 `http://127.0.0.1:23000` |
| 生产云端 | `https://pheno.szkl.com/registry/` | 同源 `/registry/api/` | 前端容器转发至 `backend:8000` |

登录和注册中心的具体页面地址见[页面路由](routing.md)，上述基础入口会根据会话进入对应页面。

生产前端宿主机默认端口同样为 `23080`，只绑定 `127.0.0.1`，由宿主机 HTTPS 网关对外服务。该表描述本仓库的配置约定，不能据此认为云端已完成部署。

## 本机开发

先按[后端运行说明](../../../registry-be/description/capability/application/runtime.md)准备独立人员配置并启动后端。后端文件入口默认监听 `127.0.0.1:23000`，容器映射端口由 `registry-deploy` 的 `BACKEND_PORT` 决定。

在前端根目录执行：

```bash
npm ci
test -f .env.local || cp .env.example .env.local
npm run dev
```

[`vite.config.js`](../../vite.config.js) 固定开发端口 `23080`，端口占用时启动失败，不自动换端口。默认仅监听本机；通过同机 Nginx 转发即可从域名访问，需要其他监听方式时显式使用 Vite 的 `--host` 参数。

开发与预览服务的 `allowedHosts` 均包含 `pheno.szkl.com`，不放开任意域名。本地 localhost 与回环 IP 仍可正常访问；新增域名需同步维护白名单。

开发的 Vite `base` 为 `/dev/registry/`，构建与预览的 `base` 为 `/registry/`。开发映射适配集中在 [`config/developmentMapping.js`](../../config/developmentMapping.js)，只负责将映射服务器送来的 `/registry/` 请求恢复为 Vite 的开发公开路径，HTTP 资源与 WebSocket 共用同一规则，不修改 Host 或查询参数。直接访问本机 `/dev/registry/` 时无需恢复，也可正常运行。

开发访问链路为：

```text
浏览器 /dev/registry/…
  → 现有映射服务器去掉 /dev
  → 本机 Vite :23080 收到 /registry/…
  → 恢复开发前缀后处理页面、资源或热更新
```

API 在上述恢复之后，由 Vite 代理去掉开发前缀，再将 `/registry/api/…` 转发至后端 `23000`。生产不启用该开发适配。依赖预打包缓存沿用参考项目的 `node_modules/vite-cache`，避免开发资源 URL 中出现隐藏目录。

`REGISTRY_BACKEND_URL` 是仅供 Vite 使用的后端根地址，默认 `http://127.0.0.1:23000`。若使用后端其他端口，在 `.env.local` 中覆盖；地址禁止包含人员凭据、接口路径或查询参数。开发 API 在 Vite 中去掉 `/dev`，以 `/registry/api/` 路径到达后端；预览与生产 API 原样保留 `/registry/api/`。

构建预览同样支持 API 代理：

```bash
npm run build
npm run preview
```

修改环境文件或 Vite 配置后重新启动相应服务；正在运行的预览进程不会因重新构建自动重新读取配置。开发和构建预览共用当前模式的 Vite 环境文件规则；`.env.local` 优先于 `.env`。

## 生产容器

[`Dockerfile`](../../Dockerfile) 使用 Node 24 构建，将静态资源复制到 Nginx 的 `/usr/share/nginx/html/registry`。运行镜像只包含静态页面与 Nginx，不包含前端源码、依赖、人员文件或本地 `.env`。

先按 [`registry-deploy` 部署说明](../../../registry-deploy/readme.md)启动后端及数据库。然后在本项目根目录执行：

后端镜像必须包含当前人员登录接口。本次发现本机旧 `registry-be:dev` 镜像不含该路由；需要先在 `registry-deploy` 中执行 `docker compose up -d --build --wait backend`，不能只重建前端。

```bash
test -f .env || cp .env.example .env
docker compose config --quiet
docker compose up -d --build --wait
docker compose ps
```

本仓库的 [`docker-compose.yaml`](../../docker-compose.yaml) 仅管理前端，通过外部网络连接 `registry-deploy`，不会创建或迁移后端、数据库和人员数据。后端应已运行并能在该网络中解析为 `backend`；前端启动时仅做 Nginx 健康检查，不证明后端可用。

| 配置项 | 默认值 | 使用位置 |
| --- | --- | --- |
| `REGISTRY_BACKEND_URL` | `http://127.0.0.1:23000` | Vite 开发与预览代理，不进入浏览器产物。 |
| `FRONTEND_PORT` | `23080` | Compose 的宿主机端口，映射到前端容器 `80`。 |
| `REGISTRY_NETWORK` | `registry_registry` | 后端统一部署创建的 Docker 网络。 |
| `BACKEND_UPSTREAM` | `backend:8000` | 前端容器内 Nginx 的后端 `主机:端口`，不含协议或路径。 |

配置示例为 [`.env.example`](../../.env.example)。更改 Compose 项目名、Docker 网络或后端服务名称时，同步调整前端网络与上游配置。容器内 `127.0.0.1` 指向容器自身，不能用本机开发地址代替 `backend:8000`。

平台状态按后端 `/registry/api/platform/sync-time` 返回的 `next_sync_at` 调度，已移除本地固定间隔配置和对应 Docker 构建参数，见[平台模型与查询接入](../features/platforms.md)。

Nginx 启动时通过模板注入 `BACKEND_UPSTREAM`；仅该变量由环境替换，保留 `$host`、`$uri` 等 Nginx 变量。更改上游后重新创建前端容器，无须重建前端静态资源。


后端容器重新创建并更换 IP 后，也应重新创建前端容器，以刷新 Nginx 的上游域名解析。

同一机器上 Vite 开发服务和前端容器默认都使用 `23080`，不能同时占用；临时测试容器时可设置其他 `FRONTEND_PORT`，并同步调整网关。

## pheno.szkl.com 网关

生产 TLS 由云服务器现有 Nginx 维护。在其 `http` 上下文加载 [`deploy/gateway-map.conf`](../../deploy/gateway-map.conf)，在 `server_name pheno.szkl.com` 的现有 HTTPS `server` 块内加入 [`deploy/gateway.conf`](../../deploy/gateway.conf)。不要替换现有整份站点配置，也不要改动其他应用的路由或证书。

该片段仅用于生产：网关将 `/registry/` 原样转发到前端容器的宿主机入口 `http://127.0.0.1:23080`，`proxy_pass` 后不能附加会删除前缀的尾斜杠。开发 `/dev/registry/` 使用现有映射服务器，不需要用本仓库的生产网关片段替换该映射。

应用配置后由部署人员执行：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

页面应从 `https://pheno.szkl.com/registry/` 访问，登录请求应命中 `https://pheno.szkl.com/registry/api/auth/login`，而不是返回其他站点的 HTML。

开发域名入口已在浏览器验证，可显示登录页并运行分子背景。生产页面与 API 应独立验证，开发映射可用不代表生产容器已经部署。本仓库没有修改现有映射服务器或云端站点配置。

## 代理与缓存边界

- API 路径和 Authorization 头原样传递；API 不使用前端页面回退或共享缓存。
- 前端保留网关传入的 HTTPS 协议信息，网关转发流量到本机 HTTP 端口。
- 项目图片图标（品牌、审核类型、信箱、空态等）统一输出为带内容哈希的独立构建资源，不再将小图片内嵌到脚本。生产 Nginx 使用 `Cache-Control: public, max-age=31536000, immutable`，浏览器可在有效期内复用下载；修改图片内容会生成新 URL，发布后自动使用新版本。内联 SVG 随脚本缓存，无需单独请求。
- `npm run preview` 为已存在的版本化图片使用相同长期缓存策略。开发模式仍沿用 Vite 的 ETag 校验与热更新，不启用长期强缓存；页面 HTML 保持重新验证。上层网关应保留这些响应头，不应为 API 开启图标缓存规则。
- 生产缺失构建资源返回 `404`，不返回 HTML；预览的缺失图片不设置长期缓存。
- 页面 HTML 要求重新验证；History 页面路径回退到 `/registry/index.html`，具体页面地址见[页面路由](routing.md)。
- `/healthz` 只验证前端 Nginx 存活，不验证人员认证、数据库或消息服务。
- Nginx 代理读取超时为 `60s`；当前前端 JSON 请求超时为 `15s`。后续文件或流式接口需另行确定超时策略。

## 验证

总体测试及构建基线见根目录 [README](../../README.md#构建预览与验证)。本地已验证六项项目图标的预览缓存头、ETag／304、HTML 及缺失图片不使用长期缓存，以及开发映射下的图标校验。生产缓存仍需在部署新构建后检查实际网关响应头；本地通过不代表云端已更新。

```bash
npm test
npm run build
docker build -t registry-fe:local .
python3 tests/dockerSmoke.py registry-fe:local registry-be:dev
```

容器验证使用指定的真实后端镜像，创建独立测试网络、临时人员文件与临时运行目录，检查 Nginx 配置、深层路由刷新、静态资源、API 错误与成功登录，结束后清理测试容器和网络。需先取得包含人员登录接口的后端镜像，不连接真实数据库、中间件或人员文件。

本地代理可使用真实后端的隔离实例验证：

```bash
# 使用 registry-be 已安装依赖的 Python 环境，在前端根目录运行。
python tests/backend_fixture.py
```

该实例默认占用 `23000`，必须确保没有真实后端占用该端口；测试密钥只存在于该临时人员配置。停止后清理 `registry-be/tests/tmp/` 下的本次数据。测试路由 `_integration` 仅装配到隔离实例，不增加到正式后端。

域名白名单可以通过请求头检查：

```bash
curl -I -H 'Host: pheno.szkl.com' http://127.0.0.1:23080/dev/registry/
```

`npm test` 还通过真实 Vite 实例验证去前缀后的页面与脚本、开发 API 转发、Bearer 鉴权、环境会话隔离和 WebSocket 握手。

上线后另需检查真实域名的 TLS、页面与 Worker 资源、登录、刷新会话和网关错误，不能只以容器构建或 `/healthz` 成功判定云端联调完成。
