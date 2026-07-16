import { db } from './db'
import type {
  Book,
  Bookmark,
  ParsedBook,
  ReaderSettings,
  ReadingProgress,
} from '../types'

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  fontSize: 19,
  lineHeight: 1.8,
  brightness: 1,
  theme: 'charcoal',
  pageMode: 'simulation',
}

function coverSeed(fingerprint: string) {
  return Number.parseInt(fingerprint.slice(0, 8), 16)
}

export async function importParsedBook(
  parsed: ParsedBook,
  file: Pick<File, 'name' | 'size'>,
) {
  const duplicate = await db.books
    .where('fingerprint')
    .equals(parsed.fingerprint)
    .first()
  if (duplicate) throw new Error('这本书已经在书架中')

  const now = Date.now()
  const bookId = crypto.randomUUID()
  const book: Book = {
    id: bookId,
    fingerprint: parsed.fingerprint,
    title: parsed.title,
    sourceFileName: file.name,
    byteSize: file.size,
    characterCount: parsed.characterCount,
    chapterCount: parsed.chapters.length,
    coverSeed: coverSeed(parsed.fingerprint),
    createdAt: now,
    updatedAt: now,
  }
  await db.transaction(
    'rw',
    db.books,
    db.chapters,
    db.chapterSummaries,
    async () => {
      await db.books.add(book)
      const chapters = parsed.chapters.map((chapter, index) => ({
        ...chapter,
        id: `${bookId}:${index}`,
        bookId,
        index,
      }))
      await Promise.all([
        db.chapters.bulkAdd(chapters),
        db.chapterSummaries.bulkAdd(
          chapters.map(({ id, bookId: idOfBook, index, title, characterCount }) => ({
            id,
            bookId: idOfBook,
            index,
            title,
            characterCount,
          })),
        ),
      ])
    },
  )
  return book
}

export async function deleteBook(bookId: string) {
  await db.transaction(
    'rw',
    db.books,
    db.chapters,
    db.chapterSummaries,
    db.progress,
    db.bookmarks,
    async () => {
      await Promise.all([
        db.books.delete(bookId),
        db.chapters.where('bookId').equals(bookId).delete(),
        db.chapterSummaries.where('bookId').equals(bookId).delete(),
        db.progress.delete(bookId),
        db.bookmarks.where('bookId').equals(bookId).delete(),
      ])
    },
  )
}

export async function saveProgress(
  progress: Omit<ReadingProgress, 'updatedAt'>,
) {
  const safeProgress: ReadingProgress = {
    ...progress,
    scrollRatio: Math.max(0, Math.min(1, progress.scrollRatio)),
    updatedAt: Date.now(),
  }
  await db.transaction('rw', db.progress, db.books, async () => {
    await db.progress.put(safeProgress)
    await db.books.update(progress.bookId, {
      lastReadAt: safeProgress.updatedAt,
      updatedAt: safeProgress.updatedAt,
    })
  })
}

export async function toggleBookmark(
  bookId: string,
  chapterIndex: number,
  scrollRatio: number,
  excerpt: string,
) {
  const chapterBookmarks = await db.bookmarks
    .where('[bookId+chapterIndex]')
    .equals([bookId, chapterIndex])
    .toArray()
  const existing = chapterBookmarks.find(
    (bookmark) => Math.abs(bookmark.scrollRatio - scrollRatio) < 0.025,
  )
  if (existing) {
    await db.bookmarks.delete(existing.id)
    return false
  }
  const bookmark: Bookmark = {
    id: crypto.randomUUID(),
    bookId,
    chapterIndex,
    scrollRatio,
    excerpt: excerpt.replace(/\s+/g, ' ').slice(0, 120),
    createdAt: Date.now(),
  }
  await db.bookmarks.add(bookmark)
  return true
}

export async function getReaderSettings(): Promise<ReaderSettings> {
  const rows = await db.settings
    .where('key')
    .startsWith('reader.')
    .toArray()
  const values = Object.fromEntries(
    rows.map((row) => [row.key.replace('reader.', ''), row.value]),
  )
  return { ...DEFAULT_READER_SETTINGS, ...values }
}

export async function saveReaderSettings(settings: ReaderSettings) {
  await db.settings.bulkPut(
    Object.entries(settings).map(([key, value]) => ({
      key: `reader.${key}`,
      value,
    })),
  )
}

export async function clearAllData() {
  await db.transaction(
    'rw',
    [
      db.books,
      db.chapters,
      db.chapterSummaries,
      db.progress,
      db.bookmarks,
      db.settings,
    ],
    async () => {
      await Promise.all([
        db.books.clear(),
        db.chapters.clear(),
        db.chapterSummaries.clear(),
        db.progress.clear(),
        db.bookmarks.clear(),
        db.settings.clear(),
      ])
    },
  )
}
