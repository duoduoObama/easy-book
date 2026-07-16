import Dexie, { type EntityTable } from 'dexie'
import type {
  AppSetting,
  Book,
  Bookmark,
  Chapter,
  ReadingProgress,
} from '../types'

class EasyBookDatabase extends Dexie {
  books!: EntityTable<Book, 'id'>
  chapters!: EntityTable<Chapter, 'id'>
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
  }
}

export const db = new EasyBookDatabase()
