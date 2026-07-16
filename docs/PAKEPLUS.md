# PakePlus Android 打包检查单

本项目采用 PakePlus 的“静态文件 / 本地 HTML”模式，不填写远程网址。

## 准备产物

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm test
pnpm build
```

将 `dist/` 内的全部文件作为静态资源导入 PakePlus，入口设为 `index.html`。不得只上传入口文件，字体、Worker 和 JS chunk 都位于 `dist/assets/`。

建议配置：

- 显示名称：易读
- 英文名称：Easy Book
- application ID：`com.easybook.reader`
- 版本：`0.1.0`
- 入口：`index.html`
- 模式：本地 HTML / 静态文件
- 调试：首个验证包开启，正式个人包关闭
- 网络权限：如模板允许移除则移除

PakePlus 各版本配置字段可能变化，以安装版本生成的 `scripts/ppconfig.json` 为准，不在应用仓库复制可能过期的模板配置。

## 真机验证

1. 首次安装，导入一份 UTF-8 TXT 和一份 GB18030 TXT。
2. 打开详情、跳转章节、添加书签、搜索正文、修改主题。
3. 从系统最近任务中划掉应用后重开，确认书籍和进度仍在。
4. 重启设备后再次确认。
5. 构建 `0.1.1`，保持 application ID 与签名不变并覆盖安装，确认数据仍在。
6. 检查系统返回键：先关抽屉，再回详情/书架，书架根页面再退出。
7. 检查刘海、手势导航区、软键盘搜索和系统深浅状态栏。
8. 断开网络，重复核心阅读流程。

结果记录到 `docs/DECISIONS.md`。任何 IndexedDB 数据丢失都属于阻断问题。
