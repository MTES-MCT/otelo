/** Les dix termes du besoin, dans l'ordre de lecture de la carte d'estimation (A → J). */
export type EstimationTermKey =
  /** A — évolution du nombre de ménages */
  | 'demographic'
  /** B — situations de mal-logement générant un besoin en logements supplémentaires */
  | 'badHousing'
  /** C — maintien de la fluidité du parc */
  | 'fluidity'
  /** D — augmentation des logements vacants de longue durée */
  | 'vacancyIncrease'
  /** E — augmentation des résidences secondaires */
  | 'secondaryIncrease'
  /** F — disparition de logements excédant les apparitions */
  | 'disappearanceSurplus'
  /** G — remobilisation de logements vacants de longue durée */
  | 'vacancyRemobilised'
  /** H — diminution du nombre de résidences secondaires */
  | 'secondaryDecrease'
  /** I — apparition de logements excédant les disparitions */
  | 'appearanceSurplus'
  /** J — libération de logements vacants de courte durée */
  | 'fluidityReleased'

/**
 * Ce dont la décomposition a besoin, et rien de plus.
 *
 * Le type est structurel plutôt que rattaché à un schéma : le front et l'API décrivent leurs
 * résultats avec des schémas différents (`ZResults` côté web, `ZResultsBase` côté API), et les
 * deux doivent pouvoir alimenter la même fonction — c'est précisément ce qui garantit que l'encart
 * d'estimation et la page de résultats parlent des mêmes chiffres.
 */
export type EstimationBreakdownInput = {
  epcisTotals: Array<{ epciCode: string; total: number; totalFlux: number }>
  flowRequirement: {
    epcis: Array<{
      code: string
      totals: {
        demographicEvolution: number
        renewalNeeds: number
        secondaryResidenceAccomodationEvolution: number
        shortTermVacantAccomodation: number
        longTermVacantAccomodation: number
      }
    }>
  }
}

/**
 * Tous les termes sont positifs ou nuls — sauf A, qui suit la démographie et peut être négatif sur
 * un territoire en décroissance. G, H, I et J sont des volumes mobilisables, pas des déductions
 * signées.
 *
 * `epciCounts` compte, pour chaque terme, les EPCI qui y contribuent réellement. C'est ce qui permet
 * d'expliquer en vue agrégée qu'une augmentation et une remobilisation coexistent.
 */
export type EstimationBreakdown = {
  values: Record<EstimationTermKey, number>
  epciCounts: Record<EstimationTermKey, number>
}

const TERM_KEYS: EstimationTermKey[] = [
  'demographic',
  'badHousing',
  'fluidity',
  'vacancyIncrease',
  'secondaryIncrease',
  'disappearanceSurplus',
  'vacancyRemobilised',
  'secondaryDecrease',
  'appearanceSurplus',
  'fluidityReleased',
]

const emptyRecord = (): Record<EstimationTermKey, number> =>
  TERM_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {} as Record<EstimationTermKey, number>)

/** Un EPCI alimente-t-il le total ? Le moteur écarte ceux dont le besoin de constructions neuves est négatif. */
export const isEpciCountedInTotal = (results: EstimationBreakdownInput, epciCode: string): boolean =>
  (results.epcisTotals.find((epci) => epci.epciCode === epciCode)?.total ?? 0) > 0

/**
 * Décompose `results` en ses dix termes, de sorte que `(A+B+C+D+E+F) − (G+H+I+J) === results.total`.
 *
 * Trois précautions gouvernent ce calcul :
 *
 * 1. **Seuls les EPCI qui alimentent le total sont comptés.** `NeedsCalculationService` écarte du
 *    total ceux dont le besoin de constructions neuves est négatif — sommer `flowRequirement` sur
 *    tous les EPCI, ou reprendre `results.totalStock` (accumulé lui sans ce filtre), ferait diverger
 *    la carte de son propre total. Le critère est `epcisTotals[].total > 0`, cette valeur étant
 *    précisément le besoin de constructions neuves de l'EPCI.
 * 2. **Le découpage des termes signés se fait par EPCI, avant la somme.** Vacance longue, vacance
 *    courte, résidences secondaires et renouvellement créent un besoin quand ils sont positifs et
 *    libèrent du parc quand ils sont négatifs : un territoire peut faire les deux à la fois selon
 *    l'EPCI, ce qu'une somme préalable effacerait. C'est aussi l'ordre qu'appliquent
 *    `NeedsCalculationService` (`vacantAccomodation`, `secondaryAccommodation`) et les donuts de la
 *    page de résultats : le changer ferait diverger l'encart de ces écrans, alors que les deux
 *    doivent afficher les mêmes chiffres.
 * 3. **Restreindre à un EPCI ne demande aucune requête.** `results` porte déjà le détail par EPCI :
 *    `options.epciCode` ne fait que réduire le périmètre de la boucle.
 *
 * Le mal-logement (B) se déduit de `total − totalFlux`, c'est-à-dire la part de stock que le moteur a
 * effectivement retenue pour cet EPCI, soit `epcisTotals[].prepeakTotalStock`.
 */
