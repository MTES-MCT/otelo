import { z } from 'zod'

export const ZConnectionsByMonth = z.object({
  /** Premier jour du mois, au format YYYY-MM-01. */
  month: z.string(),
  nbConnections: z.number(),
  activeUsers: z.number(),
  /** Durée cumulée des sessions du mois, en secondes. */
  totalSeconds: z.number(),
  avgSessionSeconds: z.number(),
})

export const ZConnectionsByUserType = z.object({
  /** `null` = type d'organisme non renseigné au moment de la connexion. */
  userType: z.string().nullable(),
  nbConnections: z.number(),
  activeUsers: z.number(),
  avgSessionSeconds: z.number(),
})

export const ZSharedSimulation = z.object({
  simulationId: z.string(),
  simulationName: z.string(),
  ownerType: z.string().nullable(),
  active: z.boolean(),
  createdAt: z.date(),
  viewCount: z.number(),
  lastViewedAt: z.date().nullable(),
})

export const ZAudienceStatistics = z.object({
  connections: z.object({
    total: z.number(),
    uniqueUsers: z.number(),
    byMonth: z.array(ZConnectionsByMonth),
    byUserType: z.array(ZConnectionsByUserType),
  }),
  connectedTime: z.object({
    totalSeconds: z.number(),
    avgSessionSeconds: z.number(),
  }),
  sharing: z.object({
    /** Liens créés sur la période. */
    linksCreated: z.number(),
    /** Liens actuellement actifs, toutes périodes confondues. */
    activeLinks: z.number(),
    /** Simulations créées sur la période, pour rapporter le partage au volume produit. */
    simulationsCreated: z.number(),
    activationRate: z.number(),
    /**
     * Consultations CUMULÉES depuis la création des liens créés sur la période.
     * `SimulationShareLink.viewCount` est un compteur, pas un journal : il ne peut pas
     * être borné dans le temps. Le champ `lastViewedAt` donne la fraîcheur.
     */
    totalViews: z.number(),
    neverViewedLinks: z.number(),
    topShared: z.array(ZSharedSimulation),
  }),
  /**
   * Date de la plus ancienne connexion journalisée. Toute analyse antérieure est
   * structurellement vide : `login_events` n'existait pas avant.
   */
  loginTrackingStartedAt: z.date().nullable(),
})

export type TConnectionsByMonth = z.infer<typeof ZConnectionsByMonth>
export type TConnectionsByUserType = z.infer<typeof ZConnectionsByUserType>
export type TSharedSimulation = z.infer<typeof ZSharedSimulation>
export type TAudienceStatistics = z.infer<typeof ZAudienceStatistics>
