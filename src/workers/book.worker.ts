/// <reference lib="webworker" />

import { searchChapters } from '../lib/search'
import { parseBook } from '../lib/text-parser'
import type { Chapter } from '../types'

type WorkerRequest =
  | {
      id: string
      type: 'parse'
      buffer: ArrayBuffer
      fileName: string
    }
  | {
      id: string
      type: 'search'
      chapters: Pick<Chapter, 'index' | 'title' | 'content'>[]
      query: string
    }

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data
  try {
    self.postMessage({ id: request.id, type: 'progress', progress: 0.1 })
    if (request.type === 'parse') {
      const book = await parseBook(request.buffer, request.fileName)
      self.postMessage({ id: request.id, type: 'parsed', payload: book })
      return
    }
    const results = searchChapters(request.chapters, request.query)
    self.postMessage({ id: request.id, type: 'results', payload: results })
  } catch (error) {
    self.postMessage({
      id: request.id,
      type: 'error',
      error: error instanceof Error ? error.message : '处理失败',
    })
  }
}

export {}
