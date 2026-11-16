import { z } from 'zod'

import { ZTargetReduction } from './impact-statistics'

/** Statut d'un EPCI sur la page publique : simulé, ou simulé puis exporté. */
export const PUBLIC_EPCI_STATUSES = ['SIMULATED', 'EXPORTED'] as const

export type TPublicEpciStatus = (typeof PUBLIC_EPCI_STATUSES)[number]

/** Types de documents d'urbanisme exposés publiquement (hors « aucun » et « non renseigné »). */
export const PUBLIC_PLANNING_DOCUMENT_TYPES = ['PLH_PLUI', 'SCOT', 'AUTRES'] as const

export type TPublicPlanningDocumentType = (typeof PUBLIC_PLANNING_DOCUMENT_TYPES)[number]

export const ZPublicStatistics = z.strictObject({
  /** Date de génération, au format ISO. */
  generatedAt: z.string(),
  keyFigures: z.strictObject({
    epcisWithSimulation: z.number(),
    epcisWithExport: z.number(),
    coveredPopulation: z.number(),
    /** Part de la population couverte, de 0 à 100, avec une décimale. */
    coveredPopulationShare: z.number(),
    planningDocuments: z.number(),
    engagedDepartments: z.number(),
    totalDepartments: z.number(),
    /** Comptes de collectivités (EPCI, communes, syndicats de SCoT…) dont la demande d'accès a été acceptée. */
    engagedLocalAuthorityAccounts: z.number(),
  }),
  targetReductions: z.array(ZTargetReduction),
  planningDocumentsByType: z.array(
    z.strictObject({
      key: z.enum(PUBLIC_PLANNING_DOCUMENT_TYPES),
      count: z.number(),
    }),
  ),
  monthly: z.array(
    z.strictObject({
      /** Mois au format YYYY-MM. */
      month: z.string(),
      simulations: z.number(),
      exports: z.number(),
      activeEpcis: z.number(),
    }),
  ),
  epcis: z.array(
    z.strictObject({
      code: z.string(),
      name: z.string(),
      department: z.string().nullable(),
      region: z.string(),
      status: z.enum(PUBLIC_EPCI_STATUSES),
    }),
  ),
})

export type TPublicStatistics = z.infer<typeof ZPublicStatistics>
