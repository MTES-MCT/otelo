import { z } from 'zod'

/**
 * Type de document d'urbanisme déclaré sur un dossier d'études, complété de deux cas
 * qui ne sont pas des documents : l'utilisateur a répondu « non », ou la question
 * n'a pas été posée (dossiers antérieurs à son introduction).
 */
export const IMPACT_PLANNING_DOCUMENT_KEYS = ['PLH_PLUI', 'SCOT', 'AUTRES', 'AUCUN', 'NON_RENSEIGNE'] as const

export type TImpactPlanningDocumentKey = (typeof IMPACT_PLANNING_DOCUMENT_KEYS)[number]

export const IMPACT_PLANNING_DOCUMENT_LABELS: Record<TImpactPlanningDocumentKey, string> = {
  PLH_PLUI: 'PLH / PLUi-H',
  SCOT: 'SCoT',
  AUTRES: 'Autre document',
  AUCUN: 'Hors document',
  NON_RENSEIGNE: 'Non renseigné',
}

/** Étapes proposées dans le formulaire de demande de PowerPoint, dont les deux qui engagent une décision. */
export const IMPACT_DECISION_NEXT_STEPS = ['Présentation aux élus', 'Prise de décision'] as const

/**
 * Taux sur lesquels l'utilisateur fixe un objectif, étape par étape du paramétrage.
 * Le renouvellement urbain en compte deux : restructuration et disparition sont saisies séparément.
 */
export const TARGET_REDUCTION_DOMAINS = ['longTermVacancy', 'secondaryResidences', 'restructuring', 'disappearance'] as const

export type TTargetReductionDomain = (typeof TARGET_REDUCTION_DOMAINS)[number]

export const TARGET_REDUCTION_LABELS: Record<TTargetReductionDomain, string> = {
  longTermVacancy: 'Vacance longue durée',
  secondaryResidences: 'Résidences secondaires',
  restructuring: 'Restructuration',
  disappearance: 'Disparition',
}

export const ZTargetReduction = z.object({
  domain: z.enum(TARGET_REDUCTION_DOMAINS),
  /**
   * Réduction en pourcentage du taux observé : 15 = taux cible inférieur de 15 % au taux
   * observé. Négative quand l'objectif est une hausse. Moyenne des scénarios, chacun
   * étant lui-même la moyenne de ses EPCI.
   */
  average: z.number().nullable(),
  median: z.number().nullable(),
  /** Scénarios pour lesquels la réduction est calculable (taux observé non nul). */
  scenarios: z.number(),
})

const ZLabelCount = z.object({
  label: z.string(),
  count: z.number(),
})

export const ZPlanningDocumentUsage = z.object({
  documentType: z.enum(IMPACT_PLANNING_DOCUMENT_KEYS),
  dossiers: z.number(),
  simulations: z.number(),
  avgSimulationsPerDossier: z.number(),
  avgEpcisPerDossier: z.number(),
  /** Part des dossiers dont au moins un scénario a été exporté (PowerPoint ou Excel). */
  exportRate: z.number(),
  /** Délai médian, en jours, entre la création du dossier et son premier export. */
  medianDaysToExport: z.number().nullable(),
})

export const ZPlanningDocumentByMonth = z.object({
  /** Premier jour du mois, au format YYYY-MM-01. */
  month: z.string(),
  PLH_PLUI: z.number(),
  SCOT: z.number(),
  AUTRES: z.number(),
  AUCUN: z.number(),
  NON_RENSEIGNE: z.number(),
})

export const ZPlanningDocumentByUserType = z.object({
  userType: z.string().nullable(),
  documentType: z.enum(IMPACT_PLANNING_DOCUMENT_KEYS),
  dossiers: z.number(),
})

/**
 * Termes du besoin annualisés, dans l'ordre de lecture de la décomposition du moteur.
 * Leur somme vaut les constructions neuves annuelles : les termes négatifs sont des
 * logements que le parc existant fournit (remobilisation, apparitions nettes).
 */
export const NEED_COMPONENTS = ['demographic', 'badHousing', 'renewal', 'fluidity', 'longTermVacancy', 'secondaryResidences'] as const

export type TNeedComponent = (typeof NEED_COMPONENTS)[number]

export const NEED_COMPONENT_LABELS: Record<TNeedComponent, string> = {
  demographic: 'Évolution démographique',
  badHousing: 'Mal-logement',
  renewal: 'Renouvellement urbain',
  fluidity: 'Fluidité du parc (vacance courte)',
  longTermVacancy: 'Vacance longue durée',
  secondaryResidences: 'Résidences secondaires',
}

export const ZNeedsByYear = z.object({
  year: z.number(),
  /** Territoires dont un scénario retenu couvre l'année : les horizons diffèrent, la série se lit avec ce nombre. */
  territories: z.number(),
  /** Série annuelle du moteur (`flowDataByYear.housingNeeds`), mal-logement et renouvellement compris. */
  newConstruction: z.number(),
  /** Logements vacants de longue durée remobilisés, annualisés sur la période du scénario. */
  vacancyRemobilised: z.number(),
  /** Résidences secondaires remises sur le marché, annualisées. */
  secondaryRemobilised: z.number(),
  /** Solde disparitions − apparitions, annualisé ; négatif quand le parc se renouvelle de lui-même. */
  renewal: z.number(),
  /** Mal-logés pris en compte jusqu'à l'horizon (ou au pic), annualisés. */
  badHousing: z.number(),
})

