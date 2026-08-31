import type { Response } from 'express'
import { csvBoolean, csvDate, sendCsv } from './csv'

function createResponse() {
  const headers: Record<string, string> = {}
  let body = ''

  const res = {
    send: (content: string) => {
      body = content
      return res
    },
    setHeader: (name: string, value: string) => {
      headers[name] = value
      return res
    },
  } as unknown as Response

  return { getBody: () => body, getHeaders: () => headers, res }
}

describe('sendCsv', () => {
  it('should prefix the payload with a UTF-8 BOM so Excel keeps accents intact', () => {
    const { getBody, res } = createResponse()

    sendCsv(res, [{ nom: 'Communauté de communes du Béarn' }], 'test.csv')

    expect(getBody().startsWith('﻿')).toBe(true)
    expect(getBody()).toContain('Communauté de communes du Béarn')
  })

  it('should use the semicolon delimiter expected by French Excel', () => {
    const { getBody, res } = createResponse()

    sendCsv(res, [{ a: '1', b: '2' }], 'test.csv')

    expect(getBody()).toContain('a;b')
    expect(getBody()).toContain('1;2')
  })

  it('should set the download headers', () => {
    const { getHeaders, res } = createResponse()

    sendCsv(res, [{ a: '1' }], 'connexions-2026-01-01_2026-01-31.csv')

    expect(getHeaders()['Content-Type']).toBe('text/csv; charset=utf-8')
    expect(getHeaders()['Content-Disposition']).toBe('attachment; filename="connexions-2026-01-01_2026-01-31.csv"')
  })

  it('should still emit the header row when there is no data', () => {
    const { getBody, res } = createResponse()

    sendCsv(res, [], 'test.csv', ['mois', 'connexions'])

    // Pas de `.trim()` ici : U+FEFF est considéré comme un blanc et serait retiré avec.
    expect(getBody()).toBe('﻿mois;connexions\r\n')
  })

  it('should quote values containing the delimiter', () => {
    const { getBody, res } = createResponse()

    sendCsv(res, [{ commentaire: 'utile ; mais perfectible' }], 'test.csv')

    expect(getBody()).toContain('"utile ; mais perfectible"')
  })
})

describe('csvDate', () => {
  it.each([
    [new Date('2026-01-15T10:30:00Z'), '2026-01-15'],
    ['2026-01-15T10:30:00Z', '2026-01-15'],
    [null, ''],
    [undefined, ''],
  ])('should format %s as "%s"', (input, expected) => {
    expect(csvDate(input)).toBe(expected)
  })

  it('should return an empty string for an unparseable date', () => {
    expect(csvDate('pas une date')).toBe('')
  })
})

describe('csvBoolean', () => {
  it.each([
    [true, 'oui'],
    [false, 'non'],
    [null, 'non'],
  ])('should format %s as "%s"', (input, expected) => {
    expect(csvBoolean(input)).toBe(expected)
  })
})
