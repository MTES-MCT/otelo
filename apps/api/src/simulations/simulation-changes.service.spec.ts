import { computeScenarioDiff } from './simulation-changes.service'

describe('computeScenarioDiff', () => {
  it('should report a changed scenario field with its business label', () => {
    const changes = computeScenarioDiff({ b13_taux_effort: 30 }, { b13_taux_effort: 35 })

    expect(changes).toEqual([{ field: 'b13_taux_effort', label: 'Taux d’effort (%)', before: 30, after: 35 }])
  })

  it('should report nothing when nothing changed', () => {
    expect(computeScenarioDiff({ b13_taux_effort: 30, projection: 2030 }, { b13_taux_effort: 30, projection: 2030 })).toEqual([])
  })

  it('should ignore fields absent from the submission rather than treating them as cleared', () => {
    // Les formulaires de modification n'envoient qu'une partie du scénario : les champs
    // manquants ne sont pas des remises à zéro.
    const changes = computeScenarioDiff({ b13_taux_effort: 30, projection: 2030 }, { projection: 2040 })

    expect(changes).toHaveLength(1)
    expect(changes[0].field).toBe('projection')
  })

  it('should ignore technical fields', () => {
    const changes = computeScenarioDiff(
      { id: 'a', userId: 'u1', updatedAt: new Date('2026-01-01'), projection: 2030 },
      { id: 'b', userId: 'u2', updatedAt: new Date('2026-02-01'), projection: 2030 },
    )

    expect(changes).toEqual([])
  })

  it('should not report a float difference below the comparison tolerance', () => {
    // Les taux sont recalculés à chaque enregistrement : une égalité stricte signalerait
    // des modifications inexistantes.
    const changes = computeScenarioDiff(
      { epciScenarios: [{ epciCode: '200000172', b2_tx_vacance: 0.1 + 0.2 }] },
      { epciScenarios: [{ epciCode: '200000172', b2_tx_vacance: 0.3 }] },
    )

    expect(changes).toEqual([])
  })

  it('should report a per-EPCI rate change with the EPCI code', () => {
    const changes = computeScenarioDiff(
      { epciScenarios: [{ epciCode: '200000172', b2_tx_vacance_longue: 0.05 }] },
      { epciScenarios: [{ epciCode: '200000172', b2_tx_vacance_longue: 0.03 }] },
    )

    expect(changes).toEqual([
      {
        field: '200000172.b2_tx_vacance_longue',
        label: 'Taux de vacance longue durée — 200000172',
        epciCode: '200000172',
        before: 0.05,
        after: 0.03,
      },
    ])
  })

  it('should skip an EPCI absent from the previous state', () => {
    const changes = computeScenarioDiff({ epciScenarios: [] }, { epciScenarios: [{ epciCode: '200000172', b2_tx_vacance: 0.05 }] })

    expect(changes).toEqual([])
  })

  it('should compare enum arrays regardless of order', () => {
    // Prisma ne garantit pas l'ordre des tableaux d'énumération.
    const changes = computeScenarioDiff({ b11_etablissement: ['a', 'b'] }, { b11_etablissement: ['b', 'a'] })

    expect(changes).toEqual([])
  })

  it('should report an enum array whose content actually changed', () => {
    const changes = computeScenarioDiff({ b11_etablissement: ['a', 'b'] }, { b11_etablissement: ['a', 'c'] })

    expect(changes).toHaveLength(1)
    expect(changes[0].field).toBe('b11_etablissement')
  })

  it('should treat a null-to-value transition as a change', () => {
    const changes = computeScenarioDiff({ b14_qualite: null }, { b14_qualite: 'rp_qualite' })

    expect(changes).toEqual([{ field: 'b14_qualite', label: 'Critère de qualité', before: null, after: 'rp_qualite' }])
  })

  it('should report several changes in a single submission', () => {
    const changes = computeScenarioDiff(
      { projection: 2030, b13_taux_effort: 30, epciScenarios: [{ epciCode: '1', b2_tx_rs: 0.1 }] },
      { projection: 2040, b13_taux_effort: 35, epciScenarios: [{ epciCode: '1', b2_tx_rs: 0.2 }] },
    )

    expect(changes.map((change) => change.field)).toEqual(['projection', 'b13_taux_effort', '1.b2_tx_rs'])
  })
})
