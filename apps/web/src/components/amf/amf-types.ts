import { z } from 'zod'

// Types miroirs des schémas de l'API (`apps/api/src/amf/amf.schemas.ts`).
// Le web n'importe pas le paquet de l'API : toute évolution du contrat doit être reportée ici.

export type TAmfEpci = {
  code: string
  name: string
  fragileProjection: boolean
  baseYear: number
  horizon: number
  populationChanges: {
    haute: number
    central: number
    basse: number | null
  }
}

export type TAmfDemography = 'plus' | 'tendance' | 'moins'
export type TAmfVacancy = 'prioritaire' | 'parmi-autres' | 'non'
export type TAmfSecondaryResidences = 'neutre' | 'reguler' | 'developper'

export type TAmfAnswers = {
  epciCode: string
  demography: TAmfDemography
  vacancy: TAmfVacancy
  badHousing: boolean
  secondaryResidences: TAmfSecondaryResidences
}

export type TAmfCreateSimulationBody = TAmfAnswers & { email: string }

export type TAmfResult = {
  baseYear: number
  horizon: number
  /** Année du pic de ménages quand elle précède l'horizon, sinon `null`. Égale à `baseYear` : territoire déjà en baisse. */
  peakYear: number | null
  total: number
  annualAverage: number
  /** Contributions signées ; `null` quand le besoin est nul. */
  blocks: {
    population: number
    vacancy: number
    secondaryResidences: number
    badHousing: number
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
  contacts: TAmfSharedContact[]
}

/** Réponses en cours de saisie : chaque champ reste vide tant que la question n'a pas été répondue. */
export type TAmfDraftAnswers = {
  epci: TAmfEpci | null
  demography: TAmfDemography | null
  vacancy: TAmfVacancy | null
  badHousing: boolean | null
  secondaryResidences: TAmfSecondaryResidences | null
  email: string
}

export const AMF_STEPS = ['intro', 'epci', 'demography', 'vacancy', 'badHousing', 'secondaryResidences', 'email', 'results'] as const
export type TAmfStep = (typeof AMF_STEPS)[number]

/** Même règle que `z.email()` côté API : une adresse refusée par l'API l'est aussi ici. */
const ZAmfEmail = z.email()
export const isValidAmfEmail = (value: string): boolean => ZAmfEmail.safeParse(value).success
