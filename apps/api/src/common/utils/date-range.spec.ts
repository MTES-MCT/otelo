import { BadRequestException } from '@nestjs/common'
import { DEFAULT_RANGE_DAYS, formatRangeForFilename, resolveDateRange } from './date-range'

describe('resolveDateRange', () => {
  it('should use a half-open upper bound so the whole "to" day is included', () => {
    const { from, toExclusive } = resolveDateRange('2026-01-01', '2026-01-31')

    expect(from.toISOString()).toBe('2026-01-01T00:00:00.000Z')
    expect(toExclusive.toISOString()).toBe('2026-02-01T00:00:00.000Z')
  })

  it('should accept a single-day range', () => {
    const { from, toExclusive } = resolveDateRange('2026-01-15', '2026-01-15')

    expect(from.toISOString()).toBe('2026-01-15T00:00:00.000Z')
    expect(toExclusive.toISOString()).toBe('2026-01-16T00:00:00.000Z')
  })

  it('should cross a month boundary correctly', () => {
    const { toExclusive } = resolveDateRange('2026-01-01', '2026-02-28')

    expect(toExclusive.toISOString()).toBe('2026-03-01T00:00:00.000Z')
  })

  it('should default to the last 30 days when no bound is given', () => {
    const { from, toExclusive } = resolveDateRange()
    const spanInDays = (toExclusive.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)

    expect(spanInDays).toBe(DEFAULT_RANGE_DAYS)
  })

  it('should reject a partially provided range rather than silently defaulting', () => {
    expect(() => resolveDateRange('2026-01-01')).toThrow(BadRequestException)
    expect(() => resolveDateRange(undefined, '2026-01-31')).toThrow(BadRequestException)
  })

  it('should reject a malformed date', () => {
    expect(() => resolveDateRange('01/01/2026', '2026-01-31')).toThrow(BadRequestException)
    expect(() => resolveDateRange('2026-13-45', '2026-01-31')).toThrow(BadRequestException)
  })

  it('should reject an inverted range', () => {
    expect(() => resolveDateRange('2026-02-01', '2026-01-01')).toThrow(BadRequestException)
  })
})

describe('formatRangeForFilename', () => {
  it('should use the inclusive end date, not the exclusive bound', () => {
    const range = resolveDateRange('2026-01-01', '2026-01-31')

    expect(formatRangeForFilename(range)).toBe('2026-01-01_2026-01-31')
  })
})
