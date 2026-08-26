import { BASE_YEAR, SCENARIO_COLUMNS } from './projection-sheets.config'

/**
 * Une ligne prête à être insérée : la clé, puis les 9 valeurs de scénario dans l'ordre de
 * `SCENARIO_COLUMNS`.
 */
export type ProjectionMeasureRow = {
  zoneCode: string
  year: number
  /** Colonne `AGE` de la feuille `Population_age_sexe`, absente ailleurs. */
  age: number | null
  /** Valeur de la dimension dépliée (sexe, tranche d'âge, typologie), absente sur les totaux. */
  dimensionValue: string | null
  values: (number | null)[]
}

const KEY_SEPARATOR = '|'

/**
 * Fusionne les doublons de clé sur l'année de recensement.
 *
 * Deux bassins de Dordogne (`R75_24-1_23`, `R75_24-3_23`) portent **deux** lignes pour 2018 :
 * l'une marquée `ind_robust = 0` ne renseigne que les colonnes « population basse », l'autre
 * `ind_robust = 1` ne renseigne que « central » et « population haute ». Au-delà de 2018, les
 * colonnes « population basse » sont vides : le scénario n'est pas projeté pour ces bassins.
 * Ce sont les seuls doublons des deux classeurs (216 lignes au total).
 *
 * Insérées telles quelles, ces deux lignes violeraient la clé primaire ; il faut les recomposer
 * en une ligne 2018 complète, ce que fait la fusion par COALESCE ci-dessous. Elle est
 * indépendante de l'ordre d'arrivée et ne retient en mémoire que l'année de recensement — au pire
 * 561 zones x 100 âges x 2 sexes pour `Population_age_sexe`.
 */
export class ProjectionRowMerger {
  private readonly baseYearRows = new Map<string, ProjectionMeasureRow>()
  readonly warnings: string[] = []

  /**
   * Soumet une ligne. Renvoie la ligne si elle peut partir immédiatement à l'insertion, `null` si
   * elle est mise en attente de fusion — appeler `drain()` en fin de feuille pour la récupérer.
   */
  add(row: ProjectionMeasureRow): ProjectionMeasureRow | null {
    if (row.year !== BASE_YEAR) {
      return row
    }

    const key = [row.zoneCode, row.age ?? '', row.dimensionValue ?? ''].join(KEY_SEPARATOR)
    const existing = this.baseYearRows.get(key)
    if (existing === undefined) {
      this.baseYearRows.set(key, row)
      return null
    }

    for (let i = 0; i < existing.values.length; i++) {
      const kept = existing.values[i]
      const incoming = row.values[i] ?? null
      if (kept === null) {
        existing.values[i] = incoming
        continue
      }
      if (incoming !== null && incoming !== kept) {
        this.warnings.push(
          `Doublon ${BASE_YEAR} divergent sur ${key} colonne ${SCENARIO_COLUMNS[i]} : ${kept} conservé, ${incoming} ignoré`,
        )
      }
    }

    return null
  }

  /** Vide le tampon de l'année de recensement. À appeler une fois la feuille entièrement lue. */
  drain(): ProjectionMeasureRow[] {
    const rows = [...this.baseYearRows.values()]
    this.baseYearRows.clear()
    return rows
  }
}

export type ProjectionZoneStats = {
  zoneCode: string
  isRobust: boolean
  firstYear: number
  lastYear: number
}

/**
 * Accumule les métadonnées de chargement par zone.
 *
 * `ind_robust = 0` ne signale pas une ligne douteuse mais une **zone non projetée** : la source
 * n'en porte alors qu'une seule ligne, l'année 2018, dont la valeur observée est recopiée à
 * l'identique sur les 9 scénarios. 36 zones sont dans ce cas (35 bassins et l'EPCI `200073260`).
 *
 * Les deux bassins de Dordogne font exception : ils portent une ligne `ind_robust = 0` *et* des
 * lignes projetées. Le OU logique les classe donc robustes, ce qui est le comportement voulu — ils
 * sont bien projetés, c'est un seul de leurs scénarios qui manque, information portée par la
 * nullité des colonnes `pb_*`.
 */
export class ProjectionZoneStatsAccumulator {
  private readonly stats = new Map<string, ProjectionZoneStats>()

  record(zoneCode: string, year: number, isRobust: boolean): void {
    const existing = this.stats.get(zoneCode)
    if (existing === undefined) {
      this.stats.set(zoneCode, { zoneCode, isRobust, firstYear: year, lastYear: year })
      return
    }
    existing.isRobust = existing.isRobust || isRobust
    existing.firstYear = Math.min(existing.firstYear, year)
    existing.lastYear = Math.max(existing.lastYear, year)
  }

  values(): ProjectionZoneStats[] {
    return [...this.stats.values()]
  }
}