export const ZTerritoryNeeds = z.object({
  territories: z.number(),
  scenarios: z.number(),
  byYear: z.array(ZNeedsByYear),
  /** Besoins annuels par terme, sommés sur les territoires. */
  breakdown: z.array(z.object({ component: z.enum(NEED_COMPONENTS), perYear: z.number() })),
  byRegion: z.array(z.object({ label: z.string(), territories: z.number(), newConstructionPerYear: z.number() })),
})

export const ZSharedEpci = z.object({
  epciCode: z.string(),
  epciName: z.string(),
  regionName: z.string().nullable(),
  userTypes: z.array(z.string()),
  users: z.number(),
})

export const ZImpactStatistics = z.object({
  settings: z.object({
    /** Scénarios des simulations créées sur la période : dénominateur de toute la section. */
    scenarios: z.number(),
    /** Hypothèse de population (Central / PH / PB) × décohabitation (C / H / B). */
    byOmphale: z.array(z.object({ population: z.string(), decohabitation: z.string(), count: z.number() })),
    byHorizon: z.array(ZLabelCount),
    byMillesime: z.array(ZLabelCount),
    /** Réduction retenue par rapport au taux observé, une entrée par domaine, dans l'ordre de `TARGET_REDUCTION_DOMAINS`. */
    targetReductions: z.array(ZTargetReduction),
    /** Scénarios dont au moins un paramètre de mal-logement s'écarte de la valeur par défaut. */
    customizedBadHousing: z.number(),
    badHousingSources: z.array(z.object({ parameter: z.string(), value: z.string(), count: z.number() })),
    customProjections: z.object({ scenarios: z.number(), users: z.number() }),
    depth: z.object({
      /** Simulations dont le paramétrage a été modifié au moins une fois après création. */
      modifiedSimulations: z.number(),
      avgModificationsPerSimulation: z.number(),
      clones: z.number(),
      actualizations: z.number(),
      dossiers: z.number(),
      avgSimulationsPerDossier: z.number(),
      /** Dossiers contenant au moins deux scénarios : la comparaison est possible. */
      dossiersWithSeveralSimulations: z.number(),
    }),
  }),
  planningDocuments: z.object({
    byType: z.array(ZPlanningDocumentUsage),
    byMonth: z.array(ZPlanningDocumentByMonth),
    byUserType: z.array(ZPlanningDocumentByUserType),
  }),
  impact: z.object({
    /** Demandes de PowerPoint : une demande peut porter plusieurs scénarios. */
    powerpointRequests: z.number(),
    byNextStep: z.array(ZLabelCount),
    byExportDocumentType: z.array(ZLabelCount),
    /** Part des demandes destinées aux élus ou à une prise de décision. */
    decisionRate: z.number(),
    exportedEpcis: z.number(),
    totalEpcis: z.number(),
    /** Population du dernier recensement disponible, sommée sur les EPCI couverts. */
    coveredPopulation: z.number(),
    totalPopulation: z.number(),
    /**
     * Besoins portés par les territoires, tous scénarios depuis le lancement. Par EPCI :
     * moyenne des scénarios privilégiés des demandes d'export s'il y en a, sinon moyenne de
     * toutes ses simulations. `exported` se limite aux EPCI ayant fait l'objet d'un export.
     */
    territoryNeeds: z.object({ exported: ZTerritoryNeeds, all: ZTerritoryNeeds }),
    sharing: z.object({ activeLinks: z.number(), totalViews: z.number(), viewedLinks: z.number() }),
    sharedEpcis: z.object({ count: z.number(), top: z.array(ZSharedEpci) }),
    longTermUse: z.object({
      /** Dossiers retravaillés sur la période plus de 90 jours après leur création. */
      resumedDossiers: z.number(),
      activeDossiers: z.number(),
    }),
  }),
  perceivedUtility: z.object({
    responses: z.number(),
    averageRating: z.number().nullable(),
    distribution: z.array(z.object({ rating: z.number(), count: z.number() })),
    withComment: z.number(),
    /** Utilisateurs ayant reporté la question : sollicités, mais sans réponse. */
    snoozed: z.number(),
  }),
})

export type TTargetReduction = z.infer<typeof ZTargetReduction>
export type TPlanningDocumentUsage = z.infer<typeof ZPlanningDocumentUsage>
export type TPlanningDocumentByMonth = z.infer<typeof ZPlanningDocumentByMonth>
export type TPlanningDocumentByUserType = z.infer<typeof ZPlanningDocumentByUserType>
export type TNeedsByYear = z.infer<typeof ZNeedsByYear>
export type TTerritoryNeeds = z.infer<typeof ZTerritoryNeeds>
export type TSharedEpci = z.infer<typeof ZSharedEpci>
export type TImpactStatistics = z.infer<typeof ZImpactStatistics>
