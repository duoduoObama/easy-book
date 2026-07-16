# 本地数据模型

数据库名为 `easy-book`。所有时间使用 Unix 毫秒，ID 使用 `crypto.randomUUID()`。

## books

```ts
interface Book {
  id: string
  fingerprint: string
  title: string
  sourceFileName: string
  byteSize: number
  characterCount: number
  chapterCount: number
  coverSeed: number
  createdAt: number
  updatedAt: number
  lastReadAt?: number
}
```

主键 `id`；唯一逻辑索引 `fingerprint`；索引 `title`、`createdAt`、`lastReadAt`。指纹由文件字节摘要生成，用于阻止重复导入。

## chapters

```ts
interface Chapter {
  id: string
  bookId: string
  index: number
  title: string
  content: string
  characterCount: number
}
```

主键 `id`；复合唯一逻辑键 `[bookId+index]`；索引 `bookId`。正文保留规范化换行，渲染时再拆段。

## readingProgress

```ts
interface ReadingProgress {
  bookId: string
  chapterIndex: number
  scrollRatio: number
  updatedAt: number
}
```

主键 `bookId`。`scrollRatio` 限制在 `0..1`；章节切换时先同步保存旧章，再写新章的初始位置。

## bookmarks

```ts
interface Bookmark {
  id: string
  bookId: string
  chapterIndex: number
  scrollRatio: number
  excerpt: string
  createdAt: number
}
```

主键 `id`；索引 `bookId`、`[bookId+chapterIndex]`。同一章、相近位置重复添加时复用原书签。

## settings

```ts
interface AppSetting {
  key: string
  value: unknown
}
```

主键 `key`。已知键：

- `reader.fontSize`：16–28，默认 19
- `reader.lineHeight`：1.5–2.2，默认 1.8
- `reader.brightness`：0.35–1，默认 1
- `reader.theme`：`charcoal | paper | sage | mist | black | graphite`
- `reader.pageMode`：`simulation | scroll`，默认 `simulation`
- `library.sort`：`lastRead | imported`

## 事务

- 导入：`books + chapters` 单事务；章节写入失败则回滚书籍。
- 删除书籍：`books + chapters + readingProgress + bookmarks` 单事务级联删除。
- 清空数据：清空全部表后重载默认设置。
- schema 每次不兼容变化必须递增 Dexie 版本并提供迁移。

## 一致性规则

- `chapterCount` 必须等于该书章节数量。
- `readingProgress.chapterIndex` 必须落在有效章节范围内。
- 书签摘要最多 120 字，不复制大段正文。
- repository 返回书架列表时不得附带章节正文。
- 孤立章节、进度或书签视为数据损坏；启动维护任务可清理，但不得导致应用无法打开。
