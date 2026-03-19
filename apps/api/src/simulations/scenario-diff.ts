export interface ScenarioChange {
  field: string
  label: string
  category: string
  before: unknown
  after: unknown
}

export interface EpciChange {
  epciCode: string
  changes: Array<{ field: string; label: string; before: number; after: number }>
}

export interface ScenarioDiff {
  type: 'scenario_diff'
  changes: ScenarioChange[]
  epciChanges?: EpciChange[]
}

const FIELD_LABELS: Record<string, { label: string; category: string }> = {
  b11_sa: { label: 'Sans abri', category: 'Hors logement' },
  b11_fortune: { label: 'Fortune de mer', category: 'Hors logement' },
  b11_hotel: { label: 'Hôtel', category: 'Hors logement' },
  b11_etablissement: { label: "Types d'établissements", category: 'Hors logement' },
  b11_part_etablissement: { label: 'Part établissements (%)', category: 'Hors logement' },
  source_b11: { label: 'Source', category: 'Hors logement' },
  b12_cohab_interg_subie: { label: 'Cohabitation intergénérationnelle subie (%)', category: 'Hébergés' },
  b12_heberg_particulier: { label: 'Hébergés chez un particulier', category: 'Hébergés' },
  b12_heberg_temporaire: { label: 'Hébergement temporaire', category: 'Hébergés' },
  b13_acc: { label: 'Accédants', category: 'Inadéquation financière' },
  b13_plp: { label: 'Bénéficiaires PLP', category: 'Inadéquation financière' },
  b13_taux_effort: { label: "Taux d'effort (%)", category: 'Inadéquation financière' },
  b13_taux_reallocation: { label: 'Taux de réallocation (%)', category: 'Inadéquation financière' },
  b14_confort: { label: 'Confort', category: 'Mauvaise qualité' },
  b14_occupation: { label: 'Occupation', category: 'Mauvaise qualité' },
  b14_taux_reallocation: { label: 'Taux de réallocation (%)', category: 'Mauvaise qualité' },
  source_b14: { label: 'Source', category: 'Mauvaise qualité' },
  b15_proprietaire: { label: 'Propriétaires', category: 'Suroccupation' },
  b15_loc_hors_hlm: { label: 'Locataires hors HLM', category: 'Suroccupation' },
  b15_surocc: { label: 'Type de suroccupation', category: 'Suroccupation' },
  b15_taux_reallocation: { label: 'Taux de réallocation (%)', category: 'Suroccupation' },
  source_b15: { label: 'Source', category: 'Suroccupation' },
  b1_horizon_resorption: { label: 'Horizon de résorption', category: 'Horizon' },
  b2_scenario: { label: 'Scénario démographique', category: 'Démographie' },
  projection: { label: 'Projection', category: 'Démographie' },
}

const EPCI_FIELD_LABELS: Record<string, string> = {
  b2_tx_rs: 'Taux résidences secondaires',
  b2_tx_vacance_longue: 'Taux vacance longue durée',
  b2_tx_vacance_courte: 'Taux vacance courte durée',
  b2_tx_disparition: 'Taux disparition',
  b2_tx_restructuration: 'Taux restructuration',
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a == null && b == null) return true
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) <= 1e-9
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return JSON.stringify([...a].sort()) === JSON.stringify([...b].sort())
  }
  return false
}

export function computeScenarioDiff(oldScenario: Record<string, unknown>, newData: Record<string, unknown>): ScenarioDiff | null {
  const changes: ScenarioChange[] = []

  for (const field of Object.keys(FIELD_LABELS)) {
    if (!(field in newData)) continue
    const oldVal = oldScenario[field]
    const newVal = newData[field]
    if (!valuesEqual(oldVal, newVal)) {
      const { label, category } = FIELD_LABELS[field]
      changes.push({ field, label, category, before: oldVal, after: newVal })
    }
  }

  // Compare EPCI scenarios
  const epciChanges: EpciChange[] = []
  const newEpcis = newData.epciScenarios as Record<string, Record<string, number>> | undefined
  const oldEpcis = oldScenario.epciScenarios as Array<{ epciCode: string } & Record<string, unknown>> | undefined

  if (newEpcis && oldEpcis) {
    for (const [epciCode, newEpciData] of Object.entries(newEpcis)) {
      const oldEpci = oldEpcis.find((e) => e.epciCode === epciCode)
      if (!oldEpci) continue

      const epciFieldChanges: EpciChange['changes'] = []
      for (const [field, label] of Object.entries(EPCI_FIELD_LABELS)) {
        const oldVal = oldEpci[field] as number
        const newVal = newEpciData[field] as number
        if (newVal !== undefined && !valuesEqual(oldVal, newVal)) {
          epciFieldChanges.push({ field, label, before: oldVal, after: newVal })
        }
      }

      if (epciFieldChanges.length > 0) {
        epciChanges.push({ epciCode, changes: epciFieldChanges })
      }
    }
  }

  if (changes.length === 0 && epciChanges.length === 0) return null

  return {
    type: 'scenario_diff',
    changes,
    ...(epciChanges.length > 0 ? { epciChanges } : {}),
  }
}
