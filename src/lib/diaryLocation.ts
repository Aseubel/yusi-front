import type { GeoLocation } from './location'

export interface DiaryLocationFields {
  latitude?: unknown
  longitude?: unknown
  address?: string
  placeName?: string
  placeId?: string
}

const parseCoordinate = (value: unknown, min: number, max: number): number | null => {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value !== 'number' && typeof value !== 'string') {
    return null
  }
  if (typeof value === 'string' && value.trim() === '') {
    return null
  }

  const coordinate = Number(value)
  return Number.isFinite(coordinate) && coordinate >= min && coordinate <= max
    ? coordinate
    : null
}

export const getDiaryLocation = (diary: DiaryLocationFields): GeoLocation | null => {
  const latitude = parseCoordinate(diary.latitude, -90, 90)
  const longitude = parseCoordinate(diary.longitude, -180, 180)

  if (latitude === null || longitude === null) {
    return null
  }

  return {
    latitude,
    longitude,
    address: diary.address,
    placeName: diary.placeName,
    placeId: diary.placeId
  }
}
