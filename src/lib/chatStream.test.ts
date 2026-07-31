import { describe, expect, it, vi } from 'vitest'
import { cancelChatRequest, consumeSseResponse, createChatRequestId } from './chatStream'

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

    await consumeSseResponse(response, (data) => received.push(data))

    expect(received).toEqual(['first', 'multi\nline'])
  })
})
