import { aggregateAcrossEpcis } from './aggregate-across-epcis'

const POPULATION_KEYS = ['basse', 'central', 'haute'] as const

const entry = (data: Array<{ year: number; basse: number | null; central: number | null; haute: number | null }>) => ({
  data,
  metadata: { max: 0, min: 0 },
})

describe('aggregateAcrossEpcis', () => {
  it('somme les scénarios présents chez tous les EPCI', () => {
    const result = aggregateAcrossEpcis(
      {
        A: entry([{ year: 2022, basse: 100, central: 200, haute: 300 }]),
        B: entry([{ year: 2022, basse: 10, central: 20, haute: 30 }]),
      },
      POPULATION_KEYS,
    )

    expect(result?.data).toEqual([{ year: 2022, basse: 110, central: 220, haute: 330 }])
  })

  it('propage null dès qu un seul EPCI n a pas le scénario, sans corrompre les autres', () => {
    // Cas réel : certains EPCI (Dordogne) n'ont pas de projection « basse ».
    const result = aggregateAcrossEpcis(
      {
        A: entry([{ year: 2022, basse: 100, central: 200, haute: 300 }]),
        B: entry([{ year: 2022, basse: null, central: 20, haute: 30 }]),
      },
      POPULATION_KEYS,
    )

    expect(result?.data[0].basse).toBeNull()
    // Sommer le null comme un zéro aurait donné 100 : une courbe faussement basse.
    expect(result?.data[0].central).toBe(220)
  })

  it('exclut les null des bornes, pour ne pas écraser l axe des ordonnées', () => {
    const result = aggregateAcrossEpcis(
      {
        A: entry([
          { year: 2022, basse: null, central: 200, haute: 300 },
          { year: 2030, basse: null, central: 240, haute: 360 },
        ]),
        B: entry([
          { year: 2022, basse: null, central: 20, haute: 30 },
          { year: 2030, basse: null, central: 24, haute: 36 },
        ]),
      },
      POPULATION_KEYS,
    )

    // Sans filtre sur les null, min valait 0 et toutes les courbes étaient tassées en haut.
    expect(result?.metadata.min).toBe(220)
    expect(result?.metadata.max).toBe(396)
  })

  it('ne retient que les années couvertes par tous les EPCI', () => {
    const result = aggregateAcrossEpcis(
      {
        A: entry([
          { year: 2022, basse: 1, central: 2, haute: 3 },
          { year: 2030, basse: 1, central: 2, haute: 3 },
          { year: 2050, basse: 1, central: 2, haute: 3 },
        ]),
        B: entry([
          { year: 2022, basse: 1, central: 2, haute: 3 },
          { year: 2030, basse: 1, central: 2, haute: 3 },
        ]),
      },
      POPULATION_KEYS,
    )

    // 2050 n'est couverte que par A : la retenir produirait une somme partielle,
    // indiscernable d'une chute réelle du territoire.
    expect(result?.data.map((row) => row.year)).toEqual([2022, 2030])
  })

  it('rend la série inchangée pour un EPCI unique', () => {
    const data = [{ year: 2022, basse: 100, central: 200, haute: 300 }]

    expect(aggregateAcrossEpcis({ A: entry(data) }, POPULATION_KEYS)?.data).toEqual(data)
  })

  it('ignore une clé d agrégat déjà présente en entrée', () => {
    const result = aggregateAcrossEpcis(
      {
        A: entry([{ year: 2022, basse: 100, central: 200, haute: 300 }]),
        all: entry([{ year: 2022, basse: 999, central: 999, haute: 999 }]),
      },
      POPULATION_KEYS,
    )

    expect(result?.data).toEqual([{ year: 2022, basse: 100, central: 200, haute: 300 }])
  })

  it('renvoie null quand aucune année n est commune', () => {
    const result = aggregateAcrossEpcis(
      {
        A: entry([{ year: 2022, basse: 1, central: 2, haute: 3 }]),
        B: entry([{ year: 2030, basse: 1, central: 2, haute: 3 }]),
      },
      POPULATION_KEYS,
    )

    // L'appelant omet alors la clé, plutôt que de sérialiser des bornes infinies.
    expect(result).toBeNull()
  })

  it('renvoie null quand aucun scénario n est exploitable', () => {
    const result = aggregateAcrossEpcis(
      {
        A: entry([{ year: 2022, basse: null, central: null, haute: null }]),
        B: entry([{ year: 2022, basse: null, central: null, haute: null }]),
      },
      POPULATION_KEYS,
    )

    expect(result).toBeNull()
  })

  it('renvoie null pour un périmètre vide', () => {
    expect(aggregateAcrossEpcis({}, POPULATION_KEYS)).toBeNull()
  })
})
