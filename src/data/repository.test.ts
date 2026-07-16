import { afterEach, describe, expect, it } from 'vitest'
import { db } from './db'
import {
  deleteBook,
  getReaderSettings,
  importParsedBook,
  saveProgress,
  toggleBookmark,
} from './repository'

afterEach(async () => {
  await db.delete()
  await db.open()
})

describe('book repository', () => {
  it('默认使用仿真整页翻页', async () => {
    expect((await getReaderSettings()).pageMode).toBe('simulation')
  })

  it('原子导入并阻止重复内容', async () => {
    const parsed = {
      fingerprint: 'a'.repeat(64),
      title: '测试书',
      encoding: 'UTF-8',
      characterCount: 4,
      chapters: [{ title: '第一章', content: '正文内容', characterCount: 4 }],
    }
    const book = await importParsedBook(parsed, { name: '测试书.txt', size: 12 })
    expect(await db.books.count()).toBe(1)
    expect(await db.chapters.where('bookId').equals(book.id).count()).toBe(1)
    expect(
      await db.chapterSummaries.where('bookId').equals(book.id).count(),
    ).toBe(1)
    await expect(
      importParsedBook(parsed, { name: '副本.txt', size: 12 }),
    ).rejects.toThrow('已经在书架')
  })

  it('删除书籍时级联清除阅读数据', async () => {
    const book = await importParsedBook(
      {
        fingerprint: 'b'.repeat(64),
        title: '待删除',
        encoding: 'UTF-8',
        characterCount: 2,
        chapters: [{ title: '正文', content: '内容', characterCount: 2 }],
      },
      { name: '待删除.txt', size: 6 },
    )
    await saveProgress({ bookId: book.id, chapterIndex: 0, scrollRatio: 3 })
    await toggleBookmark(book.id, 0, 0.5, '内容')
    expect((await db.progress.get(book.id))?.scrollRatio).toBe(1)

    await deleteBook(book.id)
    expect(await db.books.count()).toBe(0)
    expect(await db.chapters.count()).toBe(0)
    expect(await db.chapterSummaries.count()).toBe(0)
    expect(await db.progress.count()).toBe(0)
    expect(await db.bookmarks.count()).toBe(0)
  })
})
