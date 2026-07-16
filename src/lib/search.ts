import type { Chapter, SearchResult } from '../types'

export function searchChapters(
  chapters: Pick<Chapter, 'index' | 'title' | 'content'>[],
  rawQuery: string,
  limit = 200,
): SearchResult[] {
  const query = rawQuery.trim().toLocaleLowerCase('zh-CN')
  if (!query) return []

  const results: SearchResult[] = []
  for (const chapter of chapters) {
    const haystack = chapter.content.toLocaleLowerCase('zh-CN')
    let from = 0
    while (results.length < limit) {
      const offset = haystack.indexOf(query, from)
      if (offset === -1) break
      const excerptStart = Math.max(0, offset - 28)
      const excerptEnd = Math.min(
        chapter.content.length,
        offset + query.length + 48,
      )
      results.push({
        chapterIndex: chapter.index,
        chapterTitle: chapter.title,
        offset,
        excerpt: chapter.content
          .slice(excerptStart, excerptEnd)
          .replace(/\s+/g, ' '),
      })
      from = offset + Math.max(query.length, 1)
    }
    if (results.length >= limit) break
  }
  return results
}
