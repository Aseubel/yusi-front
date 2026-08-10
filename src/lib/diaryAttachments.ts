export type DiaryAttachmentType = 'IMAGE' | 'AUDIO' | (string & {})

export type DiaryAttachmentDisplayMode = 'INLINE' | 'TRIGGER'

export interface DiaryAttachmentBinding {
  type: DiaryAttachmentType
  objectKey: string
  paragraphId: string
  sortOrder: number
  url?: string
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null
)

export const parseDiaryAttachmentBindings = (value: unknown): DiaryAttachmentBinding[] => {
  if (!Array.isArray(value)) return []

  return value.flatMap((item, index) => {
    if (!isRecord(item)) return []
    const type = typeof item.type === 'string' ? item.type : ''
    const objectKey = typeof item.objectKey === 'string' ? item.objectKey : ''
    const paragraphId = typeof item.paragraphId === 'string' ? item.paragraphId : ''
    if (!type || !objectKey || !paragraphId) return []

    return [{
      type,
      objectKey,
      paragraphId,
      sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : index,
      url: typeof item.url === 'string' ? item.url : undefined,
    }]
  })
}

export const serializeDiaryAttachmentBindings = (bindings: DiaryAttachmentBinding[]): DiaryAttachmentBinding[] => (
  bindings.map(({ type, objectKey, paragraphId, sortOrder }) => ({
    type,
    objectKey,
    paragraphId,
    sortOrder,
  }))
)

export const sortDiaryAttachmentBindings = (bindings: DiaryAttachmentBinding[]): DiaryAttachmentBinding[] => (
  [...bindings].sort((left, right) => left.sortOrder - right.sortOrder)
)
