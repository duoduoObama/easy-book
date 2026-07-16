import { describe, expect, it } from 'vitest'
import { searchChapters } from './search'

describe('searchChapters', () => {
  const chapters = [
    { index: 0, title: '第一章', content: '山风穿过树林，带来远方的钟声。' },
    { index: 1, title: '第二章', content: '树林尽头是一条安静的河。树林旁有旧屋。' },
  ]

  it('返回全部中文子串及上下文', () => {
    const result = searchChapters(chapters, '树林')
    expect(result).toHaveLength(3)
    expect(result[0]).toMatchObject({ chapterIndex: 0, chapterTitle: '第一章' })
    expect(result[2].excerpt).toContain('树林')
  })

  it('限制结果数量并忽略空查询', () => {
    expect(searchChapters(chapters, '树林', 2)).toHaveLength(2)
    expect(searchChapters(chapters, '  ')).toEqual([])
  })
})
