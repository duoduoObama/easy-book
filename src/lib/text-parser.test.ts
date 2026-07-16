import { describe, expect, it } from 'vitest'
import { decodeText, splitChapters } from './text-parser'

describe('splitChapters', () => {
  it('识别中文章节并保留卷首', () => {
    const result = splitChapters(
      '作品简介\n这是一段简介\n\n第一章 初见\n第一章内容\n\n第2章 重逢\n第二章内容',
    )
    expect(result.map((chapter) => chapter.title)).toEqual([
      '卷首',
      '第一章 初见',
      '第2章 重逢',
    ])
    expect(result[1].content).toBe('第一章内容')
  })

  it('没有章节标题时创建正文', () => {
    expect(splitChapters('只有一段普通正文')).toEqual([
      {
        title: '正文',
        content: '只有一段普通正文',
        characterCount: 8,
      },
    ])
  })
})

describe('decodeText', () => {
  it('严格解码 UTF-8', () => {
    const bytes = new TextEncoder().encode('中文 UTF-8')
    expect(decodeText(bytes.buffer)).toEqual({
      text: '中文 UTF-8',
      encoding: 'UTF-8',
    })
  })

  it('识别 UTF-16LE BOM', () => {
    const bytes = new Uint8Array([0xff, 0xfe, 0x2d, 0x4e, 0x87, 0x65])
    expect(decodeText(bytes.buffer)).toEqual({
      text: '中文',
      encoding: 'UTF-16LE',
    })
  })
})
