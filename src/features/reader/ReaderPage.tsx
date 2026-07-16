import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ArrowLeft,
  Bookmark,
  BookOpenText,
  Check,
  ChevronLeft,
  ChevronRight,
  List,
  Minus,
  Plus,
  Rows3,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { db } from '../../data/db'
import {
  DEFAULT_READER_SETTINGS,
  getReaderSettings,
  saveProgress,
  saveReaderSettings,
  toggleBookmark,
} from '../../data/repository'
import type { Chapter, ReaderSettings, SearchResult } from '../../types'
import { searchBook } from '../../workers/client'

type Panel = 'toc' | 'search' | 'settings' | null

const themes: Array<{ id: ReaderSettings['theme']; label: string }> = [
  { id: 'charcoal', label: '炭黑' },
  { id: 'paper', label: '纸张' },
  { id: 'sage', label: '青绿' },
  { id: 'mist', label: '雾蓝' },
  { id: 'black', label: '纯黑' },
  { id: 'graphite', label: '石墨' },
]

export function ReaderPage() {
  const { bookId = '', chapterIndex = '0' } = useParams()
  const index = Math.max(0, Number.parseInt(chapterIndex, 10) || 0)
  const navigate = useNavigate()
  const location = useLocation()
  const scrollRef = useRef<HTMLElement>(null)
  const ratioRef = useRef(0)
  const saveTimer = useRef<number | undefined>(undefined)
  const turnTimer = useRef<number | undefined>(undefined)
  const restoredChapter = useRef('')
  const skipCleanupSave = useRef(false)
  const pointerStart = useRef<{ x: number; y: number } | null>(null)
  const didSwipe = useRef(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [panel, setPanel] = useState<Panel>(null)
  const [settings, setSettings] = useState(DEFAULT_READER_SETTINGS)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageCount, setPageCount] = useState(1)
  const [paginationVersion, setPaginationVersion] = useState(0)
  const [turnDirection, setTurnDirection] = useState<'next' | 'previous' | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [chapterList, setChapterList] = useState<
    Pick<Chapter, 'id' | 'index' | 'title'>[]
  >([])
  const [loadingChapterList, setLoadingChapterList] = useState(false)
  const [toast, setToast] = useState('')
  const data = useLiveQuery(async () => {
    const [book, chapter, progress, bookmarks] = await Promise.all([
      db.books.get(bookId),
      db.chapters.where('[bookId+index]').equals([bookId, index]).first(),
      db.progress.get(bookId),
      db.bookmarks.where('bookId').equals(bookId).toArray(),
    ])
    return { book, chapter, progress, bookmarks }
  }, [bookId, index])

  useEffect(() => {
    void getReaderSettings().then(setSettings)
  }, [])

  useEffect(() => {
    if (!data?.chapter || data.chapter.index !== index || !scrollRef.current) return
    const restoreKey = `${bookId}:${index}:${settings.pageMode}:${settings.fontSize}:${settings.lineHeight}:${paginationVersion}`
    if (restoredChapter.current === restoreKey) return
    const sameChapter = restoredChapter.current.startsWith(`${bookId}:${index}:`)
    restoredChapter.current = restoreKey
    const routeState = location.state as {
      searchOffset?: number
      targetRatio?: number
    } | null
    const targetRatio = routeState?.targetRatio ??
      (sameChapter
        ? ratioRef.current
        : data.progress?.chapterIndex === index
          ? data.progress.scrollRatio
          : 0)
    ratioRef.current = targetRatio
    requestAnimationFrame(() => {
      const element = scrollRef.current
      if (!element) return
      if (settings.pageMode === 'simulation') {
        const count = Math.max(1, Math.ceil(element.scrollWidth / element.clientWidth))
        const page = Math.min(count - 1, Math.round(targetRatio * (count - 1)))
        setPageCount(count)
        setCurrentPage(page)
        element.scrollLeft = page * element.clientWidth
      } else {
        const max = Math.max(0, element.scrollHeight - element.clientHeight)
        element.scrollTop = max * targetRatio
      }
      const offset = routeState?.searchOffset
      if (offset !== undefined) {
        const paragraph = element.querySelector<HTMLElement>(
          `[data-offset-start][data-offset-end]`,
        )
        const candidates = element.querySelectorAll<HTMLElement>(
          '[data-offset-start][data-offset-end]',
        )
        const target = [...candidates].find(
          (node) =>
            Number(node.dataset.offsetStart) <= offset &&
            Number(node.dataset.offsetEnd) >= offset,
        )
        const resultTarget = target ?? paragraph
        if (settings.pageMode === 'simulation' && resultTarget) {
          const count = Math.max(1, Math.ceil(element.scrollWidth / element.clientWidth))
          const page = Math.min(
            count - 1,
            Math.max(0, Math.floor(resultTarget.offsetLeft / element.clientWidth)),
          )
          setCurrentPage(page)
          ratioRef.current = count === 1 ? 0 : page / (count - 1)
          element.scrollLeft = page * element.clientWidth
        } else {
          resultTarget?.scrollIntoView({ block: 'center' })
        }
      }
    })
  }, [
    bookId,
    data?.chapter,
    data?.progress,
    index,
    location.state,
    settings.fontSize,
    settings.lineHeight,
    settings.pageMode,
    paginationVersion,
  ])

  useEffect(() => {
    if (
      settings.pageMode !== 'simulation' ||
      !data?.chapter ||
      data.chapter.index !== index
    ) return
    const handleResize = () => {
      setPaginationVersion((version) => version + 1)
    }
    window.addEventListener('resize', handleResize)
    let cancelled = false
    void document.fonts.ready.then(() => {
      if (!cancelled) setPaginationVersion((version) => version + 1)
    })
    return () => {
      cancelled = true
      window.removeEventListener('resize', handleResize)
    }
  }, [data?.chapter, index, settings.pageMode])

  useEffect(
    () => () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
      if (turnTimer.current) window.clearTimeout(turnTimer.current)
      if (skipCleanupSave.current) {
        skipCleanupSave.current = false
        return
      }
      if (bookId && restoredChapter.current.startsWith(`${bookId}:${index}:`)) {
        void saveProgress({
          bookId,
          chapterIndex: index,
          scrollRatio: ratioRef.current,
        })
      }
    },
    [bookId, index],
  )

  const paragraphs = (() => {
    if (!data?.chapter) return []
    let cursor = 0
    return data.chapter.content.split(/\n{2,}|\n/).filter(Boolean).map((text) => {
      const start = data.chapter!.content.indexOf(text, cursor)
      cursor = start + text.length
      return { text, start, end: cursor }
    })
  })()

  function queueProgressSave() {
    const element = scrollRef.current
    if (!element) return
    if (settings.pageMode === 'simulation') {
      const count = Math.max(1, Math.ceil(element.scrollWidth / element.clientWidth))
      const page = Math.min(count - 1, Math.round(element.scrollLeft / element.clientWidth))
      setPageCount(count)
      setCurrentPage(page)
      ratioRef.current = count === 1 ? 0 : page / (count - 1)
    } else {
      const max = Math.max(1, element.scrollHeight - element.clientHeight)
      ratioRef.current = Math.max(0, Math.min(1, element.scrollTop / max))
      setControlsVisible(false)
    }
    scheduleProgressSave()
  }

  function scheduleProgressSave() {
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      void saveProgress({
        bookId,
        chapterIndex: index,
        scrollRatio: ratioRef.current,
      })
    }, 500)
  }

  function turnPage(direction: -1 | 1) {
    const element = scrollRef.current
    if (!element || settings.pageMode !== 'simulation') return
    const nextPage = currentPage + direction
    if (nextPage < 0) {
      if (index > 0) goToChapter(index - 1, undefined, 1)
      return
    }
    if (nextPage >= pageCount) {
      if (index < data!.book!.chapterCount - 1) goToChapter(index + 1, undefined, 0)
      return
    }
    setTurnDirection(direction > 0 ? 'next' : 'previous')
    if (turnTimer.current) window.clearTimeout(turnTimer.current)
    turnTimer.current = window.setTimeout(() => setTurnDirection(null), 360)
    setCurrentPage(nextPage)
    ratioRef.current = pageCount === 1 ? 0 : nextPage / (pageCount - 1)
    element.scrollTo({ left: nextPage * element.clientWidth, behavior: 'smooth' })
    scheduleProgressSave()
  }

  function handlePointerDown(event: React.PointerEvent) {
    if (settings.pageMode !== 'simulation') return
    pointerStart.current = { x: event.clientX, y: event.clientY }
    didSwipe.current = false
  }

  function handlePointerUp(event: React.PointerEvent) {
    if (settings.pageMode !== 'simulation' || !pointerStart.current) return
    const deltaX = event.clientX - pointerStart.current.x
    const deltaY = event.clientY - pointerStart.current.y
    pointerStart.current = null
    if (Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY)) {
      didSwipe.current = true
      turnPage(deltaX < 0 ? 1 : -1)
    }
  }

  async function updateSettings(next: ReaderSettings) {
    setSettings(next)
    await saveReaderSettings(next)
  }

  async function addBookmark() {
    if (!data?.chapter) return
    const approximateOffset = Math.round(
      data.chapter.content.length * ratioRef.current,
    )
    const excerpt = data.chapter.content.slice(
      Math.max(0, approximateOffset - 30),
      approximateOffset + 90,
    )
    const added = await toggleBookmark(
      bookId,
      index,
      ratioRef.current,
      excerpt || data.chapter.title,
    )
    setToast(added ? '已添加书签' : '已移除附近书签')
    window.setTimeout(() => setToast(''), 1800)
  }

  async function runSearch(event: React.FormEvent) {
    event.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    try {
      const chapters = await db.chapters
        .where('bookId')
        .equals(bookId)
        .sortBy('index')
      setResults(await searchBook(chapters, query))
    } finally {
      setSearching(false)
    }
  }

  async function openChapterList() {
    setPanel('toc')
    if (chapterList.length || loadingChapterList) return
    setLoadingChapterList(true)
    try {
      const chapters = await db.chapters
        .where('bookId')
        .equals(bookId)
        .sortBy('index')
      setChapterList(
        chapters.map(({ id, index: chapterNumber, title }) => ({
          id,
          index: chapterNumber,
          title,
        })),
      )
    } finally {
      setLoadingChapterList(false)
    }
  }

  function goToChapter(
    nextIndex: number,
    searchOffset?: number,
    targetRatio?: number,
  ) {
    void saveProgress({ bookId, chapterIndex: index, scrollRatio: ratioRef.current })
    if (nextIndex !== index) skipCleanupSave.current = true
    setPanel(null)
    restoredChapter.current = ''
    navigate(`/reader/${bookId}/${nextIndex}`, {
      replace: true,
      state:
        searchOffset === undefined && targetRatio === undefined
          ? null
          : { searchOffset, targetRatio },
    })
  }

  if (!data || (data.chapter && data.chapter.index !== index)) {
    return <div className="loading-screen">正在排版…</div>
  }
  if (!data.book || !data.chapter) {
    return (
      <div className="error-screen">
        <h1>章节不存在</h1>
        <button className="primary-button" onClick={() => navigate('/library')}>
          返回书架
        </button>
      </div>
    )
  }

  const currentBookmarked = data.bookmarks.some(
    (bookmark) => bookmark.chapterIndex === index,
  )
  const isPaged = settings.pageMode === 'simulation'

  return (
    <div className={`reader theme-${settings.theme}`}>
      <main
        ref={scrollRef}
        className={`reading-canvas ${isPaged ? 'paged' : 'scrolling'} ${
          turnDirection ? `turning-${turnDirection}` : ''
        }`}
        onScroll={queueProgressSave}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onClick={(event) => {
          if (panel || window.getSelection()?.toString() !== '') return
          if (didSwipe.current) {
            didSwipe.current = false
            return
          }
          if (isPaged) {
            const bounds = event.currentTarget.getBoundingClientRect()
            const position = (event.clientX - bounds.left) / bounds.width
            if (position < 0.32) turnPage(-1)
            else if (position > 0.68) turnPage(1)
            else setControlsVisible((visible) => !visible)
          } else {
            setControlsVisible((visible) => !visible)
          }
        }}
      >
        <article
          className="reading-column"
          style={{
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
          }}
        >
          <p className="chapter-kicker">
            {String(index + 1).padStart(2, '0')} / {data.book.chapterCount}
          </p>
          <h1>{data.chapter.title}</h1>
          <div className="chapter-body">
            {paragraphs.length ? (
              paragraphs.map((paragraph) => (
                <p
                  key={paragraph.start}
                  data-offset-start={paragraph.start}
                  data-offset-end={paragraph.end}
                >
                  {paragraph.text}
                </p>
              ))
            ) : (
              <p className="empty-chapter">本章没有正文</p>
            )}
          </div>
          <nav className="chapter-pager" aria-label="章节导航">
            <button
              disabled={index === 0}
              onClick={(event) => {
                event.stopPropagation()
                goToChapter(index - 1, undefined, 1)
              }}
            >
              <ChevronLeft />上一章
            </button>
            <button
              disabled={index >= data.book.chapterCount - 1}
              onClick={(event) => {
                event.stopPropagation()
                goToChapter(index + 1, undefined, 0)
              }}
            >
              下一章<ChevronRight />
            </button>
          </nav>
        </article>
      </main>

      <div
        className="brightness-mask"
        style={{ opacity: 1 - settings.brightness }}
        aria-hidden="true"
      />

      <header className={`reader-header ${controlsVisible ? 'visible' : ''}`}>
        <button className="icon-button" onClick={() => navigate(-1)} aria-label="返回">
          <ArrowLeft />
        </button>
        <div>
          <strong>{data.chapter.title}</strong>
          <span>{data.book.title}</span>
        </div>
        <button
          className={`icon-button ${currentBookmarked ? 'accent' : ''}`}
          onClick={() => void addBookmark()}
          aria-label="切换书签"
        >
          <Bookmark fill={currentBookmarked ? 'currentColor' : 'none'} />
        </button>
      </header>

      <nav className={`reader-toolbar ${controlsVisible ? 'visible' : ''}`}>
        <button onClick={() => void openChapterList()}><List /><span>目录</span></button>
        <button onClick={() => setPanel('search')}><Search /><span>搜索</span></button>
        <button onClick={() => setPanel('settings')}><SlidersHorizontal /><span>排版</span></button>
      </nav>

      {isPaged && (
        <div className={`page-progress ${controlsVisible ? 'controls-visible' : ''}`}>
          {currentPage + 1} / {pageCount}
        </div>
      )}

      {panel && (
        <div className="sheet-backdrop" onClick={() => setPanel(null)}>
          <section className="bottom-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <button className="sheet-close icon-button" onClick={() => setPanel(null)} aria-label="关闭">
              <X />
            </button>
            {panel === 'toc' && (
              <>
                <h2>目录</h2>
                <div className="sheet-list">
                  {loadingChapterList && (
                    <p className="sheet-loading">正在整理目录…</p>
                  )}
                  {chapterList.map((chapter) => (
                    <button
                      key={chapter.id}
                      className={chapter.index === index ? 'active' : ''}
                      onClick={() => goToChapter(chapter.index)}
                    >
                      <span>{String(chapter.index + 1).padStart(2, '0')}</span>
                      {chapter.title}
                      {data.bookmarks.some((item) => item.chapterIndex === chapter.index) && (
                        <Bookmark className="mini-bookmark" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
            {panel === 'search' && (
              <>
                <h2>全文搜索</h2>
                <form className="sheet-search" onSubmit={(event) => void runSearch(event)}>
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入关键词" autoFocus />
                  <button className="primary-button" disabled={!query.trim() || searching}>
                    {searching ? '搜索中' : '搜索'}
                  </button>
                </form>
                <div className="search-results">
                  {results.map((result, resultIndex) => (
                    <button
                      key={`${result.chapterIndex}:${result.offset}:${resultIndex}`}
                      onClick={() => goToChapter(result.chapterIndex, result.offset)}
                    >
                      <strong>{result.chapterTitle}</strong>
                      <span>{result.excerpt}</span>
                    </button>
                  ))}
                  {!searching && query && results.length === 0 && (
                    <p className="no-results">没有匹配结果</p>
                  )}
                </div>
              </>
            )}
            {panel === 'settings' && (
              <>
                <h2>阅读排版</h2>
                <div className="reader-page-mode">
                  <span>翻页方式</span>
                  <div className="mode-segment compact" role="group" aria-label="翻页方式">
                    <button
                      className={settings.pageMode === 'simulation' ? 'active' : ''}
                      onClick={() => void updateSettings({ ...settings, pageMode: 'simulation' })}
                      aria-pressed={settings.pageMode === 'simulation'}
                    >
                      <BookOpenText />仿真
                    </button>
                    <button
                      className={settings.pageMode === 'scroll' ? 'active' : ''}
                      onClick={() => void updateSettings({ ...settings, pageMode: 'scroll' })}
                      aria-pressed={settings.pageMode === 'scroll'}
                    >
                      <Rows3 />滚动
                    </button>
                  </div>
                </div>
                <div className="reader-setting-row">
                  <span>字号</span>
                  <div className="stepper">
                    <button aria-label="减小字号" onClick={() => void updateSettings({ ...settings, fontSize: Math.max(16, settings.fontSize - 1) })}><Minus /></button>
                    <strong>{settings.fontSize}</strong>
                    <button aria-label="增大字号" onClick={() => void updateSettings({ ...settings, fontSize: Math.min(28, settings.fontSize + 1) })}><Plus /></button>
                  </div>
                </div>
                <label className="range-row">
                  <span>行距 <b>{settings.lineHeight.toFixed(1)}</b></span>
                  <input type="range" min="1.5" max="2.2" step="0.1" value={settings.lineHeight} onChange={(event) => void updateSettings({ ...settings, lineHeight: Number(event.target.value) })} />
                </label>
                <label className="range-row">
                  <span>亮度 <b>{Math.round(settings.brightness * 100)}%</b></span>
                  <input type="range" min="0.35" max="1" step="0.05" value={settings.brightness} onChange={(event) => void updateSettings({ ...settings, brightness: Number(event.target.value) })} />
                </label>
                <div className="theme-options" aria-label="阅读主题">
                  {themes.map((theme) => (
                    <button
                      key={theme.id}
                      className={`theme-swatch theme-${theme.id}`}
                      onClick={() => void updateSettings({ ...settings, theme: theme.id })}
                      aria-label={theme.label}
                    >
                      {settings.theme === theme.id && <Check />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      )}
      {toast && <div className="reader-toast" role="status">{toast}</div>}
    </div>
  )
}
