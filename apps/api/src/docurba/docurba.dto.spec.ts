import { ZDocurbaEpcisQuery } from './docurba.dto'

/** Seule chose qui empêche une requête anonyme de provoquer autant d'appels sortants qu'elle contient de codes. */
describe('ZDocurbaEpcisQuery', () => {
  const codesOf = (codes: string) => ZDocurbaEpcisQuery.parse({ codes }).codes

  it('should split a comma-separated list', () => {
    expect(codesOf('200069672,200040590')).toEqual(['200069672', '200040590'])
  })

  it('should tolerate the spacing and trailing commas a hand-written URL carries', () => {
    expect(codesOf(' 200069672 , 200040590 ,')).toEqual(['200069672', '200040590'])
  })

  it('should refuse more codes than one territory can hold', () => {
    const fifty = Array.from({ length: 50 }, (_, i) => String(200_000_000 + i)).join(',')
    expect(() => codesOf(fifty)).not.toThrow()
    expect(() => codesOf(`${fifty},200000050`)).toThrow()
  })

  /** Le format SIREN borne l'ensemble des valeurs possibles. */
  it('should refuse anything that is not a SIREN', () => {
    expect(() => codesOf('abc')).toThrow()
    expect(() => codesOf('20006967')).toThrow()
    expect(() => codesOf('2000696721')).toThrow()
    expect(() => codesOf('../../etc/passwd')).toThrow()
    expect(() => codesOf('200069672,abc')).toThrow()
  })

  it('should refuse an empty list rather than answer nothing', () => {
    expect(() => codesOf('')).toThrow()
    expect(() => codesOf(' , ')).toThrow()
  })
})
