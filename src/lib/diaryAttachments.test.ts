import { describe, expect, it } from 'vitest'
import {
  getLastValidGraphemeRange,
  groupImageBindingsByVisualLine,
  locateDiaryAttachmentAnchor,
  parseDiaryAttachmentBindings,
  serializeDiaryAttachmentBindings,
  sortDiaryAttachmentBindings,
} from './diaryAttachments'

describe('diary attachment bindings', () => {
  it('uses the last non-whitespace grapheme as the marker range', () => {
    expect(getLastValidGraphemeRange('前缀👨‍👩‍👧‍👦  ', 0, '前缀👨‍👩‍👧‍👦  '.length)).toEqual({
      start: 2,
      end: 13,
      text: '👨‍👩‍👧‍👦',
    })
  })

  it('keeps a combining-character grapheme intact instead of using end - 1', () => {
    expect(getLastValidGraphemeRange('e\u0301 ', 0, 3)).toEqual({
      start: 0,
      end: 2,
      text: 'e\u0301',
    })
  })

  it('groups image bindings when their layout rectangles overlap vertically', () => {
    const imageBinding = (paragraphId: string, objectKey: string, sortOrder: number, top: number, bottom: number) => ({
      type: 'IMAGE' as const,
      objectKey,
      paragraphId,
      sortOrder,
      rect: { top, bottom },
    })

    expect(groupImageBindingsByVisualLine([
      imageBinding('p-1', 'a', 2, 10, 20),
      imageBinding('p-1', 'b', 1, 13, 24),
      imageBinding('p-2', 'c', 3, 13, 24),
      imageBinding('p-1', 'a', 4, 10, 20),
    ])).toEqual([
      { paragraphId: 'p-1', objectKeys: ['b', 'a'] },
      { paragraphId: 'p-2', objectKeys: ['c'] },
    ])
  })

  it('keeps bindings on separated visual lines apart when the vertical gap exceeds tolerance', () => {
    expect(groupImageBindingsByVisualLine([
      { paragraphId: 'p-1', objectKey: 'a', sortOrder: 1, rect: { top: 10, bottom: 20 } },
      { paragraphId: 'p-1', objectKey: 'b', sortOrder: 2, rect: { top: 23, bottom: 33 } },
    ], 2)).toEqual([
      { paragraphId: 'p-1', objectKeys: ['a'] },
      { paragraphId: 'p-1', objectKeys: ['b'] },
    ])
  })

  it('uses vertical gap tolerance when rectangles do not overlap', () => {
    expect(groupImageBindingsByVisualLine([
      { paragraphId: 'p-1', objectKey: 'a', sortOrder: 1, rect: { top: 10, bottom: 20 } },
      { paragraphId: 'p-1', objectKey: 'b', sortOrder: 2, rect: { top: 21, bottom: 31 } },
    ], 2)).toEqual([
      { paragraphId: 'p-1', objectKeys: ['a', 'b'] },
    ])
  })

  it('does not merge lines through a transitive rectangle chain', () => {
    expect(groupImageBindingsByVisualLine([
      { paragraphId: 'p-1', objectKey: 'a', sortOrder: 1, rect: { top: 10, bottom: 20 } },
      { paragraphId: 'p-1', objectKey: 'b', sortOrder: 2, rect: { top: 18, bottom: 28 } },
      { paragraphId: 'p-1', objectKey: 'c', sortOrder: 3, rect: { top: 26, bottom: 36 } },
    ])).toEqual([
      { paragraphId: 'p-1', objectKeys: ['a', 'b'] },
      { paragraphId: 'p-1', objectKeys: ['c'] },
    ])
  })

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
