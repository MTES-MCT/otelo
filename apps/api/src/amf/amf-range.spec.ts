import { COARSE_STEPS, FINE_STEPS, toRange } from './amf-range'

describe('toRange', () => {
  it.each([
    [26389, 25000, 30000],
    [1240, 1200, 1500],
    [640, 600, 700],
    [8300, 8000, 10000],
    [120, 120, 150],
    [99, 80, 100],
    [50, 50, 60],
    [1500, 1500, 2000],
  ])('encadre %i entre %i et %i avec les paliers fins', (value, min, max) => {
    expect(toRange(value, FINE_STEPS, 50)).toEqual({ min, max })
  })

  it.each([
    [26389, 20000, 50000],
    [1217, 1000, 2000],
    [203, 200, 500],
    [99, 50, 100],
  ])('encadre %i entre %i et %i avec les paliers larges', (value, min, max) => {
    expect(toRange(value, COARSE_STEPS, 50)).toEqual({ min, max })
  })

  it('renvoie « moins de » sous le plancher', () => {
    expect(toRange(49, FINE_STEPS, 50)).toEqual({ min: 0, max: 50 })
    expect(toRange(0, FINE_STEPS, 50)).toEqual({ min: 0, max: 50 })
    expect(toRange(7, FINE_STEPS, 10)).toEqual({ min: 0, max: 10 })
  })

  it('renvoie une fourchette négative pour une valeur négative', () => {
    expect(toRange(-320, COARSE_STEPS, 50)).toEqual({ min: -500, max: -200 })
    expect(toRange(-12, COARSE_STEPS, 50)).toEqual({ min: -50, max: 0 })
  })
})
