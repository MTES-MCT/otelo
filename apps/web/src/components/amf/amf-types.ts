import { z } from 'zod'

// Types miroirs des schémas de l'API (`apps/api/src/amf/amf.schemas.ts`).
// Le web n'importe pas le paquet de l'API : toute évolution du contrat doit être reportée ici.

export type TAmfEpci = {
  code: string
  name: string
  fragileProjection: boolean
  baseYear: number
  horizon: number
  /** Population au recensement de l'année de base. */
  population: number | null
  /** Évolution de la population entre les deux derniers recensements, en fraction. */
  recentEvolution: { fromYear: number; toYear: number; rate: number } | null
  /** Population projetée à l'horizon, selon chaque hypothèse ; `basse` manque pour certains territoires. */
  projectedPopulation: {
    haute: number
    central: number
    basse: number | null
  }
  /** Part des résidences secondaires dans le parc, en fraction. */
  secondaryResidencesShare: number
  /** Nombre approché de résidences secondaires. */
  secondaryResidencesCount: number | null
  /** Logements vacants depuis au moins deux ans. */
  longTermVacancy: { count: number; year: number } | null
}

/** Commune saisie à la première étape, quand l'utilisateur ne cherche pas directement son EPCI. */
export type TAmfCommune = {
  name: string
  population: number | null
}

export type TAmfDemography = 'plus' | 'tendance' | 'moins'
export type TAmfVacancy = 'prioritaire' | 'parmi-autres' | 'non'
export type TAmfSecondaryResidences = 'hausse' | 'stable' | 'maitrise' | 'recuperation'

export type TAmfAnswers = {
  epciCode: string
  demography: TAmfDemography
  vacancy: TAmfVacancy
  badHousing: boolean
  secondaryResidences: TAmfSecondaryResidences
}

/** L'e-mail se renseigne après les résultats, avec les contacts : il n'est pas envoyé à la création. */
export type TAmfCreateSimulationBody = TAmfAnswers & { email?: string }

/** Fourchette annuelle arrondie entre la variante basse et la variante haute ; une contribution négative a ses deux bornes ≤ 0. */
export type TAmfRange = {
  min: number
  max: number
}

export type TAmfResult = {
  baseYear: number
  horizon: number
  /** Logements à construire par an ; `null` quand aucun besoin supplémentaire. */
  annual: TAmfRange | null
  /** Contributions annuelles ; `null` quand aucun besoin supplémentaire. */
  contributions: {
    /** Signée : négative quand la baisse du nombre de ménages libère des logements. */
    households: TAmfRange | null
    badHousing: TAmfRange | null
    fluidity: number | null
    /** Bornes positives : logements en moins à construire. */
    vacancyRemobilised: TAmfRange | null
    /** Signée. */
    secondaryResidences: TAmfRange | null
  } | null
}

export type TAmfCreateSimulationResponse = {
  leadId: string
  result: TAmfResult
}

export type TAmfSharedContact = {
  role: string
  email: string
}

export type TAmfShareContactsBody = {
  /** E-mail de la personne ayant répondu au questionnaire. */
  email: string
  contacts: TAmfSharedContact[]
}

/** Réponses en cours de saisie : chaque champ reste vide tant que la question n'a pas été répondue. */
export type TAmfDraftAnswers = {
  epci: TAmfEpci | null
  commune: TAmfCommune | null
  demography: TAmfDemography | null
  vacancy: TAmfVacancy | null
  badHousing: boolean | null
  secondaryResidences: TAmfSecondaryResidences | null
}

export const AMF_STEPS = ['intro', 'epci', 'demography', 'vacancy', 'secondaryResidences', 'badHousing', 'results'] as const
export type TAmfStep = (typeof AMF_STEPS)[number]

/** Même règle que `z.email()` côté API : une adresse refusée par l'API l'est aussi ici. */
const ZAmfEmail = z.email()
export const isValidAmfEmail = (value: string): boolean => ZAmfEmail.safeParse(value).success
