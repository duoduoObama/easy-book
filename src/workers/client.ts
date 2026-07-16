import type { Chapter, ParsedBook, SearchResult } from '../types'

type WorkerResponse =
  | { id: string; type: 'progress'; progress: number }
  | { id: string; type: 'parsed'; payload: ParsedBook }
  | { id: string; type: 'results'; payload: SearchResult[] }
  | { id: string; type: 'error'; error: string }

function runWorker<T>(
  message: Record<string, unknown>,
  transfer: Transferable[] = [],
  onProgress?: (progress: number) => void,
) {
  return new Promise<T>((resolve, reject) => {
    const worker = new Worker(new URL('./book.worker.ts', import.meta.url), {
      type: 'module',
    })
    const id = crypto.randomUUID()
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data
      if (response.id !== id) return
      if (response.type === 'progress') {
        onProgress?.(response.progress)
        return
      }
      worker.terminate()
      if (response.type === 'error') reject(new Error(response.error))
      else resolve(response.payload as T)
    }
    worker.onerror = () => {
      worker.terminate()
      reject(new Error('后台处理线程启动失败'))
    }
    worker.postMessage({ ...message, id }, transfer)
  })
}

export function parseFile(
  file: File,
  onProgress?: (progress: number) => void,
) {
  return file
    .arrayBuffer()
    .then((buffer) =>
      runWorker<ParsedBook>(
        { type: 'parse', fileName: file.name, buffer },
        [buffer],
        onProgress,
      ),
    )
}

export function searchBook(
  chapters: Pick<Chapter, 'index' | 'title' | 'content'>[],
  query: string,
) {
  return runWorker<SearchResult[]>({ type: 'search', chapters, query })
}
