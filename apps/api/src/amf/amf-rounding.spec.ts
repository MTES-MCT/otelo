import { roundForDisplay, toRange } from './amf-rounding'

describe('roundForDisplay', () => {
  it("arrondit à l'unité sous 100", () => {
    expect(roundForDisplay(7.4)).toBe(7)
    expect(roundForDisplay(87.6)).toBe(88)
    expect(roundForDisplay(0.3)).toBe(0)
    expect(roundForDisplay(-0.3)).toBe(0)
  })

  it('garde deux chiffres significatifs au-delà', () => {
    expect(roundForDisplay(344)).toBe(340)
    expect(roundForDisplay(1234)).toBe(1200)
    expect(roundForDisplay(1260)).toBe(1300)
    expect(roundForDisplay(-4817)).toBe(-4800)
  })
})

describe('toRange', () => {
  it('ordonne les bornes', () => {
    expect(toRange(420, 310)).toEqual({ min: 310, max: 420 })
  })

  it('renvoie null quand les deux bornes valent 0', () => {
    expect(toRange(0.2, -0.4)).toBeNull()
  })

  it('garde une fourchette négative', () => {
    expect(toRange(-12, -30)).toEqual({ min: -30, max: -12 })
  })
})
