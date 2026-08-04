import { API_BASE } from '../utils'

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export interface SseEvent {
  event: string
  data: string
  id?: string
}

export interface AgentStreamEvent {
  type: string
  runId?: string
  stage?: string
  status?: string
  toolCallId?: string
  toolName?: string
  toolSource?: string
  success?: boolean
  durationMs?: number
  text?: string
  message?: string
}

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
  onEvent: (event: SseEvent) => void,
): Promise<void> {
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No reader available')
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let eventData: string[] = []
  let eventName = 'message'
  let eventId: string | undefined

  const dispatchEvent = () => {
    if (eventData.length > 0) {
      onEvent({ event: eventName, data: eventData.join('\n'), id: eventId })
    }
    eventData = []
    eventName = 'message'
    eventId = undefined
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
      return
    }
    if (line.startsWith('event:')) {
      const value = line.slice(6)
      eventName = value.startsWith(' ') ? value.slice(1) : value
      return
    }
    if (line.startsWith('id:')) {
      const value = line.slice(3)
      eventId = value.startsWith(' ') ? value.slice(1) : value
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

export function parseAgentStreamEvent(event: SseEvent): AgentStreamEvent {
  try {
    const parsed = JSON.parse(event.data) as Record<string, unknown>
    return {
      type: typeof parsed.type === 'string' ? parsed.type : event.event,
      runId: typeof parsed.runId === 'string' ? parsed.runId : undefined,
      stage: typeof parsed.stage === 'string' ? parsed.stage : undefined,
      status: typeof parsed.status === 'string' ? parsed.status : undefined,
      toolCallId: typeof parsed.toolCallId === 'string' ? parsed.toolCallId : undefined,
      toolName: typeof parsed.toolName === 'string' ? parsed.toolName : undefined,
      toolSource: typeof parsed.toolSource === 'string' ? parsed.toolSource : undefined,
      success: typeof parsed.success === 'boolean' ? parsed.success : undefined,
      durationMs: typeof parsed.durationMs === 'number' ? parsed.durationMs : undefined,
      text: typeof parsed.text === 'string' ? parsed.text : undefined,
      message: typeof parsed.message === 'string' ? parsed.message : undefined,
    }
  } catch {
    // Keep the stream compatible with older unnamed text-only SSE responses.
    return {
      type: event.event === 'message' ? 'response.delta' : event.event,
      text: event.data,
    }
  }
}
