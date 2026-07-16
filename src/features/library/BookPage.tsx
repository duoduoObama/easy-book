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

function formatCount(count: number) {
  return count >= 10_000 ? `${(count / 10_000).toFixed(1)} 万字` : `${count} 字`
}

export function BookPage() {
  const { bookId = '' } = useParams()
  const navigate = useNavigate()
  const data = useLiveQuery(async () => {
    const [book, chapters, progress, bookmarks] = await Promise.all([
      db.books.get(bookId),
      db.chapters.where('bookId').equals(bookId).sortBy('index'),
      db.progress.get(bookId),
      db.bookmarks.where('bookId').equals(bookId).toArray(),
    ])
    return { book, chapters, progress, bookmarks }
  }, [bookId])

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

  const { book, chapters, progress, bookmarks } = data
  const currentIndex = progress?.chapterIndex ?? 0
  const bookmarkedChapters = new Set(bookmarks.map((item) => item.chapterIndex))

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
          <span>{chapters.length} 章</span>
        </div>
        <div className="chapter-list">
          {chapters.map((chapter) => (
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
        </div>
      </section>
    </main>
  )
}
