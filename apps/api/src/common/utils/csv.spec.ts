import type { Response } from 'express'
import { sendCsv } from './csv'

/**
 * Une cellule commençant par `=` est exécutée à l'ouverture du fichier. Ces exports
 * reprennent le prénom fourni au formulaire d'inscription, ouvert aux anonymes.
 */
describe('sendCsv', () => {
  const capture = () => {
    let body = ''
    const res = {
      setHeader: jest.fn(),
      send: jest.fn((value: string) => {
        body = value
      }),
    } as unknown as Response
    return { res, read: () => body }
  }

  const exportOf = (rows: Array<Record<string, unknown>>) => {
    const { res, read } = capture()
    sendCsv(res, rows, 'export.csv')
    return read()
  }

  it.each([
    ["=cmd|' /C calc'!A1", 'formule'],
    ['+1+1', 'addition'],
    ['-1+1', 'soustraction'],
    ['@SUM(A1:A9)', 'appel de fonction'],
  ])('should neutralise a cell starting with %s (%s)', (payload) => {
    const csv = exportOf([{ Prénom: payload }])

    expect(csv).toContain(`'${payload}`)
  })

  it('should neutralise the separators a spreadsheet consumes before reading', () => {
    expect(exportOf([{ Prénom: '\t=1+1' }])).toContain("'\t=1+1")
    expect(exportOf([{ Prénom: '\r=1+1' }])).toContain("'\r=1+1")
  })

  it('should leave ordinary values untouched', () => {
    const csv = exportOf([{ Nom: 'Martin', Prénom: 'Agnès', Rôle: 'USER' }])

    expect(csv).toContain('Agnès')
    expect(csv).not.toContain("'Agnès")
    expect(csv).not.toContain("'Martin")
  })

  it('should cope with empty and non-string values', () => {
    expect(() => exportOf([{ a: '', b: null, c: 42, d: undefined, e: true }])).not.toThrow()
  })

  it('should keep serving the header row when there is nothing to export', () => {
    const { res, read } = capture()
    sendCsv(res, [], 'export.csv', ['Nom', 'Prénom'])

    expect(read()).toContain('Nom')
    expect(read()).toContain('Prénom')
  })
})
