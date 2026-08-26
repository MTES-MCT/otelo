/**
 * Pyramide des âges — miroir des types renvoyés par `GET /data-visualisation?type=pyramide-des-ages`.
 *
 * La réponse porte le détail par âge et toutes les années de la projection : la restitution règle
 * la densité et l'année sans recharger, un appel par cran de curseur la rendrait inutilisable.
 */

export type TAgePyramidPopulationType = 'basse' | 'central' | 'haute'

/** Effectifs d'un âge, indexés comme `years`. */
export type TAgePyramidAge = {
  age: number
  men: number[]
  women: number[]
}

export type TAgePyramidAvailable = {
  available: true
  zone: {
    code: string
    level: 'EPCI' | 'BH'
    label: string
    epciCode: string | null
    bassinName: string | null
  }
  /** `BASSIN` : les effectifs sont ceux du bassin d'habitat, l'EPCI n'ayant pas de projection propre. */
  coverage: 'EPCI' | 'BASSIN'
  populationType: TAgePyramidPopulationType
  referenceYear: number
  years: number[]
  ages: TAgePyramidAge[]
}

export type TAgePyramidUnavailable = {
  available: false
  epciCode: string
  reason: 'NO_PROJECTION' | 'AMBIGUOUS_BASSIN'
}

export type TAgePyramid = TAgePyramidAvailable | TAgePyramidUnavailable

/** Amplitude d'une tranche quinquennale, convention Insee. */
export const AGE_BAND_SIZE = 5

/** `99` regroupe « 99 ans et plus » dans la source. */
export const MAX_AGE = 99

export type TAgePyramidBand = {
  label: string
  ageFrom: number
  ageTo: number
  men: number
  women: number
  menRef: number
  womenRef: number
}

/**
 * Réduit les séries par âge aux deux années comparées, éventuellement regroupées en tranches
 * quinquennales, dans l'ordre d'affichage — les plus âgés en haut.
 *
 * ⚠ Ne jamais reconstituer une répartition à partir de `ProjectionAgeGroup` : ses six tranches
 * **se recouvrent**, `85+` étant inclus dans `65+`.
 */
export function toAgePyramidBands(
  ages: TAgePyramidAge[],
  referenceIndex: number,
  yearIndex: number,
  density: 'quinquennal' | 'age',
): TAgePyramidBand[] {
  const bands: TAgePyramidBand[] = []

  const push = (label: string, ageFrom: number, ageTo: number, entries: TAgePyramidAge[]) => {
    const sum = (pick: (entry: TAgePyramidAge) => number[], index: number) =>
      entries.reduce((total, entry) => total + (pick(entry)[index] ?? 0), 0)

    bands.push({
      label,
      ageFrom,
      ageTo,
      men: sum((entry) => entry.men, yearIndex),
      women: sum((entry) => entry.women, yearIndex),
      menRef: sum((entry) => entry.men, referenceIndex),
      womenRef: sum((entry) => entry.women, referenceIndex),
    })
  }

  if (density === 'age') {
    for (const entry of ages) {
      push(entry.age === MAX_AGE ? `${MAX_AGE} +` : String(entry.age), entry.age, entry.age, [entry])
    }
  } else {
    for (let ageFrom = 0; ageFrom <= MAX_AGE; ageFrom += AGE_BAND_SIZE) {
      const ageTo = Math.min(ageFrom + AGE_BAND_SIZE - 1, MAX_AGE)
      const isLast = ageTo >= MAX_AGE
      push(
        isLast ? `${ageFrom} +` : `${ageFrom}–${ageTo}`,
        ageFrom,
        ageTo,
        ages.filter((entry) => entry.age >= ageFrom && entry.age <= ageTo),
      )
    }
  }

  return bands.reverse()
}

/** Population totale d'une année, toutes tranches et deux sexes confondus. */
export function totalAtYear(ages: TAgePyramidAge[], yearIndex: number): number {
  return ages.reduce((total, entry) => total + (entry.men[yearIndex] ?? 0) + (entry.women[yearIndex] ?? 0), 0)
}

/** Effectif d'une plage d'âges, bornes comprises. */
export function sumAgeRange(ages: TAgePyramidAge[], yearIndex: number, ageFrom: number, ageTo: number): number {
  return ages
    .filter((entry) => entry.age >= ageFrom && entry.age <= ageTo)
    .reduce((total, entry) => total + (entry.men[yearIndex] ?? 0) + (entry.women[yearIndex] ?? 0), 0)
}
