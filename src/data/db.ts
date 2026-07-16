import Dexie, { type EntityTable } from 'dexie'
import type {
  AppSetting,
  Book,
  Bookmark,
  Chapter,
  ChapterSummary,
  ReadingProgress,
} from '../types'

class EasyBookDatabase extends Dexie {
  books!: EntityTable<Book, 'id'>
  chapters!: EntityTable<Chapter, 'id'>
  chapterSummaries!: EntityTable<ChapterSummary, 'id'>
  progress!: EntityTable<ReadingProgress, 'bookId'>
  bookmarks!: EntityTable<Bookmark, 'id'>
  settings!: EntityTable<AppSetting, 'key'>

  constructor() {
    super('easy-book')
    this.version(1).stores({
      books: 'id, &fingerprint, title, createdAt, lastReadAt',
      chapters: 'id, bookId, &[bookId+index]',
      progress: 'bookId, updatedAt',
      bookmarks: 'id, bookId, [bookId+chapterIndex], createdAt',
      settings: 'key',
    })
    this.version(2).stores({
      books: 'id, &fingerprint, title, createdAt, lastReadAt',
      chapters: 'id, bookId, &[bookId+index]',
      chapterSummaries: 'id, bookId, &[bookId+index]',
      progress: 'bookId, updatedAt',
      bookmarks: 'id, bookId, [bookId+chapterIndex], createdAt',
      settings: 'key',
    })
  }
}

export const db = new EasyBookDatabase()
