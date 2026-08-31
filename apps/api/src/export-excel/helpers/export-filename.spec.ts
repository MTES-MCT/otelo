import { buildExportFilename } from './export-filename'

const BORDEAUX = { code: '243300316', name: 'Bordeaux Métropole' }
const CREONNAIS = { code: '243301215', name: 'CC du Créonnais' }

describe('buildExportFilename', () => {
  it("utilise le nom de l'EPCI de base quand il est désigné", () => {
    const filename = buildExportFilename({
      name: 'Scénario central',
      epcis: [BORDEAUX, CREONNAIS],
      epciGroup: { name: 'test' },
      scenario: {
        epciScenarios: [
          { epciCode: CREONNAIS.code, baseEpci: false },
          { epciCode: BORDEAUX.code, baseEpci: true },
        ],
      },
    })

    expect(filename).toBe('Votre scenario Otelo - Bordeaux Métropole - Scénario central.xlsx')
  })

  it("retombe sur le nom du groupe d'EPCI quand aucun EPCI de base n'est désigné", () => {
    const filename = buildExportFilename({
      name: 'Scénario ',
      epcis: [BORDEAUX, CREONNAIS],
      epciGroup: { name: 'test' },
      scenario: {
        epciScenarios: [
          { epciCode: BORDEAUX.code, baseEpci: false },
          { epciCode: CREONNAIS.code, baseEpci: false },
        ],
      },
    })

    expect(filename).toBe('Votre scenario Otelo - test - Scénario.xlsx')
  })

  it('retombe sur le premier EPCI sans EPCI de base ni groupe', () => {
    const filename = buildExportFilename({
      name: 'Scénario',
      epcis: [BORDEAUX],
      epciGroup: null,
      scenario: { epciScenarios: [{ epciCode: BORDEAUX.code, baseEpci: false }] },
    })

    expect(filename).toBe('Votre scenario Otelo - Bordeaux Métropole - Scénario.xlsx')
  })

  it('omet le segment territoire plutôt que d’écrire « undefined »', () => {
    const filename = buildExportFilename({
      name: 'Scénario',
      epcis: [],
      epciGroup: null,
      scenario: { epciScenarios: [] },
    })

    expect(filename).toBe('Votre scenario Otelo - Scénario.xlsx')
    expect(filename).not.toContain('undefined')
  })
})
