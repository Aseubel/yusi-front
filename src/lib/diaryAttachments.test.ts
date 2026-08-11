import { describe, expect, it } from 'vitest'
import {
  locateDiaryAttachmentAnchor,
  parseDiaryAttachmentBindings,
  serializeDiaryAttachmentBindings,
  sortDiaryAttachmentBindings,
} from './diaryAttachments'

describe('diary attachment bindings', () => {
  it('parses text-range bindings and assigns a stable fallback order', () => {
    expect(parseDiaryAttachmentBindings([
      { type: 'IMAGE', objectKey: 'images/user/a.jpg', paragraphId: 'p-a', anchor: { kind: 'TEXT_RANGE', start: 0, end: 2, quote: '正文' }, url: 'signed-url' },
      { type: 'AUDIO', objectKey: 'audio/user/a.webm', paragraphId: 'p-b', anchor: { kind: 'TEXT_RANGE', start: 1, end: 3, quote: '语音' } },
      { type: 'IMAGE', objectKey: '', paragraphId: 'p-c', anchor: { kind: 'TEXT_RANGE', start: 0, end: 1, quote: '图' } },
    ])).toEqual([
      { type: 'IMAGE', objectKey: 'images/user/a.jpg', paragraphId: 'p-a', sortOrder: 0, anchor: { kind: 'TEXT_RANGE', start: 0, end: 2, quote: '正文' }, url: 'signed-url' },
      { type: 'AUDIO', objectKey: 'audio/user/a.webm', paragraphId: 'p-b', sortOrder: 1, anchor: { kind: 'TEXT_RANGE', start: 1, end: 3, quote: '语音' }, url: undefined },
    ])
  })

  it('drops legacy paragraph-only bindings', () => {
    expect(parseDiaryAttachmentBindings([
      { type: 'IMAGE', objectKey: 'images/user/legacy.jpg', paragraphId: 'p-a', sortOrder: 0 },
    ])).toEqual([])
  })

  it('strips signed URLs before a binding is sent back to the API', () => {
    expect(serializeDiaryAttachmentBindings([
      {
        type: 'IMAGE',
        objectKey: 'images/user/a.jpg',
        paragraphId: 'p-a',
        sortOrder: 2,
        anchor: { kind: 'TEXT_RANGE', start: 3, end: 7, quote: '正文', prefix: '一段', suffix: '内容' },
        url: 'temporary-url',
      },
    ])).toEqual([
      {
        type: 'IMAGE',
        objectKey: 'images/user/a.jpg',
        paragraphId: 'p-a',
        sortOrder: 2,
        anchor: { kind: 'TEXT_RANGE', start: 3, end: 7, quote: '正文', prefix: '一段', suffix: '内容' },
      },
    ])
  })

  it('sorts attachments without mutating the editor state', () => {
    const bindings = [
      { type: 'IMAGE' as const, objectKey: 'images/user/b.jpg', paragraphId: 'p-b', sortOrder: 4, anchor: { kind: 'TEXT_RANGE' as const, start: 0, end: 1, quote: '乙' } },
      { type: 'IMAGE' as const, objectKey: 'images/user/a.jpg', paragraphId: 'p-a', sortOrder: 1, anchor: { kind: 'TEXT_RANGE' as const, start: 0, end: 1, quote: '甲' } },
    ]
    expect(sortDiaryAttachmentBindings(bindings).map((binding) => binding.objectKey)).toEqual([
      'images/user/a.jpg',
      'images/user/b.jpg',
    ])
    expect(bindings[0].objectKey).toBe('images/user/b.jpg')
  })

  it('relocates a unique text anchor after text is inserted before it', () => {
    const anchor = { kind: 'TEXT_RANGE' as const, start: 2, end: 4, quote: '目标', prefix: '这是', suffix: '文字' }
    expect(locateDiaryAttachmentAnchor('这是新增目标文字', anchor)).toEqual({
      kind: 'TEXT_RANGE',
      start: 4,
      end: 6,
      quote: '目标',
      prefix: '这是新增',
      suffix: '文字',
    })
  })

  it('does not silently relocate an ambiguous text anchor', () => {
    const anchor = { kind: 'TEXT_RANGE' as const, start: 0, end: 2, quote: '目标', prefix: '原', suffix: '文字' }
    expect(locateDiaryAttachmentAnchor('目标文字，另一个目标', anchor)).toBeNull()
  })

})
