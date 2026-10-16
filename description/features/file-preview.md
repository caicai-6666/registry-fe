# 文件展示器与预览弹窗

预览弹窗参照 `contract-service-fe` 的 `PdfPreviewOverlay.vue` 和 `ContractPdfReader.vue`：深色模糊背景、圆角阅读区、外侧悬浮关闭按钮，进入／退出时淡入淡出及轻微位移缩放。减少动画偏好下直接切换。弹窗使用原生 `dialog` 保持模态焦点、Escape 和关闭后的焦点恢复，点击阅读区外侧也可关闭。离开对应工作台会关闭预览。

## 组件分工

| 层级 | 实现 | 职责 |
| --- | --- | --- |
| 列表接入 | `RegistryFilePreview.vue` | 接收选中文件，关闭动画期间保留内容，退出完成后释放渲染器 |
| 通用弹窗 | `file-preview/FilePreviewDialog.vue` | 外框、背景、开关动画、焦点及关闭交互；内容使用插槽 |
| 类型分发 | `file-preview/FileRenderer.vue` | 按类型加载组件，统一加载、错误、重试与不支持提示，忽略已切换文件的晚到结果 |
| 渲染器登记 | `file-preview/renderers.js` | 按展示类型登记异步加载器，当前登记 PDF、音频和视频 |
| 媒体渲染器 | `file-preview/renderers/MediaRenderer.vue` | 浏览器原生音频／视频控件、元数据就绪淡入及播放错误 |
| PDF 渲染器 | `file-preview/renderers/PdfRenderer.vue` | PDF.js 页面渲染、翻页、缩放、适应宽度与下载，管理 Worker 和文档生命周期 |

## 前端展示描述与类型判断

前端描述使用 `id`（可选）、`name`、`url`、可选的 `mimeType`、`summary`（字符串或 null）及 `passport`（数组或 null）；这是前端展示约定，真实目录字段与鉴权原件由数据接入层映射，见[目录与原件接入](catalog.md)。

[`filePreview.js`](../../src/models/filePreview.js) 优先读取标准 MIME 类型（忽略大小写和参数）：`application/pdf` 归为 `pdf`，`audio/*` 归为 `audio`，`video/*` 归为 `video`。缺少 MIME 或为 `application/octet-stream` 时，才回退到文件名扩展名。明确但未支持的 MIME 不被 `.pdf` 等文件名覆盖。

PDF、音频和视频可内嵌预览，音频／视频使用原生控件且不自动播放，编码支持由浏览器决定。未知类型提示暂不支持内嵌预览并提供新窗口打开链接，不加载 PDF 渲染器。渲染器统一接收本地 blob URL `src`、已下载的 `blob` 和 `label`，通过 `ready` 表示首屏可显示，通过 `displayed` 表示内容淡入完成，通过 `error` 返回可读错误。

文件地址允许 HTTP(S)、blob 与相对路径，拒绝脚本、data 和 file 协议。原件通过注册中心受保护的正式文件或待入库文件接口读取，只有这些接口携带人员凭据；外部地址不附加免登码。

## 文件摘要悬浮层

[`FileSummaryPopover.vue`](../../src/components/file-preview/FileSummaryPopover.vue) 基于共享 [`FileInfoPopover.vue`](../../src/components/file-preview/FileInfoPopover.vue)，参照 `contract-service-fe` 的 `ContractSummaryPopover.vue`，在阅读区左上角、工具栏下方提供圆形问号按钮。悬停或键盘聚焦按钮展开淡蓝色摘要浮层；移入浮层继续保持，移出 140ms 后收起，浮层淡入淡出。长摘要可滚动，保留换行；触屏可点击按钮展开。摘要组件独立于文件渲染器，因此 PDF、音频和视频共用同一摘要交互。

摘要浮层获得键盘事件时，Escape 先收起浮层而不关闭文件弹窗；关闭弹窗或切换文件会重置浮层。未提供摘要或摘要为空时显示“暂无摘要”。文本使用 Vue 插值展示，不作为 HTML 执行。

摘要来自目录或待入库申请的 `abstract` 字段，映射为 `summary`，不额外请求或自动生成摘要。浏览器验证悬停展开、移入保持、移出关闭、键盘 Escape 和空摘要提示。

[查看文件摘要悬浮效果](../assets/screenshots/file-summary-hover.jpg)。

摘要和通行证入口在文件内容加载及淡入完成前不挂载，渲染器的 `displayed` 事件触发后再整体用 320ms 淡入，并轻微上移。PDF 等首屏 700ms 淡入结束后再显示入口；媒体等自身内容淡入结束后显示。减少动画偏好下在内容就绪后直接显示。重新加载、切换文件或渲染失败会隐藏入口；缓存命中后再次打开仍遵循内容先显示、入口随后出现的顺序。浏览器验证了加载期间无入口、内容显示后入口出现，以及再次打开正常。[文件显示后的悬浮入口](../assets/screenshots/file-tools-after-content.jpg)。

