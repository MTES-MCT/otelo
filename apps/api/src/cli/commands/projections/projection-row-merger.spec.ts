import { type ProjectionMeasureRow, ProjectionRowMerger, ProjectionZoneStatsAccumulator } from './projection-row-merger'

/** Construit une ligne de mesure, les valeurs manquantes étant `null`. */
function row(
  year: number,
  values: Partial<Record<'centralB' | 'centralC' | 'centralH' | 'phB' | 'phC' | 'phH' | 'pbB' | 'pbC' | 'pbH', number>>,
  overrides: Partial<ProjectionMeasureRow> = {},
): ProjectionMeasureRow {
  return {
    zoneCode: 'R75_24-1_23',
    year,
    age: null,
    dimensionValue: null,
    values: [
      values.centralB ?? null,
      values.centralC ?? null,
      values.centralH ?? null,
      values.phB ?? null,
      values.phC ?? null,
      values.phH ?? null,
      values.pbB ?? null,
      values.pbC ?? null,
      values.pbH ?? null,
    ],
    ...overrides,
  }
}

describe('ProjectionRowMerger', () => {
  it('laisse passer immédiatement les années postérieures au recensement', () => {
    const merger = new ProjectionRowMerger()
    const input = row(2019, { centralC: 42 })

    expect(merger.add(input)).toBe(input)
    expect(merger.drain()).toEqual([])
  })

  it('recompose la ligne 2018 des bassins de Dordogne à partir de ses deux moitiés', () => {
    // Cas réel : `R75_24-1_23` porte deux lignes 2018 dans la source. Celle marquée
    // ind_robust = 0 ne renseigne que la population basse, l'autre le reste.
    const merger = new ProjectionRowMerger()

    expect(merger.add(row(2018, { pbB: 80504, pbC: 80504, pbH: 80504 }))).toBeNull()
    expect(merger.add(row(2018, { centralB: 80504, centralC: 80504, centralH: 80504, phB: 80504, phC: 80504, phH: 80504 }))).toBeNull()

    const merged = merger.drain()
    expect(merged).toHaveLength(1)
    expect(merged[0].values).toEqual([80504, 80504, 80504, 80504, 80504, 80504, 80504, 80504, 80504])
    expect(merger.warnings).toEqual([])
  })

  it('fusionne indépendamment de l’ordre d’arrivée', () => {
    const merger = new ProjectionRowMerger()
    merger.add(row(2018, { centralC: 10 }))
    merger.add(row(2018, { pbC: 20 }))

    expect(merger.drain()[0].values).toEqual([null, 10, null, null, null, null, null, 20, null])
  })

  it('sépare les lignes 2018 par âge et par modalité', () => {
    const merger = new ProjectionRowMerger()
    merger.add(row(2018, { centralC: 1 }, { age: 30, dimensionValue: 'HOMME' }))
    merger.add(row(2018, { centralC: 2 }, { age: 30, dimensionValue: 'FEMME' }))
    merger.add(row(2018, { centralC: 3 }, { age: 31, dimensionValue: 'HOMME' }))

    const drained = merger.drain()
    expect(drained).toHaveLength(3)
    expect(drained.map((entry) => entry.values[1])).toEqual([1, 2, 3])
  })

  it('signale une divergence entre deux valeurs non nulles et conserve la première', () => {
    const merger = new ProjectionRowMerger()
    merger.add(row(2018, { centralC: 100 }))
    merger.add(row(2018, { centralC: 200 }))

    const merged = merger.drain()
    expect(merged[0].values[1]).toBe(100)
    expect(merger.warnings).toHaveLength(1)
    expect(merger.warnings[0]).toContain('central_c')
    expect(merger.warnings[0]).toContain('100 conservé, 200 ignoré')
  })

  it('ne signale rien quand la valeur entrante est nulle', () => {
    const merger = new ProjectionRowMerger()
    merger.add(row(2018, { centralC: 100 }))
    merger.add(row(2018, {}))

    expect(merger.drain()[0].values[1]).toBe(100)
    expect(merger.warnings).toEqual([])
  })

  it('vide son tampon à chaque drain', () => {
    const merger = new ProjectionRowMerger()
    merger.add(row(2018, { centralC: 1 }))

    expect(merger.drain()).toHaveLength(1)
    expect(merger.drain()).toEqual([])
  })
})

describe('ProjectionZoneStatsAccumulator', () => {
  it('retient l’amplitude des années vues', () => {
    const stats = new ProjectionZoneStatsAccumulator()
    for (const year of [2030, 2018, 2050]) {
      stats.record('200006682', year, true)
    }

    expect(stats.values()).toEqual([{ zoneCode: '200006682', isRobust: true, firstYear: 2018, lastYear: 2050 }])
  })

  it('classe non projetée une zone qui ne porte que l’année de recensement', () => {
    const stats = new ProjectionZoneStatsAccumulator()
    stats.record('R11_BCN_23', 2018, false)

    expect(stats.values()).toEqual([{ zoneCode: 'R11_BCN_23', isRobust: false, firstYear: 2018, lastYear: 2018 }])
  })

  it('classe robuste un bassin de Dordogne, dont seule une ligne 2018 est marquée non robuste', () => {
    // Le OU logique est le comportement voulu : ces bassins SONT projetés, c'est un seul de leurs
    // scénarios qui manque — information portée par la nullité des colonnes pb_*.
    const stats = new ProjectionZoneStatsAccumulator()
    stats.record('R75_24-1_23', 2018, false)
    stats.record('R75_24-1_23', 2018, true)
    stats.record('R75_24-1_23', 2050, true)

    expect(stats.values()).toEqual([{ zoneCode: 'R75_24-1_23', isRobust: true, firstYear: 2018, lastYear: 2050 }])
  })
})
