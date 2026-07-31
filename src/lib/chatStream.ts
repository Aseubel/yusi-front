import { API_BASE } from '../utils'

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export function createChatRequestId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export async function cancelChatRequest(
  requestId: string,
  token: string | null,
  fetchImpl: FetchLike = fetch,
): Promise<void> {
  const response = await fetchImpl(`${API_BASE}/ai/chat/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ requestId }),
    keepalive: true,
  })

  if (!response.ok) {
    throw new Error(`Chat cancellation failed with status ${response.status}`)
  }
}

export async function consumeSseResponse(
  response: Response,
  onData: (data: string) => void,
): Promise<void> {
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No reader available')
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let eventData: string[] = []

  const dispatchEvent = () => {
    if (eventData.length > 0) {
      onData(eventData.join('\n'))
      eventData = []
    }
  }

  const processLine = (line: string) => {
    if (line === '') {
      dispatchEvent()
      return
    }
    if (line.startsWith(':')) {
      return
    }
    if (line.startsWith('data:')) {
      const value = line.slice(5)
      eventData.push(value.startsWith(' ') ? value.slice(1) : value)
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true })

      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() ?? ''
      lines.forEach(processLine)

      if (done) {
        if (buffer !== '') {
          processLine(buffer)
        }
        dispatchEvent()
        return
      }
    }
  } finally {
    reader.releaseLock()
  }
}