## 通行证悬浮层

数据中心表项不再展示通行证，原有前缀筛选继续使用完整数组。打开文件后，摘要按钮右侧提供“查看文件通行证”入口，与摘要复用同一个悬浮层组件：悬停、键盘聚焦或点击展开，移入浮层保持，离开后延迟收起，Escape 仅收起当前浮层。内容逐项展示并保留重复值、原值和顺序，长值换行，超长内容可滚动，null 显示“—”，空数组显示“无通行证”。关闭或切换文件重置浮层。

通行证直接来自当前文件描述的 `passport`，不新增请求。正式目录及删除申请原件预览可展示；没有该字段的待入库申请不显示入口。临时多通行证示例已移除，浮层使用后端返回的真实数组。浏览器验证列表不再显示通行证、测试示例的浮层包含全部 10 项、长值换行、Escape 不关闭文件弹窗，以及摘要入口正常。[通行证悬浮效果](../assets/screenshots/file-passport-popover.jpg)。

## 页面内临时文件缓存

原件 Blob 缓存与图标 HTTP 缓存独立。图标的版本化资源及长期缓存策略见[环境与部署](../platform/deployment.md#代理与缓存边界)，不适用于受鉴权的原件接口。

[`fileResourceCache.js`](../../src/services/fileResourceCache.js) 按文件资源 URL 合并正在进行的请求，并缓存成功完整下载的 Blob。`RegistryFilePreview.vue` 创建并提供独立缓存，关闭弹窗只销毁阅读器，保留已下载文件；再次打开相同 URL 时不重新请求文件资源。页面刷新、退出／登录失效导致展示器卸载时清空缓存并取消下载，不写入浏览器持久存储。导航切换保持展示器挂载，因此缓存保留。

PDF 每次打开都从缓存 Blob 创建独立字节数组交给 Worker，避免 Worker 转移 ArrayBuffer 后破坏缓存。解析或页面渲染失败会使对应缓存失效，下载失败也不会被缓存；清理后的晚到响应不能恢复旧缓存。`invalidate(url)` 可用于主动失效，`clear()` 清空实例；后续同 URL 文件更新需在资源接入层失效，或使用接口给出的版本化 URL。

缓存仅复用文件内容，仍会重新建立阅读器并按现有规则淡入。字体及 Worker 等静态运行资源使用浏览器正常加载机制，预览、新窗口及下载使用本地 blob URL，关闭时撤销该 URL，不直接访问需要 Bearer 的原件地址。

## PDF 阅读器

PDF.js 依赖版本沿用参考项目的 `6.3.289`，阅读器及 Worker 按需加载。工具栏包含上一页／下一页、页码输入、缩小／放大（25%–400%）、适应宽度和下载；初始适应宽度，容器尺寸变化时重新适配。支持 Ctrl + 滚轮、触控板及触屏双指缩放，普通滚动浏览页面。

加载时显示等待状态，解析或页面渲染失败时提示并提供重新加载；加密 PDF 当前提示不支持预览。关闭、切换文件和卸载时销毁文档、阅读器、Worker、观察器、手势监听与缩放帧，避免旧结果覆盖新文件。

首屏页面渲染成功后，等待状态在 240ms 内淡出，PDF 内容稍后开始 700ms 淡入；工具栏保持稳定。每次加载仅播放一次，翻页或缩放重绘不会重复淡入。重新加载会重置状态，减少动画偏好下直接显示内容。

`npm run dev` 和 `npm run build` 会先执行 `scripts/sync-pdfjs-assets.mjs`，把锁定依赖的字符映射、字体及 WASM 同步至 `public/pdfjs/`；这些生成资源不入 Git。构建产物包含资源，使用当前页面基础路径读取；Docker 构建已复制同步脚本。若直接调用 Vite API，需要先执行 `npm run sync:pdfjs-assets`。

## 验证

`npm test` 覆盖 MIME 优先级、扩展名回退、不支持类型及地址边界，以及缓存复用、请求合并、Worker 转移字节、失败重试、失效和清理后的晚到响应；浏览器检查本地 PDF 渲染、缩放、适应宽度、关闭和重复打开，并用临时验证页检查未支持音频与损坏 PDF。构建检查阅读器拆包、Worker 和运行时资源，并在生产 `/registry/` 路径下验证 PDF 渲染及窄屏工具栏。

[查看 PDF 阅读器弹窗](../assets/screenshots/file-renderer-pdf-desktop.jpg) · [查看窄屏 PDF 阅读器](../assets/screenshots/file-renderer-pdf-mobile.jpg)。

缓存浏览器验证：连续打开两次，服务端文件请求计数保持为 1；重建展示器后再打开，计数变为 2。
