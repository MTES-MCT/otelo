import { ALL_EPCIS_KEY } from '@shared'

type ScenarioRow<K extends string> = { year: number } & { [P in K]: number | null }

type EvolutionEntry<K extends string> = {
  data: ScenarioRow<K>[]
  metadata: { max: number; min: number }
}

/**
 * Agrège les séries de projection de plusieurs EPCI en une seule, sous la clé `ALL_EPCIS_KEY`.
 *
 * Deux règles gouvernent l'agrégat, et toutes deux préfèrent l'absence de donnée à une donnée fausse :
 *
 * - **Années** : seules celles couvertes par *tous* les EPCI sont retenues. Une union produirait une
 *   somme partielle sur les années incomplètes, indiscernable d'une vraie baisse du territoire.
 * - **Valeurs** : un scénario absent chez un seul EPCI (certains n'ont pas de projection « basse »)
 *   rend l'agrégat `null` pour cette année. Sommer en traitant l'absence comme un zéro ferait
 *   « rétrécir » le territoire sans le signaler.
 *
 * Les bornes `metadata` sont recalculées sur les valeurs agrégées non nulles : elles cadrent l'axe
 * des ordonnées, et des `null` comptés comme zéros y écraseraient toutes les courbes.
 *
 * Renvoie `null` si aucune valeur exploitable ne subsiste — l'appelant omet alors la clé plutôt que
 * de sérialiser des bornes infinies.
 */
export const aggregateAcrossEpcis = <K extends string>(
  byEpci: Record<string, EvolutionEntry<K>>,
  scenarioKeys: readonly K[],
): EvolutionEntry<K> | null => {
  const entries = Object.entries(byEpci).filter(([code]) => code !== ALL_EPCIS_KEY)
  if (entries.length === 0) return null

  // Indexation par année en amont : la recherche linéaire dans chaque série serait quadratique.
  const rowsByYearPerEpci = entries.map(([, { data }]) => new Map(data.map((row) => [row.year, row])))

  const sharedYears = [...rowsByYearPerEpci[0].keys()]
    .filter((year) => rowsByYearPerEpci.every((rows) => rows.has(year)))
    .sort((a, b) => a - b)

  let min = Infinity
  let max = -Infinity

  const data = sharedYears.map((year) => {
    const row = { year } as ScenarioRow<K>

    scenarioKeys.forEach((key) => {
      let total = 0
      for (const rows of rowsByYearPerEpci) {
        const value = rows.get(year)?.[key]
        if (value === null || value === undefined) {
          total = Number.NaN
          break
        }
        total += value
      }

      if (Number.isNaN(total)) {
        row[key] = null as ScenarioRow<K>[K]
        return
      }

      row[key] = total as ScenarioRow<K>[K]
      min = Math.min(min, total)
      max = Math.max(max, total)
    })

    return row
  })

  if (!Number.isFinite(min) || !Number.isFinite(max)) return null

  return { data, metadata: { max, min } }
}
