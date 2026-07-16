import { render, screen } from '@testing-library/react'
import { HashRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { db } from '../../data/db'
import { LibraryPage } from './LibraryPage'

afterEach(async () => {
  await db.delete()
  await db.open()
})

describe('LibraryPage', () => {
  it('空书架显示导入引导', async () => {
    render(
      <HashRouter>
        <LibraryPage />
      </HashRouter>,
    )
    expect(await screen.findByText('导入第一本小说')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '选择 TXT 文件' })).toBeEnabled()
  })
})
