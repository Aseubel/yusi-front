import { describe, expect, it } from 'vitest'
import { getDiaryLocation } from './diaryLocation'

describe('getDiaryLocation', () => {
  it('does not create a selection for a diary without coordinates', () => {
    expect(getDiaryLocation({ latitude: null, longitude: null })).toBeNull()
  })

  it('does not treat empty coordinate values as the origin', () => {
    expect(getDiaryLocation({ latitude: '', longitude: '' })).toBeNull()
  })

  it('keeps valid zero coordinates because zero is a real coordinate', () => {
    expect(getDiaryLocation({ latitude: 0, longitude: 0, placeName: 'Origin' })).toEqual({
      latitude: 0,
      longitude: 0,
      address: undefined,
      placeName: 'Origin',
      placeId: undefined
    })
  })

  it('requires both coordinates and rejects out-of-range values', () => {
    expect(getDiaryLocation({ latitude: 31.2 })).toBeNull()
    expect(getDiaryLocation({ latitude: 91, longitude: 120 })).toBeNull()
  })
})
