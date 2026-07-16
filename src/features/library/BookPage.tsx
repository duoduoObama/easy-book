import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  Clock3,
  FileText,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { db } from '../../data/db'
import type {
  Book,
  Bookmark as BookmarkRecord,
  Chapter,
  ChapterSummary,
  ReadingProgress,
} from '../../types'

const activeSummaryBackfills = new Set<string>()
const chapterRowHeight = 72

interface BookPageCache {
  data?: { book: Book | undefined; progress: ReadingProgress | undefined }
  directory?: { chapters: ChapterSummary[]; bookmarks: BookmarkRecord[] }
}

const bookPageCache = new Map<string, BookPageCache>()

async function backfillChapterSummaries(bookId: string, chapterCount: number) {
  if (activeSummaryBackfills.has(bookId)) return
  activeSummaryBackfills.add(bookId)
  try {
    const batchSize = 200
    for (let start = 0; start < chapterCount; start += batchSize) {
      const end = Math.min(chapterCount - 1, start + batchSize - 1)
      const chapters = await db.chapters
        .where('[bookId+index]')
        .between([bookId, start], [bookId, end], true, true)
        .toArray()
      await db.chapterSummaries.bulkPut(
        chapters.map(
          ({ id, bookId: idOfBook, index, title, characterCount }: Chapter) => ({
            id,
            bookId: idOfBook,
            index,
            title,
            characterCount,
          }),
        ),
      )
    }
  } finally {
    activeSummaryBackfills.delete(bookId)
  }
}

function formatCount(count: number) {
  return count >= 10_000 ? `${(count / 10_000).toFixed(1)} 万字` : `${count} 字`
}

export function BookPage() {
  const { bookId = '' } = useParams()
  const navigate = useNavigate()
  const chapterListRef = useRef<HTMLDivElement>(null)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 30 })
  const cached = bookPageCache.get(bookId)
  const data = useLiveQuery(async () => {
    const [book, progress] = await Promise.all([
      db.books.get(bookId),
      db.progress.get(bookId),
    ])
    return { book, progress }
  }, [bookId], cached?.data)
  const directory = useLiveQuery(async () => {
    const [chapters, bookmarks] = await Promise.all([
      db.chapterSummaries.where('bookId').equals(bookId).sortBy('index'),
      db.bookmarks.where('bookId').equals(bookId).toArray(),
    ])
    return { chapters, bookmarks }
  }, [bookId], cached?.directory)

  useEffect(() => {
    if (data) {
      bookPageCache.set(bookId, { ...bookPageCache.get(bookId), data })
    }
  }, [bookId, data])

  useEffect(() => {
    if (directory) {
      bookPageCache.set(bookId, { ...bookPageCache.get(bookId), directory })
    }
  }, [bookId, directory])

  useEffect(() => {
    const updateVisibleRange = () => {
      const list = chapterListRef.current
      const count = directory?.chapters.length ?? 0
      if (!list || !count) return
      const listTop = list.getBoundingClientRect().top + window.scrollY
      const viewportTop = Math.max(0, window.scrollY - listTop)
      const viewportBottom = Math.max(
        0,
        window.scrollY + window.innerHeight - listTop,
      )
      setVisibleRange({
        start: Math.max(0, Math.floor(viewportTop / chapterRowHeight) - 8),
        end: Math.min(
          count,
          Math.ceil(viewportBottom / chapterRowHeight) + 8,
        ),
      })
    }

    updateVisibleRange()
    window.addEventListener('scroll', updateVisibleRange, { passive: true })
    window.addEventListener('resize', updateVisibleRange)
    return () => {
      window.removeEventListener('scroll', updateVisibleRange)
      window.removeEventListener('resize', updateVisibleRange)
    }
  }, [directory?.chapters.length])

  useEffect(() => {
    if (
      data?.book &&
      directory &&
      directory.chapters.length < data.book.chapterCount
    ) {
      void backfillChapterSummaries(data.book.id, data.book.chapterCount)
    }
  }, [data?.book, directory])

  if (!data) return <div className="loading-screen">正在打开书籍…</div>
  if (!data.book) {
    return (
      <div className="error-screen">
        <h1>书籍不存在</h1>
        <button className="primary-button" onClick={() => navigate('/library')}>
          返回书架
        </button>
      </div>
    )
  }

  const { book, progress } = data
  const chapters = directory?.chapters ?? []
  const bookmarks = directory?.bookmarks ?? []
  const currentIndex = progress?.chapterIndex ?? 0
  const bookmarkedChapters = new Set(bookmarks.map((item) => item.chapterIndex))
  const visibleChapters = chapters.slice(visibleRange.start, visibleRange.end)

  return (
    <main className="detail-page">
      <header className="detail-header">
        <button className="icon-button" onClick={() => navigate(-1)} aria-label="返回">
          <ArrowLeft />
        </button>
        <span>书籍详情</span>
      </header>

      <section className="book-hero">
        <div
          className="generated-cover hero-cover"
          style={{ '--cover-seed': book.coverSeed % 360 } as React.CSSProperties}
        >
          <span>{book.title.slice(0, 8)}</span>
          <small>EASY BOOK</small>
        </div>
        <div className="hero-copy">
          <p className="eyebrow">离线藏书</p>
          <h1>{book.title}</h1>
          <p className="source-name">{book.sourceFileName}</p>
          <div className="stat-row">
            <span><FileText />{formatCount(book.characterCount)}</span>
            <span><BookOpen />{book.chapterCount} 章</span>
            <span><Clock3 />{progress ? '继续阅读' : '尚未阅读'}</span>
          </div>
          <button
            className="primary-button wide"
            onClick={() => navigate(`/reader/${book.id}/${currentIndex}`)}
          >
            <BookOpen />
            {progress ? '继续阅读' : '开始阅读'}
          </button>
        </div>
      </section>

      <section className="chapter-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">CONTENTS</p>
            <h2>目录</h2>
          </div>
          <span>{book.chapterCount} 章</span>
        </div>
        {chapters.length < book.chapterCount && (
          <p className="no-results">正在加载目录…</p>
        )}
        <div className="chapter-list" ref={chapterListRef}>
          <div
            className="chapter-list-spacer"
            style={{ height: visibleRange.start * chapterRowHeight }}
            aria-hidden="true"
          />
          {visibleChapters.map((chapter) => (
            <button
              key={chapter.id}
              className={chapter.index === currentIndex ? 'current' : ''}
              onClick={() => navigate(`/reader/${book.id}/${chapter.index}`)}
            >
              <span className="chapter-number">
                {String(chapter.index + 1).padStart(2, '0')}
              </span>
              <span className="chapter-title">
                {chapter.title}
                <small>{formatCount(chapter.characterCount)}</small>
              </span>
              {bookmarkedChapters.has(chapter.index) && (
                <Bookmark className="bookmark-indicator" aria-label="有书签" />
              )}
            </button>
          ))}
          <div
            className="chapter-list-spacer"
            style={{
              height:
                Math.max(0, chapters.length - visibleRange.end) *
                chapterRowHeight,
            }}
            aria-hidden="true"
          />
        </div>
      </section>
    </main>
  )
}
