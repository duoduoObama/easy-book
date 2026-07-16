export type ReaderTheme =
  | 'charcoal'
  | 'paper'
  | 'sage'
  | 'mist'
  | 'black'
  | 'graphite'

export type PageMode = 'simulation' | 'scroll'

export interface Book {
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

export interface Chapter {
  id: string
  bookId: string
  index: number
  title: string
  content: string
  characterCount: number
}

export interface ReadingProgress {
  bookId: string
  chapterIndex: number
  scrollRatio: number
  updatedAt: number
}

export interface Bookmark {
  id: string
  bookId: string
  chapterIndex: number
  scrollRatio: number
  excerpt: string
  createdAt: number
}

export interface AppSetting {
  key: string
  value: unknown
}

export interface ReaderSettings {
  fontSize: number
  lineHeight: number
  brightness: number
  theme: ReaderTheme
  pageMode: PageMode
}

export interface ParsedChapter {
  title: string
  content: string
  characterCount: number
}

export interface ParsedBook {
  fingerprint: string
  title: string
  encoding: string
  characterCount: number
  chapters: ParsedChapter[]
}

export interface SearchResult {
  chapterIndex: number
  chapterTitle: string
  offset: number
  excerpt: string
}
