import { BookOpenText, Settings } from 'lucide-react'
import {
  HashRouter,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
} from 'react-router-dom'
import { FloatingScrollbar } from '../components/FloatingScrollbar'
import { BookPage } from '../features/library/BookPage'
import { LibraryPage } from '../features/library/LibraryPage'
import { ReaderPage } from '../features/reader/ReaderPage'
import { SettingsPage } from '../features/settings/SettingsPage'

function AppShell() {
  return (
    <div className="app-shell">
      <Outlet />
      <nav className="bottom-nav" aria-label="主导航">
        <NavLink to="/library">
          <BookOpenText aria-hidden="true" />
          <span>书架</span>
        </NavLink>
        <NavLink to="/settings">
          <Settings aria-hidden="true" />
          <span>设置</span>
        </NavLink>
      </nav>
    </div>
  )
}

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="/books/:bookId" element={<BookPage />} />
        <Route
          path="/reader/:bookId/:chapterIndex"
          element={<ReaderPage />}
        />
        <Route path="*" element={<Navigate to="/library" replace />} />
      </Routes>
      <FloatingScrollbar />
    </HashRouter>
  )
}
