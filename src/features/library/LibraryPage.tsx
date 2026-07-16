import { useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  BookPlus,
  ChevronRight,
  LibraryBig,
  Search,
  Trash2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { db } from '../../data/db'
import { deleteBook, importParsedBook } from '../../data/repository'
import { parseFile } from '../../workers/client'
import type { Book, ReadingProgress } from '../../types'

const MAX_FILE_SIZE = 50 * 1024 * 1024

function progressLabel(book: Book, progress?: ReadingProgress) {
  if (!progress) return `${book.chapterCount} 章 · 尚未阅读`
  const percent = Math.round(
    ((progress.chapterIndex + progress.scrollRatio) / book.chapterCount) * 100,
  )
  return `已读 ${Math.min(percent, 100)}% · 第 ${progress.chapterIndex + 1} 章`
}

export function LibraryPage() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const data = useLiveQuery(async () => {
    const books = await db.books.toArray()
    const progress = await db.progress.toArray()
    return { books, progress }
  })
  const progressMap = useMemo(
    () =>
      new Map((data?.progress ?? []).map((progress) => [progress.bookId, progress])),
    [data?.progress],
  )
  const books = useMemo(
    () =>
      (data?.books ?? [])
        .filter((book) =>
          book.title.toLocaleLowerCase('zh-CN').includes(query.trim().toLocaleLowerCase('zh-CN')),
        )
        .sort(
          (a, b) =>
            (b.lastReadAt ?? b.createdAt) - (a.lastReadAt ?? a.createdAt),
        ),
    [data?.books, query],
  )

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    setBusy(true)
    setMessage('正在读取小说…')
    let imported = 0
    for (const file of Array.from(files)) {
      try {
        if (!file.name.toLowerCase().endsWith('.txt')) {
          throw new Error(`${file.name} 不是 TXT 文件`)
        }
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`${file.name} 超过 50 MiB`)
        }
        const parsed = await parseFile(file, () => setMessage(`正在解析 ${file.name}…`))
        await importParsedBook(parsed, file)
        imported += 1
      } catch (error) {
        setMessage(error instanceof Error ? error.message : '导入失败')
      }
    }
    if (imported) setMessage(`已导入 ${imported} 本小说`)
    setBusy(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleDelete(event: React.MouseEvent, book: Book) {
    event.stopPropagation()
    if (!window.confirm(`确定删除《${book.title}》及其全部阅读数据吗？`)) return
    await deleteBook(book.id)
    setMessage(`已删除《${book.title}》`)
  }

  return (
    <main className="page library-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">你的离线藏书</p>
          <h1>书架</h1>
        </div>
        <button
          className="icon-button accent"
          onClick={() => inputRef.current?.click()}
          aria-label="导入 TXT"
          disabled={busy}
        >
          <BookPlus />
        </button>
        <input
          ref={inputRef}
          className="visually-hidden"
          type="file"
          accept=".txt,text/plain"
          multiple
          onChange={(event) => void handleFiles(event.target.files)}
        />
      </header>

      <label className="search-field">
        <Search aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索书名"
          aria-label="搜索书名"
        />
      </label>

      {message && <div className="notice" role="status">{message}</div>}

      {data && data.books.length === 0 ? (
        <section className="empty-state">
          <div className="empty-symbol"><LibraryBig /></div>
          <p className="eyebrow">让故事留在设备里</p>
          <h2>导入第一本小说</h2>
          <p>支持 UTF-8、GB18030 等常见编码的 TXT 文件，自动整理章节。</p>
          <button
            className="primary-button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            <BookPlus />
            {busy ? '正在导入…' : '选择 TXT 文件'}
          </button>
        </section>
      ) : (
        <section className="book-grid" aria-label="书籍列表">
          {books.map((book) => {
            const progress = progressMap.get(book.id)
            const percent = progress
              ? Math.min(
                  100,
                  ((progress.chapterIndex + progress.scrollRatio) /
                    book.chapterCount) *
                    100,
                )
              : 0
            return (
              <article
                className="book-card"
                key={book.id}
                tabIndex={0}
                role="button"
                onClick={() => navigate(`/books/${book.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') navigate(`/books/${book.id}`)
                }}
              >
                <div
                  className="generated-cover"
                  style={{ '--cover-seed': book.coverSeed % 360 } as React.CSSProperties}
                >
                  <span>{book.title.slice(0, 8)}</span>
                  <small>EASY BOOK</small>
                  <div className="cover-progress">
                    <i style={{ width: `${percent}%` }} />
                  </div>
                </div>
                <div className="book-meta">
                  <div>
                    <h2>{book.title}</h2>
                    <p>{progressLabel(book, progress)}</p>
                  </div>
                  <div className="book-actions">
                    <button
                      className="icon-button subtle"
                      onClick={(event) => void handleDelete(event, book)}
                      aria-label={`删除《${book.title}》`}
                    >
                      <Trash2 />
                    </button>
                    <ChevronRight aria-hidden="true" />
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      )}
      {data && data.books.length > 0 && books.length === 0 && (
        <p className="no-results">没有找到匹配的书籍</p>
      )}
    </main>
  )
}
