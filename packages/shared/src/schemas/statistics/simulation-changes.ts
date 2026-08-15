import { z } from 'zod'

/**
 * Actions journalisées sur une simulation.
 *
 * `scenario.updated` porte un diff champ par champ ; les autres décrivent un événement
 * de cycle de vie et n'en ont pas toujours.
 */
export const SIMULATION_CHANGE_ACTIONS = [
  'simulation.created',
  'simulation.renamed',
  'simulation.cloned',
  'simulation.actualized',
  'simulation.deleted',
  'scenario.updated',
  'share.enabled',
  'share.disabled',
] as const

export type SimulationChangeAction = (typeof SIMULATION_CHANGE_ACTIONS)[number]

export const SIMULATION_CHANGE_ACTION_LABELS: Record<SimulationChangeAction, string> = {
  'scenario.updated': 'Paramétrage modifié',
  'share.disabled': 'Partage désactivé',
  'share.enabled': 'Partage activé',
  'simulation.actualized': 'Actualisé sur un nouveau millésime',
  'simulation.cloned': 'Dupliqué',
  'simulation.created': 'Créé',
  'simulation.deleted': 'Supprimé',
  'simulation.renamed': 'Renommé',
}

/** Sévérité d'affichage, pour distinguer d'un coup d'œil une suppression d'un simple renommage. */
export const SIMULATION_CHANGE_ACTION_SEVERITY: Record<SimulationChangeAction, 'info' | 'success' | 'warning' | 'error'> = {
  'scenario.updated': 'info',
  'share.disabled': 'warning',
  'share.enabled': 'success',
  'simulation.actualized': 'success',
  'simulation.cloned': 'info',
  'simulation.created': 'success',
  'simulation.deleted': 'error',
  'simulation.renamed': 'info',
}

/**
 * Libellés métier des paramètres de scénario.
 *
 * Sans cette table, le journal afficherait `b13_taux_effort` : techniquement exact,
 * inexploitable pour qui relit l'historique d'un territoire.
 */
export const SCENARIO_FIELD_LABELS: Record<string, string> = {
  b1_horizon_resorption: 'Horizon de résorption du mal-logement',
  b2_scenario: 'Scénario de projection (Omphale)',
  b11_etablissement: 'Types d’établissement retenus (hors logement)',
  b11_fortune: 'Habitations de fortune',
  b11_hotel: 'Hôtel',
  b11_part_etablissement: 'Part des personnes en établissement (%)',
  b11_sa: 'Sans abri',
  b12_cohab_interg_subie: 'Cohabitation intergénérationnelle subie (%)',
  b12_heberg_particulier: 'Hébergement chez un particulier',
  b12_heberg_temporaire: 'Hébergement temporaire',
  b13_acc: 'Accédants à la propriété',
  b13_plp: 'Propriétaires et locataires du parc privé',
  b13_taux_effort: 'Taux d’effort (%)',
  b13_taux_reallocation: 'Taux de réallocation — inadéquation financière (%)',
  b14_confort: 'Critère de confort',
  b14_occupation: 'Statut d’occupation',
  b14_qualite: 'Critère de qualité',
  b14_taux_reallocation: 'Taux de réallocation — mauvaise qualité (%)',
  b15_loc_hors_hlm: 'Locataires hors HLM',
  b15_proprietaire: 'Propriétaires',
  b15_surocc: 'Niveau de suroccupation',
  b15_taux_reallocation: 'Taux de réallocation — suroccupation (%)',
  b17_motif: 'Motif de mobilité',
  isConfidential: 'Scénario confidentiel',
  millesime: 'Millésime des données',
  projection: 'Horizon de projection',
  source_b11: 'Source — hors logement',
  source_b14: 'Source — mauvaise qualité',
  source_b15: 'Source — suroccupation',
}

/** Libellés des taux par EPCI, préfixés du code EPCI concerné à l'affichage. */
export const EPCI_RATE_LABELS: Record<string, string> = {
  b2_tx_disparition: 'Taux de disparition',
  b2_tx_restructuration: 'Taux de restructuration',
  b2_tx_rs: 'Taux de résidences secondaires',
  b2_tx_vacance: 'Taux de vacance',
  b2_tx_vacance_courte: 'Taux de vacance courte durée',
  b2_tx_vacance_longue: 'Taux de vacance longue durée',
}

export const ZSimulationChangeEntry = z.object({
  /** Clé technique : nom du champ de scénario, ou `<codeEpci>.<champ>` pour un taux. */
  field: z.string(),
  label: z.string(),
  /** Code EPCI, renseigné uniquement pour les taux par territoire. */
  epciCode: z.string().nullable().optional(),
  before: z.unknown(),
  after: z.unknown(),
})

export const ZSimulationChange = z.object({
  id: z.string(),
  simulationId: z.string(),
  simulationName: z.string(),
  action: z.string(),
  actionLabel: z.string(),
  userName: z.string().nullable(),
  createdAt: z.date(),
  changes: z.array(ZSimulationChangeEntry),
})

export type TSimulationChangeEntry = z.infer<typeof ZSimulationChangeEntry>
export type TSimulationChange = z.infer<typeof ZSimulationChange>

/** Forme du champ `changes` en base (voir `SimulationChange.changes`). */
export type SimulationChangeSet = TSimulationChangeEntry[]

/** Libellé lisible d'un champ modifié, taux par EPCI compris. */
export function getChangeFieldLabel(field: string): string {
  const [maybeEpci, maybeRate] = field.split('.')

  if (maybeRate && EPCI_RATE_LABELS[maybeRate]) {
    return `${EPCI_RATE_LABELS[maybeRate]} — ${maybeEpci}`
  }

  return SCENARIO_FIELD_LABELS[field] ?? field
}
