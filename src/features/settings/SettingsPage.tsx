import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  BookOpenText,
  Check,
  Database,
  HardDrive,
  Info,
  Minus,
  Plus,
  Rows3,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { db } from '../../data/db'
import {
  clearAllData,
  DEFAULT_READER_SETTINGS,
  getReaderSettings,
  saveReaderSettings,
} from '../../data/repository'
import type { ReaderSettings } from '../../types'

const themes: Array<{ id: ReaderSettings['theme']; label: string }> = [
  { id: 'charcoal', label: '炭黑' },
  { id: 'paper', label: '纸张' },
  { id: 'sage', label: '青绿' },
  { id: 'mist', label: '雾蓝' },
  { id: 'black', label: '纯黑' },
  { id: 'graphite', label: '石墨' },
]

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(0, bytes / 1024).toFixed(1)} KiB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MiB`
}

export function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_READER_SETTINGS)
  const [storage, setStorage] = useState({ usage: 0, quota: 0 })
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const [message, setMessage] = useState('')
  const stats = useLiveQuery(async () => ({
    books: await db.books.count(),
    chapters: await db.chapters.count(),
    sourceBytes: (await db.books.toArray()).reduce(
      (total, book) => total + book.byteSize,
      0,
    ),
  }))

  useEffect(() => {
    void getReaderSettings().then(setSettings)
    if (navigator.storage?.estimate) {
      void navigator.storage.estimate().then((estimate) =>
        setStorage({
          usage: estimate.usage ?? 0,
          quota: estimate.quota ?? 0,
        }),
      )
    }
    if (navigator.storage?.persisted) {
      void navigator.storage.persisted().then(setPersisted)
    }
  }, [stats?.books])

  async function updateSettings(next: ReaderSettings) {
    setSettings(next)
    await saveReaderSettings(next)
    setMessage('阅读设置已保存')
  }

  async function handleClear() {
    if (!window.confirm('确定清空全部小说、进度、书签和设置吗？此操作无法撤销。')) return
    if (!window.confirm('再次确认：清空后无法恢复。')) return
    await clearAllData()
    setSettings(DEFAULT_READER_SETTINGS)
    setMessage('本地数据已清空')
  }

  return (
    <main className="page settings-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">只属于你的阅读空间</p>
          <h1>设置</h1>
        </div>
      </header>

      {message && <div className="notice" role="status">{message}</div>}

      <section className="settings-card reading-preview">
        <p className="eyebrow">阅读预览</p>
        <h2>慢下来，进入故事。</h2>
        <p
          className={`preview-copy theme-${settings.theme}`}
          style={{ fontSize: settings.fontSize, lineHeight: settings.lineHeight }}
        >
          夜色落在书页上，远处的灯火安静地亮着。这里没有消息提醒，只有下一行文字。
        </p>
      </section>

      <section className="settings-card">
        <div className="card-title"><span><Info />默认排版</span></div>
        <div className="page-mode-setting">
          <div>
            <strong>翻页方式</strong>
            <small>阅读时也可以随时切换</small>
          </div>
          <div className="mode-segment" role="group" aria-label="翻页方式">
            <button
              className={settings.pageMode === 'simulation' ? 'active' : ''}
              onClick={() => void updateSettings({ ...settings, pageMode: 'simulation' })}
              aria-pressed={settings.pageMode === 'simulation'}
            >
              <BookOpenText />
              仿真翻页
            </button>
            <button
              className={settings.pageMode === 'scroll' ? 'active' : ''}
              onClick={() => void updateSettings({ ...settings, pageMode: 'scroll' })}
              aria-pressed={settings.pageMode === 'scroll'}
            >
              <Rows3 />
              滚动阅读
            </button>
          </div>
        </div>
        <div className="setting-row">
          <div><strong>正文字号</strong><small>16–28 像素</small></div>
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
        <div className="theme-setting">
          <span>阅读主题</span>
          <div className="theme-options">
            {themes.map((theme) => (
              <button
                key={theme.id}
                className={`theme-swatch theme-${theme.id}`}
                onClick={() => void updateSettings({ ...settings, theme: theme.id })}
                aria-label={theme.label}
                title={theme.label}
              >
                {settings.theme === theme.id && <Check />}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="settings-card">
        <div className="card-title"><span><HardDrive />本地书库</span></div>
        <div className="storage-stats">
          <div><strong>{stats?.books ?? 0}</strong><span>本书</span></div>
          <div><strong>{stats?.chapters ?? 0}</strong><span>章节</span></div>
          <div><strong>{formatBytes(storage.usage || stats?.sourceBytes || 0)}</strong><span>浏览器占用</span></div>
        </div>
        {storage.quota > 0 && (
          <p className="storage-note">
            可用配额约 {formatBytes(storage.quota)}，系统可能按设备策略调整。
          </p>
        )}
        <button className="danger-button" onClick={() => void handleClear()} disabled={!stats?.books}>
          <Trash2 />清空全部数据
        </button>
      </section>

      <section className="settings-card diagnostic-card">
        <div className="card-title"><span><ShieldCheck />运行环境诊断</span></div>
        <div className="diagnostic-row">
          <span><Database />IndexedDB</span>
          <b>{'indexedDB' in window ? '可用' : '不可用'}</b>
        </div>
        <div className="diagnostic-row">
          <span>存储持久化策略</span>
          <b>{persisted === null ? '未知' : persisted ? '已持久化' : '由系统管理'}</b>
        </div>
        <div className="diagnostic-row">
          <span>页面协议</span>
          <b>{window.location.protocol.replace(':', '') || 'local'}</b>
        </div>
        <p>
          APK 真机还需验证：文件选择、应用重启、设备重启、覆盖安装、返回键与安全区。
        </p>
      </section>

      <footer className="app-info">
        <span>易读 Easy Book · 0.1.0</span>
        <p>完全离线。卸载应用或清除数据会永久删除书库。</p>
      </footer>
    </main>
  )
}
