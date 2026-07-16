# 易读 / Easy Book

Easy Book 是一个面向 Android 的完全离线 TXT 小说阅读器。应用使用 React 构建静态页面，以 IndexedDB 保存小说和阅读数据，并通过 PakePlus 打包 APK。

## MVP

- 导入本地 TXT，并自动识别章节
- 书架、详情、目录和继续阅读
- 纵向滚动、阅读进度、书签
- 书内全文搜索
- 字号、行距、亮度遮罩和多种阅读主题
- 本地设置与存储占用管理

不包含 EPUB、TTS、账号、云同步、在线书城和商业化模块。

## 当前结构

- `stitch_/`：只读设计稿与视觉参考
- `docs/`：产品、架构、数据、设计和决策文档
- `src/`：应用源码（初始化后）

## 开发

```bash
pnpm install
pnpm dev
pnpm lint
pnpm test
pnpm build
```

构建产物位于 `dist/`。Android 包使用 PakePlus 的静态文件模式，以 `dist/index.html` 为入口；应用内部使用 Hash Router。

## 数据说明

小说正文、章节、进度、书签和设置只保存在设备的 IndexedDB 中，不上传网络。卸载应用或清除应用数据会永久删除书库；MVP 不提供备份恢复。

## PakePlus

本项目仅面向个人本地使用。打包前需先完成 `docs/ARCHITECTURE.md` 所列的 APK 验证，确认文件选择、Hash 路由、IndexedDB 跨重启持久化、更新保留数据、Android 返回键和安全区行为。

具体流程见 [`docs/PAKEPLUS.md`](docs/PAKEPLUS.md)。

不要提交 PakePlus Token、打包仓库凭据、APK、`dist/` 或导入的小说文件。
