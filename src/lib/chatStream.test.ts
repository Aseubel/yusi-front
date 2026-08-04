import { describe, expect, it, vi } from 'vitest'
import { cancelChatRequest, consumeSseResponse, createChatRequestId, parseAgentStreamEvent } from './chatStream'

describe('chat stream helpers', () => {
  it('creates a non-empty request id', () => {
    expect(createChatRequestId()).toMatch(/\S+/)
  })

  it('posts cancellation independently with the request id and token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))

    await cancelChatRequest('request-123', 'token-abc', fetchMock)

    expect(fetchMock).toHaveBeenCalledWith('/api/ai/chat/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token-abc',
      },
      body: JSON.stringify({ requestId: 'request-123' }),
      keepalive: true,
    })
  })

  it('parses SSE events across chunk boundaries and preserves multiline data', async () => {
    const encodedChunks = [
      'data: first\n\n',
      ': keep-alive\n\n',
      'data: multi\n',
      'data: line\n\n',
    ].map((chunk) => new TextEncoder().encode(chunk))
    const response = new Response(new ReadableStream<Uint8Array>({
      start(controller) {
        encodedChunks.forEach((chunk) => controller.enqueue(chunk))
        controller.close()
      },
    }))
    const received: string[] = []

    await consumeSseResponse(response, (event) => received.push(event.data))

    expect(received).toEqual(['first', 'multi\nline'])
  })

  it('preserves named event types and parses AgentRun payloads', async () => {
    const response = new Response(new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(
          'event: tool.started\n' +
          'data: {"type":"tool.started","runId":"run-1","toolName":"searchMemories"}\n\n',
        ))
        controller.close()
      },
    }))
    const received = [] as ReturnType<typeof parseAgentStreamEvent>[]

    await consumeSseResponse(response, (event) => received.push(parseAgentStreamEvent(event)))

    expect(received).toEqual([{
      type: 'tool.started',
      runId: 'run-1',
      stage: undefined,
      status: undefined,
      toolCallId: undefined,
      toolName: 'searchMemories',
      toolSource: undefined,
      success: undefined,
      durationMs: undefined,
      text: undefined,
      message: undefined,
    }])
  })
})
