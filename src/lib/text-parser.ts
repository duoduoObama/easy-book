import type { ParsedBook, ParsedChapter } from '../types'

const CHAPTER_HEADING =
  /^(?:正文\s*)?(?:第[\d〇零一二三四五六七八九十百千万两]+[章节卷回集部篇](?:(?:\s+|[:：、.-])\S.{0,59})?|序章|序言|前言|楔子|引子|后记|尾声|番外(?:\s*\d+)?)$/i

function normalizeText(text: string) {
  return text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .split('\u0000')
    .join('')
    .replace(/[ \t]+\n/g, '\n')
    .trim()
}

export function decodeText(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return {
      text: new TextDecoder('utf-16le').decode(bytes.subarray(2)),
      encoding: 'UTF-16LE',
    }
  }
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    const swapped = bytes.subarray(2).slice()
    for (let index = 0; index + 1 < swapped.length; index += 2) {
      ;[swapped[index], swapped[index + 1]] = [
        swapped[index + 1],
        swapped[index],
      ]
    }
    return {
      text: new TextDecoder('utf-16le').decode(swapped),
      encoding: 'UTF-16BE',
    }
  }

  try {
    return {
      text: new TextDecoder('utf-8', { fatal: true }).decode(bytes),
      encoding: 'UTF-8',
    }
  } catch {
    return {
      text: new TextDecoder('gb18030').decode(bytes),
      encoding: 'GB18030',
    }
  }
}

export function splitChapters(source: string): ParsedChapter[] {
  const text = normalizeText(source)
  if (!text) return [{ title: '正文', content: '', characterCount: 0 }]

  const lines = text.split('\n')
  const headings: Array<{ line: number; title: string }> = []
  lines.forEach((line, index) => {
    const candidate = line.trim()
    if (candidate.length <= 72 && CHAPTER_HEADING.test(candidate)) {
      headings.push({ line: index, title: candidate })
    }
  })

  if (headings.length === 0) {
    return [{ title: '正文', content: text, characterCount: text.length }]
  }

  const chapters: ParsedChapter[] = []
  if (headings[0].line > 0) {
    const preface = lines.slice(0, headings[0].line).join('\n').trim()
    if (preface) {
      chapters.push({
        title: '卷首',
        content: preface,
        characterCount: preface.length,
      })
    }
  }

  headings.forEach((heading, index) => {
    const nextLine = headings[index + 1]?.line ?? lines.length
    const content = lines
      .slice(heading.line + 1, nextLine)
      .join('\n')
      .trim()
    chapters.push({
      title: heading.title,
      content,
      characterCount: content.length,
    })
  })
  return chapters
}

async function sha256(buffer: ArrayBuffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export async function parseBook(
  buffer: ArrayBuffer,
  fileName: string,
): Promise<ParsedBook> {
  const { text, encoding } = decodeText(buffer)
  const chapters = splitChapters(text)
  return {
    fingerprint: await sha256(buffer),
    title: fileName.replace(/\.txt$/i, '').trim() || '未命名书籍',
    encoding,
    characterCount: chapters.reduce(
      (total, chapter) => total + chapter.characterCount,
      0,
    ),
    chapters,
  }
}
