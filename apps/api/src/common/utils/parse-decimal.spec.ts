import { parseDecimal } from './parse-decimal'

describe('parseDecimal', () => {
  it.each([
    ['12,5', 12.5],
    ['12.5', 12.5],
    ['12', 12],
    ['-3,25', -3.25],
    ['1 234,5', 1234.5],
    ['1 234,5', 1234.5],
    ['1 234,5', 1234.5],
    [' 42 ', 42],
    [7.5, 7.5],
  ])('should parse %p as %p', (raw, expected) => {
    expect(parseDecimal(raw)).toBe(expected)
  })

  it.each(['', '   ', null, undefined])('should return null for empty value %p', (raw) => {
    expect(parseDecimal(raw)).toBeNull()
  })

  it.each(['abc', '1,2,3', '1,234.5', '0x10', '1e3', 'Infinity', Number.NaN])('should reject %p', (raw) => {
    expect(() => parseDecimal(raw)).toThrow('Valeur numérique invalide')
  })
})
