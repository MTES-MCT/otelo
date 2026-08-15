import { z } from 'zod'

export const ACTIVATION_STEPS = ['signup', 'access_granted', 'first_login', 'first_simulation', 'first_export', 'first_share'] as const

export const ACTIVATION_STEP_LABELS: Record<(typeof ACTIVATION_STEPS)[number], string> = {
  access_granted: 'Accès accordé',
  first_export: 'Premier export',
  first_login: 'Première connexion',
  first_share: 'Premier partage',
  first_simulation: 'Premier scénario',
  signup: 'Inscription',
}

export const ZActivationStep = z.object({
  step: z.enum(ACTIVATION_STEPS),
  label: z.string(),
  count: z.number(),
  /**
   * Étape de référence pour la conversion et le délai. Ce n'est PAS toujours l'étape
   * précédente dans la liste : `first_export` et `first_share` sont deux issues parallèles
   * du premier scénario, et se comparent donc toutes deux à `first_simulation`.
   * Les traiter en série produirait des taux de conversion supérieurs à 100 %.
   */
  comparedToStep: z.enum(ACTIVATION_STEPS).nullable(),
  /** Part des utilisateurs de `comparedToStep` ayant franchi celle-ci. `null` pour l'inscription. */
  conversionFrom: z.number().nullable(),
  /**
   * Délai médian depuis `comparedToStep`, en jours.
   * `null` pour l'inscription et pour `access_granted` : `users.hasAccess` est un booléen
   * sans date d'octroi, on ne peut donc en compter que le volume.
   */
  medianDaysFrom: z.number().nullable(),
})

export const ZRetentionCohort = z.object({
  /** Premier jour du mois d'inscription, au format YYYY-MM-01. */
  cohort: z.string(),
  signups: z.number(),
  /** Inscrits s'étant connectés au moins une fois. */
  activated: z.number(),
  retainedM1: z.number(),
  retainedM3: z.number(),
})

export const ZActivationStatistics = z.object({
  funnel: z.array(ZActivationStep),
  retention: z.array(ZRetentionCohort),
  /** Comptes créés n'ayant jamais ouvert de session : mesure la friction du mur d'accès. */
  neverConnected: z.number(),
  /** Comptes n'ayant ouvert qu'une seule session, jamais revenus. */
  singleConnection: z.number(),
  /**
   * Date de la plus ancienne connexion journalisée. Les cohortes antérieures apparaissent
   * comme jamais connectées : `login_events` n'existait pas, et `users.last_login_at` vaut
   * par défaut la date de création, ce qui ne permet pas de reconstituer l'historique.
   */
  loginTrackingStartedAt: z.date().nullable(),
})

export type TActivationStep = z.infer<typeof ZActivationStep>
export type TRetentionCohort = z.infer<typeof ZRetentionCohort>
export type TActivationStatistics = z.infer<typeof ZActivationStatistics>