export const buildEstimationBreakdown = (
  results: EstimationBreakdownInput,
  options?: { epciCode?: string | null },
): EstimationBreakdown => {
  const values = emptyRecord()
  const epciCounts = emptyRecord()

  const add = (key: EstimationTermKey, value: number) => {
    values[key] += value
    if (value > 0) epciCounts[key] += 1
  }

  for (const epciTotals of results.epcisTotals) {
    if (options?.epciCode && epciTotals.epciCode !== options.epciCode) continue
    if (epciTotals.total <= 0) continue

    const totals = results.flowRequirement.epcis.find((epci) => epci.code === epciTotals.epciCode)?.totals
    // Sans le détail de flux, compter le seul mal-logement casserait l'identité avec `results.total`.
    if (!totals) continue

    add('badHousing', epciTotals.total - epciTotals.totalFlux)
    add('demographic', totals.demographicEvolution)

    add('fluidity', Math.max(0, totals.shortTermVacantAccomodation))
    add('fluidityReleased', -Math.min(0, totals.shortTermVacantAccomodation))

    add('vacancyIncrease', Math.max(0, totals.longTermVacantAccomodation))
    add('vacancyRemobilised', -Math.min(0, totals.longTermVacantAccomodation))

    add('secondaryIncrease', Math.max(0, totals.secondaryResidenceAccomodationEvolution))
    add('secondaryDecrease', -Math.min(0, totals.secondaryResidenceAccomodationEvolution))

    add('disappearanceSurplus', Math.max(0, totals.renewalNeeds))
    add('appearanceSurplus', -Math.min(0, totals.renewalNeeds))
  }

  return { values, epciCounts }
}

/**
 * Termes qui se répartissent selon le signe d'une même grandeur : quand les deux sont alimentés,
 * c'est que des EPCI différents vont en sens contraire. La carte le dit alors explicitement.
 */
export const SIGNED_TERM_PAIRS: Array<[EstimationTermKey, EstimationTermKey]> = [
  ['fluidity', 'fluidityReleased'],
  ['vacancyIncrease', 'vacancyRemobilised'],
  ['secondaryIncrease', 'secondaryDecrease'],
  ['disappearanceSurplus', 'appearanceSurplus'],
]

/** Le terme partage-t-il sa grandeur d'origine avec son jumeau de signe opposé, sur des EPCI distincts ? */
export const isTermSplitAcrossEpcis = (key: EstimationTermKey, breakdown: EstimationBreakdown): boolean => {
  const pair = SIGNED_TERM_PAIRS.find(([increase, decrease]) => increase === key || decrease === key)
  if (!pair) return false
  const [increase, decrease] = pair
  return Math.round(breakdown.values[increase]) > 0 && Math.round(breakdown.values[decrease]) > 0
}

/**
 * Volume de logements créés par le renouvellement urbain au-delà des disparitions, dans la
 * convention signée de la page de résultats (valeur négative), et sur les seuls EPCI retenus par le
 * moteur. Exposée ici pour que la page et l'encart ne puissent pas en donner deux lectures.
 */
export const sumRenewalSurplus = (results: EstimationBreakdownInput): number =>
  results.flowRequirement.epcis
    .filter((epci) => isEpciCountedInTotal(results, epci.code))
    .reduce((sum, epci) => sum + Math.min(0, epci.totals.renewalNeeds), 0)

/**
 * Les grandeurs que la carte d'estimation et la page de résultats affichent toutes les deux, servies
 * par le même `NeedsCalculationService`. Elles sont exposées ici pour être vérifiables d'un seul
 * appel — voir `estimation-parity.spec.ts` côté API.
 *
 * Le mal-logement n'y figure pas : la page ne l'affiche pas au niveau du bassin, et son détail par
 * EPCI se vérifie directement contre `epcisTotals[].prepeakTotalStock`.
 */
export type EstimationParityReport = {
  label: string
  fromBreakdown: number
  fromResults: number
  matches: boolean
}[]

export const buildEstimationParityReport = (
  results: EstimationBreakdownInput & {
    total: number
    vacantAccomodation: number
    secondaryAccommodation: number
  },
): EstimationParityReport => {
  const { values } = buildEstimationBreakdown(results)

  const additionalNeed =
    values.demographic +
    values.badHousing +
    values.fluidity +
    values.vacancyIncrease +
    values.secondaryIncrease +
    values.disappearanceSurplus
  const optimisation = values.vacancyRemobilised + values.fluidityReleased + values.secondaryDecrease + values.appearanceSurplus

  // I) apparition de logements excédant les disparitions, par la fonction même qu'appelle la page.
  const appearanceSurplusFromResults = -sumRenewalSurplus(results)

  const rows = [
    { label: 'Constructions neuves', fromBreakdown: additionalNeed - optimisation, fromResults: results.total },
    {
      label: 'G — remobilisation vacants longue durée',
      fromBreakdown: values.vacancyRemobilised,
      fromResults: -results.vacantAccomodation,
    },
    {
      label: 'H — diminution résidences secondaires',
      fromBreakdown: values.secondaryDecrease,
      fromResults: -results.secondaryAccommodation,
    },
    { label: 'I — apparition excédant disparition', fromBreakdown: values.appearanceSurplus, fromResults: appearanceSurplusFromResults },
  ]

  return rows.map((row) => ({ ...row, matches: Math.round(row.fromBreakdown) === Math.round(row.fromResults) }))
}
