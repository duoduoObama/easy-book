# Easy Book 工程约定

## 产品边界

- Easy Book 是个人使用、简体中文、完全离线的 Android TXT 阅读器。
- MVP 只包含：TXT 导入、书架、书籍详情与目录、纵向阅读、阅读主题、进度、书签、全文搜索、设置。
- 不实现 EPUB、TTS、账号、云同步、书城、短剧、赚钱、钱包或任何联网功能。
- `stitch_/` 是只读设计参考，不得修改、移动或作为生产源码引用。

## 技术栈

- pnpm、Vite、React、TypeScript（strict）。
- React Router HashRouter，确保 PakePlus 的本地 `index.html` 可路由。
- Dexie 管理 IndexedDB；Zustand 只管理短生命周期 UI 状态。
- TXT 解析与全文搜索必须在 Web Worker 中执行。
- 样式使用普通 CSS 与设计令牌；字体和图标必须随应用打包，禁止运行时 CDN。
- 静态产物由 PakePlus Android 打包为 APK，应用 ID 默认为 `com.easybook.reader`。

## 架构约束

- 页面不得直接访问 Dexie，统一通过 `src/data/repositories/`。
- 数据库实体和跨线程消息必须有显式 TypeScript 类型。
- 书籍删除必须在单个事务中级联清理章节、进度和书签。
- 解析任务必须可报告进度、失败原因并可取消；不得阻塞主线程。
- 阅读进度按章节与章内滚动比例保存，写入需节流。
- 用户小说正文、文件名和阅读数据不得离开设备，不得加入遥测。
- 新增依赖前先确认必要性、浏览器兼容性和离线可用性。

## 设计与体验

- 设计规范以 `docs/DESIGN_SYSTEM.md` 为准，`stitch_/lumina_novel/DESIGN.md` 和截图用于追溯。
- 移动端优先，交互目标至少 44×44 CSS px，支持 Android 安全区与返回键。
- 阅读器正文最大宽度 700px；正文允许选择，不能用全局 `user-select: none`。
- 所有图标按钮必须有可访问名称；动态状态使用文字或 ARIA 反馈。
- 动画尊重 `prefers-reduced-motion`。

## 质量门槛

- 提交功能前运行 `pnpm lint`、`pnpm test`、`pnpm build`。
- 解析、编码回退、进度换算、级联删除和搜索必须有单元测试。
- 数据库 schema 变更必须增加 Dexie 版本迁移，不能破坏现有书库。
- PakePlus 相关行为不能仅凭浏览器结果判断，需记录 APK 真机验证结果。

## 工作方式

- 优先完成核心阅读闭环，不扩展未确认的功能。
- 不提交生成的 `dist/`、APK、小说文件或本机 PakePlus 凭据。
- 影响产品边界、数据兼容或 PakePlus 壳的决策记录到 `docs/DECISIONS.md`。
