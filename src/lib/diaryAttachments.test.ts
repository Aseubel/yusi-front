import { describe, expect, it } from 'vitest'
import {
  parseDiaryAttachmentBindings,
  serializeDiaryAttachmentBindings,
  sortDiaryAttachmentBindings,
} from './diaryAttachments'

describe('diary attachment bindings', () => {
  it('parses valid bindings and assigns a stable fallback order', () => {
    expect(parseDiaryAttachmentBindings([
      { type: 'IMAGE', objectKey: 'images/user/a.jpg', paragraphId: 'p-a', url: 'signed-url' },
      { type: 'AUDIO', objectKey: 'audio/user/a.webm', paragraphId: 'p-b' },
      { type: 'IMAGE', objectKey: '', paragraphId: 'p-c' },
    ])).toEqual([
      { type: 'IMAGE', objectKey: 'images/user/a.jpg', paragraphId: 'p-a', sortOrder: 0, url: 'signed-url' },
      { type: 'AUDIO', objectKey: 'audio/user/a.webm', paragraphId: 'p-b', sortOrder: 1, url: undefined },
    ])
  })

  it('strips signed URLs before a binding is sent back to the API', () => {
    expect(serializeDiaryAttachmentBindings([
      { type: 'IMAGE', objectKey: 'images/user/a.jpg', paragraphId: 'p-a', sortOrder: 2, url: 'temporary-url' },
    ])).toEqual([
      { type: 'IMAGE', objectKey: 'images/user/a.jpg', paragraphId: 'p-a', sortOrder: 2 },
    ])
  })

  it('sorts attachments without mutating the editor state', () => {
    const bindings = [
      { type: 'IMAGE' as const, objectKey: 'images/user/b.jpg', paragraphId: 'p-b', sortOrder: 4 },
      { type: 'IMAGE' as const, objectKey: 'images/user/a.jpg', paragraphId: 'p-a', sortOrder: 1 },
    ]
    expect(sortDiaryAttachmentBindings(bindings).map((binding) => binding.objectKey)).toEqual([
      'images/user/a.jpg',
      'images/user/b.jpg',
    ])
    expect(bindings[0].objectKey).toBe('images/user/b.jpg')
  })
})
